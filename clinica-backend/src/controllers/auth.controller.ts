import type { Request, Response } from 'express';
import { AuthService } from '../services/auth.service.js';

const getErrorMessage = (error: unknown, fallback: string) => {
  return error instanceof Error ? error.message : fallback;
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const nuevoUsuario = await AuthService.register(req.body);
    res.status(201).json(nuevoUsuario);
  } catch (error: unknown) {
    res.status(400).json({
      error: getErrorMessage(error, 'Error al registrar usuario'),
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await AuthService.login(req.body);
    res.json(result);
  } catch (error: unknown) {
    const message = getErrorMessage(error, 'Error interno al intentar iniciar sesión');

    if (message === 'Credenciales inválidas' || message === 'Esta cuenta ha sido desactivada') {
      res.status(401).json({ error: message });
      return;
    }

    res.status(500).json({ error: message });
  }
};

export const cambiarPasswordForzado = async (req: Request, res: Response): Promise<void> => {
  try {
    const idUsuario = req.user?.idUsuario;
    const { passwordNuevaRaw } = req.body as { passwordNuevaRaw?: string };

    if (!idUsuario) {
      res.status(401).json({ error: 'Acceso no autorizado o token inválido' });
      return;
    }

    if (!passwordNuevaRaw) {
      res.status(400).json({ error: 'Debe proporcionar la nueva contraseña' });
      return;
    }

    const result = await AuthService.cambiarPasswordForzado({
      idUsuario,
      passwordNuevaRaw,
    });

    res.json(result);
  } catch (error: unknown) {
    res.status(400).json({
      error: getErrorMessage(error, 'Error al cambiar la contraseña'),
    });
  }
};

export const restablecerPasswordAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const idUsuario = Number(req.params.idUsuario);

    if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
      res.status(400).json({ error: 'El ID del usuario no es válido' });
      return;
    }

    const result = await AuthService.restablecerPasswordAdmin({
      idUsuario,
    });

    res.json(result);
  } catch (error: unknown) {
    res.status(400).json({
      error: getErrorMessage(error, 'Error al restablecer la contraseña del usuario'),
    });
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body as { email?: string };

    if (!email) {
      res.status(400).json({ error: 'Debe proporcionar un correo electrónico' });
      return;
    }

    const result = await AuthService.forgotPassword(email);
    res.json(result);
  } catch {
    res.status(500).json({ error: 'Hubo un problema al intentar enviar el correo' });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, passwordNuevaRaw } = req.body as {
      token?: string;
      passwordNuevaRaw?: string;
    };

    if (!token || !passwordNuevaRaw) {
      res.status(400).json({ error: 'Faltan datos requeridos (token o contraseña)' });
      return;
    }

    const result = await AuthService.resetPassword(token, passwordNuevaRaw);
    res.json(result);
  } catch (error: unknown) {
    res.status(400).json({
      error: getErrorMessage(error, 'Error al restablecer contraseña'),
    });
  }
};
