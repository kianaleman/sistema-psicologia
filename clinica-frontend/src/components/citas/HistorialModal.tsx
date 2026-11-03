import { toast } from 'sonner';
import { usePacienteDetalle } from '../../hooks/usePacienteDetalle';
import { prepararPDFReceta } from '../../services/expedientePaciente';
import { generarPDFReceta } from '../../services/pdfGenerator';
import type { Cita, TratamientoClinico } from '../../types';
interface HistorialModalProps { isOpen: boolean; onClose: () => void; cita: Cita | null }
const Icons = {
  Empty: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-12 h-12 mb-2 opacity-50">
      <path fillRule="evenodd" d="M7.5 7.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM11.5 7.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM14 7.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM2 6.5C2 5.672 2.672 5 3.5 5h13c.828 0 1.5.672 1.5 1.5v6.25c0 .828-.672 1.5-1.5 1.5h-2.197l-3.328 3.328a1.5 1.5 0 01-2.122 0l-3.328-3.328H3.5c-.828 0-1.5-.672-1.5-1.5v-6.25z" clipRule="evenodd" />
    </svg>
  ),
};


const obtenerNombreTratamiento = (t: TratamientoClinico) => t.Tratamiento_Farmaceutico?.Nombre_Medicamento || t.Tratamiento_Terapeutico?.Objetivo || 'Tratamiento';
const obtenerDetalleTratamiento = (t: TratamientoClinico) => t.Tratamiento_Farmaceutico
  ? `Dosis: ${t.Tratamiento_Farmaceutico.Dosis} · Vía: ${t.Tratamiento_Farmaceutico.ViaAdministracion?.Nombre_De_Presentacion || 'Sin vía'}`
  : `Terapia: ${t.Tratamiento_Terapeutico?.TipoDe_Terapia?.Nombre_De_Terapia || 'Sin tipo'}`;
export default function HistorialModal(props: HistorialModalProps) {
  if (!props.isOpen || !props.cita) return null;
  return <HistorialPaciente key={props.cita.ID_Paciente} {...props} />;
}
function HistorialPaciente({ isOpen, onClose, cita }: HistorialModalProps) {
  const pacienteId = cita?.ID_Paciente;
  const { expediente, loading, error, helpers } = usePacienteDetalle(isOpen && pacienteId ? String(pacienteId) : undefined);
  if (!isOpen) return null;
  const historial = expediente?.sesiones ?? [];
  const nombrePaciente = expediente ? `${expediente.paciente.Nombre} ${expediente.paciente.Apellido}` : 'Cargando paciente…';
  const numeroExpediente = expediente?.expediente?.No_Expediente;
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
          ) : error ? (<p role="alert" className="p-8 text-red-700">{error}</p>) : historial.length > 0 ? (
            <div className="space-y-4">
              {historial.map((sesion, index) => {
                const psicologo = sesion.Psicologo;
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
                          {helpers.formatearFecha(sesion.FechaCita)}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-sm" onClick={(event) => event.stopPropagation()}>
                        <button
                          type="button"
                          className="btn btn-xs btn-outline btn-success gap-1 z-10"
                          disabled={loading || !!error || !expediente}
                          onClick={() => {
                            if (!expediente) return;
                            try {
                              const pdf = prepararPDFReceta(expediente, pacienteId!, sesion.ID_Sesion);
                              generarPDFReceta(pdf.sesion, pdf.nombrePaciente);
                            } catch (error) { toast.error(error instanceof Error ? error.message : 'No se pudo generar el PDF'); }
                          }}
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
                            Criterios: {sesion.Criterios_DeDiagnostico || 'Sin criterios'}
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
                              {sesion.HistorialDeEvolucion || 'Sin evolución registrada'}
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
                                    {tratamiento.Frecuencia || 'Sin frecuencia'} · {tratamiento.FechaInicio?.slice(0, 10)} – {tratamiento.FechaFin?.slice(0, 10) || 'Sin fecha final'}
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
