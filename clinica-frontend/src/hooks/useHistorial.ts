import { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import type { Sesion, Paciente, Psicologo, Expediente } from '../types';

// Definimos el tipo específico para este reporte aquí (o en types)
export interface RegistroHistorial extends Sesion {
  Paciente: Paciente;
  Psicologo: Psicologo;
  Expediente: Expediente;
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
    try {
      // Usamos el servicio centralizado
      const data = await api.general.historialCompleto();
      // @ts-ignore
      setRegistros(data);
    } catch (error) {
      console.error("Error cargando historial:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- LÓGICA DE FILTRADO MEMOIZADA ---
  const registrosFiltrados = useMemo(() => {
    return registros.filter(r => 
      `${r.Paciente.Nombre} ${r.Paciente.Apellido}`.toLowerCase().includes(busqueda.toLowerCase()) ||
      r.Expediente?.No_Expediente.toLowerCase().includes(busqueda.toLowerCase())
    );
  }, [registros, busqueda]);

  return {
    registros: registrosFiltrados,
    loading,
    busqueda,
    setBusqueda,
    reload: loadData
  };
}