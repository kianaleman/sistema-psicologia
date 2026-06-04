import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useTestsPsicologicos } from '../../hooks/useTestsPsicologicos';
import type { CrearAplicacionTestResponse, TestAplicacionResumen, TestContexto } from '../../types';
import TestAplicarModal from './TestAplicarModal';
import TestResultadoModal from './TestResultadoModal';

interface Props {
  idPaciente: number;
  idSesion?: number | null;
  contexto?: TestContexto;
  compacto?: boolean;
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

const getEstadoClass = (estado: string) => {
  if (estado === 'COMPLETADO') return 'border-emerald-100 bg-emerald-50 text-emerald-700';
  if (estado === 'PENDIENTE') return 'border-blue-100 bg-blue-50 text-blue-700';
  if (estado === 'VENCIDO') return 'border-amber-100 bg-amber-50 text-amber-700';
  if (estado === 'ANULADO') return 'border-slate-200 bg-slate-100 text-slate-600';

  return 'border-slate-200 bg-slate-50 text-slate-600';
};

export default function TestHistorialPaciente({
  idPaciente,
  idSesion = null,
  contexto = 'FUERA_SESION',
  compacto = false,
}: Props) {
  const {
    resultados,
    loadingResultados,
    cargarResultadosPaciente,
    cargarResultadosSesion,
    anularAplicacion,
  } = useTestsPsicologicos({ autoLoad: false });

  const [modalAplicarOpen, setModalAplicarOpen] = useState(false);
  const [resultadoSeleccionado, setResultadoSeleccionado] = useState<TestAplicacionResumen | null>(null);

  const cargarResultados = async () => {
    if (idSesion) {
      await cargarResultadosSesion(idSesion);
      return;
    }

    await cargarResultadosPaciente(idPaciente);
  };

  useEffect(() => {
    void cargarResultados();
  }, [idPaciente, idSesion]);

  const handleCreado = async (_result: CrearAplicacionTestResponse) => {
    if (idSesion) {
      await cargarResultadosSesion(idSesion);
      return;
    }

    await cargarResultadosPaciente(idPaciente);
  };

  const handleAnular = async (idAplicacion: number) => {
    const confirmar = window.confirm('¿Deseas anular esta aplicación de test? El enlace dejará de estar disponible.');
    if (!confirmar) return;

    const result = await anularAplicacion(idAplicacion);
    if (!result) return;

    toast.success('Test anulado correctamente.');
    await cargarResultados();
  };

  return (
    <section className={compacto ? 'space-y-4' : 'rounded-[2rem] border border-white/80 bg-white shadow-sm'}>
      <div className={compacto ? 'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between' : 'flex flex-col gap-3 border-b border-slate-100 px-6 py-6 sm:flex-row sm:items-center sm:justify-between'}>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-600">Tests psicológicos</p>
          <h2 className="mt-1 text-2xl font-black text-slate-900">
            {idSesion ? 'Tests aplicados en sesión' : 'Historial de tests'}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Herramientas de apoyo para seguimiento clínico. La interpretación final corresponde al psicólogo.
          </p>
        </div>

        <button
          type="button"
          className="btn rounded-2xl bg-slate-950 text-white hover:bg-slate-800"
          onClick={() => setModalAplicarOpen(true)}
        >
          Aplicar test
        </button>
      </div>

      <div className={compacto ? 'space-y-3' : 'p-5'}>
        {loadingResultados ? (
          <div className="flex items-center justify-center rounded-[1.5rem] border border-slate-100 bg-slate-50 px-6 py-12">
            <span className="loading loading-spinner loading-md text-primary" />
          </div>
        ) : resultados.length > 0 ? (
          <div className="space-y-4">
            {resultados.map((resultado) => (
              <article
                key={resultado.ID_Aplicacion}
                className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-blue-100 hover:shadow-lg hover:shadow-slate-200/70"
              >
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_180px_150px_150px] xl:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-black text-slate-950">{resultado.Test.Nombre}</h3>
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black text-slate-600">
                        {resultado.Test.Categoria}
                      </span>
                      {resultado.TieneAlertaCritica && (
                        <span className="rounded-full border border-rose-100 bg-rose-50 px-3 py-1 text-xs font-black text-rose-700">
                          Alerta clínica
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-slate-500">
                      Contexto: {resultado.Contexto === 'EN_SESION' ? 'Dentro de sesión' : 'Fuera de sesión'} · Creado: {formatearFecha(resultado.FechaCreacion)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                    <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Estado</p>
                    <span className={`mt-1 inline-flex rounded-full border px-3 py-1 text-xs font-black ${getEstadoClass(resultado.Estado)}`}>
                      {resultado.Estado}
                    </span>
                  </div>

                  <div className="rounded-2xl border border-blue-100 bg-blue-50 p-3">
                    <p className="text-[10px] font-black uppercase tracking-wide text-blue-500">Puntaje</p>
                    <p className="mt-1 text-sm font-black text-blue-900">{resultado.PuntajeTotal ?? 'Pendiente'}</p>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row xl:flex-col">
                    <button
                      type="button"
                      className="btn btn-sm border-slate-200 bg-white text-slate-700"
                      onClick={() => setResultadoSeleccionado(resultado)}
                    >
                      Ver detalle
                    </button>
                    {resultado.Estado === 'PENDIENTE' && (
                      <button
                        type="button"
                        className="btn btn-sm border-rose-100 bg-rose-50 text-rose-600 hover:bg-rose-100"
                        onClick={() => handleAnular(resultado.ID_Aplicacion)}
                      >
                        Anular
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-6 py-20 text-center">
            <p className="text-lg font-black text-slate-700">No hay tests registrados</p>
            <p className="mt-2 max-w-md text-sm text-slate-400">
              Puedes generar un enlace público para que el paciente responda el test sin crear un portal.
            </p>
          </div>
        )}
      </div>

      <TestAplicarModal
        isOpen={modalAplicarOpen}
        onClose={() => setModalAplicarOpen(false)}
        idPaciente={idPaciente}
        idSesion={idSesion}
        contexto={contexto}
        onCreado={handleCreado}
      />

      <TestResultadoModal
        isOpen={Boolean(resultadoSeleccionado)}
        resultado={resultadoSeleccionado}
        onClose={() => setResultadoSeleccionado(null)}
      />
    </section>
  );
}
