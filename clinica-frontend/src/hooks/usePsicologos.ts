import { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../services/api';
import { toast } from 'sonner';
import type { Psicologo, Direccion } from '../types';

// Definiciones locales
// Ajustado a Nombre_Especialidad para coincidir con la convención de DB
export interface Especialidad { 
  ID_Especialidad: number; 
  Nombre_Especialidad: string; 
}

// Extendemos nuestra interfaz base para incluir las relaciones complejas
export interface PsicologoCompleto extends Psicologo {
  Psicologo_EspecialidadPsicologo?: { EspecialidadPsicologo: Especialidad }[];
  // Actualizado de DireccionPsicologo a Direccion (como dicta types/index.ts)
  Direccion?: Direccion;
}

export function usePsicologos() {
  const [psicologos, setPsicologos] = useState<PsicologoCompleto[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroActividad, setFiltroActividad] = useState<'todos' | 'activos' | 'inactivos'>('todos');

  // Catálogos
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  // NOTA: Eliminamos el estado `estadosActividad` porque ahora usamos el booleano `Activo`

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [dataPsicologos, dataCatalogos] = await Promise.all([
        api.psicologos.getAll(),
        api.general.catalogos()
      ]);
      
      setPsicologos(dataPsicologos as PsicologoCompleto[]);
      
      // SOLUCIÓN: Usamos unknown como puente y tipamos el objeto anónimo exactamente como lo necesitamos
      const catalogos = dataCatalogos as unknown as { especialidades?: Especialidad[] };
      setEspecialidades(catalogos.especialidades || []);
      
    } catch (error: unknown) {
      console.error(error);
      toast.error("Error cargando datos de psicólogos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // --- Lógica de Filtrado Optimizada ---
  const psicologosFiltrados = useMemo(() => {
    return psicologos.filter(p => {
      const busquedaLower = busqueda.toLowerCase().trim();
      
      let pasaBusqueda = true;
      if (busquedaLower) {
        const nombreCompleto = `${p.Nombre} ${p.Apellido}`.toLowerCase();
        // Usamos la nueva propiedad CodigoMinsa (antes CodigoDeMinsa) de manera segura
        const minsa = p.CodigoMinsa?.toLowerCase() || ''; 
        
        pasaBusqueda = nombreCompleto.includes(busquedaLower) || minsa.includes(busquedaLower);
      }
      
      let pasaActividad = true;
      // Ya no buscamos en objetos anidados, evaluamos el booleano directamente
      if (filtroActividad === 'activos') pasaActividad = p.Activo === true;
      else if (filtroActividad === 'inactivos') pasaActividad = p.Activo === false;
      
      return pasaBusqueda && pasaActividad;
    });
  }, [psicologos, busqueda, filtroActividad]);

  // --- Acciones CRUD con manejo de errores de Zod ---
  
  // Usamos Omit para indicarle a TS que un psicólogo nuevo no tiene ID todavía
  const crearPsicologo = async (data: Omit<Psicologo, 'ID_Psicologo'>) => { 
    try {
      await api.psicologos.create(data); 
      toast.success("Psicólogo registrado exitosamente");
      await loadData(); 
      return true;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Error al registrar psicólogo";
      toast.error(msg);
      return false;
    }
  };
  
  // Usamos Partial porque en las actualizaciones (PUT/PATCH) no siempre se envían todos los campos
  const actualizarPsicologo = async (id: number, data: Partial<Psicologo>) => { 
    try {
      await api.psicologos.update(id, data); 
      toast.success("Psicólogo actualizado correctamente");
      await loadData(); 
      return true;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Error al actualizar psicólogo";
      toast.error(msg);
      return false;
    }
  };

  return {
    psicologos: psicologosFiltrados,
    loading,
    busqueda, setBusqueda,
    filtroActividad, setFiltroActividad,
    catalogos: { especialidades }, // Eliminamos estadosActividad del return
    acciones: { crearPsicologo, actualizarPsicologo, reload: loadData }
  };
}