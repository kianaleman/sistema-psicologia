import { Router } from 'express';
import { getTutores, updateTutor } from '../controllers/tutor.controller.js';
import { verificarToken } from '../middlewares/auth.middleware.js';

// Agregamos el tipado explícito para pnpm
const router: Router = Router();

// ==========================================
// MIDDLEWARE DE SEGURIDAD GLOBAL
// ==========================================
// Protegemos el acceso a los datos de los responsables/tutores
router.use(verificarToken);

// ==========================================
// RUTAS PROTEGIDAS
// ==========================================
router.get('/', getTutores);
router.put('/:id', updateTutor);

export default router;