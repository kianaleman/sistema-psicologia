import { Router } from 'express';
import { 
  getCitas, 
  createCita, 
  updateCita, 
  cancelCita, 
  getCatalogosCitas 
} from '../controllers/cita.controller.js';
import { verificarToken } from '../middlewares/auth.middleware.js';
import { validateSchema } from '../middlewares/validator.middleware.js';
import { createCitaSchema, updateCitaSchema, cancelCitaSchema } from '../schemas/cita.schema.js';

// Agregamos el tipado explícito para pnpm
const router: Router = Router();

// ==========================================
// MIDDLEWARE DE SEGURIDAD GLOBAL
// ==========================================
// Protegemos toda la gestión de citas y facturación
router.use(verificarToken);

// ==========================================
// RUTAS PROTEGIDAS Y VALIDADAS
// ==========================================

// 1. RUTAS ESTÁTICAS
router.get('/catalogos', getCatalogosCitas);

// 2. RUTAS GENERALES
router.get('/', getCitas);
// Validamos el body al crear
router.post('/', validateSchema(createCitaSchema), createCita);

// 3. RUTAS CON PARÁMETROS (Dinámicas)
// Validamos el ID de la URL y los datos del body al actualizar
router.put('/:id', validateSchema(updateCitaSchema), updateCita);
// Validamos el ID de la URL al cancelar
router.patch('/:id/cancelar', validateSchema(cancelCitaSchema), cancelCita);

export default router;