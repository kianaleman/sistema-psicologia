import { z } from 'zod';

export const createSesionSchema = z.object({
  body: z.object({
    // IDs opcionales o requeridos dependiendo de tu lógica de negocio (usualmente la sesión se liga a uno u otro)
    ID_Cita: z.number().int().positive().optional(),
    ID_Expediente: z.number().int().positive().optional(),
    
    // Las horas pueden venir como string (ej. "14:30:00")
    HoraDeInicio: z.string().optional(),
    HoraFinal: z.string().optional(),
    
    // Campos clínicos obligatorios según tu base de datos
    Observaciones: z.string({ message: 'Las observaciones son obligatorias' })
      .min(1, 'Las observaciones no pueden estar vacías'),
    DiagnosticoDiferencial: z.string({ message: 'El diagnóstico diferencial es obligatorio' })
      .min(1, 'El diagnóstico no puede estar vacío'),
    HistorialDeEvolucion: z.string({ message: 'El historial de evolución es obligatorio' })
      .min(1, 'El historial no puede estar vacío'),
    Criterios_DeDiagnostico: z.string({ message: 'Los criterios de diagnóstico son obligatorios' })
      .min(1, 'Los criterios no pueden estar vacíos'),
  })
});

// Para la ruta GET /buscar, los datos viajan en la URL (req.query), no en el body.
// Los query params siempre llegan como strings, así que validamos su formato.
export const searchSesionSchema = z.object({
  query: z.object({
    // Si buscas por texto libre
    q: z.string().optional(),
    // Si buscas por IDs específicos, aseguramos que el string contenga solo números
    ID_Cita: z.string().regex(/^\d+$/, { message: 'El ID de cita debe ser numérico' }).optional(),
    ID_Expediente: z.string().regex(/^\d+$/, { message: 'El ID de expediente debe ser numérico' }).optional(),
  }).optional()
});