import type { Request, Response } from 'express';
import { CitaService } from '../services/cita.service.js';

export const getCitas = async (req: Request, res: Response) => {
  try {
    const citas = await CitaService.getAll();
    res.json(citas);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener citas' });
  }
};

export const getCatalogosCitas = async (req: Request, res: Response) => {
  try {
    const catalogos = await CitaService.getFilters();
    res.json(catalogos);
  } catch (error) {
    res.status(500).json({ error: 'Error cargando catálogos' });
  }
};

export const createCita = async (req: Request, res: Response) => {
  try {
    // El servicio ya retorna el objeto creado (o el resultado de la transacción)
    const result = await CitaService.create(req.body);
    
    // Simplificamos la respuesta: devolvemos directamente el resultado
    res.json(result); 

  } catch (error: any) {
    if (error.message.includes('agendada')) {
      return res.status(409).json({ error: error.message });
    }
    res.status(400).json({ error: error.message });
  }
};

export const updateCita = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await CitaService.update(Number(id), req.body);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const cancelCita = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { motivoId, notas } = req.body;
    await CitaService.cancel(Number(id), Number(motivoId), notas);
    res.json({ message: 'Cita cancelada correctamente' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};