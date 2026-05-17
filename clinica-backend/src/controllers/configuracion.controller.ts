import type { Request, Response } from 'express';
import { ConfiguracionService } from '../services/configuracion.service.js';

// GET: Obtener lista
export const getCatalogoItems = async (req: Request, res: Response): Promise<void> => {
  try {
    const modelo = req.params.modelo as string;
    const items = await ConfiguracionService.getAll(modelo);
    res.json(items);
  } catch (error: any) {
    const status = error.message === 'Catálogo no válido' ? 400 : 500;
    res.status(status).json({ error: error.message || 'Error al cargar catálogo' });
  }
};

// POST: Crear item
export const createCatalogoItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const modelo = req.params.modelo as string;
    const { nombre } = req.body;
    
    if (!nombre) {
        res.status(400).json({ error: 'El nombre es requerido' });
        return;
    }

    const newItem = await ConfiguracionService.create(modelo, nombre);
    res.status(201).json(newItem); // 201 Created
  } catch (error: any) {
    const status = error.message === 'Catálogo no válido' ? 400 : 500;
    res.status(status).json({ error: error.message || 'Error al crear registro' });
  }
};

// PUT: Editar item
export const updateCatalogoItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const modelo = req.params.modelo as string;
    const id = parseInt(req.params.id as string);
    
    if (isNaN(id)) {
        res.status(400).json({ error: 'El ID proporcionado no es válido' });
        return;
    }

    const { nombre } = req.body;

    const updatedItem = await ConfiguracionService.update(modelo, id, nombre);
    res.json(updatedItem);
  } catch (error: any) {
    const status = error.message === 'Catálogo no válido' ? 400 : 500;
    res.status(status).json({ error: error.message || 'Error al actualizar registro' });
  }
};

// DELETE: Eliminar item
export const deleteCatalogoItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const modelo = req.params.modelo as string;
    const id = parseInt(req.params.id as string);

    if (isNaN(id)) {
        res.status(400).json({ error: 'El ID proporcionado no es válido' });
        return;
    }
    
    await ConfiguracionService.delete(modelo, id);
    res.json({ message: 'Registro eliminado correctamente' });
  } catch (error: any) {
    // 1. Manejo de nuestra validación manual de dependencias
    if (error.message?.includes('No se puede eliminar: Este registro está siendo usado')) {
      res.status(409).json({ error: error.message });
      return;
    }

    // 2. Manejo de integridad referencial nativa de Prisma (Foreign Key Constraint)
    if (error.code === 'P2003') {
      res.status(409).json({ error: 'No se puede eliminar: Este registro está enlazado a otros datos del sistema.' });
      return;
    }
    
    // 3. Manejo de errores generales
    const status = error.message === 'Catálogo no válido' ? 400 : 500;
    res.status(status).json({ error: error.message || 'Error al eliminar registro' });
  }
};