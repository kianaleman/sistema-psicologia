import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { toast } from 'sonner';
import type { 
  Paciente, 
  Cita, 
  Sesion, 
  Tutor, 
  Direccion, 
  PacienteAdultoDetalle 
} from '../types';

// Interfaz extendida para la respuesta del expediente
// Sincronizada con los nuevos nombres de Prisma
export interface ExpedienteCompleto {
  paciente: Paciente & {
    Direccion?: Direccion;
    PacienteAdulto?: PacienteAdultoDetalle;
    Paciente_Menor?: {
      PartidaDeNacimiento: string;
      Grado_Escolar?: string;
      Tutor?: Tutor;
    };
  };
  citas: Cita[];
  sesiones: Sesion[];
}

export function usePacienteDetalle(id: string | undefined) {
  const [expediente, setExpediente] = useState<ExpedienteCompleto | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'info' | 'citas' | 'sesiones'>('info');

  const loadExpediente = useCallback(async (pacienteId: string) => {
    try {
      setLoading(true);
      // Casteamos explícitamente a nuestra interfaz blindada
      const data = await api.pacientes.getOne(pacienteId) as ExpedienteCompleto;
      setExpediente(data);
    } catch (error: unknown) {
      console.error(error);
      const msg = error instanceof Error ? error.message : "Error al cargar el expediente.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (id) {
      loadExpediente(id);
    }
  }, [id, loadExpediente]);

  // --- HELPERS DE FORMATO ---

  const formatearFecha = (f?: string) => {
    if (!f) return "N/A";
    
    // Solución 1 aplicada: Split manual para evitar conversión de zona horaria al visualizar
    const fechaPura = f.toString().split('T')[0]; 
    const partes = fechaPura.split('-'); 
    
    const fechaObj = new Date(parseInt(partes[0]), parseInt(partes[1]) - 1, parseInt(partes[2]));
    
    return fechaObj.toLocaleDateString("es-ES", {
        year: 'numeric', 
        month: 'long', 
        day: 'numeric'
    });
  };

  // 2. Hora: Usamos UTC methods para leer la hora exacta guardada en la BD
  const formatearHora = (h?: string) => {
    if (!h) return "--:--";
    const fecha = new Date(h);
    
    // Forzamos UTC para que lea "20:30" tal cual está en la BD
    // en lugar de restarle 6 horas por la zona horaria.
    return fecha.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        timeZone: 'UTC' 
    });
  };

  // 3. Colores de estado
  const getEstadoColor = (st?: string) => {
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
    },
    recargar: () => { if (id) loadExpediente(id) } // Útil para actualizar la vista tras crear una cita
  };
}