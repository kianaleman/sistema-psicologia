import { Router } from 'express';
import { 
  getCatalogoItems, 
  createCatalogoItem, 
  updateCatalogoItem, 
  deleteCatalogoItem 
} from '../controllers/configuracion.controller.js';
import { verificarToken } from '../middlewares/auth.middleware.js';
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
router.use(verificarToken);

// ==========================================
// RUTAS PROTEGIDAS Y VALIDADAS
// ==========================================
router.get('/:modelo', validateSchema(getCatalogoSchema), getCatalogoItems);
router.post('/:modelo', validateSchema(createCatalogoSchema), createCatalogoItem);
router.put('/:modelo/:id', validateSchema(updateCatalogoSchema), updateCatalogoItem);
router.delete('/:modelo/:id', validateSchema(deleteCatalogoSchema), deleteCatalogoItem);

export default router;