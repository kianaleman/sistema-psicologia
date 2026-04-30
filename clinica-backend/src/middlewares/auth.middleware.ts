import type { Request, Response, NextFunction } from 'express'; 
import jwt from 'jsonwebtoken';

export const verificarToken = (req: Request, res: Response, next: NextFunction) => {
  // 1. Extraer el token de la cookie o del header Authorization
  // 🟢 CORRECCIÓN: Se añade soporte para Bearer Token en Headers por flexibilidad
  const token = req.cookies?.auth_token || req.headers.authorization?.split(' ')[1];

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