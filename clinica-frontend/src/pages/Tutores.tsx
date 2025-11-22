import { useState } from 'react';
import { toast } from 'sonner';
import { useTutores, type TutorCompleto } from '../hooks/useTutores';

import TutorFormModal from '../components/tutores/TutorFormModal';
import PacientesListModal from '../components/tutores/PacientesListModal';

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
    <div className="p-6 animate-fade-in-up">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Gestión de Tutores</h1>
          <p className="text-slate-500">Directorio de responsables y pacientes asociados</p>
        </div>
      </div>
      
      <div className="mb-6">
        <input 
          type="text" 
          placeholder="Buscar tutor por nombre o cédula..."
          className="input input-bordered w-full bg-white shadow-sm text-slate-800 focus:border-blue-500"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs">
              <tr>
                <th className="py-4 pl-6">Nombre</th>
                <th>Cédula</th>
                <th>Contacto</th>
                <th>Ocupación</th>
                <th className="text-center">Pacientes a Cargo</th>
                <th className="pr-6">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? <tr><td colSpan={6} className="text-center py-8"><span className="loading loading-spinner"></span></td></tr> :
               tutores.map(tutor => (
                <tr key={tutor.ID_Tutor} className="hover:bg-slate-50 transition-colors">
                  <td className="pl-6"><div className="font-bold text-slate-700">{tutor.Nombre} {tutor.Apellido}</div></td>
                  <td><span className="font-mono text-slate-600">{tutor.No_Cedula}</span></td>
                  <td><span className="text-sm text-slate-500">{tutor.No_Telefono}</span></td>
                  <td><span className="badge badge-ghost badge-sm">{tutor.Ocupacion?.NombreDeOcupacion || 'N/A'}</span></td>
                  
                  <td className="text-center">
                    {tutor.PacienteMenor && tutor.PacienteMenor.length > 0 ? (
                      <button className="btn btn-xs btn-outline btn-info" onClick={() => handleOpenPacientes(tutor)}>Ver ({tutor.PacienteMenor.length})</button>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Aún no tiene</span>
                    )}
                  </td>

                  <td className="pr-6">
                    <button className="btn btn-xs btn-outline" onClick={() => handleOpenEditar(tutor)}>Editar</button>
                  </td>
                </tr>
              ))}
              {!loading && tutores.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-slate-400 italic">No se encontraron tutores.</td></tr>}
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