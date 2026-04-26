import { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../services/api';
import { toast } from 'sonner';
import type { Paciente, Tutor, Ocupacion, EstadoCivil, Parentesco, CreatePacienteDTO } from '../types';

export function usePacientes() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Catálogos
  const [ocupaciones, setOcupaciones] = useState<Ocupacion[]>([]);
  const [estadosCiviles, setEstadosCiviles] = useState<EstadoCivil[]>([]);
  const [parentescos, setParentescos] = useState<Parentesco[]>([]);
  const [listaTutores, setListaTutores] = useState<Tutor[]>([]);

  const [filtros, setFiltros] = useState({
    busqueda: '',
    tipo: 'todos' as 'todos' | 'adultos' | 'menores',
    actividad: 'todos' as 'todos' | 'activos' | 'inactivos'
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [dataPacientes, dataCatalogos] = await Promise.all([
        api.pacientes.getAll(),
        api.general.catalogos()
      ]);

      setPacientes(dataPacientes);
      
      if (dataCatalogos) {
          setOcupaciones(dataCatalogos.ocupaciones || []);
          setEstadosCiviles(dataCatalogos.estadosCiviles || []);
          setParentescos(dataCatalogos.parentescos || []);
          setListaTutores(dataCatalogos.tutores || []); 
      }
      
    } catch (err: any) {
      console.error("Error cargando datos de pacientes:", err);
      setError(err.message);
      toast.error("Error de conexión con el servidor.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const pacientesFiltrados = useMemo(() => {
    if (!pacientes) return [];

    return pacientes.filter(p => {
      const term = filtros.busqueda.toLowerCase().trim();
      
      let matchTexto = true;
      if (term) {
        const nombreCompleto = `${p.Nombre} ${p.Apellido}`.toLowerCase();
        const cedula = p.PacienteAdulto?.No_Cedula?.toLowerCase() || '';
        const partida = p.Paciente_Menor?.PartidaDeNacimiento?.toLowerCase() || '';
        matchTexto = nombreCompleto.includes(term) || cedula.includes(term) || partida.includes(term);
      }

      let matchTipo = true;
      if (filtros.tipo === 'adultos') matchTipo = !!p.PacienteAdulto;
      if (filtros.tipo === 'menores') matchTipo = !!p.Paciente_Menor;

      let matchActividad = true;
      if (filtros.actividad === 'activos') matchActividad = p.Activo === true;
      if (filtros.actividad === 'inactivos') matchActividad = p.Activo === false;

      return matchTexto && matchTipo && matchActividad;
    });
  }, [pacientes, filtros]);

  const setFiltro = (campo: keyof typeof filtros, valor: string) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
  };

  // --- ACCIONES CRUD ---

  const crearPaciente = async (data: CreatePacienteDTO) => {
    try {
        await api.pacientes.create(data);
        toast.success("Paciente registrado correctamente");
        await loadData();
        return true;
    } catch (e: any) {
      const msg = e.response?.data?.error || 'Error al registrar paciente';
      toast.error(msg);
      return false;
    }
  };

  // 🟢 CORRECCIÓN: Se agrega la función que faltaba para resolver el error 2339
  const actualizarPaciente = async (id: number, data: CreatePacienteDTO) => {
    try {
      await api.pacientes.update(id, data);
      toast.success("Información actualizada correctamente");
      await loadData();
      return true;
    } catch (e: any) {
      const msg = e.response?.data?.error || 'Error al actualizar paciente';
      toast.error(msg);
      return false;
    }
  };

  const toggleEstado = async (id: number, estadoActual: boolean) => {
    try {
      await api.pacientes.toggleEstado(id, !estadoActual);
      toast.success(estadoActual ? "Paciente desactivado" : "Paciente activado");
      await loadData();
    } catch (e: any) {
      toast.error("No se pudo cambiar el estado del paciente");
    }
  };

  return {
    pacientes: pacientesFiltrados,
    loading,
    error,
    filtros,
    setFiltro,
    catalogos: { ocupaciones, estadosCiviles, parentescos, listaTutores },
    // 🟢 CORRECCIÓN: Se expone actualizarPaciente en el objeto de acciones
    acciones: { 
      crearPaciente, 
      actualizarPaciente, 
      reload: loadData, 
      toggleEstado 
    }
  };
}