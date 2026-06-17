import { z } from 'zod';

const idSchema = z.number({ message: 'El ID es obligatorio.' }).int().positive('El ID debe ser válido.');

const opcionSchema = z.object({
  texto: z.string({ message: 'El texto de la opción es obligatorio.' }).trim().min(1, 'El texto de la opción es obligatorio.'),
  valor: z.number({ message: 'El valor de la opción es obligatorio.' }).int('El valor debe ser entero.'),
  orden: z.number({ message: 'El orden de la opción es obligatorio.' }).int().positive('El orden debe ser válido.'),
});

const preguntaSchema = z.object({
  texto: z.string({ message: 'El texto de la pregunta es obligatorio.' }).trim().min(1, 'El texto de la pregunta es obligatorio.'),
  orden: z.number({ message: 'El orden de la pregunta es obligatorio.' }).int().positive('El orden debe ser válido.'),
  activa: z.boolean().optional(),
  esCritica: z.boolean().optional(),
  valorCriticoMinimo: z.number().int().nullable().optional(),
  opciones: z.array(opcionSchema).min(1, 'Cada pregunta debe tener al menos una opción.'),
});

const rangoSchema = z.object({
  puntajeMin: z.number({ message: 'El puntaje mínimo es obligatorio.' }).int(),
  puntajeMax: z.number({ message: 'El puntaje máximo es obligatorio.' }).int(),
  nivel: z.string({ message: 'El nivel es obligatorio.' }).trim().min(1, 'El nivel es obligatorio.'),
  descripcion: z.string().trim().nullable().optional(),
}).refine((data) => data.puntajeMax >= data.puntajeMin, {
  message: 'El puntaje máximo debe ser mayor o igual al puntaje mínimo.',
  path: ['puntajeMax'],
});

export const crearTestPsicologicoSchema = z.object({
  body: z.object({
    nombre: z.string({ message: 'El nombre del test es obligatorio.' }).trim().min(1, 'El nombre del test es obligatorio.'),
    codigo: z.string({ message: 'El código del test es obligatorio.' }).trim().min(2, 'El código debe tener al menos 2 caracteres.'),
    categoria: z.string({ message: 'La categoría es obligatoria.' }).trim().min(1, 'La categoría es obligatoria.'),
    descripcion: z.string().trim().nullable().optional(),
    instrucciones: z.string().trim().nullable().optional(),
    activo: z.boolean().optional(),
    version: z.number().int().positive().optional(),
    preguntas: z.array(preguntaSchema).min(1, 'Debe registrar al menos una pregunta.'),
    rangos: z.array(rangoSchema).min(1, 'Debe registrar al menos un rango de resultado.'),
  }),
});

export const cambiarEstadoTestSchema = z.object({
  body: z.object({
    Activo: z.boolean({ message: 'El estado Activo es obligatorio.' }),
  }),
});

export const crearAplicacionTestSchema = z.object({
  body: z.object({
    ID_Test: idSchema,
    ID_Paciente: idSchema,
    ID_Sesion: idSchema.nullable().optional(),
    Contexto: z.enum(['FUERA_SESION', 'EN_SESION'], { message: 'El contexto del test no es válido.' }),
    ExpiraHoras: z.number().int().min(1).max(168).optional(),
    ObservacionPsicologo: z.string().trim().nullable().optional(),
  }),
});

export const responderTestPublicoSchema = z.object({
  body: z.object({
    respuestas: z.array(z.object({
      ID_Pregunta: idSchema,
      ID_Opcion: idSchema.nullable().optional(),
      Valor: z.number().int().nullable().optional(),
      TextoLibre: z.string().trim().nullable().optional(),
    })).min(1, 'Debe enviar al menos una respuesta.'),
  }),
});
