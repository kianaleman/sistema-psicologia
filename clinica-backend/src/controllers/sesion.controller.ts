import type { Request, Response } from 'express';
import { SesionService } from '../services/sesion.service.js';

export const createSesion = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      citaId, observaciones, diagnostico, criterios, 
      historial, horaInicio, tratamientos, exploracionIds 
    } = req.body;

    const result = await SesionService.create({
      citaId: parseInt(citaId),
      // pacienteId y psicologoId fueron eliminados, el servicio los extrae de la Cita
      observaciones,
      diagnostico,
      criterios,
      historial,
      horaInicio,
      tratamientos: tratamientos || [],
      exploracionIds: exploracionIds || []
    });

    res.status(201).json(result);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Error al guardar la sesión completa' });
  }
};

export const searchSesion = async (req: Request, res: Response): Promise<void> => {
  try {
    // Extraemos y convertimos directamente asegurando los tipos
    const pacienteId = Number(req.query.pacienteId);
    const psicologoId = Number(req.query.psicologoId);
    
    // Validamos que existan y que no sean NaN (Not a Number)
    if (!req.query.pacienteId || !req.query.psicologoId || isNaN(pacienteId) || isNaN(psicologoId)) {
        res.status(400).json({ error: 'Faltan IDs requeridos o el formato es inválido' });
        return;
    }

    const sesion = await SesionService.findByParams(pacienteId, psicologoId);
    
    if (sesion) {
        res.json(sesion);
    } else {
        res.status(404).json({ error: 'Sesión no encontrada' });
    }
    
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Error en búsqueda de sesión' });
  }
};