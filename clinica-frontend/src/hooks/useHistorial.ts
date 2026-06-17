import { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../services/api';
import type { Paciente, Pais, Psicologo, Sesion } from '../types';

type PacienteHistorial = Pick<
  Paciente,
  'ID_Paciente' | 'Nombre' | 'Apellido' | 'Nacionalidad'
> & {
  Pais?: Pick<Pais, 'Nombre_Pais' | 'Nacionalidad'> | null;
};

type PsicologoHistorial = Pick<
  Psicologo,
  'ID_Psicologo' | 'Nombre' | 'Apellido'
>;

type ExpedienteHistorial = {
  ID_Expediente?: number;
  No_Expediente?: string | null;
};

type DatosCitaHistorial = {
  Motivo: string;
  Tipo: string;
};

// Usamos Omit porque Sesion ya define Expediente con otra forma.
// El historial necesita permitir Expediente null porque depende de la relacion incluida por Prisma.
export type RegistroHistorial = Omit<Sesion, 'Expediente'> & {
  FechaReal?: string;
  Paciente?: PacienteHistorial | null;
  Psicologo?: PsicologoHistorial | null;
  Expediente?: ExpedienteHistorial | null;
  DatosCita?: DatosCitaHistorial;
};

export function useHistorial() {
  const [registros, setRegistros] = useState<RegistroHistorial[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [busqueda, setBusqueda] = useState<string>('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const data = await api.general.historialCompleto() as RegistroHistorial[];

      setRegistros(Array.isArray(data) ? data : []);
    } catch (error: unknown) {
      console.error('Error cargando historial completo:', error);
      setRegistros([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const registrosFiltrados = useMemo(() => {
    const term = busqueda.trim().toLowerCase();

    if (!term) return registros;

    return registros.filter((registro) => {
      const nombrePaciente = `${registro.Paciente?.Nombre || ''} ${registro.Paciente?.Apellido || ''}`.toLowerCase();
      const expediente = registro.Expediente?.No_Expediente?.toLowerCase() || '';
      const psicologo = `${registro.Psicologo?.Nombre || ''} ${registro.Psicologo?.Apellido || ''}`.toLowerCase();
      const diagnostico = registro.DiagnosticoDiferencial?.toLowerCase() || '';
      const motivo = registro.DatosCita?.Motivo?.toLowerCase() || '';
      const tipoCita = registro.DatosCita?.Tipo?.toLowerCase() || '';

      return (
        nombrePaciente.includes(term) ||
        expediente.includes(term) ||
        psicologo.includes(term) ||
        diagnostico.includes(term) ||
        motivo.includes(term) ||
        tipoCita.includes(term)
      );
    });
  }, [registros, busqueda]);

  return {
    registros: registrosFiltrados,
    loading,
    busqueda,
    setBusqueda,
    reload: loadData,
  };
}
