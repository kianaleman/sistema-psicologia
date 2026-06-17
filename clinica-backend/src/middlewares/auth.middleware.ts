import type { Request, Response, NextFunction } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { AuditoriaService } from '../services/auditoria.service.js';

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

const registrarFalloSeguridad = (
  req: Request,
  accion: string,
  mensaje: string,
  codigoEstado: number,
  datosDespues?: unknown
) => {
  void AuditoriaService.registrarDesdeRequest(req, {
    accion,
    modulo: 'SEGURIDAD',
    entidad: 'Auth',
    resultado: 'FALLO',
    codigoEstado,
    mensaje,
    datosDespues,
  });
};

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
    const mensaje = 'Acceso denegado. No se proporcionó un token válido.';
    registrarFalloSeguridad(req, 'ACCESO_SIN_TOKEN', mensaje, 401);
    res.status(401).json({ error: mensaje });
    return;
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    const mensaje = 'Acceso denegado. Token malformado o vacío.';
    registrarFalloSeguridad(req, 'TOKEN_MALFORMADO', mensaje, 401);
    res.status(401).json({ error: mensaje });
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);

    if (typeof payload === 'string') {
      const mensaje = 'Token inválido o expirado.';
      registrarFalloSeguridad(req, 'TOKEN_INVALIDO', mensaje, 403);
      res.status(403).json({ error: mensaje });
      return;
    }

    req.user = construirUsuarioAutenticado(payload);
    next();
  } catch {
    const mensaje = 'Token inválido o expirado.';
    registrarFalloSeguridad(req, 'TOKEN_INVALIDO', mensaje, 403);
    res.status(403).json({ error: mensaje });
  }
};

export const permitirRoles = (...rolesPermitidos: RolSistema[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      const mensaje = 'Acceso no autorizado.';
      registrarFalloSeguridad(req, 'ACCESO_NO_AUTORIZADO', mensaje, 401, { rolesPermitidos });
      res.status(401).json({ error: mensaje });
      return;
    }

    const tieneRolPermitido = rolesPermitidos.some((rol) => req.user?.roles.includes(rol));

    if (!tieneRolPermitido) {
      const mensaje = 'No tiene permisos para realizar esta acción.';

      void AuditoriaService.registrarDesdeRequest(req, {
        accion: 'ACCESO_DENEGADO_ROL',
        modulo: 'SEGURIDAD',
        entidad: 'Auth',
        resultado: 'FALLO',
        codigoEstado: 403,
        mensaje,
        datosDespues: {
          rolesUsuario: req.user.roles,
          rolesPermitidos,
        },
      });

      res.status(403).json({ error: mensaje });
      return;
    }

    next();
  };
};

export const bloquearSiRequiereCambioPassword = (req: Request, res: Response, next: NextFunction): void => {
  if (req.user?.requiereCambioPassword) {
    const mensaje = 'Debe cambiar la contraseña temporal antes de continuar.';

    void AuditoriaService.registrarDesdeRequest(req, {
      accion: 'ACCESO_BLOQUEADO_PASSWORD_TEMPORAL',
      modulo: 'SEGURIDAD',
      entidad: 'Auth',
      resultado: 'FALLO',
      codigoEstado: 403,
      mensaje,
    });

    res.status(403).json({
      error: mensaje,
      requiereCambioPassword: true,
    });
    return;
  }

  next();
};

export const requierePsicologoAsignado = (req: Request, res: Response, next: NextFunction): void => {
  if (req.user?.esPsicologo && !req.user.idPsicologo) {
    const mensaje = 'El usuario psicólogo no tiene un perfil de psicólogo vinculado.';

    void AuditoriaService.registrarDesdeRequest(req, {
      accion: 'ACCESO_BLOQUEADO_PSICOLOGO_NO_VINCULADO',
      modulo: 'SEGURIDAD',
      entidad: 'Auth',
      resultado: 'FALLO',
      codigoEstado: 403,
      mensaje,
    });

    res.status(403).json({
      error: mensaje,
    });
    return;
  }

  next();
};
