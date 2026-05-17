import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CreateCitaDTO {
  fecha: string;
  hora: string;
  motivo: string;
  tipoCitaId: number;
  pacienteId: number;
  psicologoId: number;
  precio: number;
  divisaId: number; // Nuevo requerimiento financiero
  metodoPagoId: number;
  bancoId?: number; // Opcional, requerido si no es efectivo
  numeroReferencia?: string; // Opcional, requerido si no es efectivo
  direccion: {
    municipioId: number; // Catálogo geográfico
    barrio: string;
    calle?: string;
  };
}

interface UpdateCitaDTO extends CreateCitaDTO {}

// --- FUNCIÓN HELPER ---
const verificarDisponibilidad = async (
  psicologoId: number, 
  fecha: Date, 
  horaUTC: Date, 
  citaIdExcluir?: number
) => {
  // Construimos el objeto dinámicamente
  const whereClause: any = {
    ID_Psicologo: psicologoId,
    FechaCita: fecha, 
    ID_EstadoCita: { not: 3 }
  };

  if (citaIdExcluir) {
    whereClause.ID_Cita = { not: citaIdExcluir };
  }

  const citasDelDia = await prisma.cita.findMany({ where: whereClause });

  const conflicto = citasDelDia.find(c => {
    const horaDb = new Date(c.HoraCita); 
    const horaNueva = new Date(horaUTC);
    
    return horaDb.getUTCHours() === horaNueva.getUTCHours() &&
           horaDb.getUTCMinutes() === horaNueva.getUTCMinutes();
  });

  if (conflicto) {
    throw new Error('El psicólogo ya tiene una cita agendada en este horario.');
  }
};

export const CitaService = {
  
  getAll: async () => {
    const citas = await prisma.cita.findMany({
      include: {
        Paciente: true, 
        Psicologo: true,
        TipoDeCita: true,
        EstadoCita: true,
        Recibo: { include: { MetodoPago: true, Divisa: true, Banco: true } }, // Nueva estructura financiera
        Direccion: { include: { Municipio: { include: { Departamento: true } } } }, // Nueva estructura geográfica
        MotivoCancelacion: true,
        Sesion: true // Agregado para saber fácilmente si ya tiene sesión iniciada
      },
      orderBy: [
        { FechaCita: 'asc' }, 
        { HoraCita: 'asc' }
      ]
    });
    
    const contadores: Record<number, number> = {};

    const citasNumeradas = citas.map(cita => {
      if (cita.ID_EstadoCita === 3) {
        return { ...cita, NumeroSesion: null };
      }
      const pid = cita.ID_Paciente;
      if (!contadores[pid]) contadores[pid] = 0;
      contadores[pid]++;

      return { ...cita, NumeroSesion: contadores[pid] };
    });

    return citasNumeradas.reverse();
  },

  getCatalogos: async () => {
    const [tiposCita, estadosCita, metodosPago, bancos, divisas] = await Promise.all([
      prisma.tipoDeCita.findMany(),
      prisma.estadoCita.findMany(),
      prisma.metodoPago.findMany(),
      prisma.banco.findMany({ where: { Activo: true } }), // Solo bancos activos
      prisma.divisa.findMany()
    ]);
    return { tiposCita, estadosCita, metodosPago, bancos, divisas };
  },

  create: async (data: CreateCitaDTO) => {
    // 1. Validaciones de Entidad
    const pacienteCheck = await prisma.paciente.findUnique({
      where: { ID_Paciente: data.pacienteId },
      select: { Activo: true, Nombre: true, Apellido: true }
    });
    if (!pacienteCheck) throw new Error('El paciente seleccionado no existe.');
    if (!pacienteCheck.Activo) {
      throw new Error(`No se puede agendar: El paciente ${pacienteCheck.Nombre} ${pacienteCheck.Apellido} está INACTIVO.`);
    }

    const psicologoCheck = await prisma.psicologo.findUnique({
      where: { ID_Psicologo: data.psicologoId },
      select: { Activo: true, Nombre: true, Apellido: true }
    });
    if (!psicologoCheck) throw new Error('Psicólogo no encontrado.');
    if (!psicologoCheck.Activo) {
      throw new Error(`No disponible: El Dr. ${psicologoCheck.Apellido} está marcado como INACTIVO.`);
    }

    // Validación Financiera: Si no es efectivo (ID = 1), exige banco y referencia
    if (data.metodoPagoId !== 1 && (!data.bancoId || !data.numeroReferencia)) {
        throw new Error('Para transferencias o pagos con tarjeta, debe seleccionar un Banco e ingresar el Número de Referencia.');
    }

    // Se extrae y se garantiza que sea un número (con fallback a 0)
    const timeParts = data.hora.split(':').map(Number);
    const horas = timeParts[0] ?? 0;
    const minutos = timeParts[1] ?? 0;
    
    if (isNaN(horas) || isNaN(minutos)) throw new Error('Hora inválida');

    // 2. Lógica de Fechas
    const fechaIsoString = `${data.fecha}T${data.hora}:00-06:00`; 
    const fechaValidacion = new Date(fechaIsoString);
    const ahora = new Date();

    if (fechaValidacion < ahora) {
        throw new Error("No es posible agendar citas en una fecha u hora que ya pasó.");
    }

    const fechaParaGuardar = new Date(data.fecha);
    fechaParaGuardar.setUTCHours(horas, minutos, 0, 0);
    const fechaSoloDia = new Date(data.fecha);

    // 3. Disponibilidad
    await verificarDisponibilidad(data.psicologoId, fechaSoloDia, fechaParaGuardar);

    const fechaHoraActual = new Date();
    const horaPagoNica = new Date(fechaHoraActual.getTime() - (6 * 60 * 60 * 1000));

    return await prisma.$transaction(async (tx) => {
      // 1. Crear Dirección (con catálogo de municipios)
      const direccionClinica = await tx.direccion.create({
        data: { 
          Pais: 'Nicaragua', // Asumimos país fijo por ahora
          ID_Municipio: data.direccion.municipioId,
          Barrio: data.direccion.barrio, 
          Calle: data.direccion.calle || null
        }
      });

      // 2. Crear Cita
      const citaCreada = await tx.cita.create({
        data: {
          FechaCita: fechaSoloDia,
          HoraCita: fechaParaGuardar,
          MotivoConsulta: data.motivo,
          ID_TipoCita: data.tipoCitaId,
          ID_EstadoCita: 1, 
          ID_Paciente: data.pacienteId,
          ID_Psicologo: data.psicologoId,
          ID_Direccion: direccionClinica.ID_Direccion // Atributo renombrado en DB
        }
      });

      // 3. Crear Recibo (Reemplaza a Factura y DetalleFactura)
      // 3. Crear Recibo
      const reciboCreado = await tx.recibo.create({
        data: {
          ID_Cita: citaCreada.ID_Cita,
          ID_Divisa: data.divisaId,
          ID_MetodoPago: data.metodoPagoId,
          FechaDePago: fechaHoraActual,
          HoraDePago: horaPagoNica,
          MontoTotal: data.precio,
          Observacion: 'Pago registrado al agendar cita',
          Tasa_Cambio: 1.0000,
          // Usamos ?? null para garantizar que si viene undefined, se pase a null
          ID_Banco: data.metodoPagoId !== 1 ? (data.bancoId ?? null) : null,
          Numero_Referencia: data.metodoPagoId !== 1 ? (data.numeroReferencia ?? null) : null
        }
      });
      
      return { cita: citaCreada, recibo: reciboCreado };
    });
  },

  update: async (id: number, data: UpdateCitaDTO) => {
    const pacienteCheck = await prisma.paciente.findUnique({ where: { ID_Paciente: data.pacienteId }, select: { Activo: true } });
    if (pacienteCheck && !pacienteCheck.Activo) throw new Error('No se puede asignar esta cita a un paciente INACTIVO.');

    const psicologoCheck = await prisma.psicologo.findUnique({ where: { ID_Psicologo: data.psicologoId }, select: { Activo: true } });
    if (psicologoCheck && !psicologoCheck.Activo) throw new Error('El psicólogo seleccionado está INACTIVO.');

    if (data.metodoPagoId !== 1 && (!data.bancoId || !data.numeroReferencia)) {
        throw new Error('Para transferencias o pagos con tarjeta, debe seleccionar un Banco e ingresar el Número de Referencia.');
    }

    // Se extrae y se garantiza que sea un número (con fallback a 0)
    const timeParts = data.hora.split(':').map(Number);
    const horas = timeParts[0] ?? 0;
    const minutos = timeParts[1] ?? 0;
    
    if (isNaN(horas) || isNaN(minutos)) throw new Error('Hora inválida');
    if (isNaN(horas) || isNaN(minutos)) throw new Error('Hora inválida');

    const fechaIsoString = `${data.fecha}T${data.hora}:00-06:00`;
    const fechaValidacion = new Date(fechaIsoString);
    const ahora = new Date();

    if (fechaValidacion < ahora) {
        throw new Error("No puedes reprogramar la cita a una fecha/hora pasada.");
    }

    const fechaParaGuardar = new Date(data.fecha);
    fechaParaGuardar.setUTCHours(horas, minutos, 0, 0);
    const fechaSoloDia = new Date(data.fecha);

    await verificarDisponibilidad(data.psicologoId, fechaSoloDia, fechaParaGuardar, id);

    await prisma.$transaction(async (tx) => {
      // 1. OBTENER LA CITA ACTUAL
      const citaActual = await tx.cita.findUnique({
          where: { ID_Cita: id },
          select: { ID_Direccion: true }
      });

      // 2. ACTUALIZAR DIRECCIÓN
      if (citaActual && data.direccion) {
          await tx.direccion.update({
              where: { ID_Direccion: citaActual.ID_Direccion },
              data: {
                  ID_Municipio: data.direccion.municipioId,
                  Barrio: data.direccion.barrio,
                  Calle: data.direccion.calle || null
              }
          });
      }

      // 3. ACTUALIZAR CITA
      await tx.cita.update({
        where: { ID_Cita: id },
        data: {
          FechaCita: fechaSoloDia,
          HoraCita: fechaParaGuardar,
          MotivoConsulta: data.motivo,
          ID_TipoCita: data.tipoCitaId,
          ID_Paciente: data.pacienteId,
          ID_Psicologo: data.psicologoId
        }
      });

      // 4. ACTUALIZAR RECIBO
      const recibo = await tx.recibo.findFirst({ where: { ID_Cita: id } });
      if (recibo) {
        await tx.recibo.update({
          where: { Cod_Recibo: recibo.Cod_Recibo },
          data: { 
            MontoTotal: data.precio,
            ID_Divisa: data.divisaId,
            ID_MetodoPago: data.metodoPagoId,
            ID_Banco: data.metodoPagoId !== 1 ? (data.bancoId ?? null) : null,
            Numero_Referencia: data.metodoPagoId !== 1 ? (data.numeroReferencia ?? null) : null
          }
        });
      }
    });
    return { message: 'Cita actualizada correctamente' };
  },

  cancel: async (id: number, motivoId: number, notas: string) => {
    return await prisma.cita.update({
      where: { ID_Cita: id },
      data: { 
        ID_EstadoCita: 3, 
        ID_MotivoCancelacion: Number(motivoId), // Atributo renombrado en DB
        NotasCancelacion: notas     
      } 
    });
  },

  procesarInasistencias: async () => {
    console.log("🔄 Ejecutando revisión automática de inasistencias...");
    const ahora = new Date();
    const toleranciaMinutos = 1; 
    
    const citasPendientes = await prisma.cita.findMany({
        where: { ID_EstadoCita: 1, FechaCita: { lte: ahora } }
    });

    const idsParaActualizar: number[] = [];

    citasPendientes.forEach(cita => {
        const fechaCompleta = new Date(cita.FechaCita);
        const hora = new Date(cita.HoraCita);
        
        fechaCompleta.setUTCHours(hora.getUTCHours(), hora.getUTCMinutes(), 0, 0);
        
        const tiempoLimite = new Date(fechaCompleta.getTime() + (toleranciaMinutos * 60000));
        const ahoraAjustado = new Date(ahora.getTime() - (6 * 60 * 60 * 1000)); 

        if (ahoraAjustado > tiempoLimite) {
            idsParaActualizar.push(cita.ID_Cita);
        }
    });

    if (idsParaActualizar.length === 0) return { procesadas: 0 };

    const resultado = await prisma.cita.updateMany({
        where: { ID_Cita: { in: idsParaActualizar } },
        data: {
            ID_EstadoCita: 4, 
            ID_MotivoCancelacion: 5, // 5 = Inasistencia sin Aviso (Basado en tu script inicial)
            NotasCancelacion: 'Cierre automático: El paciente no se presentó a la hora agendada.'
        }
    });
    console.log(`⚠️ Se marcaron ${resultado.count} citas como 'No Asistió'.`);
    return { procesadas: resultado.count };
  }
};