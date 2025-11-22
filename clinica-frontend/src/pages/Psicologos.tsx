import { useState } from 'react';
import { toast } from 'sonner';
import { usePsicologos, type PsicologoCompleto } from '../hooks/usePsicologos';
import PsicologoFormModal from '../components/psicologos/PsicologoFormModal';

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
    const promise = isEdit 
      ? acciones.actualizarPsicologo(selectedPsicologo!.ID_Psicologo, data)
      : acciones.crearPsicologo(data);
    
    toast.promise(promise, {
      loading: 'Guardando...',
      success: `Psicólogo ${isEdit ? 'actualizado' : 'registrado'} correctamente`,
      error: (e) => `Error: ${e}`
    });
    setModalOpen(false);
  };

  return (
    <div className="p-6 animate-fade-in-up">
      {/* ENCABEZADO */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Gestión de Psicólogos</h1>
          <p className="text-slate-500">Directorio de profesionales de la clínica</p>
        </div>
        <button className="btn btn-primary shadow-lg text-white" onClick={handleOpenNuevo}>
          + Nuevo Psicólogo
        </button>
      </div>

      {/* FILTROS */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 space-y-4">
        <input 
          type="text" 
          placeholder="Buscar por nombre, apellido o Código MINSA..." 
          className="input input-bordered w-full bg-slate-50 text-slate-800 focus:border-blue-500" 
          value={busqueda} 
          onChange={(e) => setBusqueda(e.target.value)} 
        />
        <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Estado:</span>
            <div className="join border border-slate-200 rounded-lg p-1 bg-slate-100">
              {['todos', 'activos', 'inactivos'].map((est) => (
                <button 
                  key={est}
                  className={`join-item btn btn-sm ${filtroActividad === est ? 'btn-neutral' : 'btn-ghost'}`} 
                  onClick={() => setFiltroActividad(est as any)}>
                  {est.charAt(0).toUpperCase() + est.slice(1)}
                </button>
              ))}
            </div>
        </div>
      </div>

      {/* TABLA */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs">
              <tr>
                <th className="py-4 pl-6">Nombre / Estado</th>
                <th>Identificación</th>
                <th>Contacto</th>
                <th>Especialidades</th>
                <th className="text-right pr-6">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-8"><span className="loading loading-spinner loading-lg text-primary"></span></td></tr>
              ) : psicologos.map(p => (
                <tr key={p.ID_Psicologo} className="hover:bg-slate-50 transition-colors">
                  <td className="pl-6">
                    <div className="font-bold text-slate-700">{p.Nombre} {p.Apellido}</div>
                    <span className={`badge badge-xs ${p.EstadoDeActividad?.NombreEstadoActividad === 'Activo' ? 'badge-success' : 'badge-error'} text-white`}>
                      {p.EstadoDeActividad?.NombreEstadoActividad}
                    </span>
                  </td>
                  <td>
                    <span className="font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded text-xs">{p.CodigoDeMinsa}</span>
                  </td>
                  <td>
                    <div className="text-sm text-slate-600 font-medium">{p.No_Telefono}</div>
                    <div className="text-xs text-slate-400">{p.Email}</div>
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {p.Psicologo_EspecialidadPsicologo.map(esp => (
                        <span key={esp.EspecialidadPsicologo.ID_Especialidad} className="badge badge-outline badge-info badge-sm">
                          {esp.EspecialidadPsicologo.NombreEspecialidad}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="text-right pr-6">
                    <button className="btn btn-xs btn-outline" onClick={() => handleOpenEditar(p)}>Editar</button>
                  </td>
                </tr>
              ))}
              {!loading && psicologos.length === 0 && (
                 <tr><td colSpan={5} className="text-center py-8 text-slate-400 italic">No se encontraron resultados.</td></tr>
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