import type { Request, Response } from 'express';
import { TutorService } from '../services/tutor.service.js';

export const getTutores = async (req: Request, res: Response) => {
  try {
    const tutores = await TutorService.getAll();
    res.json(tutores);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener tutores' });
  }
};

export const updateTutor = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) return res.status(400).json({ error: 'ID requerido' });

  const { 
    Nombre, 
    Apellido, 
    No_Cedula, 
    No_Telefono, 
    ID_Ocupacion, 
    ID_EstadoCivil 
  } = req.body;

  try {
    // LLAMADA LIMPIA: Solo propiedades que existen en UpdateTutorDTO
    const tutorActualizado = await TutorService.update(Number(id), {
      Nombre,
      Apellido,
      No_Cedula,
      No_Telefono,
      ID_Ocupacion: Number(ID_Ocupacion),
      ID_EstadoCivil: Number(ID_EstadoCivil)
    });

    res.json(tutorActualizado);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};