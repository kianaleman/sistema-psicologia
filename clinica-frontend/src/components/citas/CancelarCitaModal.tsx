import { useState, useEffect } from 'react';
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

  // Cargar catálogo al abrir
  useEffect(() => {
    if (isOpen) {
      // Usamos la ruta sincronizada en el api.ts corregido
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
    // Nota: El setLoading(false) y onClose() los maneja usualmente el componente padre tras el onConfirm exitoso
    // pero mantenemos tu flujo funcional actual.
    onClose(); 
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <dialog className="modal modal-open bg-slate-900/50 backdrop-blur-sm transition-all duration-200">
      <div className="modal-box w-full max-w-lg bg-white p-0 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* --- ENCABEZADO DE ALERTA --- */}
        <div className="bg-rose-50 px-6 py-6 border-b border-rose-100 flex gap-4 items-start">
            <div className="p-3 bg-white rounded-full text-rose-600 shadow-sm border border-rose-100">
                <Icons.Warning />
            </div>
            <div>
                <h3 className="font-serif font-bold text-xl text-rose-700">Confirmar Cancelación</h3>
                <p className="text-rose-600/80 text-sm mt-1 leading-relaxed">
                    Esta acción registrará la cita como no realizada. Por favor, documente la razón para las estadísticas.
                </p>
            </div>
        </div>
        
        <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-5">
                
                {/* SELECTOR DE MOTIVO */}
                <div className="form-control">
                    <label className="label pt-0 pb-1.5">
                        <span className="label-text font-bold text-xs text-slate-500 uppercase tracking-wide">Motivo Principal *</span>
                    </label>
                    <select 
                        className="select select-bordered w-full bg-white text-slate-700 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all" 
                        value={motivoSeleccionado}
                        onChange={e => setMotivoSeleccionado(e.target.value)}
                        required
                    >
                        <option value="">Seleccione una opción...</option>
                        {motivos.map(m => (
                            // CORRECCIÓN: Usamos ID_MotivoCancelacion y Motivo (PascalCase del Backend)
                            <option key={m.ID_MotivoCancelacion} value={m.ID_MotivoCancelacion}>
                                {m.Motivo}
                            </option>
                        ))}
                    </select>
                </div>

                {/* TEXT AREA DETALLE */}
                <div className="form-control">
                    <label className="label pt-0 pb-1.5">
                        <span className="label-text font-bold text-xs text-slate-500 uppercase tracking-wide">Detalles Adicionales</span>
                    </label>
                    <textarea 
                        className="textarea textarea-bordered h-32 resize-none bg-white text-slate-700 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all" 
                        placeholder="Ej: El paciente tuvo un inconveniente de transporte..."
                        value={notas}
                        onChange={e => setNotas(e.target.value)}
                    ></textarea>
                </div>
            </div>

            {/* --- FOOTER DE ACCIONES --- */}
            <div className="modal-action bg-slate-50 px-6 py-4 border-t border-slate-200 m-0 flex justify-end gap-3">
                <button 
                    type="button" 
                    className="btn btn-ghost text-slate-600 hover:bg-slate-200 font-medium" 
                    onClick={onClose}
                    disabled={loading}
                >
                    Mantener Cita
                </button>
                <button 
                    type="submit" 
                    className="btn bg-rose-600 hover:bg-rose-700 text-white border-none shadow-md shadow-rose-500/20 px-6" 
                    disabled={loading || !motivoSeleccionado}
                >
                    {loading ? <span className="loading loading-spinner loading-xs"></span> : 'Confirmar Cancelación'}
                </button>
            </div>
        </form>
      </div>
    </dialog>
  );
}