import { Router } from 'express';
import { 
  getCitas, 
  createCita, 
  updateCita, 
  cancelCita, 
  getCatalogosCitas 
} from '../controllers/cita.controller.js';
import { verificarToken } from '../middlewares/auth.middleware.js';

// Agregamos el tipado explícito para pnpm
const router: Router = Router();

// ==========================================
// MIDDLEWARE DE SEGURIDAD GLOBAL
// ==========================================
// Protegemos toda la gestión de citas y facturación
router.use(verificarToken);

// ==========================================
// RUTAS PROTEGIDAS
// ==========================================

// 1. RUTAS ESTÁTICAS (Siempre deben ir primero para evitar colisiones con los params)
router.get('/catalogos', getCatalogosCitas);

// 2. RUTAS GENERALES
router.get('/', getCitas);
router.post('/', createCita);

// 3. RUTAS CON PARÁMETROS (Dinámicas)
router.put('/:id', updateCita);
router.patch('/:id/cancelar', cancelCita);

export default router;