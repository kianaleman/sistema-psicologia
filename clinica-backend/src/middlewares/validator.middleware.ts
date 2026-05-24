import type { Request, Response, NextFunction } from 'express';
import { ZodObject, ZodError } from 'zod';

export const validateSchema = (schema: ZodObject) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Zod evaluará el body, los parámetros de la URL y los query params
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next(); // Si todo es correcto, pasa al controlador
    } catch (error) {
      if (error instanceof ZodError) {
        // Mapeamos el error de Zod a un formato limpio para el frontend
        res.status(400).json({
          error: 'Datos inválidos',
          detalles: error.issues.map(issue => ({
            campo: issue.path.length > 1 ? issue.path[1] : issue.path[0],
            mensaje: issue.message
          }))
        });
        return;
      }
      res.status(500).json({ error: 'Error interno de validación' });
    }
  };
};