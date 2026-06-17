import type { TestAplicacionResumen } from '../../types';

interface Props {
  isOpen: boolean;
  resultado: TestAplicacionResumen | null;
  onClose: () => void;
}

const formatearFecha = (value?: string | null) => {
  if (!value) return 'N/A';

  const fecha = new Date(value);
  if (Number.isNaN(fecha.getTime())) return 'N/A';

  return fecha.toLocaleString('es-NI', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function TestResultadoModal({ isOpen, resultado, onClose }: Props) {
  if (!isOpen || !resultado) return null;

  const respuestas = resultado.Respuestas || [];

  return (
    <dialog className="modal modal-open bg-black/50 backdrop-blur-sm">
      <div className="modal-box w-11/12 max-w-4xl rounded-[2rem] bg-white p-0 text-slate-800 shadow-2xl">
        <div className="border-b border-slate-100 px-6 py-5">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-600">Resultado de test</p>
          <h3 className="mt-1 text-2xl font-black text-slate-950">{resultado.Test.Nombre}</h3>
          <p className="mt-2 text-sm text-slate-500">
            Resultado orientativo. No constituye diagnóstico automático. Debe ser interpretado por el psicólogo tratante.
          </p>
        </div>

        <div className="max-h-[70vh] space-y-5 overflow-y-auto p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Estado</p>
              <p className="mt-1 text-lg font-black text-slate-900">{resultado.Estado}</p>
            </div>
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-wide text-blue-500">Puntaje</p>
              <p className="mt-1 text-lg font-black text-blue-900">{resultado.PuntajeTotal ?? 'N/A'}</p>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-wide text-emerald-600">Nivel</p>
              <p className="mt-1 text-lg font-black text-emerald-900">{resultado.Nivel || 'N/A'}</p>
            </div>
            <div className={`rounded-2xl border p-4 ${resultado.TieneAlertaCritica ? 'border-rose-100 bg-rose-50' : 'border-slate-100 bg-slate-50'}`}>
              <p className={`text-[10px] font-black uppercase tracking-wide ${resultado.TieneAlertaCritica ? 'text-rose-600' : 'text-slate-400'}`}>Alerta</p>
              <p className={`mt-1 text-lg font-black ${resultado.TieneAlertaCritica ? 'text-rose-900' : 'text-slate-900'}`}>
                {resultado.TieneAlertaCritica ? 'Revisar' : 'Sin alerta'}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Interpretación orientativa</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
              {resultado.Interpretacion || 'Sin interpretación configurada.'}
            </p>
            <p className="mt-3 text-xs text-slate-400">Completado: {formatearFecha(resultado.CompletadoEn)}</p>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Respuestas</p>
            {respuestas.length > 0 ? (
              respuestas.map((respuesta) => (
                <div key={respuesta.ID_Respuesta} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <p className="text-sm font-bold text-slate-800">{respuesta.Pregunta.Texto}</p>
                    <span className="w-fit rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-black text-slate-600">
                      Valor {respuesta.Valor}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{respuesta.Opcion?.Texto || respuesta.TextoLibre || 'Sin detalle'}</p>
                  {respuesta.Pregunta.EsCritica && (
                    <p className="mt-2 text-xs font-bold text-rose-600">Pregunta marcada como crítica.</p>
                  )}
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-400">
                No hay respuestas registradas para mostrar.
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end border-t border-slate-100 bg-slate-50 px-6 py-4">
          <button type="button" className="btn border-slate-200 bg-white text-slate-700" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </dialog>
  );
}
