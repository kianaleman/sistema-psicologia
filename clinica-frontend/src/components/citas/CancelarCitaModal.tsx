import { useState, useEffect } from 'react';
import { createPortal } from "react-dom"; // 🟢 Importación necesaria
import { api } from '../../services/api';
import type { MotivoCancelacion } from '../../types';
import { toast } from 'sonner';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (motivoId: number, notas: string) => void;
}

const Icons = {
    Warning: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
};

export default function CancelarCitaModal({ isOpen, onClose, onConfirm }: Props) {
  const [motivos, setMotivos] = useState<MotivoCancelacion[]>([]);
  const [motivoSeleccionado, setMotivoSeleccionado] = useState('');
  const [notas, setNotas] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.general.motivosCancelacion()
        .then(data => setMotivos(data))
        .catch(() => toast.error("Error cargando motivos"));
      
      setMotivoSeleccionado('');
      setNotas('');
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!motivoSeleccionado) return toast.error("Selecciona un motivo");
    
    setLoading(true);
    onConfirm(Number(motivoSeleccionado), notas);
    onClose(); 
    setLoading(false);
  };

  if (!isOpen) return null;

  // 🟢 Definimos el contenido del modal como una constante
  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] border border-slate-200 overflow-hidden animate-fade-in-up text-slate-800">
        
        {/* ENCABEZADO DE ALERTA */}
        <div className="bg-rose-50 px-8 py-6 border-b border-rose-100 flex gap-4 items-start shrink-0">
            <div className="p-3 bg-white rounded-2xl text-rose-600 shadow-sm border border-rose-100">
                <Icons.Warning />
            </div>
            <div>
                <h3 className="font-serif font-bold text-xl text-rose-700 italic">Confirmar Cancelación</h3>
                <p className="text-rose-600/80 text-[11px] mt-1 leading-relaxed uppercase font-black tracking-wider">
                    Esta acción registrará la cita como no realizada. Por favor, documente la razón.
                </p>
            </div>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            {/* CUERPO DEL MODAL (Scrollable) */}
            <div className="p-8 space-y-6 overflow-y-auto flex-1 bg-slate-50/30">
                <div className="form-control">
                    <label className="label pt-0 pb-2">
                        <span className="label-text font-black text-[10px] text-slate-400 uppercase tracking-widest ml-1">Motivo Principal *</span>
                    </label>
                    <select 
                        className="select select-bordered w-full bg-white border-slate-200 focus:border-rose-500 font-bold text-slate-700 rounded-2xl shadow-sm transition-all" 
                        value={motivoSeleccionado}
                        onChange={e => setMotivoSeleccionado(e.target.value)}
                        required
                    >
                        <option value="">Seleccione una opción...</option>
                        {motivos.map(m => (
                            <option key={m.ID_MotivoCancelacion} value={m.ID_MotivoCancelacion}>
                                {m.Motivo}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-control">
                    <label className="label pt-0 pb-2">
                        <span className="label-text font-black text-[10px] text-slate-400 uppercase tracking-widest ml-1">Detalles Adicionales</span>
                    </label>
                    <textarea 
                        className="textarea textarea-bordered h-36 resize-none bg-white border-slate-200 focus:border-rose-500 text-sm text-slate-700 rounded-2xl shadow-inner transition-all" 
                        placeholder="Ej: El paciente tuvo un inconveniente de transporte..."
                        value={notas}
                        onChange={e => setNotas(e.target.value)}
                    ></textarea>
                </div>
            </div>

            {/* FOOTER DE ACCIONES */}
            <div className="px-8 py-6 bg-white border-t border-slate-100 flex justify-end gap-3 shrink-0">
                <button 
                    type="button" 
                    className="btn btn-ghost text-slate-400 hover:bg-slate-50 font-bold px-6 rounded-xl transition-colors" 
                    onClick={onClose}
                    disabled={loading}
                >
                    Mantener Cita
                </button>
                <button 
                    type="submit" 
                    className="btn bg-rose-600 hover:bg-rose-700 text-white border-none shadow-xl shadow-rose-200 px-8 font-bold rounded-xl transition-all" 
                    disabled={loading || !motivoSeleccionado}
                >
                    {loading ? <span className="loading loading-spinner loading-xs"></span> : 'Confirmar Cancelación'}
                </button>
            </div>
        </form>
      </div>
    </div>
  );

  // 🟢 Retornamos a través de Portal para saltar cualquier restricción de overflow del padre
  return createPortal(modalContent, document.getElementById("modal-root")!);
}