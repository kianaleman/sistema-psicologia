import type { Request, Response } from 'express';
import { PacienteService } from '../services/paciente.service.js'; 

// GET: Obtener todos los pacientes
export const getPacientes = async (req: Request, res: Response): Promise<void> => {
  try {
    const pacientes = await PacienteService.getAll();
    res.json(pacientes);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
};

// GET: Obtener expediente completo de UNO
export const getExpediente = async (req: Request, res: Response): Promise<void> => {
  try {
    // Seguridad: Validamos que el ID sea realmente un número
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) {
        res.status(400).json({ error: 'El ID proporcionado no es válido' });
        return;
    }

    const expediente = await PacienteService.getExpediente(id);
    
    if (!expediente) {
        res.status(404).json({ error: 'Paciente no encontrado' });
        return;
    }
    
    res.json(expediente);
  } catch (error: any) {
    res.status(500).json({ error: error.message }); 
  }
};

// POST: Crear Paciente
export const createPaciente = async (req: Request, res: Response): Promise<void> => {
  try {
    // req.body debe traer la nueva estructura (municipioId, codigoTelefonoId, etc.)
    const nuevoPaciente = await PacienteService.create(req.body);
    res.status(201).json(nuevoPaciente); // 201 = Created
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

// PUT: Actualizar Paciente
export const updatePaciente = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) {
        res.status(400).json({ error: 'El ID proporcionado no es válido' });
        return;
    }

    const result = await PacienteService.update(id, req.body);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

// GET: Historial
export const getHistorialPaciente = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) {
        res.status(400).json({ error: 'El ID proporcionado no es válido' });
        return;
    }

    const historial = await PacienteService.getHistorialPaciente(id); 
    
    // Devolvemos el array (incluso si está vacío, es una respuesta válida 200 OK)
    res.json(historial || []);
    
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Error buscando historial clínico' });
  }
};