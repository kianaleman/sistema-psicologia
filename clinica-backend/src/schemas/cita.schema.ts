import { z } from 'zod';

// Validador reutilizable para los parámetros de la URL
const paramsSchema = z.object({
  id: z.string().regex(/^\d+$/, { message: 'El ID en la URL debe ser un número válido' })
});

// Esquema para crear una cita (POST)
export const createCitaSchema = z.object({
  body: z.object({
    ID_Paciente: z.number({ message: 'El ID del paciente es obligatorio' }).int().positive(),
    ID_Psicologo: z.number({ message: 'El ID del psicólogo es obligatorio' }).int().positive(),
    ID_TipoCita: z.number({ message: 'El tipo de cita es obligatorio' }).int().positive(),
    ID_Direccion: z.number({ message: 'La dirección es obligatoria' }).int().positive(),
    ID_EstadoCita: z.number({ message: 'El estado de la cita es obligatorio' }).int().positive(),
    FechaCita: z.string({ message: 'La fecha de la cita es obligatoria' }),
    HoraCita: z.string({ message: 'La hora de la cita es obligatoria' }),
    MotivoConsulta: z.string().optional(),
  })
});

// Esquema para actualizar una cita (PUT/PATCH)
export const updateCitaSchema = z.object({
  params: paramsSchema,
  body: z.object({
    ID_Paciente: z.number().int().positive().optional(),
    ID_Psicologo: z.number().int().positive().optional(),
    ID_TipoCita: z.number().int().positive().optional(),
    ID_Direccion: z.number().int().positive().optional(),
    ID_EstadoCita: z.number().int().positive().optional(),
    FechaCita: z.string().optional(),
    HoraCita: z.string().optional(),
    MotivoConsulta: z.string().optional(),
  })
});

// Esquema para cancelar una cita (PATCH)
export const cancelCitaSchema = z.object({
  params: paramsSchema,
  body: z.object({
    ID_MotivoCancelacion: z.number({ message: 'El motivo de cancelación es obligatorio' }).int().positive(),
    NotasCancelacion: z.string().optional()
  })
});