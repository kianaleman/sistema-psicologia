import type { Request, Response } from 'express';
import { PacienteService } from '../services/paciente.service.js'; 

// GET: Obtener todos los pacientes
export const getPacientes = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    let pacientes;
    
    // 🟢 Si es Admin (Rol 1), ve todos. 
    // 🟢 Si es Psicólogo (Rol 2), solo ve los vinculados a sus citas.
    if (user && user.idRol === 1) {
      pacientes = await PacienteService.getAll();
    } else {
      pacientes = await PacienteService.getPacientesByPsicologo(user.id);
    }

    res.json(pacientes);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener la lista de pacientes' });
  }
};

// GET: Obtener expediente completo de UNO
export const getExpediente = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const expediente = await PacienteService.getExpediente(Number(id));
    
    if (!expediente) {
        return res.status(404).json({ error: 'Paciente no encontrado' });
    }
    
    res.json(expediente);
  } catch (error: any) {
    res.status(500).json({ error: error.message }); 
  }
};

// POST: Crear Paciente
export const createPaciente = async (req: Request, res: Response) => {
  try {
    const nuevoPaciente = await PacienteService.create(req.body);
    res.json(nuevoPaciente);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

// PUT: Actualizar Paciente
export const updatePaciente = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await PacienteService.update(Number(id), req.body);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

// GET: Historial (CORREGIDO)
export const getHistorialPaciente = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    // 1. Llamamos al método ESPECÍFICO del servicio para historial
    const historial = await PacienteService.getHistorialPaciente(Number(id)); 
    
    // 2. Devolvemos el array (incluso si está vacío, es una respuesta válida 200 OK)
    // El frontend se encarga de mostrar "No hay registros" si viene vacío.
    res.json(historial || []);
    
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Error buscando historial' });
  }
};