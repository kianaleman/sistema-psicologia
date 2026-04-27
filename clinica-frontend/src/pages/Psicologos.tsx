import { useState } from 'react';
import { toast } from 'sonner';
// 🟢 Se importa PsicologoCompleto para un tipado profesional
import { usePsicologos, type PsicologoCompleto } from '../hooks/usePsicologos';
import PsicologoFormModal from '../components/psicologos/PsicologoFormModal';

const Icons = {
  Plus: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>,
  Search: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-slate-400"><path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" /></svg>,
  Doctor: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10 2a3 3 0 100 6 3 3 0 000-6zm-7 9a7 7 0 1114 0H3z" /></svg>,
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
  // 🟢 Tipado estricto con PsicologoCompleto en lugar de 'any'
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
    
    setModalOpen(false); 

    toast.promise(promise, {
      loading: 'Sincronizando con el servidor...',
      success: `Psicólogo ${isEdit ? 'actualizado' : 'registrado'} correctamente`,
      error: (e) => {
        const errorMsg = e.response?.data?.error || e.message || 'Ocurrió un fallo en el proceso';
        return `Error: ${errorMsg}`;
      }
    });
  };

  return (
    <div className="p-8 animate-fade-in-up max-w-7xl mx-auto">
      {/* ENCABEZADO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight font-serif flex items-center gap-3">
            <span className="p-2 bg-slate-800 rounded-xl text-white shadow-lg"><Icons.Doctor /></span>
            Directorio de Especialistas
          </h1>
          <p className="text-slate-500 mt-2 text-sm ml-14">
            Gestión de psicólogos activos y sus credenciales de acceso
          </p>
        </div>
        <button className="btn btn-primary shadow-xl text-white gap-2 rounded-xl px-8" onClick={handleOpenNuevo}>
          <Icons.Plus /> Registrar Especialista
        </button>
      </div>

      {/* FILTROS */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8">
        <div className="flex flex-col lg:flex-row gap-8 items-end">
            <div className="flex-1 relative w-full">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Búsqueda Avanzada</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Icons.Search /></div>
                    <input 
                        type="text" 
                        placeholder="Nombre, Código MINSA o Correo de Acceso..." 
                        className="input input-bordered w-full pl-10 bg-slate-50 focus:bg-white border-slate-200" 
                        value={busqueda} 
                        onChange={(e) => setBusqueda(e.target.value)} 
                    />
                </div>
            </div>

            <div className="flex flex-col gap-2 flex-shrink-0">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filtrar por Disponibilidad</span>
                <div className="join bg-slate-100 p-1 rounded-xl border border-slate-200">
                  {['todos', 'activos', 'inactivos'].map((est) => (
                    <button 
                      key={est}
                      className={`join-item btn btn-xs border-none capitalize px-6 ${filtroActividad === est ? 'bg-white text-slate-900 shadow-sm font-bold' : 'bg-transparent text-slate-500'}`} 
                      onClick={() => setFiltroActividad(est as any)}>
                      {est}
                    </button>
                  ))}
                </div>
            </div>
        </div>
      </div>

      {/* LISTADO */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="py-5 pl-8 text-[10px] font-black text-slate-500 uppercase tracking-widest">Especialista</th>
                <th className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Identificación Profesional</th>
                <th className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cuenta y Contacto</th>
                <th className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-right pr-8">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={4} className="text-center py-24"><span className="loading loading-spinner loading-lg text-slate-800"></span></td></tr>
              ) : psicologos.map((p) => (
                <tr key={p.ID_Psicologo} className="hover:bg-slate-50/80 transition-all group">
                  <td className="pl-8 py-5">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center font-bold text-xs shadow-md">
                            {p.Nombre[0]}{p.Apellido[0]}
                        </div>
                        <div className="flex flex-col">
                            <div className="font-bold text-slate-800 text-sm">Dr. {p.Nombre} {p.Apellido}</div>
                            <div className="flex items-center gap-1.5 mt-1">
                                <span className={`w-1.5 h-1.5 rounded-full ${p.Activo ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">
                                    {p.Activo ? 'En Servicio' : 'Inactivo'}
                                </span>
                            </div>
                        </div>
                    </div>
                  </td>
                  <td>
                    <div className="flex flex-col gap-1.5">
                        <span className="text-[11px] font-mono font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded w-fit">
                            MINSA: {p.CodigoMinsa || 'SIN REGISTRO'}
                        </span>
                    </div>
                  </td>
                  <td>
                    <div className="text-xs text-slate-700 font-bold">{p.No_Telefono}</div>
                    <div className="text-[11px] text-blue-500 font-medium hover:underline cursor-pointer">
                        {p.Usuario?.Email || 'Sin cuenta de acceso'}
                    </div>
                  </td>
                  <td className="text-right pr-8">
                    <button 
                      className="btn btn-sm btn-ghost text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                      onClick={() => handleOpenEditar(p)}
                    >
                      <Icons.Edit />
                      <span className="hidden md:inline ml-1 text-[10px] font-bold">Editar</span>
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && psicologos.length === 0 && (
                <tr><td colSpan={4} className="text-center py-20 text-slate-400 italic font-medium">No se encontraron especialistas registrados.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

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