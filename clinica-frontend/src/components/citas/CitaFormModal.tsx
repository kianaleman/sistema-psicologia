import { useEffect, useState } from 'react';
import type { 
  Cita, 
  CreateCitaDTO,
  Paciente,
  Psicologo,
  TipoCitaCatalogo,
  MetodoPago,
  Banco
} from '../../types';

// Tipado estricto para los catálogos que recibe el modal
interface CatalogosModal {
  pacientes: Paciente[];
  psicologos: Psicologo[];
  tiposCita: TipoCitaCatalogo[];
  metodosPago: MetodoPago[];
  bancos?: Banco[]; // Opcional, por si tu hook useCitas lo empieza a enviar
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
  Search: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-slate-400"><path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" /></svg>,
  Money: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10.75 6.75a.75.75 0 00-1.5 0v3.5h-3.5a.75.75 0 000 1.5h3.5v3.5a.75.75 0 001.5 0v-3.5h3.5a.75.75 0 000-1.5h-3.5v-3.5z" /></svg>,
  User: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-slate-400"><path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" /></svg>,
  Time: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-slate-400"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-12a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V6z" clipRule="evenodd" /></svg>,
  PlusSmall: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>
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

  // --- LOGICA DE HORA ---
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
      setFormData(prev => ({ ...prev, hora: time24 }));
  };

  const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value.replace(/\D/g, '').slice(0, 2);
      setTimePart(prev => ({ ...prev, minute: val }));
  };

  const handleMinuteBlur = () => {
      let m = parseInt(timePart.minute || '0');
      if (isNaN(m) || m < 0) m = 0;
      if (m > 59) m = 59;
      const formattedMinute = m.toString().padStart(2, '0');
      setTimePart(prev => ({ ...prev, minute: formattedMinute }));
      updateTime24(timePart.hour, formattedMinute, timePart.period);
  };



  // Cargar datos al editar
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
      setFormData(prev => ({ ...prev, hora: '08:00' }));
    }
  }, [citaEditar, isOpen]);

  // 2. NUEVO useEffect (Consulta de disponibilidad)
// Este solo se ejecuta cuando cambian estos dos campos específicos
useEffect(() => {
  const verificarDisponibilidad = async () => {
    if (formData.psicologoId && formData.fecha) {
        // Aquí llamas a la función que pasamos por props desde Citas.tsx
        const horarios = await onCheckDisponibilidad(parseInt(formData.psicologoId), formData.fecha);
        setHorariosOcupados(horarios);
    } else {
        setHorariosOcupados([]); // Si no hay doctor o fecha, limpiamos la lista
    }
  };

  verificarDisponibilidad();
}, [formData.psicologoId, formData.fecha, onCheckDisponibilidad]);

  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.pacienteId || !formData.psicologoId || !formData.fecha || !formData.hora) return;

    if (formData.metodoPagoId && formData.metodoPagoId !== '1' && !formData.numeroReferencia) {
        return alert("El número de referencia es obligatorio para transferencias.");
    }

    const paciente = catalogos.pacientes?.find(p => p.ID_Paciente.toString() === formData.pacienteId);
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
        console.error("Error:", error);
    } finally {
        setGuardando(false);
    }
  };

  // --- DERIVAR LA DIRECCIÓN AL VUELO ---
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
    return `${p.Nombre} ${p.Apellido}`.toLowerCase().includes(term) || (p.PacienteAdulto?.No_Cedula || '').toLowerCase().includes(term);
  }) : [];

  const psicologosFiltrados = catalogos.psicologos ? catalogos.psicologos.filter((p) => {
    const term = busquedaPsicologo.toLowerCase();
    return `${p.Nombre} ${p.Apellido}`.toLowerCase().includes(term);
  }) : [];

  return (
    <dialog className="modal modal-open bg-black/50 backdrop-blur-sm">
      <div className="modal-box bg-white text-slate-800 p-0 overflow-hidden rounded-2xl shadow-2xl w-11/12 max-w-3xl">
        <div className="bg-slate-800 px-6 py-4 flex justify-between items-center">
          <h3 className="font-bold text-lg text-white flex items-center gap-2 font-serif">
            {citaEditar ? '✏️ Editar Cita' : '📅 Agendar Nueva Cita'}
          </h3>
          <button type="button" className="btn btn-sm btn-circle btn-ghost text-slate-200 hover:text-white" onClick={onClose} disabled={guardando}>✕</button>
        </div>

        <div className="p-6 max-h-[85vh] overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* SECCIÓN 1: Participantes */}
              <div className="space-y-4">
                 <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><Icons.User /> Participantes</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-control w-full">
                       
                       <div className="flex justify-between items-center mb-1">
                           <label className="label p-0"><span className="label-text text-sm font-medium text-slate-600">Paciente</span></label>
                           {/* 👇 AQUÍ CAMBIAMOS EL ENLACE POR UN BOTÓN 👇 */}
                           {onNewPacienteClick && (
                             <button 
                                 type="button"
                                 onClick={onNewPacienteClick}
                                 className="text-[10px] uppercase font-bold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded shadow-sm border border-blue-100"
                                 title="Crear un nuevo paciente sin salir de esta pantalla"
                             >
                                 <Icons.PlusSmall /> Nuevo
                             </button>
                           )}
                       </div>
                       
                       <div className="relative">
                           <input type="text" placeholder="Buscar..." className="input input-sm input-bordered bg-slate-50 w-full mb-2 pl-8" value={busquedaPaciente} onChange={e => setBusquedaPaciente(e.target.value)} />
                           <div className="absolute top-0 left-0 bottom-0 flex items-center pl-2"><Icons.Search /></div>
                       </div>
                       <select required className="select select-bordered w-full bg-white text-sm" value={formData.pacienteId} onChange={e => setFormData({...formData, pacienteId: e.target.value})}>
                         <option value="">Seleccionar Paciente...</option>
                         {pacientesFiltrados.map((p) => {
                             const esInactivo = p.Activo === false;
                             return <option key={p.ID_Paciente} value={p.ID_Paciente} disabled={esInactivo} className={esInactivo ? 'text-slate-400 bg-slate-100 italic' : ''}>{esInactivo ? '🔴 ' : ''} {p.Nombre} {p.Apellido}</option>;
                         })}
                       </select>
                    </div>
                    <div className="form-control w-full">
                       <label className="label pt-0"><span className="label-text text-sm font-medium text-slate-600">Psicólogo</span></label>
                       <div className="relative">
                           <input type="text" placeholder="Buscar..." className="input input-sm input-bordered bg-slate-50 w-full mb-2 pl-8" value={busquedaPsicologo} onChange={e => setBusquedaPsicologo(e.target.value)} />
                           <div className="absolute top-0 left-0 bottom-0 flex items-center pl-2"><Icons.Search /></div>
                       </div>
                       <select required className="select select-bordered w-full bg-white text-sm" value={formData.psicologoId} onChange={e => setFormData({...formData, psicologoId: e.target.value})}>
                         <option value="">Seleccionar Profesional...</option>
                         {psicologosFiltrados.map((p)=> {
                            const esInactivo = p.Activo === false;
                            return <option key={p.ID_Psicologo} value={p.ID_Psicologo} disabled={esInactivo} className={esInactivo ? 'text-slate-400 bg-slate-100 italic' : ''}>{esInactivo ? '🔴 ' : ''} Dr. {p.Nombre} {p.Apellido}</option>;
                         })}
                       </select>
                    </div>
                  </div>
              </div>

              <div className="divider my-0"></div>

              {/* SECCIÓN 2: Fecha y Hora */}
              <div className="space-y-4 pt-2">
    <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
        <Icons.Time /> Fecha y Hora
    </h4>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Campo Fecha */}
        <div className="form-control">
            <label className="label pt-0"><span className="label-text text-sm font-medium text-slate-600">Fecha</span></label>
            <input required type="date" className="input input-bordered bg-slate-50 w-full focus:border-blue-500" value={formData.fecha} onChange={e => setFormData({...formData, fecha: e.target.value})} />
        </div>

        {/* Campo Hora */}
        <div className="form-control">
            <label className="label pt-0"><span className="label-text text-sm font-medium text-slate-600">Hora</span></label>
            <div className="flex gap-2">
                <select className="select select-bordered bg-white w-20 text-center" value={timePart.hour} onChange={(e) => updateTime24(e.target.value, timePart.minute, timePart.period)}>
                    {Array.from({length: 12}, (_, i) => i + 1).map(h => <option key={h} value={h.toString().padStart(2,'0')}>{h}</option>)}
                </select>
                <span className="self-center font-bold text-slate-400">:</span>
                
                <input 
                    type="text" 
                    className="input input-bordered bg-white w-20 text-center font-medium focus:border-blue-500" 
                    placeholder="00"
                    value={timePart.minute}
                    onChange={handleMinuteChange}
                    onBlur={handleMinuteBlur}
                    onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                />

                <div className="join border border-slate-300 rounded-lg ml-2">
                    <button type="button" className={`join-item btn btn-sm px-3 border-none ${timePart.period === 'AM' ? 'bg-blue-600 text-white' : 'bg-white text-slate-500'}`} onClick={() => updateTime24(timePart.hour, timePart.minute, 'AM')}>AM</button>
                    <button type="button" className={`join-item btn btn-sm px-3 border-none ${timePart.period === 'PM' ? 'bg-blue-600 text-white' : 'bg-white text-slate-500'}`} onClick={() => updateTime24(timePart.hour, timePart.minute, 'PM')}>PM</button>
                </div>
            </div>
        </div>
    </div>

    {/* 👇 INDICADOR DE DISPONIBILIDAD INTEGRADO 👇 */}
    {formData.psicologoId && formData.fecha && (
        <div className="mt-2 text-[11px] font-medium text-slate-500 bg-slate-50 p-2 rounded border border-slate-200 animate-fade-in">
            {cargandoHorarios ? (
                <span className="italic">Consultando disponibilidad del profesional...</span>
            ) : horariosOcupados.length > 0 ? (
                <div className="flex flex-col gap-1">
                    <span className="text-rose-600 font-bold">⚠️ Horarios ocupados este día:</span>
                    <div className="flex flex-wrap gap-1">
                        {horariosOcupados.map(h => (
                            <span key={h} className="badge badge-error badge-sm text-white font-mono">{h}</span>
                        ))}
                    </div>
                </div>
            ) : (
                <span className="text-emerald-600 font-semibold">✓ El profesional tiene disponibilidad horaria este día.</span>
            )}
        </div>
    )}
</div>

              {/* SECCIÓN 3: Ubicación */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex justify-between items-center mb-4 border-b border-slate-200 pb-2">
                      <span className="text-xs font-bold text-slate-700 uppercase">Modalidad y Lugar de Atención</span>
                      
                      <div className="tabs tabs-boxed bg-white p-1 shadow-sm">
                        <button 
                            type="button"
                            className={`tab tab-sm transition-colors ${formData.modalidadAtencion === 'clinica' ? 'tab-active !bg-blue-600 !text-white' : 'text-slate-500'}`} 
                            onClick={() => setFormData(prev => ({ ...prev, modalidadAtencion: 'clinica' }))}
                        >
                            En Clínica
                        </button>
                        <button 
                            type="button"
                            className={`tab tab-sm transition-colors ${formData.modalidadAtencion === 'domicilio' ? 'tab-active !bg-blue-600 !text-white' : 'text-slate-500'}`} 
                            onClick={() => setFormData(prev => ({ ...prev, modalidadAtencion: 'domicilio' }))}
                            disabled={!formData.pacienteId}
                        >
                            A Domicilio
                        </button>
                      </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 opacity-70 pointer-events-none">
                      <input type="text" placeholder="Departamento" className="input input-bordered input-sm w-full bg-slate-100" value={direccionVisual.departamento} readOnly />
                      <input type="text" placeholder="Ciudad" className="input input-bordered input-sm w-full bg-slate-100" value={direccionVisual.ciudad} readOnly />
                      <input type="text" placeholder="Barrio" className="input input-bordered input-sm w-full bg-slate-100" value={direccionVisual.barrio} readOnly />
                      <input type="text" placeholder="Calle / Detalle" className="input input-bordered input-sm w-full bg-slate-100" value={direccionVisual.calle} readOnly />
                  </div>
                  {formData.modalidadAtencion === 'domicilio' && !direccionVisual.ciudad && formData.pacienteId && (
                      <p className="text-xs font-bold text-amber-600 mt-2">⚠️ El paciente seleccionado no tiene una dirección registrada en su expediente.</p>
                  )}
              </div>

              {/* SECCIÓN 4: Pago y Motivo */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className='md:col-span-1 space-y-4'>
                    <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><Icons.Money /> Cobro y Recibo</h4>
                    
                    <div className="form-control">
                        <label className="label-text text-xs font-bold text-slate-400 mb-1">Tipo de Cita</label>
                        <select required className="select select-bordered select-sm w-full bg-white" value={formData.tipoCitaId} onChange={e => setFormData({...formData, tipoCitaId: e.target.value})}>
                          <option value="">Seleccionar...</option>
                          {catalogos.tiposCita?.map((t)=> <option key={t.ID_TipoCita} value={t.ID_TipoCita}>{t.Nombre_DeCita}</option>)}
                        </select>
                    </div>

                    <div className="form-control">
                        <label className="label-text text-xs font-bold text-slate-400 mb-1">Costo Total (C$)</label>
                        <input required type="number" step="0.01" min="0" placeholder="0.00" className="input input-bordered input-sm bg-white w-full font-mono font-bold text-emerald-600" value={formData.precio} onChange={e => setFormData({...formData, precio: e.target.value})} />
                    </div>

                    <div className="form-control">
                        <label className="label-text text-xs font-bold text-slate-400 mb-1">Método de Pago</label>
                        <select required className="select select-bordered select-sm w-full bg-white" value={formData.metodoPagoId} onChange={e => setFormData({...formData, metodoPagoId: e.target.value})}>
                            <option value="">Seleccione forma de pago...</option>
                            {catalogos.metodosPago?.map((m) => (
                                <option key={m.ID_Metodo_Pago} value={m.ID_Metodo_Pago}>{m.Nombre_Metodo}</option>
                            ))}
                        </select>
                    </div>

                    {/* RENDEREADO CONDICIONAL: Solo si NO es Efectivo (asumiendo que Efectivo es ID 1) */}
                    {formData.metodoPagoId && formData.metodoPagoId !== '1' && (
                        <div className="form-control p-3 bg-slate-50 border border-slate-200 rounded-lg animate-fade-in space-y-3">
                            {catalogos.bancos && catalogos.bancos.length > 0 && (
                                <div>
                                    <label className="label-text text-[10px] uppercase font-bold text-slate-400 mb-1 block">Entidad Bancaria</label>
                                    <select required className="select select-bordered select-sm w-full bg-white" value={formData.bancoId} onChange={e => setFormData({...formData, bancoId: e.target.value})}>
                                        <option value="">Seleccionar Banco...</option>
                                        {catalogos.bancos.map((b) => (
                                            <option key={b.ID_Banco} value={b.ID_Banco}>{b.Nombre_Banco}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div>
                                <label className="label-text text-[10px] uppercase font-bold text-slate-400 mb-1 block">N° de Referencia / Voucher *</label>
                                <input required type="text" placeholder="Ej: 987654321" className="input input-bordered input-sm w-full bg-white font-mono text-sm" value={formData.numeroReferencia} onChange={e => setFormData({...formData, numeroReferencia: e.target.value})} />
                            </div>
                        </div>
                    )}
                 </div>

                 <div className="md:col-span-2 form-control space-y-4">
                   <label className="label font-bold text-slate-500 text-xs uppercase">Motivo de Consulta</label>
                   <textarea required className="textarea textarea-bordered w-full bg-white h-full focus:border-blue-500 min-h-[120px]" placeholder="Describa brevemente el motivo..." value={formData.motivo} onChange={e => setFormData({...formData, motivo: e.target.value})}></textarea>
                 </div>
              </div>
              
              <div className="modal-action pt-4 border-t border-slate-100">
                 <button type="button" className="btn btn-ghost hover:bg-slate-100" onClick={onClose} disabled={guardando}>Cancelar</button>
                 <button type="submit" className="btn btn-primary text-white px-8 shadow-lg hover:shadow-xl transition-all" disabled={guardando}>
                    {guardando ? 'Procesando...' : (citaEditar ? 'Guardar Cambios' : 'Confirmar Cita y Cobro')}
                 </button>
              </div>
          </form>
        </div>
      </div>
    </dialog>
  );
}