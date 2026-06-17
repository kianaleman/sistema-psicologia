import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { api } from '../services/api';

// Definimos interfaces estrictas para la configuración
export interface CatalogoConfig {
  label: string;
  key: string;
  idField: string;
  nameField: string;
}

// Tipo genérico para los items de los catálogos en lugar de usar 'any'
export type ConfigItem = Record<string, string | number>;

// CONFIGURACIÓN MAESTRA DE CATÁLOGOS
// Sincronizada milimétricamente con el nuevo esquema de Prisma y types/index.ts
export const CATALOGOS_CONFIG: CatalogoConfig[] = [
  { label: 'Ocupaciones', key: 'ocupacion', idField: 'ID_Ocupacion', nameField: 'Nombre_DeOcupacion' },
  { label: 'Estados Civiles', key: 'estadocivil', idField: 'ID_EstadoCivil', nameField: 'Nombre_EstadoCivil' },
  { label: 'Parentescos', key: 'parentesco', idField: 'ID_Parentesco', nameField: 'Nombre_De_Parentesco' },
  { label: 'Especialidades', key: 'especialidad', idField: 'ID_Especialidad', nameField: 'Nombre_Especialidad' },
  { label: 'Exploraciones', key: 'exploracion', idField: 'ID_ExploracionPsicologica', nameField: 'Nombre_De_ExploracionPsicologica' },
  { label: 'Tipos Terapia', key: 'terapia', idField: 'ID_Tipo_Terapia', nameField: 'Nombre_De_Terapia' },
  { label: 'Vías Admin.', key: 'via', idField: 'ID_ViaAdministracion', nameField: 'Nombre_De_Presentacion' },
  { label: 'Métodos Pago', key: 'metodo', idField: 'ID_Metodo_Pago', nameField: 'Nombre_Metodo' },
  { label: 'Motivos Cancelación', key: 'motivo', idField: 'ID_MotivoCancelacion', nameField: 'Motivo' } 
];

export const useConfiguracion = () => {
  const [activeTab, setActiveTab] = useState<CatalogoConfig>(CATALOGOS_CONFIG[0]);
  const [items, setItems] = useState<ConfigItem[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Estado del Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<ConfigItem | null>(null);
  const [inputValue, setInputValue] = useState('');

  // Utilizamos useCallback para evitar re-renderizados innecesarios según las reglas de ESLint
  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      // Casteamos el resultado a nuestro tipo estructurado
      const data = await api.config.getAll(activeTab.key) as ConfigItem[];
      setItems(data);
    } catch (error) {
      console.error(error);
      toast.error(`Error cargando ${activeTab.label}`);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const openModal = (item?: ConfigItem) => {
    if (item) {
      setEditItem(item);
      // Extraemos el valor dinámico y lo convertimos a string de manera segura
      setInputValue(String(item[activeTab.nameField] || ''));
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
        // Aseguramos que el ID se envíe como número
        const id = Number(editItem[activeTab.idField]);
        await api.config.update(activeTab.key, id, inputValue);
        toast.success('Actualizado correctamente');
      } else {
        await api.config.create(activeTab.key, inputValue);
        toast.success('Creado correctamente');
      }
      closeModal();
      loadItems();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al guardar';
      toast.error(msg);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Estás seguro de eliminar este registro?')) return;
    try {
      await api.config.delete(activeTab.key, id);
      toast.success('Eliminado correctamente');
      loadItems();
    } catch (error: unknown) {
      // Capturamos con precisión las respuestas de constraint de Foreign Key de Prisma
      const msg = error instanceof Error ? error.message : 'Error al eliminar';
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