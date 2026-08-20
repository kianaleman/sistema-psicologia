import { useState, useCallback } from "react";
import { toast } from "sonner";
import { api } from "../services/api";
import { useCitas } from "../hooks/useCitas";
import { usePacientes } from "../hooks/usePacientes";
import type {
  Cita,
  CreateCitaDTO,
  CreateSesionDTO,
  CreatePacienteDTO,
  Psicologo,
  Paciente,
  EstadoCitaCatalogo,
} from "../types";

import CitaFormModal from "../components/citas/CitaFormModal";
import SesionModal from "../components/citas/SesionModal";
import HistorialModal from "../components/citas/HistorialModal";
import CancelarCitaModal from "../components/citas/CancelarCitaModal";
import PacienteFormModal from "../components/pacientes/PacienteFormModal";

const Icons = {
  Search: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
    </svg>
  ),
  Calendar: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 3v3M17 3v3M4.5 8.25h15M5.25 5.25h13.5A1.5 1.5 0 0120.25 6.75v12A1.5 1.5 0 0118.75 20.25H5.25A1.5 1.5 0 013.75 18.75v-12A1.5 1.5 0 015.25 5.25z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h2M14 12h2M8 16h2M14 16h2" />
    </svg>
  ),
  User: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" />
    </svg>
  ),
  Filter: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path fillRule="evenodd" d="M2.628 1.601C5.028 1.206 7.49 1 10 1s4.973.206 7.372.601a.75.75 0 01.628.74v2.288a2.25 2.25 0 01-.659 1.59l-4.682 4.683a2.25 2.25 0 00-.659 1.59v3.037c0 .684-.31 1.33-.844 1.757l-1.937 1.55A.75.75 0 018 18.25v-5.757a2.25 2.25 0 00-.659-1.591L2.659 6.22A2.25 2.25 0 012 4.629V2.34a.75.75 0 01.628-.74z" clipRule="evenodd" />
    </svg>
  ),
  Plus: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
    </svg>
  ),
  Ban: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
    </svg>
  ),
  Clock: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  MapPin: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s7.5-4.875 7.5-11.25a7.5 7.5 0 10-15 0C4.5 16.125 12 21 12 21z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 12.75a3 3 0 100-6 3 3 0 000 6z" />
    </svg>
  ),
  Hospital: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 20.25h15M6 20.25V5.25A1.5 1.5 0 017.5 3.75h9a1.5 1.5 0 011.5 1.5v15M9 20.25V16.5a1.5 1.5 0 011.5-1.5h3a1.5 1.5 0 011.5 1.5v3.75M12 7.5v4.5M9.75 9.75h4.5" />
    </svg>
  ),
  File: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3.75h6L19.5 9.75v10.5H7.5A3 3 0 014.5 17.25V6.75A3 3 0 017.5 3.75z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 3.75V9.75h6M8.25 13.5h7.5M8.25 16.5h5.25" />
    </svg>
  ),
  X: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  ArrowRight: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 12h13.5M13.5 6.75L18.75 12l-5.25 5.25" />
    </svg>
  ),
  Empty: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" className="w-12 h-12">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 3.75v2.5M17 3.75v2.5M4.75 8.25h14.5M6.25 5.25h11.5A1.75 1.75 0 0119.5 7v10.75a2.5 2.5 0 01-2.5 2.5H7a2.5 2.5 0 01-2.5-2.5V7a1.75 1.75 0 011.75-1.75z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6M9 15.5h3" />
    </svg>
  ),
};

const periodoOptions = [
  { id: "hoy", label: "Hoy" },
  { id: "semana", label: "Semana" },
  { id: "mes", label: "Mes" },
  { id: "todos", label: "Todas" },
  { id: "rango", label: "Rango" },
] as const;

export default function Citas() {
  const { citas, loading, filtros, setFiltro, catalogos, acciones } =
    useCitas();
  const { catalogos: catalogosPaciente, acciones: accionesPaciente } =
    usePacientes();

  const [modalOpen, setModalOpen] = useState<
    "create" | "edit" | "session" | "view" | null
  >(null);
  const [selectedCita, setSelectedCita] = useState<Cita | null>(null);
  const [idCancelar, setIdCancelar] = useState<number | null>(null);
  const [isPacienteModalOpen, setIsPacienteModalOpen] = useState(false);

  const openModal = (
    type: "create" | "edit" | "session" | "view",
    cita?: Cita,
  ) => {
    setSelectedCita(cita || null);
    setModalOpen(type);
  };

  const handleCreateOrUpdate = async (data: CreateCitaDTO, isEdit: boolean) => {
    let success = false;
    if (isEdit && selectedCita) {
      success = await acciones.actualizarCita(selectedCita.ID_Cita, data);
    } else {
      success = await acciones.crearCita(data);
    }
    if (success) {
      setModalOpen(null);
    }
    return success;
  };

  const handleCrearPacienteRapido = async (data: CreatePacienteDTO) => {
    const success = await accionesPaciente.crearPaciente(data);
    if (success) {
      setIsPacienteModalOpen(false);
    }
    return success;
  };

  const confirmarCancelacion = async (motivoId: number, nota: string) => {
    if (idCancelar) {
      await acciones.cancelarCita(idCancelar, motivoId, nota);
      setIdCancelar(null);
    }
  };

  const obtenerMensajeError = (error: unknown) => {
    if (error instanceof Error && error.message.trim()) {
      return error.message;
    }

    return "Error al finalizar la sesión.";
  };

  const handleFinalizarSesion = async (data: CreateSesionDTO) => {
    try {
      await api.sesiones.create(data);

      toast.success("Sesión guardada correctamente");
      setModalOpen(null);
      setSelectedCita(null);

      setFiltro("periodo", filtros.periodo);
    } catch (error: unknown) {
      const mensaje = obtenerMensajeError(error);
      toast.error(mensaje);
      throw error;
    }
  };

  const formatearHora = (h: string) => {
    if (!h) return "--:--";
    const fecha = new Date(h);
    return fecha.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "UTC",
    });
  };

  const formatearFechaCompleta = (f: string) => {
    if (!f) return "Fecha no válida";

    const fechaObj = new Date(f);
    const opciones: Intl.DateTimeFormatOptions = {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    };

    const fechaStr = fechaObj.toLocaleDateString("es-ES", opciones);
    return fechaStr.charAt(0).toUpperCase() + fechaStr.slice(1);
  };

  const getEstadoColor = (st: string) => {
    const s = st.toLowerCase();
    if (s.includes("pendiente")) return "border-blue-200 bg-blue-50 text-blue-700";
    if (s.includes("realizada")) return "border-emerald-200 bg-emerald-50 text-emerald-700";
    if (s.includes("cancelada")) return "border-rose-200 bg-rose-50 text-rose-700";
    if (s.includes("procesada")) return "border-amber-200 bg-amber-50 text-amber-700";
    return "border-slate-200 bg-slate-100 text-slate-600";
  };

  const checkDisponibilidad = useCallback(
    async (id: number, fecha: string) => {
      return await acciones.obtenerHorariosOcupados(id, fecha);
    },
    [acciones],
  );

  const renderDireccion = (
    dir:
      | {
          ID_Direccion?: number;
          Calle?: string | null;
          Barrio?: string | null;
          Municipio?: {
            Nombre_Municipio?: string;
            Departamento?: {
              Nombre_Departamento?: string;
            } | null;
          } | null;
        }
      | null
      | undefined,
  ) => {
    if (!dir) return null;

    if (dir.ID_Direccion === 1) {
      return (
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/80 p-3 text-xs">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
            <Icons.Hospital />
          </span>
          <div className="flex flex-col gap-0.5">
            <span className="font-black leading-tight text-blue-900">
              Clínica Central
            </span>
            <span className="font-medium text-blue-700/80">
              Managua. C. Principal
            </span>
          </div>
        </div>
      );
    }

    const calle = dir.Calle || "";
    const barrio = dir.Barrio ? `B° ${dir.Barrio}` : "";
    const ciudad = dir.Municipio?.Nombre_Municipio || "";
    const departamento = dir.Municipio?.Departamento?.Nombre_Departamento || "";

    const linea1 = [calle, barrio].filter(Boolean).join(", ");
    const linea2 = [ciudad, departamento].filter(Boolean).join(", ");

    return (
      <div className="mt-4 flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs transition-colors hover:bg-slate-100">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm">
          <Icons.MapPin />
        </span>
        <div className="flex w-full flex-col gap-1">
          <span className="break-words font-black leading-tight text-slate-700">
            {linea1 || "Dirección específica no proporcionada"}
          </span>
          {linea2 && (
            <span className="font-medium text-slate-500">{linea2}</span>
          )}
        </div>
      </div>
    );
  };

  const totalPendientes = citas.filter((cita) => cita.ID_EstadoCita === 1).length;
  const totalRealizadas = citas.filter((cita) => cita.ID_EstadoCita === 2).length;
  const totalCanceladas = citas.filter((cita) => cita.ID_EstadoCita === 3 || cita.ID_EstadoCita === 4).length;

  return (
    <div className="mx-auto max-w-[1700px] animate-fade-in-up space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-slate-950 px-6 py-7 text-white shadow-2xl shadow-slate-200/80 sm:px-8">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-500/25 blur-3xl"></div>
        <div className="absolute -bottom-28 left-14 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl"></div>

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-blue-300">
              Gestión de agenda
            </p>
            <h1 className="mt-2 font-serif text-3xl font-black tracking-tight sm:text-4xl">
              Agenda Clínica
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
              Administración de citas, seguimiento de sesiones y consulta de expedientes asociados.
            </p>
          </div>

          <button
            className="btn min-h-12 rounded-2xl border-white/10 bg-white px-6 text-slate-950 shadow-xl hover:border-white hover:bg-slate-100"
            onClick={() => openModal("create")}
          >
            <Icons.Plus />
            Agendar cita
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-white/80 bg-white p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Visualizadas</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{citas.length}</p>
        </div>

        <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500">Pendientes</p>
          <p className="mt-2 text-3xl font-black text-blue-700">{totalPendientes}</p>
        </div>

        <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500">Realizadas</p>
          <p className="mt-2 text-3xl font-black text-emerald-700">{totalRealizadas}</p>
        </div>

        <div className="rounded-3xl border border-rose-100 bg-rose-50 p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500">Canceladas</p>
          <p className="mt-2 text-3xl font-black text-rose-700">{totalCanceladas}</p>
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/80 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <div className="xl:col-span-5">
            <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-400">
              <Icons.Calendar />
              Periodo
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex flex-wrap gap-2 rounded-2xl bg-slate-100 p-1.5">
                {periodoOptions.map((btn) => (
                  <button
                    key={btn.id}
                    type="button"
                    className={`btn btn-sm min-h-9 rounded-xl border-none px-4 capitalize ${
                      filtros.periodo === btn.id
                        ? "bg-white text-slate-950 shadow-sm hover:bg-white"
                        : "bg-transparent text-slate-500 hover:bg-slate-200"
                    }`}
                    onClick={() => setFiltro("periodo", btn.id)}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>

              {filtros.periodo === "rango" && (
                <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 sm:flex-row sm:items-center">
                  <input
                    type="date"
                    className="input input-sm input-bordered bg-white font-medium text-slate-600"
                    value={filtros.fechaInicio}
                    onChange={(e) => setFiltro("fechaInicio", e.target.value)}
                  />
                  <span className="hidden text-slate-300 sm:block">
                    <Icons.ArrowRight />
                  </span>
                  <input
                    type="date"
                    className="input input-sm input-bordered bg-white font-medium text-slate-600"
                    value={filtros.fechaFin}
                    onChange={(e) => setFiltro("fechaFin", e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="xl:col-span-7">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                <Icons.Filter />
                Criterios
              </div>

              {(filtros.estado ||
                filtros.paciente ||
                filtros.psicologo ||
                filtros.periodo !== "todos") && (
                <button
                  onClick={() => {
                    setFiltro("estado", "");
                    setFiltro("paciente", "");
                    setFiltro("psicologo", "");
                    setFiltro("periodo", "todos");
                  }}
                  className="text-xs font-bold text-blue-600 transition-colors hover:text-blue-800"
                >
                  Limpiar filtros
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Icons.User />
                </div>
                <input
                  type="text"
                  list="lista-doctores"
                  placeholder="Doctor..."
                  className="input input-bordered input-sm w-full rounded-xl bg-slate-50 pl-9 transition-colors focus:bg-white"
                  value={filtros.psicologo}
                  onChange={(e) => setFiltro("psicologo", e.target.value)}
                />
                <datalist id="lista-doctores">
                  {catalogos.psicologos.map((p: Psicologo) => (
                    <option
                      key={p.ID_Psicologo}
                      value={`${p.Nombre} ${p.Apellido}`}
                    />
                  ))}
                </datalist>
              </div>

              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Icons.Search />
                </div>
                <input
                  type="text"
                  list="lista-pacientes"
                  placeholder="Paciente..."
                  className="input input-bordered input-sm w-full rounded-xl bg-slate-50 pl-9 transition-colors focus:bg-white"
                  value={filtros.paciente}
                  onChange={(e) => setFiltro("paciente", e.target.value)}
                />
                <datalist id="lista-pacientes">
                  {catalogos.pacientes.map((p: Paciente) => (
                    <option
                      key={p.ID_Paciente}
                      value={`${p.Nombre} ${p.Apellido}`}
                    />
                  ))}
                </datalist>
              </div>

              <select
                className="select select-bordered select-sm w-full rounded-xl bg-slate-50 text-slate-600 focus:bg-white"
                value={filtros.estado}
                onChange={(e) => setFiltro("estado", e.target.value)}
              >
                <option value="">Todos los estados</option>
                {catalogos.estadosCita.map((e: EstadoCitaCatalogo) => (
                  <option key={e.ID_EstadoCita} value={e.ID_EstadoCita}>
                    {e.NombreEstado}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="rounded-[2rem] border border-white/80 bg-white py-32 text-center shadow-sm">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="mt-4 animate-pulse text-sm text-slate-400">
            Cargando agenda...
          </p>
        </div>
      ) : (
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2 2xl:grid-cols-3">
          {citas.map((cita) => {
            const esProgramada = cita.ID_EstadoCita === 1;
            const esCancelada =
              cita.ID_EstadoCita === 3 || cita.ID_EstadoCita === 4;

            return (
              <article
                key={cita.ID_Cita}
                className={`group flex min-h-[360px] flex-col overflow-hidden rounded-[2rem] border border-white/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-200/80 ${
                  esCancelada ? "opacity-70 grayscale" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-slate-50/80 px-6 py-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-500 shadow-sm">
                      <Icons.Calendar />
                    </div>

                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                        Fecha programada
                      </p>
                      <p className="mt-1 text-sm font-black leading-snug text-slate-800">
                        {formatearFechaCompleta(cita.FechaCita)}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wide ${getEstadoColor(
                      cita.EstadoCita?.NombreEstado || "",
                    )}`}
                  >
                    {cita.EstadoCita?.NombreEstado}
                  </div>
                </div>

                <div className="flex flex-1 gap-5 p-6">
                  <div className="shrink-0">
                    <div className="flex min-w-[92px] flex-col items-center justify-center rounded-3xl bg-slate-950 px-4 py-5 text-center text-white shadow-xl shadow-slate-200">
                      <Icons.Clock />
                      <span className="mt-2 text-xl font-black tracking-tight leading-none">
                        {formatearHora(cita.HoraCita)}
                      </span>
                      <span className="mt-1 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                        Hora
                      </span>
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3
                      className="truncate text-xl font-black leading-tight text-slate-900"
                      title={`${cita.Paciente?.Nombre} ${cita.Paciente?.Apellido}`}
                    >
                      {cita.Paciente?.Nombre} {cita.Paciente?.Apellido}
                    </h3>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-bold text-slate-500 shadow-sm">
                        {cita.TipoDeCita?.Nombre_DeCita || "Tipo desconocido"}
                      </span>
                      {cita.NumeroSesion && (
                        <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-blue-700">
                          Sesión #{cita.NumeroSesion}
                        </span>
                      )}
                    </div>

                    <p className="mt-3 text-sm font-medium text-slate-500">
                      Dr. {cita.Psicologo?.Apellido || "N/A"}
                    </p>

                    {esCancelada ? (
                      <div className="mt-4 rounded-2xl border border-rose-100 bg-rose-50 p-3">
                        <div className="mb-1 flex items-center gap-2 text-xs font-black text-rose-700">
                          <Icons.Ban />
                          <span>
                            {cita.MotivoCancelacion?.Motivo || "Cancelada"}
                          </span>
                        </div>
                        {cita.NotasCancelacion && (
                          <p className="text-xs italic leading-relaxed text-rose-600/80">
                            {cita.NotasCancelacion}
                          </p>
                        )}
                      </div>
                    ) : (
                      cita.Direccion && renderDireccion(cita.Direccion)
                    )}
                  </div>
                </div>

                <div className="mt-auto border-t border-slate-100 bg-white px-6 py-4">
                  <div className="mb-4 min-h-5 truncate text-xs italic text-slate-400" title={cita.MotivoConsulta}>
                    {cita.MotivoConsulta ? `"${cita.MotivoConsulta}"` : "Sin motivo registrado"}
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    {esProgramada ? (
                      <>
                        <button
                          className="btn btn-sm rounded-xl border-rose-100 bg-rose-50 text-rose-600 hover:border-rose-200 hover:bg-rose-100"
                          onClick={() => setIdCancelar(cita.ID_Cita)}
                        >
                          <Icons.X />
                          Cancelar
                        </button>

                        <div className="flex gap-2">
                          <button
                            className="btn btn-sm rounded-xl border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                            onClick={() => openModal("edit", cita)}
                          >
                            Editar
                          </button>
                          <button
                            className="btn btn-sm rounded-xl border-slate-950 bg-slate-950 px-5 text-white shadow-lg shadow-slate-200 hover:border-slate-800 hover:bg-slate-800"
                            onClick={() => openModal("session", cita)}
                          >
                            Iniciar
                          </button>
                        </div>
                      </>
                    ) : (
                      <button
                        className="btn btn-sm w-full rounded-xl border-blue-100 bg-blue-50 text-blue-700 hover:border-blue-200 hover:bg-blue-100"
                        onClick={() => openModal("view", cita)}
                      >
                        <Icons.File />
                        Ver expediente
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}

          {citas.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-slate-300 bg-white px-6 py-24 text-center">
              <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-50 text-slate-300">
                <Icons.Empty />
              </div>
              <h3 className="text-lg font-black text-slate-700">
                No hay citas encontradas
              </h3>
              <p className="mt-2 max-w-sm text-sm font-medium text-slate-400">
                Prueba cambiando los filtros de búsqueda o consulta todo el historial.
              </p>
              <button
                className="btn btn-sm mt-6 rounded-xl border-blue-100 bg-blue-50 text-blue-700 hover:border-blue-200 hover:bg-blue-100"
                onClick={() => setFiltro("periodo", "todos")}
              >
                Ver todo el historial
              </button>
            </div>
          )}
        </section>
      )}

      <CitaFormModal
        isOpen={modalOpen === "create" || modalOpen === "edit"}
        onClose={() => setModalOpen(null)}
        onSubmit={handleCreateOrUpdate}
        citaEditar={selectedCita}
        catalogos={catalogos}
        onNewPacienteClick={() => setIsPacienteModalOpen(true)}
        onCheckDisponibilidad={checkDisponibilidad}
      />

      <SesionModal
        isOpen={modalOpen === "session"}
        onClose={() => setModalOpen(null)}
        onSubmit={handleFinalizarSesion}
        onAgendarSeguimiento={acciones.crearCita}
        onCheckDisponibilidad={checkDisponibilidad}
        cita={selectedCita}
        catalogos={catalogos}
      />

      <HistorialModal
        isOpen={modalOpen === "view"}
        onClose={() => setModalOpen(null)}
        cita={selectedCita}
      />

      <CancelarCitaModal
        isOpen={!!idCancelar}
        onClose={() => setIdCancelar(null)}
        onConfirm={confirmarCancelacion}
      />

      {isPacienteModalOpen && (
        <PacienteFormModal
          isOpen={isPacienteModalOpen}
          onClose={() => setIsPacienteModalOpen(false)}
          onSubmit={handleCrearPacienteRapido}
          pacienteEditar={null}
          catalogos={catalogosPaciente}
        />
      )}
    </div>
  );
}
