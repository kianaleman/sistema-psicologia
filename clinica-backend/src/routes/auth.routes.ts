import { Router } from 'express';
import { login, logout, forgotPassword, resetPassword } from '../controllers/auth.controller.js';

const router = Router();

router.post('/login', login); 
router.post('/logout', logout);

// 🟢 NUEVAS RUTAS PARA GMAIL
router.post('/forgot-password', forgotPassword); // Para solicitar el correo
router.post('/reset-password', resetPassword);   // Para cambiar la clave con el token

export default router;