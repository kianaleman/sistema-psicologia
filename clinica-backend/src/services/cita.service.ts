import { PrismaClient, type Cita, type Factura } from '@prisma/client';

const prisma = new PrismaClient();

interface CreateCitaDTO {
  fecha: string;
  hora: string;
  motivo: string;
  tipoCitaId: number;
  pacienteId: number;
  psicologoId: number;
  precio: number;
  metodoPagoId: number;
  direccion: {
    pais?: string;
    departamento: string;
    ciudad: string;
    barrio: string;
    calle: string;
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
  const citasDelDia = await prisma.cita.findMany({
    where: {
      ID_Psicologo: psicologoId,
      FechaCita: fecha, 
      ID_EstadoCita: { not: 3 }, 
      ID_Cita: citaIdExcluir ? { not: citaIdExcluir } : undefined
    }
  });

  const conflicto = citasDelDia.find(c => {
    const horaDb = new Date(c.HoraCita); 
    const horaNueva = new Date(horaUTC);
    
    // Comparamos las horas UTC que es como se guardan y leen de la BD
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
        Factura: true,
        DireccionCita: true,
        MotivoCancelacion: true
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
    const [tiposCita, estadosCita, metodosPago] = await Promise.all([
      prisma.tipoDeCita.findMany(),
      prisma.estadoCita.findMany(),
      prisma.metodoPago.findMany()
    ]);
    return { tiposCita, estadosCita, metodosPago };
  },

  create: async (data: CreateCitaDTO) => {
    // 1. Validaciones de Entidad (Paciente/Psicologo)
    const pacienteCheck = await prisma.paciente.findUnique({
      where: { ID_Paciente: data.pacienteId },
      select: { ID_EstadoDeActividad: true, Nombre: true, Apellido: true }
    });
    if (!pacienteCheck) throw new Error('El paciente seleccionado no existe.');
    if (pacienteCheck.ID_EstadoDeActividad !== 1) {
      throw new Error(`No se puede agendar: El paciente ${pacienteCheck.Nombre} ${pacienteCheck.Apellido} está INACTIVO.`);
    }

    const psicologoCheck = await prisma.psicologo.findUnique({
      where: { ID_Psicologo: data.psicologoId },
      select: { ID_EstadoDeActividad: true, Nombre: true, Apellido: true }
    });
    if (!psicologoCheck) throw new Error('Psicólogo no encontrado.');
    if (psicologoCheck.ID_EstadoDeActividad !== 1) {
      throw new Error(`No disponible: El Dr. ${psicologoCheck.Apellido} está marcado como INACTIVO.`);
    }

    const [horas, minutos] = data.hora.split(':').map(Number);
    if (isNaN(horas) || isNaN(minutos)) throw new Error('Hora inválida');

    // 2. LÓGICA DE FECHAS (AQUÍ ESTÁ LA CORRECCIÓN)
    
    // A) Fecha para VALIDAR (Usamos la zona horaria real de Nicaragua)
    const fechaIsoString = `${data.fecha}T${data.hora}:00-06:00`; 
    const fechaValidacion = new Date(fechaIsoString);
    const ahora = new Date();

    if (fechaValidacion < ahora) {
        throw new Error("No es posible agendar citas en una fecha u hora que ya pasó.");
    }

    // B) Fecha para GUARDAR (Forzamos UTC para que SQL Server reciba el número literal)
    // Si el usuario puso 20:09, creamos una fecha donde getUTCHours() sea 20.
    const fechaParaGuardar = new Date(data.fecha);
    fechaParaGuardar.setUTCHours(horas, minutos, 0, 0);
    
    // Objeto fecha pura (sin hora) para la columna FechaCita
    const fechaSoloDia = new Date(data.fecha);

    // 3. Disponibilidad
    await verificarDisponibilidad(data.psicologoId, fechaSoloDia, fechaParaGuardar);

    const fechaHoraActual = new Date();
    const horaPagoNica = new Date(fechaHoraActual.getTime() - (6 * 60 * 60 * 1000));

    return await prisma.$transaction(async (tx) => {
      const direccionClinica = await tx.direccionCita.create({
        data: { 
          Pais: data.direccion.pais || 'Nicaragua', 
          Departamento: data.direccion.departamento, 
          Ciudad: data.direccion.ciudad, 
          Barrio: data.direccion.barrio, 
          Calle: data.direccion.calle 
        }
      });

      const citaCreada = await tx.cita.create({
        data: {
          FechaCita: fechaSoloDia,
          HoraCita: fechaParaGuardar, // Enviamos la hora "forzada" en UTC
          MotivoConsulta: data.motivo,
          ID_TipoCita: data.tipoCitaId,
          ID_EstadoCita: 1, 
          ID_Paciente: data.pacienteId,
          ID_Psicologo: data.psicologoId,
          ID_DireccionCita: direccionClinica.ID_DireccionCita
        }
      });

      const facturaCreada = await tx.factura.create({
        data: {
          ID_Cita: citaCreada.ID_Cita,
          FechaFactura: fechaSoloDia,
          MontoTotal: data.precio
        }
      });

      await tx.detalleFactura.create({
        data: {
          Cod_Factura: facturaCreada.Cod_Factura,
          ID_MetodoPago: data.metodoPagoId,
          PrecioDeCita: data.precio,
          FechaDePago: fechaHoraActual,
          HoraDePago: horaPagoNica,
          Observacion: 'Pago registrado al agendar cita'
        }
      });
      
      return { cita: citaCreada, factura: facturaCreada };
    });
  },

  update: async (id: number, data: UpdateCitaDTO) => {
    const pacienteCheck = await prisma.paciente.findUnique({ where: { ID_Paciente: data.pacienteId }, select: { ID_EstadoDeActividad: true } });
    if (pacienteCheck && pacienteCheck.ID_EstadoDeActividad !== 1) throw new Error('No se puede asignar esta cita a un paciente INACTIVO.');

    const psicologoCheck = await prisma.psicologo.findUnique({ where: { ID_Psicologo: data.psicologoId }, select: { ID_EstadoDeActividad: true } });
    if (psicologoCheck && psicologoCheck.ID_EstadoDeActividad !== 1) throw new Error('El psicólogo seleccionado está INACTIVO.');

    const [horas, minutos] = data.hora.split(':').map(Number);
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
      // 1. OBTENER LA CITA ACTUAL PARA SABER SU ID DE DIRECCIÓN
      const citaActual = await tx.cita.findUnique({
          where: { ID_Cita: id },
          select: { ID_DireccionCita: true }
      });

      // 2. ACTUALIZAR DIRECCIÓN (Si existe la cita y vienen datos)
      if (citaActual && data.direccion) {
          await tx.direccionCita.update({
              where: { ID_DireccionCita: citaActual.ID_DireccionCita },
              data: {
                  Pais: data.direccion.pais || 'Nicaragua',
                  Departamento: data.direccion.departamento,
                  Ciudad: data.direccion.ciudad,
                  Barrio: data.direccion.barrio,
                  Calle: data.direccion.calle
              }
          });
      }

      // 3. ACTUALIZAR DATOS DE LA CITA
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

      // 4. ACTUALIZAR FACTURA
      const factura = await tx.factura.findFirst({ where: { ID_Cita: id } });
      if (factura) {
        await tx.factura.update({
          where: { Cod_Factura: factura.Cod_Factura },
          data: { 
            FechaFactura: fechaSoloDia,
            MontoTotal: data.precio
          }
        });
        
        await tx.detalleFactura.updateMany({
           where: { Cod_Factura: factura.Cod_Factura },
           data: { 
             ID_MetodoPago: data.metodoPagoId,
             PrecioDeCita: data.precio 
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
        ID_Motivo: Number(motivoId), 
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
        
        // Reconstruimos usando UTC para leer lo que guardamos literalmente
        fechaCompleta.setUTCHours(hora.getUTCHours(), hora.getUTCMinutes(), 0, 0);
        
        // OJO: Aquí asumimos que lo guardado en BD es "hora nica" pero en UTC.
        // Para comparar con "ahora" (que es UTC real), necesitamos ajustar el offset
        // O simplemente, si guardamos 20:00 como 20:00 UTC, y ahora son las 21:00 UTC, la resta funciona directa.
        
        const tiempoLimite = new Date(fechaCompleta.getTime() + (toleranciaMinutos * 60000));

        // Sin embargo, 'ahora' es UTC real. Si son las 20:00 en Nica, 'ahora' es las 02:00 del día siguiente.
        // Y 'tiempoLimite' tiene 20:00 UTC.
        // 02:00 > 20:00 ? No (es del día siguiente). Hay un desfase.
        
        // AJUSTE CRÍTICO PARA CRON: 
        // Convertimos 'ahora' a la "hora visual nica" pero en objeto UTC para poder comparar manzanas con manzanas.
        const ahoraNica = new Date(ahora.toLocaleString('en-US', { timeZone: 'America/Managua' }));
        // Parseamos eso de nuevo a un objeto Date simple
        const ahoraNicaComparable = new Date(ahoraNica); 

        // NOTA: Esto es complejo. Simplificamos:
        // Si guardamos 20:00 UTC para representar 20:00 Nica.
        // Y son las 21:00 Nica. El servidor (UTC) dice que son las 03:00.
        // 03:00 (server) - 6 horas = 21:00 (Nica).
        
        const ahoraAjustado = new Date(ahora.getTime() - (6 * 60 * 60 * 1000)); // UTC-6 manual

        if (ahoraAjustado > tiempoLimite) {
            idsParaActualizar.push(cita.ID_Cita);
        }
    });

    if (idsParaActualizar.length === 0) return { procesadas: 0 };

    const resultado = await prisma.cita.updateMany({
        where: { ID_Cita: { in: idsParaActualizar } },
        data: {
            ID_EstadoCita: 4, 
            ID_Motivo: 4,
            NotasCancelacion: 'Cierre automático: El paciente no se presentó a la hora agendada.'
        }
    });
    console.log(`⚠️ Se marcaron ${resultado.count} citas como 'No Asistió'.`);
    return { procesadas: resultado.count };
  }
};