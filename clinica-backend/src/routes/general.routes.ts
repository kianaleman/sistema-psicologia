import { Router } from 'express';
import { 
  getCatalogos, 
  getDashboardStats, 
  getHistorialGeneral, 
  getGraficosData, 
  getMotivosCancelacion,
  getAgendaHoy // 🟢 AGREGADO AQUÍ PARA SOLUCIONAR EL ERROR 2304
} from '../controllers/general.controller.js';

const router = Router();

router.get('/catalogos', getCatalogos);
router.get('/stats', getDashboardStats); // Asegúrate que el frontend llame a /stats o cambia aquí a /dashboard-stats
router.get('/historial', getHistorialGeneral);
router.get('/graficos', getGraficosData);
router.get('/agenda-hoy', getAgendaHoy);
router.get('/motivos-cancelacion', getMotivosCancelacion);

export default router;