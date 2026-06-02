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
  Warning: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-6 h-6"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
};

export default function CancelarCitaModal({ isOpen, onClose, onConfirm }: Props) {
  const [motivos, setMotivos] = useState<MotivoCancelacion[]>([]);
  const [motivoSeleccionado, setMotivoSeleccionado] = useState('');
  const [notas, setNotas] = useState('');
  const [loading, setLoading] = useState(false);

  const limpiarFormulario = () => {
    setMotivoSeleccionado('');
    setNotas('');
  };

  const handleClose = () => {
    limpiarFormulario();
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;

    let activo = true;

    api.general.motivosCancelacion()
      .then((data) => {
        if (activo) {
          setMotivos(data);
        }
      })
      .catch(() => toast.error('Error cargando motivos'));

    return () => {
      activo = false;
    };
  }, [isOpen]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!motivoSeleccionado) {
      toast.error('Selecciona un motivo');
      return;
    }

    setLoading(true);
    onConfirm(Number(motivoSeleccionado), notas);
    limpiarFormulario();
    onClose();
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <dialog className="modal modal-open bg-slate-900/50 backdrop-blur-sm transition-all duration-200">
      <div className="modal-box w-full max-w-lg bg-white p-0 rounded-2xl shadow-2xl overflow-hidden">

        <div className="bg-rose-50 px-6 py-6 border-b border-rose-100 flex gap-4 items-start">
          <div className="p-3 bg-white rounded-full text-rose-600 shadow-sm border border-rose-100">
            <Icons.Warning />
          </div>

          <div>
            <h3 className="font-serif font-bold text-xl text-rose-700">
              Confirmar Cancelación
            </h3>
            <p className="text-rose-600/80 text-sm mt-1 leading-relaxed">
              Esta acción registrará la cita como no realizada. Por favor, documente la razón para las estadísticas.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-5">

            <div className="form-control">
              <label className="label pt-0 pb-1.5">
                <span className="label-text font-bold text-xs text-slate-500 uppercase tracking-wide">
                  Motivo Principal *
                </span>
              </label>

              <select
                className="select select-bordered w-full bg-white text-slate-700 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
                value={motivoSeleccionado}
                onChange={(event) => setMotivoSeleccionado(event.target.value)}
                required
              >
                <option value="">Seleccione una opción...</option>

                {motivos.map((motivo) => (
                  <option
                    key={motivo.ID_MotivoCancelacion}
                    value={motivo.ID_MotivoCancelacion}
                  >
                    {motivo.Motivo}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-control">
              <label className="label pt-0 pb-1.5">
                <span className="label-text font-bold text-xs text-slate-500 uppercase tracking-wide">
                  Detalles Adicionales
                </span>
              </label>

              <textarea
                className="textarea textarea-bordered h-32 resize-none bg-white text-slate-700 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
                placeholder="Ej: El paciente tuvo un inconveniente de transporte..."
                value={notas}
                onChange={(event) => setNotas(event.target.value)}
              />
            </div>
          </div>

          <div className="modal-action bg-slate-50 px-6 py-4 border-t border-slate-200 m-0 flex justify-end gap-3">
            <button
              type="button"
              className="btn btn-ghost text-slate-600 hover:bg-slate-200 font-medium"
              onClick={handleClose}
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
