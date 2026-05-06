import { useState } from "react";
//import { toast } from "sonner";
import { useCitas } from "../hooks/useCitas";
import { usePacientes } from "../hooks/usePacientes"; // 🟢 Importación agregada
import type { Cita } from "../types";

import CitaFormModal from "../components/citas/CitaFormModal";
import SesionModal from "../components/citas/SesionModal";
import HistorialModal from "../components/citas/HistorialModal";
import CancelarCitaModal from "../components/citas/CancelarCitaModal";
import PacienteFormModal from "../components/pacientes/PacienteFormModal"; 

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
  const { acciones: accionesPacientes } = usePacientes(); 

  const [modalOpen, setModalOpen] = useState<"create" | "session" | "view" | "paciente" | null>(null); 
  const [selectedCita, setSelectedCita] = useState<Cita | null>(null);
  const [idCancelar, setIdCancelar] = useState<number | null>(null);
  // 🟢 ESTADO PARA DATOS PRECARGADOS DE SEGUIMIENTO
  const [seguimientoData, setSeguimientoData] = useState<any>(null);
  // 🟢 ESTADO INDEPENDIENTE PARA NO CERRAR EL MODAL DE SESIÓN
  const [isSeguimientoOpen, setIsSeguimientoOpen] = useState(false);

  const openModal = (type: "create" | "session" | "view" | "paciente", cita?: Cita) => { 
    setSelectedCita(cita || null);
    if (type !== "create") setSeguimientoData(null); 
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
      // 🟢 Si el éxito viene de un seguimiento, cerramos su estado específico
      if (isSeguimientoOpen) {
        setIsSeguimientoOpen(false);
        setSeguimientoData(null);
      } else {
        setModalOpen(null);
        setSeguimientoData(null);
      }
    }
    return success;
  };

  // 🟢 Función para abrir el modal de citas sin desmontar SesionModal
  const handleAbrirSeguimiento = (datos: any) => {
    setSeguimientoData(datos);
    setIsSeguimientoOpen(true); // Abrimos en un estado paralelo
  };

  const handleCreatePaciente = async (data: any) => {
    const success = await accionesPacientes.crearPaciente(data);
    if (success) {
      // Refrescamos los catálogos para que el nuevo paciente aparezca en el select de citas
      await acciones.reloadCatalogos?.();
      // Regresamos al modal de la cita
      setModalOpen("create");
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
    const success = await acciones.guardarSesion(data);
    if (success) setModalOpen(null);
  };

  const formatearHora = (h: string) => {
    if (!h) return "--:--";
    const fecha = new Date(h);
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
      weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC"
    };
    const fechaStr = fechaObj.toLocaleDateString("es-ES", opciones);
    return fechaStr.charAt(0).toUpperCase() + fechaStr.slice(1);
  };

  const getEstadoColor = (st: string) => {
    const s = st.toLowerCase();
    if (s.includes("programada") || s.includes("pendiente")) return "bg-blue-100 text-blue-700";
    if (s.includes("completada") || s.includes("realizada")) return "bg-emerald-100 text-emerald-700";
    if (s.includes("cancelada") || s.includes("no asistió")) return "bg-rose-100 text-rose-700";
    // 🟡 Resaltado para el nuevo estado propuesto
    if (s.includes("no procesada")) return "bg-amber-100 text-amber-700 border border-amber-200";
    return "bg-slate-100 text-slate-700";
  };

  const renderDireccion = (dir: any) => {
    if (!dir) return null;
    const direccionCompleta = `${dir.Ciudad}, B° ${dir.Barrio}, ${dir.Calle}`;
    return (
      <div className="flex items-start gap-1.5 text-[11px] text-slate-500 mt-2 bg-slate-50 p-2 rounded-lg border border-slate-100 shadow-sm" title={direccionCompleta}>
        <span className="text-sm shrink-0">📍</span>
        <span className="leading-tight font-medium text-slate-600">{direccionCompleta}</span>
      </div>
    );
  };

  return (
    <div className="p-8 animate-fade-in-up max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight font-serif">Agenda Clínica</h1>
          <p className="text-slate-500 mt-1 text-sm">Gestión de citas ({citas.length} visualizadas)</p>
        </div>
        <button className="btn btn-primary shadow-lg text-white gap-2 rounded-xl px-6" onClick={() => openModal("create")}>
          <Icons.Plus /> Agendar Cita
        </button>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 mb-8">
        <div className="flex flex-col lg:flex-row gap-6 justify-between">
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><Icons.Calendar /> Período</span>
            <div className="flex flex-wrap items-center gap-3">
              <div className="join bg-slate-100 p-1 rounded-lg border border-slate-200">
                {[{ id: "hoy", label: "Hoy" }, { id: "semana", label: "Semana" }, { id: "mes", label: "Mes" }, { id: "todos", label: "Todas" }, { id: "rango", label: "Rango" }].map((btn) => (
                  <button key={btn.id} className={`join-item btn btn-sm border-none transition-all ${filtros.periodo === btn.id ? "bg-white text-slate-900 shadow-sm" : "bg-transparent text-slate-500"}`} onClick={() => setFiltro("periodo", btn.id)}>{btn.label}</button>
                ))}
              </div>

              {filtros.periodo === 'rango' && (
                <div className="flex items-center gap-2 animate-fade-in">
                  <input 
                    type="date" 
                    className="input input-bordered input-xs bg-white rounded-md text-slate-600 font-bold border-slate-200" 
                    value={filtros.fechaInicio}
                    onChange={(e) => {
                        setFiltro('fechaInicio', e.target.value);
                        if (filtros.fechaFin && e.target.value > filtros.fechaFin) {
                          setFiltro('fechaFin', '');
                        }
                    }}
                  />
                  <span className="text-xs text-slate-400 font-bold">al</span>
                  <input 
                    type="date" 
                    className="input input-bordered input-xs bg-white rounded-md text-slate-600 font-bold border-slate-200" 
                    value={filtros.fechaFin}
                    min={filtros.fechaInicio} 
                    onChange={(e) => setFiltro('fechaFin', e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 flex-1">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><Icons.Filter /> Criterios</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input list="lista-doctores" placeholder="Doctor..." className="input input-bordered input-sm w-full pl-9 bg-slate-50" value={filtros.psicologo} onChange={(e) => setFiltro("psicologo", e.target.value)} />
              <input list="lista-pacientes" placeholder="Paciente..." className="input input-bordered input-sm w-full pl-9 bg-slate-50" value={filtros.paciente} onChange={(e) => setFiltro("paciente", e.target.value)} />
              <select className="select select-bordered select-sm bg-slate-50 w-full" value={filtros.estado} onChange={(e) => setFiltro("estado", e.target.value)}>
                <option value="">Todos los estados</option>
                {catalogos.estadosCita.map((e: any) => (<option key={e.ID_EstadoCita} value={e.ID_EstadoCita}>{e.NombreEstado}</option>))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-32"><span className="loading loading-spinner loading-lg text-primary"></span></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {citas.map((cita) => {
            const nombreEstado = cita.EstadoCita?.NombreEstado || "";
            const esProgramada = nombreEstado.toLowerCase().includes("programada") || nombreEstado.toLowerCase().includes("pendiente");
            const esCancelada = nombreEstado.toLowerCase().includes("cancelada") || nombreEstado.toLowerCase().includes("no asistió");
            // 🟢 Variable utilizada para aplicar estilos de borde adicionales si el estado es "no procesada"
            const esNoProcesada = nombreEstado.toLowerCase().includes("no procesada");

            // 🟡 Lógica de Advertencia (Warning): Más de 2 horas de retraso y sigue pendiente
            const horaCita = new Date(cita.HoraCita);
            const ahora = new Date();
            const diferenciaHoras = (ahora.getTime() - horaCita.getTime()) / (1000 * 60 * 60);
            const esAlerta = esProgramada && diferenciaHoras >= 2;

            return (
              <div 
                key={cita.ID_Cita} 
                className={`card bg-white border shadow-sm hover:shadow-md transition-all flex flex-col 
                  ${esCancelada ? "opacity-60 grayscale border-slate-200" : ""} 
                  ${esAlerta ? "border-amber-400 bg-amber-50/50 shadow-md ring-1 ring-amber-200" : "border-slate-200"}
                  ${esNoProcesada ? "border-dashed border-2 border-amber-300 shadow-inner" : ""}`}
              >
                {/* Banner de alerta para citas olvidadas */}
                {esAlerta && (
                  <div className="bg-amber-500 text-white text-[9px] font-black uppercase py-1 px-3 text-center rounded-t-xl">
                    ⚠️ ATENCIÓN: SESIÓN SIN FINALIZAR
                  </div>
                )}

                <div className="px-6 py-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500 uppercase">📅 {formatearFechaCompleta(cita.FechaCita)}</span>
                  <div className={`badge ${getEstadoColor(nombreEstado)} font-bold border-none h-auto py-1 px-3 rounded-md text-[10px]`}>
                    {nombreEstado.toUpperCase()}
                  </div>
                </div>

                <div className="p-6 flex gap-4">
                  <div className="flex flex-col items-center justify-center bg-blue-50 text-blue-700 rounded-lg p-3 min-w-[90px] h-fit text-center">
                    <span className="text-lg font-black tracking-tighter leading-none">{formatearHora(cita.HoraCita)}</span>
                    <span className="text-[9px] font-bold uppercase mt-1 opacity-60">Hora</span>
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <h3 className="font-bold text-slate-800 text-lg leading-tight truncate">{cita.Paciente?.Nombre} {cita.Paciente?.Apellido}</h3>
                    <div className="flex flex-wrap gap-2 items-center text-sm text-slate-500">
                      <span className="badge badge-sm badge-outline text-slate-500">{cita.TipoDeCita?.Nombre_DeCita}</span>
                      {cita.NumeroSesion && <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-200">Sesión #{cita.NumeroSesion}</span>}
                    </div>
                    <div className="text-xs text-slate-400 pt-1">Dr. {cita.Psicologo?.Apellido}</div>

                    {!esCancelada && cita.Direccion && renderDireccion(cita.Direccion)}
                    
                    {esCancelada && (
                        <div className="mt-2 p-2 bg-rose-50 border border-rose-100 rounded-lg text-rose-700 text-[10px] italic">
                            "{cita.NotasCancelacion || 'Sin observaciones'}"
                        </div>
                    )}
                  </div>
                </div>

                <div className="px-6 py-3 bg-white border-t border-slate-100 flex justify-between items-center mt-auto">
                  <div className="flex-1 text-xs text-slate-400 italic truncate mr-4">"{cita.MotivoConsulta}"</div>
                  <div className="flex gap-2">
                    {esProgramada ? (
                      <>
                        <button className="btn btn-ghost btn-xs text-slate-400 hover:text-red-500" onClick={() => setIdCancelar(cita.ID_Cita)}>✕</button>
                        <button className="btn btn-outline btn-xs" onClick={() => openModal("create", cita)}>Editar</button>
                        <button className="btn btn-primary btn-sm text-white shadow-sm px-4" onClick={() => openModal("session", cita)}>Iniciar</button>
                      </>
                    ) : (
                      <button className="btn btn-outline btn-info btn-sm w-full" onClick={() => openModal("view", cita)}>📄 Ver Expediente</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 🟢 MODAL DE CREACIÓN/EDICIÓN NORMAL */}
      <CitaFormModal 
        isOpen={modalOpen === "create"} 
        onClose={() => { setModalOpen(null); setSeguimientoData(null); }} 
        onSubmit={handleCreateOrUpdate} 
        citaEditar={selectedCita} 
        catalogos={catalogos} 
        onOpenAddPaciente={() => setModalOpen("paciente")}
      />

      {/* 🟢 MODAL PARA SEGUIMIENTO (INSTANCIA PARALELA PARA NO DESMONTAR LA SESIÓN) */}
      <CitaFormModal 
        isOpen={isSeguimientoOpen} 
        onClose={() => { setIsSeguimientoOpen(false); setSeguimientoData(null); }} 
        onSubmit={handleCreateOrUpdate} 
        citaEditar={null} 
        catalogos={catalogos} 
        datosSeguimiento={seguimientoData} 
      />

      <PacienteFormModal 
        isOpen={modalOpen === "paciente"} 
        onClose={() => setModalOpen("create")} 
        catalogos={catalogos}
        onSubmit={handleCreatePaciente} 
        pacienteEditar={null}
      />

      {/* SesionModal permanece "viviendo" debajo de Seguimiento si isSeguimientoOpen es true */}
      <SesionModal 
        isOpen={modalOpen === "session"} 
        onClose={() => setModalOpen(null)} 
        onSubmit={handleFinalizarSesion} 
        cita={selectedCita} 
        catalogos={catalogos}
        onOpenAgendarSeguimiento={handleAbrirSeguimiento} 
      />

      <HistorialModal isOpen={modalOpen === "view"} onClose={() => setModalOpen(null)} cita={selectedCita} />
      <CancelarCitaModal isOpen={!!idCancelar} onClose={() => setIdCancelar(null)} onConfirm={confirmarCancelacion} />
    </div>
  );
}