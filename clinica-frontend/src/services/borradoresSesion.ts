import type { Cita, CreateSesionDTO, TratamientoDTO } from '../types';
export interface TratamientoLocal {
    id: number;
    tipo: 'farmacologico' | 'terapeutico';
    frecuencia: string;
    medicamento: string;
    dosis: string;
    viaAdminId: string;
    objetivo: string;
    tipoTerapiaId: string;
    fechaInicio: string;
    fechaFin: string;
}
export const tratamientoVacio = (): TratamientoLocal => ({
    id: 0, tipo: 'terapeutico', frecuencia: '', medicamento: '', dosis: '', viaAdminId: '', objetivo: '', tipoTerapiaId: '',
    fechaInicio: new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Managua' }).format(new Date()), fechaFin: '',
});
export interface BorradorSesion {
    datosSesion: {
        observaciones: string;
        diagnostico: string;
        historial: string;
        criterios: string;
    };
    listaTratamientos: TratamientoLocal[];
    selectedExploraciones: Set<number>;
    formTratamiento: TratamientoLocal;
    horaInicioSistema: string | null;
    guardando: boolean;
    errorGuardado: string | null;
}
const borradores = new Map<string, BorradorSesion>();
const listeners = new Set<() => void>();
let generacion = 0;
let sesionAutenticada: string | null = null;
export const limpiarBorradoresSesion = () => {
    borradores.clear();
    sesionAutenticada = null;
    generacion++;
    listeners.forEach(listener => listener());
};
export const claveBorrador = (cita: Pick<Cita, 'ID_Cita' | 'ID_Paciente' | 'ID_Psicologo'>) => {
    const token = localStorage.getItem('token');
    if (token !== sesionAutenticada) {
        borradores.clear();
        sesionAutenticada = token;
        generacion++;
    }
    return `${generacion}:${cita.ID_Paciente}:${cita.ID_Cita}:${cita.ID_Psicologo}`;
};
export const borradoresSesion = {
    subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    obtener: (clave: string, inicio: string | null) => {
        if (!borradores.has(clave))
            borradores.set(clave, {
                datosSesion: { observaciones: '', diagnostico: '', historial: '', criterios: 'DSM-5' },
                listaTratamientos: [], selectedExploraciones: new Set(), formTratamiento: tratamientoVacio(),
                horaInicioSistema: inicio, guardando: false, errorGuardado: null,
            });
        return borradores.get(clave)!;
    },
    actualizar: (clave: string, datos: Partial<BorradorSesion>) => {
        const anterior = borradores.get(clave);
        if (!anterior)
            return;
        borradores.set(clave, { ...anterior, ...datos });
        listeners.forEach(listener => listener());
    },
    eliminar: (clave: string) => { borradores.delete(clave); },
};
export const hayTratamientoPendiente = (t: TratamientoLocal) => Boolean(t.frecuencia || t.medicamento || t.dosis
    || t.viaAdminId || t.objetivo || t.tipoTerapiaId || t.fechaFin || t.tipo !== 'terapeutico'
    || t.fechaInicio !== tratamientoVacio().fechaInicio);
export const crearPayloadSesion = (cita: Cita, borrador: BorradorSesion): CreateSesionDTO => ({
    ID_Cita: cita.ID_Cita, ID_Paciente: cita.ID_Paciente, ID_Psicologo: cita.ID_Psicologo,
    HoraDeInicio: borrador.horaInicioSistema!,
    Observaciones: borrador.datosSesion.observaciones.trim(), DiagnosticoDiferencial: borrador.datosSesion.diagnostico.trim(),
    HistorialDeEvolucion: borrador.datosSesion.historial.trim(), Criterios_DeDiagnostico: borrador.datosSesion.criterios.trim(),
    ExploracionesIds: [...borrador.selectedExploraciones],
    Tratamientos: borrador.listaTratamientos.map((t): TratamientoDTO => ({
        Frecuencia: t.frecuencia.trim(), FechaInicio: t.fechaInicio, ...(t.fechaFin ? { FechaFin: t.fechaFin } : {}),
        ...(t.tipo === 'terapeutico' ? { Tipo: 'terapeutico', Terapeutico: { ID_Tipo_Terapia: Number(t.tipoTerapiaId), Objetivo: t.objetivo.trim() } }
            : { Tipo: 'farmaceutico', Farmaceutico: { ID_ViaAdministracion: Number(t.viaAdminId), Nombre_Medicamento: t.medicamento.trim(), Dosis: t.dosis.trim() } }),
    })),
});
