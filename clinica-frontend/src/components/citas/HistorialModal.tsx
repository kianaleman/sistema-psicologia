import { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
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
        .then((data: any[]) => setHistorial(data))
        .catch((err: Error) => {
          toast.error("Error al cargar historial clínico.");
          console.error("Error cargando historial:", err);
          setHistorial([]);
        })
        .finally(() => setLoading(false));
    }
    if (!isOpen) setHistorial([]);
  }, [isOpen, cita]);

  // 🟢 CORRECCIÓN: Función blindada para usar FechaCita sin desfases ni errores de 1970
  const formatearFecha = (f: any) => {
    if (!f) return 'FECHA NO DISPONIBLE';
    try {
      const d = new Date(f);
      // Validamos que no sea la fecha nula de JS (1970) o inválida
      if (isNaN(d.getTime()) || d.getUTCFullYear() <= 1970) {
        return 'FECHA NO DISPONIBLE';
      }

      return d.toLocaleDateString('es-ES', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric',
        timeZone: 'UTC' // 🟢 Crucial para que coincida con la fecha de la base de datos
      });
    } catch (e) { 
      return 'FECHA NO DISPONIBLE'; 
    }
  };

  // 🟢 LÓGICA DE EXPEDIENTE BLINDADA
  const noExpediente = useMemo(() => {
    if (cita?.Paciente?.Expediente?.No_Expediente) return cita.Paciente.Expediente.No_Expediente;
    if (historial.length > 0 && historial[0]?.Expediente?.No_Expediente) return historial[0].Expediente.No_Expediente;
    const registroConExp = historial.find(h => h.Expediente?.No_Expediente);
    if (registroConExp) return registroConExp.Expediente.No_Expediente;
    
    return loading ? "CARGANDO..." : "SIN EXPEDIENTE";
  }, [cita, historial, loading]);

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-5xl rounded-[2rem] shadow-2xl flex flex-col max-h-[95vh] border border-slate-200 overflow-hidden animate-fade-in-up">
        
        <div className="bg-[#1e293b] text-white px-8 py-5 flex justify-between items-center shrink-0">
          <div>
            <h3 className="font-bold text-2xl mb-1 font-serif text-white">Historial Clínico</h3>
            <p className="opacity-90 font-medium text-sm text-slate-300">
              Paciente: {cita?.Paciente?.Nombre} {cita?.Paciente?.Apellido}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="badge bg-blue-600 border-none text-white font-mono text-xs p-4 shadow-lg">
              EXP: {noExpediente}
            </span>
            <button className="btn btn-sm btn-circle btn-ghost text-white" onClick={onClose}>✕</button>
          </div>
        </div>

        <div className="p-8 overflow-y-auto bg-slate-50/50 flex-1 text-slate-800 custom-scrollbar">
          {loading ? (
            <div className="text-center py-20">
              <span className="loading loading-spinner loading-lg text-primary"></span>
              <p className="text-slate-400 mt-4 font-medium">Sincronizando registros clínicos...</p>
            </div>
          ) : historial.length > 0 ? (
            <div className="space-y-4">
              {historial.map((sesion, index) => (
                <div key={sesion.ID_Sesion || index} className="collapse collapse-plus bg-white shadow-md border border-slate-200 rounded-2xl overflow-hidden transition-all hover:border-blue-200">
                  <input type="checkbox" className="peer" />
                  <div className="collapse-title font-bold text-slate-700 flex justify-between items-center py-5 peer-checked:bg-blue-50/50">
                    <div className="flex items-center gap-4">
                      <span className="bg-slate-800 text-white w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold">
                        {historial.length - index}
                      </span>
                      <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4">
                        <span className="text-lg font-bold text-slate-800">Sesión Clínica</span>
                        <span className="text-xs font-normal text-slate-500 uppercase tracking-widest">
                           {/* 🟢 CORRECCIÓN: Prioridad a FechaCita para evitar 1970 */}
                           {formatearFecha(sesion.Cita?.FechaCita || sesion.Fecha_Sesion || cita?.FechaCita)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mr-8" onClick={(e) => e.stopPropagation()}>
                      <button 
                        className="btn btn-xs btn-outline btn-success gap-1 border-2"
                        onClick={() => generarPDFReceta(sesion, `${cita?.Paciente?.Nombre} ${cita?.Paciente?.Apellido}`)}
                      >
                        🖨️ Receta
                      </button>
                      <span className="font-normal text-xs text-slate-400 hidden md:inline italic">
                         Atendido por: Dr. {sesion.Cita?.Psicologo?.Apellido || 'Especialista'}
                      </span>
                    </div>
                  </div>

                  <div className="collapse-content bg-white p-6 border-t border-slate-100">
                    <div className="space-y-6 pt-4">
                      <div className="p-5 border-l-4 border-blue-600 bg-blue-50/50 rounded-r-2xl">
                        <h4 className="font-black text-blue-800 text-[10px] mb-2 uppercase tracking-widest">Diagnóstico Diferencial</h4>
                        <p className="text-slate-700 italic text-sm leading-relaxed">"{sesion.DiagnosticoDiferencial || 'Sin diagnóstico registrado'}"</p>
                        <p className="text-[11px] text-slate-500 mt-3 font-medium">Criterios aplicados: {sesion.Criterios_DeDiagnostico || 'No especificados'}</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                          <h4 className="font-black text-slate-400 text-[10px] mb-3 uppercase tracking-widest">Observaciones Clínicas</h4>
                          <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                            {sesion.Observaciones || 'Sin observaciones adicionales.'}
                          </p>
                        </div>
                        <div className="bg-amber-50/50 p-5 rounded-2xl border border-amber-100">
                          <h4 className="font-black text-amber-600 text-[10px] mb-3 uppercase tracking-widest">Evolución del Paciente</h4>
                          <p className="text-amber-900 italic text-sm leading-relaxed">
                            {sesion.HistorialDeEvolucion || 'No hay evolución registrada.'}
                          </p>
                        </div>
                      </div>

                      {sesion.Tratamiento?.length > 0 && (
                        <div className="pt-4 border-t border-slate-100">
                            <h4 className="font-black text-slate-800 text-[10px] mb-4 uppercase tracking-widest flex items-center gap-2">
                              💊 Plan de Tratamiento y Seguimiento
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {sesion.Tratamiento.map((t: any, tid: number) => (
                                <div key={tid} className="p-4 bg-white border border-slate-200 rounded-xl flex flex-col shadow-sm">
                                  <div className="flex justify-between items-start mb-2">
                                    <span className="font-bold text-slate-800 text-sm">
                                      {t.Tratamiento_Farmaceutico ? t.Tratamiento_Farmaceutico.Nombre_Medicamento : (t.Tratamiento_Terapeutico?.TipoDe_Terapia?.Nombre_De_Terapia || 'Terapia Clínica')}
                                    </span>
                                    <span className="badge badge-sm bg-slate-100 text-slate-600 border-none font-bold uppercase text-[9px]">{t.Frecuencia}</span>
                                  </div>
                                  <span className="text-[11px] text-slate-500 italic">
                                    {t.Tratamiento_Farmaceutico ? `Dosis: ${t.Tratamiento_Farmaceutico.Dosis}` : `Objetivo: ${t.Tratamiento_Terapeutico?.Objetivo || 'Mejora clínica'}`}
                                  </span>
                                </div>
                              ))}
                            </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-24 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200">
              <p className="text-slate-400 font-serif text-xl italic mb-2">Expediente limpio</p>
              <p className="text-slate-300 text-sm">Las sesiones aparecerán aquí una vez que se completen las citas programadas.</p>
            </div>
          )}
        </div>

        <div className="px-8 py-5 bg-white border-t border-slate-100 flex justify-end shrink-0">
          <button className="btn btn-ghost px-12 font-bold text-slate-400 uppercase tracking-widest text-xs hover:bg-slate-50" onClick={onClose}>
            Cerrar Expediente
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.getElementById('modal-root')!);
}