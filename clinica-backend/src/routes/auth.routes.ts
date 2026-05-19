import { Router } from 'express';
import { 
  register, 
  login, 
  cambiarPasswordForzado, 
  forgotPassword, 
  resetPassword 
} from '../controllers/auth.controller.js';
import { verificarToken } from '../middlewares/auth.middleware.js';

// Agregamos el tipado explícito para evitar el error de pnpm
const router: Router = Router();

// ==========================================
// RUTAS PÚBLICAS (No requieren token)
// ==========================================
// Los usuarios de la clínica necesitan acceso libre a estas 3 rutas para poder entrar o recuperarse
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// ==========================================
// MIDDLEWARE DE SEGURIDAD
// ==========================================
// A partir de esta línea, TODAS las rutas de abajo exigirán un Token JWT válido en el Header
router.use(verificarToken);

// ==========================================
// RUTAS PROTEGIDAS (Requieren token)
// ==========================================
// El usuario entra con la clave temporal, recibe un token, y usa ese token para enviar su nueva clave definitiva
router.post('/cambiar-password-default', cambiarPasswordForzado);

// La creación de nuevo personal debe estar protegida para que solo alguien de adentro (Administrador) pueda hacerlo
router.post('/register', register);

export default router;