import { PrismaClient, type Prisma } from '@prisma/client';
import type { AuthUserPayload } from '../middlewares/auth.middleware.js';

const prisma = new PrismaClient();

const ESTADOS_CITA = {
  PENDIENTE: 1,
  REALIZADA: 2,
  CANCELADA: 3,
  NO_PROCESADA: 4,
} as const;

const MOTIVOS_CANCELACION = {
  INASISTENCIA_SIN_AVISO: 5,
} as const;

const MINUTOS_GRACIA_INASISTENCIA = 60;


interface CreateCitaDTO {
  ID_Paciente: number;
  ID_Psicologo: number;
  ID_TipoCita: number;
  ID_EstadoCita: number;
  ID_Direccion: number;
  FechaCita: string;
  HoraCita: string;
  MotivoConsulta?: string;

  Precio: number;
  ID_Divisa?: number;
  Tasa_Cambio?: number;
  ID_MetodoPago: number;
  ID_Banco?: number;
  Numero_Referencia?: string;
}

interface UpdateCitaDTO extends Partial<CreateCitaDTO> {}

const validarUsuarioAutenticado = (usuario?: AuthUserPayload) => {
  if (!usuario) {
    throw new Error('Acceso no autorizado.');
  }

  return usuario;
};

const validarPsicologoVinculado = (usuario: AuthUserPayload) => {
  if (!usuario.idPsicologo) {
    throw new Error('El usuario psicólogo no tiene un perfil de psicólogo vinculado.');
  }

  return usuario.idPsicologo;
};

const obtenerWhereCitasPermitidas = (usuario?: AuthUserPayload): Prisma.CitaWhereInput => {
  const usuarioActual = validarUsuarioAutenticado(usuario);

  if (usuarioActual.esAdmin || usuarioActual.esRecepcion) {
    return {};
  }

  if (usuarioActual.esPsicologo) {
    return {
      ID_Psicologo: validarPsicologoVinculado(usuarioActual),
    };
  }

  throw new Error('No tiene permisos para consultar citas.');
};

const obtenerPsicologoPermitidoParaCita = (psicologoId: number, usuario?: AuthUserPayload) => {
  const usuarioActual = validarUsuarioAutenticado(usuario);

  if (usuarioActual.esAdmin || usuarioActual.esRecepcion) {
    return psicologoId;
  }

  if (usuarioActual.esPsicologo) {
    const idPsicologo = validarPsicologoVinculado(usuarioActual);

    if (psicologoId !== idPsicologo) {
      throw new Error('No tiene permisos para gestionar citas de otro psicólogo.');
    }

    return idPsicologo;
  }

  throw new Error('No tiene permisos para gestionar citas.');
};

type ReciboPagoActual = {
  MontoTotal: Prisma.Decimal | number | string | null;
  ID_Divisa: number | null;
  Tasa_Cambio: Prisma.Decimal | number | string | null;
};

const normalizarCodigoDivisa = (codigo?: string | null) => {
  return (codigo || '').trim().toUpperCase();
};

const obtenerDivisaPorId = async (idDivisa?: number | null) => {
  const divisa = await prisma.divisa.findFirst({
    where: idDivisa
      ? { ID_Divisa: idDivisa }
      : {
          Codigo_ISO: {
            in: ['NIO', 'USD'],
          },
        },
    orderBy: {
      Codigo_ISO: 'asc',
    },
  });

  if (!divisa) {
    throw new Error('Debe configurar al menos una divisa válida para registrar pagos.');
  }

  return divisa;
};

const normalizarPago = async (
  data: Partial<CreateCitaDTO>,
  reciboActual?: ReciboPagoActual | null
) => {
  const monto = data.Precio !== undefined
    ? Number(data.Precio)
    : Number(reciboActual?.MontoTotal ?? 0);

  if (!Number.isFinite(monto) || monto <= 0) {
    throw new Error('El monto del pago debe ser mayor que cero.');
  }

  const idDivisaFinal = data.ID_Divisa ?? reciboActual?.ID_Divisa ?? null;
  const divisa = await obtenerDivisaPorId(idDivisaFinal);
  const codigoDivisa = normalizarCodigoDivisa(divisa.Codigo_ISO);

  if (codigoDivisa !== 'NIO' && codigoDivisa !== 'USD') {
    throw new Error('Solo se permiten pagos en córdobas (NIO) o dólares (USD).');
  }

  const tasaCambioBase = data.Tasa_Cambio !== undefined
    ? Number(data.Tasa_Cambio)
    : Number(reciboActual?.Tasa_Cambio ?? 0);

  const tasaCambio = codigoDivisa === 'USD' ? tasaCambioBase : 1;

  if (codigoDivisa === 'USD' && (!Number.isFinite(tasaCambio) || tasaCambio <= 0)) {
    throw new Error('Debe indicar una tasa de cambio válida para pagos en dólares.');
  }

  return {
    monto,
    idDivisa: divisa.ID_Divisa,
    tasaCambio,
    codigoDivisa,
  };
};


const validarAccesoACitaExistente = (
  cita: { ID_Psicologo: number },
  usuario?: AuthUserPayload
) => {
  const usuarioActual = validarUsuarioAutenticado(usuario);

  if (usuarioActual.esAdmin || usuarioActual.esRecepcion) {
    return;
  }

  if (usuarioActual.esPsicologo) {
    const idPsicologo = validarPsicologoVinculado(usuarioActual);

    if (cita.ID_Psicologo !== idPsicologo) {
      throw new Error('No tiene permisos para modificar una cita que pertenece a otro psicólogo.');
    }

    return;
  }

  throw new Error('No tiene permisos para gestionar citas.');
};

const verificarDisponibilidad = async (
  psicologoId: number,
  fecha: Date,
  horaUTC: Date,
  citaIdExcluir?: number
) => {
  const whereClause: Prisma.CitaWhereInput = {
    ID_Psicologo: psicologoId,
    FechaCita: fecha,
    ID_EstadoCita: {
      notIn: [ESTADOS_CITA.CANCELADA, ESTADOS_CITA.NO_PROCESADA],
    },
  };

  if (citaIdExcluir) {
    whereClause.ID_Cita = {
      not: citaIdExcluir,
    };
  }

  const citasDelDia = await prisma.cita.findMany({
    where: whereClause,
  });

  const conflicto = citasDelDia.find((cita) => {
    const horaDb = new Date(cita.HoraCita);
    const horaNueva = new Date(horaUTC);

    return horaDb.getUTCHours() === horaNueva.getUTCHours() &&
      horaDb.getUTCMinutes() === horaNueva.getUTCMinutes();
  });

  if (conflicto) {
    throw new Error('El psicólogo ya tiene una cita agendada en este horario.');
  }
};

const construirFechaHoraCita = (fechaCita: Date, horaCita: Date) => {
  const fecha = fechaCita.toISOString().split('T')[0];
  const horas = horaCita.getUTCHours().toString().padStart(2, '0');
  const minutos = horaCita.getUTCMinutes().toString().padStart(2, '0');

  return new Date(`${fecha}T${horas}:${minutos}:00-06:00`);
};

const sumarMinutos = (fecha: Date, minutos: number) => {
  return new Date(fecha.getTime() + minutos * 60 * 1000);
};

export const CitaService = {
  getAll: async (usuario?: AuthUserPayload) => {
    const where = obtenerWhereCitasPermitidas(usuario);

    const citas = await prisma.cita.findMany({
      where,
      include: {
        Paciente: true,
        Psicologo: true,
        TipoDeCita: true,
        EstadoCita: true,
        Recibo: {
          include: {
            MetodoPago: true,
            Divisa: true,
            Banco: true,
          },
        },
        Direccion: {
          include: {
            Municipio: {
              include: {
                Departamento: true,
              },
            },
          },
        },
        MotivoCancelacion: true,
        Sesion: true,
      },
      orderBy: [{ FechaCita: 'asc' }, { HoraCita: 'asc' }],
    });

    const contadores: Record<number, number> = {};

    const citasNumeradas = citas.map((cita) => {
      if (cita.ID_EstadoCita === ESTADOS_CITA.CANCELADA || cita.ID_EstadoCita === ESTADOS_CITA.NO_PROCESADA) {
        return {
          ...cita,
          NumeroSesion: null,
        };
      }

      const pacienteId = cita.ID_Paciente;

      if (!contadores[pacienteId]) {
        contadores[pacienteId] = 0;
      }

      contadores[pacienteId] += 1;

      return {
        ...cita,
        NumeroSesion: contadores[pacienteId],
      };
    });

    return citasNumeradas.reverse();
  },

  getCatalogos: async () => {
    const [tiposCita, estadosCita, metodosPago, bancos, divisas] = await Promise.all([
      prisma.tipoDeCita.findMany(),
      prisma.estadoCita.findMany(),
      prisma.metodoPago.findMany(),
      prisma.banco.findMany({
        where: {
          Activo: true,
        },
      }),
      prisma.divisa.findMany(),
    ]);

    return {
      tiposCita,
      estadosCita,
      metodosPago,
      bancos,
      divisas,
    };
  },

  getHorariosOcupados: async (
    psicologoId: number,
    fechaStr: string,
    usuario?: AuthUserPayload
  ) => {
    const psicologoPermitido = obtenerPsicologoPermitidoParaCita(psicologoId, usuario);
    const fechaBuscar = new Date(fechaStr);

    const citas = await prisma.cita.findMany({
      where: {
        ID_Psicologo: psicologoPermitido,
        FechaCita: fechaBuscar,
        ID_EstadoCita: {
          not: 3,
        },
      },
      select: {
        HoraCita: true,
      },
    });

    return citas.map((cita) => {
      const horaDb = new Date(cita.HoraCita);
      const hh = horaDb.getUTCHours().toString().padStart(2, '0');
      const mm = horaDb.getUTCMinutes().toString().padStart(2, '0');

      return `${hh}:${mm}`;
    });
  },

  create: async (data: CreateCitaDTO, usuario?: AuthUserPayload) => {
    const psicologoPermitido = obtenerPsicologoPermitidoParaCita(data.ID_Psicologo, usuario);

    const pacienteCheck = await prisma.paciente.findUnique({
      where: {
        ID_Paciente: data.ID_Paciente,
      },
      select: {
        Activo: true,
      },
    });

    if (!pacienteCheck || !pacienteCheck.Activo) {
      throw new Error('El paciente no existe o está INACTIVO.');
    }

    const psicologoCheck = await prisma.psicologo.findUnique({
      where: {
        ID_Psicologo: psicologoPermitido,
      },
      select: {
        Activo: true,
      },
    });

    if (!psicologoCheck || !psicologoCheck.Activo) {
      throw new Error('El psicólogo no existe o está INACTIVO.');
    }

    if (data.ID_MetodoPago !== 1 && (!data.ID_Banco || !data.Numero_Referencia)) {
      throw new Error('Para transferencias o pagos con tarjeta, debe seleccionar un Banco e ingresar el Número de Referencia.');
    }

    const timeParts = data.HoraCita.split(':').map(Number);
    const horas = timeParts[0] ?? 0;
    const minutos = timeParts[1] ?? 0;

    if (Number.isNaN(horas) || Number.isNaN(minutos)) {
      throw new Error('Hora inválida');
    }

    const fechaIsoString = `${data.FechaCita}T${data.HoraCita}:00-06:00`;

    if (new Date(fechaIsoString) < new Date()) {
      throw new Error('No es posible agendar citas en el pasado.');
    }

    const fechaParaGuardar = new Date(data.FechaCita);
    fechaParaGuardar.setUTCHours(horas, minutos, 0, 0);

    const fechaSoloDia = new Date(data.FechaCita);

    await verificarDisponibilidad(psicologoPermitido, fechaSoloDia, fechaParaGuardar);

    const pago = await normalizarPago(data);

    return await prisma.$transaction(async (tx) => {
      const citaCreada = await tx.cita.create({
        data: {
          FechaCita: fechaSoloDia,
          HoraCita: fechaParaGuardar,
          MotivoConsulta: data.MotivoConsulta ?? null,
          ID_TipoCita: data.ID_TipoCita,
          ID_EstadoCita: data.ID_EstadoCita || ESTADOS_CITA.PENDIENTE,
          ID_Paciente: data.ID_Paciente,
          ID_Psicologo: psicologoPermitido,
          ID_Direccion: data.ID_Direccion,
        },
      });

      const fechaHoraActual = new Date();
      const horaPagoNica = new Date(fechaHoraActual.getTime() - 6 * 60 * 60 * 1000);

      const reciboCreado = await tx.recibo.create({
        data: {
          ID_Cita: citaCreada.ID_Cita,
          ID_Divisa: pago.idDivisa,
          ID_MetodoPago: data.ID_MetodoPago,
          FechaDePago: fechaHoraActual,
          HoraDePago: horaPagoNica,
          MontoTotal: pago.monto,
          Observacion: pago.codigoDivisa === 'USD'
            ? `Pago registrado al agendar cita. Equivalente C$ ${(pago.monto * pago.tasaCambio).toFixed(2)}`
            : 'Pago registrado al agendar cita',
          Tasa_Cambio: pago.tasaCambio,
          ID_Banco: data.ID_MetodoPago !== 1 ? data.ID_Banco ?? null : null,
          Numero_Referencia: data.ID_MetodoPago !== 1 ? data.Numero_Referencia ?? null : null,
        },
      });

      return {
        cita: citaCreada,
        recibo: reciboCreado,
      };
    });
  },

  update: async (id: number, data: UpdateCitaDTO, usuario?: AuthUserPayload) => {
    const result = await prisma.cita.findUnique({
      where: {
        ID_Cita: id,
      },
    });

    if (!result) {
      throw new Error('Cita no encontrada');
    }

    validarAccesoACitaExistente(result, usuario);

    if (data.ID_Psicologo !== undefined) {
      obtenerPsicologoPermitidoParaCita(data.ID_Psicologo, usuario);
    }

    const {
      ID_Psicologo: oldPsicologo,
      MotivoConsulta: oldMotivo,
      ID_TipoCita: oldTipoCita,
      ID_Paciente: oldPaciente,
      ID_Direccion: oldDireccion,
      ID_EstadoCita: oldEstado,
      FechaCita: oldFecha,
      HoraCita: oldHora,
    } = result;

    const fallbackFecha = oldFecha
      ? oldFecha.toISOString().substring(0, 10)
      : new Date().toISOString().substring(0, 10);

    const fallbackHora = oldHora
      ? oldHora.toISOString().substring(11, 16)
      : '08:00';

    const idPsicologo = data.ID_Psicologo ?? oldPsicologo;
    const fechaStr = data.FechaCita ?? fallbackFecha;
    const horaStr = data.HoraCita ?? fallbackHora;
    const finalMotivo = data.MotivoConsulta !== undefined ? data.MotivoConsulta : oldMotivo;
    const finalTipoCita = data.ID_TipoCita ?? oldTipoCita;
    const finalPaciente = data.ID_Paciente ?? oldPaciente;
    const finalDireccion = data.ID_Direccion ?? oldDireccion;
    const finalEstado = data.ID_EstadoCita ?? oldEstado;

    const timeParts = horaStr.split(':').map(Number);
    const horas = timeParts[0] ?? 0;
    const minutos = timeParts[1] ?? 0;

    if (Number.isNaN(horas) || Number.isNaN(minutos)) {
      throw new Error('Hora inválida');
    }

    const fechaParaGuardar = new Date(fechaStr);
    fechaParaGuardar.setUTCHours(horas, minutos, 0, 0);

    const fechaSoloDia = new Date(fechaStr);
    const fechaIsoString = `${fechaStr}T${horaStr}:00-06:00`;

    if (new Date(fechaIsoString) < new Date()) {
      throw new Error('No puedes reprogramar la cita a una fecha/hora pasada.');
    }

    await verificarDisponibilidad(idPsicologo, fechaSoloDia, fechaParaGuardar, id);

    await prisma.$transaction(async (tx) => {
      await tx.cita.update({
        where: {
          ID_Cita: id,
        },
        data: {
          FechaCita: fechaSoloDia,
          HoraCita: fechaParaGuardar,
          MotivoConsulta: finalMotivo,
          ID_TipoCita: finalTipoCita,
          ID_Paciente: finalPaciente,
          ID_Psicologo: idPsicologo,
          ID_Direccion: finalDireccion,
          ID_EstadoCita: finalEstado,
        },
      });

      if (
        data.Precio !== undefined ||
        data.ID_Divisa !== undefined ||
        data.Tasa_Cambio !== undefined ||
        data.ID_MetodoPago !== undefined ||
        data.ID_Banco !== undefined ||
        data.Numero_Referencia !== undefined
      ) {
        const recibo = await tx.recibo.findFirst({
          where: {
            ID_Cita: id,
          },
        });

        if (recibo) {
          const metodoPagoFinal = data.ID_MetodoPago ?? recibo.ID_MetodoPago;
          const pago = await normalizarPago(data, recibo);

          await tx.recibo.update({
            where: {
              Cod_Recibo: recibo.Cod_Recibo,
            },
            data: {
              MontoTotal: pago.monto,
              ID_Divisa: pago.idDivisa,
              Tasa_Cambio: pago.tasaCambio,
              Observacion: pago.codigoDivisa === 'USD'
                ? `Pago actualizado. Equivalente C$ ${(pago.monto * pago.tasaCambio).toFixed(2)}`
                : recibo.Observacion,
              ID_MetodoPago: metodoPagoFinal,
              ID_Banco: metodoPagoFinal !== 1 ? data.ID_Banco ?? recibo.ID_Banco ?? null : null,
              Numero_Referencia: metodoPagoFinal !== 1
                ? data.Numero_Referencia ?? recibo.Numero_Referencia ?? null
                : null,
            },
          });
        }
      }
    });

    return {
      message: 'Cita actualizada correctamente',
    };
  },

  cancel: async (
    id: number,
    motivoId: number,
    notas: string,
    usuario?: AuthUserPayload
  ) => {
    const cita = await prisma.cita.findUnique({
      where: {
        ID_Cita: id,
      },
      select: {
        ID_Psicologo: true,
      },
    });

    if (!cita) {
      throw new Error('Cita no encontrada');
    }

    validarAccesoACitaExistente(cita, usuario);

    return await prisma.cita.update({
      where: {
        ID_Cita: id,
      },
      data: {
        ID_EstadoCita: ESTADOS_CITA.CANCELADA,
        ID_MotivoCancelacion: Number(motivoId),
        NotasCancelacion: notas,
      },
    });
  },

  procesarInasistencias: async () => {
    const ahora = new Date();

    const citasPendientes = await prisma.cita.findMany({
      where: {
        ID_EstadoCita: ESTADOS_CITA.PENDIENTE,
        Sesion: null,
      },
      select: {
        ID_Cita: true,
        FechaCita: true,
        HoraCita: true,
      },
    });

    const citasVencidasIds = citasPendientes
      .filter((cita) => {
        const fechaHoraCita = construirFechaHoraCita(cita.FechaCita, cita.HoraCita);
        const fechaLimite = sumarMinutos(fechaHoraCita, MINUTOS_GRACIA_INASISTENCIA);

        return fechaLimite < ahora;
      })
      .map((cita) => cita.ID_Cita);

    if (citasVencidasIds.length === 0) {
      return {
        procesadas: 0,
      };
    }

    const resultado = await prisma.cita.updateMany({
      where: {
        ID_Cita: {
          in: citasVencidasIds,
        },
        ID_EstadoCita: ESTADOS_CITA.PENDIENTE,
        Sesion: null,
      },
      data: {
        ID_EstadoCita: ESTADOS_CITA.NO_PROCESADA,
        ID_MotivoCancelacion: MOTIVOS_CANCELACION.INASISTENCIA_SIN_AVISO,
        NotasCancelacion: 'Inasistencia sin aviso registrada automáticamente por el sistema.',
      },
    });

    return {
      procesadas: resultado.count,
    };
  },
};
