import { Router } from 'express';
import {
  register,
  login,
  cambiarPasswordForzado,
  forgotPassword,
  resetPassword,
} from '../controllers/auth.controller.js';
import {
  bloquearSiRequiereCambioPassword,
  permitirRoles,
  ROLES,
  verificarToken,
} from '../middlewares/auth.middleware.js';
import { validateSchema } from '../middlewares/validator.middleware.js';
import {
  registerSchema,
  loginSchema,
  cambiarPasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../schemas/auth.schema.js';

const router: Router = Router();

router.post('/login', validateSchema(loginSchema), login);
router.post('/forgot-password', validateSchema(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validateSchema(resetPasswordSchema), resetPassword);

router.use(verificarToken);

router.post('/cambiar-password-default', validateSchema(cambiarPasswordSchema), cambiarPasswordForzado);

router.use(bloquearSiRequiereCambioPassword);

router.post('/register', permitirRoles(ROLES.ADMINISTRADOR), validateSchema(registerSchema), register);

export default router;
