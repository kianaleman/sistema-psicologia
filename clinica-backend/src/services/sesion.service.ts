import { PrismaClient } from '@prisma/client';
import type { AuthUserPayload } from '../middlewares/auth.middleware.js';

const prisma = new PrismaClient();

interface TratamientoDTO {
  id?: number;
  Frecuencia: string;
  Tipo: 'farmaceutico' | 'terapeutico';
  FechaInicio: string;
  FechaFin?: string;
  Farmaceutico?: {
    ID_ViaAdministracion: number;
    Nombre_Medicamento: string;
    Dosis: string;
  };
  Terapeutico?: {
    ID_Tipo_Terapia: number;
    Objetivo: string;
  };
}

interface CreateSesionDTO {
  ID_Cita: number;
  ID_Expediente: number;
  HoraDeInicio: string;
  HoraFinal?: string;
  Observaciones: string;
  DiagnosticoDiferencial: string;
  HistorialDeEvolucion: string;
  Criterios_DeDiagnostico: string;
  ExploracionesIds?: number[];
  Tratamiento?: TratamientoDTO;
}

type CitaSesionPermiso = {
  ID_Psicologo: number;
};

const normalizarTexto = (value: string) => {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
};

const tieneRol = (usuario: AuthUserPayload, rolesValidos: string[]) => {
  const rolesUsuario = usuario.roles.map(normalizarTexto);
  const rolesValidosNormalizados = rolesValidos.map(normalizarTexto);

  return rolesUsuario.some((rol) => rolesValidosNormalizados.includes(rol));
};

const esUsuarioAdmin = (usuario: AuthUserPayload) => {
  return Boolean(
    usuario.esAdmin ||
    tieneRol(usuario, ['Administrador', 'Admin', 'ADMINISTRADOR', 'ADMIN'])
  );
};

const esUsuarioPsicologo = (usuario: AuthUserPayload) => {
  return Boolean(
    usuario.esPsicologo ||
    tieneRol(usuario, ['Psicologo', 'Psicólogo', 'PSICOLOGO'])
  );
};

const validarUsuarioAutenticado = (usuario?: AuthUserPayload) => {
  if (!usuario || !usuario.idUsuario) {
    throw new Error('Acceso denegado. No se proporcionó un token válido.');
  }

  return usuario;
};

const validarPsicologoVinculado = (usuario: AuthUserPayload) => {
  if (!usuario.idPsicologo) {
    throw new Error('El usuario psicólogo no tiene un perfil de psicólogo vinculado.');
  }

  return usuario.idPsicologo;
};

const validarPuedeGestionarSesion = (
  cita: CitaSesionPermiso,
  usuario?: AuthUserPayload
) => {
  const usuarioActual = validarUsuarioAutenticado(usuario);

  if (esUsuarioAdmin(usuarioActual)) {
    return;
  }

  if (esUsuarioPsicologo(usuarioActual)) {
    const idPsicologo = validarPsicologoVinculado(usuarioActual);

    if (cita.ID_Psicologo !== idPsicologo) {
      throw new Error('No tiene permisos para registrar sesiones de una cita asignada a otro psicólogo.');
    }

    return;
  }

  throw new Error('No tiene permisos para registrar sesiones clínicas.');
};

const validarId = (value: number, field: string) => {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${field} inválido.`);
  }
};

const construirFechaDesdeHora = (hora: number, minuto: number, segundo = 0) => {
  if (
    !Number.isInteger(hora) ||
    !Number.isInteger(minuto) ||
    !Number.isInteger(segundo) ||
    hora < 0 ||
    hora > 23 ||
    minuto < 0 ||
    minuto > 59 ||
    segundo < 0 ||
    segundo > 59
  ) {
    return null;
  }

  return new Date(1970, 0, 1, hora, minuto, segundo, 0);
};

const obtenerHoraSistemaActual = () => {
  const ahora = new Date();
  const horaActual = construirFechaDesdeHora(
    ahora.getHours(),
    ahora.getMinutes(),
    ahora.getSeconds()
  );

  return horaActual || new Date(1970, 0, 1, 0, 0, 0, 0);
};

const construirFecha = (value: string, field: string) => {
  const rawValue = value?.trim();

  if (!rawValue) {
    throw new Error(`${field} es requerido.`);
  }

  const timeOnlyMatch = rawValue.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\.\d{1,3})?(?:Z)?$/);

  if (timeOnlyMatch) {
    const hora = Number(timeOnlyMatch[1]);
    const minuto = Number(timeOnlyMatch[2]);
    const segundo = Number(timeOnlyMatch[3] || 0);
    const fecha = construirFechaDesdeHora(hora, minuto, segundo);

    if (!fecha) {
      throw new Error(`${field} tiene un formato inválido.`);
    }

    return fecha;
  }

  const dateOnlyMatch = rawValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (dateOnlyMatch) {
    const year = Number(dateOnlyMatch[1]);
    const month = Number(dateOnlyMatch[2]);
    const day = Number(dateOnlyMatch[3]);

    return new Date(year, month - 1, day, 12, 0, 0, 0);
  }

  const localDateTimeMatch = rawValue.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/);

  if (localDateTimeMatch) {
    const year = Number(localDateTimeMatch[1]);
    const month = Number(localDateTimeMatch[2]);
    const day = Number(localDateTimeMatch[3]);
    const hour = Number(localDateTimeMatch[4]);
    const minute = Number(localDateTimeMatch[5]);
    const second = Number(localDateTimeMatch[6] || 0);

    return new Date(year, month - 1, day, hour, minute, second, 0);
  }

  const fecha = new Date(rawValue);

  if (!Number.isNaN(fecha.getTime())) {
    return fecha;
  }

  throw new Error(`${field} tiene un formato inválido. Valor recibido: ${rawValue}`);
};

const normalizarExploraciones = (ids?: number[]) => {
  return (ids || [])
    .map((id) => Number(id))
    .filter((id) => Number.isInteger(id) && id > 0);
};

const construirNumeroExpediente = (pacienteId: number) => {
  const timestamp = Date.now();

  return `EXP-${pacienteId}-${timestamp}`;
};

export const SesionService = {
  create: async (data: CreateSesionDTO, usuario?: AuthUserPayload) => {
    validarId(data.ID_Cita, 'ID_Cita');

    return await prisma.$transaction(async (tx) => {
      const citaActual = await tx.cita.findUnique({
        where: {
          ID_Cita: data.ID_Cita,
        },
        select: {
          ID_Cita: true,
          ID_Paciente: true,
          ID_Psicologo: true,
          Sesion: {
            select: {
              ID_Sesion: true,
            },
          },
        },
      });

      if (!citaActual) {
        throw new Error('La cita proporcionada no existe.');
      }

      validarPuedeGestionarSesion(citaActual, usuario);

      if (citaActual.Sesion) {
        throw new Error('Esta cita ya tiene una sesión registrada.');
      }

      let expedienteId: number | null = null;

      if (Number.isInteger(data.ID_Expediente) && data.ID_Expediente > 0) {
        const expedientePorId = await tx.expediente.findFirst({
          where: {
            ID_Expediente: data.ID_Expediente,
            ID_Paciente: citaActual.ID_Paciente,
          },
          select: {
            ID_Expediente: true,
          },
        });

        if (expedientePorId) {
          expedienteId = expedientePorId.ID_Expediente;
        }
      }

      if (!expedienteId) {
        const expedienteExistente = await tx.expediente.findFirst({
          where: {
            ID_Paciente: citaActual.ID_Paciente,
          },
          orderBy: {
            ID_Expediente: 'asc',
          },
          select: {
            ID_Expediente: true,
          },
        });

        if (expedienteExistente) {
          expedienteId = expedienteExistente.ID_Expediente;
        }
      }

      if (!expedienteId) {
        const nuevoExpediente = await tx.expediente.create({
          data: {
            No_Expediente: construirNumeroExpediente(citaActual.ID_Paciente),
            FechaIngreso: new Date(),
            ID_Paciente: citaActual.ID_Paciente,
          },
          select: {
            ID_Expediente: true,
          },
        });

        expedienteId = nuevoExpediente.ID_Expediente;
      }

      const nuevaSesion = await tx.sesion.create({
        data: {
          ID_Cita: data.ID_Cita,
          ID_Expediente: expedienteId,
          HoraDeInicio: construirFecha(data.HoraDeInicio, 'HoraDeInicio'),
          HoraFinal: obtenerHoraSistemaActual(),
          Observaciones: data.Observaciones,
          DiagnosticoDiferencial: data.DiagnosticoDiferencial,
          HistorialDeEvolucion: data.HistorialDeEvolucion,
          Criterios_DeDiagnostico: data.Criterios_DeDiagnostico,
        },
      });

      if (data.Tratamiento) {
        const tratamiento = data.Tratamiento;

        const tratamientoBase = await tx.tratamiento.create({
          data: {
            ID_Sesion: nuevaSesion.ID_Sesion,
            FechaInicio: construirFecha(tratamiento.FechaInicio, 'FechaInicio del tratamiento'),
            Frecuencia: tratamiento.Frecuencia || 'Según indicación',
            ID_Psicologo_Firma: citaActual.ID_Psicologo,
          },
        });

        if (tratamiento.Tipo === 'farmaceutico' && tratamiento.Farmaceutico) {
          validarId(tratamiento.Farmaceutico.ID_ViaAdministracion, 'ID_ViaAdministracion');

          await tx.tratamiento_Farmaceutico.create({
            data: {
              ID_Tratamiento_Farmaceutico: tratamientoBase.ID_Tratamiento,
              ID_ViaAdministracion: tratamiento.Farmaceutico.ID_ViaAdministracion,
              Nombre_Medicamento: tratamiento.Farmaceutico.Nombre_Medicamento,
              Dosis: tratamiento.Farmaceutico.Dosis,
            },
          });
        }

        if (tratamiento.Tipo === 'terapeutico' && tratamiento.Terapeutico) {
          validarId(tratamiento.Terapeutico.ID_Tipo_Terapia, 'ID_Tipo_Terapia');

          await tx.tratamiento_Terapeutico.create({
            data: {
              ID_TratamientoTerapeutico: tratamientoBase.ID_Tratamiento,
              ID_Tipo_Terapia: tratamiento.Terapeutico.ID_Tipo_Terapia,
              Objetivo: tratamiento.Terapeutico.Objetivo,
            },
          });
        }
      }

      const exploracionesIds = normalizarExploraciones(data.ExploracionesIds);

      if (exploracionesIds.length > 0) {
        await tx.sesion_ExploracionPsicologica.createMany({
          data: exploracionesIds.map((id) => ({
            ID_Sesion: nuevaSesion.ID_Sesion,
            ID_ExploracionPsicologica: id,
          })),
        });
      }

      await tx.cita.update({
        where: {
          ID_Cita: data.ID_Cita,
        },
        data: {
          ID_EstadoCita: 2,
        },
      });

      return nuevaSesion;
    });
  },

  findByParams: async (
    pacienteId: number,
    psicologoId: number,
    usuario?: AuthUserPayload
  ) => {
    const usuarioActual = validarUsuarioAutenticado(usuario);

    if (!esUsuarioAdmin(usuarioActual) && !esUsuarioPsicologo(usuarioActual)) {
      throw new Error('No tiene permisos para consultar sesiones clínicas.');
    }

    let idPsicologoConsulta = psicologoId;

    if (esUsuarioPsicologo(usuarioActual) && !esUsuarioAdmin(usuarioActual)) {
      const idPsicologo = validarPsicologoVinculado(usuarioActual);

      if (psicologoId !== idPsicologo) {
        throw new Error('No tiene permisos para consultar sesiones de otro psicólogo.');
      }

      idPsicologoConsulta = idPsicologo;
    }

    const cita = await prisma.cita.findFirst({
      where: {
        ID_Paciente: pacienteId,
        ID_Psicologo: idPsicologoConsulta,
        ID_EstadoCita: 2,
      },
      orderBy: {
        FechaCita: 'desc',
      },
      include: {
        Sesion: {
          include: {
            Expediente: true,
          },
        },
      },
    });

    return cita ? cita.Sesion : null;
  },
};
