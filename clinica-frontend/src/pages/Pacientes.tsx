import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePacientes } from '../hooks/usePacientes';
import type { Paciente, CreatePacienteDTO } from '../types';
import PacienteFormModal from '../components/pacientes/PacienteFormModal';

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
  Edit: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
      <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
    </svg>
  ),
  Folder: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
    </svg>
  ),
  Users: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-6 w-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5a6.75 6.75 0 00-13.5 0" />
      <circle cx="9" cy="8.25" r="3.75" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 11.25a3 3 0 100-6 3 3 0 000 6zM21.75 19.5a5.25 5.25 0 00-5.25-5.25" />
    </svg>
  ),
  Adult: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-5 w-5">
      <circle cx="12" cy="7.5" r="3.75" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 20.25a7.5 7.5 0 0115 0" />
    </svg>
  ),
  Minor: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-5 w-5">
      <circle cx="9.5" cy="8" r="3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 20a5.75 5.75 0 0111.5 0" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.75 10.75a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5zM19.75 19a4.25 4.25 0 00-4.25-4.25" />
    </svg>
  ),
  Status: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75l2.25 2.25L15.75 9.75" />
      <circle cx="12" cy="12" r="8.25" />
    </svg>
  ),
  Empty: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" className="h-12 w-12">
      <circle cx="12" cy="8" r="3.75" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 20.25a7.5 7.5 0 0115 0" />
    </svg>
  ),
};

const tipoOptions = ['todos', 'adultos', 'menores'];
const actividadOptions = ['todos', 'activos', 'inactivos'];

const getIniciales = (paciente: Paciente) => {
  const nombre = paciente.Nombre?.charAt(0) || '';
  const apellido = paciente.Apellido?.charAt(0) || '';

  return `${nombre}${apellido}`.toUpperCase();
};

export default function Pacientes() {
  const { pacientes, loading, filtros, setFiltro, catalogos, acciones } = usePacientes();
  const [selectedPaciente, setSelectedPaciente] = useState<Paciente | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openCreate = () => {
    setSelectedPaciente(null);
    setIsModalOpen(true);
  };

  const openEdit = (p: Paciente) => {
    setSelectedPaciente(p);
    setIsModalOpen(true);
  };

  const handleSubmit = async (data: CreatePacienteDTO, isEdit: boolean) => {
    let success = false;
    if (isEdit && selectedPaciente) {
      success = await acciones.actualizarPaciente(selectedPaciente.ID_Paciente, data);
    } else {
      success = await acciones.crearPaciente(data);
    }

    if (success) {
      setIsModalOpen(false);
    }
    return success;
  };

  const totalAdultos = pacientes.filter((paciente) => Boolean(paciente.PacienteAdulto)).length;
  const totalMenores = pacientes.filter((paciente) => !paciente.PacienteAdulto).length;
  const totalActivos = pacientes.filter((paciente) => paciente.Activo).length;
  const totalInactivos = pacientes.filter((paciente) => !paciente.Activo).length;

  return (
    <div className="mx-auto max-w-[1700px] animate-fade-in-up space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-slate-950 px-6 py-7 text-white shadow-2xl shadow-slate-200/80 sm:px-8">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-500/25 blur-3xl"></div>
        <div className="absolute -bottom-28 left-14 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl"></div>

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-blue-300">
              Gestión clínica
            </p>
            <h1 className="mt-2 font-serif text-3xl font-black tracking-tight sm:text-4xl">
              Expedientes Clínicos
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
              Directorio centralizado para consultar, filtrar y administrar pacientes registrados.
            </p>
          </div>

          <button
            className="btn min-h-12 rounded-2xl border-white/10 bg-white px-6 text-slate-950 shadow-xl hover:border-white hover:bg-slate-100"
            onClick={openCreate}
          >
            <Icons.Plus />
            Nuevo paciente
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-white/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Visualizados</p>
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-50 text-slate-500">
              <Icons.Users />
            </span>
          </div>
          <p className="mt-2 text-3xl font-black text-slate-950">{pacientes.length}</p>
          <p className="mt-1 text-xs font-medium text-slate-400">Resultado actual de filtros</p>
        </div>

        <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500">Adultos</p>
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-blue-600">
              <Icons.Adult />
            </span>
          </div>
          <p className="mt-2 text-3xl font-black text-blue-700">{totalAdultos}</p>
          <p className="mt-1 text-xs font-medium text-blue-500/70">Pacientes con cédula</p>
        </div>

        <div className="rounded-3xl border border-amber-100 bg-amber-50 p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500">Menores</p>
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-amber-600">
              <Icons.Minor />
            </span>
          </div>
          <p className="mt-2 text-3xl font-black text-amber-700">{totalMenores}</p>
          <p className="mt-1 text-xs font-medium text-amber-500/70">Pacientes con tutor</p>
        </div>

        <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500">Activos</p>
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-emerald-600">
              <Icons.Status />
            </span>
          </div>
          <p className="mt-2 text-3xl font-black text-emerald-700">{totalActivos}</p>
          <p className="mt-1 text-xs font-medium text-emerald-500/70">{totalInactivos} inactivos</p>
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/80 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <div className="xl:col-span-5">
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
                placeholder="Buscar por nombre, cédula o partida de nacimiento..."
                className="input input-bordered h-12 w-full rounded-2xl bg-slate-50 pl-11 text-sm font-medium transition-colors focus:bg-white"
                value={filtros.busqueda}
                onChange={(e) => setFiltro('busqueda', e.target.value)}
              />
            </div>
          </div>

          <div className="xl:col-span-7">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                <Icons.Status />
                Filtros
              </div>

              {(filtros.busqueda || filtros.tipo !== 'todos' || filtros.actividad !== 'todos') && (
                <button
                  type="button"
                  className="text-xs font-bold text-blue-600 transition-colors hover:text-blue-800"
                  onClick={() => {
                    setFiltro('busqueda', '');
                    setFiltro('tipo', 'todos');
                    setFiltro('actividad', 'todos');
                  }}
                >
                  Limpiar filtros
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-2xl bg-slate-100 p-1.5">
                <div className="grid grid-cols-3 gap-1">
                  {tipoOptions.map((tipo) => (
                    <button
                      key={tipo}
                      type="button"
                      className={`btn btn-sm min-h-9 rounded-xl border-none capitalize ${
                        filtros.tipo === tipo
                          ? 'bg-white text-slate-950 shadow-sm hover:bg-white'
                          : 'bg-transparent text-slate-500 hover:bg-slate-200'
                      }`}
                      onClick={() => setFiltro('tipo', tipo)}
                    >
                      {tipo}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-slate-100 p-1.5">
                <div className="grid grid-cols-3 gap-1">
                  {actividadOptions.map((actividad) => (
                    <button
                      key={actividad}
                      type="button"
                      className={`btn btn-sm min-h-9 rounded-xl border-none capitalize ${
                        filtros.actividad === actividad
                          ? 'bg-white text-slate-950 shadow-sm hover:bg-white'
                          : 'bg-transparent text-slate-500 hover:bg-slate-200'
                      }`}
                      onClick={() => setFiltro('actividad', actividad)}
                    >
                      {actividad}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-white/80 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-5">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-600">Directorio</p>
              <h2 className="mt-1 text-xl font-black text-slate-900">Pacientes registrados</h2>
            </div>
            <p className="text-xs font-medium text-slate-400">
              {pacientes.length} resultado(s)
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="table table-fixed w-full min-w-[920px]">
            <colgroup>
              <col className="w-[38%]" />
              <col className="w-[16%]" />
              <col className="w-[30%]" />
              <col className="w-[16%]" />
            </colgroup>

            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="py-4 pl-6 text-xs font-black uppercase tracking-wider text-slate-500">Paciente</th>
                <th className="py-4 text-xs font-black uppercase tracking-wider text-slate-500">Categoría</th>
                <th className="py-4 text-xs font-black uppercase tracking-wider text-slate-500">Identificación</th>
                <th className="py-4 pr-6 text-right text-xs font-black uppercase tracking-wider text-slate-500">Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-24 text-center">
                    <span className="loading loading-spinner loading-lg text-primary"></span>
                    <p className="mt-4 animate-pulse text-sm text-slate-400">Cargando pacientes...</p>
                  </td>
                </tr>
              ) : pacientes.length > 0 ? (
                pacientes.map((p) => (
                  <tr key={p.ID_Paciente} className="group transition-colors hover:bg-slate-50">
                    <td className="py-4 pl-6">
                      <div className="flex items-center gap-4">
                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-black shadow-sm ${
                          p.PacienteAdulto
                            ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-100'
                            : 'bg-amber-50 text-amber-700 ring-1 ring-amber-100'
                        }`}>
                          {getIniciales(p)}
                        </div>

                        <div className="min-w-0">
                          <div className="truncate text-base font-black text-slate-900">
                            {p.Nombre} {p.Apellido}
                          </div>
                          <div className="mt-1 flex items-center gap-2">
                            <span className={`h-2.5 w-2.5 rounded-full ${p.Activo ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                            <span className="text-xs font-bold text-slate-500">{p.Activo ? 'Activo' : 'Inactivo'}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4">
                      {p.PacienteAdulto ? (
                        <span className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                          Adulto
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">
                          Menor
                        </span>
                      )}
                    </td>

                    <td className="py-4">
                      <div className="font-mono text-sm font-bold text-slate-600">
                        {p.PacienteAdulto
                          ? p.PacienteAdulto.No_Cedula
                          : p.Paciente_Menor?.PartidaDeNacimiento || 'Sin identificación'}
                      </div>

                      {!p.PacienteAdulto && p.Paciente_Menor?.Tutor && (
                        <div className="mt-1 text-xs font-medium text-slate-400">
                          Tutor: {p.Paciente_Menor.Tutor.Nombre} {p.Paciente_Menor.Tutor.Apellido}
                        </div>
                      )}
                    </td>

                    <td className="py-4 pr-6 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/pacientes/${p.ID_Paciente}`}
                          className="btn btn-sm rounded-xl border-blue-100 bg-blue-50 text-blue-700 hover:border-blue-200 hover:bg-blue-100"
                        >
                          <Icons.Folder />
                          Expediente
                        </Link>

                        <button
                          type="button"
                          className="btn btn-sm rounded-xl border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                          onClick={() => openEdit(p)}
                        >
                          <Icons.Edit />
                          Editar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-24 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-50 text-slate-300">
                        <Icons.Empty />
                      </div>
                      <p className="text-lg font-black text-slate-700">No se encontraron pacientes</p>
                      <p className="mt-2 max-w-sm text-sm font-medium text-slate-400">
                        Ajusta los filtros de búsqueda o registra un nuevo paciente.
                      </p>
                      <button
                        type="button"
                        className="btn btn-sm mt-6 rounded-xl border-blue-100 bg-blue-50 text-blue-700 hover:border-blue-200 hover:bg-blue-100"
                        onClick={() => {
                          setFiltro('busqueda', '');
                          setFiltro('tipo', 'todos');
                          setFiltro('actividad', 'todos');
                        }}
                      >
                        Limpiar filtros
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {isModalOpen && (
        <PacienteFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSubmit}
          pacienteEditar={selectedPaciente}
          catalogos={catalogos}
        />
      )}
    </div>
  );
}
