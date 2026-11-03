import { z } from 'zod';
const id = z.coerce.number().int().positive();
const texto = (max: number) => z.string().trim().min(1).max(max);
const fecha = z.iso.date();
const tratamientoBase = { Frecuencia: texto(100), FechaInicio: fecha, FechaFin: fecha.optional() };
export const tratamientoSchema = z.discriminatedUnion('Tipo', [
    z.object({ ...tratamientoBase, Tipo: z.literal('terapeutico'),
        Terapeutico: z.object({ ID_Tipo_Terapia: id, Objetivo: texto(20000) }).strict(),
    }).strict(),
    z.object({ ...tratamientoBase, Tipo: z.literal('farmaceutico'),
        Farmaceutico: z.object({ ID_ViaAdministracion: id, Nombre_Medicamento: texto(255), Dosis: texto(255) }).strict(),
    }).strict(),
]).refine(t => !t.FechaFin || t.FechaFin >= t.FechaInicio, {
    message: 'FechaFin no puede ser anterior a FechaInicio', path: ['FechaFin'],
});
export const sesionBodySchema = z.object({
    ID_Cita: id, ID_Paciente: id, ID_Psicologo: id,
    // Omisión: resolver por la cita. No enviar el cero del contrato anterior.
    ID_Expediente: id.optional(),
    HoraDeInicio: z.iso.datetime({ offset: true }),
    Observaciones: z.string().trim().max(50000).default(''),
    DiagnosticoDiferencial: texto(50000),
    HistorialDeEvolucion: z.string().trim().max(50000).default(''),
    Criterios_DeDiagnostico: texto(50000),
    ExploracionesIds: z.array(id).max(100).default([]).transform(ids => [...new Set(ids)]),
    Tratamientos: z.array(tratamientoSchema).max(100).default([]),
}).strict();
export type CreateSesionDTO = z.infer<typeof sesionBodySchema>;
export type TratamientoDTO = z.infer<typeof tratamientoSchema>;
export const createSesionSchema = z.object({ body: sesionBodySchema });
export const searchSesionSchema = z.object({ query: z.object({ pacienteId: id, psicologoId: id }).strict() });
