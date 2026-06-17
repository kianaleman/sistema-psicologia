import type { Request, Response } from 'express';
import { TutorService, createTutorService } from '../services/tutor.service.js';

type DireccionTutorPayload = {
  Pais?: string;
  Barrio?: string;
  Calle?: string;
  ID_Municipio?: number;
  municipioId?: number;
};

type UpdateTutorPayload = {
  Nombre: string;
  Apellido: string;
  No_Cedula: string;
  No_Telefono: string;
  codigoTelefonoId?: number;
  ID_CodigoTelefono?: number;
  ocupacionId?: number;
  Ocupacion?: number;
  estadoCivilId?: number;
  EstadoCivil?: number;
  Direccion?: DireccionTutorPayload;
};

const getErrorMessage = (error: unknown, fallback: string) => {
  return error instanceof Error ? error.message : fallback;
};

const getStatusFromError = (message: string) => {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('no autorizado')) return 401;

  if (lowerMessage.includes('no tiene permisos')) return 403;

  if (message === 'Tutor no encontrado') return 404;

  if (
    lowerMessage.includes('duplicidad') ||
    lowerMessage.includes('formato de cédula') ||
    lowerMessage.includes('teléfono inválido') ||
    lowerMessage.includes('debe seleccionar') ||
    lowerMessage.includes('dirección') ||
    lowerMessage.includes('barrio') ||
    lowerMessage.includes('municipio')
  ) {
    return 400;
  }

  return 500;
};

const esNumeroValido = (value: number) => {
  return Number.isInteger(value) && value > 0;
};

const toNumeroOpcional = (value: unknown) => {
  const numero = Number(value);

  return esNumeroValido(numero) ? numero : undefined;
};

const esErrorPrismaDuplicado = (error: unknown) => {
  return typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'P2002';
};

const esObjeto = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const normalizarDireccion = (value: unknown): DireccionTutorPayload | undefined => {
  if (!esObjeto(value)) return undefined;

  const direccion: DireccionTutorPayload = {};

  if (typeof value.Pais === 'string') {
    direccion.Pais = value.Pais;
  }

  if (typeof value.Barrio === 'string') {
    direccion.Barrio = value.Barrio;
  }

  if (typeof value.Calle === 'string') {
    direccion.Calle = value.Calle;
  }

  const idMunicipio = toNumeroOpcional(value.ID_Municipio);
  const municipioId = toNumeroOpcional(value.municipioId);

  if (idMunicipio) {
    direccion.ID_Municipio = idMunicipio;
  }

  if (municipioId) {
    direccion.municipioId = municipioId;
  }

  return Object.keys(direccion).length > 0 ? direccion : undefined;
};

export const getTutores = async (req: Request, res: Response): Promise<void> => {
  try {
    const tutores = await TutorService.getAll(req.user);
    res.json(tutores);
  } catch (error: unknown) {
    const message = getErrorMessage(error, 'Error al obtener tutores');
    console.error(error);
    res.status(getStatusFromError(message)).json({ error: message });
  }
};

export const createTutor = async (req: Request, res: Response): Promise<void> => {
  try {
    const nuevoTutor = await createTutorService(req.body, req.user);

    res.status(201).json({
      mensaje: 'Tutor registrado exitosamente',
      tutor: nuevoTutor,
    });
  } catch (error: unknown) {
    const message = getErrorMessage(error, 'Error interno al crear el tutor');
    console.error('Error al crear tutor:', error);

    if (esErrorPrismaDuplicado(error)) {
      res.status(400).json({ error: 'Ya existe un tutor registrado con este número de cédula' });
      return;
    }

    res.status(getStatusFromError(message)).json({ error: message });
  }
};

export const updateTutor = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: 'El ID proporcionado no es válido' });
      return;
    }

    const body = req.body as Record<string, unknown>;

    const payload: UpdateTutorPayload = {
      Nombre: typeof body.Nombre === 'string' ? body.Nombre : '',
      Apellido: typeof body.Apellido === 'string' ? body.Apellido : '',
      No_Cedula: typeof body.No_Cedula === 'string' ? body.No_Cedula : '',
      No_Telefono: typeof body.No_Telefono === 'string' ? body.No_Telefono : '',
    };

    const codigoTelefonoId = toNumeroOpcional(body.codigoTelefonoId);
    const idCodigoTelefono = toNumeroOpcional(body.ID_CodigoTelefono);
    const ocupacionId = toNumeroOpcional(body.ocupacionId);
    const ocupacion = toNumeroOpcional(body.Ocupacion);
    const estadoCivilId = toNumeroOpcional(body.estadoCivilId);
    const estadoCivil = toNumeroOpcional(body.EstadoCivil);
    const direccion = normalizarDireccion(body.Direccion);

    if (codigoTelefonoId) {
      payload.codigoTelefonoId = codigoTelefonoId;
    }

    if (idCodigoTelefono) {
      payload.ID_CodigoTelefono = idCodigoTelefono;
    }

    if (ocupacionId) {
      payload.ocupacionId = ocupacionId;
    }

    if (ocupacion) {
      payload.Ocupacion = ocupacion;
    }

    if (estadoCivilId) {
      payload.estadoCivilId = estadoCivilId;
    }

    if (estadoCivil) {
      payload.EstadoCivil = estadoCivil;
    }

    if (direccion) {
      payload.Direccion = direccion;
    }

    const tutorActualizado = await TutorService.update(id, payload, req.user);

    res.json(tutorActualizado);
  } catch (error: unknown) {
    const message = getErrorMessage(error, 'Error al actualizar tutor');
    console.error(error);
    res.status(getStatusFromError(message)).json({ error: message });
  }
};
