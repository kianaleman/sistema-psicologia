import type { Request, Response } from 'express';
import { FacturaService } from '../services/factura.service';

// GET: Obtener historial de facturación completo
export const getFacturas = async (req: Request, res: Response) => {
  try {
    const facturas = await FacturaService.getAll();
    res.json(facturas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener facturas' });
  }
};

// GET: Obtener una factura individual (Opcional, ya queda listo si lo necesitas)
export const getFacturaById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const factura = await FacturaService.getById(Number(id));
    if (!factura) return res.status(404).json({ error: 'Factura no encontrada' });
    
    res.json(factura);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el detalle de la factura' });
  }
};