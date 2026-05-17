import type { Request, Response } from 'express';
import { FacturaService } from '../services/factura.service.js';

// GET: Obtener historial de recibos/facturación completo
export const getFacturas = async (req: Request, res: Response): Promise<void> => {
  try {
    const facturas = await FacturaService.getAll();
    res.json(facturas);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el historial de recibos' });
  }
};

// GET: Obtener un recibo/factura individual
export const getFacturaById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) {
        res.status(400).json({ error: 'El ID proporcionado no es válido' });
        return;
    }

    const factura = await FacturaService.getById(id);
    
    if (!factura) {
        res.status(404).json({ error: 'Recibo no encontrado' });
        return;
    }
    
    res.json(factura);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el detalle del recibo' });
  }
};