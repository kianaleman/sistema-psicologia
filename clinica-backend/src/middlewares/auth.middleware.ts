import type { Request, Response, NextFunction } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { CuentaService } from '../services/cuenta.service.js';
import { ROLES, type RolSistema } from '../security/roles.js';

export { ROLES, type RolSistema } from '../security/roles.js';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('Falta la variable de entorno JWT_SECRET');
}

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
      usuario?: AuthUserPayload;
    }
  }
}

const normalizarTexto = (value: string) => {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
};

const obtenerRoles = (payload: JwtPayload) => {
  if (!Array.isArray(payload.roles)) return [];

  return payload.roles
    .filter((rol): rol is string => typeof rol === 'string')
    .map((rol) => rol.trim())
    .filter(Boolean);
};

const tieneRol = (roles: string[], rolesValidos: string[]) => {
  const rolesNormalizados = roles.map(normalizarTexto);
  const rolesValidosNormalizados = rolesValidos.map(normalizarTexto);

  return rolesNormalizados.some((rol) => rolesValidosNormalizados.includes(rol));
};

const obtenerIdUsuario = (payload: JwtPayload) => {
  const posiblesIds = [
    payload.idUsuario,
    payload.ID_Usuario,
    payload.id,
    payload.userId,
  ];

  const id = posiblesIds
    .map((value) => Number(value))
    .find((value) => Number.isInteger(value) && value > 0);

  return id || 0;
};

const construirUsuarioAutenticado = (payload: JwtPayload): AuthUserPayload => {
  const idUsuario = obtenerIdUsuario(payload);
  const email = typeof payload.email === 'string'
    ? payload.email
    : typeof payload.Email === 'string'
      ? payload.Email
      : '';

  const roles = obtenerRoles(payload);

  const idPsicologoRaw = payload.idPsicologo === null || payload.idPsicologo === undefined
    ? payload.ID_Psicologo
    : payload.idPsicologo;

  const idPsicologoNumber = Number(idPsicologoRaw);
  const idPsicologo = Number.isInteger(idPsicologoNumber) && idPsicologoNumber > 0
    ? idPsicologoNumber
    : null;

  if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
    throw new Error('Token sin datos de usuario válidos.');
  }

  const esAdmin = Boolean(
    payload.esAdmin ||
    tieneRol(roles, ['Administrador', 'Admin', 'ADMINISTRADOR', 'ADMIN'])
  );

  const esPsicologo = Boolean(
    payload.esPsicologo ||
    tieneRol(roles, ['Psicologo', 'Psicólogo', 'PSICOLOGO'])
  );

  const esRecepcion = Boolean(
    payload.esRecepcion ||
    tieneRol(roles, ['Recepcion', 'Recepción', 'RECEPCION'])
  );

  return {
    ...payload,
    idUsuario,
    email,
    roles,
    idPsicologo,
    requiereCambioPassword: Boolean(payload.requiereCambioPassword),
    esAdmin,
    esPsicologo,
    esRecepcion,
  };
};

const obtenerTokenDesdeHeader = (req: Request) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
    return '';
  }

  return authHeader.replace('Bearer ', '').trim();
};

export const verificarToken = (req: Request, res: Response, next: NextFunction): void => {
  const token = obtenerTokenDesdeHeader(req);

  if (!token) {
    res.status(401).json({
      error: 'Acceso denegado. No se proporcionó un token válido.',
    });
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);

    if (typeof payload === 'string') {
      res.status(403).json({ error: 'Token inválido o expirado.' });
      return;
    }

    const usuarioAutenticado = construirUsuarioAutenticado(payload);
    req.user = usuarioAutenticado;
    req.usuario = usuarioAutenticado;
    next();
  } catch (error) {
    console.error('Error al validar token:', error);
    res.status(403).json({ error: 'Token inválido o expirado.' });
  }
};

export const permitirRoles = (...rolesPermitidos: RolSistema[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const usuario = req.user || req.usuario;

    if (!usuario) {
      res.status(401).json({ error: 'Acceso no autorizado.' });
      return;
    }

    const tieneRolPermitido = rolesPermitidos.some((rolPermitido) => {
      return tieneRol(usuario.roles, [rolPermitido]);
    });

    if (!tieneRolPermitido) {
      res.status(403).json({ error: 'No tiene permisos para realizar esta acción.' });
      return;
    }

    next();
  };
};

export const bloquearSiRequiereCambioPassword = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const usuario = req.user || req.usuario;

  if (usuario?.requiereCambioPassword) {
    res.status(403).json({
      error: 'Debe cambiar la contraseña temporal antes de continuar.',
      requiereCambioPassword: true,
    });
    return;
  }

  next();
};

export const requierePsicologoAsignado = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const usuario = req.user || req.usuario;

  if (usuario?.esPsicologo && !usuario.idPsicologo) {
    res.status(403).json({
      error: 'El usuario psicólogo no tiene un perfil de psicólogo vinculado.',
    });
    return;
  }

  next();
};

// El JWT autentica; los permisos y el cambio obligatorio se leen de la cuenta vigente.
export const verificarCuentaVigente = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const usuario = req.user || req.usuario;

  if (!usuario) {
    res.status(401).json({ error: 'Acceso no autorizado.' });
    return;
  }

  try {
    const cuenta = await CuentaService.obtenerAcceso(usuario.idUsuario);

    if (!cuenta || !cuenta.Activo) {
      res.status(401).json({ error: 'La cuenta no está activa.' });
      return;
    }

    const idPsicologo = cuenta.Psicologo?.ID_Psicologo ?? null;

    const usuarioActualizado = construirUsuarioAutenticado({
      ...usuario,
      email: cuenta.Email,
      Email: cuenta.Email,
      roles: cuenta.Usuario_Rol.map(({ Rol }) => Rol.Nombre_Rol),
      idPsicologo,
      ID_Psicologo: idPsicologo,
      requiereCambioPassword: cuenta.RequiereCambioPassword,
      // Los indicadores anteriores del JWT no conservan permisos retirados.
      esAdmin: false,
      esPsicologo: false,
      esRecepcion: false,
    });

    req.user = usuarioActualizado;
    req.usuario = usuarioActualizado;
    next();
  } catch {
    res.status(503).json({ error: 'No se pudo verificar el acceso de la cuenta.' });
  }
};

export const protegerCuentaVigente = [
  verificarToken,
  verificarCuentaVigente,
  bloquearSiRequiereCambioPassword,
];

export const autorizarAdministrador = permitirRoles(ROLES.ADMINISTRADOR);
export const protegerAdministracion = [...protegerCuentaVigente, autorizarAdministrador];
