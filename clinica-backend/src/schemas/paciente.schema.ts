import { z } from 'zod';

const paramsSchema = z.object({
  id: z.string().regex(/^\d+$/, { message: 'El ID en la URL debe ser un número válido' })
});

export const createPacienteSchema = z.object({
  body: z.object({
    nombre: z.string().min(2),
    apellido: z.string().min(2),
    fechaNac: z.string(),
    genero: z.string(),
    activo: z.boolean().optional(),
    esAdulto: z.boolean(),
    paisId: z.number().int(), // <-- NUEVO
    
    direccion: z.object({
      municipioId: z.number().int(), // <-- NUEVO
      barrio: z.string(),
      calle: z.string().optional()
    }),

    datosAdulto: z.object({
      cedula: z.string(),
      codigoTelefonoId: z.number().int(), // <-- NUEVO
      telefono: z.string(),
      ocupacionId: z.number().int(),
      estadoCivilId: z.number().int(),
    }).optional(),

    datosMenor: z.object({
      partNacimiento: z.string(),
      grado: z.string().optional(),
      modoTutor: z.enum(['existente', 'nuevo']),
      tutorId: z.number().int().optional(),
      nuevoTutor: z.object({
        nombre: z.string(),
        apellido: z.string(),
        cedula: z.string(),
        codigoTelefonoId: z.number().int(), // <-- NUEVO
        telefono: z.string(),
        ocupacionId: z.number().int(),
        estadoCivilId: z.number().int(),
        parentescoId: z.number().int(),
        direccion: z.object({
          municipioId: z.number().int(), // <-- NUEVO
          barrio: z.string(),
          calle: z.string().optional()
        }).optional()
      }).optional()
    }).optional()
  })
});

export const updatePacienteSchema = z.object({
  params: paramsSchema,
  body: createPacienteSchema.shape.body.partial() 
});

export const getByIdSchema = z.object({
  params: paramsSchema
});