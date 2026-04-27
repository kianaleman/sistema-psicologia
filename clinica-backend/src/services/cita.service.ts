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
  idDireccion: number; // 0 si es domicilio del paciente, >0 si es manual/existente
  direccionManual?: {
    departamento: string;
    ciudad: string;
    barrio: string;
    calle: string;
  };
}

// --- HELPER: VERIFICAR DISPONIBILIDAD ---
const verificarDisponibilidad = async (psicologoId: number, fecha: Date, horaUTC: Date, citaIdExcluir?: number) => {
  const citasDelDia = await prisma.cita.findMany({
    where: {
      ID_Psicologo: psicologoId,
      FechaCita: fecha,
      ID_EstadoCita: { not: 3 },
      ...(citaIdExcluir ? { ID_Cita: { not: citaIdExcluir } } : {})
    }
  });

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
        Paciente: { include: { Expediente: true } },
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
      if (cita.ID_EstadoCita === 3) return { ...cita, NumeroSesion: null };
      const pid = cita.ID_Paciente;
      contadores[pid] = (contadores[pid] || 0) + 1;
      return { ...cita, NumeroSesion: contadores[pid] };
    });

    return citasNumeradas.reverse();
  },

  getFilters: async () => {
    const [tiposCita, estadosCita, metodosPago, divisas, motivosCancelacion, psicologos, pacientes] = await Promise.all([
      prisma.tipoDeCita.findMany(),
      prisma.estadoCita.findMany(),
      prisma.metodoPago.findMany(),
      prisma.divisa.findMany(),
      prisma.motivoCancelacion.findMany(),
      prisma.psicologo.findMany({
        where: { Activo: true },
        select: { ID_Psicologo: true, Nombre: true, Apellido: true }
      }),
      prisma.paciente.findMany({
        where: { Activo: true },
        include: { 
          PacienteAdulto: true, 
          Direccion: true,
          Expediente: true 
        }
      })
    ]);

    return { tiposCita, estadosCita, metodosPago, divisas, motivosCancelacion, psicologos, pacientes };
  },

  create: async (data: CreateCitaDTO) => {
    const pacienteId = Number(data.pacienteId);
    const psicologoId = Number(data.psicologoId);
    const tipoCitaId = Number(data.tipoCitaId);

    const paciente = await prisma.paciente.findUnique({ 
      where: { ID_Paciente: pacienteId },
      select: { Activo: true, ID_Direccion: true } 
    });
    if (!paciente || !paciente.Activo) throw new Error('El paciente no existe o está inactivo.');

    let direccionIdFinal: number;
    const idDireccionInput = isNaN(Number(data.idDireccion)) ? 0 : Number(data.idDireccion);

    if (idDireccionInput === 0) {
      direccionIdFinal = paciente.ID_Direccion;
    } else if (data.direccionManual) {
      const depto = String(data.direccionManual.departamento || '').trim();
      const ciudad = String(data.direccionManual.ciudad || '').trim();
      const barrio = String(data.direccionManual.barrio || '').trim();
      const calle = String(data.direccionManual.calle || '').trim();

      const dirExistente = await prisma.direccion.findFirst({
        where: { Departamento: depto, Ciudad: ciudad, Barrio: barrio, Calle: calle }
      });

      if (dirExistente) {
        direccionIdFinal = dirExistente.ID_Direccion;
      } else {
        const nuevaDir = await prisma.direccion.create({
          data: { Pais: 'Nicaragua', Departamento: depto, Ciudad: ciudad, Barrio: barrio, Calle: calle }
        });
        direccionIdFinal = nuevaDir.ID_Direccion;
      }
    } else {
      direccionIdFinal = idDireccionInput;
    }

    const horaSegura = data.hora || "00:00";
    const [hStr = "00", mStr = "00"] = horaSegura.split(':');
    const fechaParaGuardar = new Date(data.fecha);
    fechaParaGuardar.setUTCHours(parseInt(hStr, 10), parseInt(mStr, 10), 0, 0);
    const fechaSoloDia = new Date(data.fecha);

    await verificarDisponibilidad(psicologoId, fechaSoloDia, fechaParaGuardar);

    return await prisma.$transaction(async (tx) => {
        const cita = await tx.cita.create({
            data: {
                FechaCita: fechaSoloDia,
                HoraCita: fechaParaGuardar,
                MotivoConsulta: data.motivo,
                ID_TipoCita: tipoCitaId,
                ID_EstadoCita: 1, 
                ID_Paciente: pacienteId,
                ID_Psicologo: psicologoId,
                ID_Direccion: direccionIdFinal
            }
        });

        await tx.recibo.create({
            data: {
                ID_Cita: cita.ID_Cita,
                ID_Divisa: Number(data.idDivisa),
                ID_MetodoPago: Number(data.metodoPagoId),
                FechaRecibo: new Date(),
                MontoTotal: Number(data.precio),
                Tasa_Cambio: Number(data.tasaCambio),
                Observacion: 'Registro desde sistema.'
            }
        });

        return cita;
    });
  },

  update: async (id: number, data: any) => {
    const psicologoId = Number(data.psicologoId);
    const tipoCitaId = Number(data.tipoCitaId);
    const citaId = Number(id);

    let direccionIdFinal: number;
    const idDireccionInput = isNaN(Number(data.idDireccion)) ? 0 : Number(data.idDireccion);

    if (idDireccionInput === 0) {
      const paciente = await prisma.paciente.findUnique({
        where: { ID_Paciente: Number(data.pacienteId) },
        select: { ID_Direccion: true }
      });
      direccionIdFinal = paciente?.ID_Direccion || 1;
    } else if (data.direccionManual) {
      const depto = String(data.direccionManual.departamento || '').trim();
      const ciudad = String(data.direccionManual.ciudad || '').trim();
      const barrio = String(data.direccionManual.barrio || '').trim();
      const calle = String(data.direccionManual.calle || '').trim();

      const dirExistente = await prisma.direccion.findFirst({
        where: { Departamento: depto, Ciudad: ciudad, Barrio: barrio, Calle: calle }
      });
      
      if (dirExistente) {
        direccionIdFinal = dirExistente.ID_Direccion;
      } else {
        const nuevaDir = await prisma.direccion.create({
          data: { Pais: 'Nicaragua', Departamento: depto, Ciudad: ciudad, Barrio: barrio, Calle: calle }
        });
        direccionIdFinal = nuevaDir.ID_Direccion;
      }
    } else {
      direccionIdFinal = idDireccionInput;
    }

    const horaSegura = data.hora || "00:00";
    const [hStr = "00", mStr = "00"] = horaSegura.split(':');
    const fechaParaGuardar = new Date(data.fecha);
    fechaParaGuardar.setUTCHours(parseInt(hStr, 10), parseInt(mStr, 10), 0, 0);
    const fechaSoloDia = new Date(data.fecha);

    await verificarDisponibilidad(psicologoId, fechaSoloDia, fechaParaGuardar, citaId);

    return await prisma.$transaction(async (tx) => {
        const cita = await tx.cita.update({
            where: { ID_Cita: citaId },
            data: {
                FechaCita: fechaSoloDia,
                HoraCita: fechaParaGuardar,
                MotivoConsulta: data.motivo,
                ID_TipoCita: tipoCitaId,
                ID_Psicologo: psicologoId,
                ID_Direccion: direccionIdFinal
            }
        });

        await tx.recibo.updateMany({
            where: { ID_Cita: citaId },
            data: {
                MontoTotal: Number(data.precio),
                ID_Divisa: Number(data.idDivisa),
                ID_MetodoPago: Number(data.metodoPagoId),
                Tasa_Cambio: Number(data.tasaCambio)
            }
        });
        return cita;
    });
  },

  // 🟢 NUEVO: Guardar Sesión Clínica y Marcar Cita como Realizada
  guardarSesion: async (data: any) => {
    return await prisma.$transaction(async (tx) => {
      // 1. Crear el registro en la tabla Sesion
      const sesion = await tx.sesion.create({
        data: {
          ID_Cita: Number(data.idCita),
          ID_Expediente: Number(data.idExpediente),
          HoraDelInicio: new Date(data.horaInicio),
          HoraFinal: new Date(data.horaFinal),
          Observaciones: data.observaciones,
          DiagnosticoDiferencial: data.diagnosticoDiferencial,
          HistorialDeEvolucion: data.historialEvolucion,
          Criterios_DeDiagnostico: data.criteriosDiagnostico
        }
      });

      // 2. Actualizar el estado de la Cita a Completada (Estado ID: 2)
      await tx.cita.update({
        where: { ID_Cita: Number(data.idCita) },
        data: { ID_EstadoCita: 2 }
      });

      return sesion;
    });
  },

  cancel: async (id: number, motivoId: number, notas: string) => {
    return await prisma.cita.update({
      where: { ID_Cita: id },
      data: {
        ID_EstadoCita: 3,
        ID_MotivoCancelacion: motivoId,
        NotasCancelacion: notas
      }
    });
  },

  procesarInasistencias: async () => {
    const ahoraNica = new Date(new Date().getTime() - (6 * 60 * 60 * 1000));
    const citasVencidas = await prisma.cita.findMany({
      where: { ID_EstadoCita: 1, FechaCita: { lte: ahoraNica } }
    });

    if (citasVencidas.length === 0) return { procesadas: 0 };

    const idsParaActualizar = citasVencidas.filter(c => {
      const horaCita = new Date(c.HoraCita);
      return ahoraNica.getUTCHours() > horaCita.getUTCHours() ||
        (ahoraNica.getUTCHours() === horaCita.getUTCHours() && ahoraNica.getUTCMinutes() > horaCita.getUTCMinutes());
    }).map(c => c.ID_Cita);

    const resultado = await prisma.cita.updateMany({
      where: { ID_Cita: { in: idsParaActualizar } },
      data: {
        ID_EstadoCita: 4,
        ID_MotivoCancelacion: 1,
        NotasCancelacion: 'Marcado automáticamente por falta de asistencia.'
      }
    });

    return { procesadas: resultado.count };
  }
};