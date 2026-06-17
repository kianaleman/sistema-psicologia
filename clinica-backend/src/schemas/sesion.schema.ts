import { z } from 'zod';

export const createSesionSchema = z.object({
  body: z.object({
    ID_Cita: z.coerce.number().int().positive().optional(),
    ID_Expediente: z.coerce.number().int().nonnegative().optional().default(0),

    HoraDeInicio: z.string().optional(),
    HoraFinal: z.string().optional(),

    Observaciones: z.string({ message: 'Las observaciones son obligatorias' })
      .min(1, 'Las observaciones no pueden estar vacías'),
    DiagnosticoDiferencial: z.string({ message: 'El diagnóstico diferencial es obligatorio' })
      .min(1, 'El diagnóstico no puede estar vacío'),
    HistorialDeEvolucion: z.string({ message: 'El historial de evolución es obligatorio' })
      .min(1, 'El historial no puede estar vacío'),
    Criterios_DeDiagnostico: z.string({ message: 'Los criterios de diagnóstico son obligatorios' })
      .min(1, 'Los criterios no pueden estar vacíos'),
  }),
});

export const searchSesionSchema = z.object({
  query: z.object({
    q: z.string().optional(),
    ID_Cita: z.string().regex(/^\d+$/, { message: 'El ID de cita debe ser numérico' }).optional(),
    ID_Expediente: z.string().regex(/^\d+$/, { message: 'El ID de expediente debe ser numérico' }).optional(),
  }).optional(),
});
