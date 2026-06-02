import type { Request, Response } from 'express';
import { SesionService } from '../services/sesion.service.js';

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
  HoraFinal: string;
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
    FechaInicio: toStringValue(value.FechaInicio) || new Date().toISOString(),
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
    HoraFinal: toStringValue(body.HoraFinal),
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
  if (!Number.isInteger(payload.ID_Cita) || payload.ID_Cita <= 0) {
    return 'ID_Cita es requerido y debe ser un número válido.';
  }

  if (!payload.HoraDeInicio) {
    return 'HoraDeInicio es requerida.';
  }

  if (!payload.HoraFinal) {
    return 'HoraFinal es requerida.';
  }

  if (!payload.Observaciones) {
    return 'Observaciones es requerido.';
  }

  if (!payload.DiagnosticoDiferencial) {
    return 'DiagnosticoDiferencial es requerido.';
  }

  if (!payload.HistorialDeEvolucion) {
    return 'HistorialDeEvolucion es requerido.';
  }

  if (!payload.Criterios_DeDiagnostico) {
    return 'Criterios_DeDiagnostico es requerido.';
  }

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

    res.status(201).json(result);
  } catch (error: unknown) {
    const message = getErrorMessage(error, 'Error al guardar la sesión completa');
    console.error(error);
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
