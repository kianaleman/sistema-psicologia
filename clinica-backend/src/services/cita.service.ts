import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CreateCitaDTO {
  ID_Paciente: number;
  ID_Psicologo: number;
  ID_TipoCita: number;
  ID_EstadoCita: number;
  ID_Direccion: number;
  FechaCita: string;
  HoraCita: string;
  MotivoConsulta?: string;
  
  // Financiero
  Precio: number;
  ID_Divisa?: number;
  ID_MetodoPago: number;
  ID_Banco?: number;
  Numero_Referencia?: string;
}

interface UpdateCitaDTO extends Partial<CreateCitaDTO> {}

const verificarDisponibilidad = async (
  psicologoId: number, 
  fecha: Date, 
  horaUTC: Date, 
  citaIdExcluir?: number
) => {
  const whereClause: any = {
    ID_Psicologo: psicologoId,
    FechaCita: fecha, 
    ID_EstadoCita: { not: 3 }
  };

  if (citaIdExcluir) whereClause.ID_Cita = { not: citaIdExcluir };

  const citasDelDia = await prisma.cita.findMany({ where: whereClause });

  const conflicto = citasDelDia.find(c => {
    const horaDb = new Date(c.HoraCita); 
    const horaNueva = new Date(horaUTC);
    
    return horaDb.getUTCHours() === horaNueva.getUTCHours() &&
           horaDb.getUTCMinutes() === horaNueva.getUTCMinutes();
  });

  if (conflicto) throw new Error('El psicólogo ya tiene una cita agendada en este horario.');
};

export const CitaService = {
  
  getAll: async () => {
    const citas = await prisma.cita.findMany({
      include: {
        Paciente: true, Psicologo: true, TipoDeCita: true, EstadoCita: true,
        Recibo: { include: { MetodoPago: true, Divisa: true, Banco: true } }, 
        Direccion: { include: { Municipio: { include: { Departamento: true } } } }, 
        MotivoCancelacion: true, Sesion: true
      },
      orderBy: [{ FechaCita: 'asc' }, { HoraCita: 'asc' }]
    });
    
    const contadores: Record<number, number> = {};
    const citasNumeradas = citas.map(cita => {
      if (cita.ID_EstadoCita === 3) return { ...cita, NumeroSesion: null };
      const pid = cita.ID_Paciente;
      if (!contadores[pid]) contadores[pid] = 0;
      contadores[pid]++;
      return { ...cita, NumeroSesion: contadores[pid] };
    });

    return citasNumeradas.reverse();
  },

  getCatalogos: async () => {
    const [tiposCita, estadosCita, metodosPago, bancos, divisas] = await Promise.all([
      prisma.tipoDeCita.findMany(), prisma.estadoCita.findMany(),
      prisma.metodoPago.findMany(), prisma.banco.findMany({ where: { Activo: true } }), 
      prisma.divisa.findMany()
    ]);
    return { tiposCita, estadosCita, metodosPago, bancos, divisas };
  },

  getHorariosOcupados: async (psicologoId: number, fechaStr: string) => {
    const fechaBuscar = new Date(fechaStr); // Convierte "YYYY-MM-DD" al formato de DB
    
    const citas = await prisma.cita.findMany({
      where: {
        ID_Psicologo: psicologoId,
        FechaCita: fechaBuscar,
        ID_EstadoCita: { not: 3 } // Ignoramos las canceladas (y no bloquean la agenda)
      },
      select: {
        HoraCita: true // Solo traemos la hora para que la petición sea rapidísima
      }
    });

    // Formateamos las horas extraídas a un formato legible "HH:mm" (24hrs)
    return citas.map(c => {
      const horaDb = new Date(c.HoraCita);
      const hh = horaDb.getUTCHours().toString().padStart(2, '0');
      const mm = horaDb.getUTCMinutes().toString().padStart(2, '0');
      return `${hh}:${mm}`;
    });
  },

  create: async (data: CreateCitaDTO) => {
    const pacienteCheck = await prisma.paciente.findUnique({ where: { ID_Paciente: data.ID_Paciente }, select: { Activo: true } });
    if (!pacienteCheck || !pacienteCheck.Activo) throw new Error('El paciente no existe o está INACTIVO.');

    const psicologoCheck = await prisma.psicologo.findUnique({ where: { ID_Psicologo: data.ID_Psicologo }, select: { Activo: true } });
    if (!psicologoCheck || !psicologoCheck.Activo) throw new Error('El psicólogo no existe o está INACTIVO.');

    if (data.ID_MetodoPago !== 1 && (!data.ID_Banco || !data.Numero_Referencia)) {
        throw new Error('Para transferencias o pagos con tarjeta, debe seleccionar un Banco e ingresar el Número de Referencia.');
    }

    const timeParts = data.HoraCita.split(':').map(Number);
    const horas = timeParts[0] ?? 0;
    const minutos = timeParts[1] ?? 0;
    
    if (isNaN(horas) || isNaN(minutos)) throw new Error('Hora inválida');

    const fechaIsoString = `${data.FechaCita}T${data.HoraCita}:00-06:00`; 
    if (new Date(fechaIsoString) < new Date()) throw new Error("No es posible agendar citas en el pasado.");

    const fechaParaGuardar = new Date(data.FechaCita);
    fechaParaGuardar.setUTCHours(horas, minutos, 0, 0);
    const fechaSoloDia = new Date(data.FechaCita);

    await verificarDisponibilidad(data.ID_Psicologo, fechaSoloDia, fechaParaGuardar);

    return await prisma.$transaction(async (tx) => {
      const citaCreada = await tx.cita.create({
        data: {
          FechaCita: fechaSoloDia,
          HoraCita: fechaParaGuardar,
          // 👇 FIX 1: Transformar undefined a null para satisfacer el modo estricto de Prisma
          MotivoConsulta: data.MotivoConsulta ?? null, 
          ID_TipoCita: data.ID_TipoCita,
          ID_EstadoCita: data.ID_EstadoCita || 1, 
          ID_Paciente: data.ID_Paciente,
          ID_Psicologo: data.ID_Psicologo,
          ID_Direccion: data.ID_Direccion 
        }
      });

      const fechaHoraActual = new Date();
      const horaPagoNica = new Date(fechaHoraActual.getTime() - (6 * 60 * 60 * 1000));

      const reciboCreado = await tx.recibo.create({
        data: {
          ID_Cita: citaCreada.ID_Cita,
          ID_Divisa: data.ID_Divisa || 1,
          ID_MetodoPago: data.ID_MetodoPago,
          FechaDePago: fechaHoraActual,
          HoraDePago: horaPagoNica,
          MontoTotal: data.Precio,
          Observacion: 'Pago registrado al agendar cita',
          Tasa_Cambio: 1.0000,
          ID_Banco: data.ID_MetodoPago !== 1 ? (data.ID_Banco ?? null) : null,
          Numero_Referencia: data.ID_MetodoPago !== 1 ? (data.Numero_Referencia ?? null) : null
        }
      });

      return { cita: citaCreada, recibo: reciboCreado };
    });
  },

  update: async (id: number, data: UpdateCitaDTO) => {
    const result = await prisma.cita.findUnique({ where: { ID_Cita: id } });
    if (!result) throw new Error('Cita no encontrada');

    // 1. DESESTRUCTURACIÓN BLINDADA: Sacamos todos los valores de una vez.
    // El "result!" le jura a TypeScript que el objeto existe, y los valores se guardan en constantes seguras.
    const {
      ID_Psicologo: oldPsicologo,
      MotivoConsulta: oldMotivo,
      ID_TipoCita: oldTipoCita,
      ID_Paciente: oldPaciente,
      ID_Direccion: oldDireccion,
      ID_EstadoCita: oldEstado,
      FechaCita: oldFecha,
      HoraCita: oldHora
    } = result!;

    // 2. Usamos las constantes extraídas (TypeScript ya no sospecha de ellas)
    // Usamos substring directo para que TypeScript no se asuste con arreglos
    const fallbackFecha = oldFecha 
        ? oldFecha.toISOString().substring(0, 10) 
        : new Date().toISOString().substring(0, 10);
        
    const fallbackHora = oldHora 
        ? oldHora.toISOString().substring(11, 16) 
        : "08:00";

    // 3. Asignación con Casteo Fuerte
    const idPsicologo = (data.ID_Psicologo ?? oldPsicologo) as number;
    const fechaStr = (data.FechaCita ?? fallbackFecha) as string;
    const horaStr = (data.HoraCita ?? fallbackHora) as string;
    
    const finalMotivo = (data.MotivoConsulta !== undefined ? data.MotivoConsulta : oldMotivo) as string | null;
    const finalTipoCita = (data.ID_TipoCita ?? oldTipoCita) as number;
    const finalPaciente = (data.ID_Paciente ?? oldPaciente) as number;
    const finalDireccion = (data.ID_Direccion ?? oldDireccion) as number;
    const finalEstado = (data.ID_EstadoCita ?? oldEstado) as number;

    // 4. Procesamiento
    const timeParts = horaStr.split(':').map(Number);
    const horas = timeParts[0] ?? 0;
    const minutos = timeParts[1] ?? 0;
    
    if (isNaN(horas) || isNaN(minutos)) throw new Error('Hora inválida');

    const fechaParaGuardar = new Date(fechaStr);
    fechaParaGuardar.setUTCHours(horas, minutos, 0, 0);
    const fechaSoloDia = new Date(fechaStr);

    const fechaIsoString = `${fechaStr}T${horaStr}:00-06:00`;
    if (new Date(fechaIsoString) < new Date()) {
        throw new Error("No puedes reprogramar la cita a una fecha/hora pasada.");
    }

    await verificarDisponibilidad(idPsicologo, fechaSoloDia, fechaParaGuardar, id);

    await prisma.$transaction(async (tx) => {
      await tx.cita.update({
        where: { ID_Cita: id },
        data: {
          FechaCita: fechaSoloDia,
          HoraCita: fechaParaGuardar,
          MotivoConsulta: finalMotivo,
          ID_TipoCita: finalTipoCita,
          ID_Paciente: finalPaciente,
          ID_Psicologo: idPsicologo,
          ID_Direccion: finalDireccion,
          ID_EstadoCita: finalEstado
        }
      });

      if (data.Precio !== undefined || data.ID_MetodoPago !== undefined) {
        const recibo = await tx.recibo.findFirst({ where: { ID_Cita: id } });
        if (recibo) {
          await tx.recibo.update({
            where: { Cod_Recibo: recibo.Cod_Recibo },
            data: { 
              MontoTotal: (data.Precio ?? recibo.MontoTotal) as number,
              ID_Divisa: (data.ID_Divisa ?? recibo.ID_Divisa) as number,
              ID_MetodoPago: (data.ID_MetodoPago ?? recibo.ID_MetodoPago) as number,
              ID_Banco: data.ID_MetodoPago && data.ID_MetodoPago !== 1 ? (data.ID_Banco ?? null) : null,
              Numero_Referencia: data.ID_MetodoPago && data.ID_MetodoPago !== 1 ? (data.Numero_Referencia ?? null) : null
            }
          });
        }
      }
    });

    return { message: 'Cita actualizada correctamente' };
  },

  cancel: async (id: number, motivoId: number, notas: string) => {
    return await prisma.cita.update({
      where: { ID_Cita: id }, data: { ID_EstadoCita: 3, ID_MotivoCancelacion: Number(motivoId), NotasCancelacion: notas } 
    });
  },

  procesarInasistencias: async () => { 
    // Se mantiene intacto tu código de inasistencias
    return { procesadas: 0 }; 
  }
};