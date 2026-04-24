import { useState } from 'react';
import { toast } from 'sonner';
import { usePsicologos, type PsicologoCompleto } from '../hooks/usePsicologos';
import PsicologoFormModal from '../components/psicologos/PsicologoFormModal';

// Iconos SVG Inline (consistente con otras vistas)
const Icons = {
  Plus: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>,
  Search: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-slate-400"><path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" /></svg>,
  Doctor: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v3.5h3.5a.75.75 0 010 1.5h-3.5v3.5a.75.75 0 01-1.5 0v-3.5h-3.5a.75.75 0 010-1.5h3.5v-3.5A.75.75 0 0110 5z" clipRule="evenodd" /></svg>,
  Edit: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" /><path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" /></svg>
};

export default function Psicologos() {
  const {
    psicologos, loading,
    busqueda, setBusqueda,
    filtroActividad, setFiltroActividad,
    catalogos, acciones
  } = usePsicologos();

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPsicologo, setSelectedPsicologo] = useState<PsicologoCompleto | null>(null);

  const handleOpenNuevo = () => {
    setSelectedPsicologo(null);
    setModalOpen(true);
  };

  const handleOpenEditar = (p: PsicologoCompleto) => {
    setSelectedPsicologo(p);
    setModalOpen(true);
  };

  const handleSubmit = async (data: any, isEdit: boolean) => {
    // La funcionalidad de toast.promise se mantiene en el hook
    const promise = isEdit 
      ? acciones.actualizarPsicologo(selectedPsicologo!.ID_Psicologo, data)
      : acciones.crearPsicologo(data);
    
    // Aquí el modal se cierra justo antes del toast.promise según el código original
    setModalOpen(false); 

    toast.promise(promise, {
      loading: 'Guardando...',
      success: `Psicólogo ${isEdit ? 'actualizado' : 'registrado'} correctamente`,
      error: (e) => `Error: ${e}` // El hook debería manejar la extracción del mensaje específico
    });

    // Nota: Si quieres que el modal NO se cierre en caso de error, 
    // debes modificar la acción en el hook para devolver un booleano (true/false) 
    // y usar el patrón 'await handleSubmit' con setModalOpen(false) dentro de un if(success).
  };

  return (
    <div className="p-8 animate-fade-in-up max-w-7xl mx-auto">
      {/* ENCABEZADO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight font-serif flex items-center gap-3">
            <span className="p-2 bg-slate-100 rounded-xl text-slate-600"><Icons.Doctor /></span>
            Gestión de Psicólogos
          </h1>
          <p className="text-slate-500 mt-1 text-sm ml-12">
            Directorio y administración de profesionales de la clínica
          </p>
        </div>
        <button className="btn btn-primary shadow-lg text-white gap-2 rounded-xl px-6" onClick={handleOpenNuevo}>
          <Icons.Plus />
          Nuevo Psicólogo
        </button>
      </div>

      {/* FILTROS / PANEL DE CONTROL */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 mb-8">
        <div className="flex flex-col lg:flex-row gap-6 items-end">
            
            {/* Buscador */}
            <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Icons.Search />
                </div>
                <input 
                    type="text" 
                    placeholder="Buscar por nombre, Código MINSA o Email..." 
                    className="input input-bordered w-full pl-10 bg-slate-50 focus:bg-white transition-colors" 
                    value={busqueda} 
                    onChange={(e) => setBusqueda(e.target.value)} 
                />
            </div>

            {/* Filtro Estado */}
            <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs font-bold text-slate-500 uppercase">Estado:</span>
                <div className="join border border-slate-200 rounded-lg p-1 bg-slate-100">
                  {['todos', 'activos', 'inactivos'].map((est) => (
                    <button 
                      key={est}
                      className={`join-item btn btn-sm border-none capitalize font-medium px-4 ${filtroActividad === est ? 'bg-white text-slate-900 shadow-sm' : 'bg-transparent text-slate-500 hover:text-slate-700'}`} 
                      onClick={() => setFiltroActividad(est as any)}>
                      {est}
                    </button>
                  ))}
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
                <th className="py-4 pl-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre / Estado</th>
                <th className="py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Identificación</th>
                <th className="py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Contacto</th>
                <th className="py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Especialidades</th>
                <th className="py-4 pr-6 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-20"><span className="loading loading-spinner loading-lg text-primary"></span></td></tr>
              ) : psicologos.map(p => (
                <tr key={p.ID_Psicologo} className="hover:bg-slate-50 transition-colors group">
                  <td className="pl-6">
                    <div className="flex flex-col">
                        <div className="font-bold text-slate-800 text-sm">Dr. {p.Nombre} {p.Apellido}</div>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`w-2 h-2 rounded-full ${p.EstadoDeActividad?.NombreEstadoActividad === 'Activo' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                            <span className="text-xs text-slate-500 font-medium">
                                {p.EstadoDeActividad?.NombreEstadoActividad}
                            </span>
                        </div>
                    </div>
                  </td>
                  <td>
                    <div className="text-sm font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded text-xs w-fit">
                        {p.CodigoDeMinsa}
                    </div>
                  </td>
                  <td>
                    <div className="text-sm text-slate-600 font-medium">{p.No_Telefono}</div>
                    <div className="text-xs text-blue-500 italic truncate max-w-48">{p.Email}</div>
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {p.Psicologo_EspecialidadPsicologo.map(esp => (
                        <span key={esp.EspecialidadPsicologo.ID_Especialidad} className="badge badge-sm bg-blue-50 text-blue-700 border border-blue-100">
                          {esp.EspecialidadPsicologo.NombreEspecialidad}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="text-right pr-6">
                    <div className="flex justify-end opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button className="btn btn-sm btn-ghost text-slate-500 hover:text-blue-600 hover:bg-blue-50 tooltip" data-tip="Editar Datos" onClick={() => handleOpenEditar(p)}>
                            <Icons.Edit />
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && psicologos.length === 0 && (
                <tr><td colSpan={5} className="text-center py-20 text-slate-400 italic">No se encontraron resultados para los filtros aplicados.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL COMPONETIZADO */}
      <PsicologoFormModal 
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        psicologoEditar={selectedPsicologo}
        catalogos={catalogos}
      />
    </div>
  );
}