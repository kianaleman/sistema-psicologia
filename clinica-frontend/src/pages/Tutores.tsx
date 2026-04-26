import { useState } from 'react';
import { toast } from 'sonner';
import { useTutores } from '../hooks/useTutores';
import type { Tutor } from '../types';

import TutorFormModal from '../components/tutores/TutorFormModal';
import PacientesListModal from '../components/tutores/PacientesListModal';

const Icons = {
  UserGroup: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M5.5 5.25a7.5 7.5 0 0113 0c.27.085.52.203.738.351A8.25 8.25 0 0012 2a8.25 8.25 0 00-7.738 3.601.75.75 0 01.738-.351zM12 18a6 6 0 100-12 6 6 0 000 12z" /></svg>,
  Search: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-slate-400"><path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" /></svg>,
  Edit: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" /><path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" /></svg>,
  Eye: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" /><path fillRule="evenodd" d="M.328 10.05a.75.75 0 010-.1l3.52-3.834A7.5 7.5 0 0110 3.75c2.793 0 5.373 1.226 7.828 4.465l1.644 2.134a.25.25 0 010 .385l-1.644 2.134A7.5 7.5 0 0110 16.25c-2.793 0-5.373-1.226-7.828-4.465l-1.644-2.134a.25.25 0 010-.385zM10 14a4 4 0 100-8 4 4 0 000 8z" clipRule="evenodd" /></svg>
};

export default function Tutores() {
  const {
    tutores, loading,
    busqueda, setBusqueda,
    catalogos,
    formData, setFormData,
    prepareEdit, saveTutor
  } = useTutores();

  const [modalOpen, setModalOpen] = useState<'edit' | 'view' | null>(null);
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);

  const handleOpenEditar = (tutor: Tutor) => {
    prepareEdit(tutor);
    setSelectedTutor(tutor);
    setModalOpen('edit');
  };

  const handleOpenPacientes = (tutor: Tutor) => {
    setSelectedTutor(tutor);
    setModalOpen('view');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const promise = saveTutor().then(() => setModalOpen(null));

    toast.promise(promise, {
      loading: 'Sincronizando cambios...',
      success: 'Datos del responsable actualizados',
      error: (err) => `Fallo: ${err.message || err}`
    });
  };

  return (
    <div className="p-8 animate-fade-in-up max-w-7xl mx-auto">
      {/* ENCABEZADO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight font-serif flex items-center gap-3">
            <span className="p-2 bg-slate-800 rounded-xl text-white shadow-lg"><Icons.UserGroup /></span>
            Gestión de Tutores
          </h1>
          <p className="text-slate-500 mt-2 text-sm ml-14">
            Directorio de responsables asociados a pacientes menores
          </p>
        </div>
      </div>
      
      {/* BUSCADOR */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8">
        <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Icons.Search /></div>
            <input 
                type="text" 
                placeholder="Buscar por nombre, apellido o número de cédula..."
                className="input input-bordered w-full pl-10 bg-slate-50 focus:bg-white border-slate-200"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
            />
        </div>
      </div>

      {/* TABLA */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="py-5 pl-8 text-[10px] font-black text-slate-500 uppercase tracking-widest">Responsable</th>
                <th className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Contacto</th>
                <th className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ocupación / Estado</th>
                <th className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Menores a Cargo</th>
                <th className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-right pr-8">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-24"><span className="loading loading-spinner loading-lg text-slate-800"></span></td></tr>
              ) : tutores.map((tutor: any) => {
                // 🟢 Sincronización con Relación N:M
                const pacientesAsociados = tutor.Tutor_PacienteMenor || [];
                
                return (
                  <tr key={tutor.ID_Tutor} className="hover:bg-slate-50 transition-all group">
                    <td className="pl-8 py-5">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 text-sm">{tutor.Nombre} {tutor.Apellido}</span>
                        <span className="text-[11px] font-mono text-slate-500 mt-1 bg-slate-100 px-2 py-0.5 rounded w-fit">
                            {tutor.No_Cedula}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="text-xs text-slate-700 font-bold">{tutor.No_Telefono || 'Sin Teléfono'}</div>
                      <div className="text-[10px] text-slate-400 uppercase font-medium">{tutor.EstadoCivil_Tutor?.Nombre_EstadoCivil}</div>
                    </td>
                    <td>
                      <div className="text-xs text-slate-600">{tutor.Ocupacion_Tutor?.Nombre_DeOcupacion || '---'}</div>
                    </td>
                    <td className="text-center">
                      {pacientesAsociados.length > 0 ? (
                        <button 
                            className="btn btn-xs btn-outline btn-info gap-1 text-blue-600 border-blue-200 hover:bg-blue-50 px-3 rounded-lg" 
                            onClick={() => handleOpenPacientes(tutor)}
                        >
                            <Icons.Eye /> <span className="font-bold">Ver ({pacientesAsociados.length})</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-300 italic">Ningún menor asociado</span>
                      )}
                    </td>
                    <td className="pr-8 text-right">
                      <button 
                          className="btn btn-sm btn-ghost text-slate-400 hover:text-blue-600 hover:bg-blue-50" 
                          onClick={() => handleOpenEditar(tutor)}
                      >
                          <Icons.Edit />
                          <span className="hidden md:inline ml-1 text-[10px] font-bold uppercase">Editar</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!loading && tutores.length === 0 && (
                <tr><td colSpan={5} className="text-center py-20 text-slate-400 italic font-medium">No se encontraron tutores con los criterios de búsqueda.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <TutorFormModal 
        isOpen={modalOpen === 'edit'} 
        onClose={() => setModalOpen(null)} 
        onSubmit={handleSubmit} 
        formData={formData} 
        setFormData={setFormData} 
        catalogos={catalogos} 
      />

      <PacientesListModal 
        isOpen={modalOpen === 'view'} 
        onClose={() => setModalOpen(null)} 
        tutor={selectedTutor} 
      />
    </div>
  );
}