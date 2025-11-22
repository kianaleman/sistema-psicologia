import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { toast } from 'sonner';

// Exportamos la configuración para usarla en el hook y en la vista si es necesario
export const CATALOGOS_CONFIG = [
  { key: 'ocupacion', label: 'Ocupaciones', idField: 'ID_Ocupacion', nameField: 'NombreDeOcupacion' },
  { key: 'estadocivil', label: 'Estado Civil', idField: 'ID_EstadoCivil', nameField: 'NombreEstadoCivil' },
  { key: 'parentesco', label: 'Parentescos', idField: 'ID_Parentesco', nameField: 'NombreDeParentesco' },
  { key: 'especialidad', label: 'Especialidades (Psic)', idField: 'ID_Especialidad', nameField: 'NombreEspecialidad' },
  { key: 'exploracion', label: 'Exploraciones (Tests)', idField: 'ID_ExploracionPsicologica', nameField: 'NombreDeExploracionPsicologica' },
  { key: 'terapia', label: 'Tipos de Terapia', idField: 'ID_TipoTerapia', nameField: 'NombreDeTerapia' },
  { key: 'via', label: 'Vías Admin. (Med)', idField: 'ID_ViaAdministracion', nameField: 'NombreDePresentacion' },
  { key: 'metodo', label: 'Métodos de Pago', idField: 'ID_MetodoPago', nameField: 'NombreMetodo' },
];

export function useConfiguracion() {
  const [activeTab, setActiveTab] = useState(CATALOGOS_CONFIG[0]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para el modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    loadItems();
  }, [activeTab]);

  const loadItems = async () => {
    setLoading(true);
    try {
      const data = await api.config.getAll(activeTab.key);
      setItems(data);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar el catálogo.");
    } finally {
      setLoading(false);
    }
  };

  // Acciones del Modal
  const openModal = (item?: any) => {
    setEditItem(item || null);
    setInputValue(item ? item[activeTab.nameField] : '');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditItem(null);
    setInputValue('');
  };

  // Acciones CRUD
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return toast.warning("El nombre no puede estar vacío");

    const promise = new Promise(async (resolve, reject) => {
      try {
        if (editItem) {
          await api.config.update(activeTab.key, editItem[activeTab.idField], inputValue);
        } else {
          await api.config.create(activeTab.key, inputValue);
        }
        closeModal();
        loadItems();
        resolve(true);
      } catch (e: any) {
        reject(e.message || 'Error desconocido');
      }
    });

    toast.promise(promise, {
      loading: 'Guardando...',
      success: `Registro ${editItem ? 'actualizado' : 'creado'} correctamente`,
      error: (err) => `Error: ${err}`
    });
  };

  const handleDelete = (id: number) => {
    toast(`¿Seguro que deseas eliminar este registro de ${activeTab.label}?`, {
      description: "Si está siendo usado, no se podrá borrar.",
      action: {
        label: "Eliminar",
        onClick: async () => {
          try {
            await api.config.delete(activeTab.key, id);
            toast.success("Registro eliminado");
            loadItems();
          } catch (e: any) {
            toast.error("Error al eliminar: " + e.message);
          }
        }
      },
      cancel: { label: "Cancelar" }
    });
  };

  return {
    activeTab,
    setActiveTab,
    items,
    loading,
    modalOpen,
    inputValue,
    setInputValue,
    editItem,
    openModal,
    closeModal,
    handleSave,
    handleDelete
  };
}