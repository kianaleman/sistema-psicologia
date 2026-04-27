import { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import type { Sesion, Paciente, Psicologo } from '../types';

export interface RegistroHistorial extends Sesion {
  Paciente: Paciente;
  Psicologo: Psicologo;
  FechaReal: string; 
  DatosCita: { 
    Motivo: string; 
    Tipo: string 
  };
}

export function useHistorial() {
  const [registros, setRegistros] = useState<RegistroHistorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.general.historialCompleto();
      setRegistros(data as RegistroHistorial[]);
    } catch (error) {
      console.error("Error cargando historial clínico:", error);
    } finally {
      setLoading(false);
    }
  };

  const registrosFiltrados = useMemo(() => {
    return registros.filter(r => {
      if (!r.Cita?.Paciente && !r.Paciente) return false;

      const paciente = r.Cita?.Paciente || r.Paciente;
      const nombreCompleto = `${paciente.Nombre} ${paciente.Apellido}`.toLowerCase();
      const term = busqueda.toLowerCase();
      
      const noExpediente = r.Expediente?.No_Expediente?.toLowerCase() || 
                           paciente.Expediente?.No_Expediente?.toLowerCase() || '';

      return (
        nombreCompleto.includes(term) ||
        noExpediente.includes(term)
      );
    });
  }, [registros, busqueda]);

  return {
    registros: registrosFiltrados,
    loading,
    busqueda,
    setBusqueda,
    reload: loadData
  };
}