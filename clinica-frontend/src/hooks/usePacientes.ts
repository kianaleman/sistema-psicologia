import { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../services/api';
import { toast } from 'sonner';
import type { Paciente, Tutor, Ocupacion, EstadoCivil, Parentesco, CreatePacienteDTO } from '../types';

export function usePacientes() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Catálogos con tipado estricto
  const [ocupaciones, setOcupaciones] = useState<Ocupacion[]>([]);
  const [estadosCiviles, setEstadosCiviles] = useState<EstadoCivil[]>([]);
  const [parentescos, setParentescos] = useState<Parentesco[]>([]);
  const [listaTutores, setListaTutores] = useState<Tutor[]>([]);

  // Filtros de la UI
  const [filtros, setFiltros] = useState({
    busqueda: '',
    tipo: 'todos' as 'todos' | 'adultos' | 'menores',
    actividad: 'todos' as 'todos' | 'activos' | 'inactivos'
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Peticiones paralelas al nuevo backend
      const [dataPacientes, dataCatalogos] = await Promise.all([
        api.pacientes.getAll(),
        api.general.catalogos() // Asegúrate que en api.ts apunte a /general/catalogos
      ]);

      setPacientes(dataPacientes);
      
      // CORRECCIÓN DE TIPOS: Asignación segura de catálogos
      if (dataCatalogos) {
          setOcupaciones(dataCatalogos.ocupaciones || []);
          setEstadosCiviles(dataCatalogos.estadosCiviles || []);
          setParentescos(dataCatalogos.parentescos || []);
          // Aquí estaba el error: se asignaban psicólogos a tutores. Corregido:
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

  // --- LÓGICA DE FILTRADO (Sincronizada con PascalCase y Snake_Case) ---
  const pacientesFiltrados = useMemo(() => {
    if (!pacientes) return [];

    return pacientes.filter(p => {
      const term = filtros.busqueda.toLowerCase().trim();
      
      // 1. Búsqueda por Texto (Usa Nombre/Apellido con Mayúscula de Prisma)
      let matchTexto = true;
      if (term) {
        const nombreCompleto = `${p.Nombre} ${p.Apellido}`.toLowerCase();
        const cedula = p.PacienteAdulto?.No_Cedula?.toLowerCase() || '';
        // Ajuste a Paciente_Menor y PartidaDeNacimiento del nuevo schema
        const partida = p.Paciente_Menor?.PartidaDeNacimiento?.toLowerCase() || '';
        
        matchTexto = nombreCompleto.includes(term) || cedula.includes(term) || partida.includes(term);
      }

      // 2. Filtro por Tipo de Paciente
      let matchTipo = true;
      if (filtros.tipo === 'adultos') matchTipo = !!p.PacienteAdulto;
      if (filtros.tipo === 'menores') matchTipo = !!p.Paciente_Menor;

      // 3. Filtro por Estado (Usa el nuevo booleano 'Activo')
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

  const toggleEstado = async (id: number, estadoActual: boolean) => {
    try {
      // Llama al nuevo endpoint PATCH /pacientes/:id/estado
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
    acciones: { crearPaciente, reload: loadData, toggleEstado }
  };
}