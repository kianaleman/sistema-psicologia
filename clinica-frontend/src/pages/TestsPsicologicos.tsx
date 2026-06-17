import { useTestsPsicologicos } from '../hooks/useTestsPsicologicos';

const getEstadoClass = (activo: boolean) => activo
  ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
  : 'border-slate-200 bg-slate-100 text-slate-600';

export default function TestsPsicologicos() {
  const { tests, loadingTests, cargarTests } = useTestsPsicologicos();
  const activos = tests.filter((test) => test.Activo).length;
  const totalPreguntas = tests.reduce((total, test) => total + (test._count?.Preguntas || test.Preguntas?.length || 0), 0);

  return (
    <div className="mx-auto max-w-[1500px] animate-fade-in-up space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-slate-950 px-6 py-7 text-white shadow-2xl shadow-slate-200/80 sm:px-8">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-500/25 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-blue-300">Módulo clínico</p>
            <h1 className="mt-2 font-serif text-4xl font-black tracking-tight">Tests Psicológicos</h1>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-300">
              Catálogo de instrumentos de apoyo clínico. Los resultados son orientativos y deben ser interpretados por el psicólogo tratante.
            </p>
          </div>

          <button
            type="button"
            className="btn rounded-2xl border-white/10 bg-white text-slate-950 shadow-xl hover:border-white hover:bg-slate-100"
            onClick={() => void cargarTests()}
          >
            Actualizar
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-white/80 bg-white p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Tests</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{tests.length}</p>
          <p className="mt-1 text-xs font-medium text-slate-400">Registrados</p>
        </div>
        <div className="rounded-3xl border border-white/80 bg-white p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Activos</p>
          <p className="mt-2 text-3xl font-black text-emerald-700">{activos}</p>
          <p className="mt-1 text-xs font-medium text-slate-400">Disponibles para aplicar</p>
        </div>
        <div className="rounded-3xl border border-white/80 bg-white p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Preguntas</p>
          <p className="mt-2 text-3xl font-black text-blue-700">{totalPreguntas}</p>
          <p className="mt-1 text-xs font-medium text-slate-400">En el catálogo</p>
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/80 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-6">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-600">Catálogo</p>
          <h2 className="mt-1 text-2xl font-black text-slate-900">Tests disponibles</h2>
        </div>

        <div className="p-5">
          {loadingTests ? (
            <div className="flex items-center justify-center rounded-[1.5rem] border border-slate-100 bg-slate-50 px-6 py-16">
              <span className="loading loading-spinner loading-lg text-primary" />
            </div>
          ) : tests.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {tests.map((test) => (
                <article key={test.ID_Test} className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xl font-black text-slate-950">{test.Nombre}</h3>
                        <span className={`rounded-full border px-3 py-1 text-xs font-black ${getEstadoClass(test.Activo)}`}>
                          {test.Activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-bold text-blue-700">{test.Categoria} · {test.Codigo}</p>
                      <p className="mt-3 text-sm leading-relaxed text-slate-500">{test.Descripcion || 'Sin descripción registrada.'}</p>
                    </div>

                    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-center">
                      <p className="text-2xl font-black text-slate-950">{test._count?.Preguntas || test.Preguntas?.length || 0}</p>
                      <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Preguntas</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-6 py-20 text-center">
              <p className="text-lg font-black text-slate-700">No hay tests configurados</p>
              <p className="mx-auto mt-2 max-w-lg text-sm text-slate-400">
                Carga tests base desde migración, seed o endpoint administrativo antes de aplicar evaluaciones a pacientes.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
