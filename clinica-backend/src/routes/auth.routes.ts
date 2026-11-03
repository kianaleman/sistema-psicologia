import { Router } from 'express';
import {
  register,
  login,
  cambiarPasswordForzado,
  forgotPassword,
  resetPassword,
  restablecerPasswordAdmin,
  listarRoles,
  listarUsuariosRoles,
  cambiarRolUsuario,
} from '../controllers/auth.controller.js';
import {
  bloquearSiRequiereCambioPassword,
  verificarToken,
  verificarCuentaVigente,
  autorizarAdministrador,
} from '../middlewares/auth.middleware.js';
import { validateSchema } from '../middlewares/validator.middleware.js';
import {
  registerSchema,
  loginSchema,
  cambiarPasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  adminResetPasswordSchema,
} from '../schemas/auth.schema.js';

const router: Router = Router();

router.post('/login', validateSchema(loginSchema), login);
router.post('/forgot-password', validateSchema(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validateSchema(resetPasswordSchema), resetPassword);

router.use(verificarToken);

router.post('/cambiar-password-default', validateSchema(cambiarPasswordSchema), cambiarPasswordForzado);

router.use(verificarCuentaVigente);
router.use(bloquearSiRequiereCambioPassword);
router.use(autorizarAdministrador);

router.post('/register', validateSchema(registerSchema), register);
router.get('/admin/roles', listarRoles);
router.get('/admin/usuarios-roles', listarUsuariosRoles);
router.patch('/admin/usuarios/:idUsuario/roles', cambiarRolUsuario);
router.patch('/admin/usuarios/:idUsuario/rol', cambiarRolUsuario);

router.post(
  '/admin/reset-password/:idUsuario',
  validateSchema(adminResetPasswordSchema),
  restablecerPasswordAdmin
);

export default router;
