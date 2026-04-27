import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { api } from '../services/api';

// 🟢 CONFIGURACIÓN CORREGIDA SEGÚN SU SCHEMA.PRISMA
export const CATALOGOS_CONFIG = [
  { 
    label: 'Ocupaciones', 
    key: 'ocupacion', 
    idField: 'ID_Ocupacion', 
    nameField: 'Nombre_DeOcupacion' 
  },
  { 
    label: 'Estados Civiles', 
    key: 'estadocivil', 
    idField: 'ID_EstadoCivil', 
    nameField: 'Nombre_EstadoCivil' 
  },
  { 
    label: 'Parentescos', 
    key: 'parentesco', 
    idField: 'ID_Parentesco', 
    nameField: 'Nombre_De_Parentesco' 
  },
  { 
    label: 'Especialidades', 
    key: 'especialidad', 
    idField: 'ID_Especialidad', 
    nameField: 'Nombre_Especialidad' // 🟢 Corregido (antes NombreEspecialidad)
  },
  { 
    label: 'Exploraciones', 
    key: 'exploracion', 
    idField: 'ID_ExploracionPsicologica', 
    nameField: 'Nombre_De_ExploracionPsicologica' // 🟢 Corregido
  },
  { 
    label: 'Tipos Terapia', 
    key: 'terapia', 
    idField: 'ID_Tipo_Terapia', // 🟢 Corregido (agregado guion bajo)
    nameField: 'Nombre_De_Terapia' // 🟢 Corregido
  },
  { 
    label: 'Vías Admin.', 
    key: 'via', 
    idField: 'ID_ViaAdministracion', 
    nameField: 'Nombre_De_Presentacion' // 🟢 Corregido
  },
  { 
    label: 'Métodos Pago', 
    key: 'metodo', 
    idField: 'ID_Metodo_Pago', // 🟢 Corregido
    nameField: 'Nombre_Metodo' // 🟢 Corregido
  },
  { 
    label: 'Motivos Cancelación', 
    key: 'motivo', 
    idField: 'ID_MotivoCancelacion', 
    nameField: 'Motivo' 
  } 
];

export const useConfiguracion = () => {
  const [activeTab, setActiveTab] = useState(CATALOGOS_CONFIG[0]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
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
        const id = editItem[activeTab.idField];
        // 🟢 IMPORTANTE: Enviamos el objeto con la llave dinámica que espera el Backend
        const payload = { [activeTab.nameField]: inputValue };
        await api.config.update(activeTab.key, id, payload);
        toast.success(`${activeTab.label} actualizado`);
      } else {
        const payload = { [activeTab.nameField]: inputValue };
        await api.config.create(activeTab.key, payload);
        toast.success(`${activeTab.label} creado`);
      }
      closeModal();
      loadItems();
    } catch (error: any) {
      const msg = error.response?.data?.error || 'Error al guardar';
      toast.error(msg);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(`¿Estás seguro de eliminar este registro de ${activeTab.label}?`)) return;
    try {
      await api.config.delete(activeTab.key, id);
      toast.success('Eliminado correctamente');
      loadItems();
    } catch (error: any) {
      const msg = error.response?.data?.error || 'No se puede eliminar porque está en uso';
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