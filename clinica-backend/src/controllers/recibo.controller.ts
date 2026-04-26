import type { Request, Response } from 'express';
// Importamos el servicio actualizado con el nuevo nombre
import { ReciboService } from '../services/recibo.service.js';

/**
 * GET: Obtener historial de recibos completo
 * Accede a la tabla 'Recibo' que unifica los pagos, divisas y métodos de pago.
 */
export const getRecibos = async (req: Request, res: Response) => {
  try {
    const recibos = await ReciboService.getAll();
    res.json(recibos);
  } catch (error) {
    console.error('Error en getRecibos:', error);
    res.status(500).json({ 
      error: 'Error al obtener el historial de recibos de pago' 
    });
  }
};

/**
 * GET: Obtener un recibo individual por su Código
 * Utiliza el campo Cod_Recibo definido en tu script de SQL Server.
 */
export const getReciboById = async (req: Request, res: Response) => {
  const { id } = req.params;
  
  // Validación de que el ID sea un número (Cod_Recibo es INT)
  const idRecibo = Number(id);
  if (isNaN(idRecibo)) {
    return res.status(400).json({ error: 'El código del recibo debe ser un valor numérico' });
  }

  try {
    const recibo = await ReciboService.getById(idRecibo);
    
    if (!recibo) {
      return res.status(404).json({ error: 'El recibo solicitado no existe en el sistema' });
    }
    
    res.json(recibo);
  } catch (error) {
    console.error(`Error en getReciboById (ID: ${id}):`, error);
    res.status(500).json({ 
      error: 'Error interno al buscar el detalle del recibo' 
    });
  }
};