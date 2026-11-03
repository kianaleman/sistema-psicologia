import { Router } from 'express';
import { 
  getCatalogoItems, 
  createCatalogoItem, 
  updateCatalogoItem, 
  deleteCatalogoItem 
} from '../controllers/configuracion.controller.js';
import { autorizarAdministrador, permitirRoles, protegerCuentaVigente, ROLES } from '../middlewares/auth.middleware.js';
import { validateSchema } from '../middlewares/validator.middleware.js';
import { 
  getCatalogoSchema, 
  createCatalogoSchema, 
  updateCatalogoSchema, 
  deleteCatalogoSchema 
} from '../schemas/configuracion.schema.js';

const router: Router = Router();

// ==========================================
// MIDDLEWARE DE SEGURIDAD GLOBAL
// ==========================================
// Todas estas rutas son de administración de sistema y están protegidas
router.use(...protegerCuentaVigente);

// ==========================================
// RUTAS PROTEGIDAS Y VALIDADAS
// ==========================================
router.get('/:modelo', permitirRoles(ROLES.ADMINISTRADOR, ROLES.PSICOLOGO, ROLES.RECEPCION), validateSchema(getCatalogoSchema), getCatalogoItems);
router.use(autorizarAdministrador);
router.post('/:modelo', validateSchema(createCatalogoSchema), createCatalogoItem);
router.put('/:modelo/:id', validateSchema(updateCatalogoSchema), updateCatalogoItem);
router.delete('/:modelo/:id', validateSchema(deleteCatalogoSchema), deleteCatalogoItem);

export default router;
