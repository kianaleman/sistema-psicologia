import type { Request, Response } from 'express';
import { GeneralService } from '../services/general.service.js';

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

export const getCatalogos = async (req: Request, res: Response): Promise<void> => {
  try {
    const catalogos = await GeneralService.getCatalogos(req.user);
    res.json(catalogos);
  } catch (error: unknown) {
    const message = getErrorMessage(error, 'Error cargando catálogos');
    console.error(error);
    res.status(getStatusFromError(message)).json({ error: message });
  }
};

export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await GeneralService.getDashboardStats(req.user);
    res.json(stats);
  } catch (error: unknown) {
    const message = getErrorMessage(error, 'Error cargando estadísticas');
    console.error(error);
    res.status(getStatusFromError(message)).json({ error: message });
  }
};

export const getHistorialGeneral = async (req: Request, res: Response): Promise<void> => {
  try {
    const historial = await GeneralService.getHistorialGeneral(req.user);
    res.json(historial);
  } catch (error: unknown) {
    const message = getErrorMessage(error, 'Error generando el historial');
    console.error(error);
    res.status(getStatusFromError(message)).json({ error: message });
  }
};

export const getGraficosData = async (req: Request, res: Response): Promise<void> => {
  try {
    const inicio = typeof req.query.inicio === 'string' ? req.query.inicio : undefined;
    const fin = typeof req.query.fin === 'string' ? req.query.fin : undefined;

    const graficos = await GeneralService.getGraficosData(inicio, fin, req.user);
    res.json(graficos);
  } catch (error: unknown) {
    const message = getErrorMessage(error, 'Error calculando gráficos');
    console.error(error);
    res.status(getStatusFromError(message)).json({ error: message });
  }
};

export const getMotivosCancelacion = async (_req: Request, res: Response): Promise<void> => {
  try {
    const motivos = await GeneralService.getMotivosCancelacion();
    res.json(motivos);
  } catch (error: unknown) {
    const message = getErrorMessage(error, 'Error al obtener motivos de cancelación');
    res.status(500).json({ error: message });
  }
};
