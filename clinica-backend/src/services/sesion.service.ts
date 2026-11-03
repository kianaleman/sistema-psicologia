import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import type { AuthUserPayload } from '../middlewares/auth.middleware.js';
import type { CreateSesionDTO } from '../schemas/sesion.schema.js';
import { sesionClinicaSelect } from './sesion.projection.js';
export class ErrorClinico extends Error {
    constructor(public status: number, message: string) { super(message); }
}
const autorizar = (usuario: AuthUserPayload | undefined, profesional: number) => {
    if (!usuario)
        throw new ErrorClinico(401, 'Acceso no autorizado.');
    if (usuario.esAdmin || (usuario.esPsicologo && usuario.idPsicologo === profesional))
        return;
    throw new ErrorClinico(403, 'No tiene permisos para esta consulta clínica.');
};
// SQL TIME representa un reloj, no un instante. Usar Nicaragua y fecha base UTC.
const horaClinica = (instante: Date) => {
    const reloj = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'America/Managua', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
    }).format(instante);
    return new Date(`1970-01-01T${reloj}Z`);
};
const dia = (value: string) => new Date(`${value}T00:00:00.000Z`);
type SesionGuardada = Prisma.SesionGetPayload<{
    select: typeof sesionClinicaSelect;
}>;
const mismoContenido = (sesion: SesionGuardada, data: CreateSesionDTO) => {
    const recetas = sesion.Tratamiento.map(t => ({
        Frecuencia: t.Frecuencia, FechaInicio: t.FechaInicio.toISOString().slice(0, 10),
        ...(t.FechaFin ? { FechaFin: t.FechaFin.toISOString().slice(0, 10) } : {}),
        ...(t.Tratamiento_Terapeutico ? {
            Tipo: 'terapeutico', Terapeutico: {
                ID_Tipo_Terapia: t.Tratamiento_Terapeutico.ID_Tipo_Terapia, Objetivo: t.Tratamiento_Terapeutico.Objetivo,
            },
        } : { Tipo: 'farmaceutico', Farmaceutico: {
                ID_ViaAdministracion: t.Tratamiento_Farmaceutico?.ID_ViaAdministracion,
                Nombre_Medicamento: t.Tratamiento_Farmaceutico?.Nombre_Medicamento, Dosis: t.Tratamiento_Farmaceutico?.Dosis,
            } }),
    }));
    // Ordenar claves y elementos: comparar contenido, sin depender del orden JSON.
    const canonical = (value: unknown): string => {
        if (Array.isArray(value))
            return '[' + value.map(canonical).sort().join(',') + ']';
        if (value && typeof value === 'object')
            return JSON.stringify(Object.fromEntries(Object.entries(value).sort().map(([k, v]) => [k, canonical(v)])));
        return JSON.stringify(value);
    };
    return sesion.HoraDeInicio?.getTime() === horaClinica(new Date(data.HoraDeInicio)).getTime()
        && sesion.Observaciones === data.Observaciones
        && sesion.DiagnosticoDiferencial === data.DiagnosticoDiferencial
        && sesion.HistorialDeEvolucion === data.HistorialDeEvolucion
        && sesion.Criterios_DeDiagnostico === data.Criterios_DeDiagnostico
        && canonical(recetas) === canonical(data.Tratamientos)
        && canonical(sesion.Sesion_ExploracionPsicologica.map(e => e.ID_ExploracionPsicologica)) === canonical(data.ExploracionesIds);
};
const guardar = (data: CreateSesionDTO, usuario?: AuthUserPayload) => prisma.$transaction(async (tx) => {
    const cita = await tx.cita.findUnique({
        where: { ID_Cita: data.ID_Cita },
        select: {
            ID_Cita: true, ID_Paciente: true, ID_Psicologo: true, ID_EstadoCita: true,
            Paciente: { select: { Activo: true } }, Psicologo: { select: { Activo: true } },
            Sesion: { select: sesionClinicaSelect },
        },
    });
    if (!cita)
        throw new ErrorClinico(404, 'Cita no encontrada.');
    autorizar(usuario, cita.ID_Psicologo);
    if (cita.ID_Paciente !== data.ID_Paciente || cita.ID_Psicologo !== data.ID_Psicologo) {
        throw new ErrorClinico(409, 'La cita cambió de paciente o profesional. Revise la agenda antes de guardar.');
    }
    if (data.ID_Expediente !== undefined) {
        const expediente = await tx.expediente.findUnique({ where: { ID_Expediente: data.ID_Expediente }, select: { ID_Paciente: true } });
        if (!expediente || expediente.ID_Paciente !== cita.ID_Paciente)
            throw new ErrorClinico(409, 'El expediente no corresponde al paciente de la cita.');
    }
    if (cita.Sesion) {
        if (cita.ID_EstadoCita !== 2 || cita.Sesion.Expediente?.ID_Paciente !== data.ID_Paciente
            || (data.ID_Expediente !== undefined && data.ID_Expediente !== cita.Sesion.ID_Expediente)
            || !mismoContenido(cita.Sesion, data))
            throw new ErrorClinico(409, 'La cita ya tiene una consulta con datos distintos. No se sobrescribió.');
        return { sesion: cita.Sesion, creada: false };
    }
    if (cita.ID_EstadoCita !== 1)
        throw new ErrorClinico(409, 'La cita no está pendiente y no admite atención.');
    if (!cita.Paciente.Activo || !cita.Psicologo.Activo)
        throw new ErrorClinico(409, 'El paciente o el profesional ya no está activo.');
    if (new Date(data.HoraDeInicio).getTime() > Date.now() + 60000)
        throw new ErrorClinico(400, 'La hora de inicio no puede estar en el futuro.');
    for (const t of data.Tratamientos) {
        const existe = t.Tipo === 'terapeutico'
            ? await tx.tipoDe_Terapia.findUnique({ where: { ID_Tipo_Terapia: t.Terapeutico.ID_Tipo_Terapia } })
            : await tx.viaAdministracion.findUnique({ where: { ID_ViaAdministracion: t.Farmaceutico.ID_ViaAdministracion } });
        if (!existe)
            throw new ErrorClinico(400, 'Un tipo de terapia o vía de administración no existe.');
    }
    if (data.ExploracionesIds.length) {
        const cantidad = await tx.exploracionPsicologica.count({ where: { ID_ExploracionPsicologica: { in: data.ExploracionesIds } } });
        if (cantidad !== data.ExploracionesIds.length)
            throw new ErrorClinico(400, 'Una exploración psicológica no existe.');
    }
    // Bloqueo de la cita y transición protegida dentro de la misma transacción.
    const cambio = await tx.cita.updateMany({
        where: { ID_Cita: data.ID_Cita, ID_Paciente: data.ID_Paciente, ID_Psicologo: data.ID_Psicologo, ID_EstadoCita: 1, Sesion: null },
        data: { ID_EstadoCita: 2 },
    });
    if (cambio.count !== 1)
        throw new ErrorClinico(409, 'La cita cambió durante el guardado. Puede reintentar.');
    const expediente = await tx.expediente.upsert({
        where: { ID_Paciente: data.ID_Paciente }, update: {},
        create: { ID_Paciente: data.ID_Paciente, No_Expediente: `EXP-${data.ID_Paciente}-${Date.now()}`, FechaIngreso: new Date() },
    });
    const sesion = await tx.sesion.create({ data: {
            ID_Cita: data.ID_Cita, ID_Expediente: expediente.ID_Expediente,
            HoraDeInicio: horaClinica(new Date(data.HoraDeInicio)), HoraFinal: horaClinica(new Date()),
            Observaciones: data.Observaciones, DiagnosticoDiferencial: data.DiagnosticoDiferencial,
            HistorialDeEvolucion: data.HistorialDeEvolucion, Criterios_DeDiagnostico: data.Criterios_DeDiagnostico,
        } });
    for (const t of data.Tratamientos) {
        await tx.tratamiento.create({ data: {
                ID_Sesion: sesion.ID_Sesion, ID_Psicologo_Firma: data.ID_Psicologo,
                Frecuencia: t.Frecuencia, FechaInicio: dia(t.FechaInicio), FechaFin: t.FechaFin ? dia(t.FechaFin) : null,
                ...(t.Tipo === 'terapeutico' ? { Tratamiento_Terapeutico: { create: t.Terapeutico } }
                    : { Tratamiento_Farmaceutico: { create: t.Farmaceutico } }),
            } });
    }
    if (data.ExploracionesIds.length)
        await tx.sesion_ExploracionPsicologica.createMany({ data: data.ExploracionesIds.map(id => ({
                ID_Sesion: sesion.ID_Sesion, ID_ExploracionPsicologica: id,
            })) });
    const completa = await tx.sesion.findUniqueOrThrow({ where: { ID_Sesion: sesion.ID_Sesion }, select: sesionClinicaSelect });
    return { sesion: completa, creada: true };
}, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, maxWait: 10000, timeout: 20000 });
export const SesionService = {
    create: async (data: CreateSesionDTO, usuario?: AuthUserPayload) => {
        for (let intento = 0; intento < 3; intento++) {
            try {
                return await guardar(data, usuario);
            }
            catch (error) {
                const code = (error as {
                    code?: string;
                }).code;
                if (code !== 'P2034' && code !== 'P2002')
                    throw error;
                if (intento === 2)
                    throw new ErrorClinico(409, 'Hay otra operación sobre la cita. Reintente sin descartar sus notas.');
                await new Promise(resolve => setTimeout(resolve, 50 * (intento + 1)));
            }
        }
        throw new ErrorClinico(409, 'No se pudo confirmar el guardado.');
    },
    findByParams: async (pacienteId: number, psicologoId: number, usuario?: AuthUserPayload) => {
        autorizar(usuario, psicologoId);
        return prisma.sesion.findFirst({
            where: { Cita: { ID_Paciente: pacienteId, ID_Psicologo: psicologoId }, Expediente: { ID_Paciente: pacienteId } },
            orderBy: { ID_Sesion: 'desc' }, select: sesionClinicaSelect,
        });
    },
};
