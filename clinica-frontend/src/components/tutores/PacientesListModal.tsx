import { createPortal } from 'react-dom';
import type { TutorCompleto } from '../../hooks/useTutores';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  tutor: TutorCompleto | null;
}

export default function PacientesListModal({ isOpen, onClose, tutor }: Props) {
  if (!isOpen || !tutor) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] border border-slate-200 overflow-hidden animate-fade-in-up">
        
        {/* Encabezado */}
        <div className="bg-slate-50 px-8 py-5 border-b border-slate-200 flex justify-between items-center shrink-0">
          <div>
            <h3 className="font-bold text-xl text-slate-800">Pacientes a cargo</h3>
            <p className="text-sm text-slate-500">Tutor: {tutor.Nombre} {tutor.Apellido}</p>
          </div>
          <button className="btn btn-sm btn-circle btn-ghost text-slate-400" onClick={onClose}>✕</button>
        </div>
        
        {/* Cuerpo de la tabla */}
        <div className="overflow-x-auto flex-1 bg-white">
          <table className="table w-full">
            <thead className="bg-slate-50 text-slate-500 font-black uppercase text-[10px] tracking-widest sticky top-0 z-10">
              <tr>
                <th className="pl-8 py-4">Nombre del Paciente</th>
                <th>Parentesco</th>
                <th>Partida de Nacimiento</th>
                <th className="pr-8">Grado Escolar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tutor.Tutor_PacienteMenor?.map((relacion) => (
                <tr key={relacion.Paciente_Menor.PartidaDeNacimiento} className="hover:bg-blue-50/50 transition-colors">
                  <td className="pl-8 py-4">
                    <div className="font-bold text-slate-700 text-sm">
                      {relacion.Paciente_Menor.Paciente.Nombre} {relacion.Paciente_Menor.Paciente.Apellido}
                    </div>
                  </td>
                  <td className="py-4">
                    {/* 🟢 CORRECCIÓN: Tamaño aumentado a text-sm y fuente medium para igualar al grado escolar */}
                    <span className="text-sm text-slate-600 font-medium">
                      {relacion.Parentesco.Nombre_De_Parentesco}
                    </span>
                  </td>
                  <td className="py-4">
                    <span className="badge badge-outline badge-primary font-mono text-[10px] px-2 py-3">
                      {relacion.Paciente_Menor.PartidaDeNacimiento}
                    </span>
                  </td>
                  <td className="pr-8 py-4">
                    <span className="text-sm text-slate-600 font-medium">
                      {relacion.Paciente_Menor.Grado_Escolar}
                    </span>
                  </td>
                </tr>
              ))}
              
              {(!tutor.Tutor_PacienteMenor || tutor.Tutor_PacienteMenor.length === 0) && (
                 <tr>
                    <td colSpan={4} className="text-center py-12 text-slate-400">
                        <p className="italic text-sm">Este tutor no tiene pacientes menores asignados en el sistema.</p>
                    </td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pie de modal */}
        <div className="bg-slate-50 px-8 py-5 border-t border-slate-200 flex justify-end shrink-0">
          <button className="btn bg-slate-900 hover:bg-slate-800 text-white px-10 rounded-xl font-bold transition-all shadow-lg shadow-slate-200" onClick={onClose}>
            Cerrar Lista
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.getElementById('modal-root')!);
}