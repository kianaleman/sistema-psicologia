import { useDisponibilidadCita } from '../../hooks/useDisponibilidadCita';
import { esFechaCalendario, erroresFechasTratamiento, errorFechaCalendario, FECHA_MINIMA_SQL, FECHA_MAXIMA_SQL } from '../../utils/fechaCalendario';
import { useMemo, useState } from "react";
import type { 
  Cita, 
  ViaAdministracion, 
  TipoDeTerapia, 
  ExploracionPsicologica,
  CreateSesionDTO,
  CreateCitaDTO,
  TipoCitaCatalogo,
  MetodoPago,
  Banco,
} from "../../types";
import { toast } from "sonner";
import { useBorradorSesion } from '../../hooks/useBorradorSesion';
import { borradoresSesion, crearPayloadSesion, tratamientoVacio, hayTratamientoPendiente } from '../../services/borradoresSesion';
import TestHistorialPaciente from "../tests/TestHistorialPaciente";

interface CitaConSesion extends Cita {
  Sesion?: { ID_Sesion?: number | null } | null;
}

interface SeguimientoForm {
  fecha: string;
  hora: string;
  tipoCitaId: string;
  direccionId: string;
  motivo: string;
  precio: string;
  metodoPagoId: string;
  bancoId: string;
  numeroReferencia: string;
}

// 2. Tipamos estrictamente los catálogos que recibe el Modal (Adiós any)
interface CatalogosSesion {
  viasAdmin?: ViaAdministracion[];
  tiposTerapia?: TipoDeTerapia[];
  exploraciones?: ExploracionPsicologica[];
  tiposCita?: TipoCitaCatalogo[];
  metodosPago?: MetodoPago[];
  bancos?: Banco[];
}

// 3. Tipamos las Props del componente
interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateSesionDTO) => Promise<void>;
  onAgendarSeguimiento?: (data: CreateCitaDTO) => Promise<boolean>;
  onCheckDisponibilidad?: (psicologoId: number, fecha: string) => Promise<string[]>;
  cita: Cita | null;
  catalogos: CatalogosSesion;
}

const Icons = {
  Brain: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path d="M11 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM13.5 10a.5.5 0 00-.5.5v3.25a2.75 2.75 0 005.5 0v-3.25a.5.5 0 00-.5-.5h-4.5zM3 13.5a.5.5 0 00.5.5h3.25a2.75 2.75 0 000-5.5H3.5a.5.5 0 00-.5.5v4.5z" />
    </svg>
  ),
  Diagnosis: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path fillRule="evenodd" d="M12.79 3.523A3.75 3.75 0 0011.25 2H5.25A3.75 3.75 0 001.5 5.25v9.5A3.75 3.75 0 005.25 18h9.5a3.75 3.75 0 003.75-3.75V8.71a2.25 2.25 0 00-.477-1.423l-3.228-3.229zM10.5 15a.75.75 0 00-1.5 0v.008a.75.75 0 001.5 0v-.008zm1.5-6.75a.75.75 0 00-1.5 0v4.5a.75.75 0 001.5 0v-4.5z" clipRule="evenodd" />
    </svg>
  ),
  Pill: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path d="M11.5 2.25a.75.75 0 00-1.5 0v3.75h-3.75a.75.75 0 000 1.5h3.75v3.75a.75.75 0 001.5 0v-3.75h3.75a.75.75 0 000-1.5h-3.75V2.25z" />
    </svg>
  ),
};

const crearFechaInput = (fecha: Date) => {
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, "0");
  const day = String(fecha.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getFechaMananaInput = () => {
  const manana = new Date();
  manana.setDate(manana.getDate() + 1);

  return crearFechaInput(manana);
};

const getMetodoPagoId = (metodo: MetodoPago) => {
  return Number(metodo.ID_Metodo_Pago || 0);
};

const crearSeguimientoInicial = (cita: Cita | null, catalogos: CatalogosSesion): SeguimientoForm => {
  const tipoCitaInicial = catalogos.tiposCita?.[0]?.ID_TipoCita || cita?.ID_TipoCita || 0;
  const primerMetodoPago = catalogos.metodosPago?.[0];
  const metodoPagoInicial = primerMetodoPago ? getMetodoPagoId(primerMetodoPago) : 1;

  return {
    fecha: getFechaMananaInput(),
    hora: "",
    tipoCitaId: tipoCitaInicial ? String(tipoCitaInicial) : "",
    direccionId: cita?.ID_Direccion ? String(cita.ID_Direccion) : "1",
    motivo: "Seguimiento de sesión clínica",
    precio: "",
    metodoPagoId: String(metodoPagoInicial || 1),
    bancoId: "",
    numeroReferencia: "",
  };
};

export default function SesionModal(props: Props) {
  if (!props.isOpen || !props.cita) return null;
  return <FormularioSesion key={`${props.cita.ID_Paciente}:${props.cita.ID_Cita}:${props.cita.ID_Psicologo}`} {...props} cita={props.cita} />;
}

function FormularioSesion({ isOpen, onClose, onSubmit, onAgendarSeguimiento, onCheckDisponibilidad, cita, catalogos }: Props & { cita: Cita }) {
  const fechaCita = new Date(String(cita.FechaCita).slice(0, 10) + 'T00:00:00');
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const { borrador, setter, clave } = useBorradorSesion(cita, fechaCita > hoy ? null : new Date().toISOString());
  const { datosSesion, listaTratamientos, selectedExploraciones, formTratamiento, horaInicioSistema, guardando, errorGuardado } = borrador;
  const setDatosSesion = setter('datosSesion');
  const setListaTratamientos = setter('listaTratamientos');
  const setSelectedExploraciones = setter('selectedExploraciones');
  const setFormTratamiento = setter('formTratamiento');
  const setHoraInicioSistema = setter('horaInicioSistema');
  const setGuardando = setter('guardando');
  const mostrarConfirmacionFechaFutura = horaInicioSistema === null;
  const [mostrarSeguimiento, setMostrarSeguimiento] = useState(false);
  const [seguimientoForm, setSeguimientoForm] = useState<SeguimientoForm>(() => crearSeguimientoInicial(null, catalogos));
  const [seguimientoAgendado, setSeguimientoAgendado] = useState(false);
  const disponibilidadSeguimiento = useDisponibilidadCita(cita.ID_Psicologo, seguimientoForm.fecha, onCheckDisponibilidad, mostrarSeguimiento && !seguimientoAgendado);
  const horariosOcupados = disponibilidadSeguimiento.horarios;
  const [mostrarErroresFechas, setMostrarErroresFechas] = useState(false);
  const erroresFechas = erroresFechasTratamiento(formTratamiento.fechaInicio, formTratamiento.fechaFin);
  const [agendandoSeguimiento, setAgendandoSeguimiento] = useState(false);

  const obtenerFechaCita = (fecha?: string | Date | null) => {
    if (!fecha) return null;

    const fechaCita = fecha instanceof Date ? fecha : new Date(fecha);

    if (Number.isNaN(fechaCita.getTime())) return null;

    return fechaCita;
  };

  const viaMap = useMemo(
    () =>
      new Map(
        (catalogos.viasAdmin || []).map((v) => {
          // Extraemos IDs dinámicos cubriendo posibles variaciones de Prisma
          const vId = (v as unknown as Record<string, unknown>).ID_Via_Administracion || v.ID_ViaAdministracion;
          const vName = (v as unknown as Record<string, unknown>).Nombre_De_Presentacion || (v as unknown as Record<string, unknown>).NombreDePresentacion;
          return [String(vId || ""), String(vName || "Vía N/A")];
        })
      ),
    [catalogos.viasAdmin]
  );

  const terapiaMap = useMemo(
    () =>
      new Map(
        (catalogos.tiposTerapia || []).map((t) => {
          const tId = (t as unknown as Record<string, unknown>).ID_Tipo_Terapia || t.ID_Tipo_Terapia;
          const tName = (t as unknown as Record<string, unknown>).Nombre_De_Terapia || (t as unknown as Record<string, unknown>).NombreDeTerapia;
          return [String(tId || ""), String(tName || "Terapia N/A")];
        })
      ),
    [catalogos.tiposTerapia]
  );

  const metodoPagoRequiereReferencia = Number(seguimientoForm.metodoPagoId) !== 1;
  const horarioSeleccionadoOcupado = horariosOcupados.includes(seguimientoForm.hora);
  const puedeAgendarSeguimiento = Boolean(
    onAgendarSeguimiento &&
    cita?.ID_Paciente &&
    cita?.ID_Psicologo &&
    esFechaCalendario(seguimientoForm.fecha) &&
    disponibilidadSeguimiento.estado === 'cargada' &&
    seguimientoForm.hora &&
    seguimientoForm.tipoCitaId &&
    seguimientoForm.precio &&
    seguimientoForm.metodoPagoId &&
    !horarioSeleccionadoOcupado &&
    (!metodoPagoRequiereReferencia || (seguimientoForm.bancoId && seguimientoForm.numeroReferencia.trim()))
  );

  const citaConSesion = cita as CitaConSesion | null;
  const idSesionAsociada = citaConSesion?.Sesion?.ID_Sesion || null;

  const handleClose = () => {
    if (borradoresSesion.obtener(clave, horaInicioSistema).guardando) return;
    const hayCambios = datosSesion.observaciones || datosSesion.diagnostico || datosSesion.historial
      || datosSesion.criterios !== 'DSM-5' || listaTratamientos.length || selectedExploraciones.size
      || hayTratamientoPendiente(formTratamiento);
    if (hayCambios && !window.confirm('¿Descartar los cambios de esta consulta?')) return;
    borradoresSesion.eliminar(clave);
    onClose();
  };

  const formatearHoraSistema = (fechaIso: string | null) => {
    if (!fechaIso) return "--:--";

    const fecha = new Date(fechaIso);

    if (Number.isNaN(fecha.getTime())) return "--:--";

    return fecha.toLocaleTimeString("es-NI", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatearFechaCita = (fecha?: string | Date | null) => {
    const fechaCita = obtenerFechaCita(fecha);

    if (!fechaCita) return "Fecha no registrada";

    return fechaCita.toLocaleDateString("es-NI", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const handleConfirmarFechaFutura = () => setHoraInicioSistema(new Date().toISOString());
  const handleCancelarFechaFutura = handleClose;

  if (!isOpen || !cita) return null;

  if (mostrarConfirmacionFechaFutura) {
    return (
      <dialog onCancel={(event) => { event.preventDefault(); handleClose(); }} className="modal modal-open bg-black/50 backdrop-blur-sm">
        <div className="modal-box max-w-lg bg-white text-slate-800 rounded-2xl shadow-2xl">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl font-bold">!</span>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-xl text-slate-900">Confirmar inicio de sesión</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                La cita seleccionada está programada para una fecha futura:
              </p>

              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-900">
                <p>
                  <span className="font-semibold">Fecha de la cita:</span>{" "}
                  {formatearFechaCita(cita.FechaCita)}
                </p>
                <p className="mt-1">
                  Al confirmar, se registrará la hora de inicio con la hora actual del sistema.
                </p>
              </div>

              <p className="text-sm text-slate-600">
                Confirma que deseas iniciar la sesión clínica antes de la fecha programada.
              </p>
            </div>
          </div>

          <div className="modal-action">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={handleCancelarFechaFutura}
              disabled={guardando}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn bg-amber-600 text-white hover:bg-amber-700"
              onClick={handleConfirmarFechaFutura}
              disabled={guardando}
            >
              Confirmar e iniciar
            </button>
          </div>
        </div>
      </dialog>
    );
  }

  const getViaNombre = (id: string) => viaMap.get(String(id));
  const getTerapiaNombre = (id: string) => terapiaMap.get(String(id));

  const handleSave = async () => {
    if (!datosSesion.diagnostico.trim()) {
      toast.error("El diagnóstico es obligatorio");
      return;
    }

    if (!horaInicioSistema) {
      toast.error("No se registró la hora de inicio de la sesión");
      return;
    }

    if (!datosSesion.criterios.trim()) return toast.error('Los criterios son obligatorios');
    if (borradoresSesion.obtener(clave, horaInicioSistema).guardando) return;
    if (hayTratamientoPendiente(formTratamiento)) {
      toast.error('Agrega la indicación pendiente al plan antes de guardar.'); return;
    }
    const payload = crearPayloadSesion(cita, borrador);
    setGuardando(true);
    borradoresSesion.actualizar(clave, { errorGuardado: null });
    try {
      await onSubmit(payload);
      borradoresSesion.eliminar(clave);
      onClose();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'No se pudo guardar. Puede reintentar.';
      borradoresSesion.actualizar(clave, { errorGuardado: message });
      toast.error(message);
    } finally {
      borradoresSesion.actualizar(clave, { guardando: false });
    }
  };

  const agregarTratamiento = () => {
    setMostrarErroresFechas(true);
    if (erroresFechas.inicio || erroresFechas.fin) return toast.error(erroresFechas.inicio || erroresFechas.fin);
    if (!formTratamiento.frecuencia) return toast.error("Indica la frecuencia");
    
    if (formTratamiento.tipo === "farmacologico") {
      if (!formTratamiento.medicamento.trim() || !formTratamiento.dosis.trim() || !formTratamiento.viaAdminId)
        return toast.error("Completa datos del fármaco");
    } else {
      if (!formTratamiento.objetivo || !formTratamiento.tipoTerapiaId)
        return toast.error("Completa datos de terapia");
    }

    setListaTratamientos(prev => [
      ...prev, { ...formTratamiento, id: Math.max(0, ...prev.map(t => t.id)) + 1 },
    ]); 
    setFormTratamiento(tratamientoVacio());
    setMostrarErroresFechas(false);
  };

  const eliminarTratamiento = (id: number) => {
    setListaTratamientos((prev) => prev.filter((t) => t.id !== id));
  };

  const toggleExploracion = (id: number) => {
    setSelectedExploraciones((p) => {
      const n = new Set(p);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const handleAgendarSeguimiento = async () => {
    if (!onAgendarSeguimiento) {
      toast.error("No se configuró la acción para agendar seguimiento");
      return;
    }

    if (!cita.ID_Paciente || !cita.ID_Psicologo) {
      toast.error("La cita actual no tiene paciente o psicólogo asociado");
      return;
    }

    const precio = Number(seguimientoForm.precio);
    const metodoPagoId = Number(seguimientoForm.metodoPagoId);
    const tipoCitaId = Number(seguimientoForm.tipoCitaId);
    const direccionId = Number(seguimientoForm.direccionId || cita.ID_Direccion || 1);
    const bancoId = seguimientoForm.bancoId ? Number(seguimientoForm.bancoId) : undefined;

    if (!esFechaCalendario(seguimientoForm.fecha)) return toast.error('Selecciona una fecha válida para la próxima cita.');
    if (disponibilidadSeguimiento.estado !== 'cargada') return toast.error('Confirma la disponibilidad antes de agendar el seguimiento.');
    if (!seguimientoForm.hora) return toast.error("Selecciona la hora de la próxima cita");
    if (horarioSeleccionadoOcupado) return toast.error("El psicólogo ya tiene una cita en ese horario");
    if (!tipoCitaId) return toast.error("Selecciona el tipo de cita");
    if (!Number.isFinite(precio) || precio < 0) return toast.error("Ingresa un precio válido");
    if (!metodoPagoId) return toast.error("Selecciona un método de pago");

    if (metodoPagoRequiereReferencia && (!bancoId || !seguimientoForm.numeroReferencia.trim())) {
      toast.error("Selecciona banco e ingresa número de referencia");
      return;
    }

    const payload: CreateCitaDTO = {
      ID_Paciente: cita.ID_Paciente,
      ID_Psicologo: cita.ID_Psicologo,
      ID_TipoCita: tipoCitaId,
      ID_EstadoCita: 1,
      ID_Direccion: direccionId,
      FechaCita: seguimientoForm.fecha,
      HoraCita: seguimientoForm.hora,
      MotivoConsulta: seguimientoForm.motivo.trim() || "Seguimiento clínico",
      Precio: precio,
      ID_MetodoPago: metodoPagoId,
      ID_Divisa: 1,
      ...(metodoPagoRequiereReferencia
        ? {
            ID_Banco: Number(seguimientoForm.bancoId),
            Numero_Referencia: seguimientoForm.numeroReferencia.trim(),
          }
        : {}),
    };

    try {
      setAgendandoSeguimiento(true);
      const success = await onAgendarSeguimiento(payload);

      if (success) {
        setSeguimientoAgendado(true);
        setMostrarSeguimiento(false);
      }
    } finally {
      setAgendandoSeguimiento(false);
    }
  };

  return (
    <dialog onCancel={(event) => { event.preventDefault(); handleClose(); }} className="modal modal-open bg-black/50 backdrop-blur-sm">
      <div className="modal-box w-11/12 max-w-5xl bg-white text-slate-800 p-0 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="bg-slate-800 text-white px-8 py-4 flex justify-between items-center flex-shrink-0">
          <div className="flex flex-col">
            <h3 className="font-bold text-xl font-serif">Finalizar Sesión Clínica</h3>
            <p className="text-slate-300 text-sm">
              Paciente:{" "}
              <span className="font-medium text-white">
                {cita.Paciente?.Nombre} {cita.Paciente?.Apellido}
              </span>
            </p>
          </div>
          <button className="btn btn-circle btn-ghost text-slate-200" onClick={handleClose} disabled={guardando}>✕</button>
        </div>

        <fieldset disabled={guardando} className="contents"><div className="p-8 overflow-y-auto flex-1 space-y-8 bg-slate-50">
          
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h4 className="font-bold text-slate-700 text-xs uppercase mb-3 flex items-center gap-2">
              <Icons.Brain /> Exploraciones Psicológicas Realizadas
            </h4>
            <div className="flex flex-wrap gap-2">
              {catalogos.exploraciones?.map((exp) => {
                const expId = (exp as unknown as Record<string, number>).ID_Exploracion_Psicologica || exp.ID_ExploracionPsicologica;
                const expName = (exp as unknown as Record<string, string>).Nombre_De_ExploracionPsicologica || exp.Nombre_De_ExploracionPsicologica;
                
                return (
                  <button
                    type="button"
                    key={expId}
                    onClick={() => toggleExploracion(expId)}
                    className={`btn btn-sm rounded-full transition-all text-xs font-medium ${
                      selectedExploraciones.has(expId)
                        ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md"
                        : "btn-outline border-slate-300 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {expName}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="form-control">
              <label className="label font-bold text-slate-600 text-xs uppercase">Observaciones</label>
              <textarea
                className="textarea textarea-bordered bg-white h-32 focus:border-primary"
                placeholder="Notas generales..."
                aria-label="Observaciones clínicas"
                value={datosSesion.observaciones}
                onChange={(e) => setDatosSesion({ ...datosSesion, observaciones: e.target.value })}
              />
            </div>
            
            <div className="form-control">
              <label className="label font-bold text-slate-600 text-xs uppercase flex justify-between">
                <span>Diagnóstico Diferencial *</span>
                <span className="text-xs font-normal text-slate-400">({datosSesion.criterios})</span>
              </label>
              <textarea
                className="textarea textarea-bordered bg-white h-32 focus:border-red-500"
                placeholder="Diagnóstico principal (Obligatorio)..."
                aria-label="Diagnóstico diferencial"
                value={datosSesion.diagnostico}
                onChange={(e) => setDatosSesion({ ...datosSesion, diagnostico: e.target.value })}
              />
            </div>
            
            <div className="form-control">
              <label className="label font-bold text-slate-600 text-xs uppercase">Evolución / Historial</label>
              <textarea
                className="textarea textarea-bordered bg-white h-32 focus:border-amber-500"
                placeholder="Detalles evolutivos..."
                aria-label="Evolución clínica"
                value={datosSesion.historial}
                onChange={(e) => setDatosSesion({ ...datosSesion, historial: e.target.value })}
              />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-emerald-300 shadow-md">
            <h4 className="font-bold text-emerald-800 text-sm uppercase mb-4 flex items-center gap-2">
              <Icons.Pill /> Plan de Tratamiento y Recomendaciones
            </h4>
            
            <div className="grid grid-cols-1 gap-4 md:grid-cols-12 items-end bg-slate-50 p-4 rounded-lg border border-slate-100 mb-4">
              <div className="col-span-1 md:col-span-2">
                <label className="label-text text-xs text-slate-500 font-bold">Tipo</label>
                <select
                  className="select select-bordered select-sm w-full bg-white"
                  aria-label="Tipo de tratamiento"
                      value={formTratamiento.tipo}
                  onChange={(e) => setFormTratamiento({ ...formTratamiento, tipo: e.target.value as "farmacologico" | "terapeutico" })}
                >
                  <option value="terapeutico">Terapia</option>
                  <option value="farmacologico">Fármaco</option>
                </select>
              </div>

              {formTratamiento.tipo === "farmacologico" ? (
                <>
                  <div className="col-span-1 md:col-span-3">
                    <label className="label-text text-xs text-slate-500 font-bold">Medicamento</label>
                    <input
                      className="input input-bordered input-sm w-full bg-white"
                      placeholder="Ej: Sertralina"
                      aria-label="Medicamento"
                      value={formTratamiento.medicamento}
                      onChange={(e) => setFormTratamiento({ ...formTratamiento, medicamento: e.target.value })}
                    />
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <label className="label-text text-xs text-slate-500 font-bold">Dosis</label>
                    <input
                      className="input input-bordered input-sm w-full bg-white"
                      placeholder="Ej: 50mg"
                      aria-label="Dosis"
                      value={formTratamiento.dosis}
                      onChange={(e) => setFormTratamiento({ ...formTratamiento, dosis: e.target.value })}
                    />
                  </div>
                  <div className="col-span-1 md:col-span-3">
                    <label className="label-text text-xs text-slate-500 font-bold">Vía Admin.</label>
                    <select
                      className="select select-bordered select-sm w-full bg-white"
                      aria-label="Vía de administración"
                      value={formTratamiento.viaAdminId}
                      onChange={(e) => setFormTratamiento({ ...formTratamiento, viaAdminId: e.target.value })}
                    >
                      <option value="">Seleccionar...</option>
                      {catalogos.viasAdmin?.map((v) => {
                        const vId = (v as unknown as Record<string, number>).ID_Via_Administracion || v.ID_ViaAdministracion;
                        const vName = (v as unknown as Record<string, string>).Nombre_De_Presentacion || (v as unknown as Record<string, string>).NombreDePresentacion;
                        return (
                          <option key={vId} value={vId}>
                            {vName}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div className="col-span-1 md:col-span-3">
                    <label className="label-text text-xs text-slate-500 font-bold">Objetivo</label>
                    <input
                      className="input input-bordered input-sm w-full bg-white"
                      placeholder="Ej: Reducir ansiedad"
                      aria-label="Objetivo terapéutico"
                      value={formTratamiento.objetivo}
                      onChange={(e) => setFormTratamiento({ ...formTratamiento, objetivo: e.target.value })}
                    />
                  </div>
                  <div className="col-span-1 md:col-span-5">
                    <label className="label-text text-xs text-slate-500 font-bold">Tipo Terapia</label>
                    <select
                      className="select select-bordered select-sm w-full bg-white"
                      aria-label="Tipo de terapia"
                      value={formTratamiento.tipoTerapiaId}
                      onChange={(e) => setFormTratamiento({ ...formTratamiento, tipoTerapiaId: e.target.value })}
                    >
                      <option value="">Seleccionar...</option>
                      {catalogos.tiposTerapia?.map((t) => {
                        const tId = (t as unknown as Record<string, number>).ID_Tipo_Terapia || t.ID_Tipo_Terapia;
                        const tName = (t as unknown as Record<string, string>).Nombre_De_Terapia || (t as unknown as Record<string, string>).NombreDeTerapia;
                        return (
                          <option key={tId} value={tId}>
                            {tName}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </>
              )}

              <div className="col-span-1 md:col-span-2">
                <label className="label-text text-xs text-slate-500 font-bold">Frecuencia</label>
                <input
                  className="input input-bordered input-sm w-full bg-white"
                  placeholder="Ej: Cada 8h"
                  aria-label="Frecuencia"
                      value={formTratamiento.frecuencia}
                  onChange={(e) => setFormTratamiento({ ...formTratamiento, frecuencia: e.target.value })}
                />
              </div>

              <fieldset className="col-span-1 md:col-span-12 rounded-xl border border-slate-200 bg-white p-4">
                <legend className="px-2 text-sm font-bold text-slate-700">Fechas del tratamiento</legend>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="form-control min-w-0">
                    <label htmlFor={`tratamiento-inicio-${cita.ID_Cita}`} className="mb-2 block text-sm font-semibold text-slate-600">Fecha de inicio</label>
                    <input id={`tratamiento-inicio-${cita.ID_Cita}`} aria-label="Fecha de inicio del tratamiento" type="date" required
                      className={`input input-bordered h-11 min-h-11 w-full bg-white ${mostrarErroresFechas && erroresFechas.inicio ? 'input-error' : ''}`}
                      min={FECHA_MINIMA_SQL} max={FECHA_MAXIMA_SQL}
                      value={formTratamiento.fechaInicio}
                      onBlur={() => setMostrarErroresFechas(true)}
                      onChange={e => setFormTratamiento({ ...formTratamiento, fechaInicio: e.target.value })}
                      aria-invalid={mostrarErroresFechas && !!erroresFechas.inicio}
                      aria-describedby={mostrarErroresFechas && erroresFechas.inicio ? `error-tratamiento-inicio-${cita.ID_Cita}` : undefined} />
                    {mostrarErroresFechas && erroresFechas.inicio && <p id={`error-tratamiento-inicio-${cita.ID_Cita}`} role="alert" className="mt-2 text-xs text-red-600">{erroresFechas.inicio}</p>}
                  </div>
                  <div className="form-control min-w-0">
                    <label htmlFor={`tratamiento-fin-${cita.ID_Cita}`} className="mb-2 block text-sm font-semibold text-slate-600">Fecha de fin (opcional)</label>
                    <input id={`tratamiento-fin-${cita.ID_Cita}`} aria-label="Fecha de fin del tratamiento" type="date"
                      className={`input input-bordered h-11 min-h-11 w-full bg-white ${mostrarErroresFechas && erroresFechas.fin ? 'input-error' : ''}`}
                      min={esFechaCalendario(formTratamiento.fechaInicio) ? formTratamiento.fechaInicio : FECHA_MINIMA_SQL} max={FECHA_MAXIMA_SQL}
                      value={formTratamiento.fechaFin}
                      onBlur={() => setMostrarErroresFechas(true)}
                      onChange={e => setFormTratamiento({ ...formTratamiento, fechaFin: e.target.value })}
                      aria-invalid={mostrarErroresFechas && !!erroresFechas.fin}
                      aria-describedby={mostrarErroresFechas && erroresFechas.fin ? `error-tratamiento-fin-${cita.ID_Cita}` : undefined} />
                    {mostrarErroresFechas && erroresFechas.fin && <p id={`error-tratamiento-fin-${cita.ID_Cita}`} role="alert" className="mt-2 text-xs text-red-600">{erroresFechas.fin}</p>}
                  </div>
                </div>
              </fieldset>
              <div className="col-span-1 md:col-span-12 flex justify-end mt-2">
                <button
                  type="button"
                  className="btn btn-sm bg-emerald-600 text-white hover:bg-emerald-700 shadow-md"
                  onClick={agregarTratamiento}
                >
                  + Agregar Indicación
                </button>
              </div>
            </div>

            {listaTratamientos.length > 0 && (
              <div className="overflow-x-auto mt-6">
                <table className="table table-xs w-full bg-white rounded-lg border border-slate-200">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 uppercase text-xs font-bold">
                      <th>Tipo</th>
                      <th>Detalle Principal</th>
                      <th>Especificación</th>
                      <th>Frecuencia</th>
                      {/* Solución al error del th vacío agregando aria-hidden */}
                      <th className="w-16" aria-hidden="true" />
                    </tr>
                  </thead>
                  <tbody>
                    {listaTratamientos.map((t) => (
                      <tr key={t.id} className="hover:bg-emerald-50/50 transition-colors">
                        <td>
                          <span
                            className={`badge badge-xs ${
                              t.tipo === "farmacologico" ? "bg-info/30 text-info" : "bg-warning/30 text-warning"
                            } border-none font-medium`}
                          >
                            {t.tipo === "farmacologico" ? "Fármaco" : "Terapia"}
                          </span>
                        </td>
                        <td className="font-bold text-slate-700">
                          {t.tipo === "farmacologico" ? t.medicamento : t.objetivo}
                        </td>
                        <td>
                          {t.tipo === "farmacologico"
                            ? `${t.dosis} (${getViaNombre(t.viaAdminId) || "Vía N/A"})`
                            : getTerapiaNombre(t.tipoTerapiaId) || "Terapia N/A"}
                        </td>
                        <td className="text-sm text-slate-600">{t.frecuencia}</td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs text-red-500 hover:bg-red-100"
                            onClick={() => eliminarTratamiento(t.id)}
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>


          <div className="bg-white p-5 rounded-xl border border-indigo-200 shadow-sm">
            <TestHistorialPaciente
              idPaciente={cita.ID_Paciente}
              idSesion={idSesionAsociada}
              contexto="EN_SESION"
              compacto
            />
          </div>

          <div className="bg-white p-5 rounded-xl border border-blue-200 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h4 className="font-bold text-blue-800 text-sm uppercase flex items-center gap-2">
                  Próxima cita de seguimiento
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Agenda una nueva cita para el mismo paciente y el mismo psicólogo sin cerrar esta sesión.
                </p>
              </div>

              {seguimientoAgendado ? (
                <span className="badge badge-success text-white">Seguimiento agendado</span>
              ) : (
                <button
                  type="button"
                  className="btn btn-sm btn-outline btn-primary"
                  onClick={() => setMostrarSeguimiento((prev) => !prev)}
                  disabled={guardando || agendandoSeguimiento}
                >
                  {mostrarSeguimiento ? "Ocultar formulario" : "+ Agendar seguimiento"}
                </button>
              )}
            </div>

            {mostrarSeguimiento && !seguimientoAgendado && (
              <div className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-3 bg-blue-50/40 border border-blue-100 rounded-xl p-4">
                <div className="md:col-span-3">
                  <label className="label-text text-xs text-slate-500 font-bold">Fecha</label>
                  <input
                    type="date"
                    className="input input-bordered input-sm w-full bg-white"
                    value={seguimientoForm.fecha}
                    min={crearFechaInput(new Date())}
                    max={FECHA_MAXIMA_SQL}
                    onChange={(event) => setSeguimientoForm({ ...seguimientoForm, fecha: event.target.value, hora: "" })}
                    disabled={agendandoSeguimiento}
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="label-text text-xs text-slate-500 font-bold">Hora</label>
                  <input
                    type="time"
                    step={60}
                    className={`input input-bordered input-sm w-full bg-white ${
                      horarioSeleccionadoOcupado ? "border-red-400 focus:border-red-500" : ""
                    }`}
                    value={seguimientoForm.hora}
                    onChange={(event) => setSeguimientoForm({ ...seguimientoForm, hora: event.target.value })}
                    disabled={agendandoSeguimiento || !seguimientoForm.fecha}
                  />
                  {horarioSeleccionadoOcupado && (
                    <p className="text-[11px] text-red-500 mt-1">
                      El psicólogo ya tiene una cita registrada exactamente a esa hora.
                    </p>
                  )}
                </div>

                <div className="md:col-span-3">
                  <label className="label-text text-xs text-slate-500 font-bold">Tipo de cita</label>
                  <select
                    className="select select-bordered select-sm w-full bg-white"
                    value={seguimientoForm.tipoCitaId}
                    onChange={(event) => setSeguimientoForm({ ...seguimientoForm, tipoCitaId: event.target.value })}
                    disabled={agendandoSeguimiento}
                  >
                    <option value="">Seleccionar...</option>
                    {catalogos.tiposCita?.map((tipo) => (
                      <option key={tipo.ID_TipoCita} value={tipo.ID_TipoCita}>
                        {tipo.Nombre_DeCita}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-3">
                  <label className="label-text text-xs text-slate-500 font-bold">Precio</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="input input-bordered input-sm w-full bg-white"
                    placeholder="0.00"
                    value={seguimientoForm.precio}
                    onChange={(event) => setSeguimientoForm({ ...seguimientoForm, precio: event.target.value })}
                    disabled={agendandoSeguimiento}
                  />
                </div>

                <div className="md:col-span-4">
                  <label className="label-text text-xs text-slate-500 font-bold">Método de pago</label>
                  <select
                    className="select select-bordered select-sm w-full bg-white"
                    value={seguimientoForm.metodoPagoId}
                    onChange={(event) => setSeguimientoForm({ ...seguimientoForm, metodoPagoId: event.target.value, bancoId: "", numeroReferencia: "" })}
                    disabled={agendandoSeguimiento}
                  >
                    <option value="">Seleccionar...</option>
                    {catalogos.metodosPago?.map((metodo) => (
                      <option key={getMetodoPagoId(metodo)} value={getMetodoPagoId(metodo)}>
                        {metodo.Nombre_Metodo}
                      </option>
                    ))}
                  </select>
                </div>

                {metodoPagoRequiereReferencia && (
                  <>
                    <div className="md:col-span-4">
                      <label className="label-text text-xs text-slate-500 font-bold">Banco</label>
                      <select
                        className="select select-bordered select-sm w-full bg-white"
                        value={seguimientoForm.bancoId}
                        onChange={(event) => setSeguimientoForm({ ...seguimientoForm, bancoId: event.target.value })}
                        disabled={agendandoSeguimiento}
                      >
                        <option value="">Seleccionar...</option>
                        {catalogos.bancos?.map((banco) => (
                          <option key={banco.ID_Banco} value={banco.ID_Banco}>
                            {banco.Nombre_Banco}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-4">
                      <label className="label-text text-xs text-slate-500 font-bold">Referencia</label>
                      <input
                        className="input input-bordered input-sm w-full bg-white"
                        placeholder="Número de referencia"
                        value={seguimientoForm.numeroReferencia}
                        onChange={(event) => setSeguimientoForm({ ...seguimientoForm, numeroReferencia: event.target.value })}
                        disabled={agendandoSeguimiento}
                      />
                    </div>
                  </>
                )}

                <div className="md:col-span-12">
                  <label className="label-text text-xs text-slate-500 font-bold">Motivo de seguimiento</label>
                  <textarea
                    className="textarea textarea-bordered textarea-sm w-full bg-white min-h-[80px]"
                    value={seguimientoForm.motivo}
                    onChange={(event) => setSeguimientoForm({ ...seguimientoForm, motivo: event.target.value })}
                    disabled={agendandoSeguimiento}
                  />
                </div>

                {seguimientoForm.fecha && !esFechaCalendario(seguimientoForm.fecha) && <p role="alert" className="md:col-span-12 text-xs text-red-600">{errorFechaCalendario(seguimientoForm.fecha)}</p>}
                {disponibilidadSeguimiento.estado === 'cargando' && <p role="status" className="md:col-span-12 text-xs">Consultando disponibilidad...</p>}
                {disponibilidadSeguimiento.estado === 'error' && <div role="alert" className="md:col-span-12 text-sm text-red-700">
                  <p>No se pudo comprobar la disponibilidad. {disponibilidadSeguimiento.error}</p>
                  <button type="button" className="btn btn-sm btn-outline mt-2" onClick={disponibilidadSeguimiento.reintentar}>Reintentar disponibilidad</button>
                </div>}
                {horarioSeleccionadoOcupado && (
                  <div className="md:col-span-12 text-xs text-red-600 font-medium">
                    El horario seleccionado ya está ocupado para este psicólogo.
                  </div>
                )}

                <div className="md:col-span-12 flex justify-end">
                  <button
                    type="button"
                    className="btn btn-sm bg-blue-600 text-white hover:bg-blue-700"
                    onClick={handleAgendarSeguimiento}
                    disabled={agendandoSeguimiento || !puedeAgendarSeguimiento}
                  >
                    {agendandoSeguimiento ? <span className="loading loading-spinner loading-xs" /> : "Agendar nueva cita"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        </fieldset>
        {errorGuardado && <p role="alert" className="p-4 text-red-700">{errorGuardado} El borrador se conserva para reintentar.</p>}
        <div className="bg-white p-4 border-t border-slate-200 flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center flex-shrink-0">
          <div className="text-xs text-slate-500">
            <span className="font-semibold text-slate-700">Inicio:</span>{" "}
            {formatearHoraSistema(horaInicioSistema)}
            <span className="mx-2 text-slate-300">|</span>
            <span>La hora final se registrará al guardar</span>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <button className="btn btn-ghost" onClick={handleClose} disabled={guardando}>Cancelar</button>
            <button
              className="btn w-full sm:w-auto bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg px-8"
              onClick={handleSave}
              disabled={guardando}
            >
              {guardando ? <span className="loading loading-spinner loading-sm" /> : "Finalizar Consulta y Guardar"}
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}