import type { Request, Response } from 'express';
import { CitaService } from '../services/cita.service.js';

// GET: Obtener todas las citas
export const getCitas = async (req: Request, res: Response): Promise<void> => {
  try {
    const citas = await CitaService.getAll();
    res.json(citas);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener citas' });
  }
};

// GET: Catálogos
export const getCatalogosCitas = async (req: Request, res: Response): Promise<void> => {
  try {
    const catalogos = await CitaService.getCatalogos();
    res.json(catalogos);
  } catch (error: any) {
    res.status(500).json({ error: 'Error cargando catálogos de citas' });
  }
};

// POST: Crear Cita
export const createCita = async (req: Request, res: Response): Promise<void> => {
  try {
    // Zod ya validó y transformó req.body, se lo pasamos directo al Service
    const result = await CitaService.create(req.body);
    res.status(201).json(result);
  } catch (error: any) {
    console.error(error);

    // 1. DETECCIÓN DEL ERROR DE DISPONIBILIDAD (Conflicto)
    if (error.message === 'El psicólogo ya tiene una cita agendada en este horario.') {
      res.status(409).json({ error: error.message });
      return;
    }

    // 2. ERRORES DE VALIDACIÓN GENERALES
    res.status(400).json({ error: error.message });
  }
};

// PUT: Editar Cita
export const updateCita = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) {
        res.status(400).json({ error: 'El ID proporcionado no es válido' });
        return;
    }

    const result = await CitaService.update(id, req.body);
    res.json(result);
  } catch (error: any) {
    console.error(error);
    
    if (error.message === 'El psicólogo ya tiene una cita agendada en este horario.') {
      res.status(409).json({ error: error.message });
      return;
    }
    
    res.status(400).json({ error: error.message });
  }
};

// PATCH: Cancelar Cita
export const cancelCita = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) {
        res.status(400).json({ error: 'El ID proporcionado no es válido' });
        return;
    }

    // Usamos los nombres exactos que envía el Frontend
    const { ID_MotivoCancelacion, NotasCancelacion } = req.body; 

    if (!ID_MotivoCancelacion) {
      res.status(400).json({ error: "Debe seleccionar un motivo." });
      return;
    }

    await CitaService.cancel(id, Number(ID_MotivoCancelacion), NotasCancelacion || '');
    res.json({ message: 'Cita cancelada correctamente' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};