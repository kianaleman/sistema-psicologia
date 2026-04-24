import type { Request, Response } from 'express';
import { PsicologoService } from '../services/psicologo.service';

export const getPsicologos = async (_req: Request, res: Response) => {
  try {
    const psicologos = await PsicologoService.getAll();
    res.json(psicologos);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createPsicologo = async (req: Request, res: Response) => {
  try {
    // CORRECCIÓN: Pasamos req.body completo para no perder el campo 'telefono'
    const psicologo = await PsicologoService.create(req.body);
    res.json(psicologo);
  } catch (error: any) {
    // Devolvemos 400 para errores de validación (como teléfono inválido)
    res.status(400).json({ error: error.message });
  }
};

export const updatePsicologo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const psicologo = await PsicologoService.update(Number(id), req.body);
    res.json(psicologo);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};