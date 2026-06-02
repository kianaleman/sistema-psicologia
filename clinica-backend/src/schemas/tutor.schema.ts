import { z } from 'zod';

const paramsSchema = z.object({
  id: z.string().regex(/^\d+$/, { message: 'El ID en la URL debe ser un número válido' }),
});

const direccionTutorSchema = z.object({
  Pais: z.string().trim().min(1, 'El país es obligatorio').optional(),
  Barrio: z.string().trim().min(1, 'El barrio es obligatorio').optional(),
  Calle: z.string().trim().optional(),
  ID_Municipio: z.number().int().positive('El municipio debe ser válido').optional(),
  municipioId: z.number().int().positive('El municipio debe ser válido').optional(),
}).optional();

export const createTutorSchema = z.object({
  body: z.object({
    No_Cedula: z.string().optional(),
    Nombre: z.string({ message: 'El nombre es obligatorio' }).min(2, 'El nombre es muy corto'),
    Apellido: z.string({ message: 'El apellido es obligatorio' }).min(2, 'El apellido es muy corto'),
    No_Telefono: z.string({ message: 'El número de teléfono es obligatorio' }).min(8, 'Número de teléfono inválido'),
    Ocupacion: z.number({ message: 'La ocupación es obligatoria' }).int().positive(),
    EstadoCivil: z.number({ message: 'El estado civil es obligatorio' }).int().positive(),
    ID_CodigoTelefono: z.number().int().positive().optional(),
  }),
});

export const updateTutorSchema = z.object({
  params: paramsSchema,
  body: z.object({
    No_Cedula: z.string().optional(),
    Nombre: z.string().min(2, 'El nombre es muy corto').optional(),
    Apellido: z.string().min(2, 'El apellido es muy corto').optional(),
    No_Telefono: z.string().min(8, 'Número de teléfono inválido').optional(),
    Ocupacion: z.number().int().positive().optional(),
    EstadoCivil: z.number().int().positive().optional(),
    ID_CodigoTelefono: z.number().int().positive().optional(),
    Direccion: direccionTutorSchema,
  }),
});
