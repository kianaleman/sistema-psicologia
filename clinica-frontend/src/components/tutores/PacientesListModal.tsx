import type {
  PacienteMenorTutor,
  TutorCompleto,
  TutorPacienteMenorRelacion,
} from '../../hooks/useTutores';

interface PacientesListModalProps {
  isOpen: boolean;
  onClose: () => void;
  tutor: TutorCompleto | null;
}

type PacienteMenorVista = PacienteMenorTutor & {
  parentesco?: string;
  contactoPrincipal?: boolean | null;
};

const Icons = {
  Empty: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-12 h-12 mb-2 opacity-50">
      <path fillRule="evenodd" d="M7.5 7.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM11.5 7.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM14 7.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM2 6.5C2 5.672 2.672 5 3.5 5h13c.828 0 1.5.672 1.5 1.5v6.25c0 .828-.672 1.5-1.5 1.5h-2.197l-3.328 3.328a1.5 1.5 0 01-2.122 0l-3.328-3.328H3.5c-.828 0-1.5-.672-1.5-1.5v-6.25z" clipRule="evenodd" />
    </svg>
  ),
};

function normalizarPacienteDesdeRelacion(relacion: TutorPacienteMenorRelacion): PacienteMenorVista | null {
  if (!relacion.Paciente_Menor) return null;

  return {
    ...relacion.Paciente_Menor,
    parentesco: relacion.Parentesco?.Nombre_De_Parentesco || 'N/A',
    contactoPrincipal: relacion.Es_Contacto_Principal,
  };
}

function obtenerPacientes(tutor: TutorCompleto): PacienteMenorVista[] {
  const desdeRelacion = tutor.Tutor_PacienteMenor
    ?.map(normalizarPacienteDesdeRelacion)
    .filter((paciente): paciente is PacienteMenorVista => Boolean(paciente)) || [];

  const desdePacienteMenor = tutor.PacienteMenor || tutor.Paciente_Menor || [];

  if (desdeRelacion.length > 0) return desdeRelacion;

  return desdePacienteMenor.map((paciente) => ({
    ...paciente,
    parentesco: tutor.Parentesco?.Nombre_De_Parentesco || 'N/A',
    contactoPrincipal: null,
  }));
}

function obtenerNombrePaciente(paciente: PacienteMenorVista) {
  const nombre = paciente.Paciente?.Nombre || '';
  const apellido = paciente.Paciente?.Apellido || '';
  const nombreCompleto = `${nombre} ${apellido}`.trim();

  return nombreCompleto || 'Paciente no disponible';
}

function obtenerPartidaNacimiento(paciente: PacienteMenorVista) {
  return paciente.PartidaDeNacimiento || 'Sin partida';
}

function obtenerGradoEscolar(paciente: PacienteMenorVista) {
  return paciente.Grado_Escolar || 'N/A';
}

function obtenerKeyPaciente(paciente: PacienteMenorVista, index: number) {
  return `${paciente.ID_Paciente_Menor || paciente.PartidaDeNacimiento || index}`;
}

export default function PacientesListModal({
  isOpen,
  onClose,
  tutor,
}: PacientesListModalProps) {
  if (!isOpen || !tutor) return null;

  const pacientes = obtenerPacientes(tutor);
  const nombreTutor = `${tutor.Nombre} ${tutor.Apellido}`.trim();

  return (
    <dialog className="modal modal-open backdrop-blur-sm">
      <div className="modal-box bg-white rounded-xl border border-slate-100 shadow-2xl p-0 overflow-hidden w-11/12 max-w-3xl">

        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center gap-4">
          <div className="min-w-0">
            <h3 className="font-bold text-lg text-slate-800">Pacientes a cargo</h3>
            <p className="text-sm text-slate-500 truncate" title={nombreTutor}>
              Tutor: {nombreTutor}
            </p>
          </div>

          <button
            type="button"
            className="btn btn-sm btn-circle btn-ghost shrink-0"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="p-0 overflow-x-auto max-w-full">
          <table className="table table-fixed w-full min-w-[680px]">
            <colgroup>
              <col className="w-[230px]" />
              <col className="w-[170px]" />
              <col className="w-[130px]" />
              <col className="w-[120px]" />
            </colgroup>

            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
              <tr>
                <th className="pl-6 py-4">Nombre del Paciente</th>
                <th>Partida de Nacimiento</th>
                <th>Grado Escolar</th>
                <th className="pr-6">Parentesco</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {pacientes.map((paciente, index) => {
                const nombrePaciente = obtenerNombrePaciente(paciente);
                const partidaNacimiento = obtenerPartidaNacimiento(paciente);
                const gradoEscolar = obtenerGradoEscolar(paciente);

                return (
                  <tr key={obtenerKeyPaciente(paciente, index)} className="hover:bg-blue-50 transition-colors">
                    <td className="pl-6 py-3">
                      <div className="font-bold text-slate-700 truncate" title={nombrePaciente}>
                        {nombrePaciente}
                      </div>

                      {paciente.contactoPrincipal && (
                        <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-600">
                          Contacto principal
                        </span>
                      )}
                    </td>

                    <td className="py-3">
                      <span className="badge badge-outline badge-primary font-mono text-xs max-w-full truncate" title={partidaNacimiento}>
                        {partidaNacimiento}
                      </span>
                    </td>

                    <td className="py-3">
                      <span className="text-sm text-slate-600 truncate block" title={gradoEscolar}>
                        {gradoEscolar}
                      </span>
                    </td>

                    <td className="pr-6 py-3">
                      <span className="badge badge-sm badge-outline text-slate-600 border-slate-300 bg-white max-w-full truncate" title={paciente.parentesco || 'N/A'}>
                        {paciente.parentesco || 'N/A'}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {pacientes.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-12">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Icons.Empty />
                      <p className="text-base font-medium text-slate-600">Sin pacientes asignados</p>
                      <p className="text-sm mt-1">Este tutor no tiene menores vinculados.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="modal-action bg-slate-50 px-6 py-4 border-t border-slate-200 m-0 rounded-b-xl">
          <button
            type="button"
            className="btn btn-primary text-white px-8"
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>
      </div>
    </dialog>
  );
}
