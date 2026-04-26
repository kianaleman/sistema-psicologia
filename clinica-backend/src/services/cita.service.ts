import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// --- DTOs ---
interface CreateCitaDTO {
  fecha: string;
  hora: string;
  motivo: string;
  tipoCitaId: number;
  pacienteId: number;
  psicologoId: number;
  precio: number;
  metodoPagoId: number;
  idDivisa: number;    
  tasaCambio: number;  
  idDireccion: number; 
}

// --- HELPER: VERIFICAR DISPONIBILIDAD (Lógica UTC Nicaragua) ---
const verificarDisponibilidad = async (psicologoId: number, fecha: Date, horaUTC: Date, citaIdExcluir?: number) => {
  const citasDelDia = await prisma.cita.findMany({
    where: {
      ID_Psicologo: psicologoId,
      FechaCita: fecha, 
      ID_EstadoCita: { not: 3 }, // No contar las canceladas
      ...(citaIdExcluir ? { ID_Cita: { not: citaIdExcluir } } : {})
    }
  });

  const conflicto = citasDelDia.find(c => {
    const horaDb = new Date(c.HoraCita); 
    const horaNueva = new Date(horaUTC);
    
    // Comparamos horas y minutos literales guardados en UTC
    return horaDb.getUTCHours() === horaNueva.getUTCHours() &&
           horaDb.getUTCMinutes() === horaNueva.getUTCMinutes();
  });

  if (conflicto) throw new Error('El psicólogo ya tiene una cita agendada en este horario.');
};

export const CitaService = {
  
  // 1. Obtener todas con numeración de sesiones (Lógica antigua restaurada)
  getAll: async () => {
    const citas = await prisma.cita.findMany({
      include: {
        Paciente: true, 
        Psicologo: true,
        TipoDeCita: true,
        EstadoCita: true,
        Recibo: true,       
        Direccion: true,    
        MotivoCancelacion: true
      },
      orderBy: [{ FechaCita: 'asc' }, { HoraCita: 'asc' }]
    });
    
    const contadores: Record<number, number> = {};
    const citasNumeradas = citas.map(cita => {
      // Si está cancelada (ID 3), no cuenta como sesión asistida
      if (cita.ID_EstadoCita === 3) return { ...cita, NumeroSesion: null };
      
      const pid = cita.ID_Paciente;
      if (!contadores[pid]) contadores[pid] = 0;
      contadores[pid]++;

      return { ...cita, NumeroSesion: contadores[pid] };
    });

    return citasNumeradas.reverse(); // Mostrar las más recientes primero
  },

  // 2. Obtener catálogos para los selects del Frontend
  getFilters: async () => {
    return await Promise.all([
      prisma.tipoDeCita.findMany(),
      prisma.estadoCita.findMany(),
      prisma.metodoPago.findMany(),
      prisma.divisa.findMany(),
      prisma.motivoCancelacion.findMany(),
      prisma.psicologo.findMany({ 
        where: { Activo: true },
        select: { ID_Psicologo: true, Nombre: true, Apellido: true } 
      })
    ]).then(([tiposCita, estadosCita, metodosPago, divisas, motivosCancelacion, psicologos]) => ({
      tiposCita, estadosCita, metodosPago, divisas, motivosCancelacion, psicologos
    }));
  },

  // 3. Crear Cita + Recibo (Transaccional)
  create: async (data: CreateCitaDTO) => {
    // Validar estado del paciente
    const paciente = await prisma.paciente.findUnique({ where: { ID_Paciente: data.pacienteId } });
    if (!paciente || !paciente.Activo) throw new Error('El paciente no existe o está inactivo.');

    // Procesar Hora para persistencia UTC "visual"
    const [horas, minutos] = data.hora.split(':').map(Number);
    if (horas === undefined || minutos === undefined) throw new Error('Formato de hora inválido.');

    const fechaParaGuardar = new Date(data.fecha);
    fechaParaGuardar.setUTCHours(horas, minutos, 0, 0);
    const fechaSoloDia = new Date(data.fecha);

    // Validar que no sea en el pasado (UTC-6 Nicaragua)
    const ahoraNica = new Date(new Date().getTime() - (6 * 60 * 60 * 1000));
    const combinada = new Date(data.fecha);
    combinada.setUTCHours(horas, minutos, 0, 0);
    if (combinada < ahoraNica) throw new Error("No se pueden agendar citas en el pasado.");

    await verificarDisponibilidad(data.psicologoId, fechaSoloDia, fechaParaGuardar);

    return await prisma.$transaction(async (tx) => {
      // A. Crear la Cita
      const cita = await tx.cita.create({
        data: {
          FechaCita: fechaSoloDia,
          HoraCita: fechaParaGuardar,
          MotivoConsulta: data.motivo,
          ID_TipoCita: data.tipoCitaId,
          ID_EstadoCita: 1, // Pendiente
          ID_Paciente: data.pacienteId,
          ID_Psicologo: data.psicologoId,
          ID_Direccion: data.idDireccion 
        }
      });

      // B. Crear el Recibo (Nueva tabla)
      await tx.recibo.create({
        data: {
          ID_Cita: cita.ID_Cita,
          ID_Divisa: data.idDivisa,
          ID_MetodoPago: data.metodoPagoId,
          FechaRecibo: new Date(),
          MontoTotal: data.precio,
          Tasa_Cambio: data.tasaCambio,
          Observacion: 'Pago registrado al agendar desde el sistema.'
        }
      });
      
      return cita;
    });
  },

  // 4. Actualizar Cita y Recibo
  update: async (id: number, data: any) => {
    const [horas, minutos] = data.hora.split(':').map(Number);
    const fechaParaGuardar = new Date(data.fecha);
    fechaParaGuardar.setUTCHours(horas, minutos, 0, 0);
    const fechaSoloDia = new Date(data.fecha);

    await verificarDisponibilidad(data.psicologoId, fechaSoloDia, fechaParaGuardar, id);

    return await prisma.$transaction(async (tx) => {
      const cita = await tx.cita.update({
        where: { ID_Cita: id },
        data: {
          FechaCita: fechaSoloDia,
          HoraCita: fechaParaGuardar,
          MotivoConsulta: data.motivo,
          ID_TipoCita: data.tipoCitaId,
          ID_Psicologo: data.psicologoId,
          ID_Direccion: data.idDireccion
        }
      });

      // En el esquema nuevo, Recibo es 1 a 1 con Cita
      await tx.recibo.update({
        where: { ID_Cita: id },
        data: { 
          MontoTotal: data.precio,
          ID_Divisa: data.idDivisa,
          ID_MetodoPago: data.metodoPagoId,
          Tasa_Cambio: data.tasaCambio
        }
      });
      return cita;
    });
  },

  // 5. Cancelar Cita
  cancel: async (id: number, motivoId: number, notas: string) => {
    return await prisma.cita.update({
      where: { ID_Cita: id },
      data: { 
        ID_EstadoCita: 3, // Cancelada
        ID_MotivoCancelacion: motivoId, 
        NotasCancelacion: notas     
      } 
    });
  },

  // 6. Cron Job: Procesar Inasistencias (Ajustado a UTC-6)
  procesarInasistencias: async () => {
    const ahoraNica = new Date(new Date().getTime() - (6 * 60 * 60 * 1000)); 
    
    // Citas que son para hoy o antes y siguen "Pendientes"
    const citasVencidas = await prisma.cita.findMany({
        where: { 
          ID_EstadoCita: 1, 
          FechaCita: { lte: ahoraNica } 
        }
    });

    if (citasVencidas.length === 0) return { procesadas: 0 };

    // Filtramos las que realmente ya pasaron la hora
    const idsParaActualizar = citasVencidas.filter(c => {
      const horaCita = new Date(c.HoraCita);
      return ahoraNica.getUTCHours() > horaCita.getUTCHours() || 
             (ahoraNica.getUTCHours() === horaCita.getUTCHours() && ahoraNica.getUTCMinutes() > horaCita.getUTCMinutes());
    }).map(c => c.ID_Cita);

    const resultado = await prisma.cita.updateMany({
        where: { ID_Cita: { in: idsParaActualizar } },
        data: {
            ID_EstadoCita: 4, // No Asistió
            ID_MotivoCancelacion: 1, // Motivo por defecto: Inasistencia
            NotasCancelacion: 'Marcado automáticamente por el sistema por falta de asistencia.'
        }
    });
    
    return { procesadas: resultado.count };
  }
};