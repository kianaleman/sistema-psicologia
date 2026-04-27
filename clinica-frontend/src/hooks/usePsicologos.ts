import { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { toast } from 'sonner';
import type { Psicologo } from '../types';

// Tipos locales alineados con el Backend
export interface Especialidad { 
  ID_Especialidad: number; 
  NombreEspecialidad: string; 
}

// Interfaz extendida para manejar la data que devuelve Prisma
export interface PsicologoCompleto extends Psicologo {
  Usuario?: {
    Email: string;
  };
  // 🟢 CORRECCIÓN: Nombre de relación sincronizado exactamente con el Schema y el error 2551
  Psicologo_EspecialidadPsicologo?: { 
    ID_Especialidad: number;
    EspecialidadPsicologo: Especialidad 
  }[];
}

export function usePsicologos() {
  const [psicologos, setPsicologos] = useState<PsicologoCompleto[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroActividad, setFiltroActividad] = useState<'todos' | 'activos' | 'inactivos'>('todos');

  // Catálogos
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);

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
      
      setPsicologos(dataPsicologos);
      setEspecialidades(dataCatalogos.especialidades || []);
    } catch (error) {
      console.error("Error cargando psicólogos:", error);
      toast.error("Error cargando datos de psicólogos");
    } finally {
      setLoading(false);
    }
  };

  // --- LÓGICA DE FILTRADO ---
  const psicologosFiltrados = useMemo(() => {
    return psicologos.filter(p => {
      const busquedaLower = busqueda.toLowerCase().trim();
      
      let pasaBusqueda = true;
      if (busquedaLower) {
        const nombreCompleto = `${p.Nombre} ${p.Apellido}`.toLowerCase();
        const codigoMinsa = p.CodigoMinsa?.toLowerCase() || '';
        pasaBusqueda = nombreCompleto.includes(busquedaLower) || codigoMinsa.includes(busquedaLower);
      }

      let pasaActividad = true;
      if (filtroActividad === 'activos') pasaActividad = p.Activo === true;
      else if (filtroActividad === 'inactivos') pasaActividad = p.Activo === false;

      return pasaBusqueda && pasaActividad;
    });
  }, [psicologos, busqueda, filtroActividad]);

  // Acciones CRUD
  const crearPsicologo = async (data: any) => { 
    try {
      await api.psicologos.create(data); 
      await loadData(); 
    } catch (e: any) {
      toast.error(e.response?.data?.error || "Error al crear psicólogo");
      throw e; 
    }
  };

  const actualizarPsicologo = async (id: number, data: any) => { 
    try {
      await api.psicologos.update(id, data); 
      await loadData(); 
    } catch (e: any) {
      toast.error("Error al actualizar");
      throw e;
    }
  };

  return {
    psicologos: psicologosFiltrados,
    loading,
    busqueda, setBusqueda,
    filtroActividad, setFiltroActividad,
    catalogos: { especialidades },
    acciones: { crearPsicologo, actualizarPsicologo, reload: loadData }
  };
}