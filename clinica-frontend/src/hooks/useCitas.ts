import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { api } from '../services/api';
import type { 
  Cita, 
  CreateCitaDTO,
  CreateSesionDTO,
  TipoCitaCatalogo,
  EstadoCitaCatalogo,
  MetodoPago,
  Paciente,
  Psicologo,
  ViaAdministracion,
  TipoDeTerapia,
  ExploracionPsicologica,
  Banco,
  Divisa,
} from '../types';

// Definimos la interfaz estricta para los catálogos locales del hook
interface CatalogosCita {
  tiposCita: TipoCitaCatalogo[];
  estadosCita: EstadoCitaCatalogo[];
  metodosPago: MetodoPago[];
  pacientes: Paciente[];
  psicologos: Psicologo[];
  viasAdmin: ViaAdministracion[];
  tiposTerapia: TipoDeTerapia[];
  exploraciones: ExploracionPsicologica[];
  bancos: Banco[];
  divisas: Divisa[];
}

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

  // Estado inicial tipado, ¡adiós any!
  const [catalogos, setCatalogos] = useState<CatalogosCita>({
    tiposCita: [],
    estadosCita: [],
    metodosPago: [],
    pacientes: [],
    psicologos: [],
    viasAdmin: [],       
    tiposTerapia: [],    
    exploraciones: [],
    bancos: [],
    divisas: []    
  });

  const fetchCitas = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.citas.getAll();
      setCitas(data);
      setError(null);
    } catch (err: unknown) {
      console.error(err);
      setError('Error al cargar citas');
      toast.error('No se pudo cargar la agenda');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCatalogos = useCallback(async () => {
    try {
      // Usamos Record<string, unknown> en lugar de any para la respuesta cruda
      const general = await api.general.catalogos();
      
      setCatalogos({
         tiposCita: (general.tiposCita as TipoCitaCatalogo[]) || [],
         estadosCita: (general.estadosCita as EstadoCitaCatalogo[]) || [],
         metodosPago: (general.metodosPago as MetodoPago[]) || [],
         pacientes: (general.pacientes as Paciente[]) || [],
         psicologos: (general.psicologos as Psicologo[]) || [],
         viasAdmin: (general.viasAdministracion as ViaAdministracion[]) || [], 
         tiposTerapia: (general.tiposTerapia as TipoDeTerapia[]) || [],
         exploraciones: (general.exploraciones as ExploracionPsicologica[]) || [],
         bancos: (general.bancos as Banco[]) || [],
         divisas: (general.divisas as Divisa[]) || []
      });
    } catch (err) {
      console.error("Error al cargar catálogos de citas", err);
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
    } catch (err: unknown) {
      // Simplificado: api.ts ya extrae el mensaje de error de Zod
      const msg = err instanceof Error ? err.message : 'Error al agendar cita';
      toast.error(msg);
      return false;
    }
  };

 

  const actualizarCita = async (id: number, data: Partial<CreateCitaDTO>) => {
    try {
      await api.citas.update(id, data);
      toast.success('Cita actualizada');
      fetchCitas();
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al actualizar cita';
      toast.error(msg);
      return false;
    }
  };

  // Nombres de parámetros actualizados a la API
  const cancelarCita = async (id: number, ID_MotivoCancelacion: number, NotasCancelacion: string) => {
    try {
      await api.citas.cancel(id, ID_MotivoCancelacion, NotasCancelacion);
      toast.success('Cita cancelada');
      fetchCitas();
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cancelar cita';
      toast.error(msg);
      return false;
    }
  };

  // Tipado estricto para la sesión
  const guardarSesion = async (data: CreateSesionDTO) => {
     try {
        await api.sesiones.create(data);
        toast.success('Sesión clínica registrada');
        fetchCitas();
     } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error al guardar sesión';
        throw new Error(msg);
     }
  };

  const obtenerHorariosOcupados = useCallback(async (psicologoId: number, fecha: string) => {
    try {
      return await api.citas.getHorariosOcupados(psicologoId, fecha);
    } catch (err) {
      console.error("Error al obtener disponibilidad:", err);
      return []; // Retornamos array vacío si falla para no romper la UI
    }
  }, []);

  // --- FILTRADO ---
  const citasFiltradas = citas.filter(c => {
     if (!c.FechaCita) return false;

     const fechaCitaStr = c.FechaCita.toString().split('T')[0];
     const hoyStr = new Date().toLocaleDateString('en-CA');

     let matchPeriodo = true;

     if (filtros.periodo === 'hoy') {
        matchPeriodo = fechaCitaStr === hoyStr;
     } 
     else if (filtros.periodo === 'semana') {
        const fechaCitaObj = new Date(fechaCitaStr + "T00:00:00"); 
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
        matchPeriodo = fechaCitaStr >= filtros.fechaInicio && fechaCitaStr <= filtros.fechaFin;
     }

     let matchEstado = true;
     if (filtros.estado) matchEstado = c.ID_EstadoCita.toString() === filtros.estado;

     let matchTexto = true;
     // Usamos Optional Chaining (?.) para evitar crasheos si faltan datos relacionales
     if (filtros.paciente) {
        const pName = `${c.Paciente?.Nombre || ''} ${c.Paciente?.Apellido || ''}`.toLowerCase();
        matchTexto = matchTexto && pName.includes(filtros.paciente.toLowerCase());
     }
     if (filtros.psicologo) {
        const dName = `${c.Psicologo?.Nombre || ''} ${c.Psicologo?.Apellido || ''}`.toLowerCase();
        matchTexto = matchTexto && dName.includes(filtros.psicologo.toLowerCase());
     }

     return matchPeriodo && matchEstado && matchTexto;
  });

  const setFiltro = (key: keyof typeof filtros, value: string) => {
    setFiltros(prev => ({ ...prev, [key]: value }));
  };

  return {
    citas: citasFiltradas,
    loading,
    error,
    filtros,
    setFiltro,
    catalogos, 
    acciones: { crearCita, actualizarCita, cancelarCita, guardarSesion, obtenerHorariosOcupados }
  };
};