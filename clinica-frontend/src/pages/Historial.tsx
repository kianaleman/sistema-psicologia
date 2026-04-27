import { useHistorial } from '../hooks/useHistorial';
import type { Sesion } from '../types';

const Icons = {
  Search: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-slate-400"><path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" /></svg>,
  History: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" /></svg>,
  FileText: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm2.25 8.5a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zm0 3a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5z" clipRule="evenodd" /></svg>
};

export default function Historial() {
  const { registros, loading, busqueda, setBusqueda } = useHistorial();

  const formatearFecha = (fecha: string | null | undefined) => {
    if (!fecha) return "---";
    try {
      const fechaObj = new Date(fecha);
      return fechaObj.toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric',
        timeZone: 'UTC' 
      });
    } catch (e) { return "---"; }
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
            Registro completo de sesiones, diagnósticos y evolución de pacientes
          </p>
        </div>
        
        <div className="relative w-full md:w-96 group">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
             <Icons.Search />
          </div>
          <input 
             type="text" 
             className="input input-bordered w-full pl-10 bg-white shadow-sm border-slate-200 focus:border-blue-500 transition-all" 
             placeholder="Buscar por nombre o N° expediente..." 
             value={busqueda}
             onChange={e => setBusqueda(e.target.value)} 
          />
        </div>
      </div>

      {/* TABLA DE HISTORIAL */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-[10px] font-bold text-slate-500 uppercase py-4 pl-6 text-left">Fecha Sesión</th>
                <th className="text-[10px] font-bold text-slate-500 uppercase text-left">Paciente / Exp</th>
                <th className="text-[10px] font-bold text-slate-500 uppercase text-left">Tipo Servicio</th>
                <th className="text-[10px] font-bold text-slate-500 uppercase text-left">Diagnóstico / Evolución</th>
                <th className="text-[10px] font-bold text-slate-500 uppercase text-left">Especialista</th>
                <th className="text-[10px] font-bold text-slate-500 uppercase text-right pr-6">Acción</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-20"><span className="loading loading-spinner loading-lg text-primary"></span></td></tr>
              ) : registros.map((reg: Sesion) => {
                // 🟢 Lógica de rescate de datos: usamos el tipo Sesion correctamente
                const paciente = reg.Cita?.Paciente;
                const noExpediente = reg.Expediente?.No_Expediente || paciente?.Expediente?.No_Expediente || 'S/E';
                const psicologo = reg.Cita?.Psicologo;

                return (
                  <tr key={reg.ID_Sesion} className="hover:bg-slate-50 transition-colors group">
                    
                    {/* FECHA */}
                    <td className="pl-6 py-4">
                        <div className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded inline-block">
                           {formatearFecha(reg.Cita?.FechaCita || reg.HoraDeInicio)}
                        </div>
                    </td>

                    {/* PACIENTE */}
                    <td className="py-4">
                      <div className="flex flex-col">
                          <span className="font-bold text-slate-800 text-sm">
                              {paciente?.Nombre} {paciente?.Apellido}
                          </span>
                          <div className="flex items-center gap-2 mt-1">
                             <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 rounded border border-blue-100 uppercase">
                                EXP: {noExpediente}
                             </span>
                          </div>
                      </div>
                    </td>

                    {/* TIPO SERVICIO */}
                    <td className="py-4">
                      <div className="flex flex-col gap-1">
                          <span className="badge badge-sm badge-ghost text-[9px] font-bold uppercase py-2">
                             {reg.Cita?.TipoDeCita?.Nombre_DeCita || "Consulta"}
                          </span>
                      </div>
                    </td>

                    {/* DIAGNÓSTICO Y EVOLUCIÓN */}
                    <td className="py-4">
                      <div className="max-w-xs">
                          <p className="text-sm text-slate-700 font-bold truncate">
                              {reg.DiagnosticoDiferencial || 'Sin diagnóstico'}
                          </p>
                          <p className="text-[11px] text-slate-400 line-clamp-1 italic">
                              {reg.HistorialDeEvolucion || 'Sin registro de evolución'}
                          </p>
                      </div>
                    </td>

                    {/* ESPECIALISTA */}
                    <td className="py-4 whitespace-nowrap">
                        <div className="text-xs font-medium text-slate-500">
                            Dr. {psicologo?.Apellido || "---"}
                        </div>
                    </td>

                    {/* ACCIÓN */}
                    <td className="py-4 text-right pr-6">
                      <button 
                          className="btn btn-sm btn-ghost text-slate-400 hover:text-blue-600"
                          onClick={() => (document.getElementById(`modal_nota_${reg.ID_Sesion}`) as HTMLDialogElement).showModal()}
                      >
                          <Icons.FileText />
                      </button>

                      {/* MODAL DETALLE DE NOTA */}
                      <dialog id={`modal_nota_${reg.ID_Sesion}`} className="modal backdrop-blur-sm text-left">
                          <div className="modal-box bg-white p-0 rounded-2xl overflow-hidden max-w-2xl border border-slate-200">
                             <div className="bg-slate-800 text-white px-6 py-4 flex justify-between items-center">
                                  <div>
                                      <h3 className="font-bold text-lg">Resumen de Sesión</h3>
                                      <p className="text-[10px] text-slate-300 uppercase tracking-widest">{paciente?.Nombre} {paciente?.Apellido}</p>
                                  </div>
                                  <form method="dialog"><button className="btn btn-sm btn-circle btn-ghost text-white">✕</button></form>
                             </div>
                             <div className="p-8 space-y-6">
                                 <section>
                                     <h4 className="text-[10px] font-black text-slate-400 uppercase mb-2">Criterios de Diagnóstico</h4>
                                     <div className="bg-slate-50 p-4 rounded-xl text-slate-700 text-sm italic border border-slate-100">
                                         {reg.Criterios_DeDiagnostico || "No se registraron criterios específicos."}
                                     </div>
                                 </section>
                                 <section>
                                     <h4 className="text-[10px] font-black text-slate-400 uppercase mb-2">Observaciones Generales</h4>
                                     <div className="bg-white p-4 border border-slate-100 rounded-xl text-slate-600 text-sm">
                                         <p className="whitespace-pre-wrap">{reg.Observaciones || "Sin observaciones adicionales."}</p>
                                     </div>
                                 </section>
                             </div>
                             <div className="bg-slate-50 px-6 py-4 flex justify-end border-t">
                                <form method="dialog">
                                    <button className="btn btn-primary btn-sm text-white px-8">Entendido</button>
                                </form>
                             </div>
                          </div>
                          <form method="dialog" className="modal-backdrop"><button>close</button></form>
                      </dialog>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!loading && registros.length === 0 && (
              <div className="py-20 text-center text-slate-400 italic">No se encontraron registros clínicos para este criterio.</div>
          )}
        </div>
      </div>
    </div>
  );
}