import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { api } from '../../services/api';
import { generarPDFReceta } from '../../services/pdfGenerator';
import type { Cita } from '../../types';

interface HistorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  cita: Cita | null;
}

type ExpedienteVista = {
  ID_Expediente?: number;
  No_Expediente?: string | null;
};

type PsicologoVista = {
  ID_Psicologo?: number;
  Nombre?: string;
  Apellido?: string;
  CodigoMinsa?: string;
};

type TipoTerapiaVista = {
  Nombre_De_Terapia?: string;
  NombreDeTerapia?: string;
};

type TratamientoFarmaceuticoVista = {
  Nombre_Medicamento?: string;
  NombreMedicamento?: string;
  Dosis?: string;
};

type TratamientoTerapeuticoVista = {
  Objetivo?: string;
  TipoDeTerapia?: TipoTerapiaVista;
};

type TratamientoVista = {
  ID_Tratamiento?: number;
  Frecuencia?: string;
  Tratamiento_Farmaceutico?: TratamientoFarmaceuticoVista | null;
  TratamientoFarmaceutico?: TratamientoFarmaceuticoVista | null;
  Tratamiento_Terapeutico?: TratamientoTerapeuticoVista | null;
  TratamientoTerapeutico?: TratamientoTerapeuticoVista | null;
};

type SesionHistorial = {
  ID_Sesion?: number;
  ID_Cita?: number;
  ID_Expediente?: number;
  HoraDeInicio?: string | null;
  HoraFinal?: string | null;
  Observaciones?: string | null;
  DiagnosticoDiferencial?: string | null;
  HistorialDeEvolucion?: string | null;
  HistorialDevolucion?: string | null;
  Criterios_DeDiagnostico?: string | null;
  CriteriosDeDiagnostico?: string | null;
  FechaReal?: string | null;
  Expediente?: ExpedienteVista | null;
  Psicologo?: PsicologoVista | null;
  Tratamiento?: TratamientoVista[];
  Cita?: {
    FechaCita?: string | null;
    Psicologo?: PsicologoVista | null;
  } | null;
};

type PacienteExpedienteVista = {
  ID_Paciente?: number;
  Nombre?: string;
  Apellido?: string;
  Expediente?: ExpedienteVista | ExpedienteVista[] | null;
};

type CitaExpedienteVista = Cita & {
  Sesion?: SesionHistorial | null;
};

type ExpedienteCompletoResponse = {
  paciente?: PacienteExpedienteVista;
  expediente?: ExpedienteVista | null;
  Expediente?: ExpedienteVista | null;
  expedientes?: ExpedienteVista[];
  sesiones?: SesionHistorial[];
  citas?: CitaExpedienteVista[];
};


type SesionParaPDF = Parameters<typeof generarPDFReceta>[0];
type TratamientoParaPDF = NonNullable<SesionParaPDF['Tratamiento']>[number];

const Icons = {
  Empty: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-12 h-12 mb-2 opacity-50">
      <path fillRule="evenodd" d="M7.5 7.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM11.5 7.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM14 7.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM2 6.5C2 5.672 2.672 5 3.5 5h13c.828 0 1.5.672 1.5 1.5v6.25c0 .828-.672 1.5-1.5 1.5h-2.197l-3.328 3.328a1.5 1.5 0 01-2.122 0l-3.328-3.328H3.5c-.828 0-1.5-.672-1.5-1.5v-6.25z" clipRule="evenodd" />
    </svg>
  ),
};

const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const obtenerPacienteId = (cita: Cita | null) => {
  return cita?.Paciente?.ID_Paciente || cita?.ID_Paciente || null;
};

const obtenerNombrePaciente = (cita: Cita | null, expediente?: ExpedienteCompletoResponse | null) => {
  const nombre = cita?.Paciente?.Nombre || expediente?.paciente?.Nombre || 'Paciente';
  const apellido = cita?.Paciente?.Apellido || expediente?.paciente?.Apellido || '';

  return `${nombre} ${apellido}`.trim();
};

const obtenerSesionesDesdeRespuesta = (data: unknown): SesionHistorial[] => {
  if (Array.isArray(data)) return data as SesionHistorial[];

  if (isObject(data) && Array.isArray(data.sesiones)) {
    return data.sesiones as SesionHistorial[];
  }

  return [];
};

const obtenerNoExpedienteDesdePaciente = (paciente?: PacienteExpedienteVista) => {
  const expediente = paciente?.Expediente;

  if (Array.isArray(expediente)) {
    return expediente.find((item) => item.No_Expediente)?.No_Expediente || null;
  }

  return expediente?.No_Expediente || null;
};

const obtenerNoExpedienteDesdeSesiones = (sesiones: SesionHistorial[]) => {
  return sesiones.find((sesion) => sesion.Expediente?.No_Expediente)?.Expediente?.No_Expediente || null;
};

const obtenerNoExpedienteDesdeCitas = (citas?: CitaExpedienteVista[]) => {
  return citas
    ?.find((citaItem) => citaItem.Sesion?.Expediente?.No_Expediente)
    ?.Sesion?.Expediente?.No_Expediente || null;
};

const obtenerFallbackIdExpediente = (sesiones: SesionHistorial[]) => {
  const idExpediente = sesiones.find((sesion) => sesion.ID_Expediente)?.ID_Expediente;

  return idExpediente ? `ID ${idExpediente}` : null;
};

const obtenerNoExpediente = (
  expedienteCompleto: ExpedienteCompletoResponse | null,
  sesiones: SesionHistorial[],
) => {
  return expedienteCompleto?.expediente?.No_Expediente ||
    expedienteCompleto?.Expediente?.No_Expediente ||
    expedienteCompleto?.expedientes?.find((item) => item.No_Expediente)?.No_Expediente ||
    obtenerNoExpedienteDesdePaciente(expedienteCompleto?.paciente) ||
    obtenerNoExpedienteDesdeSesiones(sesiones) ||
    obtenerNoExpedienteDesdeCitas(expedienteCompleto?.citas) ||
    obtenerFallbackIdExpediente(sesiones) ||
    null;
};

const esFechaBaseSinValorClinico = (fecha: Date) => {
  return fecha.getFullYear() <= 1970;
};

const formatearFecha = (fecha?: string | null) => {
  if (!fecha) return 'Fecha no registrada';

  const valor = String(fecha);
  const fechaClinica = valor.split('T')[0];
  const partes = fechaClinica.split('-');

  if (partes.length === 3) {
    const anio = Number(partes[0]);
    const mes = Number(partes[1]);
    const dia = Number(partes[2]);

    if (!anio || !mes || !dia) {
      return 'Fecha no registrada';
    }

    const fechaManual = new Date(anio, mes - 1, dia);

    if (esFechaBaseSinValorClinico(fechaManual)) {
      return 'Fecha no registrada';
    }

    return fechaManual.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  try {
    const fechaDate = new Date(valor);

    if (!Number.isNaN(fechaDate.getTime())) {
      if (esFechaBaseSinValorClinico(fechaDate)) {
        return 'Fecha no registrada';
      }

      return fechaDate.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }

    return valor;
  } catch {
    return valor;
  }
};

const obtenerCitaDeSesion = (
  sesion: SesionHistorial,
  expedienteCompleto: ExpedienteCompletoResponse | null,
) => {
  if (sesion.Cita?.FechaCita) return sesion.Cita;

  return expedienteCompleto?.citas?.find((citaItem) => citaItem.ID_Cita === sesion.ID_Cita) || null;
};

const obtenerFechaSesion = (
  sesion: SesionHistorial,
  expedienteCompleto: ExpedienteCompletoResponse | null,
) => {
  // No usar HoraDeInicio como fecha clinica.
  // En SQL Server/Prisma un campo Time puede serializarse como 1970-01-01T...
  const citaSesion = obtenerCitaDeSesion(sesion, expedienteCompleto);

  return sesion.FechaReal ||
    sesion.Cita?.FechaCita ||
    citaSesion?.FechaCita ||
    null;
};

const obtenerPsicologoSesion = (sesion: SesionHistorial) => {
  return sesion.Psicologo || sesion.Cita?.Psicologo || null;
};

const obtenerCriterios = (sesion: SesionHistorial) => {
  return sesion.Criterios_DeDiagnostico ||
    sesion.CriteriosDeDiagnostico ||
    'No especificados';
};

const obtenerEvolucion = (sesion: SesionHistorial) => {
  return sesion.HistorialDeEvolucion ||
    sesion.HistorialDevolucion ||
    'No hay evolución registrada.';
};

const obtenerTratamientoFarmaceutico = (tratamiento: TratamientoVista) => {
  return tratamiento.Tratamiento_Farmaceutico || tratamiento.TratamientoFarmaceutico || null;
};

const obtenerTratamientoTerapeutico = (tratamiento: TratamientoVista) => {
  return tratamiento.Tratamiento_Terapeutico || tratamiento.TratamientoTerapeutico || null;
};

const obtenerNombreTratamiento = (tratamiento: TratamientoVista) => {
  const farmaceutico = obtenerTratamientoFarmaceutico(tratamiento);
  const terapeutico = obtenerTratamientoTerapeutico(tratamiento);

  return farmaceutico?.Nombre_Medicamento ||
    farmaceutico?.NombreMedicamento ||
    terapeutico?.Objetivo ||
    'Tratamiento sin nombre';
};

const obtenerDetalleTratamiento = (tratamiento: TratamientoVista) => {
  const farmaceutico = obtenerTratamientoFarmaceutico(tratamiento);
  const terapeutico = obtenerTratamientoTerapeutico(tratamiento);

  if (farmaceutico) {
    return `Dosis: ${farmaceutico.Dosis || 'N/A'}`;
  }

  if (terapeutico) {
    return `Terapia: ${
      terapeutico.TipoDeTerapia?.Nombre_De_Terapia ||
      terapeutico.TipoDeTerapia?.NombreDeTerapia ||
      'Terapia General'
    }`;
  }

  return 'Sin detalle';
};


const normalizarTratamientoParaPDF = (tratamiento: TratamientoVista): TratamientoParaPDF => {
  const farmaceutico = obtenerTratamientoFarmaceutico(tratamiento);
  const terapeutico = obtenerTratamientoTerapeutico(tratamiento);

  return {
    ...(tratamiento.Frecuencia ? { Frecuencia: tratamiento.Frecuencia } : {}),
    ...(farmaceutico
      ? {
          Tratamiento_Farmaceutico: {
            ...(farmaceutico.Nombre_Medicamento ? { Nombre_Medicamento: farmaceutico.Nombre_Medicamento } : {}),
            ...(farmaceutico.NombreMedicamento ? { NombreMedicamento: farmaceutico.NombreMedicamento } : {}),
            ...(farmaceutico.Dosis ? { Dosis: farmaceutico.Dosis } : {}),
          },
        }
      : {}),
    ...(terapeutico
      ? {
          Tratamiento_Terapeutico: {
            ...(terapeutico.Objetivo ? { Objetivo: terapeutico.Objetivo } : {}),
            ...(terapeutico.TipoDeTerapia
              ? {
                  TipoDeTerapia: {
                    ...(terapeutico.TipoDeTerapia.Nombre_De_Terapia
                      ? { Nombre_De_Terapia: terapeutico.TipoDeTerapia.Nombre_De_Terapia }
                      : {}),
                    ...(terapeutico.TipoDeTerapia.NombreDeTerapia
                      ? { NombreDeTerapia: terapeutico.TipoDeTerapia.NombreDeTerapia }
                      : {}),
                  },
                }
              : {}),
          },
        }
      : {}),
  };
};

const normalizarSesionParaPDF = (
  sesion: SesionHistorial,
  expedienteCompleto: ExpedienteCompletoResponse | null,
): SesionParaPDF => {
  const citaSesion = obtenerCitaDeSesion(sesion, expedienteCompleto);
  const psicologo = obtenerPsicologoSesion(sesion) || citaSesion?.Psicologo || null;
  const fechaCita = citaSesion?.FechaCita || sesion.Cita?.FechaCita || sesion.FechaReal || undefined;
  const tratamientos = Array.isArray(sesion.Tratamiento)
    ? sesion.Tratamiento.map(normalizarTratamientoParaPDF)
    : [];

  return {
    ...(sesion.ID_Sesion ? { ID_Sesion: sesion.ID_Sesion } : {}),
    ...(fechaCita || psicologo
      ? {
          Cita: {
            ...(fechaCita ? { FechaCita: fechaCita } : {}),
            ...(psicologo
              ? {
                  Psicologo: {
                    ...(psicologo.Nombre ? { Nombre: psicologo.Nombre } : {}),
                    ...(psicologo.Apellido ? { Apellido: psicologo.Apellido } : {}),
                    ...(psicologo.CodigoMinsa ? { CodigoMinsa: psicologo.CodigoMinsa } : {}),
                  },
                }
              : {}),
          },
        }
      : {}),
    ...(sesion.FechaReal ? { FechaReal: sesion.FechaReal } : {}),
    ...(sesion.HoraDeInicio ? { HoraDeInicio: sesion.HoraDeInicio } : {}),
    ...(sesion.DiagnosticoDiferencial ? { DiagnosticoDiferencial: sesion.DiagnosticoDiferencial } : {}),
    ...(sesion.Observaciones ? { Observaciones: sesion.Observaciones } : {}),
    ...(obtenerEvolucion(sesion) ? { HistorialDeEvolucion: obtenerEvolucion(sesion) } : {}),
    ...(obtenerCriterios(sesion) ? { Criterios_DeDiagnostico: obtenerCriterios(sesion) } : {}),
    ...(tratamientos.length > 0 ? { Tratamiento: tratamientos } : {}),
  };
};

export default function HistorialModal({
  isOpen,
  onClose,
  cita,
}: HistorialModalProps) {
  const [historial, setHistorial] = useState<SesionHistorial[]>([]);
  const [expedienteCompleto, setExpedienteCompleto] = useState<ExpedienteCompletoResponse | null>(null);
  const [numeroExpediente, setNumeroExpediente] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const cargarExpediente = async () => {
      const pacienteId = obtenerPacienteId(cita);

      if (!pacienteId) {
        toast.error('No se recibió el ID del paciente para cargar el expediente.');
        setHistorial([]);
        setNumeroExpediente(null);
        return;
      }

      try {
        setLoading(true);

        const expedienteData = await api.pacientes.getOne(pacienteId);
        const expedienteResponse = expedienteData as ExpedienteCompletoResponse;
        let sesiones = obtenerSesionesDesdeRespuesta(expedienteResponse);

        if (sesiones.length === 0) {
          const historialData = await api.pacientes.getHistorial(pacienteId);
          sesiones = obtenerSesionesDesdeRespuesta(historialData);
        }

        setExpedienteCompleto(expedienteResponse);
        setHistorial(sesiones);
        setNumeroExpediente(obtenerNoExpediente(expedienteResponse, sesiones));
      } catch (error: unknown) {
        const message = error instanceof Error
          ? error.message
          : 'Error al cargar historial. Verifique la conexión al backend.';

        toast.error(message);
        console.error('Error cargando historial:', error);
        setExpedienteCompleto(null);
        setHistorial([]);
        setNumeroExpediente(null);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      cargarExpediente();
    } else {
      setHistorial([]);
      setExpedienteCompleto(null);
      setNumeroExpediente(null);
    }
  }, [isOpen, cita]);

  if (!isOpen) return null;

  const nombrePaciente = obtenerNombrePaciente(cita, expedienteCompleto);

  return (
    <dialog className="modal modal-open bg-black/50 backdrop-blur-sm">
      <div className="modal-box w-11/12 max-w-4xl bg-white text-slate-800 p-0 overflow-hidden rounded-2xl shadow-2xl">

        <div className="bg-slate-800 text-white px-8 py-5 flex justify-between items-center gap-4 relative">
          <div className="min-w-0">
            <h3 className="font-bold text-2xl mb-1 font-serif">Historial Clínico</h3>
            <p className="opacity-90 font-medium text-sm truncate" title={nombrePaciente}>
              {nombrePaciente}
            </p>
          </div>

          <div className="text-right mr-10 shrink-0">
            <span className="badge bg-slate-700 border-none text-white font-mono text-xs">
              EXP: {numeroExpediente || 'Sin expediente'}
            </span>
          </div>

          <button
            type="button"
            className="btn btn-circle btn-ghost btn-sm text-slate-200 absolute top-4 right-4"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="p-8 max-h-[70vh] overflow-y-auto bg-slate-50">
          {loading ? (
            <div className="text-center py-20">
              <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
          ) : historial.length > 0 ? (
            <div className="space-y-4">
              {historial.map((sesion, index) => {
                const psicologo = obtenerPsicologoSesion(sesion);
                const tratamientos = Array.isArray(sesion.Tratamiento) ? sesion.Tratamiento : [];

                return (
                  <div
                    key={sesion.ID_Sesion || `${sesion.ID_Cita || 'sesion'}-${index}`}
                    className="collapse collapse-plus bg-white shadow-md border border-slate-200 hover:shadow-lg transition-shadow rounded-xl"
                  >
                    <input type="checkbox" className="peer" />

                    <div className="collapse-title font-bold text-slate-700 flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 py-4 peer-checked:bg-blue-50 peer-checked:border-b peer-checked:border-slate-200">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="bg-slate-800 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                          {historial.length - index}
                        </span>

                        <span className="text-lg font-medium truncate">Sesión Clínica</span>

                        <span className="text-xs font-normal text-slate-500 uppercase tracking-wider ml-2 truncate">
                          {formatearFecha(obtenerFechaSesion(sesion, expedienteCompleto))}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-sm" onClick={(event) => event.stopPropagation()}>
                        <button
                          type="button"
                          className="btn btn-xs btn-outline btn-success gap-1 z-10"
                          onClick={() => generarPDFReceta(normalizarSesionParaPDF(sesion, expedienteCompleto), nombrePaciente)}
                        >
                          Imprimir receta
                        </button>

                        <span className="font-normal text-slate-500 whitespace-nowrap">
                          Dr. {psicologo?.Apellido || 'N/A'}
                        </span>
                      </div>
                    </div>

                    <div className="collapse-content bg-white p-6 border-t border-slate-100">
                      <div className="space-y-6">
                        <div className="p-4 border-l-4 border-blue-600 bg-blue-50/50 rounded-r-lg">
                          <h4 className="font-bold text-slate-700 text-sm mb-1 uppercase tracking-wider">
                            Diagnóstico Diferencial
                          </h4>
                          <p className="text-slate-800 italic">
                            {sesion.DiagnosticoDiferencial || 'Sin diagnóstico registrado'}
                          </p>
                          <p className="text-xs text-slate-500 mt-2">
                            Criterios: {obtenerCriterios(sesion)}
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-bold text-slate-700 text-sm mb-2 uppercase tracking-wider">
                              Observaciones Clínicas
                            </h4>
                            <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                              {sesion.Observaciones || 'Sin observaciones'}
                            </p>
                          </div>

                          <div>
                            <h4 className="font-bold text-amber-800 text-sm mb-2 uppercase tracking-wider">
                              Historial de Evolución
                            </h4>
                            <p className="text-amber-900 italic text-sm bg-amber-50 p-3 rounded-lg border border-amber-100 whitespace-pre-wrap">
                              {obtenerEvolucion(sesion)}
                            </p>
                          </div>
                        </div>

                        {tratamientos.length > 0 && (
                          <div className="pt-4">
                            <h4 className="font-bold text-slate-700 text-sm mb-2 uppercase tracking-wider border-t pt-4">
                              Tratamientos Indicados
                            </h4>

                            {tratamientos.map((tratamiento, tratamientoIndex) => (
                              <div
                                key={tratamiento.ID_Tratamiento || tratamientoIndex}
                                className="flex flex-col border-b last:border-b-0 pb-3 mb-3 last:mb-0"
                              >
                                <span className="font-bold text-sm text-slate-800">
                                  {obtenerNombreTratamiento(tratamiento)}
                                  <span className="badge badge-sm ml-2">
                                    {tratamiento.Frecuencia || 'Sin frecuencia'}
                                  </span>
                                </span>

                                <span className="text-xs text-slate-500 mt-1">
                                  {obtenerDetalleTratamiento(tratamiento)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="flex flex-col items-center justify-center text-slate-400">
                <Icons.Empty />
                <p className="text-base font-medium text-slate-600">
                  Este paciente no tiene sesiones previas registradas.
                </p>
                <p className="text-sm mt-1">
                  Si acabas de finalizar una sesión, actualiza la agenda y vuelve a abrir el expediente.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-white border-t border-slate-100 flex justify-end rounded-b-2xl">
          <button type="button" className="btn btn-ghost px-8" onClick={onClose}>
            Cerrar Expediente
          </button>
        </div>
      </div>
    </dialog>
  );
}
