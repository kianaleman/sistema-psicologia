import { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../services/api';
import { toast } from 'sonner';
import type { Psicologo, Direccion } from '../types';

export interface Especialidad {
  ID_Especialidad: number;
  Nombre_Especialidad: string;
  NombreEspecialidad?: string;
}

export interface PsicologoEspecialidadRelacion {
  ID_Especialidad?: number;
  EspecialidadPsicologo?: Especialidad;
  Especialidad?: Especialidad;
}

// Usamos Omit porque Psicologo ya define Direccion como Direccion | undefined.
// La respuesta del backend puede devolver Direccion como null.
export type PsicologoCompleto = Omit<Psicologo, 'Direccion'> & {
  Direccion?: Direccion | null;

  // Este campo existe en la UI/backend, pero no esta declarado en la interfaz Psicologo base.
  Email?: string | null;

  Psicologo_EspecialidadPsicologo?: PsicologoEspecialidadRelacion[];
};

export type FiltroActividad = 'todos' | 'activos' | 'inactivos';

export interface PsicologoFormData {
  nombre: string;
  apellido: string;
  codigoMinsa: string;
  telefono: string;
  email: string;
  activo: boolean;
  direccion: {
    departamento: string;
    municipio: string;
    barrio: string;
    calle: string;
  };
  especialidadIds: string[];
}

type CatalogosPsicologos = {
  especialidades?: Especialidad[];
};

type PsicologoPayload = {
  Nombre: string;
  Apellido: string;
  CodigoMinsa: string;
  No_Telefono: string;
  Email: string;
  Activo: boolean;
  direccion: {
    departamento: string;
    municipio: string;
    barrio: string;
    calle: string;
  };
  especialidadIds: number[];
};

type PsicologoCreateRequest = Omit<Psicologo, 'ID_Psicologo'> & {
  Email?: string;
  direccion?: PsicologoPayload['direccion'];
  especialidadIds?: number[];
};

type PsicologoUpdateRequest = Partial<Psicologo> & {
  Email?: string;
  direccion?: PsicologoPayload['direccion'];
  especialidadIds?: number[];
};

const normalizarTexto = (valor?: string | null) => {
  return valor?.trim().toLowerCase() || '';
};

const normalizarCatalogos = (catalogos: unknown): CatalogosPsicologos => {
  if (
    typeof catalogos === 'object' &&
    catalogos !== null &&
    'especialidades' in catalogos
  ) {
    const data = catalogos as CatalogosPsicologos;

    return {
      especialidades: Array.isArray(data.especialidades) ? data.especialidades : [],
    };
  }

  return { especialidades: [] };
};

const construirPayload = (data: PsicologoFormData): PsicologoPayload => ({
  Nombre: data.nombre.trim(),
  Apellido: data.apellido.trim(),
  CodigoMinsa: data.codigoMinsa.trim(),
  No_Telefono: data.telefono.trim(),
  Email: data.email.trim(),
  Activo: data.activo,
  direccion: {
    departamento: data.direccion.departamento.trim(),
    municipio: data.direccion.municipio.trim(),
    barrio: data.direccion.barrio.trim(),
    calle: data.direccion.calle.trim(),
  },
  especialidadIds: data.especialidadIds
    .map((id) => Number(id))
    .filter((id) => Number.isInteger(id) && id > 0),
});

const adaptarPayloadCrear = (payload: PsicologoPayload): PsicologoCreateRequest => {
  return {
    ...payload,

    // ID_Direccion es requerido por el tipo base Psicologo, pero cuando se crea desde este formulario
    // el backend recibe el objeto direccion y resuelve o crea la direccion correspondiente.
    ID_Direccion: 0,
  } as PsicologoCreateRequest;
};

const adaptarPayloadActualizar = (payload: PsicologoPayload): PsicologoUpdateRequest => {
  return {
    ...payload,
  };
};

export function usePsicologos() {
  const [psicologos, setPsicologos] = useState<PsicologoCompleto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [busqueda, setBusqueda] = useState<string>('');
  const [filtroActividad, setFiltroActividad] = useState<FiltroActividad>('todos');
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const [dataPsicologos, dataCatalogos] = await Promise.all([
        api.psicologos.getAll(),
        api.general.catalogos(),
      ]);

      setPsicologos(Array.isArray(dataPsicologos) ? dataPsicologos as PsicologoCompleto[] : []);

      const catalogos = normalizarCatalogos(dataCatalogos);
      setEspecialidades(catalogos.especialidades || []);
    } catch (error: unknown) {
      console.error('Error cargando datos de psicólogos:', error);
      toast.error('Error cargando datos de psicólogos');
      setPsicologos([]);
      setEspecialidades([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const psicologosFiltrados = useMemo(() => {
    const termino = normalizarTexto(busqueda);

    return psicologos.filter((psicologo) => {
      const nombreCompleto = normalizarTexto(`${psicologo.Nombre} ${psicologo.Apellido}`);
      const minsa = normalizarTexto(psicologo.CodigoMinsa);
      const email = normalizarTexto(psicologo.Email);
      const telefono = normalizarTexto(psicologo.No_Telefono);

      const pasaBusqueda = !termino ||
        nombreCompleto.includes(termino) ||
        minsa.includes(termino) ||
        email.includes(termino) ||
        telefono.includes(termino);

      const pasaActividad =
        filtroActividad === 'todos' ||
        (filtroActividad === 'activos' && psicologo.Activo === true) ||
        (filtroActividad === 'inactivos' && psicologo.Activo === false);

      return pasaBusqueda && pasaActividad;
    });
  }, [psicologos, busqueda, filtroActividad]);

  const crearPsicologo = async (data: PsicologoFormData) => {
    try {
      const payload = construirPayload(data);

      await api.psicologos.create(adaptarPayloadCrear(payload));
      toast.success('Psicólogo registrado exitosamente');
      await loadData();

      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al registrar psicólogo';
      toast.error(message);

      return false;
    }
  };

  const actualizarPsicologo = async (id: number, data: PsicologoFormData) => {
    try {
      const payload = construirPayload(data);

      await api.psicologos.update(id, adaptarPayloadActualizar(payload));
      toast.success('Psicólogo actualizado correctamente');
      await loadData();

      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al actualizar psicólogo';
      toast.error(message);

      return false;
    }
  };

  return {
    psicologos: psicologosFiltrados,
    loading,
    busqueda,
    setBusqueda,
    filtroActividad,
    setFiltroActividad,
    catalogos: { especialidades },
    acciones: {
      crearPsicologo,
      actualizarPsicologo,
      reload: loadData,
    },
  };
}
