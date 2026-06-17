import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { toast } from 'sonner';
import type {
  Paciente,
  Cita,
  Sesion,
  Tutor,
  Direccion,
  Pais,
  Psicologo,
  Ocupacion,
  EstadoCivil,
  Parentesco,
  PacienteAdultoDetalle,
  PacienteMenorDetalle,
  RelacionTutor,
} from '../types';

// =====================================================
// Extensiones pequeñas para relaciones incluidas por Prisma
// =====================================================

type TutorConRelaciones = Tutor & {
  Direccion?: Direccion | null;
  Ocupacion_Tutor_OcupacionToOcupacion?: Ocupacion;
  EstadoCivil_Tutor_EstadoCivilToEstadoCivil?: EstadoCivil;
};

type RelacionTutorDetalle = RelacionTutor & {
  Parentesco?: Parentesco;
  Tutor?: TutorConRelaciones;
};

type PacienteMenorConTutor = PacienteMenorDetalle & {
  Tutor_PacienteMenor?: RelacionTutorDetalle[];
};

type PacienteDetalle = Paciente & {
  Pais?: Pais | null;
  Direccion?: Direccion;
  PacienteAdulto?: PacienteAdultoDetalle | null;
  Paciente_Menor?: PacienteMenorConTutor | null;
};

type PsicologoResumen = Pick<Psicologo, 'ID_Psicologo' | 'Nombre' | 'Apellido'> & {
  CodigoMinsa?: string;
};

type CitaExpediente = Cita & {
  Psicologo?: PsicologoResumen;
  TipoDeCita?: {
    Nombre_DeCita: string;
  };
  EstadoCita?: {
    NombreEstado: string;
  };
};

type TratamientoResumen = {
  Frecuencia?: string;
  FechaInicio?: string;
  Tratamiento_Farmaceutico?: {
    Nombre_Medicamento?: string;
    Dosis?: string;
  } | null;
  Tratamiento_Terapeutico?: {
    Objetivo?: string | null;
  } | null;
};

type SesionExpediente = Sesion & {
  FechaCita?: string;
  HoraCita?: string;
  Psicologo?: PsicologoResumen;
  Tratamiento?: TratamientoResumen[];
};

// Interfaz extendida para la respuesta del expediente.
// Usa los tipos globales de src/types/index.ts y solo agrega relaciones anidadas.
export interface ExpedienteCompleto {
  paciente: PacienteDetalle;
  citas: CitaExpediente[];
  sesiones: SesionExpediente[];
}

export function usePacienteDetalle(id: string | undefined) {
  const [expediente, setExpediente] = useState<ExpedienteCompleto | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(id));
  const [tab, setTab] = useState<'info' | 'citas' | 'sesiones'>('info');

  const loadExpediente = useCallback(async (pacienteId: string) => {
    try {
      setLoading(true);

      const data = await api.pacientes.getOne(pacienteId) as ExpedienteCompleto;

      setExpediente({
        paciente: data.paciente,
        citas: Array.isArray(data.citas) ? data.citas : [],
        sesiones: Array.isArray(data.sesiones) ? data.sesiones : [],
      });
    } catch (error: unknown) {
      console.error(error);

      const msg = error instanceof Error
        ? error.message
        : 'Error al cargar el expediente.';

      toast.error(msg);
      setExpediente(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!id) {
      setExpediente(null);
      setLoading(false);
      return;
    }

    loadExpediente(id);
  }, [id, loadExpediente]);

  // --- HELPERS DE FORMATO ---

  const formatearFecha = (f?: string | Date | null) => {
    if (!f) return 'N/A';

    const valor = f.toString();
    const fechaPura = valor.includes('T') ? valor.split('T')[0] : valor;
    const partes = fechaPura.split('-');

    if (partes.length === 3) {
      const fechaObj = new Date(
        Number(partes[0]),
        Number(partes[1]) - 1,
        Number(partes[2])
      );

      if (!isNaN(fechaObj.getTime())) {
        return fechaObj.toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      }
    }

    const fechaObj = new Date(valor);
    if (isNaN(fechaObj.getTime())) return 'N/A';

    return fechaObj.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatearHora = (h?: string | Date | null) => {
    if (!h) return '--:--';

    const valor = h.toString();
    const horaPura = valor.match(/^(\d{2}):(\d{2})/);

    if (horaPura) {
      return `${horaPura[1]}:${horaPura[2]}`;
    }

    const fecha = new Date(valor);

    if (!isNaN(fecha.getTime())) {
      return fecha.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'UTC',
      });
    }

    return '--:--';
  };

  const getEstadoColor = (st?: string | null) => {
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
      getEstadoColor,
    },
    recargar: () => {
      if (id) loadExpediente(id);
    },
  };
}
