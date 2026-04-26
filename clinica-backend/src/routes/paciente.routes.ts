import { Router } from 'express';
import { 
  getPacientes, 
  createPaciente, 
  updatePaciente, 
  getExpediente,
  getHistorialPaciente 
} from '../controllers/paciente.controller.js';

const router = Router();

// Definimos las rutas (ya no necesitamos poner '/api/pacientes' aquí, eso va en el index)
router.get('/', getPacientes);
router.post('/', createPaciente);
router.put('/:id', updatePaciente);
router.get('/:id/expediente', getExpediente);
router.get('/:id/historial', getHistorialPaciente);

export default router;