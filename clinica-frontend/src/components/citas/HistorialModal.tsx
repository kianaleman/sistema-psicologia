import { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { api } from '../../services/api';
import { generarPDFReceta, generarPDFExpediente } from '../../services/pdfGenerator';
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

  const formatearFecha = (f: any) => {
    if (!f) return 'FECHA NO DISPONIBLE';
    try {
      const d = new Date(f);
      if (isNaN(d.getTime()) || d.getUTCFullYear() <= 1970) return 'FECHA NO DISPONIBLE';
      return d.toLocaleDateString('es-ES', {
        day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC'
      });
    } catch (e) { return 'FECHA NO DISPONIBLE'; }
  };

  const noExpediente = useMemo(() => {
    if (cita?.Paciente?.Expediente?.No_Expediente) return cita.Paciente.Expediente.No_Expediente;
    const registroConExp = historial.find(h => h.Expediente?.No_Expediente);
    return registroConExp ? registroConExp.Expediente.No_Expediente : (loading ? "CARGANDO..." : "SIN EXPEDIENTE");
  }, [cita, historial, loading]);

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4 overflow-y-auto font-sans">
      <div className="bg-[#f8fafc] w-full max-w-5xl rounded-[2rem] shadow-2xl flex flex-col max-h-[92vh] border border-white/20 overflow-hidden animate-fade-in-up">
        
        {/* HEADER PRINCIPAL */}
        <div className="bg-[#1e293b] text-white px-10 py-6 flex justify-between items-center shrink-0 shadow-lg">
          <div>
            <h3 className="font-bold text-2xl tracking-tight text-white uppercase" style={{ fontFamily: 'Arial, sans-serif' }}>Expediente Clínico</h3>
            <p className="text-blue-400 font-bold text-sm tracking-wide mt-1">
              PACIENTE: {cita?.Paciente?.Nombre} {cita?.Paciente?.Apellido}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              className="btn btn-md bg-blue-600 hover:bg-blue-700 border-none text-white gap-2 px-6 rounded-xl shadow-lg transition-all active:scale-95 text-xs font-bold"
              disabled={loading || historial.length === 0}
              onClick={() => generarPDFExpediente(cita?.Paciente, historial)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              DESCARGAR PDF
            </button>
            <div className="bg-slate-800 px-4 py-2 rounded-xl border border-slate-700 text-center">
              <span className="text-[9px] text-slate-400 block font-black uppercase">No. Expediente</span>
              <span className="text-white font-mono text-xs font-bold">{noExpediente}</span>
            </div>
            <button className="btn btn-sm btn-circle btn-ghost text-slate-400" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* CUERPO - ACORDEONES CERRADOS POR DEFECTO */}
        <div className="p-8 overflow-y-auto flex-1 custom-scrollbar" style={{ fontFamily: 'Arial, sans-serif' }}>
          {loading ? (
            <div className="text-center py-20">
              <span className="loading loading-spinner loading-lg text-blue-600"></span>
              <p className="text-slate-500 mt-4 font-bold">Cargando historial...</p>
            </div>
          ) : historial.length > 0 ? (
            <div className="space-y-4">
              {historial.map((sesion, index) => (
                <div key={sesion.ID_Sesion || index} className="collapse collapse-arrow bg-white border border-slate-200 rounded-2xl shadow-sm transition-all hover:border-blue-300">
                  <input type="checkbox" className="peer" /> 
                  
                  {/* TÍTULO DEL ACORDEÓN */}
                  <div className="collapse-title p-6 flex items-center justify-between pr-12">
                    <div className="flex items-center gap-5">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-bold text-slate-500 border border-slate-200">
                        {historial.length - index}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-lg">
                          Sesión Clínica 
                          <span className="ml-3 text-[10px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded border border-slate-200 uppercase tracking-wider">
                            {sesion.Cita?.TipoDeCita?.Nombre_DeCita || 'Consulta'}
                          </span>
                        </h4>
                        <p className="text-slate-400 text-xs mt-0.5 font-normal">
                          {formatearFecha(sesion.Cita?.FechaCita || sesion.Fecha_Sesion)} • Dr. {sesion.Cita?.Psicologo?.Apellido}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* CONTENIDO DESPLEGABLE */}
                  <div className="collapse-content px-8 pb-8 pt-2 bg-slate-50/30">
                    <div className="border-t border-slate-100 pt-6">
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        
                        {/* IZQUIERDA: INFORMACIÓN TÉCNICA */}
                        <div className="lg:col-span-7 space-y-6">
                          <div className="p-5 bg-blue-50/50 rounded-xl border-l-4 border-blue-600 shadow-sm">
                            <h5 className="text-[10px] font-black text-blue-800 uppercase tracking-widest mb-2">Diagnóstico Diferencial</h5>
                            <p className="text-slate-700 text-[14px] leading-relaxed">
                              {sesion.DiagnosticoDiferencial || 'Sin registro diagnóstico'}
                            </p>
                            {sesion.Criterios_DeDiagnostico && (
                              <p className="text-[11px] text-blue-400 mt-3 font-bold italic">
                                Criterios: {sesion.Criterios_DeDiagnostico}
                              </p>
                            )}
                          </div>

                          <div>
                            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Observaciones Clínicas</h5>
                            <p className="text-slate-600 text-[14px] leading-relaxed whitespace-pre-wrap">
                              {sesion.Observaciones || 'No se detallaron observaciones.'}
                            </p>
                          </div>
                        </div>

                        {/* DERECHA: EVOLUCIÓN Y TRATAMIENTO */}
                        <div className="lg:col-span-5 space-y-6">
                          <div className="bg-amber-50/30 p-5 rounded-xl border border-amber-100 shadow-sm">
                            <h5 className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2">Evolución del Paciente</h5>
                            <p className="text-amber-900/80 text-[14px] leading-relaxed font-medium italic">
                              {sesion.HistorialDeEvolucion || 'Sin registro de evolución.'}
                            </p>
                          </div>

                          {/* 🟢 BLOQUE DE TRATAMIENTO ACTUALIZADO (MÁS GRANDE Y LEGIBLE) */}
                          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md">
                            <div className="flex justify-between items-center mb-5 border-b border-slate-50 pb-3">
                              <h5 className="text-[12px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                💊 Plan de Tratamiento
                              </h5>
                              <button
                                className="text-[11px] bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-700 transition-all shadow-sm active:scale-95"
                                onClick={() => generarPDFReceta(sesion, `${cita?.Paciente?.Nombre} ${cita?.Paciente?.Apellido}`)}
                              >
                                RECARGAR RECETA
                              </button>
                            </div>

                            <div className="space-y-4">
                              {sesion.Tratamiento?.length > 0 ? (
                                sesion.Tratamiento.map((t: any, tid: number) => (
                                  <div key={tid} className="p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-blue-300 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                      <span className="font-extrabold text-slate-900 text-[15px] leading-tight flex-1">
                                        {t.Tratamiento_Farmaceutico ? t.Tratamiento_Farmaceutico.Nombre_Medicamento : (t.Tratamiento_Terapeutico?.TipoDe_Terapia?.Nombre_De_Terapia || 'Terapia')}
                                      </span>
                                      <span className="text-[11px] font-black text-blue-700 bg-blue-100 px-2 py-1 rounded-md uppercase ml-2 whitespace-nowrap">
                                        {t.Frecuencia}
                                      </span>
                                    </div>
                                    
                                    <div className="bg-white/60 p-2.5 rounded-lg border border-slate-100 mt-1">
                                      <p className="text-[13px] text-slate-600 leading-relaxed font-medium">
                                        <span className="text-slate-400 font-bold uppercase text-[10px] block mb-0.5">
                                          {t.Tratamiento_Farmaceutico ? "Dosis e Instrucciones:" : "Objetivo Terapéutico:"}
                                        </span>
                                        {t.Tratamiento_Farmaceutico ? t.Tratamiento_Farmaceutico.Dosis : (t.Tratamiento_Terapeutico?.Objetivo || 'Mejora clínica')}
                                      </p>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <p className="text-[13px] text-slate-400 italic text-center py-4">No hay tratamientos asignados.</p>
                              )}
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-slate-200">
              <p className="text-slate-400 font-bold text-lg italic">Expediente sin sesiones registradas</p>
            </div>
          )}
        </div>

        <div className="px-10 py-5 bg-white border-t border-slate-100 flex justify-between items-center shrink-0">
           <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">Resiliencia • Sistema de Gestión</p>
           <button className="text-slate-400 hover:text-slate-600 font-bold text-xs uppercase tracking-widest" onClick={onClose}>
            Cerrar Ventana
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.getElementById('modal-root')!);
}