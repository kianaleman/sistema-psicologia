import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { validarExpedientePaciente } from '../services/expedientePaciente';
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
  ExpedienteResumen,
  TratamientoClinico,
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

type SesionExpediente = Sesion & {
  ID_Paciente: number;
  ID_Psicologo: number;
  FechaCita?: string;
  HoraCita?: string;
  Psicologo?: PsicologoResumen;
  Tratamiento?: TratamientoClinico[];
};

// Interfaz extendida para la respuesta del expediente.
// Usa los tipos globales de src/types/index.ts y solo agrega relaciones anidadas.
export interface ExpedienteCompleto {
  expediente: ExpedienteResumen | null;
  paciente: PacienteDetalle;
  citas: CitaExpediente[];
  sesiones: SesionExpediente[];
}

export function usePacienteDetalle(id: string | undefined) {
  const [resultado, setResultado] = useState<{ id: string; data: ExpedienteCompleto | null; error: string | null } | null>(null);
  const [objetivo, setObjetivo] = useState(id);
  if (objetivo !== id) { setObjetivo(id); setResultado(null); }
  const [revision, setRevision] = useState(0);
  const [tab, setTab] = useState<'info' | 'citas' | 'sesiones'>('info');
  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    let vigente = true;
    api.pacientes.getOne(id, controller.signal).then(data => {
      validarExpedientePaciente(data, Number(id));
      if (vigente) setResultado({ id, data, error: null });
    }).catch((error: unknown) => {
      if (vigente) setResultado({ id, data: null, error: error instanceof Error ? error.message : 'No se pudo cargar el expediente.' });
    });
    return () => { vigente = false; controller.abort(); };
  }, [id, revision]);
  // Ocultar el resultado anterior en el primer render de B, antes de su efecto.
  const actual = resultado?.id === id ? resultado : null;
  const expediente = actual?.data ?? null;
  const loading = Boolean(id) && actual === null;
  const error = actual?.error ?? null;

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
    error,
    tab,
    setTab,
    helpers: {
      formatearFecha,
      formatearHora,
      getEstadoColor,
    },
    recargar: () => {
      setResultado(null);
      setRevision(value => value + 1);
    },
  };
}
