import type { Request, Response } from 'express';
import { GeneralService } from '../services/general.service.js';

// GET: Catálogos Generales
export const getCatalogos = async (req: Request, res: Response): Promise<void> => {
  try {
    const catalogos = await GeneralService.getCatalogos();
    res.json(catalogos);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Error cargando catálogos' });
  }
};

// GET: Dashboard Stats
export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await GeneralService.getDashboardStats();
    res.json(stats);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Error cargando estadísticas' });
  }
};

// GET: Historial Completo
export const getHistorialGeneral = async (req: Request, res: Response): Promise<void> => {
  try {
    const historial = await GeneralService.getHistorialGeneral();
    res.json(historial);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Error generando el historial' });
  }
};

// GET: Datos para Gráficos
export const getGraficosData = async (req: Request, res: Response): Promise<void> => {
  try {
    // Explicitamos que pueden ser string o undefined para mayor seguridad
    const inicio = req.query.inicio as string | undefined;
    const fin = req.query.fin as string | undefined;

    const graficos = await GeneralService.getGraficosData(inicio, fin);
    res.json(graficos);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Error calculando gráficos' });
  }
};

export const getMotivosCancelacion = async (_req: Request, res: Response): Promise<void> => {
  try {
    const motivos = await GeneralService.getMotivosCancelacion();
    res.json(motivos);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al obtener motivos de cancelación' });
  }
};