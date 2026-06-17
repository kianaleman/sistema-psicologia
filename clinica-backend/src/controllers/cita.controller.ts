import type { Request, Response } from 'express';
import { CitaService } from '../services/cita.service.js';
import { AuditoriaService } from '../services/auditoria.service.js';

const getErrorMessage = (error: unknown, fallback: string) => {
  return error instanceof Error ? error.message : fallback;
};

const getStatusFromError = (message: string) => {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('no autorizado')) return 401;

  if (
    lowerMessage.includes('no tiene permisos') ||
    lowerMessage.includes('no tiene un perfil') ||
    lowerMessage.includes('otro psicólogo')
  ) {
    return 403;
  }

  if (message === 'El psicólogo ya tiene una cita agendada en este horario.') {
    return 409;
  }

  return 400;
};

export const getCitas = async (req: Request, res: Response): Promise<void> => {
  try {
    const citas = await CitaService.getAll(req.user);
    res.json(citas);
  } catch (error: unknown) {
    const message = getErrorMessage(error, 'Error al obtener citas');
    console.error(error);
    res.status(getStatusFromError(message)).json({ error: message });
  }
};

export const getCatalogosCitas = async (_req: Request, res: Response): Promise<void> => {
  try {
    const catalogos = await CitaService.getCatalogos();
    res.json(catalogos);
  } catch {
    res.status(500).json({ error: 'Error cargando catálogos de citas' });
  }
};

export const getHorariosOcupados = async (req: Request, res: Response): Promise<void> => {
  try {
    const { psicologoId, fecha } = req.query;

    if (!psicologoId || !fecha) {
      res.status(400).json({ error: 'Faltan parámetros: psicologoId y fecha son requeridos.' });
      return;
    }

    const horarios = await CitaService.getHorariosOcupados(
      Number(psicologoId),
      String(fecha),
      req.user
    );

    res.json(horarios);
  } catch (error: unknown) {
    const message = getErrorMessage(error, 'Error al consultar disponibilidad');
    console.error(error);
    res.status(getStatusFromError(message)).json({ error: message });
  }
};

export const createCita = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await CitaService.create(req.body, req.user);

    await AuditoriaService.registrarDesdeRequest(req, {
      accion: 'CITA_CREADA',
      modulo: 'CITAS',
      entidad: 'Cita',
      idEntidad: result.cita.ID_Cita,
      resultado: 'EXITO',
      codigoEstado: 201,
      mensaje: 'Cita creada correctamente.',
      datosDespues: {
        ID_Cita: result.cita.ID_Cita,
        ID_Paciente: result.cita.ID_Paciente,
        ID_Psicologo: result.cita.ID_Psicologo,
        ID_EstadoCita: result.cita.ID_EstadoCita,
        Cod_Recibo: result.recibo.Cod_Recibo,
        MontoTotal: result.recibo.MontoTotal,
      },
    });

    res.status(201).json(result);
  } catch (error: unknown) {
    const message = getErrorMessage(error, 'Error al crear cita');
    console.error(error);

    await AuditoriaService.registrarDesdeRequest(req, {
      accion: 'CITA_CREADA',
      modulo: 'CITAS',
      entidad: 'Cita',
      resultado: 'FALLO',
      codigoEstado: getStatusFromError(message),
      mensaje: message,
      datosDespues: req.body,
    });

    res.status(getStatusFromError(message)).json({ error: message });
  }
};

export const updateCita = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: 'El ID proporcionado no es válido' });
      return;
    }

    const result = await CitaService.update(id, req.body, req.user);

    await AuditoriaService.registrarDesdeRequest(req, {
      accion: 'CITA_ACTUALIZADA',
      modulo: 'CITAS',
      entidad: 'Cita',
      idEntidad: id,
      resultado: 'EXITO',
      codigoEstado: 200,
      mensaje: 'Cita actualizada correctamente.',
      datosDespues: {
        ID_Cita: id,
        cambios: req.body,
      },
    });

    res.json(result);
  } catch (error: unknown) {
    const message = getErrorMessage(error, 'Error al actualizar cita');
    console.error(error);

    await AuditoriaService.registrarDesdeRequest(req, {
      accion: 'CITA_ACTUALIZADA',
      modulo: 'CITAS',
      entidad: 'Cita',
      idEntidad: Number(req.params.id) || null,
      resultado: 'FALLO',
      codigoEstado: getStatusFromError(message),
      mensaje: message,
      datosDespues: req.body,
    });

    res.status(getStatusFromError(message)).json({ error: message });
  }
};

export const cancelCita = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: 'El ID proporcionado no es válido' });
      return;
    }

    const { ID_MotivoCancelacion, NotasCancelacion } = req.body as {
      ID_MotivoCancelacion?: number;
      NotasCancelacion?: string;
    };

    if (!ID_MotivoCancelacion) {
      res.status(400).json({ error: 'Debe seleccionar un motivo.' });
      return;
    }

    await CitaService.cancel(id, Number(ID_MotivoCancelacion), NotasCancelacion || '', req.user);

    await AuditoriaService.registrarDesdeRequest(req, {
      accion: 'CITA_CANCELADA',
      modulo: 'CITAS',
      entidad: 'Cita',
      idEntidad: id,
      resultado: 'EXITO',
      codigoEstado: 200,
      mensaje: 'Cita cancelada correctamente.',
      datosDespues: {
        ID_Cita: id,
        ID_MotivoCancelacion,
        NotasCancelacion,
      },
    });

    res.json({ message: 'Cita cancelada correctamente' });
  } catch (error: unknown) {
    const message = getErrorMessage(error, 'Error al cancelar cita');

    await AuditoriaService.registrarDesdeRequest(req, {
      accion: 'CITA_CANCELADA',
      modulo: 'CITAS',
      entidad: 'Cita',
      idEntidad: Number(req.params.id) || null,
      resultado: 'FALLO',
      codigoEstado: getStatusFromError(message),
      mensaje: message,
      datosDespues: req.body,
    });

    res.status(getStatusFromError(message)).json({ error: message });
  }
};
