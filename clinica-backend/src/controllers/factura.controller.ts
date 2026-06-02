import type { Request, Response } from 'express';
import { FacturaService } from '../services/factura.service.js';

const getErrorMessage = (error: unknown, fallback: string) => {
  return error instanceof Error ? error.message : fallback;
};

const getStatusFromError = (message: string) => {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('no autorizado')) return 401;

  if (
    lowerMessage.includes('no tiene permisos') ||
    lowerMessage.includes('no tiene un perfil')
  ) {
    return 403;
  }

  return 500;
};

export const getFacturas = async (req: Request, res: Response): Promise<void> => {
  try {
    const facturas = await FacturaService.getAll(req.user);
    res.json(facturas);
  } catch (error: unknown) {
    const message = getErrorMessage(error, 'Error al obtener el historial de recibos');
    console.error(error);
    res.status(getStatusFromError(message)).json({ error: message });
  }
};

export const getFacturaById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: 'El ID proporcionado no es válido' });
      return;
    }

    const factura = await FacturaService.getById(id, req.user);

    if (!factura) {
      res.status(404).json({ error: 'Recibo no encontrado' });
      return;
    }

    res.json(factura);
  } catch (error: unknown) {
    const message = getErrorMessage(error, 'Error al obtener el detalle del recibo');
    console.error(error);
    res.status(getStatusFromError(message)).json({ error: message });
  }
};
