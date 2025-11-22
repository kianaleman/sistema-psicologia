import { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../services/api';
import { toast } from 'sonner';
// 1. Importamos los nuevos tipos
import type { 
    Cita, Paciente, Psicologo, CreateCitaDTO,
    ViaAdministracion, TipoDeTerapia, Exploracion,
    TipoCitaCatalogo, EstadoCitaCatalogo, MetodoPago 
} from '../types';

export function useCitas() {
  // Estado Principal
  const [citas, setCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);

  // Catálogos Esenciales
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [psicologos, setPsicologos] = useState<Psicologo[]>([]);
  
  // 2. Corregimos los 'any' usando las interfaces
  const [tiposCita, setTiposCita] = useState<TipoCitaCatalogo[]>([]);
  const [estadosCita, setEstadosCita] = useState<EstadoCitaCatalogo[]>([]);
  const [metodosPago, setMetodosPago] = useState<MetodoPago[]>([]);

  // Catálogos Clínicos
  const [viasAdmin, setViasAdmin] = useState<ViaAdministracion[]>([]);
  const [tiposTerapia, setTiposTerapia] = useState<TipoDeTerapia[]>([]);
  const [exploraciones, setExploraciones] = useState<Exploracion[]>([]);

  // ... (El resto del archivo sigue igual)

  // Filtros
  const [filtros, setFiltros] = useState({
    periodo: 'todos' as 'todos' | 'hoy' | 'semana' | 'mes' | 'rango',
    estado: '',    
    fechaInicio: '', 
    fechaFin: '',
    paciente: '',  
    psicologo: ''  
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Ejecutamos en paralelo para velocidad
      const [
          dataCitas, 
          dataPacientes, 
          dataPsicologos, 
          dataCatalogosCita,
          // Solo cargamos catálogos generales si realmente se usan aquí (opcional)
          dataCatalogosGen 
      ] = await Promise.all([
        api.citas.getAll(),
        api.pacientes.getAll(),
        api.psicologos.getAll(),
        api.general.catalogosCitas(),
        api.general.catalogos()
      ]);

      setCitas(dataCitas);
      setPacientes(dataPacientes);
      setPsicologos(dataPsicologos);
      
      // Asignación segura
      setTiposCita(dataCatalogosCita.tiposCita || []);
      setEstadosCita(dataCatalogosCita.estadosCita || []);
      setMetodosPago(dataCatalogosCita.metodosPago || []);
      
      // Asignación de catálogos clínicos
      if (dataCatalogosGen) {
          setViasAdmin(dataCatalogosGen.viasAdministracion || []);
          setTiposTerapia(dataCatalogosGen.tiposTerapia || []);
          setExploraciones(dataCatalogosGen.exploraciones || []);
      }

    } catch (error) {
      console.error(error);
      toast.error("Error cargando la agenda");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // --- LÓGICA DE FILTRADO ---
  const citasFiltradas = useMemo(() => {
    if (!citas) return [];
    
    return citas.filter(c => {
      // 1. Filtro Estado
      if (filtros.estado && c.ID_EstadoCita.toString() !== filtros.estado) return false;

      // 2. Filtro Paciente (Búsqueda segura)
      if (filtros.paciente) {
        const nombre = c.Paciente ? `${c.Paciente.Nombre} ${c.Paciente.Apellido}`.toLowerCase() : '';
        if (!nombre.includes(filtros.paciente.toLowerCase())) return false;
      }

      // 3. Filtro Psicólogo
      if (filtros.psicologo) {
        const nombre = c.Psicologo ? `${c.Psicologo.Nombre} ${c.Psicologo.Apellido}`.toLowerCase() : '';
        if (!nombre.includes(filtros.psicologo.toLowerCase())) return false;
      }

      // 4. Filtro Fechas
      if (!c.FechaCita) return false;
      const fechaCitaStr = c.FechaCita.toString().split('T')[0];
      const hoyStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD local

      if (filtros.periodo === 'hoy') return fechaCitaStr === hoyStr;
      
      if (filtros.periodo === 'mes') {
          return fechaCitaStr.substring(0, 7) === hoyStr.substring(0, 7);
      }
      
      if (filtros.periodo === 'semana') {
        const d = new Date();
        const day = d.getDay(); // 0 (Dom) - 6 (Sab)
        // Calcular Lunes de esta semana
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const lunes = new Date(d.setDate(diff)).toISOString().split('T')[0];
        const domingo = new Date(d.setDate(diff + 6)).toISOString().split('T')[0];
        return fechaCitaStr >= lunes && fechaCitaStr <= domingo;
      }

      if (filtros.periodo === 'rango') {
        if (!filtros.fechaInicio || !filtros.fechaFin) return true;
        return fechaCitaStr >= filtros.fechaInicio && fechaCitaStr <= filtros.fechaFin;
      }

      return true; // 'todos'
    });
  }, [citas, filtros]);

  const setFiltro = (campo: keyof typeof filtros, valor: any) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
  };

  // Acciones CRUD Tipadas
  const crearCita = async (data: CreateCitaDTO) => { 
      try {
          await api.citas.create(data); 
          toast.success("Cita agendada correctamente");
          await loadData();
          return true; // ÉXITO: El modal se cerrará
      } catch (e: any) { 
          // AQUÍ ESTÁ LA MAGIA: Mostramos el mensaje exacto que viene del backend
          toast.error(e.message || "No se pudo agendar la cita");
          return false; // FALLO: El modal NO se cerrará
      }
  };

  const actualizarCita = async (id: number, data: Partial<CreateCitaDTO>) => { 
      try {
          await api.citas.update(id, data); 
          toast.success("Cita actualizada");
          await loadData(); 
          return true; // ÉXITO
      } catch (e: any) { 
          toast.error(e.message || "No se pudo actualizar");
          return false; // FALLO
      }
  };

  const cancelarCita = async (id: number) => { 
      try {
          await api.citas.cancel(id); 
          toast.info("Cita cancelada");
          await loadData();
      } catch (e) { toast.error("No se pudo cancelar"); }
  };

  return {
    citas: citasFiltradas,
    loading,
    filtros,
    setFiltro,
    catalogos: { pacientes, psicologos, tiposCita, estadosCita, metodosPago, viasAdmin, tiposTerapia, exploraciones },
    acciones: { crearCita, actualizarCita, cancelarCita, reload: loadData }
  };
}