import { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../services/api';
import { toast } from 'sonner';
import type { 
  Paciente, 
  Tutor, 
  Ocupacion, 
  EstadoCivil, 
  Parentesco, 
  CreatePacienteDTO 
} from '../types';

export function usePacientes() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Catálogos (Tipados correctamente)
  const [ocupaciones, setOcupaciones] = useState<Ocupacion[]>([]);
  const [estadosCiviles, setEstadosCiviles] = useState<EstadoCivil[]>([]);
  const [parentescos, setParentescos] = useState<Parentesco[]>([]);
  const [listaTutores, setListaTutores] = useState<Tutor[]>([]);

  // Filtros
  const [filtros, setFiltros] = useState({
    busqueda: '',
    tipo: 'todos' as 'todos' | 'adultos' | 'menores',
    actividad: 'todos' as 'todos' | 'activos' | 'inactivos'
  });

  // Usamos useCallback para que la función no cambie en cada render
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Ejecutamos en paralelo pero manejamos fallos individuales si fuera necesario
      const [dataPacientes, dataCatalogos] = await Promise.all([
        api.pacientes.getAll(),
        api.general.catalogos()
      ]);

      setPacientes(dataPacientes);
      
      // Asignación segura con los catálogos fuertemente tipados
      if (dataCatalogos) {
          setOcupaciones(dataCatalogos.ocupaciones || []);
          setEstadosCiviles(dataCatalogos.estadosCiviles || []);
          setParentescos(dataCatalogos.parentescos || []);
          setListaTutores(dataCatalogos.tutores || []);
      }
      
    } catch (err: unknown) {
      console.error("Error cargando datos:", err);
      const msg = err instanceof Error ? err.message : "Error desconocido";
      setError(msg);
      toast.error("No se pudieron cargar los datos. Verifica tu conexión.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Carga inicial
  useEffect(() => {
    loadData();
  }, [loadData]);

  // --- LÓGICA DE FILTRADO (Optimizada a la nueva Base de Datos) ---
  const pacientesFiltrados = useMemo(() => {
    if (!pacientes) return [];

    return pacientes.filter(p => {
      const term = filtros.busqueda.toLowerCase().trim();
      
      // 1. Búsqueda Texto
      let matchTexto = true;
      if (term) {
        const nombreCompleto = `${p.Nombre} ${p.Apellido}`.toLowerCase();
        const cedula = p.PacienteAdulto?.No_Cedula?.toLowerCase() || '';
        
        // CORRECCIÓN: Actualizado a Paciente_Menor y PartidaDeNacimiento
        const partida = p.Paciente_Menor?.PartidaDeNacimiento?.toLowerCase() || '';
        
        matchTexto = nombreCompleto.includes(term) || cedula.includes(term) || partida.includes(term);
      }

      // 2. Filtro Tipo
      let matchTipo = true;
      if (filtros.tipo === 'adultos') matchTipo = p.PacienteAdulto !== null && p.PacienteAdulto !== undefined;
      // CORRECCIÓN: Actualizado a Paciente_Menor
      if (filtros.tipo === 'menores') matchTipo = p.Paciente_Menor !== null && p.Paciente_Menor !== undefined;

      // 3. Filtro Actividad (CORRECCIÓN: Ahora es un booleano, no un objeto)
      let matchActividad = true;
      if (filtros.actividad === 'activos') matchActividad = p.Activo === true;
      if (filtros.actividad === 'inactivos') matchActividad = p.Activo === false;

      return matchTexto && matchTipo && matchActividad;
    });
  }, [pacientes, filtros]);

  const setFiltro = (campo: keyof typeof filtros, valor: string) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
  };

  // Acciones CRUD
  const crearPaciente = async (data: CreatePacienteDTO) => {
    try {
        await api.pacientes.create(data);
        toast.success("Paciente registrado exitosamente");
        await loadData(); 
        return true; 
    } catch (e: unknown) {
        console.error(e);
        // Simplificado: el interceptor en api.ts ya extrae el error exacto
        const msg = e instanceof Error ? e.message : 'Error al registrar paciente';
        toast.error(msg);
        return false;
    }
  };

  const actualizarPaciente = async (id: number, data: Partial<CreatePacienteDTO>) => {
    try {
        await api.pacientes.update(id, data);
        toast.success("Paciente actualizado correctamente");
        await loadData();
        return true;
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Error al actualizar paciente';
        toast.error(msg);
        return false;
    }
  };

  return {
    pacientes: pacientesFiltrados,
    loading,
    error,
    filtros,
    setFiltro,
    catalogos: { ocupaciones, estadosCiviles, parentescos, listaTutores },
    acciones: { crearPaciente, actualizarPaciente, reload: loadData }
  };
}