import { Router } from 'express';
import { getCatalogos, getDashboardStats, getHistorialGeneral, getGraficosData, getMotivosCancelacion } from '../controllers/general.controller.js';

const router = Router();

router.get('/catalogos', getCatalogos);
router.get('/dashboard-stats', getDashboardStats);
router.get('/historial', getHistorialGeneral);
router.get('/dashboard-graficos', getGraficosData);
router.get('/motivos-cancelacion', getMotivosCancelacion);

export default router;