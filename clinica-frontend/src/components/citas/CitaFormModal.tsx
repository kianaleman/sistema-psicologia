import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import type {
  Cita,
  CreateCitaDTO,
  Paciente,
  Psicologo,
  TipoCitaCatalogo,
  MetodoPago,
  Banco
} from '../../types';

interface CatalogosModal {
  pacientes: Paciente[];
  psicologos: Psicologo[];
  tiposCita: TipoCitaCatalogo[];
  metodosPago: MetodoPago[];
  bancos?: Banco[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateCitaDTO, isEdit: boolean) => Promise<boolean | void>;
  citaEditar: Cita | null;
  catalogos: CatalogosModal;
  onNewPacienteClick?: () => void;
  onCheckDisponibilidad: (psicologoId: number, fecha: string) => Promise<string[]>;
}

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
  Money: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-5 w-5">
      <circle cx="12" cy="12" r="8.25" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5v9M9.75 14.25c.6.75 1.35 1.125 2.25 1.125 1.24 0 2.25-.756 2.25-1.688 0-.932-1.01-1.687-2.25-1.687s-2.25-.756-2.25-1.688c0-.932 1.01-1.687 2.25-1.687.9 0 1.65.375 2.25 1.125" />
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
  Time: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-5 w-5">
      <circle cx="12" cy="12" r="8.25" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5v5l3.25 2" />
    </svg>
  ),
  Calendar: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 3v3M17 3v3M4.5 8.25h15M5.25 5.25h13.5A1.5 1.5 0 0120.25 6.75v12A1.5 1.5 0 0118.75 20.25H5.25A1.5 1.5 0 013.75 18.75v-12A1.5 1.5 0 015.25 5.25z" />
    </svg>
  ),
  PlusSmall: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
      <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
    </svg>
  ),
  MapPin: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s7.5-4.875 7.5-11.25a7.5 7.5 0 10-15 0C4.5 16.125 12 21 12 21z" />
      <circle cx="12" cy="9.75" r="2.75" />
    </svg>
  ),
  Receipt: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3.75h10.5v16.5l-2.25-1.5-2.25 1.5-2.25-1.5-2.25 1.5-2.25-1.5v-15z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25h6M9 12h6M9 15.75h3.75" />
    </svg>
  ),
  Check: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-5 w-5">
      <circle cx="12" cy="12" r="8.25" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.75 12.25l2.25 2.25 4.5-5" />
    </svg>
  ),
  Alert: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4.25M12 16.5h.01" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.29 3.86L2.82 17.25A2.25 2.25 0 004.79 20.5h14.42a2.25 2.25 0 001.97-3.25L13.71 3.86a2 2 0 00-3.42 0z" />
    </svg>
  ),
  Close: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
};

const initialForm = {
  fecha: '',
  hora: '',
  motivo: '',
  pacienteId: '',
  psicologoId: '',
  tipoCitaId: '',
  precio: '',
  metodoPagoId: '',
  numeroReferencia: '',
  bancoId: '',
  modalidadAtencion: 'clinica' as 'clinica' | 'domicilio'
};

export default function CitaFormModal({ isOpen, onClose, onSubmit, citaEditar, catalogos, onNewPacienteClick, onCheckDisponibilidad }: Props) {
  const [formData, setFormData] = useState(initialForm);
  const [guardando, setGuardando] = useState(false);
  const [timePart, setTimePart] = useState({ hour: '12', minute: '00', period: 'AM' });
  const [busquedaPaciente, setBusquedaPaciente] = useState('');
  const [busquedaPsicologo, setBusquedaPsicologo] = useState('');
  const [horariosOcupados, setHorariosOcupados] = useState<string[]>([]);
  const [cargandoHorarios, setCargandoHorarios] = useState(false);

  const parse24to12 = (time24: string) => {
    if (!time24) return { hour: '08', minute: '00', period: 'AM' };

    const [h, m] = time24.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    let hour = h % 12;

    if (hour === 0) hour = 12;

    return {
      hour: hour.toString().padStart(2, '0'),
      minute: m.toString().padStart(2, '0'),
      period
    };
  };

  const updateTime24 = (newHour: string, newMinute: string, newPeriod: string) => {
    let h = parseInt(newHour);

    if (newPeriod === 'PM' && h !== 12) h += 12;
    if (newPeriod === 'AM' && h === 12) h = 0;

    const time24 = `${h.toString().padStart(2, '0')}:${newMinute}`;

    setTimePart({ hour: newHour, minute: newMinute, period: newPeriod });
    setFormData((prev) => ({ ...prev, hora: time24 }));
  };

  const handleMinuteChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 2);
    setTimePart((prev) => ({ ...prev, minute: val }));
  };

  const handleMinuteBlur = () => {
    let m = parseInt(timePart.minute || '0');

    if (isNaN(m) || m < 0) m = 0;
    if (m > 59) m = 59;

    const formattedMinute = m.toString().padStart(2, '0');

    setTimePart((prev) => ({ ...prev, minute: formattedMinute }));
    updateTime24(timePart.hour, formattedMinute, timePart.period);
  };

  useEffect(() => {
    if (citaEditar) {
      const fechaISO = citaEditar.FechaCita ? new Date(citaEditar.FechaCita).toISOString().split('T')[0] : '';

      let horaStr = '';
      if (citaEditar.HoraCita) {
        const fechaHora = new Date(citaEditar.HoraCita);
        const hours = fechaHora.getUTCHours().toString().padStart(2, '0');
        const mins = fechaHora.getUTCMinutes().toString().padStart(2, '0');
        horaStr = `${hours}:${mins}`;
      }

      setTimePart(parse24to12(horaStr));

      const recibo = Array.isArray(citaEditar.Recibo) ? citaEditar.Recibo[0] : citaEditar.Recibo;
      const precioActual = recibo?.MontoTotal ? recibo.MontoTotal.toString() : '';
      const metodoPagoActual = recibo?.ID_MetodoPago ? recibo.ID_MetodoPago.toString() : '1';
      const bancoActual = recibo?.ID_Banco ? recibo.ID_Banco.toString() : '';
      const refActual = recibo?.Numero_Referencia || '';
      const modalidad = citaEditar.Direccion?.ID_Direccion === 1 ? 'clinica' : 'domicilio';

      setFormData({
        fecha: fechaISO,
        hora: horaStr,
        motivo: citaEditar.MotivoConsulta || '',
        pacienteId: citaEditar.ID_Paciente?.toString() || '',
        psicologoId: citaEditar.ID_Psicologo?.toString() || '',
        tipoCitaId: citaEditar.ID_TipoCita?.toString() || '',
        precio: precioActual,
        metodoPagoId: metodoPagoActual,
        numeroReferencia: refActual,
        bancoId: bancoActual,
        modalidadAtencion: modalidad
      });
    } else {
      setFormData(initialForm);
      setBusquedaPaciente('');
      setBusquedaPsicologo('');
      setTimePart({ hour: '08', minute: '00', period: 'AM' });
      setFormData((prev) => ({ ...prev, hora: '08:00' }));
    }
  }, [citaEditar, isOpen]);

  useEffect(() => {
    let activo = true;

    const verificarDisponibilidad = async () => {
      if (!formData.psicologoId || !formData.fecha) {
        setHorariosOcupados([]);
        setCargandoHorarios(false);
        return;
      }

      setCargandoHorarios(true);

      try {
        const horarios = await onCheckDisponibilidad(parseInt(formData.psicologoId), formData.fecha);

        if (activo) {
          setHorariosOcupados(horarios);
        }
      } catch (error) {
        console.error('Error verificando disponibilidad:', error);

        if (activo) {
          setHorariosOcupados([]);
        }
      } finally {
        if (activo) {
          setCargandoHorarios(false);
        }
      }
    };

    verificarDisponibilidad();

    return () => {
      activo = false;
    };
  }, [formData.psicologoId, formData.fecha, onCheckDisponibilidad]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!formData.pacienteId || !formData.psicologoId || !formData.fecha || !formData.hora) return;

    if (formData.metodoPagoId && formData.metodoPagoId !== '1' && !formData.numeroReferencia) {
      return alert('El número de referencia es obligatorio para transferencias.');
    }

    const paciente = catalogos.pacientes?.find((p) => p.ID_Paciente.toString() === formData.pacienteId);
    const idDireccionFinal = formData.modalidadAtencion === 'clinica' ? 1 : (paciente?.ID_Direccion || 1);

    const payload: CreateCitaDTO = {
      ID_Paciente: parseInt(formData.pacienteId),
      ID_Psicologo: parseInt(formData.psicologoId),
      ID_TipoCita: parseInt(formData.tipoCitaId),
      ID_EstadoCita: 1,
      ID_Direccion: idDireccionFinal,
      FechaCita: formData.fecha,
      HoraCita: formData.hora,
      MotivoConsulta: formData.motivo,

      Precio: parseFloat(formData.precio || '0'),
      ID_MetodoPago: parseInt(formData.metodoPagoId || '1'),
      ID_Divisa: 1,
      ...(formData.metodoPagoId !== '1' && formData.bancoId ? { ID_Banco: parseInt(formData.bancoId) } : {}),
      ...(formData.metodoPagoId !== '1' && formData.numeroReferencia ? { Numero_Referencia: formData.numeroReferencia } : {})
    };

    setGuardando(true);

    try {
      const success = await onSubmit(payload, !!citaEditar);

      if (success !== false) onClose();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setGuardando(false);
    }
  };

  let direccionVisual = { departamento: '', ciudad: '', barrio: '', calle: '' };

  if (formData.modalidadAtencion === 'clinica') {
    direccionVisual = {
      departamento: 'Managua',
      ciudad: 'Managua',
      barrio: 'Clínica Central',
      calle: 'C. Principal'
    };
  } else {
    const paciente = catalogos.pacientes?.find((p) => p.ID_Paciente.toString() === formData.pacienteId);

    if (paciente?.Direccion) {
      direccionVisual = {
        departamento: paciente.Direccion.Municipio?.Departamento?.Nombre_Departamento || '',
        ciudad: paciente.Direccion.Municipio?.Nombre_Municipio || '',
        barrio: paciente.Direccion.Barrio || '',
        calle: paciente.Direccion.Calle || ''
      };
    } else if (citaEditar?.Direccion) {
      direccionVisual = {
        departamento: citaEditar.Direccion.Municipio?.Departamento?.Nombre_Departamento || '',
        ciudad: citaEditar.Direccion.Municipio?.Nombre_Municipio || '',
        barrio: citaEditar.Direccion.Barrio || '',
        calle: citaEditar.Direccion.Calle || ''
      };
    }
  }

  if (!isOpen) return null;

  const pacientesFiltrados = catalogos.pacientes ? catalogos.pacientes.filter((p) => {
    const term = busquedaPaciente.toLowerCase();

    return `${p.Nombre} ${p.Apellido}`.toLowerCase().includes(term) ||
      (p.PacienteAdulto?.No_Cedula || '').toLowerCase().includes(term);
  }) : [];

  const psicologosFiltrados = catalogos.psicologos ? catalogos.psicologos.filter((p) => {
    const term = busquedaPsicologo.toLowerCase();

    return `${p.Nombre} ${p.Apellido}`.toLowerCase().includes(term);
  }) : [];

  const pacienteSeleccionado = catalogos.pacientes?.find((p) => p.ID_Paciente.toString() === formData.pacienteId);
  const psicologoSeleccionado = catalogos.psicologos?.find((p) => p.ID_Psicologo.toString() === formData.psicologoId);
  const tipoCitaSeleccionada = catalogos.tiposCita?.find((t) => t.ID_TipoCita.toString() === formData.tipoCitaId);
  const metodoPagoSeleccionado = catalogos.metodosPago?.find((m) => m.ID_Metodo_Pago.toString() === formData.metodoPagoId);
  const requiereReferencia = Boolean(formData.metodoPagoId && formData.metodoPagoId !== '1');

  return (
    <dialog className="modal modal-open bg-slate-950/50 backdrop-blur-sm">
      <div className="modal-box flex max-h-[92vh] w-11/12 max-w-6xl flex-col overflow-hidden rounded-[2rem] bg-white p-0 text-slate-800 shadow-2xl">
        <div className="relative overflow-hidden bg-slate-950 px-6 py-5 text-white">
          <div className="absolute -right-20 -top-24 h-56 w-56 rounded-full bg-blue-500/25 blur-3xl"></div>
          <div className="absolute -bottom-24 left-10 h-52 w-52 rounded-full bg-cyan-400/15 blur-3xl"></div>

          <div className="relative z-10 flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-blue-300">
                Agenda clínica
              </p>
              <h3 className="mt-1 font-serif text-2xl font-black tracking-tight text-white">
                {citaEditar ? 'Editar cita' : 'Agendar nueva cita'}
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">
                Complete los datos del paciente, profesional, horario, modalidad y cobro de la atención.
              </p>
            </div>

            <button
              type="button"
              className="btn btn-sm btn-circle border-white/10 bg-white/10 text-white hover:bg-white/20"
              onClick={onClose}
              disabled={guardando}
            >
              <Icons.Close />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/60 p-5">
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
              <aside className="space-y-4 xl:sticky xl:top-0 xl:self-start">
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-600">
                    Resumen
                  </p>

                  <div className="mt-4 space-y-4">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Paciente</p>
                      <p className="mt-1 truncate text-sm font-black text-slate-900" title={pacienteSeleccionado ? `${pacienteSeleccionado.Nombre} ${pacienteSeleccionado.Apellido}` : 'Sin seleccionar'}>
                        {pacienteSeleccionado ? `${pacienteSeleccionado.Nombre} ${pacienteSeleccionado.Apellido}` : 'Sin seleccionar'}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Profesional</p>
                      <p className="mt-1 truncate text-sm font-black text-slate-900" title={psicologoSeleccionado ? `Dr. ${psicologoSeleccionado.Nombre} ${psicologoSeleccionado.Apellido}` : 'Sin seleccionar'}>
                        {psicologoSeleccionado ? `Dr. ${psicologoSeleccionado.Nombre} ${psicologoSeleccionado.Apellido}` : 'Sin seleccionar'}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-blue-50 p-4 text-blue-800">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-500">Fecha</p>
                        <p className="mt-1 text-sm font-black">{formData.fecha || '-'}</p>
                      </div>

                      <div className="rounded-2xl bg-blue-50 p-4 text-blue-800">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-500">Hora</p>
                        <p className="mt-1 text-sm font-black">{formData.hora || '-'}</p>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-emerald-50 p-4 text-emerald-800">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-600">Cobro</p>
                      <p className="mt-1 font-mono text-xl font-black">
                        C$ {Number(formData.precio || 0).toFixed(2)}
                      </p>
                      <p className="mt-1 truncate text-xs font-medium text-emerald-600/80" title={metodoPagoSeleccionado?.Nombre_Metodo || 'Sin método'}>
                        {metodoPagoSeleccionado?.Nombre_Metodo || 'Sin método'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                    Progreso
                  </p>

                  <div className="mt-4 space-y-3">
                    {[
                      { label: 'Participantes', done: Boolean(formData.pacienteId && formData.psicologoId) },
                      { label: 'Horario', done: Boolean(formData.fecha && formData.hora) },
                      { label: 'Modalidad', done: Boolean(formData.modalidadAtencion) },
                      { label: 'Cobro', done: Boolean(formData.tipoCitaId && formData.precio && formData.metodoPagoId) },
                      { label: 'Motivo', done: Boolean(formData.motivo.trim()) }
                    ].map((step) => (
                      <div key={step.label} className="flex items-center gap-3">
                        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl ${
                          step.done ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                        }`}>
                          <Icons.Check />
                        </span>
                        <span className={`text-sm font-bold ${step.done ? 'text-slate-700' : 'text-slate-400'}`}>
                          {step.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </aside>

              <div className="space-y-5">
                <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <div>
                      <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-blue-600">
                        <Icons.User />
                        Participantes
                      </p>
                      <h4 className="mt-1 text-lg font-black text-slate-900">Paciente y profesional</h4>
                    </div>

                    {onNewPacienteClick && (
                      <button
                        type="button"
                        onClick={onNewPacienteClick}
                        className="btn btn-sm rounded-xl border-blue-100 bg-blue-50 text-blue-700 hover:border-blue-200 hover:bg-blue-100"
                        title="Crear un nuevo paciente sin salir de esta pantalla"
                      >
                        <Icons.PlusSmall />
                        Nuevo paciente
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                        Paciente
                      </label>

                      <div className="relative mb-2">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                          <Icons.Search />
                        </div>
                        <input
                          type="text"
                          placeholder="Buscar por nombre o cédula..."
                          className="input input-bordered h-11 w-full rounded-2xl bg-slate-50 pl-11 text-sm font-medium transition-colors focus:bg-white"
                          value={busquedaPaciente}
                          onChange={(e) => setBusquedaPaciente(e.target.value)}
                        />
                      </div>

                      <select
                        required
                        className="select select-bordered h-12 w-full rounded-2xl bg-white text-sm font-medium"
                        value={formData.pacienteId}
                        onChange={(e) => setFormData({ ...formData, pacienteId: e.target.value })}
                      >
                        <option value="">Seleccionar paciente...</option>
                        {pacientesFiltrados.map((p) => {
                          const esInactivo = p.Activo === false;

                          return (
                            <option
                              key={p.ID_Paciente}
                              value={p.ID_Paciente}
                              disabled={esInactivo}
                              className={esInactivo ? 'bg-slate-100 text-slate-400 italic' : ''}
                            >
                              {esInactivo ? 'Inactivo - ' : ''}{p.Nombre} {p.Apellido}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                        Psicólogo
                      </label>

                      <div className="relative mb-2">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                          <Icons.Search />
                        </div>
                        <input
                          type="text"
                          placeholder="Buscar profesional..."
                          className="input input-bordered h-11 w-full rounded-2xl bg-slate-50 pl-11 text-sm font-medium transition-colors focus:bg-white"
                          value={busquedaPsicologo}
                          onChange={(e) => setBusquedaPsicologo(e.target.value)}
                        />
                      </div>

                      <select
                        required
                        className="select select-bordered h-12 w-full rounded-2xl bg-white text-sm font-medium"
                        value={formData.psicologoId}
                        onChange={(e) => setFormData({ ...formData, psicologoId: e.target.value })}
                      >
                        <option value="">Seleccionar profesional...</option>
                        {psicologosFiltrados.map((p) => {
                          const esInactivo = p.Activo === false;

                          return (
                            <option
                              key={p.ID_Psicologo}
                              value={p.ID_Psicologo}
                              disabled={esInactivo}
                              className={esInactivo ? 'bg-slate-100 text-slate-400 italic' : ''}
                            >
                              {esInactivo ? 'Inactivo - ' : ''}Dr. {p.Nombre} {p.Apellido}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-5">
                    <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-blue-600">
                      <Icons.Calendar />
                      Fecha y hora
                    </p>
                    <h4 className="mt-1 text-lg font-black text-slate-900">Programación de la atención</h4>
                  </div>

                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                        Fecha
                      </label>
                      <input
                        required
                        type="date"
                        className="input input-bordered h-12 w-full rounded-2xl bg-slate-50 text-sm font-medium transition-colors focus:bg-white"
                        value={formData.fecha}
                        onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                        Hora
                      </label>

                      <div className="grid grid-cols-[84px_12px_84px_1fr] gap-2">
                        <select
                          className="select select-bordered h-12 rounded-2xl bg-white text-center text-sm font-black"
                          value={timePart.hour}
                          onChange={(e) => updateTime24(e.target.value, timePart.minute, timePart.period)}
                        >
                          {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                            <option key={h} value={h.toString().padStart(2, '0')}>{h}</option>
                          ))}
                        </select>

                        <span className="flex items-center justify-center font-black text-slate-400">:</span>

                        <input
                          type="text"
                          className="input input-bordered h-12 rounded-2xl bg-white text-center text-sm font-black"
                          placeholder="00"
                          value={timePart.minute}
                          onChange={handleMinuteChange}
                          onBlur={handleMinuteBlur}
                          onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                        />

                        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1">
                          <button
                            type="button"
                            className={`btn btn-sm min-h-10 rounded-xl border-none ${timePart.period === 'AM' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-transparent text-slate-500 hover:bg-slate-200'}`}
                            onClick={() => updateTime24(timePart.hour, timePart.minute, 'AM')}
                          >
                            AM
                          </button>
                          <button
                            type="button"
                            className={`btn btn-sm min-h-10 rounded-xl border-none ${timePart.period === 'PM' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-transparent text-slate-500 hover:bg-slate-200'}`}
                            onClick={() => updateTime24(timePart.hour, timePart.minute, 'PM')}
                          >
                            PM
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {formData.psicologoId && formData.fecha && (
                    <div className={`mt-5 rounded-2xl border p-4 ${
                      cargandoHorarios
                        ? 'border-slate-200 bg-slate-50 text-slate-500'
                        : horariosOcupados.length > 0
                          ? 'border-rose-100 bg-rose-50 text-rose-700'
                          : 'border-emerald-100 bg-emerald-50 text-emerald-700'
                    }`}>
                      {cargandoHorarios ? (
                        <div className="flex items-center gap-3 text-sm font-bold">
                          <span className="loading loading-spinner loading-sm"></span>
                          Consultando disponibilidad del profesional...
                        </div>
                      ) : horariosOcupados.length > 0 ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm font-black">
                            <Icons.Alert />
                            Horarios ocupados este día
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {horariosOcupados.map((h) => (
                              <span key={h} className="rounded-full bg-white px-3 py-1 font-mono text-xs font-black text-rose-700 shadow-sm">
                                {h}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-sm font-black">
                          <Icons.Check />
                          El profesional tiene disponibilidad horaria este día.
                        </div>
                      )}
                    </div>
                  )}
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-blue-600">
                        <Icons.MapPin />
                        Modalidad
                      </p>
                      <h4 className="mt-1 text-lg font-black text-slate-900">Lugar de atención</h4>
                    </div>

                    <div className="grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1">
                      <button
                        type="button"
                        className={`btn btn-sm min-h-10 rounded-xl border-none ${formData.modalidadAtencion === 'clinica' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-transparent text-slate-500 hover:bg-slate-200'}`}
                        onClick={() => setFormData((prev) => ({ ...prev, modalidadAtencion: 'clinica' }))}
                      >
                        En clínica
                      </button>
                      <button
                        type="button"
                        className={`btn btn-sm min-h-10 rounded-xl border-none ${formData.modalidadAtencion === 'domicilio' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-transparent text-slate-500 hover:bg-slate-200'}`}
                        onClick={() => setFormData((prev) => ({ ...prev, modalidadAtencion: 'domicilio' }))}
                        disabled={!formData.pacienteId}
                      >
                        A domicilio
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <input type="text" placeholder="Departamento" className="input input-bordered h-11 rounded-2xl bg-slate-50 text-sm font-medium" value={direccionVisual.departamento} readOnly />
                    <input type="text" placeholder="Ciudad" className="input input-bordered h-11 rounded-2xl bg-slate-50 text-sm font-medium" value={direccionVisual.ciudad} readOnly />
                    <input type="text" placeholder="Barrio" className="input input-bordered h-11 rounded-2xl bg-slate-50 text-sm font-medium" value={direccionVisual.barrio} readOnly />
                    <input type="text" placeholder="Calle / Detalle" className="input input-bordered h-11 rounded-2xl bg-slate-50 text-sm font-medium" value={direccionVisual.calle} readOnly />
                  </div>

                  {formData.modalidadAtencion === 'domicilio' && !direccionVisual.ciudad && formData.pacienteId && (
                    <div className="mt-4 flex items-center gap-2 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm font-bold text-amber-700">
                      <Icons.Alert />
                      El paciente seleccionado no tiene una dirección registrada en su expediente.
                    </div>
                  )}
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-5">
                    <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-blue-600">
                      <Icons.Receipt />
                      Cobro y motivo
                    </p>
                    <h4 className="mt-1 text-lg font-black text-slate-900">Información de recibo</h4>
                  </div>

                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
                    <div className="space-y-4 rounded-3xl border border-slate-100 bg-slate-50 p-4">
                      <div>
                        <label className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                          Tipo de cita
                        </label>
                        <select
                          required
                          className="select select-bordered h-11 w-full rounded-2xl bg-white text-sm font-medium"
                          value={formData.tipoCitaId}
                          onChange={(e) => setFormData({ ...formData, tipoCitaId: e.target.value })}
                        >
                          <option value="">Seleccionar...</option>
                          {catalogos.tiposCita?.map((t) => (
                            <option key={t.ID_TipoCita} value={t.ID_TipoCita}>{t.Nombre_DeCita}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                          Costo total
                        </label>
                        <input
                          required
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          className="input input-bordered h-11 w-full rounded-2xl bg-white font-mono text-base font-black text-emerald-600"
                          value={formData.precio}
                          onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                          Método de pago
                        </label>
                        <select
                          required
                          className="select select-bordered h-11 w-full rounded-2xl bg-white text-sm font-medium"
                          value={formData.metodoPagoId}
                          onChange={(e) => setFormData({ ...formData, metodoPagoId: e.target.value })}
                        >
                          <option value="">Seleccione forma de pago...</option>
                          {catalogos.metodosPago?.map((m) => (
                            <option key={m.ID_Metodo_Pago} value={m.ID_Metodo_Pago}>{m.Nombre_Metodo}</option>
                          ))}
                        </select>
                      </div>

                      {requiereReferencia && (
                        <div className="space-y-3 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                          {catalogos.bancos && catalogos.bancos.length > 0 && (
                            <div>
                              <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-blue-700">
                                Entidad bancaria
                              </label>
                              <select
                                required
                                className="select select-bordered h-11 w-full rounded-2xl bg-white text-sm font-medium"
                                value={formData.bancoId}
                                onChange={(e) => setFormData({ ...formData, bancoId: e.target.value })}
                              >
                                <option value="">Seleccionar banco...</option>
                                {catalogos.bancos.map((b) => (
                                  <option key={b.ID_Banco} value={b.ID_Banco}>{b.Nombre_Banco}</option>
                                ))}
                              </select>
                            </div>
                          )}

                          <div>
                            <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-blue-700">
                              Referencia / voucher
                            </label>
                            <input
                              required
                              type="text"
                              placeholder="Ej: 987654321"
                              className="input input-bordered h-11 w-full rounded-2xl bg-white font-mono text-sm"
                              value={formData.numeroReferencia}
                              onChange={(e) => setFormData({ ...formData, numeroReferencia: e.target.value })}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex min-h-[260px] flex-col">
                      <label className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                        Motivo de consulta
                      </label>
                      <textarea
                        required
                        className="textarea textarea-bordered min-h-[220px] flex-1 rounded-3xl bg-white text-sm leading-relaxed focus:border-blue-500"
                        placeholder="Describa brevemente el motivo de consulta..."
                        value={formData.motivo}
                        onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                      ></textarea>

                      <div className="mt-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                          Servicio seleccionado
                        </p>
                        <p className="mt-1 truncate text-sm font-black text-slate-800" title={tipoCitaSeleccionada?.Nombre_DeCita || 'Sin seleccionar'}>
                          {tipoCitaSeleccionada?.Nombre_DeCita || 'Sin seleccionar'}
                        </p>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200 bg-white px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-medium text-slate-400">
              Los campos requeridos deben estar completos antes de confirmar la cita.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                className="btn rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                onClick={onClose}
                disabled={guardando}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="btn rounded-xl bg-slate-950 px-8 text-white shadow-lg hover:bg-slate-800"
                disabled={guardando}
              >
                {guardando ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Procesando...
                  </>
                ) : (
                  citaEditar ? 'Guardar cambios' : 'Confirmar cita y cobro'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </dialog>
  );
}
