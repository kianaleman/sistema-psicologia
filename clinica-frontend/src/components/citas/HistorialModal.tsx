import { useEffect, useState } from 'react';
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
      // Llamada segura al API
      api.pacientes.getHistorial(cita.Paciente.ID_Paciente)
        .then((data) => setHistorial(Array.isArray(data) ? data : []))
        .catch((err) => {
            console.error("Error cargando historial:", err);
            setHistorial([]);
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, cita]);

  // Helpers de formato locales
  const formatearFecha = (f: string) => { 
      if(!f) return 'N/A';
      // Manejo robusto de fecha para evitar problemas de zona horaria
      try {
        const p = f.toString().split('T')[0].split('-'); 
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
        return `${f.getUTCHours().toString().padStart(2, '0')}:${f.getUTCMinutes().toString().padStart(2, '0')}`; 
      } catch (e) {
        return "--:--";
      }
  };

  if (!isOpen) return null;

  return (
    <dialog className="modal modal-open bg-black/50 backdrop-blur-sm">
      <div className="modal-box w-11/12 max-w-4xl bg-white text-slate-800 p-0 overflow-hidden rounded-2xl shadow-2xl">
          
          {/* ENCABEZADO AZUL */}
          <div className="bg-blue-600 text-white px-8 py-6 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-2xl mb-1">Expediente del Paciente</h3>
                {/* CORRECCIÓN 1: Acceso seguro a los datos del paciente */}
                <p className="opacity-90 font-medium">{cita?.Paciente?.Nombre || 'Paciente'} {cita?.Paciente?.Apellido || ''}</p>
              </div>
              <div className="text-right">
                 <span className="badge bg-blue-700 border-none text-white mt-2">
                    {/* CORRECCIÓN 2: Acceso seguro al No_Expediente */}
                    {historial.length > 0 && historial[0]?.Expediente ? historial[0].Expediente.No_Expediente : 'Sin Expediente'}
                 </span>
              </div>
              <button className="btn btn-circle btn-ghost btn-sm text-white absolute top-4 right-4" onClick={onClose}>✕</button>
          </div>

          <div className="p-8 max-h-[70vh] overflow-y-auto bg-slate-50">
             {loading ? (
                 <div className="text-center py-10"><span className="loading loading-spinner text-primary"></span></div>
             ) : historial.length > 0 ? (
               <div className="space-y-4">
                 {historial.map((sesion, index) => (
                    <div key={sesion.ID_Sesion || index} className="collapse collapse-plus bg-white shadow-sm border border-slate-200">
                       <input type="checkbox" className="peer" /> 
                       
                       {/* TÍTULO DEL ACORDEÓN */}
                       <div className="collapse-title font-bold text-slate-700 flex justify-between items-center peer-checked:bg-blue-50 peer-checked:border-b peer-checked:border-slate-200">
                          <div className="flex flex-col">
                             <span className="text-blue-600 text-lg">Sesión #{historial.length - index}</span>
                             
                             <span className="font-normal text-slate-500 text-sm">
                               {formatearFecha(sesion.FechaReal || sesion.HoraDeInicio)} 
                               <span className="font-mono ml-2 badge badge-ghost">
                                 {formatearHoraUniversal(sesion.HoraDeInicio)} - {formatearHoraUniversal(sesion.HoraFinal)}
                               </span>
                             </span>
                          </div>

                          {/* Botón Receta y Doctor */}
                          <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
                            <button 
                              className="btn btn-xs btn-outline btn-primary gap-1 z-10"
                              onClick={() => generarPDFReceta(sesion, `${cita?.Paciente?.Nombre || ''} ${cita?.Paciente?.Apellido || ''}`)}
                            >
                              🖨️ Receta
                            </button>
                            
                            {/* --- CORRECCIÓN PRINCIPAL: ELIMINACIÓN DEL ERROR DE PANTALLA --- */}
                            {/* Usamos '?.' para acceder al Apellido del Psicólogo de forma segura */}
                            <span className="font-normal text-slate-500 text-sm">
                                Dr. {sesion.Psicologo?.Apellido || 'Desconocido'}
                            </span>
                          </div>
                       </div>

                       <div className="collapse-content bg-white">
                          <div className="space-y-4 pt-4 border-t border-slate-100">
                             <div>
                                <h4 className="font-bold text-slate-700 text-sm mb-1">Diagnóstico</h4>
                                <p className="text-slate-600 text-sm">{sesion.DiagnosticoDiferencial || 'Sin diagnóstico registrado'}</p>
                             </div>
                             <div className="divider my-0"></div>
                             <div>
                                <h4 className="font-bold text-slate-700 text-sm mb-1">Observaciones</h4>
                                <p className="text-slate-600 text-sm whitespace-pre-wrap">{sesion.Observaciones || 'Sin observaciones'}</p>
                             </div>
                             <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
                                <h4 className="font-bold text-amber-800 text-sm mb-1">Evolución</h4>
                                <p className="text-amber-900 italic text-sm">{sesion.HistorialDevolucion || 'N/A'}</p>
                             </div>
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
          
          <div className="p-4 bg-white border-t border-slate-100 flex justify-end">
             <button className="btn btn-primary px-8 text-white" onClick={onClose}>Cerrar Expediente</button>
          </div>
      </div>
    </dialog>
  );
}