import { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { Cita, Sesion } from '../types';

// Extendemos Sesion para este componente porque la vista incluye datos del doctor
interface SesionDetalle extends Sesion {
  FechaReal: string; // Campo calculado del backend
  Expediente: { No_Expediente: string };
  Psicologo: { Nombre: string; Apellido: string };
}

export default function Citas() {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);

  // FILTROS
  const [filtroPeriodo, setFiltroPeriodo] = useState<'todos' | 'hoy' | 'semana' | 'mes' | 'rango'>('todos');
  const [filtroEstado, setFiltroEstado] = useState<string>(''); 
  const [rangoFechas, setRangoFechas] = useState({ inicio: '', fin: '' });

  // DATA GENERAL
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [psicologos, setPsicologos] = useState<any[]>([]);
  const [tiposCita, setTiposCita] = useState<any[]>([]);
  const [estadosCita, setEstadosCita] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    fecha: '', hora: '', motivo: '', pacienteId: '', psicologoId: '', tipoCitaId: '', precio: ''
  });

  // ESTADO SESIÓN CLÍNICA
  const [citaActiva, setCitaActiva] = useState<Cita | null>(null);
  const [datosSesion, setDatosSesion] = useState({
    observaciones: '', diagnostico: '', historial: '', criterios: 'DSM-5', horaInicio: ''
  });
  const [historialPaciente, setHistorialPaciente] = useState<SesionDetalle[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Carga paralela usando el servicio
      const [dataCitas, dataPacientes, dataPsicologos, dataCatalogos] = await Promise.all([
        api.citas.getAll(),
        api.pacientes.getAll(),
        api.psicologos.getAll(),
        api.general.catalogosCitas()
      ]);

      setCitas(dataCitas);
      setPacientes(dataPacientes);
      setPsicologos(dataPsicologos);
      setTiposCita(dataCatalogos.tiposCita);
      setEstadosCita(dataCatalogos.estadosCita);
      
      setLoading(false);
    } catch (error) {
      console.error("Error cargando datos:", error);
    }
  };

  // NUEVA CITA
  const handleNuevaCita = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.citas.create(formData);
      alert("✅ Cita agendada");
      (document.getElementById('modal_nueva_cita') as HTMLDialogElement).close();
      loadData();
      setFormData({ fecha: '', hora: '', motivo: '', pacienteId: '', psicologoId: '', tipoCitaId: '', precio: '' });
    } catch (e: any) { 
      alert("Error: " + e.message); 
    }
  };

  // CANCELAR CITA
  const handleCancelarCita = async (citaId: number) => {
    if (window.confirm("¿Estás seguro de cancelar esta cita?")) {
      try {
        await api.citas.cancel(citaId);
        alert("Cita cancelada.");
        loadData();
      } catch (e: any) {
        alert("Error: " + e.message);
      }
    }
  };

  // INICIAR ATENCIÓN
  const abrirSesion = (cita: Cita) => {
    setCitaActiva(cita);
    // Hora local HH:MM:SS para el cronómetro
    const horaInicioLocal = new Date().toLocaleTimeString('en-GB', { 
      hour: '2-digit', minute: '2-digit', second: '2-digit' 
    });
    setDatosSesion({ 
      observaciones: '', diagnostico: '', historial: '', criterios: 'DSM-5', 
      horaInicio: horaInicioLocal 
    }); 
    (document.getElementById('modal_sesion') as HTMLDialogElement).showModal();
  };

  // FINALIZAR SESIÓN
  const handleFinalizarSesion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!citaActiva) return;
    
    const payload = { 
      citaId: citaActiva.ID_Cita, 
      pacienteId: citaActiva.Paciente.ID_Paciente, 
      psicologoId: citaActiva.Psicologo.ID_Psicologo, 
      ...datosSesion 
    };

    try {
      await api.sesiones.create(payload);
      alert("✅ Consulta guardada.");
      (document.getElementById('modal_sesion') as HTMLDialogElement).close();
      loadData(); 
    } catch (e: any) { 
      alert("Error: " + e.message); 
    }
  };

  // VER DETALLES (Mini-Expediente)
  const verDetalles = async (cita: Cita) => {
    if (!cita.Paciente?.ID_Paciente) return;
    try {
      setHistorialPaciente([]);
      setCitaActiva(cita);
      // Usamos el servicio para traer el historial
      const data = await api.pacientes.getHistorial(cita.Paciente.ID_Paciente);
      setHistorialPaciente(data);
      (document.getElementById('modal_ver_detalle') as HTMLDialogElement).showModal();
    } catch (e) {
      alert("⚠️ Este paciente aún no tiene sesiones registradas.");
      // Abrimos vacío si falla (es mejor UX que no hacer nada)
      setHistorialPaciente([]);
      (document.getElementById('modal_ver_detalle') as HTMLDialogElement).showModal();
    }
  };

  // LÓGICA DE FILTROS
  const citasFiltradas = citas.filter(c => {
    if (filtroEstado && c.ID_EstadoCita.toString() !== filtroEstado) return false;
    const fechaCitaStr = c.FechaCita.split('T')[0];
    const hoyStr = new Date().toLocaleDateString('en-CA');

    if (filtroPeriodo === 'todos') return true;
    if (filtroPeriodo === 'hoy') return fechaCitaStr === hoyStr;
    if (filtroPeriodo === 'mes') return fechaCitaStr.slice(0,7) === hoyStr.slice(0,7);
    if (filtroPeriodo === 'semana') {
       const d = new Date(); const day = d.getDay(); const diff = d.getDate() - day + (day === 0 ? -6 : 1);
       const lunes = new Date(d.setDate(diff)).toISOString().split('T')[0];
       const domingo = new Date(d.setDate(diff + 6)).toISOString().split('T')[0];
       return fechaCitaStr >= lunes && fechaCitaStr <= domingo;
    }
    if (filtroPeriodo === 'rango' && rangoFechas.inicio && rangoFechas.fin) {
       return fechaCitaStr >= rangoFechas.inicio && fechaCitaStr <= rangoFechas.fin;
    }
    return true;
  });

  // Helpers
  const formatearHoraUniversal = (h: string) => {
    if (!h) return "--:--";
    const fecha = new Date(h);
    const horas = fecha.getUTCHours().toString().padStart(2, '0');
    const minutos = fecha.getUTCMinutes().toString().padStart(2, '0');
    return `${horas}:${minutos}`;
  };

  const formatearFecha = (f: string) => {
     const partes = f.split('T')[0].split('-');
     const fechaObj = new Date(parseInt(partes[0]), parseInt(partes[1])-1, parseInt(partes[2]));
     return fechaObj.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
  };
  
  const getEstadoColor = (st: string) => {
    if (!st) return 'badge-ghost';
    if (st.toLowerCase().includes('programada')) return 'badge-primary';
    if (st.toLowerCase().includes('completada')) return 'badge-success text-white';
    if (st.toLowerCase().includes('cancelada')) return 'badge-error text-white';
    return 'badge-ghost';
  };

  return (
    <div className="p-6 animate-fade-in-up">
      <div className="flex justify-between items-center mb-6">
        <div><h1 className="text-3xl font-bold text-slate-800 tracking-tight">Agenda Clínica</h1><p className="text-slate-500">Gestión de citas y sesiones ({citasFiltradas.length})</p></div>
        <button className="btn btn-primary shadow-lg text-white" onClick={() => (document.getElementById('modal_nueva_cita') as HTMLDialogElement).showModal()}>+ Agendar Cita</button>
      </div>

      {/* BARRA DE FILTROS */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-8 flex flex-wrap gap-4 justify-between items-center">
        <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold text-slate-400 uppercase">Período:</span>
            <div className="join border border-slate-200 rounded-lg p-1 bg-slate-50">
                {[{ id: 'hoy', label: 'Hoy' }, { id: 'semana', label: 'Semana' }, { id: 'mes', label: 'Mes' }, { id: 'todos', label: 'Todas' }, { id: 'rango', label: '📅 Rango' }].map((btn) => (
                  <button key={btn.id} className={`join-item btn btn-sm border-none transition-all ${filtroPeriodo === btn.id ? 'bg-slate-800 text-white shadow-md' : 'bg-transparent text-slate-500 hover:bg-white'}`} 
                    onClick={() => setFiltroPeriodo(btn.id as any)}>{btn.label}</button>
                ))}
            </div>
            {filtroPeriodo === 'rango' && (
                <div className="flex items-center gap-2 animate-fade-in ml-2 bg-blue-50 p-1 rounded-lg border border-blue-100">
                  <input type="date" className="input input-xs input-bordered bg-white font-bold" value={rangoFechas.inicio} onChange={e => setRangoFechas({...rangoFechas, inicio: e.target.value})} />
                  <span className="text-slate-400 font-bold">-</span>
                  <input type="date" className="input input-xs input-bordered bg-white font-bold" value={rangoFechas.fin} onChange={e => setRangoFechas({...rangoFechas, fin: e.target.value})} />
                </div>
            )}
        </div>
        <div className="flex items-center gap-2">
           <span className="text-xs font-bold text-slate-400 uppercase">Estado:</span>
           <select className="select select-bordered select-sm bg-white text-slate-700" onChange={e => setFiltroEstado(e.target.value)}>
             <option value="">Todos</option>
             {estadosCita.map((e:any) => <option key={e.ID_EstadoCita} value={e.ID_EstadoCita}>{e.NombreEstado}</option>)}
           </select>
        </div>
      </div>

      {/* GRID DE CITAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {citasFiltradas.map((cita) => (
          <div key={cita.ID_Cita} className={`card bg-white border border-slate-200 shadow-sm transition-all group ${cita.EstadoCita.NombreEstado !== 'Programada' ? 'bg-slate-50 opacity-80' : 'hover:shadow-md'}`}>
            <div className="card-body p-0">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center rounded-t-xl group-hover:bg-blue-50 transition-colors">
                <span className="font-bold text-slate-700 capitalize">{formatearFecha(cita.FechaCita)}</span>
                <div className={`badge ${getEstadoColor(cita.EstadoCita.NombreEstado)} font-bold`}>{cita.EstadoCita.NombreEstado}</div>
              </div>
              <div className="p-6 pt-4 space-y-4">
                 <div className="flex justify-between items-end">
                    <div className="text-2xl font-bold text-slate-800">{formatearHoraUniversal(cita.HoraCita)}</div>
                    <div className="badge badge-outline text-xs">{cita.TipoDeCita.NombreDeCita}</div>
                 </div>
                 <div className="flex gap-3 items-center">
                    <div className="avatar placeholder">
                      <div className="bg-blue-600 text-white w-10 rounded-full"><span className="font-bold">{cita.Paciente.Nombre[0]}</span></div>
                    </div>
                    <div>
                       <div className="font-bold text-slate-800">{cita.Paciente.Nombre} {cita.Paciente.Apellido}</div>
                       <div className="text-xs text-slate-500">Dr. {cita.Psicologo.Apellido}</div>
                    </div>
                 </div>
                 
                 {/* Botones Condicionales */}
                 {cita.EstadoCita.NombreEstado === 'Programada' ? (
                    <div className="flex gap-2 mt-2">
                      <button className="btn btn-primary btn-sm flex-1 text-white shadow-md" onClick={() => abrirSesion(cita)}>▶ Iniciar</button>
                      <button className="btn btn-ghost btn-sm text-error" onClick={() => handleCancelarCita(cita.ID_Cita)}>✕</button>
                    </div>
                 ) : (
                    <button className="btn btn-outline btn-info btn-sm w-full mt-2" onClick={() => verDetalles(cita)}>
                      📄 Ver Expediente
                    </button>
                 )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL 1: AGENDAR CITA */}
      <dialog id="modal_nueva_cita" className="modal modal-bottom sm:modal-middle backdrop-blur-sm">
        <div className="modal-box bg-white text-slate-800">
          <h3 className="font-bold text-lg mb-4">Agendar Cita</h3>
          <form onSubmit={handleNuevaCita} className="space-y-4">
             <div className="form-control"><label className="label font-bold text-slate-500 text-xs uppercase">Paciente</label><select required className="select select-bordered w-full bg-white" value={formData.pacienteId} onChange={e => setFormData({...formData, pacienteId: e.target.value})}><option value="">Seleccionar...</option>{pacientes.map((p:any)=> <option key={p.ID_Paciente} value={p.ID_Paciente}>{p.Nombre} {p.Apellido}</option>)}</select></div>
             <div className="form-control"><label className="label font-bold text-slate-500 text-xs uppercase">Psicólogo</label><select required className="select select-bordered w-full bg-white" value={formData.psicologoId} onChange={e => setFormData({...formData, psicologoId: e.target.value})}><option value="">Seleccionar...</option>{psicologos.map((p:any)=> <option key={p.ID_Psicologo} value={p.ID_Psicologo}>{p.Nombre} {p.Apellido}</option>)}</select></div>
             <div className="grid grid-cols-2 gap-4">
               <div className="form-control"><label className="label font-bold text-slate-500 text-xs uppercase">Fecha</label><input required type="date" className="input input-bordered bg-white" value={formData.fecha} onChange={e => setFormData({...formData, fecha: e.target.value})} /></div>
               <div className="form-control"><label className="label font-bold text-slate-500 text-xs uppercase">Hora</label><input required type="time" className="input input-bordered bg-white" value={formData.hora} onChange={e => setFormData({...formData, hora: e.target.value})} /></div>
             </div>
             <div className="grid grid-cols-2 gap-4">
               <div className="form-control"><label className="label font-bold text-slate-500 text-xs uppercase">Tipo</label><select required className="select select-bordered w-full bg-white" value={formData.tipoCitaId} onChange={e => setFormData({...formData, tipoCitaId: e.target.value})}><option value="">Tipo...</option>{tiposCita.map((t:any)=> <option key={t.ID_TipoCita} value={t.ID_TipoCita}>{t.NombreDeCita}</option>)}</select></div>
               <div className="form-control"><label className="label font-bold text-slate-500 text-xs uppercase">Precio (C$)</label><input required type="number" step="0.01" placeholder="Ej: 50.00" className="input input-bordered bg-white w-full" value={formData.precio} onChange={(e) => setFormData({...formData, precio: e.target.value})} /></div>
             </div>
             <div className="form-control"><label className="label font-bold text-slate-500 text-xs uppercase">Motivo</label><textarea required className="textarea textarea-bordered w-full bg-white" placeholder="Motivo..." value={formData.motivo} onChange={e => setFormData({...formData, motivo: e.target.value})}></textarea></div>
             <div className="modal-action pt-4"><form method="dialog"><button className="btn btn-ghost">Cancelar</button></form><button type="submit" className="btn btn-primary text-white">Confirmar</button></div>
          </form>
        </div>
      </dialog>

      {/* MODAL 2: SESIÓN CLÍNICA */}
      <dialog id="modal_sesion" className="modal modal-bottom sm:modal-middle backdrop-blur-md">
        <div className="modal-box w-11/12 max-w-5xl bg-white text-slate-800 p-0 overflow-hidden rounded-2xl">
          <div className="bg-slate-800 text-white px-8 py-4 flex justify-between items-center">
             <div><h3 className="font-bold text-xl">Consulta en Curso</h3></div>
             <div className="badge badge-lg bg-blue-500 border-none text-white font-mono">{citaActiva ? formatearHoraUniversal(citaActiva.HoraCita) : ''}</div>
          </div>
          <div className="p-8 max-h-[70vh] overflow-y-auto">
             <form onSubmit={handleFinalizarSesion} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div><label className="label font-bold text-slate-500 text-xs uppercase">Observaciones</label><textarea required className="textarea textarea-bordered w-full h-32 bg-white" value={datosSesion.observaciones} onChange={e => setDatosSesion({...datosSesion, observaciones: e.target.value})}></textarea></div>
                        <div><label className="label font-bold text-slate-500 text-xs uppercase">Diagnóstico</label><textarea required className="textarea textarea-bordered w-full h-24 bg-white" value={datosSesion.diagnostico} onChange={e => setDatosSesion({...datosSesion, diagnostico: e.target.value})}></textarea></div>
                    </div>
                    <div className="space-y-4">
                        <div><label className="label font-bold text-slate-500 text-xs uppercase">Historial de Evolución</label><textarea className="textarea textarea-bordered w-full h-32 bg-amber-50 border-amber-200 text-slate-700" value={datosSesion.historial} onChange={e => setDatosSesion({...datosSesion, historial: e.target.value})}></textarea></div>
                        <div><label className="label font-bold text-slate-500 text-xs uppercase">Criterios</label><textarea className="textarea textarea-bordered w-full h-24 bg-white" value={datosSesion.criterios} onChange={e => setDatosSesion({...datosSesion, criterios: e.target.value})}></textarea></div>
                    </div>
                </div>
                <div className="flex justify-end gap-3 pt-4"><form method="dialog"><button className="btn btn-ghost">Cancelar</button></form><button type="submit" className="btn btn-success text-white px-8">💾 Finalizar Consulta</button></div>
             </form>
          </div>
        </div>
      </dialog>

      {/* MODAL 3: VER HISTORIAL (CORREGIDO CON HORA INICIO Y FIN) */}
      <dialog id="modal_ver_detalle" className="modal modal-bottom sm:modal-middle backdrop-blur-sm">
        <div className="modal-box w-11/12 max-w-4xl bg-white text-slate-800 p-0 overflow-hidden rounded-2xl shadow-2xl">
            <div className="bg-blue-600 text-white px-8 py-6 flex justify-between items-center">
               <div>
                 <h3 className="font-bold text-2xl mb-1">Expediente del Paciente</h3>
                 <p className="opacity-90 font-medium">{citaActiva?.Paciente.Nombre} {citaActiva?.Paciente.Apellido}</p>
               </div>
            </div>
            <div className="p-8 max-h-[70vh] overflow-y-auto bg-slate-50">
               {historialPaciente.length > 0 ? (
                 <div className="space-y-4">
                   {historialPaciente.map((sesion) => (
                     <div key={sesion.ID_Sesion} className="collapse collapse-plus bg-white shadow-sm border border-slate-200">
                        <input type="checkbox" /> 
                        <div className="collapse-title font-bold text-slate-700 flex justify-between items-center">
                           <div className="flex flex-col">
                              Sesión ID #{sesion.ID_Sesion}
                              <span className="font-normal text-slate-500 text-sm">
                                {formatearFecha(sesion.FechaReal)} 
                                <span className="font-mono ml-2 badge badge-ghost">
                                  {formatearHoraUniversal(sesion.HoraDeInicio)} - {formatearHoraUniversal(sesion.HoraFinal)}
                                </span>
                              </span>
                           </div>
                           <span className="font-normal text-slate-500 text-sm">Dr. {sesion.Psicologo.Apellido}</span>
                        </div>
                        <div className="collapse-content bg-white">
                           <div className="space-y-4 pt-4 border-t border-slate-100">
                              <div><h4 className="font-bold text-slate-700 text-sm mb-1">Diagnóstico</h4><p className="text-slate-600 text-sm">{sesion.DiagnosticoDiferencial}</p></div>
                              <div className="divider my-0"></div>
                              <div><h4 className="font-bold text-slate-700 text-sm mb-1">Observaciones</h4><p className="text-slate-600 text-sm whitespace-pre-wrap">{sesion.Observaciones}</p></div>
                              <div className="bg-amber-50 p-3 rounded-lg border border-amber-100"><h4 className="font-bold text-amber-800 text-sm mb-1">Evolución</h4><p className="text-amber-900 italic text-sm">{sesion.HistorialDevolucion}</p></div>
                           </div>
                        </div>
                     </div>
                   ))}
                 </div>
               ) : (
                 <div className="text-center py-10 text-slate-400"><p>Este paciente no tiene sesiones previas registradas.</p></div>
               )}
            </div>
            <div className="p-4 bg-white border-t border-slate-100 flex justify-end">
              <form method="dialog"><button className="btn btn-primary px-8 text-white">Cerrar Expediente</button></form>
            </div>
        </div>
      </dialog>
    </div>
  );
}