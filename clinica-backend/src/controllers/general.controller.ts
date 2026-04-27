import type { Request, Response } from 'express';
import { GeneralService } from '../services/general.service.js';

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
    // 🟢 Detectar si es Psicólogo para filtrar KPIs
    const user = (req as any).user;
    const psicologoId = user.idRol === 2 ? user.id : undefined;

    const stats = await GeneralService.getDashboardStats(psicologoId);
    res.json(stats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error cargando estadísticas' });
  }
};

// 🟢 NUEVO: GET Agenda de Hoy (Lista de citas pendientes filtrada)
export const getAgendaHoy = async (req: Request, res: Response) => {
  try {
    // 🟢 Detectar si es Psicólogo para filtrar agenda
    const user = (req as any).user;
    const psicologoId = user.idRol === 2 ? user.id : undefined;

    const agenda = await GeneralService.getAgendaHoy(psicologoId);
    res.json(agenda);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error cargando la agenda del día' });
  }
};

// GET: Historial Completo
export const getHistorialGeneral = async (req: Request, res: Response) => {
  try {
    // 🟢 Detectar si es Psicólogo para filtrar historial
    const user = (req as any).user;
    const psicologoId = user.idRol === 2 ? user.id : undefined;

    const historial = await GeneralService.getHistorialGeneral(psicologoId);
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
    // 🟢 Detectar si es Psicólogo para filtrar datos de gráficos
    const user = (req as any).user;
    const psicologoId = user.idRol === 2 ? user.id : undefined;

    const graficos = await GeneralService.getGraficosData(
      inicio as string, 
      fin as string,
      psicologoId
    );
    res.json(graficos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error calculando gráficos' });
  }
};

export const getMotivosCancelacion = async (_req: Request, res: Response) => {
  try {
    const motivos = await GeneralService.getMotivosCancelacion();
    res.json(motivos);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};