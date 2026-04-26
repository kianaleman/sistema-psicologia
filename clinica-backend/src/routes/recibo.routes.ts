import { Router } from 'express';
// Importamos las funciones con sus nuevos nombres desde el controlador de recibos
import { getRecibos, getReciboById } from '../controllers/recibo.controller.js';

const router = Router();

/**
 * Rutas para el Módulo de Facturación (Recibos)
 * Prefijo base definido en index.ts: /api/recibos
 */

// GET /api/recibos - Obtener historial completo
router.get('/', getRecibos);

// GET /api/recibos/:id - Obtener un recibo específico por Cod_Recibo
router.get('/:id', getReciboById);

export default router;