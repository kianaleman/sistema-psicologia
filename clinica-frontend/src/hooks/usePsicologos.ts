import { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { toast } from 'sonner';
import type { Psicologo } from '../types';

// Definiciones locales
export interface Especialidad { ID_Especialidad: number; NombreEspecialidad: string; }
export interface EstadoActividad { ID_EstadoDeActividad: number; NombreEstadoActividad: string; }

export interface PsicologoCompleto extends Psicologo {
  Psicologo_EspecialidadPsicologo: { EspecialidadPsicologo: Especialidad }[];
  DireccionPsicologo: { Departamento: string, Ciudad: string, Barrio: string, Calle: string };
}

export function usePsicologos() {
  const [psicologos, setPsicologos] = useState<PsicologoCompleto[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroActividad, setFiltroActividad] = useState<'todos' | 'activos' | 'inactivos'>('todos');

  // Catálogos
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [estadosActividad, setEstadosActividad] = useState<EstadoActividad[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [dataPsicologos, dataCatalogos] = await Promise.all([
        api.psicologos.getAll(),
        api.general.catalogos()
      ]);
      // @ts-ignore
      setPsicologos(dataPsicologos);
      setEspecialidades(dataCatalogos.especialidades || []);
      setEstadosActividad(dataCatalogos.estadosActividad || []);
    } catch (error) {
      console.error(error);
      toast.error("Error cargando datos de psicólogos");
    } finally {
      setLoading(false);
    }
  };

  // Lógica de Filtrado
  const psicologosFiltrados = useMemo(() => {
    return psicologos.filter(p => {
      const busquedaLower = busqueda.toLowerCase().trim();
      let pasaBusqueda = true;
      if (busquedaLower) {
        const nombreCompleto = `${p.Nombre} ${p.Apellido}`.toLowerCase();
        pasaBusqueda = nombreCompleto.includes(busquedaLower) || p.CodigoDeMinsa.toLowerCase().includes(busquedaLower);
      }
      let pasaActividad = true;
      const estado = p.EstadoDeActividad?.NombreEstadoActividad?.toLowerCase();
      if (filtroActividad === 'activos') pasaActividad = estado === 'activo';
      else if (filtroActividad === 'inactivos') pasaActividad = estado === 'inactivo';
      return pasaBusqueda && pasaActividad;
    });
  }, [psicologos, busqueda, filtroActividad]);

  // Acciones CRUD
  const crearPsicologo = async (data: any) => { await api.psicologos.create(data); await loadData(); };
  const actualizarPsicologo = async (id: number, data: any) => { await api.psicologos.update(id, data); await loadData(); };

  return {
    psicologos: psicologosFiltrados,
    loading,
    busqueda, setBusqueda,
    filtroActividad, setFiltroActividad,
    catalogos: { especialidades, estadosActividad },
    acciones: { crearPsicologo, actualizarPsicologo }
  };
}