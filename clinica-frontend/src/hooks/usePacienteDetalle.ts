import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { toast } from 'sonner';
import type { Paciente, Cita, Sesion, Tutor } from '../types';

// Interfaz extendida para la respuesta del expediente
export interface ExpedienteCompleto {
  paciente: Paciente & {
    DireccionPaciente: any;
    EstadoDeActividad: any;
    PacienteAdulto?: any;
    PacienteMenor?: {
      PartNacimiento: string;
      GradoEscolar: string;
      Tutor: Tutor;
    };
  };
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
      const data = await api.pacientes.getOne(pacienteId);
      setExpediente(data);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar el expediente.");
    } finally {
      setLoading(false);
    }
  };

  // --- HELPERS DE FORMATO ---

const formatearFecha = (f: string) => {
  if (!f) return "N/A";
  // Solución 1 aplicada: Split manual para evitar conversión de zona horaria al visualizar
  const fechaPura = f.toString().split('T')[0]; 
  const partes = fechaPura.split('-'); 
  
  const fechaObj = new Date(parseInt(partes[0]), parseInt(partes[1]) - 1, parseInt(partes[2]));
  
  return fechaObj.toLocaleDateString("es-ES", {
      year: 'numeric', month: 'long', day: 'numeric'
  });
};

  // 2. Hora: Usamos UTC methods para leer la hora exacta guardada en la BD
  const formatearHora = (h: string) => {
    if (!h) return "--:--";
    const fecha = new Date(h);
    const horas = fecha.getUTCHours().toString().padStart(2, '0');
    const minutos = fecha.getUTCMinutes().toString().padStart(2, '0');
    return `${horas}:${minutos}`;
  };

  // 3. Colores de estado
  const getEstadoColor = (st: string) => {
    if (!st) return 'badge-ghost';
    const lower = st.toLowerCase();
    if (lower.includes('programada')) return 'badge-outline badge-primary';
    if (lower.includes('completada')) return 'badge-outline badge-success';
    if (lower.includes('cancelada')) return 'badge-outline badge-error';
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
    }
  };
}