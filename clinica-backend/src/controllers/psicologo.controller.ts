import type { Request, Response } from 'express';
import { PsicologoService } from '../services/psicologo.service.js';

const getErrorMessage = (error: unknown, fallback: string) => {
  return error instanceof Error ? error.message : fallback;
};

export const getPsicologos = async (_req: Request, res: Response): Promise<void> => {
  try {
    const psicologos = await PsicologoService.getAll();
    res.json(psicologos);
  } catch (error: unknown) {
    res.status(500).json({
      error: getErrorMessage(error, 'Error al obtener los psicólogos'),
    });
  }
};

export const createPsicologo = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await PsicologoService.create(req.body);
    res.status(201).json(result);
  } catch (error: unknown) {
    res.status(400).json({
      error: getErrorMessage(error, 'Error al registrar el psicólogo'),
    });
  }
};

export const updatePsicologo = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: 'El ID proporcionado no es válido' });
      return;
    }

    const psicologo = await PsicologoService.update(id, req.body);
    res.json(psicologo);
  } catch (error: unknown) {
    res.status(400).json({
      error: getErrorMessage(error, 'Error al actualizar el psicólogo'),
    });
  }
};
