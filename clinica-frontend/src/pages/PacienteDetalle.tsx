import { useParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { usePacienteDetalle } from '../hooks/usePacienteDetalle';
import { generarPDFExpediente } from '../services/pdfGenerator';
import type { ExpedienteCompleto } from '../hooks/usePacienteDetalle';

const Icons = {
  Back: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
    </svg>
  ),
  Download: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M7.5 12l4.5 4.5m0 0l4.5-4.5M12 16.5V3" />
    </svg>
  ),
  Info: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-5 w-5">
      <circle cx="12" cy="12" r="8.25" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 10.75v5M12 7.75h.01" />
    </svg>
  ),
  Calendar: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 3v3M17 3v3M4.5 8.25h15M5.25 5.25h13.5A1.5 1.5 0 0120.25 6.75v12A1.5 1.5 0 0118.75 20.25H5.25A1.5 1.5 0 013.75 18.75v-12A1.5 1.5 0 015.25 5.25z" />
    </svg>
  ),
  Notes: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3.75h6L19.5 9.75v10.5H7.5A3 3 0 014.5 17.25V6.75A3 3 0 017.5 3.75z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 3.75V9.75h6M8.25 14h7.5M8.25 17h5" />
    </svg>
  ),
  User: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-6 w-6">
      <circle cx="12" cy="8" r="3.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 21a7 7 0 0114 0" />
    </svg>
  ),
  Users: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-5 w-5">
      <circle cx="8.5" cy="8" r="3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 20a5.75 5.75 0 0111.5 0" />
      <circle cx="17" cy="10.25" r="2.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 16.25A4.5 4.5 0 0120.25 20" />
    </svg>
  ),
  MapPin: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s7.5-4.875 7.5-11.25a7.5 7.5 0 10-15 0C4.5 16.125 12 21 12 21z" />
      <circle cx="12" cy="9.75" r="2.75" />
    </svg>
  ),
  Identification: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-5 w-5">
      <rect x="3.75" y="5.25" width="16.5" height="13.5" rx="2.25" />
      <circle cx="9" cy="11" r="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 16.25a3 3 0 014.5 0M14.25 10h3M14.25 13h3M14.25 16h2" />
    </svg>
  ),
  Phone: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3.75h3l1.5 4-2 1.25a11.25 11.25 0 005.75 5.75l1.25-2 4 1.5v3a2.25 2.25 0 01-2.25 2.25A15.75 15.75 0 013.75 6a2.25 2.25 0 012.25-2.25h.75z" />
    </svg>
  ),
  Briefcase: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 6V5.25A2.25 2.25 0 0111.25 3h1.5A2.25 2.25 0 0115 5.25V6" />
      <rect x="3.75" y="6" width="16.5" height="13.5" rx="2.25" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 11.25h16.5M10.5 11.25v1.5h3v-1.5" />
    </svg>
  ),
  Heart: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25S4.5 15.75 4.5 9.75A4.5 4.5 0 0112 6.375 4.5 4.5 0 0119.5 9.75c0 6-7.5 10.5-7.5 10.5z" />
    </svg>
  ),
  Empty: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" className="h-12 w-12">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3.75h6L19.5 9.75v10.5H7.5A3 3 0 014.5 17.25V6.75A3 3 0 017.5 3.75z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 14h7.5M8.25 17h5" />
    </svg>
  ),
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

type ExpedientePDFResumen = {
  ID_Expediente?: number;
  No_Expediente?: string;
};

type ExpedienteCompletoConNumero = ExpedienteCompleto & {
  expediente?: ExpedientePDFResumen | null;
  Expediente?: ExpedientePDFResumen | null;
};

type PacienteConExpedientePDF = PacienteDetalleData & {
  Expediente?: ExpedientePDFResumen | null;
  expediente?: ExpedientePDFResumen | null;
  expedientes?: ExpedientePDFResumen[];
};

type SesionPDFDetalle = SesionVista & {
  ID_Cita?: number;
  FechaCita?: string;
  HoraCita?: string;
  Cita?: CitaDetalleData | null;
  Expediente?: ExpedientePDFResumen | null;
  Psicologo?: CitaDetalleData['Psicologo'];
  TipoDeCita?: CitaDetalleData['TipoDeCita'];
  MotivoConsulta?: string | null;
};

type InfoItemProps = {
  label: string;
  value: string;
  mono?: boolean;
};

function InfoItem({ label, value, mono = false }: InfoItemProps) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className={`mt-1 break-words text-sm font-bold text-slate-700 ${mono ? 'font-mono' : ''}`}>
        {value || 'N/A'}
      </p>
    </div>
  );
}

export default function PacienteDetalle() {
  const { id } = useParams();
  const { expediente, loading, tab, setTab, helpers } = usePacienteDetalle(id);

  if (loading) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center">
        <div className="rounded-[2rem] border border-white/80 bg-white px-12 py-10 text-center shadow-sm">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="mt-4 animate-pulse text-sm font-medium text-slate-400">Cargando expediente...</p>
        </div>
      </div>
    );
  }

  if (!expediente) {
    return (
      <div className="flex min-h-[55vh] flex-col items-center justify-center space-y-4">
        <div className="rounded-[2rem] border border-rose-100 bg-rose-50 px-8 py-6 text-center text-rose-700">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-rose-600 shadow-sm">
            <Icons.Empty />
          </div>
          <p className="text-lg font-black">No se encontró el expediente del paciente.</p>
        </div>

        <Link to="/pacientes" className="btn rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50">
          <Icons.Back />
          Volver a la lista
        </Link>
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

    if (s.includes('pendiente')) return 'border-blue-100 bg-blue-50 text-blue-700';
    if (s.includes('realizada')) return 'border-emerald-100 bg-emerald-50 text-emerald-700';
    if (s.includes('cancelada')) return 'border-rose-100 bg-rose-50 text-rose-700';

    return 'border-slate-200 bg-slate-50 text-slate-600';
  };

  const handleDescargarExpediente = () => {
    try {
      const expedienteConNumero = expediente as ExpedienteCompletoConNumero;
      const pacienteConExpediente = paciente as PacienteConExpedientePDF;

      const expedientePaciente =
        pacienteConExpediente.Expediente ||
        pacienteConExpediente.expediente ||
        pacienteConExpediente.expedientes?.[0] ||
        expedienteConNumero.expediente ||
        expedienteConNumero.Expediente ||
        null;

      const citasPorId = new Map(citas.map((cita) => [cita.ID_Cita, cita]));

      const pacientePDF = {
        ...paciente,
        Expediente: expedientePaciente,
      } as Parameters<typeof generarPDFExpediente>[0];

      const historialPDF = sesiones.map((sesion) => {
        const sesionPDF = sesion as SesionPDFDetalle;
        const citaSesion = sesionPDF.Cita || citasPorId.get(Number(sesionPDF.ID_Cita)) || null;

        return {
          ...sesionPDF,
          Cita: citaSesion,
          Expediente: sesionPDF.Expediente || expedientePaciente,
        };
      }) as Parameters<typeof generarPDFExpediente>[1];

      generarPDFExpediente(pacientePDF, historialPDF);
      toast.success('Expediente generado correctamente');
    } catch (error: unknown) {
      console.error('Error al generar expediente:', error);
      toast.error('No se pudo generar el expediente del paciente');
    }
  };

  return (
    <div className="mx-auto max-w-[1700px] animate-fade-in-up space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-slate-950 px-6 py-7 text-white shadow-2xl shadow-slate-200/80 sm:px-8">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-500/25 blur-3xl"></div>
        <div className="absolute -bottom-28 left-14 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl"></div>

        <div className="relative z-10 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[2rem] border border-white/10 bg-white/10 font-serif text-3xl font-black text-white shadow-xl">
              {inicialNombre}{inicialApellido}
            </div>

            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-blue-300">
                Expediente clínico
              </p>
              <h1 className="mt-2 truncate font-serif text-3xl font-black tracking-tight sm:text-4xl">
                {paciente.Nombre} {paciente.Apellido}
              </h1>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-black ${esAdulto ? 'bg-blue-500 text-white' : 'bg-amber-500 text-white'}`}>
                  {esAdulto ? 'Adulto' : 'Menor'}
                </span>

                <span className={`rounded-full px-3 py-1 text-xs font-black ${paciente.Activo === false ? 'bg-slate-500 text-white' : 'bg-emerald-500 text-white'}`}>
                  {estadoTexto}
                </span>

                <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 font-mono text-xs font-bold text-slate-200">
                  {identificacionPaciente || 'Sin identificación'}
                </span>
              </div>

              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
                {esAdulto ? ocupacionAdulto : `Tutor responsable: ${tutor ? `${tutor.Nombre} ${tutor.Apellido}` : 'N/A'}`}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row xl:flex-col xl:items-end">
            <button
              type="button"
              className="btn rounded-2xl border-white/10 bg-white px-5 text-slate-950 shadow-xl hover:border-white hover:bg-slate-100"
              onClick={handleDescargarExpediente}
            >
              <Icons.Download />
              Descargar expediente
            </button>

            <Link to="/pacientes" className="btn rounded-2xl border-white/10 bg-white/10 text-white hover:bg-white/20">
              <Icons.Back />
              Volver
            </Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-white/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Citas</p>
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Icons.Calendar />
            </span>
          </div>
          <p className="mt-2 text-3xl font-black text-slate-950">{citas.length}</p>
          <p className="mt-1 text-xs font-medium text-slate-400">Registradas en expediente</p>
        </div>

        <div className="rounded-3xl border border-white/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Sesiones</p>
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <Icons.Notes />
            </span>
          </div>
          <p className="mt-2 text-3xl font-black text-slate-950">{sesiones.length}</p>
          <p className="mt-1 text-xs font-medium text-slate-400">Notas clínicas</p>
        </div>

        <div className="rounded-3xl border border-white/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Paciente</p>
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
              <Icons.User />
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-950">{esAdulto ? 'Adulto' : 'Menor'}</p>
          <p className="mt-1 text-xs font-medium text-slate-400">Clasificación</p>
        </div>

        <div className="rounded-3xl border border-white/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Estado</p>
            <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${paciente.Activo === false ? 'bg-slate-100 text-slate-500' : 'bg-emerald-50 text-emerald-600'}`}>
              <Icons.Heart />
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-950">{estadoTexto}</p>
          <p className="mt-1 text-xs font-medium text-slate-400">Actividad del expediente</p>
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/80 bg-white p-2 shadow-sm">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          <button
            type="button"
            className={`flex items-center justify-center gap-2 rounded-[1.4rem] px-4 py-3 text-sm font-black transition-all ${tab === 'info' ? 'bg-slate-950 text-white shadow-lg shadow-slate-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
            onClick={() => setTab('info')}
          >
            <Icons.Info />
            Información
          </button>

          <button
            type="button"
            className={`flex items-center justify-center gap-2 rounded-[1.4rem] px-4 py-3 text-sm font-black transition-all ${tab === 'citas' ? 'bg-slate-950 text-white shadow-lg shadow-slate-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
            onClick={() => setTab('citas')}
          >
            <Icons.Calendar />
            Citas ({citas.length})
          </button>

          <button
            type="button"
            className={`flex items-center justify-center gap-2 rounded-[1.4rem] px-4 py-3 text-sm font-black transition-all ${tab === 'sesiones' ? 'bg-slate-950 text-white shadow-lg shadow-slate-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
            onClick={() => setTab('sesiones')}
          >
            <Icons.Notes />
            Sesiones ({sesiones.length})
          </button>
        </div>
      </section>

      {tab === 'info' && (
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-6">
            <div className="rounded-[2rem] border border-white/80 bg-white p-6 shadow-sm">
              <div className="mb-5">
                <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-blue-600">
                  <Icons.Identification />
                  Datos generales
                </p>
                <h2 className="mt-1 text-2xl font-black text-slate-900">Información del paciente</h2>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {pacienteAdulto && (
                  <>
                    <InfoItem
                      label="Teléfono"
                      value={`${pacienteAdulto.CodigoTelefonoPais?.Codigo ? `${pacienteAdulto.CodigoTelefonoPais.Codigo} ` : ''}${pacienteAdulto.No_Telefono || 'N/A'}`}
                      mono
                    />
                    <InfoItem label="Ocupación" value={ocupacionAdulto} />
                    <InfoItem label="Estado civil" value={pacienteAdulto.EstadoCivil?.Nombre_EstadoCivil || 'N/A'} />
                  </>
                )}

                {pacienteMenor && (
                  <>
                    <InfoItem label="Partida" value={pacienteMenor.PartidaDeNacimiento || 'N/A'} mono />
                    <InfoItem label="Grado escolar" value={pacienteMenor.Grado_Escolar || 'N/A'} />
                  </>
                )}

                <InfoItem label="Nacionalidad" value={nacionalidad} />
                <InfoItem label="Fecha nacimiento" value={helpers.formatearFecha(paciente.Fecha_Nacimiento)} />
                <InfoItem label="Género" value={paciente.Genero || 'N/A'} />
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/80 bg-white p-6 shadow-sm">
              <div className="mb-5">
                <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-blue-600">
                  <Icons.MapPin />
                  Dirección
                </p>
                <h2 className="mt-1 text-2xl font-black text-slate-900">Dirección principal</h2>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                <InfoItem label="País" value={direccion?.Pais || paciente.Pais?.Nombre_Pais || 'N/A'} />
                <InfoItem label="Departamento" value={direccion?.Municipio?.Departamento?.Nombre_Departamento || 'N/A'} />
                <InfoItem label="Municipio" value={direccion?.Municipio?.Nombre_Municipio || 'N/A'} />
                <InfoItem label="Barrio" value={direccion?.Barrio || 'N/A'} />
                <InfoItem label="Calle" value={direccion?.Calle || 'N/A'} />
              </div>
            </div>

            {tutor && (
              <div className="rounded-[2rem] border border-white/80 bg-white p-6 shadow-sm">
                <div className="mb-5">
                  <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-blue-600">
                    <Icons.Users />
                    Tutor responsable
                  </p>
                  <h2 className="mt-1 text-2xl font-black text-slate-900">Información del tutor</h2>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <InfoItem label="Nombre" value={`${tutor.Nombre} ${tutor.Apellido}`} />
                  <InfoItem label="Cédula" value={tutor.No_Cedula || 'N/A'} mono />
                  <InfoItem label="Parentesco" value={tutorRelacion?.Parentesco?.Nombre_De_Parentesco || 'N/A'} />
                  <InfoItem label="Estado civil" value={tutor.EstadoCivil_Tutor_EstadoCivilToEstadoCivil?.Nombre_EstadoCivil || 'N/A'} />
                  <InfoItem
                    label="Teléfono"
                    value={`${tutor.CodigoTelefonoPais?.Codigo ? `${tutor.CodigoTelefonoPais.Codigo} ` : ''}${tutor.No_Telefono || 'N/A'}`}
                    mono
                  />
                  <InfoItem label="Ocupación" value={tutor.Ocupacion_Tutor_OcupacionToOcupacion?.Nombre_DeOcupacion || 'N/A'} />
                  <InfoItem
                    label="Dirección"
                    value={tutor.Direccion ? `${tutor.Direccion.Calle || 'Sin calle'}, ${tutor.Direccion.Barrio || 'Sin barrio'}` : 'N/A'}
                  />
                  <InfoItem label="Municipio" value={tutor.Direccion?.Municipio?.Nombre_Municipio || 'N/A'} />
                </div>
              </div>
            )}
          </div>

          <aside className="space-y-4">
            <div className="rounded-[2rem] border border-white/80 bg-white p-6 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-600">Resumen clínico</p>
              <h3 className="mt-1 text-xl font-black text-slate-900">Actividad del expediente</h3>

              <div className="mt-5 space-y-3">
                <div className="rounded-3xl bg-blue-50 p-5 text-blue-700">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em]">Citas registradas</p>
                  <p className="mt-2 text-4xl font-black">{citas.length}</p>
                </div>

                <div className="rounded-3xl bg-emerald-50 p-5 text-emerald-700">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em]">Sesiones registradas</p>
                  <p className="mt-2 text-4xl font-black">{sesiones.length}</p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-300">Acción rápida</p>
              <h3 className="mt-1 text-xl font-black">Exportar expediente</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">
                Genera un PDF con los datos del paciente y el historial clínico disponible.
              </p>
              <button
                type="button"
                className="btn mt-5 w-full rounded-2xl bg-white text-slate-950 hover:bg-slate-100"
                onClick={handleDescargarExpediente}
              >
                <Icons.Download />
                Descargar PDF
              </button>
            </div>
          </aside>
        </section>
      )}

      {tab === 'citas' && (
        <section className="rounded-[2rem] border border-white/80 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-6">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-600">Historial</p>
            <h2 className="mt-1 text-2xl font-black text-slate-900">Citas registradas</h2>
          </div>

          <div className="p-5">
            {citas.length > 0 ? (
              <div className="space-y-4">
                {citas.map((c: CitaDetalleData) => (
                  <article
                    key={c.ID_Cita}
                    className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-xl hover:shadow-slate-200/70"
                  >
                    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[180px_180px_minmax(0,1fr)_150px] xl:items-center">
                      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Fecha</p>
                        <p className="mt-1 font-mono text-sm font-black text-slate-800">{helpers.formatearFecha(c.FechaCita)}</p>
                      </div>

                      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-blue-700">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-500">Hora</p>
                        <p className="mt-1 font-mono text-sm font-black">{helpers.formatearHora(c.HoraCita)}</p>
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-black text-slate-900">
                          Dr. {c.Psicologo?.Nombre || ''} {c.Psicologo?.Apellido || ''}
                        </p>
                        <p className="mt-1 text-sm font-medium text-slate-500">{c.TipoDeCita?.Nombre_DeCita || 'N/A'}</p>
                        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate-500" title={c.MotivoConsulta || ''}>
                          {c.MotivoConsulta || 'Sin motivo registrado'}
                        </p>
                      </div>

                      <div className="flex justify-start xl:justify-end">
                        <span className={`rounded-full border px-3 py-1 text-xs font-black ${getEstadoColor(c.EstadoCita?.NombreEstado)}`}>
                          {c.EstadoCita?.NombreEstado || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-6 py-24 text-center">
                <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-white text-slate-300 shadow-sm">
                  <Icons.Calendar />
                </div>
                <p className="text-lg font-black text-slate-700">No hay historial de citas</p>
                <p className="mt-2 max-w-sm text-sm font-medium text-slate-400">Este paciente aún no tiene citas registradas.</p>
              </div>
            )}
          </div>
        </section>
      )}

      {tab === 'sesiones' && (
        <section className="rounded-[2rem] border border-white/80 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-6">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-600">Notas clínicas</p>
            <h2 className="mt-1 text-2xl font-black text-slate-900">Sesiones registradas</h2>
          </div>

          <div className="p-5">
            {sesiones.length > 0 ? (
              <div className="space-y-4">
                {sesiones.map((s: SesionVista, index: number) => {
                  const tratamientos = s.Tratamiento || [];

                  return (
                    <details
                      key={s.ID_Sesion}
                      className="group overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm transition-all hover:border-blue-100 hover:shadow-xl hover:shadow-slate-200/70"
                    >
                      <summary className="flex cursor-pointer list-none flex-col gap-4 bg-slate-50/70 p-5 transition-colors group-open:border-b group-open:border-slate-100 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 items-center gap-4">
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black text-white">
                            {sesiones.length - index}
                          </span>

                          <div className="min-w-0">
                            <p className="text-lg font-black text-slate-900">Nota de sesión</p>
                            <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-400">
                              {helpers.formatearFecha(s.FechaCita || s.HoraDeInicio)} · {helpers.formatearHora(s.HoraDeInicio || s.HoraCita)}
                            </p>
                          </div>
                        </div>

                        <span className="w-fit rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-black text-slate-600">
                          Dr. {s.Psicologo?.Apellido || 'N/A'}
                        </span>
                      </summary>

                      <div className="space-y-6 p-6">
                        <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5">
                          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">Diagnóstico diferencial</p>
                          <p className="mt-2 text-sm leading-relaxed text-slate-800">{s.DiagnosticoDiferencial || 'N/A'}</p>

                          {s.Criterios_DeDiagnostico && (
                            <p className="mt-3 rounded-2xl bg-white p-3 text-xs font-medium text-slate-500">
                              Criterios: {s.Criterios_DeDiagnostico}
                            </p>
                          )}
                        </div>

                        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                          <div className="rounded-3xl border border-slate-100 bg-white p-5">
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Observaciones clínicas</p>
                            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                              {s.Observaciones || 'Sin observaciones registradas.'}
                            </p>
                          </div>

                          <div className="rounded-3xl border border-amber-100 bg-amber-50 p-5">
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-600">Historial de evolución</p>
                            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                              {s.HistorialDeEvolucion || 'No hay evolución registrada.'}
                            </p>
                          </div>
                        </div>

                        {tratamientos.length > 0 && (
                          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                            <p className="mb-4 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Tratamientos registrados</p>

                            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                              {tratamientos.map((t: TratamientoVista, i: number) => (
                                <div key={`${s.ID_Sesion}-tratamiento-${i}`} className="rounded-2xl border border-slate-100 bg-white p-4 text-sm text-slate-600">
                                  <p><span className="font-bold text-slate-700">Fecha inicio:</span> {helpers.formatearFecha(t.FechaInicio)}</p>
                                  <p><span className="font-bold text-slate-700">Frecuencia:</span> {t.Frecuencia || 'N/A'}</p>

                                  {t.Tratamiento_Farmaceutico && (
                                    <p>
                                      <span className="font-bold text-slate-700">Medicamento:</span> {t.Tratamiento_Farmaceutico.Nombre_Medicamento || 'N/A'}
                                      {t.Tratamiento_Farmaceutico.Dosis ? ` - ${t.Tratamiento_Farmaceutico.Dosis}` : ''}
                                    </p>
                                  )}

                                  {t.Tratamiento_Terapeutico && (
                                    <p>
                                      <span className="font-bold text-slate-700">Objetivo terapéutico:</span> {t.Tratamiento_Terapeutico.Objetivo || 'N/A'}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </details>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-6 py-24 text-center">
                <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-white text-slate-300 shadow-sm">
                  <Icons.Notes />
                </div>
                <p className="text-lg font-black text-slate-700">No hay notas de sesión</p>
                <p className="mt-2 max-w-sm text-sm font-medium text-slate-400">Este paciente aún no tiene sesiones registradas.</p>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
