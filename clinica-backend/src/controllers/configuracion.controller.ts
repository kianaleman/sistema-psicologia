import type { Request, Response } from 'express';
import { ConfiguracionService } from '../services/configuracion.service.js';
import { AuditoriaService } from '../services/auditoria.service.js';

const getErrorMessage = (error: unknown, fallback: string) => {
  return error instanceof Error ? error.message : fallback;
};

const getStatusFromError = (error: unknown) => {
  const message = getErrorMessage(error, 'Error interno');

  if (message === 'Catálogo no válido') return 400;
  if (message.includes('No se puede eliminar')) return 409;

  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'P2003'
  ) {
    return 409;
  }

  return 500;
};

const getParamString = (value: unknown) => {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }

  if (Array.isArray(value) && typeof value[0] === 'string' && value[0].trim()) {
    return value[0].trim();
  }

  return null;
};

const getParamNumber = (value: unknown) => {
  const stringValue = getParamString(value);
  const numberValue = Number(stringValue);

  return Number.isInteger(numberValue) && numberValue > 0 ? numberValue : null;
};

const getNombreBody = (body: unknown) => {
  if (typeof body !== 'object' || body === null || !('nombre' in body)) {
    return '';
  }

  const nombre = (body as { nombre?: unknown }).nombre;

  return typeof nombre === 'string' ? nombre.trim() : '';
};

export const getCatalogoItems = async (req: Request, res: Response): Promise<void> => {
  try {
    const modelo = getParamString(req.params.modelo);

    if (!modelo) {
      res.status(400).json({ error: 'El catálogo solicitado no es válido' });
      return;
    }

    const items = await ConfiguracionService.getAll(modelo);
    res.json(items);
  } catch (error: unknown) {
    const status = getStatusFromError(error);
    res.status(status).json({ error: getErrorMessage(error, 'Error al cargar catálogo') });
  }
};

export const createCatalogoItem = async (req: Request, res: Response): Promise<void> => {
  const modelo = getParamString(req.params.modelo);

  try {
    if (!modelo) {
      res.status(400).json({ error: 'El catálogo solicitado no es válido' });
      return;
    }

    const nombre = getNombreBody(req.body);

    if (!nombre) {
      res.status(400).json({ error: 'El nombre es requerido' });
      return;
    }

    const newItem = await ConfiguracionService.create(modelo, nombre);

    await AuditoriaService.registrarDesdeRequest(req, {
      accion: 'CATALOGO_CREADO',
      modulo: 'CONFIGURACION',
      entidad: modelo,
      resultado: 'EXITO',
      codigoEstado: 201,
      mensaje: 'Registro de catálogo creado.',
      datosDespues: newItem,
    });

    res.status(201).json(newItem);
  } catch (error: unknown) {
    const status = getStatusFromError(error);
    const message = getErrorMessage(error, 'Error al crear registro');

    await AuditoriaService.registrarDesdeRequest(req, {
      accion: 'CATALOGO_CREADO',
      modulo: 'CONFIGURACION',
      entidad: modelo,
      resultado: 'FALLO',
      codigoEstado: status,
      mensaje: message,
      datosDespues: req.body,
    });

    res.status(status).json({ error: message });
  }
};

export const updateCatalogoItem = async (req: Request, res: Response): Promise<void> => {
  const modelo = getParamString(req.params.modelo);
  const id = getParamNumber(req.params.id);

  try {
    if (!modelo) {
      res.status(400).json({ error: 'El catálogo solicitado no es válido' });
      return;
    }

    if (!id) {
      res.status(400).json({ error: 'El ID proporcionado no es válido' });
      return;
    }

    const nombre = getNombreBody(req.body);
    const updatedItem = await ConfiguracionService.update(modelo, id, nombre);

    await AuditoriaService.registrarDesdeRequest(req, {
      accion: 'CATALOGO_ACTUALIZADO',
      modulo: 'CONFIGURACION',
      entidad: modelo,
      idEntidad: id,
      resultado: 'EXITO',
      codigoEstado: 200,
      mensaje: 'Registro de catálogo actualizado.',
      datosDespues: updatedItem,
    });

    res.json(updatedItem);
  } catch (error: unknown) {
    const status = getStatusFromError(error);
    const message = getErrorMessage(error, 'Error al actualizar registro');

    await AuditoriaService.registrarDesdeRequest(req, {
      accion: 'CATALOGO_ACTUALIZADO',
      modulo: 'CONFIGURACION',
      entidad: modelo,
      idEntidad: id,
      resultado: 'FALLO',
      codigoEstado: status,
      mensaje: message,
      datosDespues: req.body,
    });

    res.status(status).json({ error: message });
  }
};

export const deleteCatalogoItem = async (req: Request, res: Response): Promise<void> => {
  const modelo = getParamString(req.params.modelo);
  const id = getParamNumber(req.params.id);

  try {
    if (!modelo) {
      res.status(400).json({ error: 'El catálogo solicitado no es válido' });
      return;
    }

    if (!id) {
      res.status(400).json({ error: 'El ID proporcionado no es válido' });
      return;
    }

    await ConfiguracionService.delete(modelo, id);

    await AuditoriaService.registrarDesdeRequest(req, {
      accion: 'CATALOGO_ELIMINADO',
      modulo: 'CONFIGURACION',
      entidad: modelo,
      idEntidad: id,
      resultado: 'EXITO',
      codigoEstado: 200,
      mensaje: 'Registro de catálogo eliminado.',
      datosDespues: {
        modelo,
        id,
      },
    });

    res.json({ message: 'Registro eliminado correctamente' });
  } catch (error: unknown) {
    const status = getStatusFromError(error);
    const message = typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === 'P2003'
      ? 'No se puede eliminar: Este registro está enlazado a otros datos del sistema.'
      : getErrorMessage(error, 'Error al eliminar registro');

    await AuditoriaService.registrarDesdeRequest(req, {
      accion: 'CATALOGO_ELIMINADO',
      modulo: 'CONFIGURACION',
      entidad: modelo,
      idEntidad: id,
      resultado: 'FALLO',
      codigoEstado: status,
      mensaje: message,
    });

    res.status(status).json({ error: message });
  }
};
