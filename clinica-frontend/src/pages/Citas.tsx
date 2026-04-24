import { useState } from "react";
import { toast } from "sonner";
import { useCitas } from "../hooks/useCitas";
import type { Cita } from "../types";

import CitaFormModal from "../components/citas/CitaFormModal";
import SesionModal from "../components/citas/SesionModal";
import HistorialModal from "../components/citas/HistorialModal";
import CancelarCitaModal from "../components/citas/CancelarCitaModal";

// Iconos SVG Inline
const Icons = {
  Search: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" /></svg>,
  Calendar: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75z" clipRule="evenodd" /></svg>,
  User: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" /></svg>,
  Filter: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M2.628 1.601C5.028 1.206 7.49 1 10 1s4.973.206 7.372.601a.75.75 0 01.628.74v2.288a2.25 2.25 0 01-.659 1.59l-4.682 4.683a2.25 2.25 0 00-.659 1.59v3.037c0 .684-.31 1.33-.844 1.757l-1.937 1.55A.75.75 0 018 18.25v-5.757a2.25 2.25 0 00-.659-1.591L2.659 6.22A2.25 2.25 0 012 4.629V2.34a.75.75 0 01.628-.74z" clipRule="evenodd" /></svg>,
  Plus: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>,
  Ban: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" /></svg>
};

export default function Citas() {
  const { citas, loading, filtros, setFiltro, catalogos, acciones } = useCitas();

  // Estados UI locales
  const [modalOpen, setModalOpen] = useState<"create" | "session" | "view" | null>(null);
  const [selectedCita, setSelectedCita] = useState<Cita | null>(null);
  const [idCancelar, setIdCancelar] = useState<number | null>(null);

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
    if (success) {
      setModalOpen(null);
    }
    return success;
  };

  const confirmarCancelacion = async (motivoId: number, nota: string) => {
    if (idCancelar) {
        await acciones.cancelarCita(idCancelar, motivoId, nota);
        setIdCancelar(null); 
    }
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
    const fecha = new Date(h);
    // Forzamos UTC para que lea "20:30" tal cual está en la BD
    return fecha.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true,
        timeZone: 'UTC' 
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
        timeZone: "UTC"
    };

    const fechaStr = fechaObj.toLocaleDateString("es-ES", opciones);
    return fechaStr.charAt(0).toUpperCase() + fechaStr.slice(1);
  };

  const getEstadoColor = (st: string) => {
    const s = st.toLowerCase();
    if (s.includes("programada")) return "badge-primary";
    if (s.includes("completada")) return "badge-success text-white";
    if (s.includes("cancelada")) return "badge-error text-white";
    return "badge-ghost";
  };

  const renderDireccion = (dir: any) => {
    if (!dir) return null;
    const textoCorto = `${dir.Ciudad}, ${dir.Calle}`;
    const textoCompleto = `${dir.Departamento}, ${dir.Ciudad}. B° ${dir.Barrio}, ${dir.Calle}`;
    return (
      <div className="flex items-start gap-1.5 text-xs text-slate-500 mt-2 bg-slate-50 p-2 rounded-md border border-slate-100 cursor-help transition-colors hover:bg-blue-50 hover:border-blue-100" title={textoCompleto}>
        <span className="text-sm shrink-0">📍</span>
        <span className="truncate w-full font-medium">{textoCorto}</span>
      </div>
    );
  };

  return (
    <div className="p-8 animate-fade-in-up max-w-7xl mx-auto">
      {/* --- ENCABEZADO --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight font-serif">
            Agenda Clínica
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Gestión y seguimiento de citas ({citas.length} visualizadas)
          </p>
        </div>
        <button
          className="btn btn-primary shadow-lg text-white gap-2 rounded-xl px-6"
          onClick={() => openModal("create")}
        >
          <Icons.Plus />
          Agendar Cita
        </button>
      </div>

      {/* --- PANEL DE FILTROS --- */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 mb-8">
        <div className="flex flex-col lg:flex-row gap-6 justify-between">
          
          {/* Lado Izquierdo: Selectores de Tiempo */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Icons.Calendar /> Período
            </span>
            <div className="flex flex-wrap items-center gap-3">
              <div className="join bg-slate-100 p-1 rounded-lg border border-slate-200">
                {[{ id: "hoy", label: "Hoy" }, { id: "semana", label: "Semana" }, { id: "mes", label: "Mes" }, { id: "todos", label: "Todas" }, { id: "rango", label: "Rango" }].map((btn) => (
                  <button
                    key={btn.id}
                    className={`join-item btn btn-sm border-none transition-all capitalize font-medium ${
                      filtros.periodo === btn.id ? "bg-white text-slate-900 shadow-sm" : "bg-transparent text-slate-500 hover:text-slate-700"
                    }`}
                    onClick={() => setFiltro("periodo", btn.id)}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>

              {/* Selector de Rango Condicional */}
              {filtros.periodo === "rango" && (
                <div className="flex items-center gap-2 animate-fade-in bg-white p-1 rounded-lg border border-slate-200">
                  <input type="date" className="input input-xs bg-transparent focus:outline-none font-medium text-slate-600" value={filtros.fechaInicio} onChange={(e) => setFiltro("fechaInicio", e.target.value)} />
                  <span className="text-slate-300">➔</span>
                  <input type="date" className="input input-xs bg-transparent focus:outline-none font-medium text-slate-600" value={filtros.fechaFin} onChange={(e) => setFiltro("fechaFin", e.target.value)} />
                </div>
              )}
            </div>
          </div>

          {/* Lado Derecho: Filtros Específicos */}
          <div className="flex flex-col gap-3 flex-1">
            <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Icons.Filter /> Criterios
                </span>
                {(filtros.estado || filtros.paciente || filtros.psicologo || filtros.periodo !== "todos") && (
                    <button 
                        onClick={() => { setFiltro("estado", ""); setFiltro("paciente", ""); setFiltro("psicologo", ""); setFiltro("periodo", "todos"); }}
                        className="text-xs font-medium text-blue-500 hover:text-blue-700 transition-colors hover:underline"
                    >
                        Limpiar filtros
                    </button>
                )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Doctor */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><Icons.User /></div>
                <input type="text" list="lista-doctores" placeholder="Doctor..." className="input input-bordered input-sm w-full pl-9 bg-slate-50 focus:bg-white transition-colors" value={filtros.psicologo} onChange={(e) => setFiltro("psicologo", e.target.value)} />
                <datalist id="lista-doctores">{catalogos.psicologos.map((p: any) => (<option key={p.ID_Psicologo} value={`${p.Nombre} ${p.Apellido}`} />))}</datalist>
              </div>

              {/* Paciente */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><Icons.Search /></div>
                <input type="text" list="lista-pacientes" placeholder="Paciente..." className="input input-bordered input-sm w-full pl-9 bg-slate-50 focus:bg-white transition-colors" value={filtros.paciente} onChange={(e) => setFiltro("paciente", e.target.value)} />
                <datalist id="lista-pacientes">{catalogos.pacientes.map((p: any) => (<option key={p.ID_Paciente} value={`${p.Nombre} ${p.Apellido}`} />))}</datalist>
              </div>

              {/* Estado */}
              <select className="select select-bordered select-sm bg-slate-50 focus:bg-white w-full text-slate-600" value={filtros.estado} onChange={(e) => setFiltro("estado", e.target.value)}>
                <option value="">Todos los estados</option>
                {catalogos.estadosCita.map((e: any) => (<option key={e.ID_EstadoCita} value={e.ID_EstadoCita}>{e.NombreEstado}</option>))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* --- GRID DE CITAS --- */}
      {loading ? (
        <div className="text-center py-32">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="text-slate-400 mt-4 text-sm animate-pulse">Cargando agenda...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {citas.map((cita) => {
            const esProgramada = cita.EstadoCita?.NombreEstado === "Programada";
            const esCancelada = cita.EstadoCita?.NombreEstado === "Cancelada" || cita.EstadoCita?.NombreEstado === "No Asistió";

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
                    // Se agregan clases para que el badge se adapte al contenido: h-auto, py-1, text-center, leading-tight
                    className={`badge ${getEstadoColor(
                      cita.EstadoCita?.NombreEstado || ""
                    )} font-bold border-none h-auto py-1 text-center leading-tight`}
                  >
                    {cita.EstadoCita?.NombreEstado}
                  </div>
                </div>

                {/* --- CUERPO DE LA TARJETA --- */}
                <div className="p-6 flex gap-4">
                  {/* Columna Hora */}
                  <div className="flex flex-col items-center justify-center bg-blue-50 text-blue-700 rounded-lg p-3 min-w-[90px] h-fit text-center">
                    <span className="text-lg font-black tracking-tighter leading-none">
                      {formatearHora(cita.HoraCita)}
                    </span>
                    <span className="text-[9px] font-bold uppercase mt-1 opacity-60">
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

                    {/* Direccion o Motivo Cancelación */}
                    {esCancelada ? (
                        <div className="mt-2 p-2 bg-rose-50 border border-rose-100 rounded-lg">
                            <div className="flex items-center gap-1.5 text-rose-700 font-bold text-xs mb-1">
                                <Icons.Ban />
                                <span>{cita.MotivoCancelacion?.Categoria || 'Cancelada'}</span>
                            </div>
                            {cita.NotasCancelacion && (
                                <p className="text-xs text-rose-600/80 italic leading-snug">
                                    "{cita.NotasCancelacion}"
                                </p>
                            )}
                        </div>
                    ) : (
                        cita.DireccionCita && renderDireccion(cita.DireccionCita)
                    )}
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
                          onClick={() => setIdCancelar(cita.ID_Cita)}
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

          {/* --- EMPTY STATE --- */}
          {citas.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-dashed border-slate-300">
              <div className="bg-slate-50 p-6 rounded-full mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-slate-300">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-600">No hay citas encontradas</h3>
              <p className="text-slate-400 font-medium mb-6">Prueba cambiando los filtros de búsqueda</p>
              <button
                className="btn btn-outline btn-sm text-blue-600 border-blue-200 hover:border-blue-600 hover:bg-blue-50"
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

      {/* --- MODAL DE CANCELACIÓN --- */}
      <CancelarCitaModal 
        isOpen={!!idCancelar}
        onClose={() => setIdCancelar(null)}
        onConfirm={confirmarCancelacion}
      />
    </div>
  );
}