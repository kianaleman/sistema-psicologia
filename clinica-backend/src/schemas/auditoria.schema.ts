import { z } from 'zod';

export const auditoriaQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    usuario: z.string().trim().optional(),
    modulo: z.string().trim().optional(),
    accion: z.string().trim().optional(),
    resultado: z.enum(['EXITO', 'FALLO']).optional(),
    fechaInicio: z.string().trim().optional(),
    fechaFin: z.string().trim().optional(),
    busqueda: z.string().trim().optional(),
  }),
});
