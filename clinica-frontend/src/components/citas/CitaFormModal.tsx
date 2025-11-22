import { useEffect, useState } from 'react';
import type { Cita, CreateCitaDTO } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any, isEdit: boolean) => Promise<boolean | void>;
  citaEditar: Cita | null;
  catalogos: any;
}

// Estado inicial limpio
const initialForm = { 
    fecha: '', 
    hora: '', 
    motivo: '', 
    pacienteId: '', 
    psicologoId: '', 
    tipoCitaId: '', 
    precio: '', 
    metodoPagoId: '',
    direccion: { departamento: '', ciudad: '', barrio: '', calle: '' }
};

export default function CitaFormModal({ isOpen, onClose, onSubmit, citaEditar, catalogos }: Props) {
  const [formData, setFormData] = useState(initialForm);
  
  const [usarDireccionPaciente, setUsarDireccionPaciente] = useState(true);

  // Buscadores locales
  const [busquedaPaciente, setBusquedaPaciente] = useState('');
  const [busquedaPsicologo, setBusquedaPsicologo] = useState('');

  // Auto-llenar dirección del paciente
  useEffect(() => {
    if (!citaEditar && formData.pacienteId && usarDireccionPaciente) {
        const paciente = catalogos.pacientes?.find((p:any) => p.ID_Paciente.toString() === formData.pacienteId);
        
        if (paciente && paciente.DireccionPaciente) {
            setFormData(prev => ({
                ...prev,
                direccion: {
                    departamento: paciente.DireccionPaciente.Departamento,
                    ciudad: paciente.DireccionPaciente.Ciudad,
                    barrio: paciente.DireccionPaciente.Barrio,
                    calle: paciente.DireccionPaciente.Calle
                }
            }));
        }
    }
  }, [formData.pacienteId, usarDireccionPaciente, catalogos.pacientes, citaEditar]);

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
      
      const factura = Array.isArray(citaEditar.Factura) ? citaEditar.Factura[0] : citaEditar.Factura;
      const precio = factura?.MontoTotal || '0';

      setFormData({
        fecha: fechaISO, 
        hora: horaStr, 
        motivo: citaEditar.MotivoConsulta || '',
        pacienteId: citaEditar.ID_Paciente?.toString() || '',
        psicologoId: citaEditar.ID_Psicologo?.toString() || '',
        tipoCitaId: citaEditar.ID_TipoCita?.toString() || '',
        precio: precio.toString(), 
        metodoPagoId: '1',
        direccion: initialForm.direccion 
      } as any);
      
      setUsarDireccionPaciente(false); 
    } else {
      setFormData(initialForm);
      setBusquedaPaciente('');
      setBusquedaPsicologo('');
      setUsarDireccionPaciente(true);
    }
  }, [citaEditar, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload: CreateCitaDTO = {
        fecha: formData.fecha,
        hora: formData.hora,
        motivo: formData.motivo,
        pacienteId: parseInt(formData.pacienteId),
        psicologoId: parseInt(formData.psicologoId),
        tipoCitaId: parseInt(formData.tipoCitaId),
        precio: parseFloat(formData.precio),
        metodoPagoId: parseInt(formData.metodoPagoId || '1'),
        direccion: {
            pais: 'Nicaragua', 
            ...formData.direccion
        }
    };

    const success = await onSubmit(payload, !!citaEditar);
    if (success !== false) {
        onClose();
    }
  };

  if (!isOpen) return null;

  // Filtros
  const pacientesList = catalogos.pacientes || [];
  const psicologosList = catalogos.psicologos || [];

  const pacientesFiltrados = pacientesList.filter((p:any) => {
    const termino = busquedaPaciente.toLowerCase();
    const nombre = `${p.Nombre} ${p.Apellido}`.toLowerCase();
    const cedula = p.PacienteAdulto?.No_Cedula?.toLowerCase() || '';
    return nombre.includes(termino) || cedula.includes(termino);
  });

  const psicologosFiltrados = psicologosList.filter((p:any) => {
    const termino = busquedaPsicologo.toLowerCase();
    const nombre = `${p.Nombre} ${p.Apellido}`.toLowerCase();
    return nombre.includes(termino);
  });

  return (
    <dialog className="modal modal-open bg-black/50 backdrop-blur-sm">
      <div className="modal-box bg-white text-slate-800 p-0 overflow-hidden rounded-2xl shadow-2xl w-11/12 max-w-3xl">
        
        <div className="bg-blue-600 px-6 py-4 flex justify-between items-center">
          <h3 className="font-bold text-lg text-white flex items-center gap-2">
            {citaEditar ? '✏️ Editar Cita' : '📅 Agendar Nueva Cita'}
          </h3>
          <button type="button" className="btn btn-sm btn-circle btn-ghost text-white hover:bg-blue-700" onClick={onClose}>✕</button>
        </div>

        <div className="p-6 max-h-[85vh] overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* SECCIÓN 1: QUIÉNES */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-control w-full">
                  <label className="label pt-0"><span className="label-text font-bold text-slate-500 text-xs uppercase">Paciente</span></label>
                  
                  {/* Buscador visual */}
                  <input 
                    type="text" 
                    placeholder="🔍 Buscar nombre o cédula..." 
                    className="input input-sm input-bordered bg-slate-50 w-full mb-2 focus:border-blue-500" 
                    value={busquedaPaciente} 
                    onChange={e => setBusquedaPaciente(e.target.value)} 
                  />
                  
                  {/* SELECTOR CON VALIDACIÓN DE INACTIVOS */}
                  <select 
                    required 
                    className="select select-bordered w-full bg-white" 
                    value={formData.pacienteId} 
                    onChange={e => setFormData({...formData, pacienteId: e.target.value})}
                  >
                    <option value="">Seleccionar Paciente...</option>
                    {pacientesFiltrados.map((p:any) => {
                        // Regla de Negocio: ID 1 es Activo. Cualquier otro es Inactivo.
                        const esInactivo = p.ID_EstadoDeActividad !== 1;
                        
                        return (
                            <option 
                                key={p.ID_Paciente} 
                                value={p.ID_Paciente}
                                disabled={esInactivo} // Bloquea la selección
                                className={esInactivo ? 'text-slate-400 bg-slate-100 italic' : ''}
                            >
                                {esInactivo ? '🔴 (INACTIVO) - ' : ''} 
                                {p.Nombre} {p.Apellido}
                            </option>
                        );
                    })}
                  </select>
                  
                  {/* Mensaje de ayuda si el paciente seleccionado es válido */}
                  {formData.pacienteId && (
                      <div className="mt-1 text-xs text-blue-600 font-medium animate-fade-in">
                         ✓ Paciente seleccionado correctamente
                      </div>
                  )}
                </div>

                <div className="form-control w-full">
                  <label className="label pt-0"><span className="label-text font-bold text-slate-500 text-xs uppercase">Psicólogo</span></label>
                  <input 
                    type="text" 
                    placeholder="🔍 Buscar doctor..." 
                    className="input input-sm input-bordered bg-slate-50 w-full mb-2 focus:border-blue-500" 
                    value={busquedaPsicologo} 
                    onChange={e => setBusquedaPsicologo(e.target.value)} 
                  />
                  <select 
                    required 
                    className="select select-bordered w-full bg-white" 
                    value={formData.psicologoId} 
                    onChange={e => setFormData({...formData, psicologoId: e.target.value})}
                  >
                    <option value="">Seleccionar Profesional...</option>
                    {psicologosFiltrados.map((p:any)=> {
                      // --- NUEVA LÓGICA VISUAL ---
                      const esInactivo = p.ID_EstadoDeActividad !== 1;

                      return (
                        <option 
                          key={p.ID_Psicologo} 
                          value={p.ID_Psicologo}
                          disabled={esInactivo} // Bloqueo de selección
                          className={esInactivo ? 'text-slate-400 bg-slate-100 italic' : ''}
                        >
                          {esInactivo ? '🔴 (INACTIVO) - ' : ''} 
                          Dr. {p.Nombre} {p.Apellido}
                        </option>
                      );
                    })}
                  </select>
                  {/* Mensaje de ayuda (Opcional) */}
                  {formData.psicologoId && (
                      <div className="mt-1 text-xs text-blue-600 font-medium animate-fade-in">
                         ✓ Profesional seleccionado
                      </div>
                  )}
                </div>
              </div>

              <div className="divider my-0"></div>

              {/* SECCIÓN 2: CUÁNDO */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="form-control">
                     <label className="label font-bold text-slate-500 text-xs uppercase">Fecha</label>
                     <input required type="date" className="input input-bordered bg-white w-full focus:border-blue-500" value={formData.fecha} onChange={e => setFormData({...formData, fecha: e.target.value})} />
                  </div>
                  <div className="form-control">
                     <label className="label font-bold text-slate-500 text-xs uppercase">Hora</label>
                     <input required type="time" className="input input-bordered bg-white w-full focus:border-blue-500" value={formData.hora} onChange={e => setFormData({...formData, hora: e.target.value})} />
                  </div>
              </div>

              {/* SECCIÓN 3: UBICACIÓN */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mt-4">
                  <div className="flex justify-between items-center mb-4">
                      <span className="text-xs font-bold text-slate-500 uppercase">Ubicación de la Cita</span>
                      
                      {!citaEditar && (
                          <label className="label cursor-pointer gap-2">
                              <input 
                                  type="checkbox" 
                                  className="checkbox checkbox-primary checkbox-xs" 
                                  checked={usarDireccionPaciente} 
                                  onChange={e => setUsarDireccionPaciente(e.target.checked)}
                                  disabled={!formData.pacienteId} 
                              />
                              <span className="label-text text-xs font-medium text-slate-600">Usar dirección del paciente</span>
                          </label>
                      )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                      <div className="form-control">
                          <input required type="text" placeholder="Departamento" className="input input-bordered input-sm w-full bg-white" 
                              value={formData.direccion.departamento} 
                              onChange={e => setFormData({...formData, direccion: {...formData.direccion, departamento: e.target.value}})} 
                              readOnly={usarDireccionPaciente} 
                          />
                      </div>
                      <div className="form-control">
                          <input required type="text" placeholder="Ciudad" className="input input-bordered input-sm w-full bg-white" 
                              value={formData.direccion.ciudad} 
                              onChange={e => setFormData({...formData, direccion: {...formData.direccion, ciudad: e.target.value}})} 
                              readOnly={usarDireccionPaciente}
                          />
                      </div>
                      <div className="form-control">
                          <input required type="text" placeholder="Barrio" className="input input-bordered input-sm w-full bg-white" 
                              value={formData.direccion.barrio} 
                              onChange={e => setFormData({...formData, direccion: {...formData.direccion, barrio: e.target.value}})} 
                              readOnly={usarDireccionPaciente}
                          />
                      </div>
                      <div className="form-control">
                          <input required type="text" placeholder="Calle / Detalle" className="input input-bordered input-sm w-full bg-white" 
                              value={formData.direccion.calle} 
                              onChange={e => setFormData({...formData, direccion: {...formData.direccion, calle: e.target.value}})} 
                              readOnly={usarDireccionPaciente}
                          />
                      </div>
                  </div>
              </div>

              {/* SECCIÓN 4: FINANCIERA */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
                  <h4 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                    💰 Detalles de Facturación
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="form-control">
                        <label className="label-text text-xs font-bold text-slate-400 mb-1">Tipo de Cita</label>
                        <select required className="select select-bordered select-sm w-full bg-white" value={formData.tipoCitaId} onChange={e => setFormData({...formData, tipoCitaId: e.target.value})}>
                          <option value="">Seleccionar...</option>
                          {catalogos.tiposCita?.map((t:any)=> <option key={t.ID_TipoCita} value={t.ID_TipoCita}>{t.NombreDeCita}</option>)}
                        </select>
                     </div>
                     <div className="form-control">
                        <label className="label-text text-xs font-bold text-slate-400 mb-1">Costo (C$)</label>
                        <input required type="number" step="0.01" placeholder="0.00" className="input input-bordered input-sm bg-white w-full font-mono font-bold text-emerald-600" value={formData.precio} onChange={e => setFormData({...formData, precio: e.target.value})} />
                     </div>
                  </div>
                  
                  {!citaEditar && (
                    <div className="form-control w-full">
                       <label className="label-text text-xs font-bold text-slate-400 mb-1">Método de Pago</label>
                       <select required className="select select-bordered select-sm w-full bg-white" value={formData.metodoPagoId} onChange={e => setFormData({...formData, metodoPagoId: e.target.value})}>
                         <option value="">Seleccione forma de pago...</option>
                         {catalogos.metodosPago?.map((m:any)=> <option key={m.ID_MetodoPago} value={m.ID_MetodoPago}>{m.NombreMetodo}</option>)}
                       </select>
                    </div>
                  )}
              </div>

              {/* SECCIÓN 5: MOTIVO */}
              <div className="form-control">
                <label className="label font-bold text-slate-500 text-xs uppercase">Motivo de Consulta</label>
                <textarea required className="textarea textarea-bordered w-full bg-white h-20 focus:border-blue-500" placeholder="Describa brevemente el motivo..." value={formData.motivo} onChange={e => setFormData({...formData, motivo: e.target.value})}></textarea>
              </div>
              
              <div className="modal-action pt-2 border-t border-slate-100">
                 <button type="button" className="btn btn-ghost hover:bg-slate-100" onClick={onClose}>Cancelar</button>
                 <button type="submit" className="btn btn-primary text-white px-8 shadow-lg hover:shadow-xl transition-all">
                    {citaEditar ? 'Guardar Cambios' : 'Confirmar y Facturar'}
                 </button>
              </div>
          </form>
        </div>
      </div>
    </dialog>
  );
}