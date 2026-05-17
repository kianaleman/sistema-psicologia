import type { Request, Response } from 'express';
import { PsicologoService } from '../services/psicologo.service.js';

export const getPsicologos = async (_req: Request, res: Response): Promise<void> => {
  try {
    const psicologos = await PsicologoService.getAll();
    res.json(psicologos);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al obtener los psicólogos' });
  }
};

export const createPsicologo = async (req: Request, res: Response): Promise<void> => {
  try {
    // El req.body ahora debe incluir el codigoTelefonoId además del telefono
    const psicologo = await PsicologoService.create(req.body);
    res.status(201).json(psicologo);
  } catch (error: any) {
    // Devolvemos 400 para errores de validación (como teléfono inválido o faltante)
    res.status(400).json({ error: error.message });
  }
};

export const updatePsicologo = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) {
        res.status(400).json({ error: 'El ID proporcionado no es válido' });
        return;
    }

    const psicologo = await PsicologoService.update(id, req.body);
    res.json(psicologo);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};