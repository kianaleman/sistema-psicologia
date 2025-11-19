const API_URL = 'http://localhost:3000/api';

// Función genérica para hacer peticiones
async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Error en la petición al servidor');
  }
  return response.json();
}

export const api = {
  // --- PACIENTES ---
  pacientes: {
    getAll: () => request<any[]>('/pacientes'),
    getOne: (id: string) => request<any>(`/pacientes/${id}/expediente`),
    create: (data: any) => request('/pacientes', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: any) => request(`/pacientes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    toggleEstado: (id: number, idEstado: number) => request(`/pacientes/${id}/estado`, { method: 'PATCH', body: JSON.stringify({ ID_EstadoDeActividad: idEstado }) }),
    getHistorial: (id: number) => request<any[]>(`/pacientes/${id}/historial`),
  },

  // --- TUTORES ---
  tutores: {
    getAll: () => request<any[]>('/tutores'),
    update: (id: number, data: any) => request(`/tutores/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  },

  // --- PSICÓLOGOS ---
  psicologos: {
    getAll: () => request<any[]>('/psicologos'),
    create: (data: any) => request('/psicologos', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: any) => request(`/psicologos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  },

  // --- CITAS ---
  citas: {
    getAll: () => request<any[]>('/citas'),
    create: (data: any) => request('/citas', { method: 'POST', body: JSON.stringify(data) }),
    cancel: (id: number) => request(`/citas/${id}/cancelar`, { method: 'PATCH' }),
  },

  // --- SESIONES ---
  sesiones: {
    create: (data: any) => request('/sesiones', { method: 'POST', body: JSON.stringify(data) }),
  },

  // --- GENERAL ---
  general: {
    catalogos: () => request<any>('/catalogos'),
    catalogosCitas: () => request<any>('/citas/catalogos'),
    stats: () => request<any>('/dashboard-stats'),
    historialCompleto: () => request<any[]>('/historial'),
  }
};