import { Router } from 'express';
import { getPsicologos, createPsicologo, updatePsicologo } from '../controllers/psicologo.controller.js';
import { verificarToken } from '../middlewares/auth.middleware.js';
import { validateSchema } from '../middlewares/validator.middleware.js';
import { createPsicologoSchema, updatePsicologoSchema } from '../schemas/psicologo.schema.js';

// Agregamos el tipado explícito para pnpm
const router: Router = Router();

// ==========================================
// MIDDLEWARE DE SEGURIDAD GLOBAL
// ==========================================
// Protegemos el acceso a los datos de los psicólogos
router.use(verificarToken);

// ==========================================
// RUTAS PROTEGIDAS Y VALIDADAS
// ==========================================
// Consulta general
router.get('/', getPsicologos);

// Creación (Valida el body)
router.post('/', validateSchema(createPsicologoSchema), createPsicologo);

// Actualización (Valida el ID de la URL y el body)
router.put('/:id', validateSchema(updatePsicologoSchema), updatePsicologo);

export default router;