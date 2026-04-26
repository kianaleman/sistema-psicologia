import type { Request, Response } from 'express';
import { ConfiguracionService } from '../services/configuracion.service.js';

// GET: Obtener lista
export const getCatalogoItems = async (req: Request, res: Response) => {
  try {
    const { modelo } = req.params;
    if (!modelo) return res.status(400).json({ error: 'El modelo es requerido' });

    const items = await ConfiguracionService.getAll(modelo as string);
    res.json(items);
  } catch (error: any) {
    const status = error.message === 'Catálogo no válido' ? 400 : 500;
    res.status(status).json({ error: error.message || 'Error al cargar catálogo' });
  }
};

// POST: Crear item
export const createCatalogoItem = async (req: Request, res: Response) => {
  try {
    const { modelo } = req.params;
    
    // CAMBIO CLAVE: Si es divisa, pasamos todo el body. 
    // Si es otro modelo, intentamos pasar 'nombre' para mantener la compatibilidad.
    const dataToSend = modelo === 'divisa' ? req.body : req.body.nombre;
    
    if (!modelo) return res.status(400).json({ error: 'El modelo es requerido' });
    if (!dataToSend) return res.status(400).json({ error: 'Los datos o el nombre son requeridos' });

    const newItem = await ConfiguracionService.create(modelo as string, dataToSend);
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

    if (!modelo || !id) return res.status(400).json({ error: 'Faltan parámetros requeridos' });

    // Aquí mantenemos 'nombre' asumiendo que para editar catálogos simples basta con el nombre
    const updatedItem = await ConfiguracionService.update(modelo as string, parseInt(id), nombre);
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
    if (!modelo || !id) return res.status(400).json({ error: 'Faltan parámetros requeridos' });

    await ConfiguracionService.delete(modelo as string, parseInt(id));
    res.json({ message: 'Registro eliminado correctamente' });
  } catch (error: any) {
    if (error.code === 'P2003') {
      return res.status(409).json({ 
        error: 'No se puede eliminar: este registro está siendo usado en el sistema.' 
      });
    }
    const status = error.message === 'Catálogo no válido' ? 400 : 500;
    res.status(status).json({ error: error.message || 'Error al eliminar registro' });
  }
};