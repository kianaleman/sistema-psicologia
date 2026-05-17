import type { Request, Response } from 'express';
import { TutorService } from '../services/tutor.service.js';

// GET: Tutores con pacientes
export const getTutores = async (req: Request, res: Response): Promise<void> => {
  try {
    const tutores = await TutorService.getAll();
    res.json(tutores);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener tutores' });
  }
};

// PUT: Actualizar Tutor
export const updateTutor = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) {
        res.status(400).json({ error: 'El ID proporcionado no es válido' });
        return;
    }

    // Desestructuramos el body alineado al nuevo UpdateTutorDTO
    // Nota: ID_Parentesco y DireccionTutor ya no existen en este nivel
    const { 
        Nombre, 
        Apellido, 
        No_Cedula, 
        codigoTelefonoId, 
        No_Telefono, 
        ocupacionId, 
        estadoCivilId 
    } = req.body;

    const tutorActualizado = await TutorService.update(id, {
      Nombre,
      Apellido,
      No_Cedula,
      codigoTelefonoId: parseInt(codigoTelefonoId),
      No_Telefono,
      ocupacionId: parseInt(ocupacionId),
      estadoCivilId: parseInt(estadoCivilId)
    });

    res.json(tutorActualizado);
  } catch (error: any) {
    console.error(error);
    
    // 1. Manejo de Tutor No Encontrado
    if (error.message === 'Tutor no encontrado') {
        res.status(404).json({ error: error.message });
        return;
    }
    
    // 2. Manejo de Errores de Validación del Servicio (Duplicidad, Formatos)
    if (
        error.message.includes('Error de duplicidad') || 
        error.message.includes('Formato de cédula') || 
        error.message.includes('Teléfono inválido')
    ) {
        res.status(400).json({ error: error.message });
        return;
    }

    // 3. Error General
    res.status(500).json({ error: 'Error al actualizar tutor' });
  }
};