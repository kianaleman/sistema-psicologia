import type { Request, Response, NextFunction } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('Falta la variable de entorno JWT_SECRET');
}

export const ROLES = {
  ADMINISTRADOR: 'Administrador',
  PSICOLOGO: 'Psicologo',
  RECEPCION: 'Recepcion',
} as const;

export type RolSistema = (typeof ROLES)[keyof typeof ROLES];

export interface AuthUserPayload extends JwtPayload {
  idUsuario: number;
  email: string;
  roles: string[];
  idPsicologo: number | null;
  requiereCambioPassword: boolean;
  esAdmin: boolean;
  esPsicologo: boolean;
  esRecepcion: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
    }
  }
}

const obtenerRoles = (payload: JwtPayload) => {
  if (!Array.isArray(payload.roles)) return [];

  return payload.roles.filter((rol): rol is string => typeof rol === 'string');
};

const construirUsuarioAutenticado = (payload: JwtPayload): AuthUserPayload => {
  const idUsuario = Number(payload.idUsuario);
  const email = typeof payload.email === 'string' ? payload.email : '';
  const roles = obtenerRoles(payload);

  const idPsicologoRaw = payload.idPsicologo === null || payload.idPsicologo === undefined
    ? null
    : Number(payload.idPsicologo);

  if (!Number.isInteger(idUsuario) || idUsuario <= 0 || !email) {
    throw new Error('Token sin datos de usuario válidos.');
  }

  const idPsicologo = typeof idPsicologoRaw === 'number'
    && Number.isInteger(idPsicologoRaw)
    && idPsicologoRaw > 0
    ? idPsicologoRaw
    : null;

  return {
    ...payload,
    idUsuario,
    email,
    roles,
    idPsicologo,
    requiereCambioPassword: Boolean(payload.requiereCambioPassword),
    esAdmin: roles.includes(ROLES.ADMINISTRADOR),
    esPsicologo: roles.includes(ROLES.PSICOLOGO),
    esRecepcion: roles.includes(ROLES.RECEPCION),
  };
};

export const verificarToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Acceso denegado. No se proporcionó un token válido.' });
    return;
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Acceso denegado. Token malformado o vacío.' });
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);

    if (typeof payload === 'string') {
      res.status(403).json({ error: 'Token inválido o expirado.' });
      return;
    }

    req.user = construirUsuarioAutenticado(payload);
    next();
  } catch {
    res.status(403).json({ error: 'Token inválido o expirado.' });
  }
};

export const permitirRoles = (...rolesPermitidos: RolSistema[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Acceso no autorizado.' });
      return;
    }

    const tieneRolPermitido = rolesPermitidos.some((rol) => req.user?.roles.includes(rol));

    if (!tieneRolPermitido) {
      res.status(403).json({ error: 'No tiene permisos para realizar esta acción.' });
      return;
    }

    next();
  };
};

export const bloquearSiRequiereCambioPassword = (req: Request, res: Response, next: NextFunction): void => {
  if (req.user?.requiereCambioPassword) {
    res.status(403).json({
      error: 'Debe cambiar la contraseña temporal antes de continuar.',
      requiereCambioPassword: true,
    });
    return;
  }

  next();
};

export const requierePsicologoAsignado = (req: Request, res: Response, next: NextFunction): void => {
  if (req.user?.esPsicologo && !req.user.idPsicologo) {
    res.status(403).json({
      error: 'El usuario psicólogo no tiene un perfil de psicólogo vinculado.',
    });
    return;
  }

  next();
};
