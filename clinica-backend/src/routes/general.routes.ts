import { Router } from 'express';
import { getCatalogos, getDashboardStats, getHistorialGeneral, getGraficosData } from '../controllers/general.controller';

const router = Router();

router.get('/catalogos', getCatalogos);
router.get('/dashboard-stats', getDashboardStats);
router.get('/historial', getHistorialGeneral);
router.get('/dashboard-graficos', getGraficosData);

export default router;