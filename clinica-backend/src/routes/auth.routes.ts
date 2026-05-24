import { Router } from 'express';
import { 
  register, 
  login, 
  cambiarPasswordForzado, 
  forgotPassword, 
  resetPassword 
} from '../controllers/auth.controller.js';
import { verificarToken } from '../middlewares/auth.middleware.js';
import { validateSchema } from '../middlewares/validator.middleware.js';
import { 
  registerSchema,
  loginSchema,
  cambiarPasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} from '../schemas/auth.schemas.js';

// Agregamos el tipado explícito para evitar el error de pnpm
const router: Router = Router();

// ==========================================
// RUTAS PÚBLICAS (No requieren token)
// ==========================================
// Los usuarios de la clínica necesitan acceso libre a estas 3 rutas para poder entrar o recuperarse
// 1. Zod revisa los datos -> 2. Si están bien, pasa al Controller
router.post('/login', validateSchema(loginSchema), login);
router.post('/forgot-password', validateSchema(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validateSchema(resetPasswordSchema), resetPassword);

// ==========================================
// MIDDLEWARE DE SEGURIDAD
// ==========================================
// A partir de esta línea, TODAS las rutas de abajo exigirán un Token JWT válido en el Header
router.use(verificarToken);

// ==========================================
// RUTAS PROTEGIDAS (Requieren token)
// ==========================================
// El usuario entra con la clave temporal, recibe un token, y usa ese token para enviar su nueva clave definitiva
router.post('/cambiar-password-default', validateSchema(cambiarPasswordSchema), cambiarPasswordForzado);

// La creación de nuevo personal debe estar protegida para que solo alguien de adentro (Administrador) pueda hacerlo
router.post('/register', validateSchema(registerSchema), register);

export default router;