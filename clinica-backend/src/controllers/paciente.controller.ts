import type { Request, Response } from 'express';
import { PacienteService } from '../services/paciente.service.js';

const getErrorMessage = (error: unknown, fallback: string) => {
  return error instanceof Error ? error.message : fallback;
};

const getStatusFromError = (message: string) => {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('no autorizado')) return 401;

  if (
    lowerMessage.includes('no tiene permisos') ||
    lowerMessage.includes('no tiene un perfil')
  ) {
    return 403;
  }

  return 400;
};

export const getPacientes = async (req: Request, res: Response): Promise<void> => {
  try {
    const pacientes = await PacienteService.getAll(req.user);
    res.json(pacientes);
  } catch (error: unknown) {
    const message = getErrorMessage(error, 'Error interno del servidor');
    res.status(getStatusFromError(message)).json({ error: message });
  }
};

export const getExpediente = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: 'El ID proporcionado no es válido' });
      return;
    }

    const expediente = await PacienteService.getExpediente(id, req.user);

    if (!expediente) {
      res.status(404).json({ error: 'Paciente no encontrado' });
      return;
    }

    res.json(expediente);
  } catch (error: unknown) {
    const message = getErrorMessage(error, 'Error al obtener expediente');
    res.status(getStatusFromError(message)).json({ error: message });
  }
};

export const createPaciente = async (req: Request, res: Response): Promise<void> => {
  try {
    const nuevoPaciente = await PacienteService.create(req.body, req.user);
    res.status(201).json(nuevoPaciente);
  } catch (error: unknown) {
    const message = getErrorMessage(error, 'Error al crear paciente');
    res.status(getStatusFromError(message)).json({ error: message });
  }
};

export const updatePaciente = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: 'El ID proporcionado no es válido' });
      return;
    }

    const result = await PacienteService.update(id, req.body, req.user);
    res.json(result);
  } catch (error: unknown) {
    const message = getErrorMessage(error, 'Error al actualizar paciente');
    res.status(getStatusFromError(message)).json({ error: message });
  }
};

export const getHistorialPaciente = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: 'El ID proporcionado no es válido' });
      return;
    }

    const historial = await PacienteService.getHistorialPaciente(id, req.user);
    res.json(historial);
  } catch (error: unknown) {
    const message = getErrorMessage(error, 'Error buscando historial clínico');
    console.error(error);
    res.status(getStatusFromError(message)).json({ error: message });
  }
};
