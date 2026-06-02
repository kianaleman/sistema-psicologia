import { PrismaClient, type Prisma } from '@prisma/client';
import type { Request } from 'express';
import type { AuthUserPayload } from '../middlewares/auth.middleware.js';

const prisma = new PrismaClient();

type ResultadoAuditoria = 'EXITO' | 'FALLO';

export interface RegistrarAuditoriaDTO {
  usuario?: AuthUserPayload | null;
  idUsuario?: number | null;
  usuarioEmail?: string | null;
  roles?: string[] | null;
  accion: string;
  modulo: string;
  entidad?: string | null;
  idEntidad?: number | null;
  metodoHTTP?: string | null;
  ruta?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  resultado: ResultadoAuditoria;
  codigoEstado?: number | null;
  mensaje?: string | null;
  datosAntes?: unknown;
  datosDespues?: unknown;
}

export interface FiltrosAuditoria {
  page?: number;
  limit?: number;
  usuario?: string;
  modulo?: string;
  accion?: string;
  resultado?: string;
  fechaInicio?: string;
  fechaFin?: string;
  busqueda?: string;
}

const CAMPOS_SENSIBLES = new Set([
  'password',
  'passwordraw',
  'passwordnuevaraw',
  'passwordhash',
  'token',
  'resettoken',
  'resettokenexpire',
  'passwordtemporal',
  'credenciales',
]);

const truncar = (value: string | null | undefined, max: number) => {
  if (!value) return value ?? null;

  return value.length > max ? value.slice(0, max) : value;
};

const sanitizar = (value: unknown): unknown => {
  if (value === null || value === undefined) return value;

  if (value instanceof Date) return value.toISOString();

  if (Array.isArray(value)) {
    return value.map((item) => sanitizar(item));
  }

  if (typeof value === 'object') {
    const output: Record<string, unknown> = {};

    Object.entries(value as Record<string, unknown>).forEach(([key, item]) => {
      if (CAMPOS_SENSIBLES.has(key.toLowerCase())) {
        output[key] = '[PROTEGIDO]';
        return;
      }

      output[key] = sanitizar(item);
    });

    return output;
  }

  return value;
};

const serializar = (value: unknown) => {
  if (value === undefined || value === null) return null;

  try {
    const texto = JSON.stringify(sanitizar(value));

    return texto.length > 60000 ? `${texto.slice(0, 60000)}...` : texto;
  } catch {
    return '[No serializable]';
  }
};

const obtenerIp = (req: Request) => {
  const forwardedFor = req.headers['x-forwarded-for'];

  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0]?.trim() || null;
  }

  if (Array.isArray(forwardedFor) && forwardedFor[0]) {
    return forwardedFor[0];
  }

  return req.ip || req.socket.remoteAddress || null;
};

const validarAdmin = (usuario?: AuthUserPayload) => {
  if (!usuario) {
    throw new Error('Acceso no autorizado.');
  }

  if (!usuario.esAdmin) {
    throw new Error('No tiene permisos para consultar auditoría.');
  }
};

const construirWhere = (filtros: FiltrosAuditoria): Prisma.AuditoriaSistemaWhereInput => {
  const where: Prisma.AuditoriaSistemaWhereInput = {};

  if (filtros.usuario) {
    where.UsuarioEmail = {
      contains: filtros.usuario,
    };
  }

  if (filtros.modulo) {
    where.Modulo = filtros.modulo;
  }

  if (filtros.accion) {
    where.Accion = filtros.accion;
  }

  if (filtros.resultado) {
    where.Resultado = filtros.resultado;
  }

  if (filtros.fechaInicio || filtros.fechaFin) {
    where.FechaHora = {};

    if (filtros.fechaInicio) {
      where.FechaHora.gte = new Date(`${filtros.fechaInicio}T00:00:00`);
    }

    if (filtros.fechaFin) {
      where.FechaHora.lte = new Date(`${filtros.fechaFin}T23:59:59`);
    }
  }

  if (filtros.busqueda) {
    where.OR = [
      { UsuarioEmail: { contains: filtros.busqueda } },
      { Accion: { contains: filtros.busqueda } },
      { Modulo: { contains: filtros.busqueda } },
      { Entidad: { contains: filtros.busqueda } },
      { Ruta: { contains: filtros.busqueda } },
      { Mensaje: { contains: filtros.busqueda } },
    ];
  }

  return where;
};

export const AuditoriaService = {
  registrar: async (data: RegistrarAuditoriaDTO) => {
    try {
      const usuario = data.usuario || null;
      const idUsuario = data.idUsuario ?? usuario?.idUsuario ?? null;
      const usuarioEmail = data.usuarioEmail ?? usuario?.email ?? null;
      const roles = data.roles ?? usuario?.roles ?? [];

      await prisma.auditoriaSistema.create({
        data: {
          ID_Usuario: idUsuario,
          UsuarioEmail: truncar(usuarioEmail, 100),
          Roles: truncar(roles.join(','), 255),
          Accion: truncar(data.accion, 80) || 'ACCION',
          Modulo: truncar(data.modulo, 80) || 'GENERAL',
          Entidad: truncar(data.entidad, 80),
          ID_Entidad: data.idEntidad ?? null,
          MetodoHTTP: truncar(data.metodoHTTP, 10),
          Ruta: truncar(data.ruta, 255),
          Ip: truncar(data.ip, 80),
          UserAgent: truncar(data.userAgent, 500),
          Resultado: data.resultado,
          CodigoEstado: data.codigoEstado ?? null,
          Mensaje: truncar(data.mensaje, 500),
          DatosAntes: serializar(data.datosAntes),
          DatosDespues: serializar(data.datosDespues),
        },
      });
    } catch (error) {
      console.error('No se pudo registrar auditoría:', error);
    }
  },

  registrarDesdeRequest: async (
    req: Request,
    data: Omit<RegistrarAuditoriaDTO, 'usuario' | 'metodoHTTP' | 'ruta' | 'ip' | 'userAgent'> & {
      usuario?: AuthUserPayload | null;
    }
  ) => {
    await AuditoriaService.registrar({
      ...data,
      usuario: data.usuario ?? req.user ?? null,
      metodoHTTP: req.method,
      ruta: req.originalUrl,
      ip: obtenerIp(req),
      userAgent: typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : null,
    });
  },

  listar: async (usuario: AuthUserPayload | undefined, filtros: FiltrosAuditoria) => {
    validarAdmin(usuario);

    const page = Math.max(Number(filtros.page || 1), 1);
    const limit = Math.min(Math.max(Number(filtros.limit || 25), 1), 100);
    const skip = (page - 1) * limit;
    const where = construirWhere(filtros);

    const [items, total] = await prisma.$transaction([
      prisma.auditoriaSistema.findMany({
        where,
        orderBy: {
          FechaHora: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.auditoriaSistema.count({
        where,
      }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  resumen: async (usuario: AuthUserPayload | undefined) => {
    validarAdmin(usuario);

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const [total, exitosos, fallidos, hoyTotal] = await Promise.all([
      prisma.auditoriaSistema.count(),
      prisma.auditoriaSistema.count({ where: { Resultado: 'EXITO' } }),
      prisma.auditoriaSistema.count({ where: { Resultado: 'FALLO' } }),
      prisma.auditoriaSistema.count({
        where: {
          FechaHora: {
            gte: hoy,
          },
        },
      }),
    ]);

    return {
      total,
      exitosos,
      fallidos,
      hoy: hoyTotal,
    };
  },
};
