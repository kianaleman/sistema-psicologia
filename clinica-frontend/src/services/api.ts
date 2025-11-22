import type { 
  Paciente, 
  CreatePacienteDTO, 
  Tutor, 
  Psicologo, 
  Cita, 
  Factura, 
  Ocupacion, 
  EstadoCivil, 
  Parentesco 
} from '../types';

const API_URL = 'http://localhost:3000/api';

// --- CLASE DE ERROR PERSONALIZADA ---
// Esto simula la estructura de error de Axios para compatibilidad con los hooks
export class ApiError extends Error {
  response: { data: any; status: number };

  constructor(message: string, data: any, status: number) {
    super(message);
    this.name = 'ApiError';
    this.response = { data, status };
  }
}

// Función genérica para hacer peticiones
async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  
  if (!response.ok) {
    // Intentamos leer el JSON de error enviado por el backend
    const errorData = await response.json().catch(() => ({}));
    
    // Obtenemos el mensaje específico (ej: "La cédula ya existe...")
    const mensaje = errorData.error || errorData.message || 'Error en la petición al servidor';
    
    // Lanzamos nuestro error personalizado que contiene "response.data"
    throw new ApiError(mensaje, errorData, response.status);
  }
  
  return response.json();
}

// Tipado para la respuesta de catálogos generales
interface CatalogosResponse {
  ocupaciones: Ocupacion[];
  estadosCiviles: EstadoCivil[];
  parentescos: Parentesco[];
  tutores: Tutor[];
}

export const api = {
  // --- MÉTODOS GENÉRICOS (Para que funcionen los hooks como usePacientes) ---
  get: <T>(url: string) => request<T>(url),
  post: <T>(url: string, body: any) => request<T>(url, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(url: string, body: any) => request<T>(url, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(url: string, body: any) => request<T>(url, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(url: string) => request<T>(url, { method: 'DELETE' }),

  // --- MÓDULOS ESPECÍFICOS (Legacy / Uso directo) ---
  pacientes: {
    getAll: () => request<Paciente[]>('/pacientes'),
    getOne: (id: string) => request<any>(`/pacientes/${id}/expediente`),
    create: (data: CreatePacienteDTO) => request<Paciente>('/pacientes', { 
      method: 'POST', 
      body: JSON.stringify(data) 
    }),
    update: (id: number, data: Partial<CreatePacienteDTO>) => request<Paciente>(`/pacientes/${id}`, { 
      method: 'PUT', 
      body: JSON.stringify(data) 
    }),
    toggleEstado: (id: number, idEstado: number) => request(`/pacientes/${id}/estado`, { 
      method: 'PATCH', 
      body: JSON.stringify({ ID_EstadoDeActividad: idEstado }) 
    }),
    getHistorial: (id: number) => request<any[]>(`/pacientes/${id}/historial`),
  },

  tutores: {
    getAll: () => request<Tutor[]>('/tutores'),
    update: (id: number, data: any) => request(`/tutores/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  },

  psicologos: {
    getAll: () => request<Psicologo[]>('/psicologos'),
    create: (data: any) => request('/psicologos', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: any) => request(`/psicologos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  },

  citas: {
    getAll: () => request<Cita[]>('/citas'),
    update: (id: number, data: any) => request(`/citas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    create: (data: any) => request('/citas', { method: 'POST', body: JSON.stringify(data) }),
    cancel: (id: number) => request(`/citas/${id}/cancelar`, { method: 'PATCH' }),
  },

  sesiones: {
    create: (data: any) => request('/sesiones', { method: 'POST', body: JSON.stringify(data) }),
  },

  facturas: {
    getAll: () => request<Factura[]>('/facturas'),
  },

  config: {
    getAll: (modelo: string) => request<any[]>(`/config/${modelo}`),
    create: (modelo: string, nombre: string) => request(`/config/${modelo}`, { method: 'POST', body: JSON.stringify({ nombre }) }),
    update: (modelo: string, id: number, nombre: string) => request(`/config/${modelo}/${id}`, { method: 'PUT', body: JSON.stringify({ nombre }) }),
    delete: (modelo: string, id: number) => request(`/config/${modelo}/${id}`, { method: 'DELETE' }),
  },

  general: {
    catalogos: () => request<CatalogosResponse>('/catalogos'),
    catalogosCitas: () => request<any>('/citas/catalogos'),
    stats: () => request<any>('/dashboard-stats'),
    historialCompleto: () => request<any[]>('/historial'),
    graficos: (inicio?: string, fin?: string) => {
      const params = new URLSearchParams();
      if (inicio) params.append('inicio', inicio);
      if (fin) params.append('fin', fin);
      return request<any>(`/dashboard-graficos?${params.toString()}`);
    },
  }
};