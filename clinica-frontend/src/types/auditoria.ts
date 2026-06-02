export type ResultadoAuditoria = 'EXITO' | 'FALLO';

export interface AuditoriaSistema {
  ID_Auditoria: number;
  ID_Usuario?: number | null;
  UsuarioEmail?: string | null;
  Roles?: string | null;
  Accion: string;
  Modulo: string;
  Entidad?: string | null;
  ID_Entidad?: number | null;
  MetodoHTTP?: string | null;
  Ruta?: string | null;
  Ip?: string | null;
  UserAgent?: string | null;
  Resultado: ResultadoAuditoria;
  CodigoEstado?: number | null;
  Mensaje?: string | null;
  DatosAntes?: string | null;
  DatosDespues?: string | null;
  FechaHora: string;
}

export interface AuditoriaFiltros {
  page: number;
  limit: number;
  usuario: string;
  modulo: string;
  accion: string;
  resultado: '' | ResultadoAuditoria;
  fechaInicio: string;
  fechaFin: string;
  busqueda: string;
}

export interface AuditoriaListaResponse {
  items: AuditoriaSistema[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AuditoriaResumen {
  total: number;
  exitosos: number;
  fallidos: number;
  hoy: number;
}
