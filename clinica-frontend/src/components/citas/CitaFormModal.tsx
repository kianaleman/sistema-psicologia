import { useEffect, useState } from 'react';
import type { Cita, CreateCitaDTO } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any, isEdit: boolean) => Promise<boolean | void>;
  citaEditar: Cita | null;
  catalogos: any;
}

const Icons = {
  Search: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-slate-400"><path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" /></svg>,
  Money: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10.75 6.75a.75.75 0 00-1.5 0v3.5h-3.5a.75.75 0 000 1.5h3.5v3.5a.75.75 0 001.5 0v-3.5h3.5a.75.75 0 000-1.5h-3.5v-3.5z" /></svg>,
  User: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-slate-400"><path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" /></svg>,
  Time: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-slate-400"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-12a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V6z" clipRule="evenodd" /></svg>
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
    idDivisa: '1', // 1: NIO por defecto
    tasaCambio: '1',
    direccion: { departamento: '', ciudad: '', barrio: '', calle: '' }
};

export default function CitaFormModal({ isOpen, onClose, onSubmit, citaEditar, catalogos }: Props) {
  const [formData, setFormData] = useState(initialForm);
  const [usarDireccionPaciente, setUsarDireccionPaciente] = useState(true);
  const [guardando, setGuardando] = useState(false); 
  const [timePart, setTimePart] = useState({ hour: '12', minute: '00', period: 'AM' });
  const [busquedaPaciente, setBusquedaPaciente] = useState('');
  const [busquedaPsicologo, setBusquedaPsicologo] = useState('');

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

  // --- EFECTOS ---
  useEffect(() => {
    if (!citaEditar && formData.pacienteId && usarDireccionPaciente) {
        const paciente = catalogos.pacientes?.find((p:any) => p.ID_Paciente.toString() === formData.pacienteId);
        // Ajuste PascalCase: Direccion
        if (paciente && paciente.Direccion) {
            setFormData(prev => ({
                ...prev,
                direccion: {
                    departamento: paciente.Direccion.Departamento,
                    ciudad: paciente.Direccion.Ciudad,
                    barrio: paciente.Direccion.Barrio,
                    calle: paciente.Direccion.Calle
                }
            }));
        }
    } else if (!citaEditar && !usarDireccionPaciente) {
        setFormData(prev => ({ ...prev, direccion: initialForm.direccion })); 
    }
  }, [formData.pacienteId, usarDireccionPaciente, catalogos.pacientes, citaEditar]);

  useEffect(() => {
    if (citaEditar) {
      const fechaISO = citaEditar.FechaCita ? citaEditar.FechaCita.toString().split('T')[0] : '';
      
      let horaStr = citaEditar.HoraCita || '08:00';
      // Si viene con formato ISO completo
      if (horaStr.includes('T')) {
          const d = new Date(horaStr);
          horaStr = `${d.getUTCHours().toString().padStart(2,'0')}:${d.getUTCMinutes().toString().padStart(2,'0')}`;
      }

      setTimePart(parse24to12(horaStr));
      
      // Mapeo PascalCase de Recibo y Bimoneda
      const recibo = citaEditar.Recibo;
      const precio = recibo?.MontoTotal || '0';
      const metodoPago = recibo?.ID_MetodoPago || '1';
      const idDivisa = recibo?.ID_Divisa?.toString() || '1';
      const tasa = recibo?.Tasa_Cambio?.toString() || '1';

      const dirDB = citaEditar.Direccion;
      const direccionMapeada = dirDB ? {
          departamento: dirDB.Departamento,
          ciudad: dirDB.Ciudad,
          barrio: dirDB.Barrio,
          calle: dirDB.Calle
      } : initialForm.direccion;

      setFormData({
        fecha: fechaISO, 
        hora: horaStr, 
        motivo: citaEditar.MotivoConsulta || '',
        pacienteId: citaEditar.ID_Paciente?.toString() || '',
        psicologoId: citaEditar.ID_Psicologo?.toString() || '',
        tipoCitaId: citaEditar.ID_TipoCita?.toString() || '',
        precio: precio.toString(), 
        metodoPagoId: metodoPago.toString(),
        idDivisa,
        tasaCambio: tasa,
        direccion: direccionMapeada 
      });
      
      setUsarDireccionPaciente(false); 
    } else {
      setFormData(initialForm);
      setBusquedaPaciente('');
      setBusquedaPsicologo('');
      setUsarDireccionPaciente(true);
      setTimePart({ hour: '08', minute: '00', period: 'AM' });
      setFormData(prev => ({ ...prev, hora: '08:00' }));
    }
  }, [citaEditar, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.pacienteId || !formData.psicologoId || !formData.fecha || !formData.hora) return;

    // Adaptado al CreateCitaDTO del index.ts
    const payload: CreateCitaDTO = {
        fecha: formData.fecha,
        hora: formData.hora,
        motivo: formData.motivo,
        pacienteId: parseInt(formData.pacienteId),
        psicologoId: parseInt(formData.psicologoId),
        tipoCitaId: parseInt(formData.tipoCitaId),
        precio: parseFloat(formData.precio),
        metodoPagoId: parseInt(formData.metodoPagoId || '1'),
        idDivisa: parseInt(formData.idDivisa),
        tasaCambio: parseFloat(formData.tasaCambio),
        idDireccion: 0 // El backend manejará la creación/uso si enviamos el objeto dirección
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

  if (!isOpen) return null;

  const pacientesFiltrados = catalogos.pacientes ? catalogos.pacientes.filter((p:any) => {
    const term = busquedaPaciente.toLowerCase();
    const identificado = p.PacienteAdulto?.No_Cedula || p.Paciente_Menor?.PartidaDeNacimiento || '';
    return `${p.Nombre} ${p.Apellido}`.toLowerCase().includes(term) || identificado.toLowerCase().includes(term);
  }) : [];

  const psicologosFiltrados = catalogos.psicologos ? catalogos.psicologos.filter((p:any) => {
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
                       <label className="label pt-0"><span className="label-text text-sm font-medium text-slate-600">Paciente</span></label>
                       <div className="relative">
                           <input type="text" placeholder="Buscar..." className="input input-sm input-bordered bg-slate-50 w-full mb-2 pl-8" value={busquedaPaciente} onChange={e => setBusquedaPaciente(e.target.value)} />
                           <div className="absolute top-0 left-0 bottom-0 flex items-center pl-2"><Icons.Search /></div>
                       </div>
                       <select required className="select select-bordered w-full bg-white text-sm" value={formData.pacienteId} onChange={e => setFormData({...formData, pacienteId: e.target.value})}>
                         <option value="">Seleccionar Paciente...</option>
                         {pacientesFiltrados.map((p:any) => (
                             <option key={p.ID_Paciente} value={p.ID_Paciente} disabled={!p.Activo} className={!p.Activo ? 'text-slate-400 bg-slate-100 italic' : ''}>
                                {!p.Activo ? '🔴 ' : ''} {p.Nombre} {p.Apellido}
                             </option>
                         ))}
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
                         {psicologosFiltrados.map((p:any)=> (
                            <option key={p.ID_Psicologo} value={p.ID_Psicologo} disabled={!p.Activo} className={!p.Activo ? 'text-slate-400 bg-slate-100 italic' : ''}>
                                {!p.Activo ? '🔴 ' : ''} Dr. {p.Nombre} {p.Apellido}
                            </option>
                         ))}
                       </select>
                    </div>
                  </div>
              </div>

              <div className="divider my-0"></div>

              {/* SECCIÓN 2: Fecha y Hora */}
              <div className="space-y-4 pt-2">
                  <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><Icons.Time /> Fecha y Hora</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                      <div className="form-control">
                          <label className="label pt-0"><span className="label-text text-sm font-medium text-slate-600">Fecha</span></label>
                          <input required type="date" className="input input-bordered bg-slate-50 w-full focus:border-blue-500" value={formData.fecha} onChange={e => setFormData({...formData, fecha: e.target.value})} />
                      </div>
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
                              />
                              <div className="join border border-slate-300 rounded-lg ml-2">
                                  <button type="button" className={`join-item btn btn-sm px-3 border-none ${timePart.period === 'AM' ? 'bg-blue-600 text-white' : 'bg-white text-slate-500'}`} onClick={() => updateTime24(timePart.hour, timePart.minute, 'AM')}>AM</button>
                                  <button type="button" className={`join-item btn btn-sm px-3 border-none ${timePart.period === 'PM' ? 'bg-blue-600 text-white' : 'bg-white text-slate-500'}`} onClick={() => updateTime24(timePart.hour, timePart.minute, 'PM')}>PM</button>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>

              {/* SECCIÓN 3: Ubicación */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex justify-between items-center mb-4">
                      <span className="text-xs font-bold text-slate-700 uppercase">Ubicación de la Cita</span>
                      {!citaEditar && (
                          <label className="label cursor-pointer gap-2">
                              <input type="checkbox" className="checkbox checkbox-sm checkbox-primary" checked={usarDireccionPaciente} onChange={e => setUsarDireccionPaciente(e.target.checked)} disabled={!formData.pacienteId} />
                              <span className="label-text text-xs font-medium text-slate-600">Usar dirección del paciente</span>
                          </label>
                      )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                      <input required type="text" placeholder="Departamento" className="input input-bordered input-sm w-full bg-white" value={formData.direccion.departamento} onChange={e => setFormData({...formData, direccion: {...formData.direccion, departamento: e.target.value}})} readOnly={usarDireccionPaciente} />
                      <input required type="text" placeholder="Ciudad" className="input input-bordered input-sm w-full bg-white" value={formData.direccion.ciudad} onChange={e => setFormData({...formData, direccion: {...formData.direccion, ciudad: e.target.value}})} readOnly={usarDireccionPaciente} />
                      <input required type="text" placeholder="Barrio" className="input input-bordered input-sm w-full bg-white" value={formData.direccion.barrio} onChange={e => setFormData({...formData, direccion: {...formData.direccion, barrio: e.target.value}})} readOnly={usarDireccionPaciente} />
                      <input required type="text" placeholder="Calle / Detalle" className="input input-bordered input-sm w-full bg-white" value={formData.direccion.calle} onChange={e => setFormData({...formData, direccion: {...formData.direccion, calle: e.target.value}})} readOnly={usarDireccionPaciente} />
                  </div>
              </div>

              {/* SECCIÓN 4: Pago y Motivo */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className='md:col-span-1 space-y-4'>
                    <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><Icons.Money /> Pago</h4>
                    <div className="form-control">
                        <label className="label-text text-xs font-bold text-slate-400 mb-1">Tipo de Cita</label>
                        <select required className="select select-bordered select-sm w-full bg-white" value={formData.tipoCitaId} onChange={e => setFormData({...formData, tipoCitaId: e.target.value})}>
                          <option value="">Seleccionar...</option>
                          {catalogos.tiposCita?.map((t:any)=> <option key={t.ID_TipoCita} value={t.ID_TipoCita}>{t.Nombre_DeCita}</option>)}
                        </select>
                    </div>

                    {/* NUEVO: SELECTOR DE DIVISA */}
                    <div className="grid grid-cols-2 gap-2">
                        <div className="form-control">
                            <label className="label-text text-xs font-bold text-slate-400 mb-1">Moneda</label>
                            <select className="select select-bordered select-sm bg-white" value={formData.idDivisa} onChange={e => setFormData({...formData, idDivisa: e.target.value})}>
                                {catalogos.divisas?.map((d:any) => <option key={d.ID_Divisa} value={d.ID_Divisa}>{d.Codigo_ISO}</option>)}
                            </select>
                        </div>
                        <div className="form-control">
                            <label className="label-text text-xs font-bold text-slate-400 mb-1">T. Cambio</label>
                            <input type="number" step="0.0001" className="input input-bordered input-sm bg-white" value={formData.tasaCambio} onChange={e => setFormData({...formData, tasaCambio: e.target.value})} readOnly={formData.idDivisa === '1'} />
                        </div>
                    </div>

                    <div className="form-control">
                        <label className="label-text text-xs font-bold text-slate-400 mb-1">Monto Total</label>
                        <input required type="number" step="0.01" className="input input-bordered input-sm bg-white w-full font-mono font-bold text-emerald-600" value={formData.precio} onChange={e => setFormData({...formData, precio: e.target.value})} />
                    </div>
                    
                    {!citaEditar && (
                        <div className="form-control">
                           <label className="label-text text-xs font-bold text-slate-400 mb-1">Método de Pago</label>
                           <select required className="select select-bordered select-sm w-full bg-white" value={formData.metodoPagoId} onChange={e => setFormData({...formData, metodoPagoId: e.target.value})}>
                             <option value="">Seleccionar...</option>
                             {catalogos.metodosPago?.map((m:any)=> <option key={m.ID_MetodoPago} value={m.ID_MetodoPago}>{m.NombreMetodo}</option>)}
                           </select>
                        </div>
                    )}
                 </div>
                 <div className="md:col-span-2 form-control space-y-4">
                   <label className="label font-bold text-slate-500 text-xs uppercase">Motivo de Consulta</label>
                   <textarea required className="textarea textarea-bordered w-full bg-white h-full focus:border-blue-500 min-h-[150px]" placeholder="Describa brevemente el motivo..." value={formData.motivo} onChange={e => setFormData({...formData, motivo: e.target.value})}></textarea>
                 </div>
              </div>
              
              <div className="modal-action pt-4 border-t border-slate-100">
                 <button type="button" className="btn btn-ghost hover:bg-slate-100" onClick={onClose} disabled={guardando}>Cancelar</button>
                 <button type="submit" className="btn btn-primary text-white px-8 shadow-lg hover:shadow-xl transition-all" disabled={guardando}>
                    {guardando ? 'Procesando...' : (citaEditar ? 'Guardar Cambios' : 'Confirmar y Facturar')}
                 </button>
              </div>
          </form>
        </div>
      </div>
    </dialog>
  );
}