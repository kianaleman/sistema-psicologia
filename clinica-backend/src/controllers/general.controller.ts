import type { Request, Response } from 'express';
import { GeneralService } from '../services/general.service';

// GET: Catálogos Generales
export const getCatalogos = async (req: Request, res: Response) => {
  try {
    const catalogos = await GeneralService.getCatalogos();
    res.json(catalogos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error cargando catálogos' });
  }
};

// GET: Dashboard Stats
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const stats = await GeneralService.getDashboardStats();
    res.json(stats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error cargando estadísticas' });
  }
};

// GET: Historial Completo
export const getHistorialGeneral = async (req: Request, res: Response) => {
  try {
    const historial = await GeneralService.getHistorialGeneral();
    res.json(historial);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error generando el historial' });
  }
};

// GET: Datos para Gráficos
export const getGraficosData = async (req: Request, res: Response) => {
  const { inicio, fin } = req.query;

  try {
    const graficos = await GeneralService.getGraficosData(
      inicio as string, 
      fin as string
    );
    res.json(graficos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error calculando gráficos' });
  }
};