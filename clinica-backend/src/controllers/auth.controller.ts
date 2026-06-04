import type { Request, Response } from 'express';
import { AuthService } from '../services/auth.service.js';
import { AuditoriaService } from '../services/auditoria.service.js';

const getErrorMessage = (error: unknown, fallback: string) => {
  return error instanceof Error ? error.message : fallback;
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const nuevoUsuario = await AuthService.register(req.body);

    await AuditoriaService.registrarDesdeRequest(req, {
      accion: 'USUARIO_REGISTRADO',
      modulo: 'AUTH',
      entidad: 'Usuario',
      idEntidad: nuevoUsuario.id,
      resultado: 'EXITO',
      codigoEstado: 201,
      mensaje: 'Usuario registrado correctamente.',
      datosDespues: {
        id: nuevoUsuario.id,
        email: nuevoUsuario.email,
        rol: nuevoUsuario.rol,
      },
    });

    res.status(201).json(nuevoUsuario);
  } catch (error: unknown) {
    const message = getErrorMessage(error, 'Error al registrar usuario');

    await AuditoriaService.registrarDesdeRequest(req, {
      accion: 'USUARIO_REGISTRADO',
      modulo: 'AUTH',
      entidad: 'Usuario',
      resultado: 'FALLO',
      codigoEstado: 400,
      mensaje: message,
      datosDespues: req.body,
    });

    res.status(400).json({
      error: message,
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await AuthService.login(req.body);

    await AuditoriaService.registrarDesdeRequest(req, {
      idUsuario: result.usuario.id,
      usuarioEmail: result.usuario.email,
      roles: result.usuario.roles,
      accion: 'LOGIN_EXITOSO',
      modulo: 'AUTH',
      entidad: 'Usuario',
      idEntidad: result.usuario.id,
      resultado: 'EXITO',
      codigoEstado: 200,
      mensaje: 'Inicio de sesión exitoso.',
      datosDespues: {
        email: result.usuario.email,
        roles: result.usuario.roles,
        requiereCambioPassword: result.requiereCambioPassword,
      },
    });

    res.json(result);
  } catch (error: unknown) {
    const message = getErrorMessage(error, 'Error interno al intentar iniciar sesión');
    const status = message === 'Credenciales inválidas' || message === 'Esta cuenta ha sido desactivada'
      ? 401
      : 500;

    await AuditoriaService.registrarDesdeRequest(req, {
      usuarioEmail: typeof req.body?.email === 'string' ? req.body.email : null,
      accion: 'LOGIN_FALLIDO',
      modulo: 'AUTH',
      entidad: 'Usuario',
      resultado: 'FALLO',
      codigoEstado: status,
      mensaje: message,
      datosDespues: {
        email: typeof req.body?.email === 'string' ? req.body.email : null,
      },
    });

    res.status(status).json({ error: message });
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

    await AuditoriaService.registrarDesdeRequest(req, {
      accion: 'PASSWORD_TEMPORAL_CAMBIADA',
      modulo: 'AUTH',
      entidad: 'Usuario',
      idEntidad: idUsuario,
      resultado: 'EXITO',
      codigoEstado: 200,
      mensaje: 'Contraseña temporal cambiada correctamente.',
    });

    res.json(result);
  } catch (error: unknown) {
    const message = getErrorMessage(error, 'Error al cambiar la contraseña');

    await AuditoriaService.registrarDesdeRequest(req, {
      accion: 'PASSWORD_TEMPORAL_CAMBIADA',
      modulo: 'AUTH',
      entidad: 'Usuario',
      idEntidad: req.user?.idUsuario || null,
      resultado: 'FALLO',
      codigoEstado: 400,
      mensaje: message,
    });

    res.status(400).json({
      error: message,
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

    await AuditoriaService.registrarDesdeRequest(req, {
      accion: 'PASSWORD_RESTABLECIDA_ADMIN',
      modulo: 'AUTH',
      entidad: 'Usuario',
      idEntidad: idUsuario,
      resultado: 'EXITO',
      codigoEstado: 200,
      mensaje: 'Contraseña restablecida por administrador.',
      datosDespues: {
        usuario: result.usuario,
      },
    });

    res.json(result);
  } catch (error: unknown) {
    const message = getErrorMessage(error, 'Error al restablecer la contraseña del usuario');

    await AuditoriaService.registrarDesdeRequest(req, {
      accion: 'PASSWORD_RESTABLECIDA_ADMIN',
      modulo: 'AUTH',
      entidad: 'Usuario',
      idEntidad: Number(req.params.idUsuario) || null,
      resultado: 'FALLO',
      codigoEstado: 400,
      mensaje: message,
    });

    res.status(400).json({
      error: message,
    });
  }
};

export const listarRoles = async (_req: Request, res: Response): Promise<void> => {
  try {
    const roles = await AuthService.listarRoles();
    res.json(roles);
  } catch (error: unknown) {
    const message = getErrorMessage(error, 'Error al listar roles');

    res.status(500).json({
      error: message,
    });
  }
};

export const listarUsuariosRoles = async (_req: Request, res: Response): Promise<void> => {
  try {
    const usuarios = await AuthService.listarUsuariosRoles();
    res.json(usuarios);
  } catch (error: unknown) {
    const message = getErrorMessage(error, 'Error al listar usuarios y roles');

    res.status(500).json({
      error: message,
    });
  }
};

export const cambiarRolUsuario = async (req: Request, res: Response): Promise<void> => {
  const idUsuarioObjetivo = Number(req.params.idUsuario);
  const body = req.body as { rolId?: number | string; rolIds?: Array<number | string> };
  const rolIdsNuevos = Array.isArray(body.rolIds)
    ? body.rolIds.map((rolId) => Number(rolId))
    : [Number(body.rolId)];
  const idUsuarioEjecutor = req.user?.idUsuario;

  try {
    if (!idUsuarioEjecutor) {
      res.status(401).json({ error: 'Acceso no autorizado o token inválido' });
      return;
    }

    if (!Number.isInteger(idUsuarioObjetivo) || idUsuarioObjetivo <= 0) {
      res.status(400).json({ error: 'El ID del usuario no es válido' });
      return;
    }

    const rolIdsValidos = Array.from(new Set(
      rolIdsNuevos.filter((rolId) => Number.isInteger(rolId) && rolId > 0)
    ));

    if (rolIdsValidos.length === 0) {
      res.status(400).json({ error: 'Debe seleccionar al menos un rol válido' });
      return;
    }

    const result = await AuthService.cambiarRolesUsuario({
      idUsuarioObjetivo,
      rolIdsNuevos: rolIdsValidos,
      idUsuarioEjecutor,
    });

    await AuditoriaService.registrarDesdeRequest(req, {
      accion: 'CAMBIO_ROLES_USUARIO',
      modulo: 'AUTH',
      entidad: 'Usuario',
      idEntidad: idUsuarioObjetivo,
      resultado: 'EXITO',
      codigoEstado: 200,
      mensaje: 'Roles de usuario actualizados por administrador.',
      datosAntes: {
        roles: result.rolesAntes,
      },
      datosDespues: {
        usuario: result.usuario,
        roles: result.rolesDespues,
      },
    });

    res.json(result);
  } catch (error: unknown) {
    const message = getErrorMessage(error, 'Error al cambiar los roles del usuario');

    await AuditoriaService.registrarDesdeRequest(req, {
      accion: 'CAMBIO_ROLES_USUARIO',
      modulo: 'AUTH',
      entidad: 'Usuario',
      idEntidad: Number.isInteger(idUsuarioObjetivo) ? idUsuarioObjetivo : null,
      resultado: 'FALLO',
      codigoEstado: 400,
      mensaje: message,
      datosDespues: {
        rolIdsNuevos: rolIdsNuevos.filter((rolId) => Number.isInteger(rolId)),
      },
    });

    res.status(400).json({
      error: message,
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

    await AuditoriaService.registrarDesdeRequest(req, {
      usuarioEmail: email,
      accion: 'SOLICITUD_RECUPERACION_PASSWORD',
      modulo: 'AUTH',
      entidad: 'Usuario',
      resultado: 'EXITO',
      codigoEstado: 200,
      mensaje: 'Solicitud de recuperación de contraseña procesada.',
      datosDespues: {
        email,
      },
    });

    res.json(result);
  } catch (error: unknown) {
    const message = getErrorMessage(error, 'Hubo un problema al intentar enviar el correo');

    await AuditoriaService.registrarDesdeRequest(req, {
      usuarioEmail: typeof req.body?.email === 'string' ? req.body.email : null,
      accion: 'SOLICITUD_RECUPERACION_PASSWORD',
      modulo: 'AUTH',
      entidad: 'Usuario',
      resultado: 'FALLO',
      codigoEstado: 500,
      mensaje: message,
    });

    res.status(500).json({ error: message });
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

    await AuditoriaService.registrarDesdeRequest(req, {
      accion: 'PASSWORD_RESTABLECIDA_ENLACE',
      modulo: 'AUTH',
      entidad: 'Usuario',
      resultado: 'EXITO',
      codigoEstado: 200,
      mensaje: 'Contraseña restablecida desde enlace de recuperación.',
    });

    res.json(result);
  } catch (error: unknown) {
    const message = getErrorMessage(error, 'Error al restablecer contraseña');

    await AuditoriaService.registrarDesdeRequest(req, {
      accion: 'PASSWORD_RESTABLECIDA_ENLACE',
      modulo: 'AUTH',
      entidad: 'Usuario',
      resultado: 'FALLO',
      codigoEstado: 400,
      mensaje: message,
    });

    res.status(400).json({
      error: message,
    });
  }
};
