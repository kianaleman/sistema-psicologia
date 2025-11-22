import { useEffect, useState } from 'react';
import type { Psicologo } from '../../types';

// Interfaces locales para props
interface Especialidad { ID_Especialidad: number; NombreEspecialidad: string; }
interface EstadoActividad { ID_EstadoDeActividad: number; NombreEstadoActividad: string; }

// Interfaz del psicólogo completo que recibimos para editar
interface PsicologoCompleto extends Psicologo {
  Psicologo_EspecialidadPsicologo?: { EspecialidadPsicologo: Especialidad }[];
  DireccionPsicologo?: { Departamento: string, Ciudad: string, Barrio: string, Calle: string };
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any, isEdit: boolean) => Promise<void>;
  psicologoEditar: PsicologoCompleto | null;
  catalogos: {
    especialidades: Especialidad[];
    estadosActividad: EstadoActividad[];
  };
}

const initialForm = {
  Nombre: '', Apellido: '', CodigoDeMinsa: '', No_Telefono: '', Email: '', ID_EstadoDeActividad: 1,
  direccion: { Departamento: '', Ciudad: '', Barrio: '', Calle: '' },
};

export default function PsicologoFormModal({ isOpen, onClose, onSubmit, psicologoEditar, catalogos }: Props) {
  const [formData, setFormData] = useState(initialForm);
  const [selectedEspecialidades, setSelectedEspecialidades] = useState<Set<number>>(new Set());

  // Cargar datos al abrir en modo edición
  useEffect(() => {
    if (psicologoEditar) {
      setFormData({
        Nombre: psicologoEditar.Nombre,
        Apellido: psicologoEditar.Apellido,
        CodigoDeMinsa: psicologoEditar.CodigoDeMinsa,
        No_Telefono: psicologoEditar.No_Telefono,
        Email: psicologoEditar.Email,
        ID_EstadoDeActividad: psicologoEditar.EstadoDeActividad?.ID_EstadoDeActividad || 1,
        direccion: psicologoEditar.DireccionPsicologo || initialForm.direccion
      });
      
      // Cargar especialidades
      const espIds = psicologoEditar.Psicologo_EspecialidadPsicologo?.map(e => e.EspecialidadPsicologo.ID_Especialidad) || [];
      setSelectedEspecialidades(new Set(espIds));
    } else {
      setFormData(initialForm);
      setSelectedEspecialidades(new Set());
    }
  }, [psicologoEditar, isOpen]);

  const handleSpecialtyChange = (id: number) => {
    setSelectedEspecialidades(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
      return newSet;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData, especialidadIds: Array.from(selectedEspecialidades) };
    onSubmit(payload, !!psicologoEditar);
  };

  if (!isOpen) return null;

  return (
    <dialog className="modal modal-open bg-black/50 backdrop-blur-sm">
      <div className="modal-box w-11/12 max-w-4xl bg-white p-0 rounded-2xl shadow-xl">
        
        {/* ENCABEZADO */}
        <div className="bg-blue-600 px-8 py-4 flex justify-between items-center">
          <h3 className="font-bold text-lg text-white flex items-center gap-2">
             {psicologoEditar ? '✏️ Editar Psicólogo' : '👨‍⚕️ Registrar Nuevo Psicólogo'}
          </h3>
          <button type="button" className="btn btn-sm btn-circle btn-ghost text-white" onClick={onClose}>✕</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
            
            {/* Sección 1: Datos Personales */}
            <div>
              <label className="label-text font-bold text-slate-500 uppercase text-xs">Datos Personales</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <input required type="text" placeholder="Nombre" className="input input-bordered bg-white" value={formData.Nombre} onChange={e => setFormData({...formData, Nombre: e.target.value})} />
                <input required type="text" placeholder="Apellido" className="input input-bordered bg-white" value={formData.Apellido} onChange={e => setFormData({...formData, Apellido: e.target.value})} />
                <input required type="text" placeholder="Código MINSA" className="input input-bordered bg-white" value={formData.CodigoDeMinsa} onChange={e => setFormData({...formData, CodigoDeMinsa: e.target.value})} />
                <input required type="text" placeholder="No. Teléfono" className="input input-bordered bg-white" value={formData.No_Telefono} onChange={e => setFormData({...formData, No_Telefono: e.target.value})} />
                <input required type="email" placeholder="Email" className="input input-bordered bg-white md:col-span-2" value={formData.Email} onChange={e => setFormData({...formData, Email: e.target.value})} />
                
                <div className="form-control md:col-span-2">
                   <label className="label pt-0"><span className="label-text-alt text-slate-400">Estado</span></label>
                   <select className="select select-bordered bg-white w-full" value={formData.ID_EstadoDeActividad} onChange={e => setFormData({...formData, ID_EstadoDeActividad: parseInt(e.target.value)})}>
                     {catalogos.estadosActividad.map(est => (
                       <option key={est.ID_EstadoDeActividad} value={est.ID_EstadoDeActividad}>{est.NombreEstadoActividad}</option>
                     ))}
                   </select>
                </div>
              </div>
            </div>

            {/* Sección 2: Dirección */}
            <div>
              <label className="label-text font-bold text-slate-500 uppercase text-xs">Dirección</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <input required type="text" placeholder="Departamento" className="input input-bordered bg-white" value={formData.direccion.Departamento} onChange={e => setFormData({...formData, direccion: {...formData.direccion, Departamento: e.target.value}})} />
                <input required type="text" placeholder="Ciudad" className="input input-bordered bg-white" value={formData.direccion.Ciudad} onChange={e => setFormData({...formData, direccion: {...formData.direccion, Ciudad: e.target.value}})} />
                <input required type="text" placeholder="Barrio" className="input input-bordered bg-white" value={formData.direccion.Barrio} onChange={e => setFormData({...formData, direccion: {...formData.direccion, Barrio: e.target.value}})} />
                <input required type="text" placeholder="Calle" className="input input-bordered bg-white" value={formData.direccion.Calle} onChange={e => setFormData({...formData, direccion: {...formData.direccion, Calle: e.target.value}})} />
              </div>
            </div>

            {/* Sección 3: Especialidades */}
            <div>
              <label className="label-text font-bold text-slate-500 uppercase text-xs">Especialidades</label>
              <div className="p-4 mt-2 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap gap-2">
                {catalogos.especialidades.map(esp => (
                  <button 
                    type="button"
                    key={esp.ID_Especialidad}
                    onClick={() => handleSpecialtyChange(esp.ID_Especialidad)}
                    className={`btn btn-sm rounded-full font-medium transition-all border
                      ${selectedEspecialidades.has(esp.ID_Especialidad) 
                        ? 'btn-primary text-white shadow-md' 
                        : 'btn-ghost bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                  >
                    {selectedEspecialidades.has(esp.ID_Especialidad) && '✓ '}
                    {esp.NombreEspecialidad}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="modal-action bg-slate-50 px-8 py-4 border-t border-slate-200 m-0 rounded-b-2xl">
            <button type="button" className="btn btn-ghost hover:bg-slate-100" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary text-white px-6">
              {psicologoEditar ? 'Guardar Cambios' : 'Registrar Psicólogo'}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}