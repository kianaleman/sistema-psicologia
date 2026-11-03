import type { Request, Response } from 'express';
import type { z } from 'zod';
import { SesionService, ErrorClinico } from '../services/sesion.service.js';
import { AuditoriaService } from '../services/auditoria.service.js';
import { createSesionSchema, searchSesionSchema } from '../schemas/sesion.schema.js';
const responderError = (error: unknown, res: Response) => {
    const estado = error instanceof ErrorClinico ? error.status : 500;
    const mensaje = error instanceof ErrorClinico ? error.message : 'No se pudo guardar o consultar la sesión. Sus datos no se han descartado; puede reintentar.';
    res.status(estado).json({ error: mensaje });
};
export const createSesion = async (req: Request, res: Response): Promise<void> => {
    try {
        // Consumir coerciones, trim, defaults y deduplicación del contrato validado.
        const { body } = res.locals.validated as z.infer<typeof createSesionSchema>;
        const { sesion, creada } = await SesionService.create(body, req.user);
        await AuditoriaService.registrarDesdeRequest(req, {
            accion: creada ? 'SESION_CLINICA_CREADA' : 'SESION_CLINICA_REINTENTADA',
            modulo: 'SESIONES', entidad: 'Sesion', idEntidad: sesion.ID_Sesion,
            resultado: 'EXITO', codigoEstado: creada ? 201 : 200,
            mensaje: creada ? 'Consulta clínica registrada.' : 'Se confirmó la consulta registrada previamente.',
            datosDespues: { ID_Cita: body.ID_Cita, ID_Paciente: body.ID_Paciente, cantidadTratamientos: body.Tratamientos.length },
        });
        res.setHeader('Cache-Control', 'no-store');
        res.status(creada ? 201 : 200).json({ ...sesion, creada });
    }
    catch (error) {
        await AuditoriaService.registrarDesdeRequest(req, {
            accion: 'SESION_CLINICA_CREADA', modulo: 'SESIONES', entidad: 'Sesion',
            resultado: 'FALLO', codigoEstado: error instanceof ErrorClinico ? error.status : 500,
            mensaje: 'No se pudo registrar la consulta clínica.',
        });
        responderError(error, res);
    }
};
export const searchSesion = async (req: Request, res: Response): Promise<void> => {
    try {
        const { query } = res.locals.validated as z.infer<typeof searchSesionSchema>;
        const sesion = await SesionService.findByParams(query.pacienteId, query.psicologoId, req.user);
        if (!sesion) {
            res.status(404).json({ error: 'Sesión no encontrada' });
            return;
        }
        res.setHeader('Cache-Control', 'no-store');
        res.json(sesion);
    }
    catch (error) {
        responderError(error, res);
    }
};
