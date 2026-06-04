import { useState } from 'react';
import {
  usePsicologos,
  type FiltroActividad,
  type CredencialesTemporales,
  type PsicologoCompleto,
  type PsicologoEspecialidadRelacion,
  type PsicologoFormData,
} from '../hooks/usePsicologos';
import PsicologoFormModal from '../components/psicologos/PsicologoFormModal';
import { toast } from 'sonner';

const Icons = {
  Plus: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
      <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
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
  Doctor: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-6 w-6">
      <circle cx="12" cy="7.5" r="3.75" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 20.25a7.5 7.5 0 0115 0" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5v3M10.5 18h3" />
    </svg>
  ),
  Edit: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
      <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
    </svg>
  ),
  Key: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path
        fillRule="evenodd"
        d="M8 7a5 5 0 117.905 4.06l-1.482 1.481a.75.75 0 01-.53.22H12.75v1.145a.75.75 0 01-.75.75h-1.144V15.8a.75.75 0 01-.75.75H8.96l-1.02 1.02A.75.75 0 017.41 17.8H4.75A2.75 2.75 0 012 15.05v-2.66a.75.75 0 01.22-.53l3.72-3.72A5.02 5.02 0 018 7zm5-2a2 2 0 100 4 2 2 0 000-4z"
        clipRule="evenodd"
      />
    </svg>
  ),
  Empty: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" className="h-12 w-12">
      <circle cx="12" cy="7.5" r="3.75" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 20.25a7.5 7.5 0 0115 0" />
    </svg>
  ),
  Phone: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3.75h3l1.5 4-2 1.25a11.25 11.25 0 005.75 5.75l1.25-2 4 1.5v3a2.25 2.25 0 01-2.25 2.25A15.75 15.75 0 013.75 6a2.25 2.25 0 012.25-2.25h.75z" />
    </svg>
  ),
  Mail: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-5 w-5">
      <rect x="3.75" y="5.25" width="16.5" height="13.5" rx="2.25" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 7.5l7.5 5.25L19.5 7.5" />
    </svg>
  ),
  MapPin: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s7.5-4.875 7.5-11.25a7.5 7.5 0 10-15 0C4.5 16.125 12 21 12 21z" />
      <circle cx="12" cy="9.75" r="2.75" />
    </svg>
  ),
  Badge: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3.75h9A2.25 2.25 0 0118.75 6v12A2.25 2.25 0 0116.5 20.25h-9A2.25 2.25 0 015.25 18V6A2.25 2.25 0 017.5 3.75z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25h6M9 12h6M9 15.75h3" />
    </svg>
  ),
  Shield: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s7-3.75 7-10.5V5.25L12 3 5 5.25v5.25C5 17.25 12 21 12 21z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75l2.25 2.25L15.75 9.75" />
    </svg>
  ),
  Close: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
};

const filtrosActividad: FiltroActividad[] = ['todos', 'activos', 'inactivos'];

function getEspecialidades(psicologo: PsicologoCompleto) {
  return psicologo.Psicologo_EspecialidadPsicologo || [];
}

function getNombreEspecialidad(relacion: PsicologoEspecialidadRelacion) {
  return relacion.EspecialidadPsicologo?.Nombre_Especialidad ||
    relacion.EspecialidadPsicologo?.NombreEspecialidad ||
    relacion.Especialidad?.Nombre_Especialidad ||
    relacion.Especialidad?.NombreEspecialidad ||
    'Especialidad';
}

function getDireccion(psicologo: PsicologoCompleto) {
  const direccion = psicologo.Direccion;

  if (!direccion) return 'Dirección no registrada';

  const municipio = direccion.Municipio?.Nombre_Municipio || '';
  const departamento = direccion.Municipio?.Departamento?.Nombre_Departamento || '';
  const barrio = direccion.Barrio || '';

  return [municipio, departamento, barrio].filter(Boolean).join(', ') || 'Dirección no registrada';
}

function getIniciales(psicologo: PsicologoCompleto) {
  const nombre = psicologo.Nombre?.charAt(0) || '';
  const apellido = psicologo.Apellido?.charAt(0) || '';

  return `${nombre}${apellido}`.toUpperCase();
}

export default function Psicologos() {
  const {
    psicologos,
    loading,
    busqueda,
    setBusqueda,
    filtroActividad,
    setFiltroActividad,
    rolesSistema,
    catalogos,
    acciones,
  } = usePsicologos();

  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [selectedPsicologo, setSelectedPsicologo] = useState<PsicologoCompleto | null>(null);
  const [credencialesTemporales, setCredencialesTemporales] = useState<CredencialesTemporales | null>(null);
  const [restableciendoId, setRestableciendoId] = useState<number | null>(null);

  const handleOpenNuevo = () => {
    setSelectedPsicologo(null);
    setModalOpen(true);
  };

  const handleOpenEditar = (psicologo: PsicologoCompleto) => {
    setSelectedPsicologo(psicologo);
    setModalOpen(true);
  };

  const handleSubmit = async (data: PsicologoFormData, isEdit: boolean) => {
    if (isEdit && selectedPsicologo) {
      const success = await acciones.actualizarPsicologo(selectedPsicologo.ID_Psicologo, data);

      if (success) {
        setModalOpen(false);
        setSelectedPsicologo(null);
      }

      return success;
    }

    const result = await acciones.crearPsicologo(data);

    if (result) {
      setModalOpen(false);
      setSelectedPsicologo(null);
      setCredencialesTemporales(result.credenciales);
      return true;
    }

    return false;
  };

  const handleRestablecerPassword = async (psicologo: PsicologoCompleto) => {
    if (!psicologo.ID_Usuario) {
      toast.warning('Este psicólogo no tiene un usuario vinculado.');
      return;
    }

    const nombreCompleto = `${psicologo.Nombre} ${psicologo.Apellido}`.trim();
    const confirmado = window.confirm(
      `Se generará una nueva contraseña temporal para ${nombreCompleto}. El usuario deberá cambiarla al iniciar sesión. ¿Deseas continuar?`
    );

    if (!confirmado) return;

    setRestableciendoId(psicologo.ID_Psicologo);

    const credenciales = await acciones.restablecerPasswordUsuario(psicologo.ID_Usuario);

    if (credenciales) {
      setCredencialesTemporales(credenciales);
    }

    setRestableciendoId(null);
  };

  const copiarCredenciales = async () => {
    if (!credencialesTemporales) return;

    const texto = `Correo: ${credencialesTemporales.email}\nContraseña temporal: ${credencialesTemporales.passwordTemporal}`;

    await navigator.clipboard.writeText(texto);
    toast.success('Credenciales copiadas');
  };

  const totalActivos = psicologos.filter((psicologo) => psicologo.Activo).length;
  const totalInactivos = psicologos.filter((psicologo) => !psicologo.Activo).length;
  const totalConUsuario = psicologos.filter((psicologo) => Boolean(psicologo.ID_Usuario)).length;

  return (
    <div className="mx-auto max-w-[1700px] animate-fade-in-up space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-slate-950 px-6 py-7 text-white shadow-2xl shadow-slate-200/80 sm:px-8">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-500/25 blur-3xl"></div>
        <div className="absolute -bottom-28 left-14 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl"></div>

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-blue-300">
              Equipo clínico
            </p>
            <h1 className="mt-2 font-serif text-3xl font-black tracking-tight sm:text-4xl">
              Gestión de Psicólogos
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
              Directorio profesional, especialidades, datos de contacto, estado operativo y credenciales de acceso.
            </p>
          </div>

          <button
            type="button"
            className="btn min-h-12 rounded-2xl border-white/10 bg-white px-6 text-slate-950 shadow-xl hover:border-white hover:bg-slate-100"
            onClick={handleOpenNuevo}
          >
            <Icons.Plus />
            Nuevo psicólogo
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-white/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Visualizados</p>
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-50 text-slate-500">
              <Icons.Doctor />
            </span>
          </div>
          <p className="mt-2 text-3xl font-black text-slate-950">{psicologos.length}</p>
          <p className="mt-1 text-xs font-medium text-slate-400">Resultado actual</p>
        </div>

        <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500">Activos</p>
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-emerald-600">
              <Icons.Shield />
            </span>
          </div>
          <p className="mt-2 text-3xl font-black text-emerald-700">{totalActivos}</p>
          <p className="mt-1 text-xs font-medium text-emerald-500/70">Disponibles en sistema</p>
        </div>

        <div className="rounded-3xl border border-rose-100 bg-rose-50 p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500">Inactivos</p>
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-rose-600">
              <Icons.Doctor />
            </span>
          </div>
          <p className="mt-2 text-3xl font-black text-rose-700">{totalInactivos}</p>
          <p className="mt-1 text-xs font-medium text-rose-500/70">Perfiles deshabilitados</p>
        </div>

        <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500">Con usuario</p>
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-blue-600">
              <Icons.Key />
            </span>
          </div>
          <p className="mt-2 text-3xl font-black text-blue-700">{totalConUsuario}</p>
          <p className="mt-1 text-xs font-medium text-blue-500/70">Acceso vinculado</p>
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/80 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <div className="xl:col-span-7">
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
                placeholder="Buscar por nombre, Código MINSA, teléfono o email..."
                className="input input-bordered h-12 w-full rounded-2xl bg-slate-50 pl-11 text-sm font-medium transition-colors focus:bg-white"
                value={busqueda}
                onChange={(event) => setBusqueda(event.target.value)}
              />
            </div>
          </div>

          <div className="xl:col-span-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                <Icons.Shield />
                Estado
              </div>

              {(busqueda || filtroActividad !== 'todos') && (
                <button
                  type="button"
                  className="text-xs font-bold text-blue-600 transition-colors hover:text-blue-800"
                  onClick={() => {
                    setBusqueda('');
                    setFiltroActividad('todos');
                  }}
                >
                  Limpiar filtros
                </button>
              )}
            </div>

            <div className="rounded-2xl bg-slate-100 p-1.5">
              <div className="grid grid-cols-3 gap-1">
                {filtrosActividad.map((estado) => (
                  <button
                    type="button"
                    key={estado}
                    className={`btn btn-sm min-h-9 rounded-xl border-none capitalize ${
                      filtroActividad === estado
                        ? 'bg-white text-slate-950 shadow-sm hover:bg-white'
                        : 'bg-transparent text-slate-500 hover:bg-slate-200'
                    }`}
                    onClick={() => setFiltroActividad(estado)}
                  >
                    {estado}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/80 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-600">Directorio</p>
              <h2 className="mt-1 text-2xl font-black text-slate-900">Profesionales registrados</h2>
            </div>
            <p className="text-sm font-medium text-slate-400">
              {psicologos.length} resultado(s)
            </p>
          </div>
        </div>

        <div className="p-5">
          {loading && (
            <div className="rounded-[1.5rem] border border-slate-100 bg-slate-50 py-24 text-center">
              <span className="loading loading-spinner loading-lg text-primary"></span>
              <p className="mt-4 animate-pulse text-sm text-slate-400">Cargando psicólogos...</p>
            </div>
          )}

          {!loading && psicologos.length > 0 && (
            <div className="grid grid-cols-1 gap-5 2xl:grid-cols-2">
              {psicologos.map((psicologo) => {
                const nombreCompleto = `Dr. ${psicologo.Nombre} ${psicologo.Apellido}`;
                const especialidades = getEspecialidades(psicologo);
                const direccion = getDireccion(psicologo);
                const tieneUsuario = Boolean(psicologo.ID_Usuario);
                const restableciendo = restableciendoId === psicologo.ID_Psicologo;

                return (
                  <article
                    key={psicologo.ID_Psicologo}
                    className="group overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-xl hover:shadow-slate-200/70"
                  >
                    <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-4">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex min-w-0 items-start gap-4">
                          <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-base font-black shadow-sm ${
                            psicologo.Activo
                              ? 'border border-blue-100 bg-blue-50 text-blue-700'
                              : 'border border-slate-200 bg-slate-100 text-slate-500'
                          }`}>
                            {getIniciales(psicologo)}
                          </div>

                          <div className="min-w-0">
                            <h3 className="truncate text-xl font-black leading-tight text-slate-950 transition-colors group-hover:text-blue-700" title={nombreCompleto}>
                              {nombreCompleto}
                            </h3>

                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wide ${
                                psicologo.Activo
                                  ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                                  : 'border-rose-100 bg-rose-50 text-rose-700'
                              }`}>
                                <span className={`h-2 w-2 rounded-full ${psicologo.Activo ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                                {psicologo.Activo ? 'Activo' : 'Inactivo'}
                              </span>

                              <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 font-mono text-[10px] font-black text-slate-600">
                                {psicologo.CodigoMinsa || 'S/C'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex shrink-0 gap-2">
                          <button
                            type="button"
                            className="btn btn-sm rounded-xl border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                            onClick={() => handleOpenEditar(psicologo)}
                          >
                            <Icons.Edit />
                            Editar
                          </button>

                          <button
                            type="button"
                            className="btn btn-sm rounded-xl border-amber-100 bg-amber-50 text-amber-700 hover:border-amber-200 hover:bg-amber-100"
                            title={tieneUsuario ? 'Restablecer contraseña' : 'Sin usuario vinculado'}
                            onClick={() => handleRestablecerPassword(psicologo)}
                            disabled={!tieneUsuario || restableciendo}
                          >
                            {restableciendo ? (
                              <span className="loading loading-spinner loading-xs"></span>
                            ) : (
                              <Icons.Key />
                            )}
                            Acceso
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 p-5 lg:grid-cols-2">
                      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                        <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Contacto</p>

                        <div className="space-y-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm">
                              <Icons.Phone />
                            </span>
                            <span className="truncate text-sm font-bold text-slate-700" title={psicologo.No_Telefono || 'Sin teléfono'}>
                              {psicologo.No_Telefono || 'Sin teléfono'}
                            </span>
                          </div>

                          <div className="flex min-w-0 items-center gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm">
                              <Icons.Mail />
                            </span>
                            <span className="truncate text-sm font-medium text-blue-600" title={psicologo.Email || 'Sin email'}>
                              {psicologo.Email || 'Sin email'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                        <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Ubicación</p>

                        <div className="flex min-w-0 items-start gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm">
                            <Icons.MapPin />
                          </span>
                          <p className="line-clamp-3 text-sm font-medium leading-relaxed text-slate-600" title={direccion}>
                            {direccion}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-100 bg-white p-4 lg:col-span-2">
                        <p className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                          <Icons.Shield />
                          Roles y acceso
                        </p>

                        {tieneUsuario ? (
                          <div className="space-y-3">
                            <p className="text-xs font-medium text-slate-400">
                              Usuario vinculado: {psicologo.Email || 'Sin correo'}
                            </p>

                            <div className="flex flex-wrap gap-2">
                              {psicologo.rolesUsuario && psicologo.rolesUsuario.length > 0 ? (
                                psicologo.rolesUsuario.map((rol) => (
                                  <span
                                    key={`${psicologo.ID_Psicologo}-rol-${rol.id}`}
                                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-black text-slate-700"
                                  >
                                    {rol.nombre}
                                  </span>
                                ))
                              ) : (
                                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-400">
                                  Sin roles asignados
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700">
                            Este profesional no tiene usuario vinculado.
                          </div>
                        )}
                      </div>

                      <div className="rounded-2xl border border-slate-100 bg-white p-4 lg:col-span-2">
                        <p className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                          <Icons.Badge />
                          Especialidades
                        </p>

                        <div className="flex flex-wrap gap-2">
                          {especialidades.length > 0 ? (
                            especialidades.map((relacion, index) => (
                              <span
                                key={`${psicologo.ID_Psicologo}-${relacion.ID_Especialidad || index}`}
                                className="max-w-full truncate rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700"
                                title={getNombreEspecialidad(relacion)}
                              >
                                {getNombreEspecialidad(relacion)}
                              </span>
                            ))
                          ) : (
                            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-400">
                              Sin especialidades
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {!loading && psicologos.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-6 py-24 text-center">
              <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-white text-slate-300 shadow-sm">
                <Icons.Empty />
              </div>
              <p className="text-lg font-black text-slate-700">No se encontraron psicólogos</p>
              <p className="mt-2 max-w-sm text-sm font-medium text-slate-400">
                Intenta cambiar los filtros de búsqueda o registra un nuevo profesional.
              </p>
              <button
                type="button"
                className="btn btn-sm mt-6 rounded-xl border-blue-100 bg-blue-50 text-blue-700 hover:border-blue-200 hover:bg-blue-100"
                onClick={() => {
                  setBusqueda('');
                  setFiltroActividad('todos');
                }}
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
      </section>

      <PsicologoFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        psicologoEditar={selectedPsicologo}
        catalogos={catalogos}
        rolesSistema={rolesSistema}
      />

      {credencialesTemporales && (
        <dialog className="modal modal-open bg-black/50 backdrop-blur-sm">
          <div className="modal-box max-w-xl overflow-hidden rounded-[2rem] bg-white p-0 text-slate-800 shadow-2xl">
            <div className="bg-slate-950 px-6 py-5 text-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-300">
                    Seguridad
                  </p>
                  <h3 className="mt-1 text-2xl font-black text-white">Credenciales temporales</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-300">
                    Guarda estas credenciales antes de cerrar el cuadro. La contraseña temporal solo se muestra una vez.
                  </p>
                </div>

                <button
                  type="button"
                  className="btn btn-sm btn-circle border-white/10 bg-white/10 text-white hover:bg-white/20"
                  onClick={() => setCredencialesTemporales(null)}
                >
                  <Icons.Close />
                </button>
              </div>
            </div>

            <div className="space-y-4 p-6">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Correo</span>
                <p className="mt-1 break-all font-mono text-sm font-bold text-slate-800">{credencialesTemporales.email}</p>
              </div>

              <div className="rounded-3xl border border-blue-100 bg-blue-50 p-4">
                <span className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">Contraseña temporal</span>
                <p className="mt-1 break-all font-mono text-xl font-black tracking-wide text-slate-950">
                  {credencialesTemporales.passwordTemporal}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="btn rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                onClick={copiarCredenciales}
              >
                Copiar
              </button>

              <button
                type="button"
                className="btn rounded-xl bg-slate-950 text-white hover:bg-slate-800"
                onClick={() => setCredencialesTemporales(null)}
              >
                Entendido
              </button>
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
}
