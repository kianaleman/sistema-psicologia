import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || '';

// Extendemos la interfaz Request de Express para inyectar nuestro usuario
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const verificarToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Acceso denegado. No se proporcionó un token válido.' });
    return;
  }

  // Extraemos el token de la posición 1 del arreglo
  const token = authHeader.split(' ')[1];

  // Le aseguramos a TypeScript que el token existe antes de continuar
  if (!token) {
    res.status(401).json({ error: 'Acceso denegado. Token malformado o vacío.' });
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; 
    next(); 
  } catch (error) {
    res.status(403).json({ error: 'Token inválido o expirado.' });
  }
};