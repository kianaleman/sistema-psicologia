import { z } from 'zod';
import { fechaCalendarioSchema, horaCitaSchema } from '../lib/fechaCalendario.js';

const paramsSchema = z.object({
  id: z.string().regex(/^[1-9]\d*$/, { message: 'El ID en la URL debe ser un número válido' })
    .refine(value => Number.isSafeInteger(Number(value)) && Number(value) <= 2147483647, 'El ID en la URL debe ser un número válido')
});

export const createCitaSchema = z.object({
  body: z.object({
    ID_Paciente: z.number({ message: 'El ID del paciente es obligatorio' }).int().positive(),
    ID_Psicologo: z.number({ message: 'El ID del psicólogo es obligatorio' }).int().positive(),
    ID_TipoCita: z.number({ message: 'El tipo de cita es obligatorio' }).int().positive(),
    ID_Direccion: z.number({ message: 'La dirección es obligatoria' }).int().positive(),
    ID_EstadoCita: z.number().int().positive().default(1),
    FechaCita: fechaCalendarioSchema,
    HoraCita: horaCitaSchema,
    MotivoConsulta: z.string().optional(),
    
    // --- DATOS DE FACTURACIÓN OBLIGATORIOS ---
    Precio: z.number({ message: 'El precio es obligatorio' }).min(0),
    ID_Divisa: z.number().int().positive().default(1), // Asumiendo 1 = Córdobas
    ID_MetodoPago: z.number().int().positive(),
    ID_Banco: z.number().int().positive().optional().nullable(),
    Numero_Referencia: z.string().trim().max(50, 'La referencia debe tener como máximo 50 caracteres.').optional().nullable(),
  }).superRefine((body, ctx) => {
    if (body.ID_MetodoPago !== 1) {
      if (!body.ID_Banco) ctx.addIssue({ code: 'custom', path: ['ID_Banco'], message: 'Selecciona el banco para el método de pago elegido.' });
      if (!body.Numero_Referencia) ctx.addIssue({ code: 'custom', path: ['Numero_Referencia'], message: 'El número de referencia es obligatorio para este método de pago.' });
    }
  })
});

export const updateCitaSchema = z.object({
  params: paramsSchema,
  body: z.object({
    ID_Paciente: z.number().int().positive().optional(),
    ID_Psicologo: z.number().int().positive().optional(),
    ID_TipoCita: z.number().int().positive().optional(),
    ID_Direccion: z.number().int().positive().optional(),
    ID_EstadoCita: z.number().int().positive().optional(),
    FechaCita: fechaCalendarioSchema.optional(),
    HoraCita: horaCitaSchema.optional(),
    MotivoConsulta: z.string().optional(),
    
    Precio: z.number().min(0).optional(),
    ID_Divisa: z.number().int().positive().optional(),
    ID_MetodoPago: z.number().int().positive().optional(),
    ID_Banco: z.number().int().positive().optional().nullable(),
    Numero_Referencia: z.string().trim().max(50, 'La referencia debe tener como máximo 50 caracteres.').optional().nullable(),
  })
});

export const disponibilidadCitaSchema = z.object({
  query: z.object({
    psicologoId: z.coerce.number().int().positive('Selecciona un profesional válido.').max(2147483647),
    fecha: fechaCalendarioSchema,
  }),
});

export type CreateCitaDTO = z.infer<typeof createCitaSchema>['body'];
export type UpdateCitaDTO = z.infer<typeof updateCitaSchema>['body'];

export const cancelCitaSchema = z.object({
  params: paramsSchema,
  body: z.object({
    ID_MotivoCancelacion: z.number({ message: 'El motivo de cancelación es obligatorio' }).int().positive(),
    NotasCancelacion: z.string().optional()
  })
});
