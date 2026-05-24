import { z } from 'zod';

// Validador de IDs en la URL
const paramsSchema = z.object({
  id: z.string().regex(/^\d+$/, { message: 'El ID en la URL debe ser un número válido' })
});

export const createPsicologoSchema = z.object({
  body: z.object({
    CodigoMinsa: z.string({ message: 'El Código MINSA es obligatorio' }).min(1, 'El código no puede estar vacío'),
    Nombre: z.string({ message: 'El nombre es obligatorio' }).min(2, 'El nombre es muy corto'),
    Apellido: z.string({ message: 'El apellido es obligatorio' }).min(2, 'El apellido es muy corto'),
    No_Telefono: z.string({ message: 'El número de teléfono es obligatorio' }).min(8, 'Número de teléfono inválido'),
    ID_Direccion: z.number({ message: 'La dirección es obligatoria' }).int().positive(),
    ID_Usuario: z.number().int().positive().optional(),
    ID_CodigoTelefono: z.number().int().positive().optional(),
    Activo: z.boolean().optional()
  })
});

// Para la actualización (PUT), todos los campos del body son opcionales
export const updatePsicologoSchema = z.object({
  params: paramsSchema,
  body: z.object({
    CodigoMinsa: z.string().min(1).optional(),
    Nombre: z.string().min(2).optional(),
    Apellido: z.string().min(2).optional(),
    No_Telefono: z.string().min(8).optional(),
    ID_Direccion: z.number().int().positive().optional(),
    ID_Usuario: z.number().int().positive().optional(),
    ID_CodigoTelefono: z.number().int().positive().optional(),
    Activo: z.boolean().optional()
  })
});