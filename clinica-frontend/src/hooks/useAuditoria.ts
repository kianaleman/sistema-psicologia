import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { api } from '../services/api';
import type {
  AuditoriaFiltros,
  AuditoriaListaResponse,
  AuditoriaResumen,
} from '../types/auditoria';

const filtrosIniciales: AuditoriaFiltros = {
  page: 1,
  limit: 25,
  usuario: '',
  modulo: '',
  accion: '',
  resultado: '',
  fechaInicio: '',
  fechaFin: '',
  busqueda: '',
};

export function useAuditoria() {
  const [filtros, setFiltros] = useState<AuditoriaFiltros>(filtrosIniciales);
  const [data, setData] = useState<AuditoriaListaResponse>({
    items: [],
    total: 0,
    page: 1,
    limit: 25,
    totalPages: 0,
  });
  const [resumen, setResumen] = useState<AuditoriaResumen>({
    total: 0,
    exitosos: 0,
    fallidos: 0,
    hoy: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();

    params.set('page', String(filtros.page));
    params.set('limit', String(filtros.limit));

    if (filtros.usuario.trim()) params.set('usuario', filtros.usuario.trim());
    if (filtros.modulo.trim()) params.set('modulo', filtros.modulo.trim());
    if (filtros.accion.trim()) params.set('accion', filtros.accion.trim());
    if (filtros.resultado) params.set('resultado', filtros.resultado);
    if (filtros.fechaInicio) params.set('fechaInicio', filtros.fechaInicio);
    if (filtros.fechaFin) params.set('fechaFin', filtros.fechaFin);
    if (filtros.busqueda.trim()) params.set('busqueda', filtros.busqueda.trim());

    return params.toString();
  }, [filtros]);

  const cargarAuditoria = useCallback(async () => {
    try {
      setLoading(true);

      const [lista, resumenData] = await Promise.all([
        api.auditoria.getAll(queryParams),
        api.auditoria.resumen(),
      ]);

      setData(lista);
      setResumen(resumenData);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al cargar auditoría';
      toast.error(message);
      setData({
        items: [],
        total: 0,
        page: filtros.page,
        limit: filtros.limit,
        totalPages: 0,
      });
    } finally {
      setLoading(false);
    }
  }, [queryParams, filtros.page, filtros.limit]);

  useEffect(() => {
    void cargarAuditoria();
  }, [cargarAuditoria]);

  const actualizarFiltro = <K extends keyof AuditoriaFiltros>(key: K, value: AuditoriaFiltros[K]) => {
    setFiltros((prev) => ({
      ...prev,
      [key]: value,
      page: key === 'page' ? Number(value) : 1,
    }));
  };

  const limpiarFiltros = () => {
    setFiltros(filtrosIniciales);
  };

  return {
    filtros,
    data,
    resumen,
    loading,
    actualizarFiltro,
    limpiarFiltros,
    recargar: cargarAuditoria,
  };
}
