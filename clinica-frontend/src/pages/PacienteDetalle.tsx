import { useParams, Link } from 'react-router-dom';
import { usePacienteDetalle } from '../hooks/usePacienteDetalle';
import type { ExpedienteCompleto } from '../hooks/usePacienteDetalle';

// Iconos SVG para diseno
const Icons = {
  Back: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>,
  Info: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-4.75a.75.75 0 00-1.5 0v1.5c0 .414.336.75.75.75h.75v-.75h-.75v-1.5zM10 7a1 1 0 100-2 1 1 0 000 2z" /></svg>,
  Calendar: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M4.5 3A1.5 1.5 0 003 4.5v11A1.5 1.5 0 004.5 17h11a1.5 1.5 0 001.5-1.5v-11A1.5 1.5 0 0015.5 3H4.5zM15 7h-11m11 2H5m10 2h-4.5m-1.5 2h-2" /></svg>,
  Notes: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M2.5 4A1.5 1.5 0 001 5.5v11A1.5 1.5 0 002.5 18h11A1.5 1.5 0 0015 16.5V5.5A1.5 1.5 0 0013.5 4h-11zM14 6H3v10h11V6zm-5 4h5v1.5H9V10z" clipRule="evenodd" /></svg>
};

type PacienteDetalleData = ExpedienteCompleto['paciente'];
type CitaDetalleData = ExpedienteCompleto['citas'][number];
type SesionDetalleData = ExpedienteCompleto['sesiones'][number];

type PacienteAdultoVista = NonNullable<PacienteDetalleData['PacienteAdulto']> & {
  CodigoTelefonoPais?: {
    Codigo?: string;
  } | null;
};


type TutorVista = {
  ID_Tutor: number;
  No_Cedula?: string;
  Nombre: string;
  Apellido: string;
  No_Telefono: string;
  Ocupacion: number;
  EstadoCivil: number;
  ID_CodigoTelefono?: number;
  CodigoTelefonoPais?: {
    Codigo?: string;
  } | null;
  Direccion?: {
    ID_Direccion: number;
    Pais: string;
    Barrio: string;
    Calle?: string;
    ID_Municipio: number;
    Municipio?: {
      ID_Municipio: number;
      Nombre_Municipio: string;
    };
  } | null;
  Ocupacion_Tutor_OcupacionToOcupacion?: {
    ID_Ocupacion: number;
    Nombre_DeOcupacion: string;
  };
  EstadoCivil_Tutor_EstadoCivilToEstadoCivil?: {
    ID_EstadoCivil: number;
    Nombre_EstadoCivil: string;
  };
};

type RelacionTutorVista = {
  ID_Tutor: number;
  Es_Contacto_Principal?: boolean | null;
  Parentesco?: {
    ID_Parentesco: number;
    Nombre_De_Parentesco: string;
  };
  Tutor?: TutorVista;
};

type TratamientoVista = {
  Frecuencia?: string;
  FechaInicio?: string;
  Tratamiento_Farmaceutico?: {
    Nombre_Medicamento?: string;
    Dosis?: string;
  } | null;
  Tratamiento_Terapeutico?: {
    Objetivo?: string | null;
  } | null;
};

type SesionVista = SesionDetalleData & {
  Tratamiento?: TratamientoVista[];
};

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
        <Link to="/pacientes" className="btn btn-outline btn-sm gap-2"><Icons.Back /> Volver a la lista</Link>
      </div>
    );
  }

  const { paciente, citas, sesiones } = expediente;

  const pacienteAdulto: PacienteAdultoVista | null | undefined = paciente.PacienteAdulto;
  const pacienteMenor = paciente.Paciente_Menor;
  const direccion = paciente.Direccion;

  const relacionesTutor = pacienteMenor?.Tutor_PacienteMenor as RelacionTutorVista[] | undefined;

  const tutorRelacion =
    relacionesTutor?.find((relacion) => relacion.Es_Contacto_Principal) ||
    relacionesTutor?.[0];

  const tutor = tutorRelacion?.Tutor;

  const esAdulto = Boolean(pacienteAdulto);
  const estadoTexto = paciente.Activo === false ? 'Inactivo' : 'Activo';
  const estadoClase = paciente.Activo === false ? 'bg-slate-500' : 'bg-emerald-500';

  const inicialNombre = paciente.Nombre?.[0] || '?';
  const inicialApellido = paciente.Apellido?.[0] || '?';

  const ocupacionAdulto = pacienteAdulto?.Ocupacion?.Nombre_DeOcupacion || 'Sin ocupación';
  const identificacionPaciente = esAdulto
    ? pacienteAdulto?.No_Cedula
    : pacienteMenor?.PartidaDeNacimiento;

  const nacionalidad =
    paciente.Pais?.Nacionalidad ||
    paciente.Pais?.Nombre_Pais ||
    'N/A';

  const getEstadoColor = (st?: string) => {
    const s = (st || '').toLowerCase();

    if (s.includes('pendiente')) return 'bg-blue-500 text-white';
    if (s.includes('realizada')) return 'bg-emerald-500 text-white';
    if (s.includes('cancelada')) return 'bg-rose-500 text-white';

    return 'bg-slate-300 text-slate-700';
  };

  return (
    <div className="animate-fade-in-up p-8 max-w-7xl mx-auto">

      {/* --- ENCABEZADO DEL PACIENTE --- */}
      <div className="flex flex-col md:flex-row gap-6 items-start mb-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-lg">
        <div className="avatar placeholder flex-shrink-0">
          <div className="bg-slate-800 text-white rounded-full w-24 shadow-xl text-3xl font-bold font-serif">
            <span>{inicialNombre}{inicialApellido}</span>
          </div>
        </div>

        <div className="flex-1">
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight font-serif">
            {paciente.Nombre} {paciente.Apellido}
          </h1>

          <p className="text-slate-500 text-lg mt-2 flex items-center gap-2">
            <span className={`badge badge-sm ${esAdulto ? 'bg-blue-500 text-white' : 'bg-amber-500 text-white'} border-none`}>
              {esAdulto ? 'Adulto' : 'Menor'}
            </span>

            <span className="text-sm font-medium">
              {esAdulto ? ocupacionAdulto : `Tutor: ${tutor?.Nombre || 'N/A'}`}
            </span>
          </p>

          <div className="flex gap-4 mt-4 items-center">
            <div className="badge badge-lg badge-outline font-mono text-slate-600 bg-slate-50 border-slate-300">
              {identificacionPaciente || 'Sin identificación'}
            </div>

            <div className={`badge badge-lg text-white font-bold ${estadoClase}`}>
              {estadoTexto}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end">
          <Link to="/pacientes" className="btn btn-ghost btn-sm text-slate-500 hover:text-slate-800 gap-1">
            <Icons.Back /> Volver
          </Link>
        </div>
      </div>

      {/* --- PESTANAS DE NAVEGACION --- */}
      <div role="tablist" className="tabs tabs-boxed bg-slate-100 p-1 rounded-xl mb-8 w-full md:w-fit">
        <a role="tab" className={`tab tab-lg transition-all duration-200 gap-2 ${tab === 'info' ? 'tab-active bg-white shadow-md text-slate-800 font-bold' : 'text-slate-500'}`} onClick={() => setTab('info')}><Icons.Info /> Información</a>
        <a role="tab" className={`tab tab-lg transition-all duration-200 gap-2 ${tab === 'citas' ? 'tab-active bg-white shadow-md text-slate-800 font-bold' : 'text-slate-500'}`} onClick={() => setTab('citas')}><Icons.Calendar /> Historial Citas ({citas.length})</a>
        <a role="tab" className={`tab tab-lg transition-all duration-200 gap-2 ${tab === 'sesiones' ? 'tab-active bg-white shadow-md text-slate-800 font-bold' : 'text-slate-500'}`} onClick={() => setTab('sesiones')}><Icons.Notes /> Notas Sesión ({sesiones.length})</a>
      </div>

      {/* --- CONTENIDO DE LAS PESTANAS --- */}
      <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200 min-h-[400px]">

        {/* PESTANA 1: INFORMACION */}
        {tab === 'info' && (
          <div className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

              {/* Bloque: Datos del Paciente */}
              <div className="lg:col-span-1">
                <h3 className="font-bold text-slate-600 uppercase text-xs tracking-wider mb-4 border-b pb-2">Datos Generales</h3>

                <dl className="space-y-4 text-slate-700">
                  {pacienteAdulto && (
                    <>
                      <div className="flex justify-between gap-4">
                        <dt className="text-sm text-slate-500">Teléfono:</dt>
                        <dd className="font-medium text-sm text-right">
                          {pacienteAdulto.CodigoTelefonoPais?.Codigo ? `${pacienteAdulto.CodigoTelefonoPais.Codigo} ` : ''}
                          {pacienteAdulto.No_Telefono}
                        </dd>
                      </div>

                      <div className="flex justify-between gap-4">
                        <dt className="text-sm text-slate-500">Ocupación:</dt>
                        <dd className="font-medium text-sm text-right">{ocupacionAdulto}</dd>
                      </div>

                      <div className="flex justify-between gap-4">
                        <dt className="text-sm text-slate-500">Estado civil:</dt>
                        <dd className="font-medium text-sm text-right">
                          {pacienteAdulto.EstadoCivil?.Nombre_EstadoCivil || 'N/A'}
                        </dd>
                      </div>
                    </>
                  )}

                  {pacienteMenor && (
                    <>
                      <div className="flex justify-between gap-4">
                        <dt className="text-sm text-slate-500">Partida:</dt>
                        <dd className="font-medium text-sm text-right">{pacienteMenor.PartidaDeNacimiento || 'N/A'}</dd>
                      </div>

                      <div className="flex justify-between gap-4">
                        <dt className="text-sm text-slate-500">Grado Escolar:</dt>
                        <dd className="font-medium text-sm text-right">{pacienteMenor.Grado_Escolar || 'N/A'}</dd>
                      </div>
                    </>
                  )}

                  <div className="flex justify-between gap-4">
                    <dt className="text-sm text-slate-500">Nacionalidad:</dt>
                    <dd className="font-medium text-sm text-right">{nacionalidad}</dd>
                  </div>

                  <div className="flex justify-between gap-4">
                    <dt className="text-sm text-slate-500">Fecha Nacimiento:</dt>
                    <dd className="font-medium text-sm text-right">{helpers.formatearFecha(paciente.Fecha_Nacimiento)}</dd>
                  </div>

                  <div className="flex justify-between gap-4">
                    <dt className="text-sm text-slate-500">Género:</dt>
                    <dd className="font-medium text-sm text-right">{paciente.Genero || 'N/A'}</dd>
                  </div>
                </dl>
              </div>

              {/* Bloque: Direccion */}
              <div className="lg:col-span-1">
                <h3 className="font-bold text-slate-600 uppercase text-xs tracking-wider mb-4 border-b pb-2">Dirección Principal</h3>

                <dl className="space-y-4 text-slate-700">
                  <div className="flex justify-between gap-4">
                    <dt className="text-sm text-slate-500">País:</dt>
                    <dd className="font-medium text-sm text-right">{direccion?.Pais || paciente.Pais?.Nombre_Pais || 'N/A'}</dd>
                  </div>

                  <div className="flex justify-between gap-4">
                    <dt className="text-sm text-slate-500">Departamento:</dt>
                    <dd className="font-medium text-sm text-right">
                      {direccion?.Municipio?.Departamento?.Nombre_Departamento || 'N/A'}
                    </dd>
                  </div>

                  <div className="flex justify-between gap-4">
                    <dt className="text-sm text-slate-500">Municipio:</dt>
                    <dd className="font-medium text-sm text-right">{direccion?.Municipio?.Nombre_Municipio || 'N/A'}</dd>
                  </div>

                  <div className="flex justify-between gap-4">
                    <dt className="text-sm text-slate-500">Barrio:</dt>
                    <dd className="font-medium text-sm text-right">{direccion?.Barrio || 'N/A'}</dd>
                  </div>

                  <div className="flex justify-between gap-4">
                    <dt className="text-sm text-slate-500">Calle:</dt>
                    <dd className="font-medium text-sm text-right">{direccion?.Calle || 'N/A'}</dd>
                  </div>
                </dl>
              </div>

              {/* Bloque: Resumen */}
              <div className="lg:col-span-1">
                <h3 className="font-bold text-slate-600 uppercase text-xs tracking-wider mb-4 border-b pb-2">Resumen Clínico</h3>

                <div className="stats stats-vertical shadow-sm border border-slate-200 w-full bg-slate-50">
                  <div className="stat">
                    <div className="stat-title text-black">Citas registradas</div>
                    <div className="stat-value text-slate-800">{citas.length}</div>
                  </div>

                  <div className="stat">
                    <div className="stat-title text-black">Sesiones registradas</div>
                    <div className="stat-value text-slate-800">{sesiones.length}</div>
                  </div>
                </div>
              </div>
            </div>

            {tutor && (
              <div className="mt-8 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2 flex items-center gap-2">
                  <span className="p-1 bg-white rounded text-blue-600">👨‍👩‍👦</span> Información del Tutor
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <dl className="space-y-3 text-slate-700 text-sm">
                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-500 w-24">Nombre:</dt>
                        <dd className="font-bold text-right">{tutor.Nombre} {tutor.Apellido}</dd>
                      </div>

                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-500 w-24">Cédula:</dt>
                        <dd className="font-mono bg-blue-100 text-blue-800 px-2 rounded">{tutor.No_Cedula || 'N/A'}</dd>
                      </div>

                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-500 w-24">Parentesco:</dt>
                        <dd className="badge badge-outline badge-sm text-slate-600">
                          {tutorRelacion?.Parentesco?.Nombre_De_Parentesco || 'N/A'}
                        </dd>
                      </div>

                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-500 w-24">Estado civil:</dt>
                        <dd className="text-right">
                          {tutor.EstadoCivil_Tutor_EstadoCivilToEstadoCivil?.Nombre_EstadoCivil || 'N/A'}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div>
                    <dl className="space-y-3 text-slate-700 text-sm">
                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-500 w-24">Teléfono:</dt>
                        <dd className="text-right">
                          {tutor.CodigoTelefonoPais?.Codigo ? `${tutor.CodigoTelefonoPais.Codigo} ` : ''}
                          {tutor.No_Telefono || 'N/A'}
                        </dd>
                      </div>

                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-500 w-24">Ocupación:</dt>
                        <dd className="text-right">
                          {tutor.Ocupacion_Tutor_OcupacionToOcupacion?.Nombre_DeOcupacion || 'N/A'}
                        </dd>
                      </div>

                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-500 w-24">Dirección:</dt>
                        <dd className="text-right">
                          {tutor.Direccion
                            ? `${tutor.Direccion.Calle || 'Sin calle'}, ${tutor.Direccion.Barrio || 'Sin barrio'}`
                            : 'N/A'}
                        </dd>
                      </div>

                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-500 w-24">Municipio:</dt>
                        <dd className="text-right">{tutor.Direccion?.Municipio?.Nombre_Municipio || 'N/A'}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PESTANA 2: HISTORIAL DE CITAS */}
        {tab === 'citas' && (
          <div className="overflow-x-auto animate-fade-in">
            {citas.length > 0 ? (
              <table className="table w-full">
                <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold">
                  <tr>
                    <th className="py-4 pl-6">Fecha</th>
                    <th>Hora</th>
                    <th>Doctor</th>
                    <th>Tipo</th>
                    <th>Estado</th>
                    <th className="w-1/3">Motivo</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {citas.map((c: CitaDetalleData) => (
                    <tr key={c.ID_Cita} className="hover:bg-slate-50 transition-colors">
                      <td className="pl-6 font-mono text-sm text-slate-700 font-medium">{helpers.formatearFecha(c.FechaCita)}</td>
                      <td className="font-mono text-sm text-blue-600 font-bold">{helpers.formatearHora(c.HoraCita)}</td>
                      <td className="font-medium text-sm text-slate-700">
                        Dr. {c.Psicologo?.Nombre || ''} {c.Psicologo?.Apellido || ''}
                      </td>
                      <td className="text-sm text-slate-600">{c.TipoDeCita?.Nombre_DeCita || 'N/A'}</td>
                      <td>
                        <span className={`badge badge-sm font-bold ${getEstadoColor(c.EstadoCita?.NombreEstado)}`}>
                          {c.EstadoCita?.NombreEstado || 'N/A'}
                        </span>
                      </td>
                      <td className="text-slate-500 text-xs italic truncate max-w-xs" title={c.MotivoConsulta || ''}>
                        {c.MotivoConsulta || 'Sin motivo registrado'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12 text-slate-400 italic">No hay historial de citas.</div>
            )}
          </div>
        )}

        {/* PESTANA 3: NOTAS DE SESION */}
        {tab === 'sesiones' && (
          <div className="space-y-4 animate-fade-in">
            {sesiones.length > 0 ? (
              sesiones.map((s: SesionVista, index: number) => {
                const tratamientos = s.Tratamiento || [];

                return (
                  <div key={s.ID_Sesion} className="collapse collapse-plus bg-white shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                    <input type="checkbox" className="peer" />

                    <div className="collapse-title font-bold text-slate-700 flex justify-between items-center peer-checked:bg-slate-50 peer-checked:border-b peer-checked:border-slate-200">
                      <div className="flex items-center gap-3">
                        <span className="bg-slate-800 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                          {sesiones.length - index}
                        </span>

                        <span className="text-lg font-serif">Nota de Sesión</span>

                        <span className="text-xs font-normal text-slate-400 uppercase tracking-wider ml-2">
                          {helpers.formatearFecha(s.FechaCita || s.HoraDeInicio)} | {helpers.formatearHora(s.HoraDeInicio || s.HoraCita)}
                        </span>
                      </div>

                      <span className="font-medium text-sm badge badge-ghost">
                        Dr. {s.Psicologo?.Apellido || 'N/A'}
                      </span>
                    </div>

                    <div className="collapse-content bg-white p-6 border-t border-slate-100">
                      <div className="space-y-6">

                        {/* Diagnostico y criterios */}
                        <div className="p-4 border-l-4 border-blue-600 bg-blue-50/50 rounded-r-lg">
                          <h4 className="font-bold text-slate-700 text-sm mb-1 uppercase tracking-wider">Diagnóstico Diferencial</h4>
                          <p className="text-slate-800 italic">{s.DiagnosticoDiferencial || 'N/A'}</p>

                          {s.Criterios_DeDiagnostico && (
                            <p className="text-xs text-slate-500 mt-2">
                              Criterios: {s.Criterios_DeDiagnostico}
                            </p>
                          )}
                        </div>

                        {/* Observaciones y evolucion */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-bold text-slate-700 text-sm mb-2 uppercase tracking-wider">Observaciones Clínicas</h4>
                            <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                              {s.Observaciones || 'Sin observaciones registradas.'}
                            </p>
                          </div>

                          <div>
                            <h4 className="font-bold text-amber-600 text-sm mb-2 uppercase tracking-wider">Historial de Evolución</h4>
                            <p className="text-slate-600 text-sm bg-amber-50 p-3 rounded-lg border border-amber-100 whitespace-pre-wrap">
                              {s.HistorialDeEvolucion || 'No hay evolución registrada.'}
                            </p>
                          </div>
                        </div>

                        {tratamientos.length > 0 && (
                          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                            <h4 className="font-bold text-slate-700 text-sm mb-3 uppercase tracking-wider">Tratamientos registrados</h4>

                            <div className="space-y-3">
                              {tratamientos.map((t: TratamientoVista, i: number) => (
                                <div key={`${s.ID_Sesion}-tratamiento-${i}`} className="text-sm text-slate-600 bg-white border border-slate-100 rounded-lg p-3">
                                  <p><span className="font-semibold">Fecha inicio:</span> {helpers.formatearFecha(t.FechaInicio)}</p>
                                  <p><span className="font-semibold">Frecuencia:</span> {t.Frecuencia || 'N/A'}</p>

                                  {t.Tratamiento_Farmaceutico && (
                                    <p>
                                      <span className="font-semibold">Medicamento:</span> {t.Tratamiento_Farmaceutico.Nombre_Medicamento || 'N/A'}
                                      {t.Tratamiento_Farmaceutico.Dosis ? ` - ${t.Tratamiento_Farmaceutico.Dosis}` : ''}
                                    </p>
                                  )}

                                  {t.Tratamiento_Terapeutico && (
                                    <p>
                                      <span className="font-semibold">Objetivo terapéutico:</span> {t.Tratamiento_Terapeutico.Objetivo || 'N/A'}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
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
