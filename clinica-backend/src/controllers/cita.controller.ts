import type { Request, Response } from 'express';
import type { z } from 'zod';
import { CitaService } from '../services/cita.service.js';
import { AuditoriaService } from '../services/auditoria.service.js';
import { respuestaErrorCita } from '../services/cita.error.js';
import type { createCitaSchema, updateCitaSchema, disponibilidadCitaSchema, cancelCitaSchema } from '../schemas/cita.schema.js';

const rechazar = async (req: Request, res: Response, error: unknown, fallback: string, accion?: string) => {
  const publico = respuestaErrorCita(error, fallback);
  if (accion) await AuditoriaService.registrarDesdeRequest(req, {
    accion, modulo: 'CITAS', entidad: 'Cita', resultado: 'FALLO',
    codigoEstado: publico.status, mensaje: publico.message,
  });
  res.status(publico.status).json({ error: publico.message });
};

export const getCitas = async (req: Request, res: Response): Promise<void> => {
  try {
    const citas = await CitaService.getAll(req.user);
    res.setHeader('Cache-Control', 'no-store');
    res.json(citas);
  } catch (error) { await rechazar(req, res, error, 'No se pudo cargar la agenda. Vuelve a intentar.'); }
};
export const getCatalogosCitas = async (req: Request, res: Response): Promise<void> => {
  try { res.json(await CitaService.getCatalogos()); }
  catch (error) { await rechazar(req, res, error, 'No se pudieron cargar los datos para agendar. Vuelve a intentar.'); }
};
export const getHorariosOcupados = async (req: Request, res: Response): Promise<void> => {
  try {
    const { query } = res.locals.validated as z.infer<typeof disponibilidadCitaSchema>;
    res.setHeader('Cache-Control', 'no-store');
    res.json(await CitaService.getHorariosOcupados(query.psicologoId, query.fecha, req.user));
  } catch (error) { await rechazar(req, res, error, 'No se pudo comprobar la disponibilidad. Vuelve a intentar.'); }
};
export const createCita = async (req: Request, res: Response): Promise<void> => {
  try {
    const { body } = res.locals.validated as z.infer<typeof createCitaSchema>;
    const result = await CitaService.create(body, req.user);
    await AuditoriaService.registrarDesdeRequest(req, {
      accion: 'CITA_CREADA', modulo: 'CITAS', entidad: 'Cita', idEntidad: result.cita.ID_Cita,
      resultado: 'EXITO', codigoEstado: 201, mensaje: 'Cita creada correctamente.',
      datosDespues: {
        ID_Cita: result.cita.ID_Cita, ID_Paciente: result.cita.ID_Paciente,
        ID_Psicologo: result.cita.ID_Psicologo, Cod_Recibo: result.recibo.Cod_Recibo,
      },
    });
    res.status(201).json(result);
  } catch (error) { await rechazar(req, res, error, 'No se pudo crear la cita. Revisa los datos y vuelve a intentar.', 'CITA_CREADA'); }
};
export const updateCita = async (req: Request, res: Response): Promise<void> => {
  try {
    const { body, params } = res.locals.validated as z.infer<typeof updateCitaSchema>;
    const id = Number(params.id);
    const result = await CitaService.update(id, body, req.user);
    await AuditoriaService.registrarDesdeRequest(req, {
      accion: 'CITA_ACTUALIZADA', modulo: 'CITAS', entidad: 'Cita', idEntidad: id,
      resultado: 'EXITO', codigoEstado: 200, mensaje: 'Cita actualizada correctamente.',
      datosDespues: { ID_Cita: id, camposActualizados: Object.keys(body) },
    });
    res.json(result);
  } catch (error) { await rechazar(req, res, error, 'No se pudo actualizar la cita. Revisa los datos y vuelve a intentar.', 'CITA_ACTUALIZADA'); }
};
export const cancelCita = async (req: Request, res: Response): Promise<void> => {
  try {
    const { body, params } = res.locals.validated as z.infer<typeof cancelCitaSchema>;
    const id = Number(params.id);
    await CitaService.cancel(id, body.ID_MotivoCancelacion, body.NotasCancelacion || '', req.user);
    await AuditoriaService.registrarDesdeRequest(req, {
      accion: 'CITA_CANCELADA', modulo: 'CITAS', entidad: 'Cita', idEntidad: id,
      resultado: 'EXITO', codigoEstado: 200, mensaje: 'Cita cancelada correctamente.',
      datosDespues: { ID_Cita: id, ID_MotivoCancelacion: body.ID_MotivoCancelacion },
    });
    res.json({ message: 'Cita cancelada correctamente' });
  } catch (error) { await rechazar(req, res, error, 'No se pudo cancelar la cita. Actualiza la agenda y vuelve a intentar.', 'CITA_CANCELADA'); }
};
