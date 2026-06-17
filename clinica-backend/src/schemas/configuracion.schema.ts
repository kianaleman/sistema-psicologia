import { z } from 'zod';

// Validamos que envíen el nombre del catálogo en la URL
const paramModeloSchema = z.object({
  modelo: z.string({ message: 'El nombre del modelo/catálogo es obligatorio' })
    .min(2, 'El nombre del modelo es muy corto')
});

// Validamos el modelo Y que el ID sea numérico
const paramModeloIdSchema = z.object({
  modelo: z.string({ message: 'El nombre del modelo/catálogo es obligatorio' }),
  id: z.string().regex(/^\d+$/, { message: 'El ID en la URL debe ser un número válido' })
});

export const getCatalogoSchema = z.object({
  params: paramModeloSchema
});

export const createCatalogoSchema = z.object({
  params: paramModeloSchema,
  // Para catálogos dinámicos, exigimos que envíen un objeto con al menos una propiedad
  body: z.record(z.string(),z.any()).refine(data => Object.keys(data).length > 0, {
    message: 'El cuerpo de la petición no puede estar vacío'
  })
});

export const updateCatalogoSchema = z.object({
  params: paramModeloIdSchema,
  body: z.record(z.string(),z.any()).refine(data => Object.keys(data).length > 0, {
    message: 'Debe enviar al menos un campo para actualizar'
  })
});

export const deleteCatalogoSchema = z.object({
  params: paramModeloIdSchema
});