import { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../services/api';
import { toast } from 'sonner';
import type { Psicologo, Direccion, Pais, Departamento, Municipio } from '../types';

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

export interface CredencialesTemporales {
  email: string;
  passwordTemporal: string;
}

export interface CrearPsicologoResponse {
  psicologo: PsicologoCompleto;
  credenciales: CredencialesTemporales;
}

export interface PsicologoFormData {
  nombre: string;
  apellido: string;
  codigoMinsa: string;
  telefono: string;
  email: string;
  activo: boolean;
  direccion: {
    paisId: string;
    departamentoId: string;
    municipioId: string;
    barrio: string;
    calle: string;
  };
  especialidadIds: string[];
}

type CatalogosPsicologos = {
  especialidades?: Especialidad[];
  paises?: Pais[];
  departamentos?: Departamento[];
  municipios?: Municipio[];
};

type PsicologoPayload = {
  Nombre: string;
  Apellido: string;
  CodigoMinsa: string;
  No_Telefono: string;
  Email: string;
  Activo: boolean;
  paisId: number;
  direccion: {
    municipioId: number;
    barrio: string;
    calle: string;
  };
  especialidadIds: number[];
};

type PsicologoCreateRequest = Omit<Psicologo, 'ID_Psicologo'> & {
  Email?: string;
  paisId?: number;
  direccion?: PsicologoPayload['direccion'];
  especialidadIds?: number[];
};

type PsicologoUpdateRequest = Partial<Psicologo> & {
  Email?: string;
  paisId?: number;
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
      paises: Array.isArray(data.paises) ? data.paises : [],
      departamentos: Array.isArray(data.departamentos) ? data.departamentos : [],
      municipios: Array.isArray(data.municipios) ? data.municipios : [],
    };
  }

  return {
    especialidades: [],
    paises: [],
    departamentos: [],
    municipios: [],
  };
};

const construirPayload = (data: PsicologoFormData): PsicologoPayload => ({
  Nombre: data.nombre.trim(),
  Apellido: data.apellido.trim(),
  CodigoMinsa: data.codigoMinsa.trim(),
  No_Telefono: data.telefono.trim(),
  Email: data.email.trim(),
  Activo: data.activo,
  paisId: Number(data.direccion.paisId),
  direccion: {
    municipioId: Number(data.direccion.municipioId),
    barrio: data.direccion.barrio.trim() || 'Sin especificar',
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

const esObjeto = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const esCredencialesTemporales = (value: unknown): value is CredencialesTemporales => {
  if (!esObjeto(value)) return false;

  return typeof value.email === 'string' &&
    typeof value.passwordTemporal === 'string' &&
    value.passwordTemporal.trim().length > 0;
};

const esCrearPsicologoResponse = (value: unknown): value is CrearPsicologoResponse => {
  if (!esObjeto(value)) return false;

  return esObjeto(value.psicologo) && esCredencialesTemporales(value.credenciales);
};

export function usePsicologos() {
  const [psicologos, setPsicologos] = useState<PsicologoCompleto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [busqueda, setBusqueda] = useState<string>('');
  const [filtroActividad, setFiltroActividad] = useState<FiltroActividad>('todos');
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [paises, setPaises] = useState<Pais[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [municipios, setMunicipios] = useState<Municipio[]>([]);

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
      setPaises(catalogos.paises || []);
      setDepartamentos(catalogos.departamentos || []);
      setMunicipios(catalogos.municipios || []);
    } catch (error: unknown) {
      console.error('Error cargando datos de psicólogos:', error);
      toast.error('Error cargando datos de psicólogos');
      setPsicologos([]);
      setEspecialidades([]);
      setPaises([]);
      setDepartamentos([]);
      setMunicipios([]);
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

  const crearPsicologo = async (data: PsicologoFormData): Promise<CrearPsicologoResponse | null> => {
    try {
      const payload = construirPayload(data);

      const response = await api.psicologos.create(adaptarPayloadCrear(payload));

      await loadData();

      if (!esCrearPsicologoResponse(response)) {
        toast.warning('Psicólogo registrado, pero el backend no devolvió la contraseña temporal.');
        return null;
      }

      toast.success('Psicólogo registrado exitosamente');

      return response;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al registrar psicólogo';
      toast.error(message);

      return null;
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
    catalogos: {
      especialidades,
      paises,
      departamentos,
      municipios,
    },
    acciones: {
      crearPsicologo,
      actualizarPsicologo,
      reload: loadData,
    },
  };
}
