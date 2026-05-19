import { Router } from 'express';
import { getPsicologos, createPsicologo, updatePsicologo } from '../controllers/psicologo.controller.js';
import { verificarToken } from '../middlewares/auth.middleware.js';

// Agregamos el tipado explícito para pnpm
const router: Router = Router();

// ==========================================
// MIDDLEWARE DE SEGURIDAD GLOBAL
// ==========================================
// Protegemos el acceso a los datos de los psicólogos
router.use(verificarToken);

// ==========================================
// RUTAS PROTEGIDAS
// ==========================================
router.get('/', getPsicologos);
router.post('/', createPsicologo);
router.put('/:id', updatePsicologo);

export default router;