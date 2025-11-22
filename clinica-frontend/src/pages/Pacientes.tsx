import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePacientes } from '../hooks/usePacientes';
import type { Paciente, CreatePacienteDTO } from '../types';
import PacienteFormModal from '../components/pacientes/PacienteFormModal';

export default function Pacientes() {
  const { pacientes, loading, filtros, setFiltro, catalogos, acciones } = usePacientes();
  const [selectedPaciente, setSelectedPaciente] = useState<Paciente | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openCreate = () => {
    setSelectedPaciente(null);
    setIsModalOpen(true);
  };

  const openEdit = (p: Paciente) => {
    setSelectedPaciente(p);
    setIsModalOpen(true);
  };

  // --- CORRECCIÓN CRÍTICA AQUÍ ---
  // Ahora devolvemos el resultado de la operación al Modal
  const handleSubmit = async (data: CreatePacienteDTO, isEdit: boolean) => {
    let success = false;
    
    if (isEdit && selectedPaciente) {
      success = await acciones.actualizarPaciente(selectedPaciente.ID_Paciente, data);
    } else {
      success = await acciones.crearPaciente(data);
    }
    
    // El hook 'acciones' ya maneja los toasts de éxito/error.
    // Solo cerramos el modal si la operación fue exitosa (success === true)
    if (success) {
        setIsModalOpen(false);
    }

    // Retornamos el valor para que el Modal sepa qué hacer (detener loading, etc.)
    return success;
  };

  return (
    <div className="p-6 animate-fade-in-up">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Expedientes</h1>
          <p className="text-slate-500">Directorio general de pacientes</p>
        </div>
        <button className="btn btn-primary shadow-lg text-white" onClick={openCreate}>
          + Nuevo Paciente
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 space-y-4">
        <input 
            type="text" 
            placeholder="Buscar por nombre, cédula o partida..." 
            className="input input-bordered w-full bg-slate-50 text-slate-800" 
            value={filtros.busqueda} 
            onChange={(e) => setFiltro('busqueda', e.target.value)} 
        />
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-2">
             <span className="text-xs font-bold text-slate-500 uppercase">Tipo:</span>
             <div className="join border border-slate-200 rounded-lg p-1 bg-slate-100">
               {['todos', 'adultos', 'menores'].map(t => (
                 <button key={t} className={`join-item btn btn-sm ${filtros.tipo === t ? 'btn-neutral' : 'btn-ghost'}`} onClick={() => setFiltro('tipo', t)}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
               ))}
             </div>
          </div>
          <div className="flex items-center gap-2">
             <span className="text-xs font-bold text-slate-500 uppercase">Estado:</span>
             <div className="join border border-slate-200 rounded-lg p-1 bg-slate-100">
               {['todos', 'activos', 'inactivos'].map(a => (
                 <button key={a} className={`join-item btn btn-sm ${filtros.actividad === a ? 'btn-neutral' : 'btn-ghost'}`} onClick={() => setFiltro('actividad', a)}>{a.charAt(0).toUpperCase() + a.slice(1)}</button>
               ))}
             </div>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="table w-full">
          <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs tracking-wider">
            <tr><th className="py-4">Nombre / Estado</th><th>Tipo</th><th>Info. Adicional</th><th>Acciones</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? <tr><td colSpan={4} className="text-center py-8"><span className="loading loading-spinner"></span></td></tr> : 
             pacientes.map(p => ( 
              <tr key={p.ID_Paciente} className="hover:bg-slate-50 transition-colors">
                <td>
                  <div className="font-bold text-slate-700">{p.Nombre} {p.Apellido}</div>
                  <span className={`badge badge-xs ${p.EstadoDeActividad?.NombreEstadoActividad === 'Activo' ? 'badge-success' : 'badge-error'} text-white`}>
                    {p.EstadoDeActividad?.NombreEstadoActividad}
                  </span>
                </td>
                <td>{p.PacienteAdulto ? <span className="badge bg-blue-100 text-blue-700">Adulto</span> : <span className="badge bg-amber-100 text-amber-700">Menor</span>}</td>
                <td className="text-sm text-slate-500">{p.PacienteAdulto ? `Cédula: ${p.PacienteAdulto.No_Cedula}` : `Tutor: ${p.PacienteMenor?.Tutor?.No_Cedula || 'N/A'}`}</td>
                <td className="space-x-1">
                  <Link to={`/pacientes/${p.ID_Paciente}`} className="btn btn-xs btn-outline btn-info">Expediente</Link>
                  <button className="btn btn-xs btn-outline" onClick={() => openEdit(p)}>Editar</button>
                </td>
              </tr>
            ))}
            {!loading && pacientes.length === 0 && <tr><td colSpan={4} className="text-center py-8 text-slate-400 italic">No se encontraron pacientes.</td></tr>}
          </tbody>
        </table>
      </div>

      <PacienteFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleSubmit} 
        pacienteEditar={selectedPaciente} 
        catalogos={catalogos} 
      />
    </div>
  );
}