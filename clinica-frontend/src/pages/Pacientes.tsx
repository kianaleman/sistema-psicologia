import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePacientes } from '../hooks/usePacientes';
import type { Paciente, CreatePacienteDTO } from '../types';
import PacienteFormModal from '../components/pacientes/PacienteFormModal';

// Iconos SVG Inline
const Icons = {
  Plus: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>,
  Search: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-slate-400"><path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" /></svg>,
  Edit: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3"><path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" /><path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" /></svg>,
  Folder: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" /></svg>
};

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

  const handleSubmit = async (data: CreatePacienteDTO, isEdit: boolean) => {
    let success = false;
    if (isEdit && selectedPaciente) {
      success = await acciones.actualizarPaciente(selectedPaciente.ID_Paciente, data);
    } else {
      success = await acciones.crearPaciente(data);
    }
    if (success) {
        setIsModalOpen(false);
    }
    return success;
  };

  return (
    <div className="p-8 animate-fade-in-up max-w-7xl mx-auto">
      {/* ENCABEZADO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight font-serif">
            Expedientes Clínicos
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Directorio y gestión de pacientes registrados
          </p>
        </div>
        <button 
          className="btn btn-primary shadow-lg text-white gap-2 rounded-xl px-6" 
          onClick={openCreate}
        >
          <Icons.Plus />
          Nuevo Paciente
        </button>
      </div>

      {/* BARRA DE HERRAMIENTAS / FILTROS */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 mb-8">
        <div className="flex flex-col lg:flex-row gap-6">
            {/* Búsqueda Principal */}
            <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Icons.Search />
                </div>
                <input 
                    type="text" 
                    placeholder="Buscar por nombre, cédula o partida de nacimiento..." 
                    className="input input-bordered w-full pl-10 bg-slate-50 focus:bg-white transition-colors" 
                    value={filtros.busqueda} 
                    onChange={(e) => setFiltro('busqueda', e.target.value)} 
                />
            </div>
            
            {/* Filtros Secundarios */}
            <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex flex-col gap-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tipo de Paciente</span>
                    <div className="join bg-slate-100 p-1 rounded-lg border border-slate-200">
                        {['todos', 'adultos', 'menores'].map(t => (
                            <button 
                                key={t} 
                                className={`join-item btn btn-sm border-none capitalize font-medium px-4 ${filtros.tipo === t ? 'bg-white text-slate-900 shadow-sm' : 'bg-transparent text-slate-500 hover:text-slate-700'}`} 
                                onClick={() => setFiltro('tipo', t)}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estado</span>
                    <div className="join bg-slate-100 p-1 rounded-lg border border-slate-200">
                        {['todos', 'activos', 'inactivos'].map(a => (
                            <button 
                                key={a} 
                                className={`join-item btn btn-sm border-none capitalize font-medium px-4 ${filtros.actividad === a ? 'bg-white text-slate-900 shadow-sm' : 'bg-transparent text-slate-500 hover:text-slate-700'}`} 
                                onClick={() => setFiltro('actividad', a)}
                            >
                                {a}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* TABLA DE DATOS */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="table w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                    <th className="py-4 pl-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Paciente</th>
                    <th className="py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Categoría</th>
                    <th className="py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Identificación</th>
                    <th className="py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right pr-6">Acciones</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {loading ? (
                    <tr><td colSpan={4} className="text-center py-20"><span className="loading loading-spinner loading-lg text-primary"></span></td></tr>
                ) : pacientes.length > 0 ? (
                    pacientes.map(p => ( 
                    <tr key={p.ID_Paciente} className="hover:bg-slate-50 transition-colors group">
                        <td className="pl-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${p.PacienteAdulto ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                                    {p.Nombre.charAt(0)}{p.Apellido.charAt(0)}
                                </div>
                                <div>
                                    <div className="font-bold text-slate-800 text-base">{p.Nombre} {p.Apellido}</div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className={`w-2 h-2 rounded-full ${p.EstadoDeActividad?.NombreEstadoActividad === 'Activo' ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                                        <span className="text-xs text-slate-500 font-medium">{p.EstadoDeActividad?.NombreEstadoActividad}</span>
                                    </div>
                                </div>
                            </div>
                        </td>
                        <td className="py-4">
                            {p.PacienteAdulto ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                    Adulto
                                </span>
                            ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
                                    Menor
                                </span>
                            )}
                        </td>
                        <td className="py-4">
                            <div className="text-sm font-medium text-slate-600 font-mono">
                                {p.PacienteAdulto ? p.PacienteAdulto.No_Cedula : p.PacienteMenor?.Tutor?.No_Cedula || 'N/A'}
                            </div>
                            {!p.PacienteAdulto && (
                                <div className="text-xs text-slate-400 mt-0.5">
                                    Tutor: {p.PacienteMenor?.Tutor?.Nombre} {p.PacienteMenor?.Tutor?.Apellido}
                                </div>
                            )}
                        </td>
                        <td className="pr-6 py-4 text-right">
                            <div className="flex justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                <Link to={`/pacientes/${p.ID_Paciente}`} className="btn btn-sm btn-ghost text-blue-600 hover:bg-blue-50 tooltip" data-tip="Ver Expediente">
                                    <Icons.Folder />
                                </Link>
                                <button className="btn btn-sm btn-ghost text-slate-500 hover:bg-slate-100 tooltip" data-tip="Editar Datos" onClick={() => openEdit(p)}>
                                    <Icons.Edit />
                                </button>
                            </div>
                        </td>
                    </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan={4} className="text-center py-20">
                            <div className="flex flex-col items-center justify-center text-slate-400">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mb-2 opacity-50"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                                <p className="text-lg font-medium text-slate-600">No se encontraron pacientes</p>
                                <p className="text-sm mt-1">Intenta ajustar los filtros de búsqueda</p>
                            </div>
                        </td>
                    </tr>
                )}
            </tbody>
            </table>
        </div>
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