import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';

// Interfaces para la respuesta del Super-Endpoint
interface ExpedienteCompleto {
  paciente: any;
  citas: any[];
  sesiones: any[];
}

export default function PacienteDetalle() {
  const { id } = useParams(); 
  const [expediente, setExpediente] = useState<ExpedienteCompleto | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'info' | 'citas' | 'sesiones'>('info');

  useEffect(() => {
    if (id) {
      loadExpediente(id);
    }
  }, [id]);

  const loadExpediente = async (pacienteId: string) => {
    try {
      // Usamos el servicio API
      const data = await api.pacientes.getOne(pacienteId);
      setExpediente(data);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  // Helpers
  const formatearFecha = (f: string) => new Date(f).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
  const formatearHora = (h: string) => {
    if (!h) return "--:--";
    const fecha = new Date(h);
    const horas = fecha.getUTCHours().toString().padStart(2, '0');
    const minutos = fecha.getUTCMinutes().toString().padStart(2, '0');
    return `${horas}:${minutos}`;
  };
  const getEstadoColor = (st: string) => {
    if (!st) return 'badge-ghost';
    if (st.toLowerCase().includes('programada')) return 'badge-outline badge-primary';
    if (st.toLowerCase().includes('completada')) return 'badge-outline badge-success';
    if (st.toLowerCase().includes('cancelada')) return 'badge-outline badge-error';
    return 'badge-ghost';
  };

  if (loading) return <div className="text-center py-20"><span className="loading loading-spinner loading-lg"></span></div>;
  if (!expediente) return <div className="alert alert-error">Error al cargar expediente. <Link to="/pacientes">Volver</Link></div>;

  const { paciente, citas, sesiones } = expediente;
  const tutor = paciente.PacienteMenor?.Tutor; 

  return (
    <div className="animate-fade-in-up">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row gap-6 items-start mb-8">
        <div className="avatar placeholder">
          <div className="bg-blue-600 text-white rounded-full w-24 shadow-md"><span className="text-4xl font-bold">{paciente.Nombre[0]}{paciente.Apellido[0]}</span></div>
        </div>
        <div>
          <h1 className="text-4xl font-bold text-slate-800 tracking-tight">{paciente.Nombre} {paciente.Apellido}</h1>
          <p className="text-slate-500 text-lg mt-1">
            {paciente.PacienteAdulto ? `Adulto (${paciente.PacienteAdulto.Ocupacion?.NombreDeOcupacion || 'N/A'})` : `Menor (Tutor: ${tutor?.Nombre || 'N/A'})`}
          </p>
          <div className="flex gap-2 mt-4">
            <div className="badge badge-lg badge-outline font-mono">{paciente.PacienteAdulto ? paciente.PacienteAdulto.No_Cedula : paciente.PacienteMenor?.PartNacimiento}</div>
            <div className="badge badge-lg badge-outline">{paciente.EstadoDeActividad?.NombreEstadoActividad}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs tabs-boxed bg-slate-100 p-2 rounded-lg mb-6">
        <a className={`tab tab-lg ${tab === 'info' ? 'tab-active bg-white shadow-sm' : 'text-slate-600'}`} onClick={() => setTab('info')}>Información</a>
        <a className={`tab tab-lg ${tab === 'citas' ? 'tab-active bg-white shadow-sm' : 'text-slate-600'}`} onClick={() => setTab('citas')}>Historial Citas ({citas.length})</a>
        <a className={`tab tab-lg ${tab === 'sesiones' ? 'tab-active bg-white shadow-sm' : 'text-slate-600'}`} onClick={() => setTab('sesiones')}>Notas Sesión ({sesiones.length})</a>
      </div>

      {/* Contenido */}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
        {/* Pestaña 1: Info */}
        {tab === 'info' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-bold text-slate-500 uppercase text-sm mb-4">Datos del Paciente</h3>
                <ul className="space-y-3 text-slate-700">
                  {paciente.PacienteAdulto && <li><strong>Teléfono:</strong> {paciente.PacienteAdulto?.No_Telefono}</li>}
                  {paciente.PacienteAdulto && <li><strong>Ocupación:</strong> {paciente.PacienteAdulto?.Ocupacion?.NombreDeOcupacion}</li>}
                  {paciente.PacienteMenor && <li><strong>Grado Escolar:</strong> {paciente.PacienteMenor?.GradoEscolar}</li>}
                  <li><strong>Nacionalidad:</strong> {paciente.Nacionalidad}</li>
                  <li><strong>Fecha Nacimiento:</strong> {formatearFecha(paciente.Fecha_Nac)}</li>
                  <li><strong>Género:</strong> {paciente.Genero}</li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-slate-500 uppercase text-sm mb-4">Dirección</h3>
                <ul className="space-y-3 text-slate-700">
                  <li><strong>Departamento:</strong> {paciente.DireccionPaciente?.Departamento}</li>
                  <li><strong>Ciudad:</strong> {paciente.DireccionPaciente?.Ciudad}</li>
                  <li><strong>Barrio:</strong> {paciente.DireccionPaciente?.Barrio}</li>
                  <li><strong>Calle:</strong> {paciente.DireccionPaciente?.Calle}</li>
                </ul>
              </div>
            </div>
            {tutor && (
              <div className="mt-8 pt-8 border-t border-slate-200">
                <h2 className="text-2xl font-bold text-blue-700 mb-6">Información del Tutor</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="font-bold text-slate-500 uppercase text-sm mb-4">Datos Personales</h3>
                    <ul className="space-y-3 text-slate-700">
                      <li><strong>Nombre:</strong> {tutor.Nombre} {tutor.Apellido}</li>
                      <li><strong>Cédula:</strong> {tutor.No_Cedula}</li>
                      <li><strong>Parentesco:</strong> <span className="badge badge-ghost">{tutor.Parentesco?.NombreDeParentesco}</span></li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-500 uppercase text-sm mb-4">Contacto y Ocupación</h3>
                    <ul className="space-y-3 text-slate-700">
                      <li><strong>Teléfono:</strong> {tutor.No_Telefono}</li>
                      <li><strong>Ocupación:</strong> {tutor.Ocupacion?.NombreDeOcupacion}</li>
                      <li><strong>Estado Civil:</strong> {tutor.EstadoCivil?.NombreEstadoCivil}</li>
                      <li><strong>Dirección:</strong> {tutor.DireccionTutor?.Calle}, {tutor.DireccionTutor?.Barrio}</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pestaña 2: Citas */}
        {tab === 'citas' && (
          <div className="overflow-x-auto">
            <table className="table">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold">
                <tr><th className="py-4">Fecha</th><th>Hora</th><th>Doctor</th><th>Tipo</th><th>Estado</th><th className="w-1/3">Motivo</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {citas.map((c: any) => (
                  <tr key={c.ID_Cita} className="hover:bg-slate-50">
                    <td className="font-mono text-slate-700 font-medium">{formatearFecha(c.FechaCita)}</td>
                    <td className="font-mono text-slate-700">{formatearHora(c.HoraCita)}</td>
                    <td className="font-medium text-slate-700">Dr. {c.Psicologo?.Apellido}</td>
                    <td className="text-slate-600">{c.TipoDeCita?.NombreDeCita}</td>
                    <td><span className={`badge badge-sm font-bold ${getEstadoColor(c.EstadoCita?.NombreEstado)}`}>{c.EstadoCita?.NombreEstado}</span></td>
                    <td className="text-slate-500 text-xs italic">{c.MotivoConsulta}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pestaña 3: Sesiones (Contador secuencial) */}
        {tab === 'sesiones' && (
          <div className="space-y-4">
            {[...sesiones].reverse().map((s: any, index: number) => (
              <div key={s.ID_Sesion} className="collapse collapse-plus bg-slate-50 border border-slate-200">
                <input type="checkbox" /> 
                <div className="collapse-title font-bold text-slate-700">
                  <span className="text-blue-600 text-lg">Sesión #{index + 1}</span>
                  <span className="font-normal text-slate-500 text-sm ml-4">(con Dr. {s.Psicologo?.Apellido})</span>
                </div>
                <div className="collapse-content bg-white">
                  <div className="p-4 border-t">
                    <h4 className="font-bold text-sm">Observaciones:</h4><p className="text-sm mb-4 whitespace-pre-wrap">{s.Observaciones}</p>
                    <h4 className="font-bold text-sm">Diagnóstico:</h4><p className="text-sm mb-4 italic">{s.DiagnosticoDiferencial}</p>
                    <h4 className="font-bold text-sm">Evolución:</h4><p className="text-sm text-amber-700 bg-amber-50 p-2 rounded">{s.HistorialDevolucion}</p>
                  </div>
                </div>
              </div>
            ))}
            {sesiones.length === 0 && <p className="text-slate-500 text-center py-4">No hay notas registradas.</p>}
          </div>
        )}
      </div>
    </div>
  );
}