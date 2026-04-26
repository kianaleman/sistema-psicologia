import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { api } from '../services/api';

// CONFIGURACIÓN MAESTRA SINCRONIZADA CON PRISMA/SQL SERVER
export const CATALOGOS_CONFIG = [
  { label: 'Ocupaciones', key: 'ocupacion', idField: 'ID_Ocupacion', nameField: 'Nombre_DeOcupacion' },
  { label: 'Estados Civiles', key: 'estadocivil', idField: 'ID_EstadoCivil', nameField: 'Nombre_EstadoCivil' },
  { label: 'Parentescos', key: 'parentesco', idField: 'ID_Parentesco', nameField: 'Nombre_De_Parentesco' },
  { label: 'Especialidades', key: 'especialidad', idField: 'ID_Especialidad', nameField: 'NombreEspecialidad' },
  { label: 'Exploraciones', key: 'exploracion', idField: 'ID_ExploracionPsicologica', nameField: 'NombreDeExploracionPsicologica' },
  { label: 'Tipos Terapia', key: 'terapia', idField: 'ID_TipoTerapia', nameField: 'NombreDeTerapia' },
  { label: 'Vías Admin.', key: 'via', idField: 'ID_ViaAdministracion', nameField: 'NombreDePresentacion' },
  { label: 'Métodos Pago', key: 'metodo', idField: 'ID_MetodoPago', nameField: 'NombreMetodo' },
  // Corregido según la interfaz MotivoCancelacion del index.ts
  { label: 'Motivos Cancelación', key: 'motivo', idField: 'ID_MotivoCancelacion', nameField: 'Motivo' } 
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
      // api.config.getAll debe recibir el 'key' y retornar el array de objetos
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
        // Usamos el idField dinámico para extraer el ID correcto
        const id = editItem[activeTab.idField];
        await api.config.update(activeTab.key, id, inputValue);
        toast.success(`${activeTab.label} actualizado`);
      } else {
        await api.config.create(activeTab.key, inputValue);
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
      // Manejo de restricciones de integridad (ej: no puedes borrar una ocupación en uso)
      const msg = error.response?.data?.error || 'No se puede eliminar porque está en uso por otros registros';
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