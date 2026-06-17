import { useState, type FormEvent } from 'react';
import { useTutores, type TutorCompleto } from '../hooks/useTutores';
import TutorFormModal from '../components/tutores/TutorFormModal';
import PacientesListModal from '../components/tutores/PacientesListModal';

type CatalogoOcupacion = {
  ID_Ocupacion: number;
  Nombre_DeOcupacion: string;
};

type CatalogoEstadoCivil = {
  ID_EstadoCivil: number;
  Nombre_EstadoCivil: string;
};

type TutorConRelacionesCompatibles = TutorCompleto & {
  Ocupacion?: number | string | null;
  EstadoCivil?: number | string | null;
  Ocupacion_Tutor?: CatalogoOcupacion | null;
  EstadoCivil_Tutor?: CatalogoEstadoCivil | null;
  Ocupacion_Tutor_OcupacionToOcupacion?: CatalogoOcupacion | null;
  EstadoCivil_Tutor_EstadoCivilToEstadoCivil?: CatalogoEstadoCivil | null;
};

const Icons = {
  UserGroup: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-6 w-6">
      <circle cx="8.5" cy="8" r="3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 20a5.75 5.75 0 0111.5 0" />
      <circle cx="17" cy="10.25" r="2.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 16.25A4.5 4.5 0 0120.25 20" />
    </svg>
  ),
  Search: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path
        fillRule="evenodd"
        d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
        clipRule="evenodd"
      />
    </svg>
  ),
  Edit: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
      <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
    </svg>
  ),
  Eye: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
      <path
        fillRule="evenodd"
        d="M.328 10.05a.75.75 0 010-.1C2.828 5.95 6.102 3.75 10 3.75s7.172 2.2 9.672 6.2a.75.75 0 010 .1c-2.5 4-5.774 6.2-9.672 6.2s-7.172-2.2-9.672-6.2zM10 14a4 4 0 100-8 4 4 0 000 8z"
        clipRule="evenodd"
      />
    </svg>
  ),
  Empty: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" className="h-12 w-12">
      <circle cx="8.5" cy="8" r="3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 20a5.75 5.75 0 0111.5 0" />
      <circle cx="17" cy="10.25" r="2.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 16.25A4.5 4.5 0 0120.25 20" />
    </svg>
  ),
  Phone: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3.75h3l1.5 4-2 1.25a11.25 11.25 0 005.75 5.75l1.25-2 4 1.5v3a2.25 2.25 0 01-2.25 2.25A15.75 15.75 0 013.75 6a2.25 2.25 0 012.25-2.25h.75z" />
    </svg>
  ),
  MapPin: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s7.5-4.875 7.5-11.25a7.5 7.5 0 10-15 0C4.5 16.125 12 21 12 21z" />
      <circle cx="12" cy="9.75" r="2.75" />
    </svg>
  ),
  Briefcase: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 6V5.25A2.25 2.25 0 0111.25 3h1.5A2.25 2.25 0 0115 5.25V6" />
      <rect x="3.75" y="6" width="16.5" height="13.5" rx="2.25" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 11.25h16.5M10.5 11.25v1.5h3v-1.5" />
    </svg>
  ),
  Heart: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25S4.5 15.75 4.5 9.75A4.5 4.5 0 0112 6.375 4.5 4.5 0 0119.5 9.75c0 6-7.5 10.5-7.5 10.5z" />
    </svg>
  ),
  Identification: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-5 w-5">
      <rect x="3.75" y="5.25" width="16.5" height="13.5" rx="2.25" />
      <circle cx="9" cy="11" r="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 16.25a3 3 0 014.5 0M14.25 10h3M14.25 13h3M14.25 16h2" />
    </svg>
  ),
  Child: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-5 w-5">
      <circle cx="12" cy="7.5" r="3.25" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.5 20.25a6.5 6.5 0 0113 0" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 12.5L7 15M14.5 12.5L17 15" />
    </svg>
  ),
};

function getParentesco(tutor: TutorCompleto) {
  const relacionPrincipal = tutor.Tutor_PacienteMenor?.find((relacion) => relacion.Es_Contacto_Principal);
  const relacion = relacionPrincipal || tutor.Tutor_PacienteMenor?.[0];

  return relacion?.Parentesco?.Nombre_De_Parentesco ||
    tutor.Parentesco?.Nombre_De_Parentesco ||
    'N/A';
}

function getOcupacion(tutor: TutorCompleto, ocupaciones: CatalogoOcupacion[] = []) {
  const tutorCompatible = tutor as TutorConRelacionesCompatibles;
  const ocupacionId = Number(tutorCompatible.Ocupacion);
  const ocupacionCatalogo = ocupaciones.find((ocupacion) => ocupacion.ID_Ocupacion === ocupacionId);

  return tutorCompatible.Ocupacion_Tutor_OcupacionToOcupacion?.Nombre_DeOcupacion ||
    tutorCompatible.Ocupacion_Tutor?.Nombre_DeOcupacion ||
    ocupacionCatalogo?.Nombre_DeOcupacion ||
    'N/A';
}

function getEstadoCivil(tutor: TutorCompleto, estadosCiviles: CatalogoEstadoCivil[] = []) {
  const tutorCompatible = tutor as TutorConRelacionesCompatibles;
  const estadoCivilId = Number(tutorCompatible.EstadoCivil);
  const estadoCivilCatalogo = estadosCiviles.find((estadoCivil) => estadoCivil.ID_EstadoCivil === estadoCivilId);

  return tutorCompatible.EstadoCivil_Tutor_EstadoCivilToEstadoCivil?.Nombre_EstadoCivil ||
    tutorCompatible.EstadoCivil_Tutor?.Nombre_EstadoCivil ||
    estadoCivilCatalogo?.Nombre_EstadoCivil ||
    'N/A';
}

function getPacientesMenores(tutor: TutorCompleto) {
  const desdeRelacion = tutor.Tutor_PacienteMenor
    ?.map((relacion) => relacion.Paciente_Menor)
    .filter((paciente): paciente is NonNullable<typeof paciente> => Boolean(paciente)) || [];

  return tutor.PacienteMenor || tutor.Paciente_Menor || desdeRelacion;
}

function getUbicacion(tutor: TutorCompleto) {
  const direccion = tutor.Direccion;

  if (!direccion) return 'Dirección no registrada';

  const municipio = direccion.Municipio?.Nombre_Municipio || '';
  const departamento = direccion.Municipio?.Departamento?.Nombre_Departamento || '';
  const barrio = direccion.Barrio || '';

  return [municipio, departamento, barrio].filter(Boolean).join(', ') || 'Dirección no registrada';
}

function getIniciales(tutor: TutorCompleto) {
  const nombre = tutor.Nombre?.charAt(0) || '';
  const apellido = tutor.Apellido?.charAt(0) || '';

  return `${nombre}${apellido}`.toUpperCase();
}

export default function Tutores() {
  const {
    tutores,
    loading,
    busqueda,
    setBusqueda,
    catalogos,
    formData,
    setFormData,
    prepareEdit,
    saveTutor,
  } = useTutores();

  const [modalOpen, setModalOpen] = useState<'edit' | 'view' | null>(null);
  const [selectedTutor, setSelectedTutor] = useState<TutorCompleto | null>(null);

  const handleOpenEditar = (tutor: TutorCompleto) => {
    prepareEdit(tutor);
    setSelectedTutor(tutor);
    setModalOpen('edit');
  };

  const handleOpenPacientes = (tutor: TutorCompleto) => {
    setSelectedTutor(tutor);
    setModalOpen('view');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const success = await saveTutor();

    if (success) {
      setModalOpen(null);
    }
  };

  const totalConPacientes = tutores.filter((tutor) => getPacientesMenores(tutor).length > 0).length;
  const totalPacientesAsociados = tutores.reduce((total, tutor) => total + getPacientesMenores(tutor).length, 0);

  return (
    <div className="mx-auto max-w-[1700px] animate-fade-in-up space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-slate-950 px-6 py-7 text-white shadow-2xl shadow-slate-200/80 sm:px-8">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-500/25 blur-3xl"></div>
        <div className="absolute -bottom-28 left-14 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl"></div>

        <div className="relative z-10">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-blue-300">
            Red de apoyo
          </p>
          <h1 className="mt-2 font-serif text-3xl font-black tracking-tight sm:text-4xl">
            Gestión de Tutores
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
            Directorio de responsables legales, información de contacto y pacientes menores asociados.
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-white/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Visualizados</p>
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-50 text-slate-500">
              <Icons.UserGroup />
            </span>
          </div>
          <p className="mt-2 text-3xl font-black text-slate-950">{tutores.length}</p>
          <p className="mt-1 text-xs font-medium text-slate-400">Resultado actual</p>
        </div>

        <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500">Con pacientes</p>
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-blue-600">
              <Icons.Child />
            </span>
          </div>
          <p className="mt-2 text-3xl font-black text-blue-700">{totalConPacientes}</p>
          <p className="mt-1 text-xs font-medium text-blue-500/70">Tutores vinculados</p>
        </div>

        <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500">Pacientes</p>
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-emerald-600">
              <Icons.Heart />
            </span>
          </div>
          <p className="mt-2 text-3xl font-black text-emerald-700">{totalPacientesAsociados}</p>
          <p className="mt-1 text-xs font-medium text-emerald-500/70">Menores asociados</p>
        </div>

        
      </section>

      <section className="rounded-[2rem] border border-white/80 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12 xl:items-end">
          <div className="xl:col-span-8">
            <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-400">
              <Icons.Search />
              Búsqueda
            </div>

            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                <Icons.Search />
              </div>
              <input
                type="text"
                placeholder="Buscar tutor por nombre, apellido, cédula o teléfono..."
                className="input input-bordered h-12 w-full rounded-2xl bg-slate-50 pl-11 text-sm font-medium transition-colors focus:bg-white"
                value={busqueda}
                onChange={(event) => setBusqueda(event.target.value)}
              />
            </div>
          </div>

          <div className="xl:col-span-4">
            {busqueda && (
              <button
                type="button"
                className="btn h-12 w-full rounded-2xl border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                onClick={() => setBusqueda('')}
              >
                Limpiar búsqueda
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/80 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-600">Directorio</p>
              <h2 className="mt-1 text-2xl font-black text-slate-900">Tutores registrados</h2>
            </div>
            <p className="text-sm font-medium text-slate-400">
              {tutores.length} resultado(s)
            </p>
          </div>
        </div>

        <div className="p-5">
          {loading && (
            <div className="rounded-[1.5rem] border border-slate-100 bg-slate-50 py-24 text-center">
              <span className="loading loading-spinner loading-lg text-primary"></span>
              <p className="mt-4 animate-pulse text-sm text-slate-400">Cargando tutores...</p>
            </div>
          )}

          {!loading && tutores.length > 0 && (
            <div className="grid grid-cols-1 gap-5 2xl:grid-cols-2">
              {tutores.map((tutor) => {
                const nombreCompleto = `${tutor.Nombre} ${tutor.Apellido}`.trim();
                const pacientes = getPacientesMenores(tutor);
                const ubicacion = getUbicacion(tutor);
                const ocupacion = getOcupacion(tutor, catalogos.ocupaciones);
                const estadoCivil = getEstadoCivil(tutor, catalogos.estadosCiviles);
                const parentesco = getParentesco(tutor);

                return (
                  <article
                    key={tutor.ID_Tutor}
                    className="group overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-xl hover:shadow-slate-200/70"
                  >
                    <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-4">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex min-w-0 items-start gap-4">
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-base font-black text-blue-700 shadow-sm">
                            {getIniciales(tutor)}
                          </div>

                          <div className="min-w-0">
                            <h3 className="truncate text-xl font-black leading-tight text-slate-950 transition-colors group-hover:text-blue-700" title={nombreCompleto}>
                              {nombreCompleto}
                            </h3>

                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 font-mono text-[10px] font-black text-slate-600">
                                <Icons.Identification />
                                {tutor.No_Cedula || 'Sin cédula'}
                              </span>

                              <span className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-blue-700">
                                {parentesco}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex shrink-0 gap-2">
                          {pacientes.length > 0 ? (
                            <button
                              type="button"
                              className="btn btn-sm rounded-xl border-blue-100 bg-blue-50 text-blue-700 hover:border-blue-200 hover:bg-blue-100"
                              onClick={() => handleOpenPacientes(tutor)}
                            >
                              <Icons.Eye />
                              Pacientes ({pacientes.length})
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-sm rounded-xl border-slate-200 bg-white text-slate-400"
                              disabled
                            >
                              <Icons.Eye />
                              Sin pacientes
                            </button>
                          )}

                          <button
                            type="button"
                            className="btn btn-sm rounded-xl border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                            onClick={() => handleOpenEditar(tutor)}
                          >
                            <Icons.Edit />
                            Editar
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 p-5 lg:grid-cols-2">
                      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                        <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Contacto</p>

                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm">
                            <Icons.Phone />
                          </span>
                          <span className="truncate text-sm font-bold text-slate-700" title={tutor.No_Telefono || 'Sin teléfono'}>
                            {tutor.No_Telefono || 'Sin teléfono'}
                          </span>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                        <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Ubicación</p>

                        <div className="flex min-w-0 items-start gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm">
                            <Icons.MapPin />
                          </span>
                          <p className="line-clamp-3 text-sm font-medium leading-relaxed text-slate-600" title={ubicacion}>
                            {ubicacion}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-100 bg-white p-4 lg:col-span-2">
                        <p className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                          <Icons.Briefcase />
                          Información adicional
                        </p>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Ocupación</p>
                            <p className="mt-1 truncate text-sm font-bold text-slate-700" title={ocupacion}>
                              {ocupacion}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Estado civil</p>
                            <p className="mt-1 truncate text-sm font-bold text-slate-700" title={estadoCivil}>
                              {estadoCivil}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {!loading && tutores.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-6 py-24 text-center">
              <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-white text-slate-300 shadow-sm">
                <Icons.Empty />
              </div>
              <p className="text-lg font-black text-slate-700">No se encontraron tutores</p>
              <p className="mt-2 max-w-sm text-sm font-medium text-slate-400">
                Intenta buscar por otro nombre, cédula o teléfono.
              </p>
              {busqueda && (
                <button
                  type="button"
                  className="btn btn-sm mt-6 rounded-xl border-blue-100 bg-blue-50 text-blue-700 hover:border-blue-200 hover:bg-blue-100"
                  onClick={() => setBusqueda('')}
                >
                  Limpiar búsqueda
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      <TutorFormModal
        isOpen={modalOpen === 'edit'}
        onClose={() => setModalOpen(null)}
        onSubmit={handleSubmit}
        formData={formData}
        setFormData={setFormData}
        catalogos={catalogos}
      />

      <PacientesListModal
        isOpen={modalOpen === 'view'}
        onClose={() => setModalOpen(null)}
        tutor={selectedTutor}
      />
    </div>
  );
}
