import { useParams, Link } from 'react-router-dom';
import { usePacienteDetalle } from '../hooks/usePacienteDetalle';

const Icons = {
  Back: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>,
  Info: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-4.75a.75.75 0 00-1.5 0v1.5c0 .414.336.75.75.75h.75v-.75h-.75v-1.5zM10 7a1 1 0 100-2 1 1 0 000 2z" /></svg>,
  Calendar: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M4.5 3A1.5 1.5 0 003 4.5v11A1.5 1.5 0 004.5 17h11a1.5 1.5 0 001.5-1.5v-11A1.5 1.5 0 0015.5 3H4.5zM15 7h-11m11 2H5m10 2h-4.5m-1.5 2h-2" /></svg>,
  Notes: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M2.5 4A1.5 1.5 0 001 5.5v11A1.5 1.5 0 002.5 18h11A1.5 1.5 0 0015 16.5V5.5A1.5 1.5 0 0013.5 4h-11zM14 6H3v10h11V6zm-5 4h5v1.5H9V10z" clipRule="evenodd" /></svg>
};

export default function PacienteDetalle() {
  const { id } = useParams(); 
  const { expediente, loading, tab, setTab, helpers } = usePacienteDetalle(id);

  if (loading) return <div className="text-center py-20"><span className="loading loading-spinner loading-lg text-primary"></span></div>;
  
  if (!expediente) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <div className="alert alert-error max-w-md shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span>El expediente clínico no existe o no pudo ser cargado.</span>
        </div>
        <Link to="/pacientes" className="btn btn-outline btn-sm gap-2"><Icons.Back /> Regresar al listado</Link>
      </div>
    );
  }

  const { paciente, citas, sesiones } = expediente;
  
  // 🟢 CORRECCIÓN: Lógica para obtener el tutor principal (Relación N:M)
  const tutorPrincipal = paciente.Paciente_Menor?.Tutor_PacienteMenor?.find(rel => rel.Es_Contacto_Principal);

  return (
    <div className="animate-fade-in p-8 max-w-7xl mx-auto">
      
      {/* ENCABEZADO DEL EXPEDIENTE */}
      <div className="flex flex-col md:flex-row gap-6 items-start mb-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="avatar placeholder flex-shrink-0">
          <div className="bg-slate-800 text-white rounded-2xl w-24 h-24 shadow-inner text-3xl font-black">
            <span>{paciente.Nombre[0]}{paciente.Apellido[0]}</span>
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight font-serif">{paciente.Nombre} {paciente.Apellido}</h1>
            <span className={`badge font-bold border-none ${paciente.PacienteAdulto ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
              {paciente.PacienteAdulto ? 'ADULTO' : 'MENOR'}
            </span>
          </div>
          
          <div className="flex flex-wrap gap-4 mt-4 items-center text-sm text-slate-500 font-medium">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-lg border border-slate-100 font-mono">
              <span className="text-slate-400">ID:</span>
              {paciente.PacienteAdulto ? paciente.PacienteAdulto.No_Cedula : paciente.Paciente_Menor?.PartidaDeNacimiento}
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${paciente.Activo ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
              {paciente.Activo ? 'Expediente Activo' : 'Expediente Inactivo'}
            </div>
            {paciente.PacienteAdulto && <span>• {paciente.PacienteAdulto.Ocupacion?.Nombre_DeOcupacion}</span>}
            {!paciente.PacienteAdulto && tutorPrincipal && <span>• Tutor: {tutorPrincipal.Tutor.Nombre} ({tutorPrincipal.Parentesco.Nombre_De_Parentesco})</span>}
          </div>
        </div>
        <Link to="/pacientes" className="btn btn-ghost btn-sm text-slate-400 gap-1"><Icons.Back /> Volver</Link>
      </div>

      {/* NAVEGACIÓN */}
      <div role="tablist" className="tabs tabs-boxed bg-slate-100 p-1 rounded-xl mb-8 w-fit">
        <button className={`tab gap-2 ${tab === 'info' ? 'tab-active bg-white shadow-sm font-bold' : ''}`} onClick={() => setTab('info')}><Icons.Info /> Perfil</button>
        <button className={`tab gap-2 ${tab === 'citas' ? 'tab-active bg-white shadow-sm font-bold' : ''}`} onClick={() => setTab('citas')}><Icons.Calendar /> Citas ({citas.length})</button>
        <button className={`tab gap-2 ${tab === 'sesiones' ? 'tab-active bg-white shadow-sm font-bold' : ''}`} onClick={() => setTab('sesiones')}><Icons.Notes /> Evolución ({sesiones.length})</button>
      </div>

      {/* CONTENIDO */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 min-h-[400px]">
        
        {tab === 'info' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-fade-in">
            <section>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 border-b pb-2">Información Biográfica</h3>
                <div className="grid grid-cols-2 gap-y-6">
                    <div><p className="text-xs text-slate-400 mb-1">Nacionalidad</p><p className="font-bold text-slate-700">{paciente.Nacionalidad}</p></div>
                    <div><p className="text-xs text-slate-400 mb-1">Género</p><p className="font-bold text-slate-700">{paciente.Genero}</p></div>
                    <div><p className="text-xs text-slate-400 mb-1">Fecha de Nacimiento</p><p className="font-bold text-slate-700">{helpers.formatearFecha(paciente.Fecha_Nacimiento)}</p></div>
                    {paciente.PacienteAdulto && <div><p className="text-xs text-slate-400 mb-1">Estado Civil</p><p className="font-bold text-slate-700">{paciente.PacienteAdulto.EstadoCivil?.Nombre_EstadoCivil}</p></div>}
                    {paciente.Paciente_Menor && <div><p className="text-xs text-slate-400 mb-1">Grado Escolar</p><p className="font-bold text-slate-700">{paciente.Paciente_Menor.Grado_Escolar}</p></div>}
                </div>
            </section>

            <section>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 border-b pb-2">Residencia Clínica</h3>
                <div className="space-y-4">
                    <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 italic">
                        {paciente.Direccion?.Departamento}, {paciente.Direccion?.Ciudad}. <br />
                        Barrio {paciente.Direccion?.Barrio}, Calle {paciente.Direccion?.Calle}.
                    </p>
                </div>
            </section>

            {/* TUTORES (Si aplica) */}
            {paciente.Paciente_Menor?.Tutor_PacienteMenor && (
              <section className="lg:col-span-2 bg-slate-50 p-6 rounded-2xl border border-slate-200 mt-4">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Red de Tutores / Contactos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {paciente.Paciente_Menor.Tutor_PacienteMenor.map(rel => (
                        <div key={rel.ID_Tutor} className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center shadow-sm">
                            <div>
                                <p className="font-bold text-slate-800">{rel.Tutor.Nombre} {rel.Tutor.Apellido}</p>
                                <p className="text-xs text-slate-400">{rel.Parentesco.Nombre_De_Parentesco} {rel.Es_Contacto_Principal && <span className="badge badge-xs badge-primary ml-1">Principal</span>}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-mono text-slate-600">{rel.Tutor.No_Telefono}</p>
                                <p className="text-[10px] text-slate-400">{rel.Tutor.No_Cedula}</p>
                            </div>
                        </div>
                    ))}
                </div>
              </section>
            )}
          </div>
        )}

        {tab === 'citas' && (
          <div className="overflow-x-auto animate-fade-in">
            <table className="table w-full">
              <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <tr><th>Fecha</th><th>Hora</th><th>Psicólogo</th><th>Tipo de Atención</th><th>Estado</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {citas.map((c: any) => (
                  <tr key={c.ID_Cita} className="hover:bg-slate-50 transition-colors">
                    <td className="font-mono text-xs text-slate-700">{helpers.formatearFecha(c.FechaCita)}</td>
                    <td className="font-mono text-xs text-blue-600 font-bold">{helpers.formatearHora(c.HoraCita)}</td>
                    <td className="text-sm font-medium">Dr. {c.Psicologo?.Apellido}</td>
                    <td className="text-xs">{c.TipoDeCita?.Nombre_DeCita}</td>
                    <td><span className={`badge badge-xs font-bold ${helpers.getEstadoColor(c.EstadoCita?.NombreEstado)}`}>{c.EstadoCita?.NombreEstado}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'sesiones' && (
          <div className="space-y-6 animate-fade-in">
            {sesiones.length > 0 ? (
                sesiones.map((s: any, idx: number) => (
                  <div key={s.ID_Sesion} className="card bg-white border border-slate-200 shadow-sm overflow-hidden">
                    <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold">{sesiones.length - idx}</span>
                            <h4 className="font-bold text-slate-800">Sesión Clínica - {helpers.formatearFecha(s.HoraDeInicio)}</h4>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Dr. {s.Cita?.Psicologo?.Apellido}</span>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h5 className="text-[10px] font-black text-slate-400 uppercase mb-2">Diagnóstico Diferencial</h5>
                            <p className="text-sm text-slate-700 italic bg-blue-50/50 p-3 rounded-lg border-l-4 border-blue-600">{s.DiagnosticoDiferencial || 'No registrado'}</p>
                            <h5 className="text-[10px] font-black text-slate-400 uppercase mt-4 mb-2">Criterios Diagnósticos</h5>
                            <p className="text-xs text-slate-600">{s.Criterios_DeDiagnostico || 'N/A'}</p>
                        </div>
                        <div>
                            <h5 className="text-[10px] font-black text-slate-400 uppercase mb-2">Evolución del Paciente</h5>
                            <p className="text-xs text-slate-600 leading-relaxed bg-amber-50/50 p-3 rounded-lg border border-amber-100">{s.HistorialDeEvolucion || 'Sin evolución registrada'}</p>
                            <h5 className="text-[10px] font-black text-slate-400 uppercase mt-4 mb-2">Observaciones Clínicas</h5>
                            <p className="text-xs text-slate-600 whitespace-pre-wrap">{s.Observaciones || 'Sin observaciones'}</p>
                        </div>
                    </div>
                  </div>
                ))
            ) : (
                <div className="py-20 text-center text-slate-400 italic">Este paciente aún no registra sesiones de atención.</div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}