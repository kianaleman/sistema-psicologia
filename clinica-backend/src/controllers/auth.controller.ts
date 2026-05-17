import type { Request, Response } from 'express';
import { AuthService } from '../services/auth.service.js';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const nuevoUsuario = await AuthService.register(req.body);
    // Retornamos el 201 (Created) junto con los datos y la contraseña temporal
    res.status(201).json(nuevoUsuario);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Error al registrar usuario' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await AuthService.login(req.body);
    res.json(result);
  } catch (error: any) {
    if (error.message === 'Credenciales inválidas' || error.message === 'Esta cuenta ha sido desactivada') {
      res.status(401).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'Error interno al intentar iniciar sesión' });
  }
};

export const cambiarPasswordForzado = async (req: Request, res: Response): Promise<void> => {
  try {
    // Extraemos el ID del usuario del token JWT inyectado por el middleware
    const idUsuario = req.user?.idUsuario; 
    const { passwordNuevaRaw } = req.body;

    if (!idUsuario) {
        res.status(401).json({ error: 'Acceso no autorizado o token inválido' });
        return;
    }

    if (!passwordNuevaRaw) {
        res.status(400).json({ error: 'Debe proporcionar la nueva contraseña' });
        return;
    }

    // Enviamos los datos al servicio
    const result = await AuthService.cambiarPasswordForzado({
        idUsuario,
        passwordNuevaRaw
    });

    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Error al cambiar la contraseña' });
  }
};