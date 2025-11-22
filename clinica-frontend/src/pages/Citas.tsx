import { useState } from "react";
import { toast } from "sonner";
import { useCitas } from "../hooks/useCitas";
import type { Cita } from "../types";

import CitaFormModal from "../components/citas/CitaFormModal";
import SesionModal from "../components/citas/SesionModal";
import HistorialModal from "../components/citas/HistorialModal";

export default function Citas() {
  const { citas, loading, filtros, setFiltro, catalogos, acciones } =
    useCitas();

  // Estados UI locales
  const [modalOpen, setModalOpen] = useState<
    "create" | "session" | "view" | null
  >(null);
  const [selectedCita, setSelectedCita] = useState<Cita | null>(null);

  const openModal = (type: "create" | "session" | "view", cita?: Cita) => {
    setSelectedCita(cita || null);
    setModalOpen(type);
  };

  const handleCreateOrUpdate = async (data: any, isEdit: boolean) => {
    let success = false;

    if (isEdit && selectedCita) {
      success = await acciones.actualizarCita(selectedCita.ID_Cita, data);
    } else {
      success = await acciones.crearCita(data);
    }

    // SOLO cerramos el modal si la operación fue exitosa.
    if (success) {
      setModalOpen(null);
    }

    return success;
  };

  const handleCancelar = (id: number) => {
    toast("¿Seguro que deseas cancelar esta cita?", {
      action: {
        label: "Sí, cancelar",
        onClick: () => acciones.cancelarCita(id),
      },
      cancel: { label: "No" },
      duration: 5000,
    });
  };

  const handleFinalizarSesion = async (data: any) => {
    toast.promise(acciones.guardarSesion(data), {
      loading: "Finalizando...",
      success: "Sesión guardada",
      error: "Error",
    });
    setModalOpen(null);
  };

  // --- HELPERS VISUALES ---

  const formatearHora = (h: string) => {
    if (!h) return "--:--";
    const f = new Date(h);
    // Usamos getUTC para respetar la hora exacta guardada en DB
    return `${f.getUTCHours().toString().padStart(2, "0")}:${f
      .getUTCMinutes()
      .toString()
      .padStart(2, "0")}`;
  };

  const formatearFechaCompleta = (f: string) => {
    const p = f.split("T")[0].split("-");
    const fechaObj = new Date(
      parseInt(p[0]),
      parseInt(p[1]) - 1,
      parseInt(p[2])
    );

    const fechaStr = fechaObj.toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    return fechaStr.charAt(0).toUpperCase() + fechaStr.slice(1);
  };

  const getEstadoColor = (st: string) => {
    const s = st.toLowerCase();
    if (s.includes("programada")) return "badge-primary";
    if (s.includes("completada")) return "badge-success text-white";
    if (s.includes("cancelada")) return "badge-error text-white";
    return "badge-ghost";
  };

  // --- NUEVO HELPER: RENDERIZADO DE DIRECCIÓN ---
  const renderDireccion = (dir: any) => {
    if (!dir) return null;
    
    // Texto corto para la tarjeta visual
    const textoCorto = `${dir.Ciudad}, ${dir.Calle}`;
    // Texto completo para el tooltip (hover)
    const textoCompleto = `${dir.Departamento}, ${dir.Ciudad}. B° ${dir.Barrio}, ${dir.Calle}`;

    return (
      <div 
        className="flex items-start gap-1.5 text-xs text-slate-500 mt-2 bg-slate-50 p-2 rounded-md border border-slate-100 cursor-help transition-colors hover:bg-blue-50 hover:border-blue-100"
        title={textoCompleto}
      >
        <span className="text-sm shrink-0">📍</span>
        <span className="truncate w-full font-medium">
          {textoCorto}
        </span>
      </div>
    );
  };

  return (
    <div className="p-6 animate-fade-in-up">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
            Agenda Clínica
          </h1>
          <p className="text-slate-500">
            Gestión de citas ({citas.length} visibles)
          </p>
        </div>
        <button
          className="btn btn-primary shadow-lg text-white"
          onClick={() => openModal("create")}
        >
          + Agendar Cita
        </button>
      </div>

      {/* --- BARRA DE FILTROS --- */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-8">
        {/* Fila Superior: Tiempo */}
        <div className="flex flex-wrap items-center gap-3 mb-4 border-b border-slate-100 pb-4">
          <span className="text-xs font-bold text-slate-400 uppercase w-16">
            Tiempo:
          </span>
          <div className="join border border-slate-200 rounded-lg p-1 bg-slate-50">
            {[
              { id: "hoy", label: "Hoy" },
              { id: "semana", label: "Semana" },
              { id: "mes", label: "Mes" },
              { id: "todos", label: "Todas" },
              { id: "rango", label: "📅 Rango" },
            ].map((btn) => (
              <button
                key={btn.id}
                className={`join-item btn btn-sm border-none transition-all ${
                  filtros.periodo === btn.id
                    ? "bg-slate-800 text-white shadow-md"
                    : "bg-transparent text-slate-500 hover:bg-white"
                }`}
                onClick={() => setFiltro("periodo", btn.id)}
              >
                {btn.label}
              </button>
            ))}
          </div>
          {filtros.periodo === "rango" && (
            <div className="flex items-center gap-2 animate-fade-in ml-2 bg-blue-50 p-1 rounded-lg border border-blue-100 shadow-sm">
              <input
                type="date"
                className="input input-xs input-bordered bg-white font-bold text-slate-700"
                value={filtros.fechaInicio}
                onChange={(e) => setFiltro("fechaInicio", e.target.value)}
              />
              <span className="text-slate-400 font-bold">-</span>
              <input
                type="date"
                className="input input-xs input-bordered bg-white font-bold text-slate-700"
                value={filtros.fechaFin}
                onChange={(e) => setFiltro("fechaFin", e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Fila Inferior: Criterios */}
        <div className="flex flex-wrap gap-6 items-center">
          {/* Filtro Estado */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase">
              Estado:
            </span>
            <select
              className="select select-bordered select-sm bg-white text-slate-700 w-32"
              value={filtros.estado}
              onChange={(e) => setFiltro("estado", e.target.value)}
            >
              <option value="">Todos</option>
              {catalogos.estadosCita.map((e: any) => (
                <option key={e.ID_EstadoCita} value={e.ID_EstadoCita}>
                  {e.NombreEstado}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro Paciente */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase">
              Paciente:
            </span>
            <input
              type="text"
              list="lista-pacientes"
              placeholder="Escriba nombre..."
              className="input input-bordered input-sm bg-white text-slate-700 w-48 focus:border-blue-500"
              value={filtros.paciente}
              onChange={(e) => setFiltro("paciente", e.target.value)}
            />
            <datalist id="lista-pacientes">
              {catalogos.pacientes.map((p: any) => (
                <option
                  key={p.ID_Paciente}
                  value={`${p.Nombre} ${p.Apellido}`}
                />
              ))}
            </datalist>
          </div>

          {/* Filtro Doctor */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase">
              Doctor:
            </span>
            <input
              type="text"
              list="lista-doctores"
              placeholder="Escriba nombre..."
              className="input input-bordered input-sm bg-white text-slate-700 w-48 focus:border-blue-500"
              value={filtros.psicologo}
              onChange={(e) => setFiltro("psicologo", e.target.value)}
            />
            <datalist id="lista-doctores">
              {catalogos.psicologos.map((p: any) => (
                <option
                  key={p.ID_Psicologo}
                  value={`${p.Nombre} ${p.Apellido}`}
                />
              ))}
            </datalist>
          </div>

          {/* Botón Limpiar */}
          {(filtros.estado ||
            filtros.paciente ||
            filtros.psicologo ||
            filtros.periodo !== "todos") && (
            <button
              className="btn btn-ghost btn-xs text-blue-500 ml-auto self-center"
              onClick={() => {
                setFiltro("estado", "");
                setFiltro("paciente", "");
                setFiltro("psicologo", "");
                setFiltro("periodo", "todos");
              }}
            >
              Limpiar Filtros
            </button>
          )}
        </div>
      </div>

      {/* --- GRID DE CITAS --- */}
      {loading ? (
        <div className="text-center py-20">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {citas.map((cita) => {
            const esProgramada = cita.EstadoCita?.NombreEstado === "Programada";
            const esCancelada = cita.EstadoCita?.NombreEstado === "Cancelada";

            return (
              <div
                key={cita.ID_Cita}
                className={`card bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col ${
                  esCancelada ? "opacity-60 grayscale" : ""
                }`}
              >
                {/* --- ENCABEZADO DE LA TARJETA --- */}
                <div className="px-6 py-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    📅 {formatearFechaCompleta(cita.FechaCita)}
                  </span>
                  <div
                    className={`badge ${getEstadoColor(
                      cita.EstadoCita?.NombreEstado || ""
                    )} font-bold border-none`}
                  >
                    {cita.EstadoCita?.NombreEstado}
                  </div>
                </div>

                {/* --- CUERPO DE LA TARJETA --- */}
                <div className="p-6 flex gap-4">
                  {/* Columna Hora */}
                  <div className="flex flex-col items-center justify-center bg-blue-50 text-blue-700 rounded-lg p-3 min-w-[80px] h-fit">
                    <span className="text-2xl font-black tracking-tighter leading-none">
                      {formatearHora(cita.HoraCita)}
                    </span>
                    <span className="text-[10px] font-bold uppercase mt-1 opacity-60">
                      Hora
                    </span>
                  </div>

                  {/* Columna Info */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <h3
                      className="font-bold text-slate-800 text-lg leading-tight truncate"
                      title={`${cita.Paciente?.Nombre} ${cita.Paciente?.Apellido}`}
                    >
                      {cita.Paciente?.Nombre} {cita.Paciente?.Apellido}
                    </h3>

                    <div className="flex flex-wrap gap-2 items-center text-sm text-slate-500">
                      <span className="badge badge-sm badge-outline text-slate-500">
                        {cita.TipoDeCita?.NombreDeCita}
                      </span>
                      {cita.NumeroSesion && (
                        <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-200 shadow-sm uppercase tracking-wider">
                          Sesión #{cita.NumeroSesion}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-xs text-slate-400 pt-1">
                      <span>Dr. {cita.Psicologo?.Apellido}</span>
                    </div>

                    {/* --- VISUALIZACIÓN DE DIRECCIÓN --- */}
                    {/* Se muestra si existe DireccionCita y NO es null */}
                    {cita.DireccionCita && renderDireccion(cita.DireccionCita)}
                  </div>
                </div>

                {/* --- PIE DE PÁGINA (ACCIONES) --- */}
                <div className="px-6 py-3 bg-white border-t border-slate-100 flex justify-between items-center mt-auto">
                  <div
                    className="flex-1 text-xs text-slate-400 italic truncate mr-4"
                    title={cita.MotivoConsulta}
                  >
                    "{cita.MotivoConsulta}"
                  </div>

                  <div className="flex gap-2">
                    {esProgramada ? (
                      <>
                        <button
                          className="btn btn-ghost btn-xs text-slate-400 hover:text-red-500 tooltip tooltip-left"
                          data-tip="Cancelar"
                          onClick={() => handleCancelar(cita.ID_Cita)}
                        >
                          ✕
                        </button>
                        <button
                          className="btn btn-outline btn-xs"
                          onClick={() => openModal("create", cita)}
                        >
                          Editar
                        </button>
                        <button
                          className="btn btn-primary btn-sm text-white shadow-sm px-4"
                          onClick={() => openModal("session", cita)}
                        >
                          Iniciar
                        </button>
                      </>
                    ) : (
                      <button
                        className="btn btn-outline btn-info btn-sm w-full"
                        onClick={() => openModal("view", cita)}
                      >
                        📄 Ver Expediente
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {citas.length === 0 && (
            <div className="col-span-full text-center py-16 bg-slate-50 rounded-xl border border-dashed border-slate-300">
              <p className="text-slate-400 font-medium">
                No se encontraron citas con estos filtros.
              </p>
              <button
                className="btn btn-link btn-sm mt-2 text-blue-600 no-underline"
                onClick={() => setFiltro("periodo", "todos")}
              >
                Ver todo el historial
              </button>
            </div>
          )}
        </div>
      )}

      {/* MODALES REUTILIZABLES */}
      <CitaFormModal
        isOpen={modalOpen === "create"}
        onClose={() => setModalOpen(null)}
        onSubmit={handleCreateOrUpdate}
        citaEditar={selectedCita}
        catalogos={catalogos}
      />

      <SesionModal
        isOpen={modalOpen === "session"}
        onClose={() => setModalOpen(null)}
        onSubmit={handleFinalizarSesion}
        cita={selectedCita}
        catalogos={catalogos}
      />

      <HistorialModal
        isOpen={modalOpen === "view"}
        onClose={() => setModalOpen(null)}
        cita={selectedCita}
      />
    </div>
  );
}