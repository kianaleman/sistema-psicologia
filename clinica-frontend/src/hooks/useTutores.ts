import { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { toast } from 'sonner';
import type { Tutor } from '../types';

// Interface extendida para incluir datos anidados necesarios en esta vista
export interface TutorCompleto extends Tutor {
  No_Telefono: string;
  ID_Parentesco: number;
  ID_Ocupacion: number;
  ID_EstadoCivil: number;
  Ocupacion: { NombreDeOcupacion: string };
  DireccionTutor: { Departamento: string, Ciudad: string, Barrio: string, Calle: string };
  PacienteMenor: { 
    PartNacimiento: string; 
    GradoEscolar: string;
    Paciente: { Nombre: string, Apellido: string } 
  }[];
}

const initialState = {
  Nombre: '', Apellido: '', No_Cedula: '', No_Telefono: '',
  ID_Parentesco: 0, ID_Ocupacion: 0, ID_EstadoCivil: 0,
  DireccionTutor: { Departamento: '', Ciudad: '', Barrio: '', Calle: '' }
};

export function useTutores() {
  const [tutores, setTutores] = useState<TutorCompleto[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  
  // Catálogos
  const [ocupaciones, setOcupaciones] = useState<any[]>([]);
  const [estadosCiviles, setEstadosCiviles] = useState<any[]>([]);
  const [parentescos, setParentescos] = useState<any[]>([]);

  // Estado de Edición
  const [tutorSeleccionado, setTutorSeleccionado] = useState<TutorCompleto | null>(null);
  const [formData, setFormData] = useState<any>(initialState);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [dataTutores, dataCatalogos] = await Promise.all([
        api.tutores.getAll(),
        api.general.catalogos()
      ]);
      // @ts-ignore
      setTutores(dataTutores);
      setOcupaciones(dataCatalogos.ocupaciones);
      setEstadosCiviles(dataCatalogos.estadosCiviles);
      setParentescos(dataCatalogos.parentescos);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar la lista de tutores");
    } finally {
      setLoading(false);
    }
  };

  // Lógica de Filtrado Memoizada
  const tutoresFiltrados = useMemo(() => {
    return tutores.filter(t => {
      const busquedaLower = busqueda.toLowerCase();
      const nombreCompleto = `${t.Nombre} ${t.Apellido}`.toLowerCase();
      return nombreCompleto.includes(busquedaLower) || t.No_Cedula.includes(busquedaLower);
    });
  }, [tutores, busqueda]);

  // Preparar datos para edición
  const prepareEdit = (tutor: TutorCompleto) => {
    setTutorSeleccionado(tutor);
    setFormData({
      Nombre: tutor.Nombre,
      Apellido: tutor.Apellido,
      No_Cedula: tutor.No_Cedula,
      No_Telefono: tutor.No_Telefono,
      ID_Parentesco: tutor.ID_Parentesco,
      ID_Ocupacion: tutor.ID_Ocupacion,
      ID_EstadoCivil: tutor.ID_EstadoCivil,
      DireccionTutor: tutor.DireccionTutor || initialState.DireccionTutor
    });
  };

  // Guardar cambios
  const saveTutor = async () => {
    if (!tutorSeleccionado) return;
    await api.tutores.update(tutorSeleccionado.ID_Tutor, formData);
    await loadData();
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