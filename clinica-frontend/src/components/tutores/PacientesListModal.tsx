import type { TutorCompleto } from '../../hooks/useTutores';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  tutor: TutorCompleto | null;
}

export default function PacientesListModal({ isOpen, onClose, tutor }: Props) {
  if (!isOpen || !tutor) return null;

  return (
    <dialog className="modal modal-open backdrop-blur-sm">
      <div className="modal-box bg-white rounded-xl border border-slate-100 shadow-2xl p-0">
        
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-lg text-slate-800">Pacientes a cargo</h3>
            <p className="text-sm text-slate-500">Tutor: {tutor.Nombre} {tutor.Apellido}</p>
          </div>
          <button className="btn btn-sm btn-circle btn-ghost" onClick={onClose}>✕</button>
        </div>
        
        <div className="p-0 overflow-x-auto">
          <table className="table w-full">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
              <tr>
                <th className="pl-6 py-4">Nombre del Paciente</th>
                <th>Partida de Nacimiento</th>
                <th className="pr-6">Grado Escolar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tutor.PacienteMenor?.map((pm: any) => (
                <tr key={pm.PartNacimiento} className="hover:bg-blue-50 transition-colors">
                  <td className="pl-6 py-3">
                    <div className="font-bold text-slate-700">{pm.Paciente.Nombre} {pm.Paciente.Apellido}</div>
                  </td>
                  <td className="py-3">
                    <span className="badge badge-outline badge-primary font-mono text-xs">
                      {pm.PartNacimiento}
                    </span>
                  </td>
                  <td className="pr-6 py-3">
                    <span className="text-sm text-slate-600">{pm.GradoEscolar}</span>
                  </td>
                </tr>
              ))}
              {(!tutor.PacienteMenor || tutor.PacienteMenor.length === 0) && (
                 <tr><td colSpan={3} className="text-center py-4 text-slate-400">Sin pacientes asignados.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="modal-action bg-slate-50 px-6 py-4 border-t border-slate-200 m-0 rounded-b-xl">
          <button className="btn btn-primary text-white px-8" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </dialog>
  );
}