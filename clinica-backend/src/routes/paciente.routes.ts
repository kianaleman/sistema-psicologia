import { Router } from 'express';
import { 
  getPacientes, 
  createPaciente, 
  updatePaciente, 
  getExpediente,
  getHistorialPaciente 
} from '../controllers/paciente.controller.js';
import { verificarToken } from '../middlewares/auth.middleware.js';
import { validateSchema } from '../middlewares/validator.middleware.js';
import { createPacienteSchema, updatePacienteSchema, getByIdSchema } from '../schemas/paciente.schema.js';

const router: Router = Router();

// ==========================================
// MIDDLEWARE DE SEGURIDAD GLOBAL
// ==========================================
router.use(verificarToken);

// ==========================================
// RUTAS PROTEGIDAS Y VALIDADAS
// ==========================================
// Consulta general (No necesita validación de body ni params)
router.get('/', getPacientes);

// Creación de paciente (Valida el body)
router.post('/', validateSchema(createPacienteSchema), createPaciente);

// Actualización (Valida el ID de la URL y el body)
router.put('/:id', validateSchema(updatePacienteSchema), updatePaciente);

// Consultas específicas (Valida que el ID de la URL sea un número)
router.get('/:id/expediente', validateSchema(getByIdSchema), getExpediente);
router.get('/:id/historial', validateSchema(getByIdSchema), getHistorialPaciente);

export default router;