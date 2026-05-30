import { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../services/api'; // Instancia global de Axios
import { toast } from 'sonner';
import type { 
  Paciente, 
  Tutor, 
  Ocupacion, 
  EstadoCivil, 
  Parentesco, 
  CreatePacienteDTO,
  Pais,
  Municipio, 
  Departamento
} from '../types';

// Interfaz para mapear la respuesta del endpoint de catálogos
interface CatalogosResponse {
  ocupaciones: Ocupacion[];
  estadosCiviles: EstadoCivil[];
  parentescos: Parentesco[];
  tutores: Tutor[];
  paises: Pais[];      // Añadido para el manejo de países
  municipios: Municipio[];  // Añadido para la gestión de municipios
  departamentos: Departamento[]; // Añadido para la gestión de departamentos
}

export function usePacientes() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Catálogos
  const [ocupaciones, setOcupaciones] = useState<Ocupacion[]>([]);
  const [estadosCiviles, setEstadosCiviles] = useState<EstadoCivil[]>([]);
  const [parentescos, setParentescos] = useState<Parentesco[]>([]);
  const [listaTutores, setListaTutores] = useState<Tutor[]>([]);
  const [paises, setPaises] = useState<Pais[]>([]);            // Estado para países
  const [municipios, setMunicipios] = useState<Municipio[]>([]);    // Estado para municipios
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]); // Estado para departamentos

  // Filtros
  const [filtros, setFiltros] = useState({
    busqueda: '',
    tipo: 'todos' as 'todos' | 'adultos' | 'menores',
    actividad: 'todos' as 'todos' | 'activos' | 'inactivos'
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Peticiones concurrentes más resistentes
      const [resPacientes, resCatalogos] = await Promise.all([
        api.get<Paciente[]>('/pacientes'),
        
        // Ajustamos la ruta a /general/catalogos (que suele ser el estándar)
        // Y le agregamos un catch para que si falla, devuelva null y no rompa los pacientes
        api.get<CatalogosResponse>('/general/catalogos').catch(err => {
          console.warn("Ruta de catálogos no encontrada. Verifica el endpoint en Express.", err);
          return null;
        }) 
      ]);

      // 2. Asignamos los pacientes (esto ahora se ejecutará siempre)
      setPacientes(resPacientes);
      
      // 3. Asignamos catálogos solo si la petición fue exitosa
      if (resCatalogos) {
        setOcupaciones(resCatalogos.ocupaciones || []);
        setEstadosCiviles(resCatalogos.estadosCiviles || []);
        setParentescos(resCatalogos.parentescos || []);
        setListaTutores(resCatalogos.tutores || []);
        setPaises(resCatalogos.paises || []);           // Asignación de países
        setMunicipios(resCatalogos.municipios || []);   // Asignación de municipios
        setDepartamentos(resCatalogos.departamentos || []); // Asignación de departamentos
      }
      
    } catch (err: unknown) {
      // Gracias a nuestro api.ts, err.message ya trae el texto exacto del backend ("Token inválido", etc.)
      const msg = err instanceof Error ? err.message : "Error al cargar la base de datos";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // --- LÓGICA DE FILTRADO ---
  const pacientesFiltrados = useMemo(() => {
    if (!pacientes) return [];

    return pacientes.filter(p => {
      const term = filtros.busqueda.toLowerCase().trim();
      
      // 1. Búsqueda Texto (Alineado a Prisma con PascalCase)
      let matchTexto = true;
      if (term) {
        const nombreCompleto = `${p.Nombre} ${p.Apellido}`.toLowerCase();
        const cedula = p.PacienteAdulto?.No_Cedula?.toLowerCase() || '';
        const partida = p.Paciente_Menor?.PartidaDeNacimiento?.toLowerCase() || '';
        
        matchTexto = nombreCompleto.includes(term) || cedula.includes(term) || partida.includes(term);
      }

      // 2. Filtro Tipo
      let matchTipo = true;
      if (filtros.tipo === 'adultos') matchTipo = p.PacienteAdulto != null;
      if (filtros.tipo === 'menores') matchTipo = p.Paciente_Menor != null;

      // 3. Filtro Actividad
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
      await api.post('/pacientes', data);
      toast.success("Paciente registrado exitosamente");
      await loadData(); 
      return true; 
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al registrar paciente';
      toast.error(msg);
      return false;
    }
  };

  const actualizarPaciente = async (id: number, data: Partial<CreatePacienteDTO>) => {
    try {
      await api.put(`/pacientes/${id}`, data);
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
    catalogos: { 
      ocupaciones, 
      estadosCiviles, 
      parentescos, 
      listaTutores, 
      departamentos,   // Retorno del catálogo de departamentos
      paises,        // Retorno del catálogo de países
      municipios     // Retorno del catálogo de municipios
    },
    acciones: { crearPaciente, actualizarPaciente, reload: loadData }
  };
}