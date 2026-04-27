import type { Request, Response } from 'express';
import { SesionService } from '../services/sesion.service.js';

export const createSesion = async (req: Request, res: Response) => {
  try {
    const { 
      citaId, 
      pacienteId, 
      psicologoId, 
      observaciones, 
      diagnostico, 
      criterios, 
      historial, 
      horaInicio, 
      horaFinal, 
      tratamientos, 
      exploracionIds 
    } = req.body;

    const result = await SesionService.create({
      // 🟢 Aseguramos que los IDs sean numéricos antes de pasarlos al servicio
      citaId: Number(citaId),
      pacienteId: Number(pacienteId),
      psicologoId: Number(psicologoId),
      observaciones,
      diagnostico,
      criterios,
      historial,
      horaInicio,
      horaFinal,
      tratamientos: tratamientos || [],
      exploracionIds: exploracionIds || []
    });

    res.json(result);
  } catch (error: any) {
    console.error(error);
    // Enviamos el mensaje real del error para diagnóstico
    res.status(500).json({ 
      error: error.message || 'Error al guardar la sesión completa' 
    });
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