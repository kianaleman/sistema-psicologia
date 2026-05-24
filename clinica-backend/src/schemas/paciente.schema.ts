import { z } from 'zod';

// Validador de IDs en la URL
const paramsSchema = z.object({
  id: z.string().regex(/^\d+$/, { message: 'El ID en la URL debe ser un número válido' })
});

export const createPacienteSchema = z.object({
  body: z.object({
    Nombre: z.string({ message: 'El nombre es obligatorio' }).min(2, 'El nombre es muy corto'),
    Apellido: z.string({ message: 'El apellido es obligatorio' }).min(2, 'El apellido es muy corto'),
    Fecha_Nacimiento: z.string({ message: 'La fecha de nacimiento es obligatoria' }),
    Genero: z.string({ message: 'El género es obligatorio' }),
    ID_Direccion: z.number({ message: 'La dirección es obligatoria' }).int().positive(),
    ID_Pais: z.number().int().positive().optional(),
    Activo: z.boolean().optional()
  })
});

// Para la actualización (PUT), hacemos los campos opcionales
export const updatePacienteSchema = z.object({
  params: paramsSchema,
  body: z.object({
    Nombre: z.string().min(2).optional(),
    Apellido: z.string().min(2).optional(),
    Fecha_Nacimiento: z.string().optional(),
    Genero: z.string().optional(),
    ID_Direccion: z.number().int().positive().optional(),
    ID_Pais: z.number().int().positive().optional(),
    Activo: z.boolean().optional()
  })
});

// Validamos solo el ID para las consultas específicas
export const getByIdSchema = z.object({
  params: paramsSchema
});