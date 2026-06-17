import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import type { RespuestaTestPublicoDTO, TestPublicoResponse, TestPregunta, ResponderTestPublicoResponse } from '../types';

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

export default function TestPublico() {
  const { token = '' } = useParams();
  const [data, setData] = useState<TestPublicoResponse | null>(null);
  const [respuestas, setRespuestas] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResponderTestPublicoResponse | null>(null);

  useEffect(() => {
    let mounted = true;

    const cargar = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.tests.getPublico(token);
        if (!mounted) return;
        setData(response);
      } catch (err: unknown) {
        if (!mounted) return;
        const message = err instanceof Error ? err.message : 'No se pudo cargar el test.';
        setError(message);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void cargar();

    return () => {
      mounted = false;
    };
  }, [token]);

  const preguntas = useMemo<TestPregunta[]>(() => data?.Test.Preguntas || [], [data]);
  const respondidas = preguntas.filter((pregunta) => respuestas[pregunta.ID_Pregunta]).length;
  const progreso = preguntas.length > 0 ? Math.round((respondidas / preguntas.length) * 100) : 0;
  const completo = preguntas.length > 0 && respondidas === preguntas.length;

  const handleEnviar = async () => {
    if (!data) return;

    if (!completo) {
      setError('Debe responder todas las preguntas antes de enviar el test.');
      return;
    }

    const payload: RespuestaTestPublicoDTO[] = preguntas.map((pregunta) => {
      const idOpcion = respuestas[pregunta.ID_Pregunta];
      const opcion = pregunta.Opciones.find((item) => item.ID_Opcion === idOpcion);

      return {
        ID_Pregunta: pregunta.ID_Pregunta,
        ID_Opcion: idOpcion,
        Valor: opcion?.Valor ?? null,
      };
    });

    try {
      setEnviando(true);
      setError(null);
      const response = await api.tests.responderPublico(token, payload);
      setResultado(response);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'No se pudieron guardar las respuestas.';
      setError(message);
    } finally {
      setEnviando(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="rounded-[2rem] border border-white/80 bg-white px-12 py-10 text-center shadow-xl">
          <span className="loading loading-spinner loading-lg text-primary" />
          <p className="mt-4 text-sm font-medium text-slate-400">Cargando test psicológico...</p>
        </div>
      </main>
    );
  }

  if (resultado) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
        <section className="w-full max-w-2xl rounded-[2rem] border border-white/80 bg-white p-8 text-center shadow-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-700">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-8 w-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
            </svg>
          </div>
          <h1 className="mt-5 text-3xl font-black text-slate-950">Test enviado correctamente</h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-slate-500">
            {resultado.mensaje || 'El resultado será revisado por el psicólogo tratante.'}
          </p>
          <div className="mt-6 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-900">
            No cierre una emergencia clínica con este resultado. Ante malestar intenso o riesgo inmediato, debe contactar al profesional tratante o servicios de emergencia.
          </div>
        </section>
      </main>
    );
  }

  if (error && !data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
        <section className="w-full max-w-xl rounded-[2rem] border border-rose-100 bg-white p-8 text-center shadow-xl">
          <h1 className="text-2xl font-black text-rose-700">Test no disponible</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-500">{error}</p>
        </section>
      </main>
    );
  }

  if (!data) return null;

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <section className="rounded-[2rem] border border-white/80 bg-slate-950 p-6 text-white shadow-2xl shadow-slate-200/80 sm:p-8">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-blue-300">Clínica Resiliencia</p>
          <h1 className="mt-2 font-serif text-3xl font-black tracking-tight sm:text-4xl">{data.Test.Nombre}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-300">
            {data.Test.Instrucciones || data.Test.Descripcion || 'Lea cada pregunta y seleccione la opción que mejor describa su situación.'}
          </p>
          <div className="mt-5 rounded-2xl border border-white/10 bg-white/10 p-4 text-sm text-slate-200">
            {data.aviso}
          </div>
          <p className="mt-4 text-xs font-semibold text-slate-400">Vence: {formatearFecha(data.ExpiraEn)}</p>
        </section>

        <section className="rounded-[2rem] border border-white/80 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between text-xs font-black uppercase tracking-wide text-slate-400">
              <span>Progreso</span>
              <span>{progreso}%</span>
            </div>
            <progress className="progress progress-primary mt-2 w-full" value={progreso} max={100} />
          </div>

          {error && (
            <div className="mb-5 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">
              {error}
            </div>
          )}

          <div className="space-y-5">
            {preguntas.map((pregunta, index) => (
              <article key={pregunta.ID_Pregunta} className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex gap-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black text-white">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base font-black text-slate-900">{pregunta.Texto}</h2>
                    <div className="mt-4 grid grid-cols-1 gap-3">
                      {pregunta.Opciones.map((opcion) => {
                        const selected = respuestas[pregunta.ID_Pregunta] === opcion.ID_Opcion;

                        return (
                          <button
                            key={opcion.ID_Opcion}
                            type="button"
                            className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition-all ${selected ? 'border-blue-500 bg-blue-50 text-blue-800 shadow-sm' : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-blue-200 hover:bg-blue-50/50'}`}
                            onClick={() => setRespuestas((prev) => ({ ...prev, [pregunta.ID_Pregunta]: opcion.ID_Opcion }))}
                            disabled={enviando}
                          >
                            {opcion.Texto}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-slate-500">
              Respondidas: {respondidas} de {preguntas.length}
            </p>
            <button
              type="button"
              className="btn rounded-2xl bg-slate-950 px-8 text-white hover:bg-slate-800"
              onClick={handleEnviar}
              disabled={enviando || !completo}
            >
              {enviando ? <span className="loading loading-spinner loading-sm" /> : 'Enviar respuestas'}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
