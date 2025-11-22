import { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../services/api';
import { toast } from 'sonner';
import type { Paciente, Tutor, Ocupacion, EstadoCivil, Parentesco, CreatePacienteDTO } from '../types';

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
      
      // Asignación segura
      if (dataCatalogos) {
          setOcupaciones(dataCatalogos.ocupaciones || []);
          setEstadosCiviles(dataCatalogos.estadosCiviles || []);
          setParentescos(dataCatalogos.parentescos || []);
          setListaTutores(dataCatalogos.tutores || []);
      }
      
    } catch (err: any) {
      console.error("Error cargando datos:", err);
      setError(err.message);
      toast.error("No se pudieron cargar los datos. Verifica tu conexión.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Carga inicial
  useEffect(() => {
    loadData();
  }, [loadData]);

  // --- LÓGICA DE FILTRADO (Optimizada) ---
  const pacientesFiltrados = useMemo(() => {
    if (!pacientes) return [];

    return pacientes.filter(p => {
      const term = filtros.busqueda.toLowerCase().trim();
      
      // 1. Búsqueda Texto
      let matchTexto = true;
      if (term) {
        const nombreCompleto = `${p.Nombre} ${p.Apellido}`.toLowerCase();
        const cedula = p.PacienteAdulto?.No_Cedula?.toLowerCase() || '';
        // Manejo seguro de null en PacienteMenor
        const partida = p.PacienteMenor?.PartNacimiento?.toLowerCase() || '';
        
        matchTexto = nombreCompleto.includes(term) || cedula.includes(term) || partida.includes(term);
      }

      // 2. Filtro Tipo
      let matchTipo = true;
      if (filtros.tipo === 'adultos') matchTipo = p.PacienteAdulto !== null && p.PacienteAdulto !== undefined;
      if (filtros.tipo === 'menores') matchTipo = p.PacienteMenor !== null && p.PacienteMenor !== undefined;

      // 3. Filtro Actividad
      let matchActividad = true;
      const estadoNombre = p.EstadoDeActividad?.NombreEstadoActividad?.toLowerCase();
      
      // Mapeo seguro de estados (asumiendo que tu BD usa "Activo" e "Inactivo")
      if (filtros.actividad === 'activos') matchActividad = estadoNombre === 'activo';
      if (filtros.actividad === 'inactivos') matchActividad = estadoNombre === 'inactivo';

      return matchTexto && matchTipo && matchActividad;
    });
  }, [pacientes, filtros]);

  const setFiltro = (campo: keyof typeof filtros, valor: string) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
  };

  // Acciones CRUD con manejo de UI Optimista (Opcional, por ahora simple)
  const crearPaciente = async (data: CreatePacienteDTO) => {
    try {
        await api.pacientes.create(data);
        toast.success("Paciente registrado exitosamente");
        await loadData(); // Recargamos para ver el nuevo paciente
        return true; // Retornamos éxito
    } catch (e: any) {
        console.error(e);
      // CORRECCIÓN: Leemos el mensaje que manda el Backend (paciente.service.ts)
      const msg = e.response?.data?.error || 'Error desconocido al registrar paciente';
      toast.error(msg);
        return false;
    }
  };

  const actualizarPaciente = async (id: number, data: any) => {
    try {
        await api.pacientes.update(id, data);
        toast.success("Paciente actualizado correctamente");
        await loadData();
        return true;
    } catch (e: any) {
        // CORRECCIÓN: Leemos el mensaje que manda el Backend (paciente.service.ts)
      const msg = e.response?.data?.error || 'Error desconocido al registrar paciente';
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