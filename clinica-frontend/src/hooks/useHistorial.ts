import { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../services/api';
import type { Sesion } from '../types';

// Definimos el DTO específico para el reporte del historial.
// Extendemos de Sesion (para heredar Observaciones, DiagnosticoDiferencial, etc.)
// y añadimos los campos relacionales que el backend formatea para esta vista.
export interface RegistroHistorial extends Sesion {
  FechaReal?: string; 
  // Hacemos las relaciones opcionales para evitar crasheos si el backend envía un null
  Paciente?: {
    Nombre: string;
    Apellido: string;
  };
  Psicologo?: {
    Nombre: string;
    Apellido: string;
  };
  Expediente?: {
    No_Expediente: string;
  };
  DatosCita?: { 
    Motivo?: string; 
    Tipo?: string 
  };
}

export function useHistorial() {
  const [registros, setRegistros] = useState<RegistroHistorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Usamos el servicio centralizado y casteamos de forma segura 
      const data = await api.general.historialCompleto() as RegistroHistorial[];
      setRegistros(data);
    } catch (error: unknown) {
      console.error("Error cargando historial completo:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // --- LÓGICA DE FILTRADO MEMOIZADA ---
  const registrosFiltrados = useMemo(() => {
    if (!busqueda.trim()) return registros;
    
    const term = busqueda.toLowerCase();
    
    return registros.filter(r => {
      // Usamos Optional Chaining (?.) para protegernos si r.Paciente o r.Expediente son null
      const nombreCompleto = `${r.Paciente?.Nombre || ''} ${r.Paciente?.Apellido || ''}`.toLowerCase();
      const numExpediente = r.Expediente?.No_Expediente?.toLowerCase() || '';
      
      return nombreCompleto.includes(term) || numExpediente.includes(term);
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