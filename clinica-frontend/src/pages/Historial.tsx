import { useHistorial } from '../hooks/useHistorial';

// Iconos SVG Inline
const Icons = {
  Search: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-slate-400"><path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" /></svg>,
  History: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" /></svg>,
  FileText: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm2.25 8.5a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zm0 3a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5z" clipRule="evenodd" /></svg>
};

export default function Historial() {
  const { registros, loading, busqueda, setBusqueda } = useHistorial();

  const formatearFecha = (fecha: string | null) => {
     if (!fecha) return "Fecha no disponible";
     const f = fecha.split('T')[0].split('-');
     const fechaObj = new Date(parseInt(f[0]), parseInt(f[1]) - 1, parseInt(f[2]));
     // Formato elegante: "24 Nov, 2025"
     return fechaObj.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="p-8 animate-fade-in-up max-w-7xl mx-auto">
      
      {/* ENCABEZADO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight font-serif flex items-center gap-3">
            <span className="p-2 bg-slate-100 rounded-xl text-slate-600"><Icons.History /></span>
            Historial Clínico
          </h1>
          <p className="text-slate-500 mt-1 text-sm ml-12">
            Registro completo de atenciones, diagnósticos y evolución
          </p>
        </div>
        
        <div className="relative w-full md:w-96 group">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
             <Icons.Search />
          </div>
          <input 
             type="text" 
             className="input input-bordered w-full pl-10 bg-white shadow-sm border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" 
             placeholder="Buscar por paciente o expediente..." 
             value={busqueda}
             onChange={e => setBusqueda(e.target.value)} 
          />
        </div>
      </div>

      {/* TABLA DE HISTORIAL */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-xs font-bold text-slate-500 uppercase tracking-wider py-4 pl-6">Fecha</th>
                <th className="text-xs font-bold text-slate-500 uppercase tracking-wider">Paciente / Expediente</th>
                <th className="text-xs font-bold text-slate-500 uppercase tracking-wider">Motivo Consulta</th>
                <th className="text-xs font-bold text-slate-500 uppercase tracking-wider">Diagnóstico</th>
                <th className="text-xs font-bold text-slate-500 uppercase tracking-wider">Especialista</th>
                <th className="text-xs font-bold text-slate-500 uppercase tracking-wider text-right pr-6">Detalle</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-20"><span className="loading loading-spinner loading-lg text-primary"></span></td></tr>
              ) : registros.map((reg) => (
                <tr key={reg.ID_Sesion} className="hover:bg-slate-50 transition-colors group">
                  
                  {/* FECHA (TIMELINE STYLE) */}
                  <td className="pl-6 py-4 whitespace-nowrap">
                      <div className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded inline-block">
                         {formatearFecha(reg.FechaReal)}
                      </div>
                  </td>

                  {/* PACIENTE */}
                  <td className="py-4">
                    <div className="flex flex-col">
                        <span className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors">
                            {reg.Paciente.Nombre} {reg.Paciente.Apellido}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                           <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                              EXP: {reg.Expediente?.No_Expediente || 'S/E'}
                           </span>
                           <span className="text-[10px] text-slate-400 uppercase tracking-wide">{reg.Paciente.Nacionalidad}</span>
                        </div>
                    </div>
                  </td>

                  {/* MOTIVO */}
                  <td className="py-4 max-w-xs">
                    <div className="flex flex-col gap-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 w-fit uppercase tracking-wide">
                           {reg.DatosCita.Tipo}
                        </span>
                        <span className="text-sm text-slate-600 truncate" title={reg.DatosCita.Motivo}>
                           {reg.DatosCita.Motivo}
                        </span>
                    </div>
                  </td>

                  {/* DIAGNÓSTICO */}
                  <td className="py-4 max-w-xs">
                    {reg.DiagnosticoDiferencial ? (
                        <p className="text-sm text-slate-700 truncate pl-2 border-l-2 border-emerald-400" title={reg.DiagnosticoDiferencial}>
                            {reg.DiagnosticoDiferencial}
                        </p>
                    ) : (
                        <span className="text-xs text-slate-400 italic">Pendiente</span>
                    )}
                  </td>

                  {/* ESPECIALISTA */}
                  <td className="py-4 whitespace-nowrap">
                      <div className="text-xs font-medium text-slate-500 flex items-center gap-1">
                          <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                              DR
                          </div>
                          {reg.Psicologo?.Apellido}
                      </div>
                  </td>

                  {/* ACCIÓN */}
                  <td className="py-4 text-right pr-6">
                    <button 
                        className="btn btn-sm btn-ghost text-slate-400 hover:text-blue-600 tooltip tooltip-left"
                        data-tip="Ver Nota Clínica"
                        onClick={() => (document.getElementById(`modal_nota_${reg.ID_Sesion}`) as HTMLDialogElement).showModal()}
                    >
                        <Icons.FileText />
                    </button>

                    {/* Modal embebido */}
                    <dialog id={`modal_nota_${reg.ID_Sesion}`} className="modal modal-bottom sm:modal-middle backdrop-blur-sm text-left">
                        <div className="modal-box bg-white p-0 rounded-2xl overflow-hidden">
                           <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                                <h3 className="font-bold text-lg text-slate-800">Nota Clínica</h3>
                                <form method="dialog"><button className="btn btn-sm btn-circle btn-ghost">✕</button></form>
                           </div>
                           <div className="p-6 max-h-[60vh] overflow-y-auto">
                               <div className="prose prose-sm max-w-none text-slate-600">
                                   <p className="whitespace-pre-wrap leading-relaxed">{reg.Observaciones || "Sin notas registradas."}</p>
                               </div>
                           </div>
                           <div className="bg-slate-50 px-6 py-3 flex justify-end border-t border-slate-100">
                              <form method="dialog">
                                 <button className="btn btn-primary btn-sm text-white px-6 shadow-lg">Cerrar</button>
                              </form>
                           </div>
                        </div>
                        <form method="dialog" className="modal-backdrop"><button>close</button></form>
                    </dialog>
                  </td>
                </tr>
              ))}

              {!loading && registros.length === 0 && (
                 <tr>
                    <td colSpan={6} className="text-center py-20">
                       <div className="flex flex-col items-center justify-center text-slate-400">
                           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mb-2 opacity-50"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                           <p className="text-lg font-medium text-slate-600">No se encontraron registros</p>
                           <p className="text-sm mt-1">Intenta buscar por otro término</p>
                       </div>
                    </td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}