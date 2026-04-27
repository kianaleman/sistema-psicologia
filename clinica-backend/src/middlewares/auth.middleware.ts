import type { Request, Response, NextFunction } from 'express'; // 🟢 Se agregó 'type'
import jwt from 'jsonwebtoken';

export const verificarToken = (req: Request, res: Response, next: NextFunction) => {
  // 1. Extraer el token de la cookie
  const token = req.cookies?.auth_token; // 🟢 Se agregó '?' por seguridad si cookies es undefined

  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado. Inicie sesión.' });
  }

  try {
    // 2. Verificar si el token es válido y no ha expirado
    const verificado = jwt.verify(token, process.env.JWT_SECRET!);
    (req as any).user = verificado;
    
    // 3. Continuar a la ruta solicitada
    next();
  } catch (error) {
    res.status(401).json({ error: 'Sesión inválida o expirada.' });
  }
};