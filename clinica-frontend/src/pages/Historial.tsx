import { useHistorial, type RegistroHistorial } from '../hooks/useHistorial';

const Icons = {
  Search: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path
        fillRule="evenodd"
        d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
        clipRule="evenodd"
      />
    </svg>
  ),
  History: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-6 w-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5v5l3.25 2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12a8.25 8.25 0 101.85-5.2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.5v4.25H8" />
    </svg>
  ),
  FileText: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3.75h6L19.5 9.75v10.5H7.5A3 3 0 014.5 17.25V6.75A3 3 0 017.5 3.75z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 3.75V9.75h6M8.25 13.5h7.5M8.25 16.5h5.25" />
    </svg>
  ),
  Empty: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" className="h-12 w-12">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3.75h6L19.5 9.75v10.5H7.5A3 3 0 014.5 17.25V6.75A3 3 0 017.5 3.75z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 3.75V9.75h6M8.25 13.5h7.5M8.25 16.5h5.25" />
    </svg>
  ),
  User: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-5 w-5">
      <circle cx="12" cy="8" r="3.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 21a7 7 0 0114 0" />
    </svg>
  ),
  Doctor: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-5 w-5">
      <circle cx="12" cy="7.5" r="3.75" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 20.25a7.5 7.5 0 0115 0" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5v3M10.5 18h3" />
    </svg>
  ),
  Diagnosis: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75l2.25 2.25L15.75 9.75" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s7-3.75 7-10.5V5.25L12 3 5 5.25v5.25C5 17.25 12 21 12 21z" />
    </svg>
  ),
  Calendar: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 3v3M17 3v3M4.5 8.25h15M5.25 5.25h13.5A1.5 1.5 0 0120.25 6.75v12A1.5 1.5 0 0118.75 20.25H5.25A1.5 1.5 0 013.75 18.75v-12A1.5 1.5 0 015.25 5.25z" />
    </svg>
  ),
  Close: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
};

function formatearFecha(fecha?: string | null) {
  if (!fecha) return 'Fecha no disponible';

  const fechaPura = fecha.toString().split('T')[0];
  const partes = fechaPura.split('-');

  if (partes.length !== 3) return 'Fecha no disponible';

  const fechaObj = new Date(
    Number(partes[0]),
    Number(partes[1]) - 1,
    Number(partes[2])
  );

  if (Number.isNaN(fechaObj.getTime())) return 'Fecha no disponible';

  return fechaObj.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getNombrePaciente(registro: RegistroHistorial) {
  const nombre = registro.Paciente?.Nombre || '';
  const apellido = registro.Paciente?.Apellido || '';
  const nombreCompleto = `${nombre} ${apellido}`.trim();

  return nombreCompleto || 'Paciente no disponible';
}

function getNacionalidad(registro: RegistroHistorial) {
  return (
    registro.Paciente?.Pais?.Nacionalidad ||
    registro.Paciente?.Nacionalidad ||
    registro.Paciente?.Pais?.Nombre_Pais ||
    'N/A'
  );
}

function getNombrePsicologo(registro: RegistroHistorial) {
  const nombre = registro.Psicologo?.Nombre || '';
  const apellido = registro.Psicologo?.Apellido || '';
  const nombreCompleto = `${nombre} ${apellido}`.trim();

  return nombreCompleto || 'Especialista no disponible';
}

function abrirModalNota(idSesion: number) {
  const modal = document.getElementById(`modal_nota_${idSesion}`);

  if (modal instanceof HTMLDialogElement) {
    modal.showModal();
  }
}

export default function Historial() {
  const { registros, loading, busqueda, setBusqueda } = useHistorial();

  const registrosConDiagnostico = registros.filter((registro) => Boolean(registro.DiagnosticoDiferencial)).length;
  const pacientesUnicos = new Set(
    registros
      .map(getNombrePaciente)
      .filter((nombre) => nombre !== 'Paciente no disponible')
  ).size;
  const especialistasUnicos = new Set(
    registros
      .map(getNombrePsicologo)
      .filter((nombre) => nombre !== 'Especialista no disponible')
  ).size;

  return (
    <div className="mx-auto max-w-[1700px] animate-fade-in-up space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-slate-950 px-6 py-7 text-white shadow-2xl shadow-slate-200/80 sm:px-8">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-500/25 blur-3xl"></div>
        <div className="absolute -bottom-28 left-14 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl"></div>

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-blue-300">
              Archivo clínico
            </p>
            <h1 className="mt-2 font-serif text-3xl font-black tracking-tight sm:text-4xl">
              Historial Clínico
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
              Registro consolidado de atenciones, diagnósticos, evolución clínica y notas por sesión.
            </p>
          </div>

          <div className="relative w-full lg:w-[420px]">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
              <Icons.Search />
            </div>
            <input
              type="text"
              className="input h-12 w-full rounded-2xl border-white/10 bg-white/10 pl-11 text-sm font-medium text-white placeholder:text-slate-400 focus:border-blue-300 focus:bg-white/15"
              placeholder="Buscar paciente, expediente o diagnóstico..."
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-white/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Registros</p>
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-50 text-slate-500">
              <Icons.History />
            </span>
          </div>
          <p className="mt-2 text-3xl font-black text-slate-950">{registros.length}</p>
          <p className="mt-1 text-xs font-medium text-slate-400">Resultado actual</p>
        </div>

        <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500">Pacientes</p>
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-blue-600">
              <Icons.User />
            </span>
          </div>
          <p className="mt-2 text-3xl font-black text-blue-700">{pacientesUnicos}</p>
          <p className="mt-1 text-xs font-medium text-blue-500/70">Pacientes en historial</p>
        </div>

        <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500">Diagnósticos</p>
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-emerald-600">
              <Icons.Diagnosis />
            </span>
          </div>
          <p className="mt-2 text-3xl font-black text-emerald-700">{registrosConDiagnostico}</p>
          <p className="mt-1 text-xs font-medium text-emerald-500/70">Con diagnóstico registrado</p>
        </div>

        <div className="rounded-3xl border border-amber-100 bg-amber-50 p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500">Especialistas</p>
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-amber-600">
              <Icons.Doctor />
            </span>
          </div>
          <p className="mt-2 text-3xl font-black text-amber-700">{especialistasUnicos}</p>
          <p className="mt-1 text-xs font-medium text-amber-500/70">Participación clínica</p>
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/80 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-600">Expedientes</p>
              <h2 className="mt-1 text-2xl font-black text-slate-900">Registros de atención</h2>
              <p className="mt-1 text-sm font-medium text-slate-400">
                {registros.length} resultado(s) encontrados
              </p>
            </div>

            <div className="relative w-full xl:w-[420px]">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                <Icons.Search />
              </div>
              <input
                type="text"
                className="input input-bordered h-12 w-full rounded-2xl bg-slate-50 pl-11 text-sm font-medium transition-colors focus:bg-white"
                placeholder="Filtrar historial..."
                value={busqueda}
                onChange={(event) => setBusqueda(event.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="p-5">
          {loading && (
            <div className="rounded-[1.5rem] border border-slate-100 bg-slate-50 py-24 text-center">
              <span className="loading loading-spinner loading-lg text-primary"></span>
              <p className="mt-4 animate-pulse text-sm text-slate-400">Cargando historial...</p>
            </div>
          )}

          {!loading && registros.length > 0 && (
            <div className="space-y-4">
              {registros.map((reg) => {
                const nombrePaciente = getNombrePaciente(reg);
                const nacionalidad = getNacionalidad(reg);
                const nombrePsicologo = getNombrePsicologo(reg);
                const tipoCita = reg.DatosCita?.Tipo || 'N/A';
                const motivoConsulta = reg.DatosCita?.Motivo || 'Sin motivo registrado';

                return (
                  <article
                    key={reg.ID_Sesion}
                    className="group overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-xl hover:shadow-slate-200/70"
                  >
                    <div className="grid grid-cols-1 gap-5 p-5 xl:grid-cols-[160px_minmax(0,1.4fr)_minmax(0,1.25fr)_minmax(0,1.25fr)_190px] xl:items-center">
                      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm">
                          <Icons.Calendar />
                        </span>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Fecha</p>
                          <p className="mt-0.5 whitespace-nowrap text-sm font-black text-slate-700">
                            {formatearFecha(reg.FechaReal)}
                          </p>
                        </div>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-700 shadow-sm">
                            <Icons.User />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-lg font-black leading-tight text-slate-950 transition-colors group-hover:text-blue-700" title={nombrePaciente}>
                              {nombrePaciente}
                            </p>
                            <div className="mt-2 flex min-w-0 flex-wrap items-center gap-2">
                              <span className="inline-flex max-w-full shrink-0 items-center rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-[10px] font-black text-slate-600">
                                EXP: {reg.Expediente?.No_Expediente || 'S/E'}
                              </span>
                              <span className="max-w-[130px] truncate text-[10px] font-bold uppercase tracking-wide text-slate-400" title={nacionalidad}>
                                {nacionalidad}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="min-w-0 rounded-2xl bg-slate-50 p-4">
                        <p className="mb-2 w-fit max-w-full truncate rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-blue-700">
                          {tipoCita}
                        </p>
                        <p className="line-clamp-2 text-sm font-medium leading-relaxed text-slate-600" title={motivoConsulta}>
                          {motivoConsulta}
                        </p>
                      </div>

                      <div className="min-w-0">
                        {reg.DiagnosticoDiferencial ? (
                          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-3">
                            <p className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">Diagnóstico</p>
                            <p className="line-clamp-2 text-sm font-medium leading-relaxed text-emerald-900" title={reg.DiagnosticoDiferencial}>
                              {reg.DiagnosticoDiferencial}
                            </p>
                          </div>
                        ) : (
                          <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-400">
                            Diagnóstico pendiente
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-3 xl:justify-end">
                        <div className="min-w-0">
                          <p className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Especialista</p>
                          <div className="flex min-w-0 items-center gap-2 text-xs font-medium text-slate-500">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                              <Icons.Doctor />
                            </div>
                            <span className="truncate" title={nombrePsicologo}>
                              {nombrePsicologo}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="btn btn-sm shrink-0 rounded-xl border-blue-100 bg-blue-50 text-blue-700 hover:border-blue-200 hover:bg-blue-100"
                          onClick={() => abrirModalNota(reg.ID_Sesion)}
                        >
                          <Icons.FileText />
                          Ver
                        </button>
                      </div>
                    </div>

                    <dialog id={`modal_nota_${reg.ID_Sesion}`} className="modal modal-bottom text-left backdrop-blur-sm sm:modal-middle">
                      <div className="modal-box max-w-4xl overflow-hidden rounded-[2rem] bg-white p-0">
                        <div className="border-b border-slate-100 bg-slate-950 px-6 py-5 text-white">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-300">Nota clínica</p>
                              <h3 className="mt-1 truncate text-2xl font-black text-white">{nombrePaciente}</h3>
                              <p className="mt-1 truncate text-xs font-medium text-slate-400">
                                {formatearFecha(reg.FechaReal)} · {reg.Expediente?.No_Expediente || 'Sin expediente'}
                              </p>
                            </div>
                            <form method="dialog">
                              <button className="btn btn-sm btn-circle border-white/10 bg-white/10 text-white hover:bg-white/20">
                                <Icons.Close />
                              </button>
                            </form>
                          </div>
                        </div>

                        <div className="max-h-[68vh] overflow-y-auto p-6">
                          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                            <section className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
                              <h4 className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-slate-500">Motivo de consulta</h4>
                              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                                {motivoConsulta}
                              </p>
                            </section>

                            <section className="rounded-3xl border border-blue-100 bg-blue-50/70 p-5">
                              <h4 className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-blue-700">Diagnóstico diferencial</h4>
                              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                                {reg.DiagnosticoDiferencial || 'Sin diagnóstico registrado.'}
                              </p>
                            </section>

                            <section className="rounded-3xl border border-slate-100 bg-white p-5 lg:col-span-2">
                              <h4 className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-slate-500">Observaciones clínicas</h4>
                              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                                {reg.Observaciones || 'Sin notas registradas.'}
                              </p>
                            </section>

                            <section className="rounded-3xl border border-amber-100 bg-amber-50 p-5 lg:col-span-2">
                              <h4 className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-amber-700">Historial de evolución</h4>
                              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                                {reg.HistorialDeEvolucion || 'Sin evolución registrada.'}
                              </p>
                            </section>

                            {reg.Criterios_DeDiagnostico && (
                              <section className="rounded-3xl border border-slate-100 bg-slate-50 p-5 lg:col-span-2">
                                <h4 className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-slate-500">Criterios de diagnóstico</h4>
                                <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                                  {reg.Criterios_DeDiagnostico}
                                </p>
                              </section>
                            )}
                          </div>
                        </div>

                        <div className="flex justify-end border-t border-slate-100 bg-slate-50 px-6 py-4">
                          <form method="dialog">
                            <button className="btn btn-sm rounded-xl bg-slate-950 px-6 text-white hover:bg-slate-800">Cerrar</button>
                          </form>
                        </div>
                      </div>
                      <form method="dialog" className="modal-backdrop"><button>close</button></form>
                    </dialog>
                  </article>
                );
              })}
            </div>
          )}

          {!loading && registros.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-6 py-24 text-center">
              <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-white text-slate-300 shadow-sm">
                <Icons.Empty />
              </div>
              <p className="text-lg font-black text-slate-700">No se encontraron registros</p>
              <p className="mt-2 max-w-sm text-sm font-medium text-slate-400">
                Intenta buscar por otro paciente, expediente o diagnóstico.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
