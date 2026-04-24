import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { api } from '../services/api';

// CONFIGURACIÓN MAESTRA DE CATÁLOGOS
// Aquí definimos cómo se llaman los campos en la Base de Datos para cada tabla
export const CATALOGOS_CONFIG = [
  { label: 'Ocupaciones', key: 'ocupacion', idField: 'ID_Ocupacion', nameField: 'NombreDeOcupacion' },
  { label: 'Estados Civiles', key: 'estadocivil', idField: 'ID_EstadoCivil', nameField: 'NombreEstadoCivil' },
  { label: 'Parentescos', key: 'parentesco', idField: 'ID_Parentesco', nameField: 'NombreDeParentesco' },
  { label: 'Especialidades', key: 'especialidad', idField: 'ID_Especialidad', nameField: 'NombreEspecialidad' },
  { label: 'Exploraciones', key: 'exploracion', idField: 'ID_ExploracionPsicologica', nameField: 'NombreDeExploracionPsicologica' },
  { label: 'Tipos Terapia', key: 'terapia', idField: 'ID_TipoTerapia', nameField: 'NombreDeTerapia' },
  { label: 'Vías Admin.', key: 'via', idField: 'ID_ViaAdministracion', nameField: 'NombreDePresentacion' },
  { label: 'Métodos Pago', key: 'metodo', idField: 'ID_MetodoPago', nameField: 'NombreMetodo' },
  { label: 'Motivos Cancelación', key: 'motivo', idField: 'ID_Motivo', nameField: 'Categoria' } // <--- NUEVO
];

export const useConfiguracion = () => {
  const [activeTab, setActiveTab] = useState(CATALOGOS_CONFIG[0]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Estado del Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [inputValue, setInputValue] = useState('');

  const loadItems = async () => {
    setLoading(true);
    try {
      const data = await api.config.getAll(activeTab.key);
      setItems(data);
    } catch (error) {
      console.error(error);
      toast.error(`Error cargando ${activeTab.label}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, [activeTab]);

  const openModal = (item?: any) => {
    if (item) {
      setEditItem(item);
      setInputValue(item[activeTab.nameField]);
    } else {
      setEditItem(null);
      setInputValue('');
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditItem(null);
    setInputValue('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    try {
      if (editItem) {
        await api.config.update(activeTab.key, editItem[activeTab.idField], inputValue);
        toast.success('Actualizado correctamente');
      } else {
        await api.config.create(activeTab.key, inputValue);
        toast.success('Creado correctamente');
      }
      closeModal();
      loadItems();
    } catch (error) {
      toast.error('Error al guardar');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Estás seguro de eliminar este registro?')) return;
    try {
      await api.config.delete(activeTab.key, id);
      toast.success('Eliminado correctamente');
      loadItems();
    } catch (error: any) {
      // Aquí capturamos el error de validación del backend (FK constraint)
      const msg = error.response?.data?.error || 'Error al eliminar';
      toast.error(msg);
    }
  };

  return {
    activeTab, setActiveTab,
    items, loading,
    modalOpen, closeModal,
    inputValue, setInputValue, editItem,
    openModal, handleSave, handleDelete
  };
};