import { Router } from 'express';
import { getPsicologos, createPsicologo, updatePsicologo } from '../controllers/psicologo.controller.js';
import { autorizarAdministrador, permitirRoles, protegerCuentaVigente, ROLES } from '../middlewares/auth.middleware.js';
import { validateSchema } from '../middlewares/validator.middleware.js';
import { createPsicologoSchema, updatePsicologoSchema } from '../schemas/psicologo.schema.js';

// Agregamos el tipado explícito para pnpm
const router: Router = Router();

// ==========================================
// MIDDLEWARE DE SEGURIDAD GLOBAL
// ==========================================
// Protegemos el acceso a los datos de los psicólogos
router.use(...protegerCuentaVigente);

// ==========================================
// RUTAS PROTEGIDAS Y VALIDADAS
// ==========================================
// Consulta general
router.get('/', permitirRoles(ROLES.ADMINISTRADOR, ROLES.PSICOLOGO, ROLES.RECEPCION), getPsicologos);

// No existe autoservicio de perfil: también la edición del propio perfil es administrativa.
router.use(autorizarAdministrador);

// Creación (Valida el body)
router.post('/', validateSchema(createPsicologoSchema), createPsicologo);

// Actualización (Valida el ID de la URL y el body)
router.put('/:id', validateSchema(updatePsicologoSchema), updatePsicologo);

export default router;
