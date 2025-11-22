import { useParams, Link } from 'react-router-dom';
import { usePacienteDetalle } from '../hooks/usePacienteDetalle';

export default function PacienteDetalle() {
  const { id } = useParams(); 
  const { expediente, loading, tab, setTab, helpers } = usePacienteDetalle(id);

  if (loading) return <div className="text-center py-20"><span className="loading loading-spinner loading-lg text-primary"></span></div>;
  
  if (!expediente) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <div className="alert alert-error max-w-md">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span>No se encontró el expediente del paciente.</span>
        </div>
        <Link to="/pacientes" className="btn btn-outline">Volver a la lista</Link>
      </div>
    );
  }

  const { paciente, citas, sesiones } = expediente;
  // @ts-ignore (Acceso seguro gracias al hook)
  const tutor = paciente.PacienteMenor?.Tutor; 

  return (
    <div className="animate-fade-in-up p-6">
      
      {/* --- ENCABEZADO DEL PACIENTE --- */}
      <div className="flex flex-col md:flex-row gap-6 items-start mb-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="avatar placeholder">
          <div className="bg-blue-600 text-white rounded-full w-24 shadow-md text-3xl font-bold">
            <span>{paciente.Nombre[0]}{paciente.Apellido[0]}</span>
          </div>
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">{paciente.Nombre} {paciente.Apellido}</h1>
          <p className="text-slate-500 text-lg mt-1 flex items-center gap-2">
            {paciente.PacienteAdulto 
              ? <span className="badge badge-neutral">Adulto</span> 
              : <span className="badge badge-secondary">Menor</span>
            }
            <span className="text-sm opacity-80">
               {paciente.PacienteAdulto 
                 ? (paciente.PacienteAdulto.Ocupacion?.NombreDeOcupacion || 'Sin ocupación') 
                 : `Tutor: ${tutor?.Nombre || 'N/A'}`
               }
            </span>
          </p>
          <div className="flex gap-2 mt-4">
            <div className="badge badge-lg badge-outline font-mono text-slate-600">
              {paciente.PacienteAdulto ? paciente.PacienteAdulto.No_Cedula : paciente.PacienteMenor?.PartNacimiento}
            </div>
            <div className={`badge badge-lg ${paciente.EstadoDeActividad?.NombreEstadoActividad === 'Activo' ? 'badge-success text-white' : 'badge-ghost'}`}>
              {paciente.EstadoDeActividad?.NombreEstadoActividad}
            </div>
          </div>
        </div>
        <div>
           <Link to="/pacientes" className="btn btn-ghost btn-sm">← Volver</Link>
        </div>
      </div>

      {/* --- PESTAÑAS DE NAVEGACIÓN --- */}
      <div role="tablist" className="tabs tabs-boxed bg-slate-100 p-2 rounded-xl mb-6 w-fit">
        <a role="tab" className={`tab tab-lg transition-all duration-200 ${tab === 'info' ? 'tab-active bg-white shadow-sm text-slate-800 font-bold' : 'text-slate-500'}`} onClick={() => setTab('info')}>Información</a>
        <a role="tab" className={`tab tab-lg transition-all duration-200 ${tab === 'citas' ? 'tab-active bg-white shadow-sm text-slate-800 font-bold' : 'text-slate-500'}`} onClick={() => setTab('citas')}>Historial Citas ({citas.length})</a>
        <a role="tab" className={`tab tab-lg transition-all duration-200 ${tab === 'sesiones' ? 'tab-active bg-white shadow-sm text-slate-800 font-bold' : 'text-slate-500'}`} onClick={() => setTab('sesiones')}>Notas Sesión ({sesiones.length})</a>
      </div>

      {/* --- CONTENIDO DE LAS PESTAÑAS --- */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 min-h-[400px]">
        
        {/* PESTAÑA 1: INFORMACIÓN */}
        {tab === 'info' && (
          <div className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div>
                <h3 className="font-bold text-slate-400 uppercase text-xs tracking-wider mb-4 border-b pb-2">Datos del Paciente</h3>
                <ul className="space-y-4 text-slate-700">
                  {paciente.PacienteAdulto && (
                    <>
                      <li className="flex justify-between"><span>Teléfono:</span> <span className="font-medium">{paciente.PacienteAdulto.No_Telefono}</span></li>
                      <li className="flex justify-between"><span>Ocupación:</span> <span className="font-medium">{paciente.PacienteAdulto.Ocupacion?.NombreDeOcupacion}</span></li>
                    </>
                  )}
                  {paciente.PacienteMenor && (
                    <li className="flex justify-between"><span>Grado Escolar:</span> <span className="font-medium">{paciente.PacienteMenor.GradoEscolar}</span></li>
                  )}
                  <li className="flex justify-between"><span>Nacionalidad:</span> <span className="font-medium">{paciente.Nacionalidad}</span></li>
                  <li className="flex justify-between"><span>Fecha Nacimiento:</span> <span className="font-medium">{helpers.formatearFecha(paciente.Fecha_Nac)}</span></li>
                  <li className="flex justify-between"><span>Género:</span> <span className="font-medium">{paciente.Genero}</span></li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-slate-400 uppercase text-xs tracking-wider mb-4 border-b pb-2">Dirección</h3>
                <ul className="space-y-4 text-slate-700">
                  <li className="flex justify-between"><span>Departamento:</span> <span className="font-medium">{paciente.DireccionPaciente?.Departamento}</span></li>
                  <li className="flex justify-between"><span>Ciudad:</span> <span className="font-medium">{paciente.DireccionPaciente?.Ciudad}</span></li>
                  <li className="flex justify-between"><span>Barrio:</span> <span className="font-medium">{paciente.DireccionPaciente?.Barrio}</span></li>
                  <li className="flex justify-between"><span>Calle:</span> <span className="font-medium">{paciente.DireccionPaciente?.Calle}</span></li>
                </ul>
              </div>
            </div>

            {tutor && (
              <div className="mt-8 bg-slate-50 p-6 rounded-xl border border-slate-100">
                <h2 className="text-lg font-bold text-blue-700 mb-6 flex items-center gap-2">
                   👨‍👩‍👦 Información del Tutor
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <ul className="space-y-3 text-slate-700 text-sm">
                      <li className="flex gap-2"><span className="text-slate-400 w-24">Nombre:</span> <span className="font-bold">{tutor.Nombre} {tutor.Apellido}</span></li>
                      <li className="flex gap-2"><span className="text-slate-400 w-24">Cédula:</span> <span className="font-mono">{tutor.No_Cedula}</span></li>
                      <li className="flex gap-2"><span className="text-slate-400 w-24">Parentesco:</span> <span className="badge badge-ghost badge-sm">{tutor.Parentesco?.NombreDeParentesco}</span></li>
                    </ul>
                  </div>
                  <div>
                    <ul className="space-y-3 text-slate-700 text-sm">
                      <li className="flex gap-2"><span className="text-slate-400 w-24">Teléfono:</span> <span>{tutor.No_Telefono}</span></li>
                      <li className="flex gap-2"><span className="text-slate-400 w-24">Ocupación:</span> <span>{tutor.Ocupacion?.NombreDeOcupacion}</span></li>
                      <li className="flex gap-2"><span className="text-slate-400 w-24">Dirección:</span> <span>{tutor.DireccionTutor?.Calle}, {tutor.DireccionTutor?.Barrio}</span></li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PESTAÑA 2: CITAS */}
        {tab === 'citas' && (
          <div className="overflow-x-auto animate-fade-in">
            <table className="table w-full">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold">
                <tr><th className="py-4 pl-6">Fecha</th><th>Hora</th><th>Doctor</th><th>Tipo</th><th>Estado</th><th className="w-1/3">Motivo</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {citas.map((c: any) => (
                  <tr key={c.ID_Cita} className="hover:bg-slate-50 transition-colors">
                    <td className="pl-6 font-mono text-slate-700 font-medium">{helpers.formatearFecha(c.FechaCita)}</td>
                    <td className="font-mono text-slate-700">{helpers.formatearHora(c.HoraCita)}</td>
                    <td className="font-medium text-slate-700">Dr. {c.Psicologo?.Apellido}</td>
                    <td className="text-slate-600">{c.TipoDeCita?.NombreDeCita}</td>
                    <td><span className={`badge badge-sm font-bold ${helpers.getEstadoColor(c.EstadoCita?.NombreEstado)}`}>{c.EstadoCita?.NombreEstado}</span></td>
                    <td className="text-slate-500 text-xs italic truncate max-w-xs" title={c.MotivoConsulta}>{c.MotivoConsulta}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {citas.length === 0 && <div className="text-center py-12 text-slate-400 italic">No hay historial de citas.</div>}
          </div>
        )}

        {/* PESTAÑA 3: SESIONES */}
        {tab === 'sesiones' && (
          <div className="space-y-4 animate-fade-in">
            {/* No usamos reverse() porque el backend ya manda desc (la más nueva primero). 
                Numeramos: Total - index */}
            {sesiones.map((s: any, index: number) => (
              <div key={s.ID_Sesion} className="collapse collapse-plus bg-white shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                <input type="checkbox" className="peer" /> 
                <div className="collapse-title font-bold text-slate-700 flex justify-between items-center peer-checked:bg-blue-50 peer-checked:border-b peer-checked:border-slate-200">
                  <div className="flex items-center gap-3">
                     <span className="bg-blue-100 text-blue-700 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                        {sesiones.length - index}
                     </span>
                     <span className="text-lg">Sesión Clínica</span>
                     <span className="text-xs font-normal text-slate-400 uppercase tracking-wider ml-2">
                        {helpers.formatearFecha(s.HoraDeInicio)} {/* Nota: Usamos HoraDeInicio como fecha si no hay FechaReal en este endpoint específico, o ajusta según backend */}
                     </span>
                  </div>
                  <span className="font-normal text-white-500 text-sm badge badge-ghost">Dr. {s.Psicologo?.Apellido}</span>
                </div>
                <div className="collapse-content bg-white">
                  <div className="p-6 space-y-4">
                    <div>
                       <h4 className="font-bold text-slate-700 text-sm mb-1 uppercase tracking-wider">Diagnóstico</h4>
                       <p className="text-slate-600 italic border-l-4 border-blue-500 pl-3 py-1 bg-slate-50 rounded-r">{s.DiagnosticoDiferencial}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div>
                          <h4 className="font-bold text-slate-700 text-sm mb-1">Observaciones</h4>
                          <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{s.Observaciones}</p>
                       </div>
                       <div>
                          <h4 className="font-bold text-amber-600 text-sm mb-1">Evolución</h4>
                          <p className="text-slate-600 text-sm bg-amber-50 p-3 rounded-lg border border-amber-100">{s.HistorialDevolucion}</p>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {sesiones.length === 0 && (
               <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  <p className="text-slate-400">No hay notas de sesión registradas para este paciente.</p>
               </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}