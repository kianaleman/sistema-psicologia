import type { Request, Response } from 'express';
import { TutorService } from '../services/tutor.service';

// GET: Tutores con pacientes
export const getTutores = async (req: Request, res: Response) => {
  try {
    const tutores = await TutorService.getAll();
    res.json(tutores);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener tutores' });
  }
};

// PUT: Actualizar Tutor
export const updateTutor = async (req: Request, res: Response) => {
  const { id } = req.params;
  // Desestructuramos el body para limpieza
  const { Nombre, Apellido, No_Cedula, No_Telefono, ID_Parentesco, ID_Ocupacion, ID_EstadoCivil, DireccionTutor } = req.body;

  try {
    const tutorActualizado = await TutorService.update(parseInt(id), {
      Nombre,
      Apellido,
      No_Cedula,
      No_Telefono,
      // Aseguramos conversión a números para las FK
      ID_Parentesco: parseInt(ID_Parentesco),
      ID_Ocupacion: parseInt(ID_Ocupacion),
      ID_EstadoCivil: parseInt(ID_EstadoCivil),
      DireccionTutor
    });

    res.json(tutorActualizado);
  } catch (error: any) {
    console.error(error);
    if (error.message === 'Tutor no encontrado') {
        return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Error al actualizar tutor' });
  }
};