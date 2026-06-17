import { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../services/api';
import { toast } from 'sonner';
import type { Psicologo, Direccion, Pais, Departamento, Municipio } from '../types';

export interface Especialidad {
  ID_Especialidad: number;
  Nombre_Especialidad: string;
  NombreEspecialidad?: string;
}

export interface RolSistema {
  id: number;
  nombre: string;
  descripcion: string | null;
}

export interface UsuarioRolResumen {
  idUsuario: number;
  email: string;
  activo: boolean;
  requiereCambioPassword: boolean;
  idPsicologo: number | null;
  nombre: string;
  roles: RolSistema[];
}

export interface CambiarRolesUsuarioResponse {
  message: string;
  usuario: UsuarioRolResumen;
  rolesAntes: string[];
  rolesDespues: string[];
}

export interface PsicologoEspecialidadRelacion {
  ID_Especialidad?: number;
  EspecialidadPsicologo?: Especialidad;
  Especialidad?: Especialidad;
}

export type PsicologoCompleto = Omit<Psicologo, 'Direccion' | 'ID_Usuario' | 'Email'> & {
  Direccion?: Direccion | null;
  ID_Usuario?: number | null;
  Email?: string | null;
  rolesUsuario?: RolSistema[];
  usuarioActivo?: boolean | null;
  requiereCambioPassword?: boolean | null;
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

export interface ResetPasswordAdminResponse {
  message: string;
  usuario: {
    id: number;
    email: string;
    roles: string[];
    idPsicologo: number | null;
    nombre: string;
    requiereCambioPassword: boolean;
  };
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
  rolIds: string[];
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

const esResetPasswordAdminResponse = (value: unknown): value is ResetPasswordAdminResponse => {
  if (!esObjeto(value)) return false;

  return typeof value.message === 'string' &&
    esObjeto(value.usuario) &&
    esCredencialesTemporales(value.credenciales);
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
  const [rolesSistema, setRolesSistema] = useState<RolSistema[]>([]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const [dataPsicologos, dataCatalogos, dataRoles, dataUsuariosRoles] = await Promise.all([
        api.psicologos.getAll(),
        api.general.catalogos(),
        api.auth.getRoles(),
        api.auth.getUsuariosRoles(),
      ]);

      const psicologosBase = Array.isArray(dataPsicologos) ? dataPsicologos as PsicologoCompleto[] : [];
      const usuariosRoles = Array.isArray(dataUsuariosRoles) ? dataUsuariosRoles as UsuarioRolResumen[] : [];

      const usuariosPorId = new Map<number, UsuarioRolResumen>();
      const usuariosPorPsicologo = new Map<number, UsuarioRolResumen>();

      usuariosRoles.forEach((usuario) => {
        usuariosPorId.set(usuario.idUsuario, usuario);

        if (usuario.idPsicologo) {
          usuariosPorPsicologo.set(usuario.idPsicologo, usuario);
        }
      });

      const psicologosConRoles = psicologosBase.map((psicologo) => {
        const usuario = psicologo.ID_Usuario
          ? usuariosPorId.get(psicologo.ID_Usuario)
          : usuariosPorPsicologo.get(psicologo.ID_Psicologo);

        return {
          ...psicologo,
          ID_Usuario: psicologo.ID_Usuario || usuario?.idUsuario || null,
          Email: psicologo.Email || usuario?.email || null,
          rolesUsuario: usuario?.roles || [],
          usuarioActivo: usuario?.activo ?? null,
          requiereCambioPassword: usuario?.requiereCambioPassword ?? null,
        };
      });

      setPsicologos(psicologosConRoles);
      setRolesSistema(Array.isArray(dataRoles) ? dataRoles as RolSistema[] : []);

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
      setRolesSistema([]);
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

  const obtenerRolIdsNumericos = (data: PsicologoFormData) => {
    return Array.from(new Set(
      data.rolIds
        .map((id) => Number(id))
        .filter((id) => Number.isInteger(id) && id > 0)
    ));
  };

  const crearPsicologo = async (data: PsicologoFormData): Promise<CrearPsicologoResponse | null> => {
    try {
      const payload = construirPayload(data);
      const rolIds = obtenerRolIdsNumericos(data);

      const response = await api.psicologos.create(adaptarPayloadCrear(payload));

      if (esCrearPsicologoResponse(response) && response.psicologo.ID_Usuario && rolIds.length > 0) {
        await api.auth.cambiarRolesUsuario(response.psicologo.ID_Usuario, rolIds);
      }

      await loadData();

      if (!esCrearPsicologoResponse(response)) {
        toast.warning('Psicólogo registrado, pero el backend no devolvió la contraseña temporal.');
        return null;
      }

      if (!response.psicologo.ID_Usuario && rolIds.length > 0) {
        toast.warning('Psicólogo registrado, pero no se pudo asignar roles porque no hay usuario vinculado.');
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
      const rolIds = obtenerRolIdsNumericos(data);
      const psicologoActual = psicologos.find((psicologo) => psicologo.ID_Psicologo === id);

      await api.psicologos.update(id, adaptarPayloadActualizar(payload));

      if (psicologoActual?.ID_Usuario && rolIds.length > 0) {
        await api.auth.cambiarRolesUsuario(psicologoActual.ID_Usuario, rolIds);
      } else if (!psicologoActual?.ID_Usuario && rolIds.length > 0) {
        toast.warning('Datos actualizados, pero no se pudieron actualizar roles porque no hay usuario vinculado.');
      }

      toast.success('Psicólogo actualizado correctamente');
      await loadData();

      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al actualizar psicólogo';
      toast.error(message);

      return false;
    }
  };

  const cambiarRolesUsuario = async (idUsuario: number, rolIds: number[]): Promise<boolean> => {
    try {
      await api.auth.cambiarRolesUsuario(idUsuario, rolIds);
      toast.success('Roles actualizados correctamente');
      await loadData();

      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al cambiar roles del usuario';
      toast.error(message);

      return false;
    }
  };

  const restablecerPasswordUsuario = async (idUsuario: number): Promise<CredencialesTemporales | null> => {
    try {
      const response = await api.auth.restablecerPasswordAdmin(idUsuario);

      if (!esResetPasswordAdminResponse(response)) {
        toast.warning('La contraseña fue restablecida, pero el backend no devolvió credenciales temporales.');
        return null;
      }

      toast.success('Contraseña temporal generada correctamente');
      await loadData();

      return response.credenciales;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al restablecer contraseña';
      toast.error(message);

      return null;
    }
  };

  return {
    psicologos: psicologosFiltrados,
    loading,
    busqueda,
    setBusqueda,
    filtroActividad,
    setFiltroActividad,
    rolesSistema,
    catalogos: {
      especialidades,
      paises,
      departamentos,
      municipios,
    },
    acciones: {
      crearPsicologo,
      actualizarPsicologo,
      cambiarRolesUsuario,
      restablecerPasswordUsuario,
      reload: loadData,
    },
  };
}
