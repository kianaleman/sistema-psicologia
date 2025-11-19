import { useEffect, useState } from 'react';
import { api } from '../services/api';
// Importamos los tipos base, pero definiremos uno extendido aquí
import type { Sesion, Paciente, Psicologo, Expediente } from '../types';

// Extendemos la interfaz Sesion porque este endpoint devuelve datos extra calculados
interface RegistroHistorial extends Sesion {
  Paciente: Paciente;
  Psicologo: Psicologo;
  Expediente: Expediente;
  // Campos calculados en el backend para esta vista específica:
  FechaReal: string; 
  DatosCita: { 
    Motivo: string; 
    Tipo: string 
  };
}

export default function Historial() {
  const [registros, setRegistros] = useState<RegistroHistorial[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Usamos el servicio centralizado
      const data = await api.general.historialCompleto();
      setRegistros(data);
      setLoading(false);
    } catch (error) {
      console.error("Error cargando historial:", error);
      setLoading(false);
    }
  };

  // Filtro por nombre o expediente
  const registrosFiltrados = registros.filter(r => 
    `${r.Paciente.Nombre} ${r.Paciente.Apellido}`.toLowerCase().includes(busqueda.toLowerCase()) ||
    r.Expediente?.No_Expediente.toLowerCase().includes(busqueda.toLowerCase())
  );

  // Helper de fecha (Usa la fecha real que viene del backend)
  const formatearFecha = (fecha: string) => {
     if (!fecha) return "-";
     const f = new Date(fecha);
     return f.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="p-6 animate-fade-in-up">
      
      {/* ENCABEZADO Y BUSCADOR */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Historial Clínico</h1>
          <p className="text-slate-500">Registro completo de atenciones y diagnósticos</p>
        </div>
        
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
             <svg aria-hidden="true" className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
          <input 
             type="text" 
             className="input input-bordered w-full pl-10 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
             placeholder="Buscar por paciente o expediente..." 
             value={busqueda}
             onChange={e => setBusqueda(e.target.value)} 
          />
        </div>
      </div>

      {/* TABLA DE HISTORIAL */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-xs font-bold text-slate-500 uppercase tracking-wider py-4 pl-6">Fecha</th>
                <th className="text-xs font-bold text-slate-500 uppercase tracking-wider">Paciente / Expediente</th>
                <th className="text-xs font-bold text-slate-500 uppercase tracking-wider">Motivo Consulta</th>
                <th className="text-xs font-bold text-slate-500 uppercase tracking-wider">Diagnóstico (Sesión)</th>
                <th className="text-xs font-bold text-slate-500 uppercase tracking-wider">Especialista</th>
                <th className="text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Nota</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8"><span className="loading loading-spinner"></span></td></tr>
              ) : registrosFiltrados.map((reg) => (
                <tr key={reg.ID_Sesion} className="hover:bg-blue-50 transition-colors">
                  
                  {/* FECHA */}
                  <td className="pl-6 py-4 whitespace-nowrap">
                     <div className="font-mono text-sm font-semibold text-slate-600">
                        {formatearFecha(reg.FechaReal)}
                     </div>
                  </td>

                  {/* PACIENTE */}
                  <td className="py-4">
                    <div className="flex flex-col">
                       <span className="font-bold text-slate-800 text-sm">{reg.Paciente.Nombre} {reg.Paciente.Apellido}</span>
                       <div className="flex items-center gap-2 mt-1">
                          <span className="badge badge-sm bg-slate-100 text-slate-500 border-none font-mono">
                             {reg.Expediente?.No_Expediente || 'S/E'}
                          </span>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wide">{reg.Paciente.Nacionalidad}</span>
                       </div>
                    </div>
                  </td>

                  {/* MOTIVO */}
                  <td className="py-4 max-w-xs">
                    <div className="flex flex-col gap-1">
                       <span className="badge badge-outline badge-xs text-blue-600 border-blue-200 font-bold">
                          {reg.DatosCita.Tipo}
                       </span>
                       <span className="text-sm text-slate-600 truncate" title={reg.DatosCita.Motivo}>
                          {reg.DatosCita.Motivo}
                       </span>
                    </div>
                  </td>

                  {/* DIAGNÓSTICO */}
                  <td className="py-4 max-w-xs">
                    <p className="text-sm text-slate-700 italic truncate pl-2 border-l-2 border-amber-300" title={reg.DiagnosticoDiferencial}>
                       {reg.DiagnosticoDiferencial || "Sin diagnóstico registrado"}
                    </p>
                  </td>

                  {/* ESPECIALISTA */}
                  <td className="py-4 whitespace-nowrap">
                     <div className="text-xs font-bold text-slate-500 uppercase">Dr. {reg.Psicologo?.Apellido}</div>
                  </td>

                  {/* ACCIÓN */}
                  <td className="py-4 text-center">
                    <button 
                       className="btn btn-ghost btn-xs text-blue-600 hover:bg-blue-100"
                       onClick={() => (document.getElementById(`modal_nota_${reg.ID_Sesion}`) as HTMLDialogElement).showModal()}>
                       Ver Nota Completa
                    </button>

                    {/* MODAL INDIVIDUAL */}
                    <dialog id={`modal_nota_${reg.ID_Sesion}`} className="modal modal-bottom sm:modal-middle backdrop-blur-sm text-left">
                       <div className="modal-box bg-white">
                          <h3 className="font-bold text-lg text-slate-800 mb-4">Nota Clínica Completa</h3>
                          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                             {reg.Observaciones}
                          </div>
                          <div className="modal-action">
                             <form method="dialog">
                                <button className="btn btn-primary btn-sm text-white">Cerrar</button>
                             </form>
                          </div>
                       </div>
                    </dialog>
                  </td>
                </tr>
              ))}

              {!loading && registrosFiltrados.length === 0 && (
                 <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400">
                       <p className="text-sm">No se encontraron registros históricos.</p>
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