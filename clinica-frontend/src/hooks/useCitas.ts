import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { api } from '../services/api';
import type { Cita, CreateCitaDTO } from '../types';

export const useCitas = () => {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [filtros, setFiltros] = useState({
    periodo: 'hoy',
    fechaInicio: '',
    fechaFin: '',
    estado: '',
    paciente: '',
    psicologo: ''
  });

  // Estado inicial de catálogos
  const [catalogos, setCatalogos] = useState<any>({
    tiposCita: [],
    estadosCita: [],
    metodosPago: [],
    pacientes: [],
    psicologos: [],
    viasAdmin: [],       
    tiposTerapia: [],    
    exploraciones: []    
  });

  const fetchCitas = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.citas.getAll();
      setCitas(data);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError('Error al cargar citas');
      toast.error('No se pudo cargar la agenda');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCatalogos = useCallback(async () => {
    try {
      const general: any = await api.general.catalogos();
      setCatalogos({
         tiposCita: general.tiposCita || [],
         estadosCita: general.estadosCita || [],
         metodosPago: general.metodosPago || [],
         pacientes: general.pacientes || [],
         psicologos: general.psicologos || [],
         viasAdmin: general.viasAdministracion || [], 
         tiposTerapia: general.tiposTerapia || [],
         exploraciones: general.exploraciones || []
      });
    } catch (err) {
      console.error("Error catalogos", err);
    }
  }, []);

  useEffect(() => {
    fetchCitas();
    fetchCatalogos();
  }, [fetchCitas, fetchCatalogos]);

  // --- ACCIONES ---

  const crearCita = async (data: CreateCitaDTO) => {
    try {
      await api.citas.create(data);
      toast.success('Cita agendada correctamente');
      fetchCitas();
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Error al agendar cita';
      toast.error(msg);
      return false;
    }
  };

  const actualizarCita = async (id: number, data: any) => {
    try {
      await api.citas.update(id, data);
      toast.success('Cita actualizada');
      fetchCitas();
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Error al actualizar cita';
      toast.error(msg);
      return false;
    }
  };

  const cancelarCita = async (id: number, motivoId: number, notas: string) => {
    try {
      await api.citas.cancel(id, motivoId, notas);
      toast.success('Cita cancelada');
      fetchCitas();
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Error al cancelar cita';
      toast.error(msg);
      return false;
    }
  };

  const guardarSesion = async (data: any) => {
     try {
        await api.sesiones.create(data);
        fetchCitas();
     } catch (err: any) {
        throw new Error(err.response?.data?.error || 'Error al guardar sesión');
     }
  };

  // --- FILTRADO CORREGIDO (ZONA HORARIA LOCAL) ---
  // --- FILTRADO CORREGIDO (SOLUCIÓN FECHA EXACTA) ---
  const citasFiltradas = citas.filter(c => {
     // 1. TRUCO: Leer la fecha como string puro para evitar que el navegador reste horas
     // c.FechaCita viene como "2025-11-28T00:00:00.000Z" -> tomamos "2025-11-28"
     const fechaCitaStr = c.FechaCita.toString().split('T')[0];
     
     // Fecha de "Hoy" en formato local YYYY-MM-DD (ej: Nicaragua)
     // Usamos 'en-CA' porque devuelve formato ISO (YYYY-MM-DD) que es fácil de comparar
     const hoyStr = new Date().toLocaleDateString('en-CA');

     let matchPeriodo = true;

     if (filtros.periodo === 'hoy') {
        matchPeriodo = fechaCitaStr === hoyStr;
     } 
     else if (filtros.periodo === 'semana') {
        const fechaCitaObj = new Date(fechaCitaStr + "T00:00:00"); // Forzamos fecha local
        const hoy = new Date();
        
        const primerDia = new Date(hoy); 
        primerDia.setDate(hoy.getDate() - hoy.getDay());
        primerDia.setHours(0, 0, 0, 0);

        const ultimoDia = new Date(hoy); 
        ultimoDia.setDate(hoy.getDate() - hoy.getDay() + 6);
        ultimoDia.setHours(23, 59, 59, 999);

        matchPeriodo = fechaCitaObj >= primerDia && fechaCitaObj <= ultimoDia;
     } 
     else if (filtros.periodo === 'mes') {
        const fechaCitaObj = new Date(fechaCitaStr + "T00:00:00");
        const hoy = new Date();
        matchPeriodo = fechaCitaObj.getMonth() === hoy.getMonth() && fechaCitaObj.getFullYear() === hoy.getFullYear();
     } 
     else if (filtros.periodo === 'rango' && filtros.fechaInicio && filtros.fechaFin) {
        // Comparación de strings directa funciona perfecto con formato YYYY-MM-DD
        matchPeriodo = fechaCitaStr >= filtros.fechaInicio && fechaCitaStr <= filtros.fechaFin;
     }

     // Filtros de texto y estado (sin cambios)
     let matchEstado = true;
     if (filtros.estado) matchEstado = c.ID_EstadoCita.toString() === filtros.estado;

     let matchTexto = true;
     if (filtros.paciente) {
        const pName = `${c.Paciente.Nombre} ${c.Paciente.Apellido}`.toLowerCase();
        matchTexto = matchTexto && pName.includes(filtros.paciente.toLowerCase());
     }
     if (filtros.psicologo) {
        const dName = `${c.Psicologo.Nombre} ${c.Psicologo.Apellido}`.toLowerCase();
        matchTexto = matchTexto && dName.includes(filtros.psicologo.toLowerCase());
     }

     return matchPeriodo && matchEstado && matchTexto;
  });

  const setFiltro = (key: string, value: string) => {
    setFiltros(prev => ({ ...prev, [key]: value }));
  };

  return {
    citas: citasFiltradas,
    loading,
    error,
    filtros,
    setFiltro,
    catalogos, 
    acciones: { crearCita, actualizarCita, cancelarCita, guardarSesion }
  };
};