import { z } from 'zod';

const paramsSchema = z.object({
  id: z.string().regex(/^\d+$/, { message: 'El ID en la URL debe ser un número válido' })
});

export const createCitaSchema = z.object({
  body: z.object({
    ID_Paciente: z.number({ message: 'El ID del paciente es obligatorio' }).int().positive(),
    ID_Psicologo: z.number({ message: 'El ID del psicólogo es obligatorio' }).int().positive(),
    ID_TipoCita: z.number({ message: 'El tipo de cita es obligatorio' }).int().positive(),
    ID_Direccion: z.number({ message: 'La dirección es obligatoria' }).int().positive(),
    ID_EstadoCita: z.number().int().positive().default(1),
    FechaCita: z.string({ message: 'La fecha de la cita es obligatoria' }),
    HoraCita: z.string({ message: 'La hora de la cita es obligatoria' }),
    MotivoConsulta: z.string().optional(),
    
    // --- DATOS DE FACTURACIÓN OBLIGATORIOS ---
    Precio: z.number({ message: 'El precio es obligatorio' }).min(0),
    ID_Divisa: z.number().int().positive().default(1), // Asumiendo 1 = Córdobas
    ID_MetodoPago: z.number().int().positive(),
    ID_Banco: z.number().int().positive().optional().nullable(),
    Numero_Referencia: z.string().optional().nullable(),
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
    FechaCita: z.string().optional(),
    HoraCita: z.string().optional(),
    MotivoConsulta: z.string().optional(),
    
    Precio: z.number().min(0).optional(),
    ID_Divisa: z.number().int().positive().optional(),
    ID_MetodoPago: z.number().int().positive().optional(),
    ID_Banco: z.number().int().positive().optional().nullable(),
    Numero_Referencia: z.string().optional().nullable(),
  })
});

export const cancelCitaSchema = z.object({
  params: paramsSchema,
  body: z.object({
    ID_MotivoCancelacion: z.number({ message: 'El motivo de cancelación es obligatorio' }).int().positive(),
    NotasCancelacion: z.string().optional()
  })
});