import { z } from 'zod';

const horaSchema = z.string().optional();

export const createSesionSchema = z.object({
  body: z.object({
    ID_Cita: z.coerce.number().int().positive({
      message: 'ID_Cita debe ser un número válido',
    }),
    ID_Expediente: z.coerce.number().int().nonnegative().optional().default(0),
    HoraDeInicio: horaSchema,
    HoraFinal: horaSchema,
    Observaciones: z.string().optional().default(''),
    DiagnosticoDiferencial: z.string({
      message: 'El diagnóstico diferencial es obligatorio',
    }).min(1, 'El diagnóstico no puede estar vacío'),
    HistorialDeEvolucion: z.string().optional().default(''),
    Criterios_DeDiagnostico: z.string({
      message: 'Los criterios de diagnóstico son obligatorios',
    }).min(1, 'Los criterios no pueden estar vacíos'),
    ExploracionesIds: z.array(z.coerce.number().int().positive()).optional().default([]),
    Tratamiento: z.unknown().optional(),
  }),
});

export const searchSesionSchema = z.object({
  query: z.object({
    q: z.string().optional(),
    pacienteId: z.string().regex(/^\d+$/, {
      message: 'El ID de paciente debe ser numérico',
    }).optional(),
    psicologoId: z.string().regex(/^\d+$/, {
      message: 'El ID de psicólogo debe ser numérico',
    }).optional(),
    ID_Cita: z.string().regex(/^\d+$/, {
      message: 'El ID de cita debe ser numérico',
    }).optional(),
    ID_Expediente: z.string().regex(/^\d+$/, {
      message: 'El ID de expediente debe ser numérico',
    }).optional(),
  }).optional(),
});
