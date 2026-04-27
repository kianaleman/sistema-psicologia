import { Router } from 'express';
// 🟢 Cambiamos la extensión a .js (necesario si usa type: module en package.json)
// y nos aseguramos de que la ruta sea correcta
import { login, logout } from '../controllers/auth.controller.js';

const router = Router();

/**
 * @route POST /api/auth/login
 * @desc  Iniciar sesión y obtener cookie HttpOnly
 */
router.post('/login', login); 

/**
 * @route POST /api/auth/logout
 * @desc  Cerrar sesión eliminando la cookie
 */
router.post('/logout', logout);

export default router;