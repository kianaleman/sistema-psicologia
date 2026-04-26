import { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import type { Sesion, Paciente, Psicologo } from '../types';

// Sincronizamos la interfaz con la realidad del nuevo Backend
// Nota: Quitamos Expediente de la extensión si ya viene dentro de Sesion
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

  // Efecto para carga inicial
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Usamos el servicio centralizado que apunta a /api/general/historial
      const data = await api.general.historialCompleto();
      
      // Ya no necesitamos @ts-ignore porque los tipos están sincronizados
      setRegistros(data as RegistroHistorial[]);
    } catch (error) {
      console.error("Error cargando historial clínico:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- LÓGICA DE FILTRADO ADAPTADA A PASCALCASE ---
  const registrosFiltrados = useMemo(() => {
    return registros.filter(r => {
      // Seguridad: Verificar que el objeto Paciente exista
      if (!r.Paciente) return false;

      const nombreCompleto = `${r.Paciente.Nombre} ${r.Paciente.Apellido}`.toLowerCase();
      const term = busqueda.toLowerCase();
      
      // En el backend nuevo, el expediente viene dentro del objeto 'Expediente' en Sesion
      const noExpediente = r.Expediente?.No_Expediente?.toLowerCase() || '';

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