import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { toast } from 'sonner';
import type { Paciente, Cita, Sesion } from '../types';

// Interfaz adaptada al nuevo Schema de Prisma
export interface ExpedienteCompleto {
  paciente: Paciente; // Ya incluye Direccion, PacienteAdulto y Paciente_Menor en types/index.ts
  citas: Cita[];
  sesiones: Sesion[];
}

export function usePacienteDetalle(id: string | undefined) {
  const [expediente, setExpediente] = useState<ExpedienteCompleto | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'info' | 'citas' | 'sesiones'>('info');

  useEffect(() => {
    if (id) loadExpediente(id);
  }, [id]);

  const loadExpediente = async (pacienteId: string) => {
    try {
      setLoading(true);
      // El backend devuelve un objeto con { paciente, citas, sesiones }
      const data = await api.pacientes.getOne(pacienteId);
      setExpediente(data);
    } catch (error) {
      console.error("Error al cargar expediente:", error);
      toast.error("Error al cargar el expediente clínico.");
    } finally {
      setLoading(false);
    }
  };

  // --- HELPERS DE FORMATO ---

  const formatearFecha = (f: string) => {
    if (!f) return "N/A";
    // Sincronizado con Fecha_Nacimiento o FechaCita
    const fechaPura = f.toString().split('T')[0]; 
    const partes = fechaPura.split('-'); 
    
    const fechaObj = new Date(parseInt(partes[0]), parseInt(partes[1]) - 1, parseInt(partes[2]));
    
    return fechaObj.toLocaleDateString("es-ES", {
        year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  const formatearHora = (h: string) => {
    if (!h) return "--:--";
    // Si el backend envía "20:30:00", lo usamos directo. 
    // Si envía un ISO Date, forzamos UTC para evitar desfase de 6 horas en Nicaragua
    if (h.includes('T')) {
        const fecha = new Date(h);
        return fecha.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit', 
            timeZone: 'UTC' 
        });
    }
    return h; // Retorno directo si ya es formato hora
  };

  const getEstadoColor = (st: string | undefined) => {
    if (!st) return 'badge-ghost';
    const lower = st.toLowerCase();
    if (lower.includes('programada') || lower.includes('pendiente')) return 'bg-blue-100 text-blue-700 border-blue-200';
    if (lower.includes('completada') || lower.includes('realizada')) return 'bg-green-100 text-green-700 border-green-200';
    if (lower.includes('cancelada')) return 'bg-red-100 text-red-700 border-red-200';
    return 'badge-ghost';
  };

  return {
    expediente,
    loading,
    tab,
    setTab,
    helpers: {
      formatearFecha,
      formatearHora,
      getEstadoColor
    },
    refresh: () => id && loadExpediente(id)
  };
}