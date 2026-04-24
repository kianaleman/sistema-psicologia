import { useEffect, useState } from 'react';
import { toast } from 'sonner';
// Asegúrate de que estas rutas sean correctas en tu proyecto
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
    if (isOpen && cita?.Paciente?.ID_Paciente) {
      setLoading(true);
      // Llamada segura al API (uso de ID_Paciente de la cita inicial)
      api.pacientes.getHistorial(cita.Paciente.ID_Paciente)
        .then((data) => setHistorial(Array.isArray(data) ? data : []))
        .catch((err) => {
             // Mantenemos toast para dar feedback en caso de error de API
            toast.error("Error al cargar historial. Verifique la conexión al backend.");
            console.error("Error cargando historial:", err);
            setHistorial([]);
        })
        .finally(() => setLoading(false));
    }
    // Limpiamos el historial al cerrar para que el spinner se muestre la próxima vez
    if (!isOpen) {
        setHistorial([]);
    }
  }, [isOpen, cita]);

  // Helpers de formato locales
  const formatearFecha = (f: string) => { 
      if(!f) return 'N/A';
      try {
        const p = f.toString().split('T')[0].split('-'); 
        // Formato: 24 de noviembre de 2025
        return new Date(parseInt(p[0]), parseInt(p[1])-1, parseInt(p[2]))
          .toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
      } catch (e) {
        return f;
      }
  };

  const formatearHoraUniversal = (h: string) => { 
      if (!h) return "--:--"; 
      try {
        const f = new Date(h); 
        // Usamos toLocaleTimeString para formato AM/PM si está disponible
        return f.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      } catch (e) {
        return "--:--";
      }
  };

  if (!isOpen) return null;

  return (
    <dialog className="modal modal-open bg-black/50 backdrop-blur-sm">
      <div className="modal-box w-11/12 max-w-4xl bg-white text-slate-800 p-0 overflow-hidden rounded-2xl shadow-2xl">
          
          {/* HEADER DEL MODAL */}
          <div className="bg-slate-800 text-white px-8 py-5 flex justify-between items-center">
             <div>
                <h3 className="font-bold text-2xl mb-1 font-serif">Historial Clínico</h3>
                <p className="opacity-90 font-medium text-sm">
                  {cita?.Paciente?.Nombre || 'Paciente'} {cita?.Paciente?.Apellido || ''}
                </p>
             </div>
             <div className="text-right">
                <span className="badge bg-slate-700 border-none text-white font-mono text-xs">
                   EXP: {historial.length > 0 && historial[0]?.Expediente ? historial[0].Expediente.No_Expediente : 'Sin Expediente'}
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
                            
                            {/* TÍTULO DEL ACORDEÓN (Collapse Header) */}
                            <div className="collapse-title font-bold text-slate-700 flex justify-between items-center py-4 peer-checked:bg-blue-50 peer-checked:border-b peer-checked:border-slate-200">
                                <div className="flex items-center gap-3">
                                   <span className="bg-slate-800 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                                        {historial.length - index}
                                   </span>
                                   <span className="text-lg font-medium">Sesión Clínica</span>
                                   <span className="text-xs font-normal text-slate-500 uppercase tracking-wider ml-2">
                                        {formatearFecha(sesion.FechaReal || sesion.HoraDeInicio)} 
                                   </span>
                                </div>

                                {/* Acciones y Doctor */}
                                <div className="flex items-center gap-4 text-sm" onClick={(e) => e.stopPropagation()}>
                                    <button 
                                      className="btn btn-xs btn-outline btn-success gap-1 z-10"
                                      onClick={() => generarPDFReceta(sesion, `${cita?.Paciente?.Nombre || ''} ${cita?.Paciente?.Apellido || ''}`)}
                                    >
                                      🖨️ Receta
                                    </button>
                                    
                                    {/* Doctor (Acceso seguro) */}
                                    <span className="font-normal text-slate-500">
                                       Dr. {sesion.Psicologo?.Apellido || 'N/A'}
                                    </span>
                                </div>
                            </div>

                            {/* CONTENIDO DEL ACORDEÓN (Collapse Body) */}
                            <div className="collapse-content bg-white p-6 border-t border-slate-100">
                                <div className="space-y-6">
                                    {/* Diagnóstico y Resumen */}
                                    <div className="p-4 border-l-4 border-blue-600 bg-blue-50/50 rounded-r-lg">
                                        <h4 className="font-bold text-slate-700 text-sm mb-1 uppercase tracking-wider">Diagnóstico Diferencial</h4>
                                        <p className="text-slate-800 italic">{sesion.DiagnosticoDiferencial || 'Sin diagnóstico registrado'}</p>
                                        <p className="text-xs text-slate-500 mt-2">Criterios: {sesion.CriteriosDeDiagnostico || 'No especificados'}</p>
                                    </div>
                                    
                                    {/* Observaciones y Evolución */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <h4 className="font-bold text-slate-700 text-sm mb-2 uppercase tracking-wider">Observaciones Clínicas</h4>
                                            <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{sesion.Observaciones || 'Sin observaciones'}</p>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-amber-800 text-sm mb-2 uppercase tracking-wider">Historial de Evolución</h4>
                                            <p className="text-amber-900 italic text-sm bg-amber-50 p-3 rounded-lg border border-amber-100">{sesion.HistorialDevolucion || 'No hay evolución registrada.'}</p>
                                        </div>
                                    </div>

                                    {/* Tratamientos */}
                                    {(sesion.Tratamiento?.length > 0) && (
                                        <div className="pt-4">
                                            <h4 className="font-bold text-slate-700 text-sm mb-2 uppercase tracking-wider border-t pt-4">Tratamientos Indicados</h4>
                                            {sesion.Tratamiento.map((t: any, tid: number) => (
                                                <div key={tid} className="flex flex-col border-b last:border-b-0 pb-3 mb-3 last:mb-0">
                                                    <span className="font-bold text-sm text-slate-800">
                                                        {t.TratamientoFarmaceutico ? t.TratamientoFarmaceutico.NombreMedicamento : t.TratamientoTerapeutico?.Objetivo || 'Tratamiento sin nombre'}
                                                        <span className="badge badge-sm ml-2">{t.Frecuencia}</span>
                                                    </span>
                                                    <span className="text-xs text-slate-500 mt-1">
                                                        {t.TratamientoFarmaceutico ? `Dosis: ${t.TratamientoFarmaceutico.Dosis}` : `Terapia: ${t.TratamientoTerapeutico?.TipoDeTerapia?.NombreDeTerapia || 'Terapia General'}`}
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
                    <p>Este paciente no tiene sesiones previas registradas.</p>
                 </div>
               )}
          </div>
          
          <div className="p-4 bg-white border-t border-slate-100 flex justify-end rounded-b-2xl">
              <button className="btn btn-ghost px-8" onClick={onClose}>Cerrar Expediente</button>
          </div>
      </div>
    </dialog>
  );
}