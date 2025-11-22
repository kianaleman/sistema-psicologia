import type { Request, Response } from 'express';
import { SesionService } from '../services/sesion.service';

export const createSesion = async (req: Request, res: Response) => {
  try {
    const { 
      citaId, pacienteId, psicologoId, observaciones, diagnostico, criterios, 
      historial, horaInicio, tratamientos, exploracionIds 
    } = req.body;

    const result = await SesionService.create({
      citaId: parseInt(citaId),
      pacienteId: parseInt(pacienteId),
      psicologoId: parseInt(psicologoId),
      observaciones,
      diagnostico,
      criterios,
      historial,
      horaInicio,
      tratamientos: tratamientos || [],
      exploracionIds: exploracionIds || []
    });

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al guardar la sesión completa' });
  }
};

export const searchSesion = async (req: Request, res: Response) => {
  const { pacienteId, psicologoId } = req.query;
  
  if (!pacienteId || !psicologoId) {
      return res.status(400).json({ error: 'Faltan IDs requeridos' });
  }

  try {
    const sesion = await SesionService.findByParams(
        Number(pacienteId), 
        Number(psicologoId)
    );
    
    if (sesion) res.json(sesion);
    else res.status(404).json({ error: 'Sesión no encontrada' });
    
  } catch (error) {
    res.status(500).json({ error: 'Error en búsqueda de sesión' });
  }
};