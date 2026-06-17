import { z } from 'zod';

const paramsSchema = z.object({
  id: z.string().regex(/^\d+$/, {
    message: 'El ID en la URL debe ser un número válido',
  }),
});

const numeroPositivo = (fieldName: string) =>
  z.preprocess(
    (value) => {
      if (typeof value === 'string' && value.trim() !== '') {
        return Number(value);
      }

      return value;
    },
    z.number({
      message: `${fieldName} debe ser un número válido`,
    }).int().positive(`${fieldName} debe ser mayor que cero`),
  );

const textoRequerido = (fieldName: string, min = 1) =>
  z.string({
    message: `${fieldName} es obligatorio`,
  }).trim().min(min, `${fieldName} no puede estar vacío`);

const telefonoSchema = z.string({
  message: 'El número de teléfono es obligatorio',
})
  .trim()
  .min(8, 'Número de teléfono inválido')
  .regex(/^[2578]\d{7}$/, 'El teléfono debe tener 8 dígitos e iniciar con 2, 5, 7 u 8');

const direccionSchema = z.object({
  municipioId: numeroPositivo('El municipio'),
  barrio: textoRequerido('El barrio', 1),
  calle: z.string().trim().optional().default(''),
});

const especialidadIdsSchema = z.array(numeroPositivo('La especialidad'))
  .min(1, 'Debe seleccionar al menos una especialidad');

export const createPsicologoSchema = z.object({
  body: z.object({
    Nombre: textoRequerido('El nombre', 2),
    Apellido: textoRequerido('El apellido', 2),
    CodigoMinsa: textoRequerido('El Código MINSA', 1),
    No_Telefono: telefonoSchema,
    Email: z.string({
      message: 'El correo electrónico es obligatorio',
    }).trim().email('El correo electrónico tiene un formato inválido'),

    // El frontend puede enviarlo como campo auxiliar, pero el service crea la direccion real.
    // Por eso se permite 0 y no se valida como direccion existente.
    ID_Direccion: z.number().int().nonnegative().optional(),

    ID_CodigoTelefono: z.number().int().positive().optional(),
    codigoTelefonoId: z.number().int().positive().optional(),
    paisId: z.number().int().positive().optional(),
    direccion: direccionSchema,
    especialidadIds: especialidadIdsSchema,
    Activo: z.boolean().optional(),
  }),
});

export const updatePsicologoSchema = z.object({
  params: paramsSchema,
  body: z.object({
    Nombre: textoRequerido('El nombre', 2).optional(),
    Apellido: textoRequerido('El apellido', 2).optional(),
    CodigoMinsa: textoRequerido('El Código MINSA', 1).optional(),
    No_Telefono: telefonoSchema.optional(),
    Email: z.string().trim().email('El correo electrónico tiene un formato inválido').optional(),

    // Campo auxiliar compatible con tipos del frontend.
    ID_Direccion: z.number().int().nonnegative().optional(),

    ID_CodigoTelefono: z.number().int().positive().optional(),
    codigoTelefonoId: z.number().int().positive().optional(),
    paisId: z.number().int().positive().optional(),
    direccion: direccionSchema.optional(),
    especialidadIds: especialidadIdsSchema.optional(),
    Activo: z.boolean().optional(),
  }),
});
