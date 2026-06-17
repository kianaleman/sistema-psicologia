import { useState, useEffect, type FormEvent } from 'react';
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
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.7}
      stroke="currentColor"
      className="h-6 w-6"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4.25M12 16.5h.01" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.29 3.86L2.82 17.25A2.25 2.25 0 004.79 20.5h14.42a2.25 2.25 0 001.97-3.25L13.71 3.86a2 2 0 00-3.42 0z"
      />
    </svg>
  ),
  Clipboard: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.7}
      stroke="currentColor"
      className="h-5 w-5"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 3.75h6A2.25 2.25 0 0117.25 6v.75h.75A2.25 2.25 0 0120.25 9v9A2.25 2.25 0 0118 20.25H6A2.25 2.25 0 013.75 18V9A2.25 2.25 0 016 6.75h.75V6A2.25 2.25 0 019 3.75z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h7.5M8.25 11.25h7.5M8.25 14.25h7.5M8.25 17.25h4.5" />
    </svg>
  ),
  Check: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.7}
      stroke="currentColor"
      className="h-5 w-5"
    >
      <circle cx="12" cy="12" r="8.25" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.75 12.25l2.25 2.25 4.5-5" />
    </svg>
  ),
  X: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className="h-5 w-5"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  Note: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.7}
      stroke="currentColor"
      className="h-5 w-5"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3.75h6L19.5 9.75v10.5H7.5A3 3 0 014.5 17.25V6.75A3 3 0 017.5 3.75z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 3.75V9.75h6M8.25 14h7.5M8.25 17h5" />
    </svg>
  ),
};

export default function CancelarCitaModal({ isOpen, onClose, onConfirm }: Props) {
  const [motivos, setMotivos] = useState<MotivoCancelacion[]>([]);
  const [motivoSeleccionado, setMotivoSeleccionado] = useState('');
  const [notas, setNotas] = useState('');
  const [loading, setLoading] = useState(false);
  const [cargandoMotivos, setCargandoMotivos] = useState(false);

  const motivoActual = motivos.find(
    (motivo) => motivo.ID_MotivoCancelacion.toString() === motivoSeleccionado
  );

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

    setCargandoMotivos(true);

    api.general.motivosCancelacion()
      .then((data) => {
        if (activo) {
          setMotivos(data);
        }
      })
      .catch(() => toast.error('Error cargando motivos'))
      .finally(() => {
        if (activo) {
          setCargandoMotivos(false);
        }
      });

    return () => {
      activo = false;
    };
  }, [isOpen]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!motivoSeleccionado) {
      toast.error('Selecciona un motivo');
      return;
    }

    setLoading(true);
    onConfirm(Number(motivoSeleccionado), notas.trim());
    limpiarFormulario();
    onClose();
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <dialog className="modal modal-open bg-slate-950/50 backdrop-blur-sm">
      <div className="modal-box grid h-[90vh] w-11/12 max-w-2xl grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-[2rem] bg-white p-0 text-slate-800 shadow-2xl">
        <div className="relative overflow-hidden bg-slate-950 px-6 py-5 text-white">
          <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-rose-500/25 blur-3xl"></div>
          <div className="absolute -bottom-24 left-10 h-56 w-56 rounded-full bg-amber-400/15 blur-3xl"></div>

          <div className="relative z-10 flex items-start justify-between gap-4">
            <div className="flex min-w-0 gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-rose-400/20 bg-rose-500/15 text-rose-200">
                <Icons.Warning />
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-rose-300">
                  Cancelación de cita
                </p>
                <h3 className="mt-1 font-serif text-2xl font-black tracking-tight text-white">
                  Confirmar cancelación
                </h3>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-300">
                  Esta acción registrará la cita como no realizada. Selecciona el motivo para mantener el historial clínico y administrativo consistente.
                </p>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-sm btn-circle border-white/10 bg-white/10 text-white hover:bg-white/20"
              onClick={handleClose}
              disabled={loading}
            >
              <Icons.X />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="contents">
          <div className="min-h-0 space-y-5 overflow-y-auto bg-slate-50/70 p-6">
            <div className="rounded-3xl border border-rose-100 bg-rose-50 p-4 text-rose-800">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-rose-600 shadow-sm">
                  <Icons.Warning />
                </span>

                <div>
                  <p className="text-sm font-black">Revisión requerida antes de cancelar</p>
                  <p className="mt-1 text-sm leading-relaxed text-rose-700/80">
                    La cita dejará de figurar como pendiente. El motivo seleccionado se usará para reportes y estadísticas.
                  </p>
                </div>
              </div>
            </div>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-rose-600">
                    <Icons.Clipboard />
                    Motivo principal
                  </p>
                  <h4 className="mt-1 text-lg font-black text-slate-900">Clasificación de la cancelación</h4>
                </div>

                {motivoActual && (
                  <span className="rounded-full border border-rose-100 bg-rose-50 px-3 py-1 text-xs font-black text-rose-700">
                    Seleccionado
                  </span>
                )}
              </div>

              <select
                className="select select-bordered h-12 w-full rounded-2xl bg-slate-50 text-sm font-medium transition-colors focus:bg-white focus:border-rose-500"
                value={motivoSeleccionado}
                onChange={(event) => setMotivoSeleccionado(event.target.value)}
                required
                disabled={cargandoMotivos || loading}
              >
                <option value="">
                  {cargandoMotivos ? 'Cargando motivos...' : 'Seleccione una opción...'}
                </option>

                {motivos.map((motivo) => (
                  <option
                    key={motivo.ID_MotivoCancelacion}
                    value={motivo.ID_MotivoCancelacion}
                  >
                    {motivo.Motivo}
                  </option>
                ))}
              </select>

              {motivoActual && (
                <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                    Motivo seleccionado
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-700">{motivoActual.Motivo}</p>
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4">
                <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
                  <Icons.Note />
                  Detalles adicionales
                </p>
                <h4 className="mt-1 text-lg font-black text-slate-900">Notas internas</h4>
                <p className="mt-1 text-sm font-medium text-slate-400">
                  Opcional. Usa este espacio para registrar contexto útil para seguimiento administrativo.
                </p>
              </div>

              <textarea
                className="textarea textarea-bordered min-h-36 w-full resize-none rounded-3xl bg-slate-50 text-sm leading-relaxed transition-colors focus:bg-white focus:border-rose-500"
                placeholder="Ej: El paciente tuvo un inconveniente de transporte..."
                value={notas}
                maxLength={500}
                onChange={(event) => setNotas(event.target.value)}
                disabled={loading}
              />

              <div className="mt-2 flex justify-end">
                <span className="text-xs font-medium text-slate-400">{notas.length}/500</span>
              </div>
            </section>
          </div>

          <div className="z-10 flex flex-col gap-3 border-t border-slate-200 bg-white px-6 py-4 shadow-[0_-12px_30px_rgba(15,23,42,0.08)] sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-medium text-slate-400">
              Puedes cerrar este cuadro para mantener la cita sin cambios.
            </p>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <button
                type="button"
                className="btn w-full rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-100 sm:w-auto"
                onClick={handleClose}
                disabled={loading}
              >
                Mantener cita
              </button>

              <button
                type="submit"
                className="btn w-full rounded-xl border-none bg-rose-600 px-6 text-white shadow-lg shadow-rose-500/20 hover:bg-rose-700 sm:w-auto"
                disabled={loading || cargandoMotivos || !motivoSeleccionado}
              >
                {loading ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Procesando...
                  </>
                ) : (
                  <>
                    <Icons.Check />
                    Confirmar cancelación
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </dialog>
  );
}
