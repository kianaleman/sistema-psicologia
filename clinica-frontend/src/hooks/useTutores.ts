import { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../services/api';
import { toast } from 'sonner';
import type {
  Tutor,
  Ocupacion,
  EstadoCivil,
  Parentesco,
  Direccion,
} from '../types';

export interface PacienteMenorTutor {
  ID_Paciente_Menor?: number;
  PartidaDeNacimiento?: string;
  Grado_Escolar?: string | null;
  Paciente?: {
    ID_Paciente?: number;
    Nombre: string;
    Apellido: string;
  };
}

export interface TutorPacienteMenorRelacion {
  ID_Tutor?: number;
  ID_Paciente_Menor?: number;
  ID_Parentesco?: number;
  Es_Contacto_Principal?: boolean | null;
  Parentesco?: Parentesco;
  Paciente_Menor?: PacienteMenorTutor;
}

export type TutorCompleto = Tutor & {
  ID_Parentesco?: number;
  Direccion?: Direccion | null;

  Ocupacion_Tutor_OcupacionToOcupacion?: Ocupacion | null;
  EstadoCivil_Tutor_EstadoCivilToEstadoCivil?: EstadoCivil | null;

  // Compatibilidad con respuestas antiguas o aliases previos del backend.
  Ocupacion_Tutor?: Ocupacion | null;
  EstadoCivil_Tutor?: EstadoCivil | null;

  Parentesco?: Parentesco | null;
  Tutor_PacienteMenor?: TutorPacienteMenorRelacion[];

  PacienteMenor?: PacienteMenorTutor[];
  Paciente_Menor?: PacienteMenorTutor[];
};

export interface TutorFormData {
  Nombre: string;
  Apellido: string;
  No_Cedula: string;
  No_Telefono: string;
  ID_Parentesco: number;
  Ocupacion: number;
  EstadoCivil: number;
  Direccion: {
    Pais: string;
    Barrio: string;
    Calle: string;
    ID_Municipio: number;
  };
}

type CatalogosTutores = {
  ocupaciones?: Ocupacion[];
  estadosCiviles?: EstadoCivil[];
  parentescos?: Parentesco[];
};

export const initialTutorForm: TutorFormData = {
  Nombre: '',
  Apellido: '',
  No_Cedula: '',
  No_Telefono: '',
  ID_Parentesco: 0,
  Ocupacion: 0,
  EstadoCivil: 0,
  Direccion: {
    Pais: '',
    Barrio: '',
    Calle: '',
    ID_Municipio: 0,
  },
};

const normalizarTexto = (valor?: string | null) => {
  return valor?.trim().toLowerCase() || '';
};

const normalizarCatalogos = (catalogos: unknown): Required<CatalogosTutores> => {
  if (typeof catalogos !== 'object' || catalogos === null) {
    return {
      ocupaciones: [],
      estadosCiviles: [],
      parentescos: [],
    };
  }

  const data = catalogos as CatalogosTutores;

  return {
    ocupaciones: Array.isArray(data.ocupaciones) ? data.ocupaciones : [],
    estadosCiviles: Array.isArray(data.estadosCiviles) ? data.estadosCiviles : [],
    parentescos: Array.isArray(data.parentescos) ? data.parentescos : [],
  };
};

const obtenerParentescoPrincipal = (tutor: TutorCompleto) => {
  const relacionPrincipal = tutor.Tutor_PacienteMenor?.find((relacion) => relacion.Es_Contacto_Principal);
  const relacion = relacionPrincipal || tutor.Tutor_PacienteMenor?.[0];

  return relacion?.Parentesco || tutor.Parentesco || null;
};

const obtenerIdParentesco = (tutor: TutorCompleto) => {
  return tutor.ID_Parentesco ||
    obtenerParentescoPrincipal(tutor)?.ID_Parentesco ||
    tutor.Tutor_PacienteMenor?.[0]?.ID_Parentesco ||
    0;
};

const enriquecerTutorConCatalogos = (
  tutor: TutorCompleto,
  catalogos: Required<CatalogosTutores>,
): TutorCompleto => {
  const ocupacionId = Number(tutor.Ocupacion || 0);
  const estadoCivilId = Number(tutor.EstadoCivil || 0);

  const ocupacionDesdeCatalogo = catalogos.ocupaciones.find((ocupacion) => {
    return ocupacion.ID_Ocupacion === ocupacionId;
  }) || null;

  const estadoCivilDesdeCatalogo = catalogos.estadosCiviles.find((estadoCivil) => {
    return estadoCivil.ID_EstadoCivil === estadoCivilId;
  }) || null;

  return {
    ...tutor,
    Ocupacion_Tutor_OcupacionToOcupacion:
      tutor.Ocupacion_Tutor_OcupacionToOcupacion ||
      tutor.Ocupacion_Tutor ||
      ocupacionDesdeCatalogo,
    EstadoCivil_Tutor_EstadoCivilToEstadoCivil:
      tutor.EstadoCivil_Tutor_EstadoCivilToEstadoCivil ||
      tutor.EstadoCivil_Tutor ||
      estadoCivilDesdeCatalogo,
  };
};

export function useTutores() {
  const [tutores, setTutores] = useState<TutorCompleto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [busqueda, setBusqueda] = useState<string>('');

  const [ocupaciones, setOcupaciones] = useState<Ocupacion[]>([]);
  const [estadosCiviles, setEstadosCiviles] = useState<EstadoCivil[]>([]);
  const [parentescos, setParentescos] = useState<Parentesco[]>([]);

  const [tutorSeleccionado, setTutorSeleccionado] = useState<TutorCompleto | null>(null);
  const [formData, setFormData] = useState<TutorFormData>(initialTutorForm);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const [dataTutores, dataCatalogos] = await Promise.all([
        api.tutores.getAll(),
        api.general.catalogos(),
      ]);

      const catalogos = normalizarCatalogos(dataCatalogos);
      const tutoresNormalizados = Array.isArray(dataTutores)
        ? (dataTutores as TutorCompleto[]).map((tutor) => enriquecerTutorConCatalogos(tutor, catalogos))
        : [];

      setTutores(tutoresNormalizados);
      setOcupaciones(catalogos.ocupaciones);
      setEstadosCiviles(catalogos.estadosCiviles);
      setParentescos(catalogos.parentescos);
    } catch (error: unknown) {
      console.error('Error al cargar la lista de tutores:', error);
      toast.error('Error al cargar la lista de tutores');
      setTutores([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const tutoresFiltrados = useMemo(() => {
    const termino = normalizarTexto(busqueda);

    if (!termino) return tutores;

    return tutores.filter((tutor) => {
      const nombreCompleto = normalizarTexto(`${tutor.Nombre} ${tutor.Apellido}`);
      const cedula = normalizarTexto(tutor.No_Cedula);
      const telefono = normalizarTexto(tutor.No_Telefono);
      const ocupacion = normalizarTexto(tutor.Ocupacion_Tutor_OcupacionToOcupacion?.Nombre_DeOcupacion);
      const estadoCivil = normalizarTexto(tutor.EstadoCivil_Tutor_EstadoCivilToEstadoCivil?.Nombre_EstadoCivil);

      return (
        nombreCompleto.includes(termino) ||
        cedula.includes(termino) ||
        telefono.includes(termino) ||
        ocupacion.includes(termino) ||
        estadoCivil.includes(termino)
      );
    });
  }, [tutores, busqueda]);

  const prepareEdit = (tutor: TutorCompleto) => {
    setTutorSeleccionado(tutor);
    setFormData({
      Nombre: tutor.Nombre || '',
      Apellido: tutor.Apellido || '',
      No_Cedula: tutor.No_Cedula || '',
      No_Telefono: tutor.No_Telefono || '',
      ID_Parentesco: obtenerIdParentesco(tutor),
      Ocupacion: Number(tutor.Ocupacion || 0),
      EstadoCivil: Number(tutor.EstadoCivil || 0),
      Direccion: {
        Pais: tutor.Direccion?.Pais || '',
        Barrio: tutor.Direccion?.Barrio || '',
        Calle: tutor.Direccion?.Calle || '',
        ID_Municipio: Number(tutor.Direccion?.ID_Municipio || 0),
      },
    });
  };

  const saveTutor = async () => {
    if (!tutorSeleccionado) return false;

    try {
      await api.tutores.update(tutorSeleccionado.ID_Tutor, formData);
      toast.success('Tutor actualizado exitosamente');
      await loadData();

      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al actualizar tutor';
      toast.error(message);

      return false;
    }
  };

  return {
    tutores: tutoresFiltrados,
    loading,
    busqueda,
    setBusqueda,
    catalogos: {
      ocupaciones,
      estadosCiviles,
      parentescos,
    },
    formData,
    setFormData,
    tutorSeleccionado,
    prepareEdit,
    saveTutor,
  };
}
