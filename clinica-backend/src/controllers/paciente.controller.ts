import type { Request, Response } from 'express';
import { PacienteService } from '../services/paciente.service'; 

// GET: Obtener todos los pacientes
export const getPacientes = async (req: Request, res: Response) => {
  try {
    const pacientes = await PacienteService.getAll();
    res.json(pacientes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET: Obtener expediente completo de UNO
export const getExpediente = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    // Toda la lógica de matching secuencial y Promise.all ahora vive aquí:
    const expediente = await PacienteService.getExpediente(Number(id));
    
    if (!expediente) {
        return res.status(404).json({ error: 'Paciente no encontrado' });
    }
    
    res.json(expediente);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST: Crear Paciente
export const createPaciente = async (req: Request, res: Response) => {
  try {
    const nuevoPaciente = await PacienteService.create(req.body);
    res.json(nuevoPaciente);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// PUT: Actualizar Paciente
export const updatePaciente = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await PacienteService.update(Number(id), req.body);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// GET: Historial (Si este endpoint es distinto a getExpediente)
export const getHistorialPaciente = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    // Nota: Asegúrate de que el service tenga getHistorial implementado con la lógica que deseas
    const historial = await PacienteService.getHistorial(Number(id)); 
    
    // @ts-ignore (Si getHistorial retorna array)
    if (historial && historial.length > 0) res.json(historial);
    else res.status(404).json({ error: 'Sin sesiones previas' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error buscando historial' });
  }
};