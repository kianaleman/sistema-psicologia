import type { Request, Response } from 'express';
import { PsicologoService } from '../services/psicologo.service';

// GET: Listar Psicólogos
export const getPsicologos = async (req: Request, res: Response) => {
  try {
    const psicologos = await PsicologoService.getAll();
    res.json(psicologos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener psicólogos' });
  }
};

// POST: Crear Psicólogo
export const createPsicologo = async (req: Request, res: Response) => {
  try {
    const { Nombre, Apellido, CodigoDeMinsa, No_Telefono, Email, ID_EstadoDeActividad, direccion, especialidadIds } = req.body;

    const nuevoPsicologo = await PsicologoService.create({
      Nombre, Apellido, CodigoDeMinsa, No_Telefono, Email,
      ID_EstadoDeActividad: parseInt(ID_EstadoDeActividad),
      direccion,
      especialidadIds: especialidadIds || []
    });

    res.json(nuevoPsicologo);
  } catch (error: any) {
    console.error(error);
    // Manejo de duplicados (Unique constraint violation)
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'El Email o Código MINSA ya existe.' });
    }
    res.status(500).json({ error: 'Error al crear psicólogo' });
  }
};

// PUT: Actualizar Psicólogo
export const updatePsicologo = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const { Nombre, Apellido, CodigoDeMinsa, No_Telefono, Email, ID_EstadoDeActividad, direccion, especialidadIds } = req.body;

    const result = await PsicologoService.update(parseInt(id), {
      Nombre, Apellido, CodigoDeMinsa, No_Telefono, Email,
      ID_EstadoDeActividad: parseInt(ID_EstadoDeActividad),
      direccion,
      especialidadIds: especialidadIds || []
    });

    res.json(result);
  } catch (error: any) {
    console.error(error);
    
    if (error.message === 'Psicólogo no encontrado') {
      return res.status(404).json({ error: error.message });
    }
    
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Datos duplicados (Email o Código).' });
    }
    
    res.status(500).json({ error: 'Error al actualizar psicólogo' });
  }
};