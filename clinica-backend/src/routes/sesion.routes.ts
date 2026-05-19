import { Router } from 'express';
import { createSesion, searchSesion } from '../controllers/sesion.controller.js';
import { verificarToken } from '../middlewares/auth.middleware.js';

// Agregamos el tipado explícito para pnpm
const router: Router = Router();

// ==========================================
// MIDDLEWARE DE SEGURIDAD GLOBAL
// ==========================================
// Protegemos la lectura y escritura de los registros clínicos de las sesiones
router.use(verificarToken);

// ==========================================
// RUTAS PROTEGIDAS
// ==========================================
router.get('/buscar', searchSesion);
router.post('/', createSesion);

export default router;