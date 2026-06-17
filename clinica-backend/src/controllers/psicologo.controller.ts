import type { Request, Response } from 'express';
import { PsicologoService } from '../services/psicologo.service.js';
import { AuditoriaService } from '../services/auditoria.service.js';

const getErrorMessage = (error: unknown, fallback: string) => {
  return error instanceof Error ? error.message : fallback;
};

export const getPsicologos = async (_req: Request, res: Response): Promise<void> => {
  try {
    const psicologos = await PsicologoService.getAll();
    res.json(psicologos);
  } catch (error: unknown) {
    res.status(500).json({
      error: getErrorMessage(error, 'Error al obtener los psicólogos'),
    });
  }
};

export const createPsicologo = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await PsicologoService.create(req.body);

    await AuditoriaService.registrarDesdeRequest(req, {
      accion: 'PSICOLOGO_CREADO',
      modulo: 'PSICOLOGOS',
      entidad: 'Psicologo',
      idEntidad: result.psicologo.ID_Psicologo,
      resultado: 'EXITO',
      codigoEstado: 201,
      mensaje: 'Psicólogo creado correctamente.',
      datosDespues: {
        ID_Psicologo: result.psicologo.ID_Psicologo,
        CodigoMinsa: result.psicologo.CodigoMinsa,
        Nombre: result.psicologo.Nombre,
        Apellido: result.psicologo.Apellido,
        Email: result.psicologo.Email,
      },
    });

    res.status(201).json(result);
  } catch (error: unknown) {
    const message = getErrorMessage(error, 'Error al registrar el psicólogo');

    await AuditoriaService.registrarDesdeRequest(req, {
      accion: 'PSICOLOGO_CREADO',
      modulo: 'PSICOLOGOS',
      entidad: 'Psicologo',
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

export const updatePsicologo = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: 'El ID proporcionado no es válido' });
      return;
    }

    const psicologo = await PsicologoService.update(id, req.body);

    await AuditoriaService.registrarDesdeRequest(req, {
      accion: 'PSICOLOGO_ACTUALIZADO',
      modulo: 'PSICOLOGOS',
      entidad: 'Psicologo',
      idEntidad: id,
      resultado: 'EXITO',
      codigoEstado: 200,
      mensaje: 'Psicólogo actualizado correctamente.',
      datosDespues: {
        ID_Psicologo: id,
        cambios: req.body,
      },
    });

    res.json(psicologo);
  } catch (error: unknown) {
    const message = getErrorMessage(error, 'Error al actualizar el psicólogo');

    await AuditoriaService.registrarDesdeRequest(req, {
      accion: 'PSICOLOGO_ACTUALIZADO',
      modulo: 'PSICOLOGOS',
      entidad: 'Psicologo',
      idEntidad: Number(req.params.id) || null,
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
