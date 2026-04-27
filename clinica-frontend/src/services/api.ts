import type { 
  Paciente, 
  CreatePacienteDTO, 
  Tutor, 
  Psicologo, 
  Cita, 
  Recibo, 
  Ocupacion, 
  EstadoCivil, 
  Parentesco, 
  MotivoCancelacion, 
  Especialidad, 
  Stats
} from '../types';

const API_URL = 'http://localhost:3000/api';

// --- CLASE DE ERROR PERSONALIZADA ---
export class ApiError extends Error {
  response: { data: any; status: number };

  constructor(message: string, data: any, status: number) {
    super(message);
    this.name = 'ApiError';
    this.response = { data, status };
  }
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    // 🟢 CORRECCIÓN CRÍTICA: Permitir el envío y recepción de cookies (JWT)
    credentials: 'include', 
    headers: { 
      'Content-Type': 'application/json'
    },
    ...options,
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const mensaje = errorData.error || errorData.message || 'Error en la petición al servidor';
    throw new ApiError(mensaje, errorData, response.status);
  }
  
  return response.json();
}

interface CatalogosResponse {
  ocupaciones: Ocupacion[];
  estadosCiviles: EstadoCivil[];
  parentescos: Parentesco[];
  psicologos: Psicologo[];
  tutores: Tutor[]; 
  especialidades: Especialidad[];
}

export const api = {
  get: <T>(url: string) => request<T>(url),
  post: <T>(url: string, body: any) => request<T>(url, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(url: string, body: any) => request<T>(url, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(url: string, body: any) => request<T>(url, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(url: string) => request<T>(url, { method: 'DELETE' }), 

  pacientes: {
    getAll: () => request<Paciente[]>('/pacientes'),
    getOne: (id: string | number) => request<any>(`/pacientes/${id}/expediente`),
    getHistorial: (id: number) => request<any[]>(`/pacientes/${id}/historial`),
    create: (data: CreatePacienteDTO) => request<Paciente>('/pacientes', { 
      method: 'POST', 
      body: JSON.stringify(data) 
    }),
    update: (id: number, data: Partial<CreatePacienteDTO>) => request<Paciente>(`/pacientes/${id}`, { 
      method: 'PUT', 
      body: JSON.stringify(data) 
    }),
    toggleEstado: (id: number, activo: boolean) => request(`/pacientes/${id}/estado`, { 
      method: 'PATCH', 
      body: JSON.stringify({ activo }) 
    }),
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
    getCatalogos: () => request<any>('/citas/catalogos'),
    create: (data: any) => request('/citas', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: any) => request(`/citas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    cancel: (id: number, motivoId: number, notas: string) => 
      request(`/citas/${id}/cancelar`, { 
        method: 'PATCH',
        body: JSON.stringify({ motivoId, notas }) 
      }),
    procesarInasistencias: () => request('/citas/inasistencias/procesar', { method: 'POST' }),
  },

  sesiones: {
    create: (data: any) => request('/sesiones', { method: 'POST', body: JSON.stringify(data) }),
    getByExpediente: (idExpediente: number) => request<any[]>(`/sesiones/expediente/${idExpediente}`),
  },

  recibos: { 
    getAll: () => request<Recibo[]>('/facturas'), 
    getOne: (id: number) => request<Recibo>(`/facturas/${id}`),
  },

  config: {
    getAll: (modelo: string) => request<any[]>(`/config/${modelo}`),
    create: (modelo: string, data: any) => request(`/config/${modelo}`, { 
      method: 'POST', 
      body: JSON.stringify(data) 
    }),
    update: (modelo: string, id: number, data: any) => request(`/config/${modelo}/${id}`, { 
      method: 'PUT', 
      body: JSON.stringify(data) 
    }),
    delete: (modelo: string, id: number) => request(`/config/${modelo}/${id}`, { 
      method: 'DELETE' 
    }),
  },

  general: {
    catalogos: () => request<CatalogosResponse>('/general/catalogos'), 
    stats: () => request<Stats>('/general/stats'),
    agendaHoy: () => request<Cita[]>('/general/agenda-hoy'),
    historialCompleto: () => request<any[]>('/general/historial'), 
    graficos: (inicio?: string, fin?: string) => {
      const params = new URLSearchParams();
      if (inicio) params.append('inicio', inicio);
      if (fin) params.append('fin', fin);
      return request<any>(`/general/graficos?${params.toString()}`);
    },
    motivosCancelacion: () => request<MotivoCancelacion[]>('/general/motivos-cancelacion'),
  }
};