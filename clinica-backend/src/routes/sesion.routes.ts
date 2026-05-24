import { Router } from 'express';
import { createSesion, searchSesion } from '../controllers/sesion.controller.js';
import { verificarToken } from '../middlewares/auth.middleware.js';
import { validateSchema } from '../middlewares/validator.middleware.js';
import { createSesionSchema, searchSesionSchema } from '../schemas/sesion.schema.js';

// Agregamos el tipado explícito para pnpm
const router: Router = Router();

// ==========================================
// MIDDLEWARE DE SEGURIDAD GLOBAL
// ==========================================
// Protegemos la lectura y escritura de los registros clínicos de las sesiones
router.use(verificarToken);

// ==========================================
// RUTAS PROTEGIDAS Y VALIDADAS
// ==========================================

// Búsqueda de sesiones (Valida los parámetros de consulta / query params)
router.get('/buscar', validateSchema(searchSesionSchema), searchSesion);

// Registro de nueva sesión clínica (Valida el body estrictamente)
router.post('/', validateSchema(createSesionSchema), createSesion);

export default router;