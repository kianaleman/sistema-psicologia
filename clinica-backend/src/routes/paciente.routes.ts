import { Router } from 'express';
import { 
  getPacientes, 
  createPaciente, 
  updatePaciente, 
  getExpediente,
  getHistorialPaciente 
} from '../controllers/paciente.controller.js';
import { verificarToken } from '../middlewares/auth.middleware.js';

const router: Router = Router();

// ==========================================
// MIDDLEWARE DE SEGURIDAD GLOBAL
// ==========================================
// Cualquier petición que llegue a /api/pacientes pasará primero por aquí.
// Si el token no es válido o no existe, el servidor responderá 401/403 y no ejecutará los controladores.
router.use(verificarToken);

// ==========================================
// RUTAS PROTEGIDAS
// ==========================================
router.get('/', getPacientes);
router.post('/', createPaciente);
router.put('/:id', updatePaciente);
router.get('/:id/expediente', getExpediente);
router.get('/:id/historial', getHistorialPaciente);

export default router;