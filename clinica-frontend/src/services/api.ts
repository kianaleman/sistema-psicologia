import type { 
  Paciente, 
  CreatePacienteDTO, 
  Tutor, 
  Psicologo, 
  Cita, 
  CreateCitaDTO,
  Recibo, 
  Ocupacion, 
  EstadoCivil, 
  Parentesco, 
  MotivoCancelacion,
  CreateSesionDTO,
  Stats
} from '../types';

const API_URL = 'http://localhost:3000/api';

export class ApiError extends Error {
  response: { data: unknown; status: number };

  constructor(message: string, data: unknown, status: number) {
    super(message);
    this.name = 'ApiError';
    this.response = { data, status };
  }
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    headers,
    ...options,
  });

  if (!response.ok) {
    const esEndpointLogin = endpoint === '/auth/login';

    if (response.status === 401 && !esEndpointLogin) {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      window.location.href = '/';  
      throw new Error('Sesión expirada');
    }

    const errorData = await response.json().catch(() => ({})) as Record<string, unknown>;

    const mensaje = typeof errorData.error === 'string' 
      ? errorData.error 
      : typeof errorData.message === 'string' 
        ? errorData.message 
        : 'Error en la petición al servidor';

    throw new ApiError(mensaje, errorData, response.status);
  }

  return response.json();
}

interface CatalogosResponse {
  ocupaciones: Ocupacion[];
  estadosCiviles: EstadoCivil[];
  parentescos: Parentesco[];
  tutores: Tutor[];
  [key: string]: unknown;
}

interface LoginRequest {
  email: string;
  passwordRaw: string;
}

interface UsuarioSesion {
  id: number;
  email: string;
  roles: string[];
  idPsicologo: number | null;
  nombre: string;
  requiereCambioPassword: boolean;
}

interface LoginResponse {
  token: string;
  requiereCambioPassword: boolean;
  usuario: UsuarioSesion;
}

interface CambiarPasswordResponse extends LoginResponse {
  message: string;
}

interface PsicologoCreateBody extends Omit<Psicologo, 'ID_Psicologo'> {
  Email?: string;
  paisId?: number;
  direccion?: {
    municipioId: number;
    barrio: string;
    calle: string;
  };
  especialidadIds?: number[];
}

interface PsicologoUpdateBody extends Partial<Psicologo> {
  Email?: string;
  paisId?: number;
  direccion?: {
    municipioId: number;
    barrio: string;
    calle: string;
  };
  especialidadIds?: number[];
}

interface PsicologoCreateResponse {
  psicologo: Psicologo & {
    Email?: string | null;
  };
  credenciales: {
    email: string;
    passwordTemporal: string;
  };
}

export const api = {
  get: <T>(url: string) => request<T>(url),
  post: <T, B = unknown>(url: string, body: B) => request<T>(url, { method: 'POST', body: JSON.stringify(body) }),
  put: <T, B = unknown>(url: string, body: B) => request<T>(url, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T, B = unknown>(url: string, body: B) => request<T>(url, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(url: string) => request<T>(url, { method: 'DELETE' }),

  auth: {
    login: (data: LoginRequest) => request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    cambiarPasswordDefault: (passwordNuevaRaw: string) => request<CambiarPasswordResponse>('/auth/cambiar-password-default', {
      method: 'POST',
      body: JSON.stringify({ passwordNuevaRaw }),
    }),
  },

  pacientes: {
    getAll: () => request<Paciente[]>('/pacientes'),
    getOne: (id: string | number) => request<unknown>(`/pacientes/${id}/expediente`),
    create: (data: CreatePacienteDTO) => request<Paciente>('/pacientes', { 
      method: 'POST', 
      body: JSON.stringify(data),
    }),
    update: (id: number, data: Partial<CreatePacienteDTO>) => request<Paciente>(`/pacientes/${id}`, { 
      method: 'PUT', 
      body: JSON.stringify(data),
    }),
    toggleEstado: (id: number, estado: boolean) => request<unknown>(`/pacientes/${id}/estado`, { 
      method: 'PATCH', 
      body: JSON.stringify({ Activo: estado }),
    }),
    getHistorial: (id: number) => request<unknown[]>(`/pacientes/${id}/historial`),
  },

  tutores: {
    getAll: () => request<Tutor[]>('/tutores'),
    update: (id: number, data: Partial<Tutor>) => request<Tutor>(`/tutores/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  },

  psicologos: {
    getAll: () => request<Psicologo[]>('/psicologos'),
    create: (data: PsicologoCreateBody) => request<PsicologoCreateResponse>('/psicologos', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: number, data: PsicologoUpdateBody) => request<Psicologo>(`/psicologos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  },

  citas: {
    getAll: () => request<Cita[]>('/citas'),
    update: (id: number, data: Partial<Cita>) => request<Cita>(`/citas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    create: (data: CreateCitaDTO) => request<Cita>('/citas', { method: 'POST', body: JSON.stringify(data) }),
    cancel: (id: number, ID_MotivoCancelacion: number, NotasCancelacion: string) => 
      request<unknown>(`/citas/${id}/cancelar`, { 
        method: 'PATCH',
        body: JSON.stringify({ ID_MotivoCancelacion, NotasCancelacion }),
      }),
    getHorariosOcupados: (psicologoId: number, fecha: string) => 
      request<string[]>(`/citas/horarios-ocupados?psicologoId=${psicologoId}&fecha=${fecha}`),
  },

  sesiones: {
    create: (data: CreateSesionDTO) => request<unknown>('/sesiones', { method: 'POST', body: JSON.stringify(data) }),
  },

  facturas: {
    getAll: () => request<Recibo[]>('/facturas'),
  },

  config: {
    getAll: (modelo: string) => request<Record<string, unknown>[]>(`/config/${modelo}`),
    create: (modelo: string, nombre: string) => request<unknown>(`/config/${modelo}`, { method: 'POST', body: JSON.stringify({ nombre }) }),
    update: (modelo: string, id: number, nombre: string) => request<unknown>(`/config/${modelo}/${id}`, { method: 'PUT', body: JSON.stringify({ nombre }) }),
    delete: (modelo: string, id: number) => request<unknown>(`/config/${modelo}/${id}`, { method: 'DELETE' }),
  },

  general: {
    catalogos: () => request<CatalogosResponse>('/general/catalogos'),
    stats: () => request<Stats>('/general/dashboard-stats'),
    historialCompleto: () => request<unknown[]>('/general/historial'),
    graficos: (inicio?: string, fin?: string) => {
      const params = new URLSearchParams();
      if (inicio) params.append('inicio', inicio);
      if (fin) params.append('fin', fin);
      return request<unknown>(`/general/dashboard-graficos?${params.toString()}`);
    },
    motivosCancelacion: () => request<MotivoCancelacion[]>('/general/motivos-cancelacion'),
  },
};
