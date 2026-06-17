import type { Request, Response } from 'express';
import { SesionService } from '../services/sesion.service.js';
import { AuditoriaService } from '../services/auditoria.service.js';

type TratamientoDTO = {
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
};

type CreateSesionDTO = {
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
};

const esObjeto = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const toNumber = (value: unknown): number => {
  return Number(value);
};

const toStringValue = (value: unknown): string => {
  return typeof value === 'string' ? value.trim() : '';
};

const crearFechaActualLocal = () => {
  const fecha = new Date();
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, '0');
  const day = String(fecha.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const crearHoraActualLocal = () => {
  const fecha = new Date();
  const hours = String(fecha.getHours()).padStart(2, '0');
  const minutes = String(fecha.getMinutes()).padStart(2, '0');
  const seconds = String(fecha.getSeconds()).padStart(2, '0');

  return `${hours}:${minutes}:${seconds}`;
};

const normalizarExploraciones = (value: unknown): number[] => {
  if (!Array.isArray(value)) return [];

  return value
    .map((id) => Number(id))
    .filter((id) => Number.isInteger(id) && id > 0);
};

const normalizarTratamiento = (value: unknown): TratamientoDTO | undefined => {
  if (!esObjeto(value)) return undefined;

  const tipo = value.Tipo;

  if (tipo !== 'farmaceutico' && tipo !== 'terapeutico') {
    return undefined;
  }

  const tratamientoBase: TratamientoDTO = {
    Tipo: tipo,
    Frecuencia: toStringValue(value.Frecuencia) || 'Según indicación',
    FechaInicio: toStringValue(value.FechaInicio) || crearFechaActualLocal(),
  };

  const fechaFin = toStringValue(value.FechaFin);

  if (fechaFin) {
    tratamientoBase.FechaFin = fechaFin;
  }

  if (tipo === 'farmaceutico' && esObjeto(value.Farmaceutico)) {
    tratamientoBase.Farmaceutico = {
      ID_ViaAdministracion: toNumber(value.Farmaceutico.ID_ViaAdministracion),
      Nombre_Medicamento: toStringValue(value.Farmaceutico.Nombre_Medicamento),
      Dosis: toStringValue(value.Farmaceutico.Dosis),
    };
  }

  if (tipo === 'terapeutico' && esObjeto(value.Terapeutico)) {
    tratamientoBase.Terapeutico = {
      ID_Tipo_Terapia: toNumber(value.Terapeutico.ID_Tipo_Terapia),
      Objetivo: toStringValue(value.Terapeutico.Objetivo),
    };
  }

  return tratamientoBase;
};

const normalizarBody = (body: unknown): CreateSesionDTO | null => {
  if (!esObjeto(body)) return null;

  const payload: CreateSesionDTO = {
    ID_Cita: toNumber(body.ID_Cita),
    ID_Expediente: toNumber(body.ID_Expediente || 0),
    HoraDeInicio: toStringValue(body.HoraDeInicio),
    HoraFinal: toStringValue(body.HoraFinal) || crearHoraActualLocal(),
    Observaciones: toStringValue(body.Observaciones),
    DiagnosticoDiferencial: toStringValue(body.DiagnosticoDiferencial),
    HistorialDeEvolucion: toStringValue(body.HistorialDeEvolucion),
    Criterios_DeDiagnostico: toStringValue(body.Criterios_DeDiagnostico),
    ExploracionesIds: normalizarExploraciones(body.ExploracionesIds),
  };

  const tratamiento = normalizarTratamiento(body.Tratamiento);

  if (tratamiento) {
    payload.Tratamiento = tratamiento;
  }

  return payload;
};

const validarPayload = (payload: CreateSesionDTO): string | null => {
  if (!Number.isInteger(payload.ID_Cita) || payload.ID_Cita <= 0) return 'ID_Cita es requerido y debe ser un número válido.';
  if (!payload.HoraDeInicio) return 'HoraDeInicio es requerida.';
  if (!payload.Observaciones) return 'Observaciones es requerido.';
  if (!payload.DiagnosticoDiferencial) return 'DiagnosticoDiferencial es requerido.';
  if (!payload.HistorialDeEvolucion) return 'HistorialDeEvolucion es requerido.';
  if (!payload.Criterios_DeDiagnostico) return 'Criterios_DeDiagnostico es requerido.';

  return null;
};

const getErrorMessage = (error: unknown, fallback: string) => {
  return error instanceof Error ? error.message : fallback;
};

const getStatusFromError = (message: string) => {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('no autorizado')) return 401;

  if (
    lowerMessage.includes('no tiene permisos') ||
    lowerMessage.includes('otro psicólogo') ||
    lowerMessage.includes('no tiene un perfil')
  ) {
    return 403;
  }

  if (
    lowerMessage.includes('requerido') ||
    lowerMessage.includes('requerida') ||
    lowerMessage.includes('inválido') ||
    lowerMessage.includes('inválida') ||
    lowerMessage.includes('no existe') ||
    lowerMessage.includes('ya tiene') ||
    lowerMessage.includes('formato inválido')
  ) {
    return 400;
  }

  return 500;
};

const resumenSesionParaAuditoria = (payload: CreateSesionDTO) => {
  return {
    ID_Cita: payload.ID_Cita,
    ID_Expediente: payload.ID_Expediente,
    HoraDeInicio: payload.HoraDeInicio,
    HoraFinal: payload.HoraFinal || crearHoraActualLocal(),
    camposClinicosRegistrados: [
      'Observaciones',
      'DiagnosticoDiferencial',
      'HistorialDeEvolucion',
      'Criterios_DeDiagnostico',
    ],
    ExploracionesIds: payload.ExploracionesIds || [],
    Tratamiento: payload.Tratamiento
      ? {
          Tipo: payload.Tratamiento.Tipo,
          Frecuencia: payload.Tratamiento.Frecuencia,
          FechaInicio: payload.Tratamiento.FechaInicio,
          FechaFin: payload.Tratamiento.FechaFin,
        }
      : null,
  };
};

export const createSesion = async (req: Request, res: Response): Promise<void> => {
  try {
    const payload = normalizarBody(req.body);

    if (!payload) {
      res.status(400).json({ error: 'Cuerpo de petición inválido.' });
      return;
    }

    const validationError = validarPayload(payload);

    if (validationError) {
      res.status(400).json({ error: validationError });
      return;
    }

    const result = await SesionService.create(payload, req.user);

    await AuditoriaService.registrarDesdeRequest(req, {
      accion: 'SESION_CLINICA_CREADA',
      modulo: 'SESIONES',
      entidad: 'Sesion',
      idEntidad: result.ID_Sesion,
      resultado: 'EXITO',
      codigoEstado: 201,
      mensaje: 'Sesión clínica registrada correctamente.',
      datosDespues: resumenSesionParaAuditoria(payload),
    });

    res.status(201).json(result);
  } catch (error: unknown) {
    const message = getErrorMessage(error, 'Error al guardar la sesión completa');
    console.error(error);

    await AuditoriaService.registrarDesdeRequest(req, {
      accion: 'SESION_CLINICA_CREADA',
      modulo: 'SESIONES',
      entidad: 'Sesion',
      resultado: 'FALLO',
      codigoEstado: getStatusFromError(message),
      mensaje: message,
      datosDespues: {
        ID_Cita: req.body?.ID_Cita,
        ID_Expediente: req.body?.ID_Expediente,
      },
    });

    res.status(getStatusFromError(message)).json({ error: message });
  }
};

export const searchSesion = async (req: Request, res: Response): Promise<void> => {
  try {
    const pacienteId = Number(req.query.pacienteId);
    const psicologoId = Number(req.query.psicologoId);

    if (
      !req.query.pacienteId ||
      !req.query.psicologoId ||
      Number.isNaN(pacienteId) ||
      Number.isNaN(psicologoId)
    ) {
      res.status(400).json({ error: 'Faltan IDs requeridos o el formato es inválido' });
      return;
    }

    const sesion = await SesionService.findByParams(pacienteId, psicologoId, req.user);

    if (sesion) {
      await AuditoriaService.registrarDesdeRequest(req, {
        accion: 'SESION_CLINICA_CONSULTADA',
        modulo: 'SESIONES',
        entidad: 'Sesion',
        idEntidad: sesion.ID_Sesion,
        resultado: 'EXITO',
        codigoEstado: 200,
        mensaje: 'Sesión clínica consultada.',
        datosDespues: {
          pacienteId,
          psicologoId,
          ID_Sesion: sesion.ID_Sesion,
        },
      });

      res.json(sesion);
      return;
    }

    res.status(404).json({ error: 'Sesión no encontrada' });
  } catch (error: unknown) {
    const message = getErrorMessage(error, 'Error en búsqueda de sesión');
    console.error(error);
    res.status(getStatusFromError(message)).json({ error: message });
  }
};
