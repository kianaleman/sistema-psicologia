import { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { toast } from 'sonner';
import type { Tutor, Ocupacion, EstadoCivil, Parentesco } from '../types';

// Interfaz extendida para la vista de administración de tutores
export interface TutorCompleto extends Tutor {
  // Ajuste a la relación real de Prisma N:M
  Tutor_PacienteMenor?: {
    Parentesco: Parentesco;
    Paciente_Menor: {
      PartidaDeNacimiento: string;
      Grado_Escolar: string;
      Paciente: { Nombre: string; Apellido: string };
    };
  }[];
}

const initialState = {
  Nombre: '',
  Apellido: '',
  No_Cedula: '',
  No_Telefono: '',
  ID_Ocupacion: 0,
  ID_EstadoCivil: 0,
  // Nota: En el nuevo backend la dirección suele estar asociada al Paciente, 
  // pero si el Tutor tiene la propia, asegúrate que el campo sea ID_Direccion
};

export function useTutores() {
  const [tutores, setTutores] = useState<TutorCompleto[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  
  // Catálogos tipados
  const [ocupaciones, setOcupaciones] = useState<Ocupacion[]>([]);
  const [estadosCiviles, setEstadosCiviles] = useState<EstadoCivil[]>([]);
  const [parentescos, setParentescos] = useState<Parentesco[]>([]);

  const [tutorSeleccionado, setTutorSeleccionado] = useState<TutorCompleto | null>(null);
  const [formData, setFormData] = useState<any>(initialState);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [dataTutores, dataCatalogos] = await Promise.all([
        api.tutores.getAll(), // Asegúrate que en api.ts devuelva Tutor[]
        api.general.catalogos()
      ]);
      
      setTutores(dataTutores);
      setOcupaciones(dataCatalogos.ocupaciones || []);
      setEstadosCiviles(dataCatalogos.estadosCiviles || []);
      setParentescos(dataCatalogos.parentescos || []);
    } catch (error) {
      console.error("Error cargando tutores:", error);
      toast.error("Error al cargar la lista de tutores");
    } finally {
      setLoading(false);
    }
  };

  // Lógica de Filtrado (PascalCase)
  const tutoresFiltrados = useMemo(() => {
    return tutores.filter(t => {
      const busquedaLower = busqueda.toLowerCase().trim();
      const nombreCompleto = `${t.Nombre} ${t.Apellido}`.toLowerCase();
      const cedula = t.No_Cedula?.toLowerCase() || '';
      
      return nombreCompleto.includes(busquedaLower) || cedula.includes(busquedaLower);
    });
  }, [tutores, busqueda]);

  const prepareEdit = (tutor: TutorCompleto) => {
    setTutorSeleccionado(tutor);
    setFormData({
      Nombre: tutor.Nombre,
      Apellido: tutor.Apellido,
      No_Cedula: tutor.No_Cedula,
      No_Telefono: tutor.No_Telefono || '',
      ID_Ocupacion: tutor.Ocupacion_Tutor?.ID_Ocupacion || 0,
      ID_EstadoCivil: tutor.EstadoCivil_Tutor?.ID_EstadoCivil || 0
    });
  };

  const saveTutor = async () => {
    try {
      if (!tutorSeleccionado) return false;
      await api.tutores.update(tutorSeleccionado.ID_Tutor, formData);
      toast.success("Información del tutor actualizada");
      await loadData();
      return true;
    } catch (error) {
      toast.error("Error al guardar cambios");
      return false;
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