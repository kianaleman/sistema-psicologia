import { Router } from 'express';
import { getCatalogos, getDashboardStats, getHistorialGeneral, getGraficosData, getMotivosCancelacion } from '../controllers/general.controller.js';
import { verificarToken } from '../middlewares/auth.middleware.js';

const router: Router = Router();

router.use(verificarToken);

router.get('/catalogos', getCatalogos);
router.get('/dashboard-stats', getDashboardStats);
router.get('/historial', getHistorialGeneral);
router.get('/dashboard-graficos', getGraficosData);
router.get('/motivos-cancelacion', getMotivosCancelacion);

export default router;