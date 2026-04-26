import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { api } from '../../services/api';
import { generarPDFReceta } from '../../services/pdfGenerator';
import type { Cita } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  cita: Cita | null;
}

export default function HistorialModal({ isOpen, onClose, cita }: Props) {
  const [historial, setHistorial] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && cita?.ID_Paciente) {
        setLoading(true);
        api.pacientes.getHistorial(cita.ID_Paciente)
            .then((data: any[]) => setHistorial(data)) // Tipamos data como arreglo
            .catch((err: Error) => { // Tipamos el error
                toast.error("Error al cargar historial clínico.");
                console.error("Error cargando historial:", err);
                setHistorial([]);
            })
            .finally(() => setLoading(false));
    }
    
    if (!isOpen) {
        setHistorial([]);
    }
}, [isOpen, cita]);

  // Helpers de formato consistentes con el resto del sistema
  const formatearFecha = (f: string) => { 
      if(!f) return 'N/A';
      try {
        const p = f.toString().split('T')[0].split('-'); 
        return new Date(parseInt(p[0]), parseInt(p[1])-1, parseInt(p[2]))
          .toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
      } catch (e) {
        return f;
      }
  };

  if (!isOpen) return null;

  return (
    <dialog className="modal modal-open bg-black/50 backdrop-blur-sm">
      <div className="modal-box w-11/12 max-w-4xl bg-white text-slate-800 p-0 overflow-hidden rounded-2xl shadow-2xl">
          
          {/* HEADER DEL MODAL - PascalCase: Nombre, Apellido */}
          <div className="bg-slate-800 text-white px-8 py-5 flex justify-between items-center">
             <div>
                <h3 className="font-bold text-2xl mb-1 font-serif">Historial Clínico</h3>
                <p className="opacity-90 font-medium text-sm">
                  {cita?.Paciente?.Nombre} {cita?.Paciente?.Apellido}
                </p>
             </div>
             <div className="text-right">
                <span className="badge bg-slate-700 border-none text-white font-mono text-xs">
                   {/* Acceso a No_Expediente vía la relación de la sesión */}
                   EXP: {historial.length > 0 && historial[0]?.Expediente ? historial[0].Expediente.No_Expediente : 'Generando...'}
                </span>
             </div>
             <button className="btn btn-circle btn-ghost btn-sm text-slate-200 absolute top-4 right-4" onClick={onClose}>✕</button>
          </div>

          <div className="p-8 max-h-[70vh] overflow-y-auto bg-slate-50">
               {loading ? (
                   <div className="text-center py-20"><span className="loading loading-spinner loading-lg text-primary"></span></div>
               ) : historial.length > 0 ? (
                 <div className="space-y-4">
                    {historial.map((sesion, index) => (
                        <div key={sesion.ID_Sesion || index} className="collapse collapse-plus bg-white shadow-md border border-slate-200 hover:shadow-lg transition-shadow rounded-xl">
                            <input type="checkbox" className="peer" /> 
                            
                            <div className="collapse-title font-bold text-slate-700 flex justify-between items-center py-4 peer-checked:bg-blue-50 peer-checked:border-b peer-checked:border-slate-200">
                                <div className="flex items-center gap-3">
                                   <span className="bg-slate-800 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                                        {historial.length - index}
                                   </span>
                                   <span className="text-lg font-medium">Sesión Clínica</span>
                                   <span className="text-xs font-normal text-slate-500 uppercase tracking-wider ml-2">
                                        {formatearFecha(sesion.HoraDeInicio)} 
                                   </span>
                                </div>

                                <div className="flex items-center gap-4 text-sm" onClick={(e) => e.stopPropagation()}>
                                    <button 
                                      className="btn btn-xs btn-outline btn-success gap-1 z-10"
                                      onClick={() => generarPDFReceta(sesion, `${cita?.Paciente?.Nombre} ${cita?.Paciente?.Apellido}`)}
                                    >
                                      🖨️ Receta
                                    </button>
                                    <span className="font-normal text-slate-500">
                                       Dr. {sesion.Cita?.Psicologo?.Apellido || 'N/A'}
                                    </span>
                                </div>
                            </div>

                            <div className="collapse-content bg-white p-6 border-t border-slate-100">
                                <div className="space-y-6">
                                    <div className="p-4 border-l-4 border-blue-600 bg-blue-50/50 rounded-r-lg">
                                        <h4 className="font-bold text-slate-700 text-sm mb-1 uppercase tracking-wider">Diagnóstico Diferencial</h4>
                                        <p className="text-slate-800 italic">{sesion.DiagnosticoDiferencial || 'Sin diagnóstico registrado'}</p>
                                        <p className="text-xs text-slate-500 mt-2">Criterios: {sesion.Criterios_DeDiagnostico || 'No especificados'}</p>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <h4 className="font-bold text-slate-700 text-sm mb-2 uppercase tracking-wider">Observaciones Clínicas</h4>
                                            <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{sesion.Observaciones || 'Sin observaciones'}</p>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-amber-800 text-sm mb-2 uppercase tracking-wider">Evolución del Paciente</h4>
                                            {/* Sincronizado con HistorialDeEvolucion */}
                                            <p className="text-amber-900 italic text-sm bg-amber-50 p-3 rounded-lg border border-amber-100">{sesion.HistorialDeEvolucion || 'No hay evolución registrada.'}</p>
                                        </div>
                                    </div>

                                    {/* Tratamientos: Adaptado a la estructura N:M del Backend */}
                                    {(sesion.Tratamiento?.length > 0) && (
                                        <div className="pt-4">
                                            <h4 className="font-bold text-slate-700 text-sm mb-2 uppercase tracking-wider border-t pt-4">Plan de Tratamiento</h4>
                                            {sesion.Tratamiento.map((t: any, tid: number) => (
                                                <div key={tid} className="flex flex-col border-b last:border-b-0 pb-3 mb-3 last:mb-0">
                                                    <span className="font-bold text-sm text-slate-800">
                                                        {t.Medicamento ? t.Medicamento : (t.TipoDeTerapia?.NombreDeTerapia || 'Terapia Clínica')}
                                                        <span className="badge badge-sm ml-2">{t.Frecuencia}</span>
                                                    </span>
                                                    <span className="text-xs text-slate-500 mt-1">
                                                        {t.Medicamento ? `Dosis: ${t.Dosis} - Vía: ${t.ViaAdministracion?.NombreDePresentacion || 'Oral'}` : `Objetivo: ${t.Objetivo || 'Mejora clínica'}`}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                 </div>
               ) : (
                 <div className="text-center py-10 text-slate-400">
                    <p>No se encontraron registros previos en el expediente.</p>
                 </div>
               )}
          </div>
          
          <div className="p-4 bg-white border-t border-slate-100 flex justify-end rounded-b-2xl">
              <button className="btn btn-ghost px-8" onClick={onClose}>Cerrar</button>
          </div>
      </div>
    </dialog>
  );
}