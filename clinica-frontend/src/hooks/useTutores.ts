import { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../services/api';
import { toast } from 'sonner';
import type { 
  Tutor, 
  Ocupacion, 
  EstadoCivil, 
  Parentesco, 
  Direccion 
} from '../types';

// Interface extendida sincronizada con los nombres de la BD
export interface TutorCompleto extends Tutor {
  // Opcional en caso de que lo traigas anidado, si no, se usa el Ocupacion_Tutor de types/index.ts
  ID_Parentesco?: number;
  Direccion?: Direccion;
  Paciente_Menor?: { 
    PartidaDeNacimiento: string; 
    Grado_Escolar?: string;
    Paciente?: { Nombre: string, Apellido: string } 
  }[];
}

// Tipo estricto para proteger el formulario (¡Adiós any!)
export interface TutorFormData {
  Nombre: string;
  Apellido: string;
  No_Cedula: string;
  No_Telefono: string;
  ID_Parentesco: number;
  Ocupacion: number;    // ID_Ocupacion
  EstadoCivil: number;  // ID_EstadoCivil
  Direccion: Partial<Direccion>;
}

const initialState: TutorFormData = {
  Nombre: '', 
  Apellido: '', 
  No_Cedula: '', 
  No_Telefono: '',
  ID_Parentesco: 0, 
  Ocupacion: 0, 
  EstadoCivil: 0,
  // Ajustado a la interfaz Direccion de tu types/index.ts
  Direccion: { Pais: '', Barrio: '', Calle: '', ID_Municipio: 0 }
};

export function useTutores() {
  const [tutores, setTutores] = useState<TutorCompleto[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  
  // Catálogos fuertemente tipados
  const [ocupaciones, setOcupaciones] = useState<Ocupacion[]>([]);
  const [estadosCiviles, setEstadosCiviles] = useState<EstadoCivil[]>([]);
  const [parentescos, setParentescos] = useState<Parentesco[]>([]);

  // Estado de Edición
  const [tutorSeleccionado, setTutorSeleccionado] = useState<TutorCompleto | null>(null);
  const [formData, setFormData] = useState<TutorFormData>(initialState);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [dataTutores, dataCatalogos] = await Promise.all([
        api.tutores.getAll(),
        api.general.catalogos()
      ]);
      
      // Casteo seguro de los tutores
      setTutores(dataTutores as TutorCompleto[]);
      
      // Puente seguro con unknown para extraer los catálogos sin error de firmas
      const catalogos = dataCatalogos as unknown as { 
        ocupaciones?: Ocupacion[];
        estadosCiviles?: EstadoCivil[];
        parentescos?: Parentesco[];
      };
      
      setOcupaciones(catalogos.ocupaciones || []);
      setEstadosCiviles(catalogos.estadosCiviles || []);
      setParentescos(catalogos.parentescos || []);
      
    } catch (error: unknown) {
      console.error(error);
      toast.error("Error al cargar la lista de tutores");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Lógica de Filtrado Memoizada
  const tutoresFiltrados = useMemo(() => {
    if (!busqueda.trim()) return tutores;

    return tutores.filter(t => {
      const busquedaLower = busqueda.toLowerCase().trim();
      const nombreCompleto = `${t.Nombre} ${t.Apellido}`.toLowerCase();
      // Protección contra tutores antiguos sin cédula
      const cedula = t.No_Cedula?.toLowerCase() || '';
      
      return nombreCompleto.includes(busquedaLower) || cedula.includes(busquedaLower);
    });
  }, [tutores, busqueda]);

  // Preparar datos para edición
  const prepareEdit = (tutor: TutorCompleto) => {
    setTutorSeleccionado(tutor);
    setFormData({
      Nombre: tutor.Nombre,
      Apellido: tutor.Apellido,
      No_Cedula: tutor.No_Cedula || '',
      No_Telefono: tutor.No_Telefono || '',
      ID_Parentesco: tutor.ID_Parentesco || 0,
      Ocupacion: tutor.Ocupacion || 0,
      EstadoCivil: tutor.EstadoCivil || 0,
      // Usamos el fallback a initialState si la dirección viene nula
      Direccion: tutor.Direccion || initialState.Direccion
    });
  };

  // Guardar cambios con manejo de errores de Zod
  const saveTutor = async () => {
    if (!tutorSeleccionado) return false;
    
    try {
      await api.tutores.update(tutorSeleccionado.ID_Tutor, formData);
      toast.success("Tutor actualizado exitosamente");
      await loadData();
      return true; // Retornamos éxito para poder cerrar el modal
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Error al actualizar tutor";
      toast.error(msg);
      return false; // Retornamos falso para mantener el modal abierto si hay errores
    }
  };

  return {
    tutores: tutoresFiltrados,
    loading,
    busqueda, setBusqueda,
    catalogos: { ocupaciones, estadosCiviles, parentescos },
    formData, setFormData,
    tutorSeleccionado,
    prepareEdit,
    saveTutor
  };
}