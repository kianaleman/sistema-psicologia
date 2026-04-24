import { useState } from 'react';
import { toast } from 'sonner';
import { useTutores, type TutorCompleto } from '../hooks/useTutores';

import TutorFormModal from '../components/tutores/TutorFormModal';
import PacientesListModal from '../components/tutores/PacientesListModal';

// Iconos SVG Inline (consistente con otras vistas)
const Icons = {
  UserGroup: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M5.5 5.25a7.5 7.5 0 0113 0c.27.085.52.203.738.351A8.25 8.25 0 0012 2a8.25 8.25 0 00-7.738 3.601.75.75 0 01.738-.351zM12 18a6 6 0 100-12 6 6 0 000 12z" /><path d="M12 18a6 6 0 100-12 6 6 0 000 12zm0 0a6 6 0 100-12 6 6 0 000 12zM12 18a6 6 0 100-12 6 6 0 000 12zM12 18a6 6 0 100-12 6 6 0 000 12z" /></svg>,
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

  // Estados UI locales
  const [modalOpen, setModalOpen] = useState<'edit' | 'view' | null>(null);
  const [selectedTutor, setSelectedTutor] = useState<TutorCompleto | null>(null);

  const handleOpenEditar = (tutor: TutorCompleto) => {
    prepareEdit(tutor);
    setSelectedTutor(tutor);
    setModalOpen('edit');
  };

  const handleOpenPacientes = (tutor: TutorCompleto) => {
    setSelectedTutor(tutor);
    setModalOpen('view');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const promise = new Promise(async (resolve, reject) => {
      try {
        // La validación de cédula y FK ocurre en el hook/servicio
        await saveTutor();
        setModalOpen(null);
        resolve(true);
      } catch (e: any) { reject(e.message); }
    });

    toast.promise(promise, {
      loading: 'Actualizando...',
      success: 'Tutor actualizado correctamente',
      error: (e) => `Error: ${e}`
    });
  };

  return (
    <div className="p-8 animate-fade-in-up max-w-7xl mx-auto">
      {/* ENCABEZADO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight font-serif flex items-center gap-3">
            <span className="p-2 bg-slate-100 rounded-xl text-slate-600"><Icons.UserGroup /></span>
            Gestión de Tutores
          </h1>
          <p className="text-slate-500 mt-1 text-sm ml-12">
            Directorio de responsables y pacientes asociados (Menores)
          </p>
        </div>
        {/* Nota: La creación de tutores primariamente se hace desde PacienteFormModal */}
      </div>
      
      {/* BUSCADOR Y HERRAMIENTAS */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 mb-8">
        <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Icons.Search />
            </div>
            <input 
                type="text" 
                placeholder="Buscar tutor por nombre, apellido o cédula..."
                className="input input-bordered w-full pl-10 bg-slate-50 focus:bg-white shadow-sm transition-colors"
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
                <th className="py-4 pl-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre y Cédula</th>
                <th className="py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Contacto</th>
                <th className="py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Parentesco</th>
                <th className="py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Ocupación</th>
                <th className="py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Pacientes</th>
                <th className="py-4 pr-6 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-20"><span className="loading loading-spinner loading-lg text-primary"></span></td></tr>
              ) : tutores.map(tutor => (
                <tr key={tutor.ID_Tutor} className="hover:bg-slate-50 transition-colors group">
                  
                  {/* NOMBRE Y CÉDULA */}
                  <td className="pl-6">
                    <div className="font-bold text-slate-800 text-base">{tutor.Nombre} {tutor.Apellido}</div>
                    <div className="font-mono text-xs text-slate-500 mt-1 bg-slate-100 px-2 py-0.5 rounded w-fit">
                        {tutor.No_Cedula}
                    </div>
                  </td>
                  
                  {/* CONTACTO */}
                  <td>
                      <div className="text-sm font-medium text-slate-600">{tutor.No_Telefono}</div>
                      <div className="text-xs text-slate-400">{tutor.DireccionTutor?.Ciudad}</div>
                  </td>
                  
                  {/* PARENTESCO */}
                  <td>
                      <span className="badge badge-sm badge-outline text-slate-600 border-slate-300 bg-white">
                        {tutor.Parentesco?.NombreDeParentesco || 'N/A'}
                      </span>
                  </td>
                  
                  {/* OCUPACIÓN */}
                  <td>
                      <span className="text-sm text-slate-600">
                        {tutor.Ocupacion?.NombreDeOcupacion || 'N/A'}
                      </span>
                  </td>
                  
                  {/* PACIENTES A CARGO */}
                  <td className="text-center">
                    {tutor.PacienteMenor && tutor.PacienteMenor.length > 0 ? (
                      <button 
                          className="btn btn-xs btn-outline btn-info gap-1 text-blue-600 border-blue-200 hover:bg-blue-50" 
                          onClick={() => handleOpenPacientes(tutor)}
                      >
                          <Icons.Eye /> Ver ({tutor.PacienteMenor.length})
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Ninguno</span>
                    )}
                  </td>

                  {/* ACCIONES */}
                  <td className="pr-6 text-right">
                    <div className="flex justify-end opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button 
                            className="btn btn-sm btn-ghost text-slate-500 hover:text-blue-600 hover:bg-blue-50 tooltip" 
                            data-tip="Editar Datos de Tutor" 
                            onClick={() => handleOpenEditar(tutor)}
                        >
                            <Icons.Edit />
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && tutores.length === 0 && (
                <tr>
                    <td colSpan={6} className="text-center py-20">
                        <div className="flex flex-col items-center justify-center text-slate-400">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-12 h-12 mb-2 opacity-50"><path fillRule="evenodd" d="M7.5 7.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM11.5 7.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM14 7.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM2 6.5C2 5.672 2.672 5 3.5 5h13c.828 0 1.5.672 1.5 1.5v6.25c0 .828-.672 1.5-1.5 1.5h-2.197l-3.328 3.328a1.5 1.5 0 01-2.122 0l-3.328-3.328H3.5c-.828 0-1.5-.672-1.5-1.5v-6.25z" clipRule="evenodd" /></svg>
                            <p className="text-lg font-medium text-slate-600">No se encontraron Tutores</p>
                            <p className="text-sm mt-1">Intenta buscar por otro nombre o cédula</p>
                        </div>
                    </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODALES */}
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