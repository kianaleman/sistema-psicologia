import type { Request, Response } from 'express';
import { AuditoriaService, type FiltrosAuditoria } from '../services/auditoria.service.js';

const getErrorMessage = (error: unknown, fallback: string) => {
  return error instanceof Error ? error.message : fallback;
};

const getStatusFromError = (message: string) => {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('no autorizado')) return 401;
  if (lowerMessage.includes('no tiene permisos')) return 403;

  return 500;
};

const getQueryString = (value: unknown) => {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }

  if (Array.isArray(value) && typeof value[0] === 'string' && value[0].trim()) {
    return value[0].trim();
  }

  return undefined;
};

const getQueryNumber = (value: unknown) => {
  const stringValue = getQueryString(value);
  const numberValue = Number(stringValue);

  return Number.isInteger(numberValue) && numberValue > 0 ? numberValue : undefined;
};

const construirFiltrosAuditoria = (req: Request): FiltrosAuditoria => {
  const filtros: FiltrosAuditoria = {};

  const page = getQueryNumber(req.query.page);
  const limit = getQueryNumber(req.query.limit);
  const usuario = getQueryString(req.query.usuario);
  const modulo = getQueryString(req.query.modulo);
  const accion = getQueryString(req.query.accion);
  const resultado = getQueryString(req.query.resultado);
  const fechaInicio = getQueryString(req.query.fechaInicio);
  const fechaFin = getQueryString(req.query.fechaFin);
  const busqueda = getQueryString(req.query.busqueda);

  if (page !== undefined) filtros.page = page;
  if (limit !== undefined) filtros.limit = limit;
  if (usuario !== undefined) filtros.usuario = usuario;
  if (modulo !== undefined) filtros.modulo = modulo;
  if (accion !== undefined) filtros.accion = accion;
  if (resultado !== undefined) filtros.resultado = resultado;
  if (fechaInicio !== undefined) filtros.fechaInicio = fechaInicio;
  if (fechaFin !== undefined) filtros.fechaFin = fechaFin;
  if (busqueda !== undefined) filtros.busqueda = busqueda;

  return filtros;
};

export const getAuditorias = async (req: Request, res: Response): Promise<void> => {
  try {
    const filtros = construirFiltrosAuditoria(req);
    const result = await AuditoriaService.listar(req.user, filtros);

    res.json(result);
  } catch (error: unknown) {
    const message = getErrorMessage(error, 'Error al consultar auditoría');
    res.status(getStatusFromError(message)).json({ error: message });
  }
};

export const getResumenAuditoria = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await AuditoriaService.resumen(req.user);

    res.json(result);
  } catch (error: unknown) {
    const message = getErrorMessage(error, 'Error al consultar resumen de auditoría');
    res.status(getStatusFromError(message)).json({ error: message });
  }
};
