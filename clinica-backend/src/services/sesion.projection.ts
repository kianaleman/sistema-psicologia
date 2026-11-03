import type { Prisma } from '@prisma/client';
export const expedienteSelect = {
    ID_Expediente: true, ID_Paciente: true, No_Expediente: true, FechaIngreso: true,
} satisfies Prisma.ExpedienteSelect;
export const sesionClinicaSelect = {
    ID_Sesion: true, ID_Cita: true, ID_Expediente: true, HoraDeInicio: true, HoraFinal: true,
    Observaciones: true, DiagnosticoDiferencial: true, HistorialDeEvolucion: true, Criterios_DeDiagnostico: true,
    Expediente: { select: expedienteSelect },
    Tratamiento: { orderBy: { ID_Tratamiento: 'asc' }, select: {
            ID_Tratamiento: true, ID_Sesion: true, ID_Psicologo_Firma: true, FechaInicio: true, FechaFin: true, Frecuencia: true,
            Tratamiento_Farmaceutico: { select: {
                    ID_ViaAdministracion: true, Nombre_Medicamento: true, Dosis: true,
                    ViaAdministracion: { select: { ID_ViaAdministracion: true, Nombre_De_Presentacion: true } },
                } },
            Tratamiento_Terapeutico: { select: {
                    ID_Tipo_Terapia: true, Objetivo: true,
                    TipoDe_Terapia: { select: { ID_Tipo_Terapia: true, Nombre_De_Terapia: true } },
                } },
        } },
    Sesion_ExploracionPsicologica: { select: {
            ID_ExploracionPsicologica: true, ExploracionPsicologica: { select: { Nombre_De_ExploracionPsicologica: true } },
        } },
} satisfies Prisma.SesionSelect;
