import type { Request, Response } from 'express';
import { ConfiguracionService } from '../services/configuracion.service';

// GET: Obtener lista
export const getCatalogoItems = async (req: Request, res: Response) => {
  try {
    const { modelo } = req.params;
    const items = await ConfiguracionService.getAll(modelo);
    res.json(items);
  } catch (error: any) {
    // Si el servicio dice "Catálogo no válido", es un 400, si no, un 500
    const status = error.message === 'Catálogo no válido' ? 400 : 500;
    res.status(status).json({ error: error.message || 'Error al cargar catálogo' });
  }
};

// POST: Crear item
export const createCatalogoItem = async (req: Request, res: Response) => {
  try {
    const { modelo } = req.params;
    const { nombre } = req.body;
    
    if (!nombre) return res.status(400).json({ error: 'El nombre es requerido' });

    const newItem = await ConfiguracionService.create(modelo, nombre);
    res.json(newItem);
  } catch (error: any) {
    const status = error.message === 'Catálogo no válido' ? 400 : 500;
    res.status(status).json({ error: error.message || 'Error al crear registro' });
  }
};

// PUT: Editar item
export const updateCatalogoItem = async (req: Request, res: Response) => {
  try {
    const { modelo, id } = req.params;
    const { nombre } = req.body;

    const updatedItem = await ConfiguracionService.update(modelo, parseInt(id), nombre);
    res.json(updatedItem);
  } catch (error: any) {
    const status = error.message === 'Catálogo no válido' ? 400 : 500;
    res.status(status).json({ error: error.message || 'Error al actualizar registro' });
  }
};

// DELETE: Eliminar item
export const deleteCatalogoItem = async (req: Request, res: Response) => {
  try {
    const { modelo, id } = req.params;
    
    await ConfiguracionService.delete(modelo, parseInt(id));
    res.json({ message: 'Registro eliminado correctamente' });
  } catch (error: any) {
    // Manejo específico de integridad referencial (Foreign Key)
    if (error.code === 'P2003') {
      return res.status(409).json({ // 409 Conflict es más apropiado
        error: 'No se puede eliminar: este registro está siendo usado en expedientes o citas.' 
      });
    }
    
    const status = error.message === 'Catálogo no válido' ? 400 : 500;
    res.status(status).json({ error: error.message || 'Error al eliminar registro' });
  }
};