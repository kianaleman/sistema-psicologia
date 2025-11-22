import { toast } from 'sonner';
import type { TutorCompleto } from '../../hooks/useTutores';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formData: any;
  setFormData: (data: any) => void;
  catalogos: any;
}

// Reutilizamos la lógica del formatter
const formatearCedula = (valor: string) => {
    let v = valor.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (v.length > 14) v = v.slice(0, 14);
    if (v.length > 9) return `${v.slice(0, 3)}-${v.slice(3, 9)}-${v.slice(9)}`;
    else if (v.length > 3) return `${v.slice(0, 3)}-${v.slice(3)}`;
    return v;
};

const esCedulaValida = (cedula: string) => /^\d{3}-\d{6}-\d{4}[A-Z]$/.test(cedula);

export default function TutorFormModal({ isOpen, onClose, onSubmit, formData, setFormData, catalogos }: Props) {
  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!esCedulaValida(formData.No_Cedula)) {
        toast.error('Formato de cédula inválido (XXX-XXXXXX-XXXXL)');
        return;
    }
    onSubmit(e);
  };

  return (
    <dialog className="modal modal-open backdrop-blur-sm">
      <div className="modal-box w-11/12 max-w-3xl bg-white p-0 rounded-2xl shadow-xl">
        
        <div className="bg-slate-50 px-8 py-4 border-b border-slate-200 flex justify-between items-center">
            <h3 className="font-bold text-lg text-slate-800">Editar Información del Tutor</h3>
            <button className="btn btn-sm btn-circle btn-ghost" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto text-slate-700">
            
            {/* Sección 1 */}
            <div>
              <label className="label-text font-bold text-slate-500 uppercase text-xs">Datos Personales</label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="form-control">
                  <label className="label pt-0"><span className="label-text-alt">Nombre</span></label>
                  <input type="text" className="input input-bordered bg-white" value={formData.Nombre} onChange={e => setFormData({...formData, Nombre: e.target.value})} />
                </div>
                <div className="form-control">
                  <label className="label pt-0"><span className="label-text-alt">Apellido</span></label>
                  <input type="text" className="input input-bordered bg-white" value={formData.Apellido} onChange={e => setFormData({...formData, Apellido: e.target.value})} />
                </div>
                <div className="form-control">
                  <label className="label pt-0"><span className="label-text-alt">Cédula</span></label>
                  <input 
                    type="text" 
                    className="input input-bordered bg-white font-mono" 
                    value={formData.No_Cedula} 
                    maxLength={16}
                    onChange={e => setFormData({...formData, No_Cedula: formatearCedula(e.target.value)})} 
                  />
                </div>
                <div className="form-control">
                  <label className="label pt-0"><span className="label-text-alt">Teléfono</span></label>
                  <input type="text" className="input input-bordered bg-white" value={formData.No_Telefono} onChange={e => setFormData({...formData, No_Telefono: e.target.value})} />
                </div>
              </div>
            </div>

            {/* Sección 2 */}
            <div>
              <label className="label-text font-bold text-slate-500 uppercase text-xs">Información Adicional</label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="form-control">
                  <label className="label pt-0"><span className="label-text-alt">Parentesco</span></label>
                  <select className="select select-bordered bg-white" value={formData.ID_Parentesco} onChange={e => setFormData({...formData, ID_Parentesco: e.target.value})}>
                    <option value="">Seleccionar...</option>{catalogos.parentescos.map((p:any) => <option key={p.ID_Parentesco} value={p.ID_Parentesco}>{p.NombreDeParentesco}</option>)}
                  </select>
                </div>
                <div className="form-control">
                  <label className="label pt-0"><span className="label-text-alt">Ocupación</span></label>
                  <select className="select select-bordered bg-white" value={formData.ID_Ocupacion} onChange={e => setFormData({...formData, ID_Ocupacion: e.target.value})}>
                    <option value="">Seleccionar...</option>{catalogos.ocupaciones.map((o:any) => <option key={o.ID_Ocupacion} value={o.ID_Ocupacion}>{o.NombreDeOcupacion}</option>)}
                  </select>
                </div>
                <div className="form-control col-span-2">
                  <label className="label pt-0"><span className="label-text-alt">Estado Civil</span></label>
                  <select className="select select-bordered bg-white w-full" value={formData.ID_EstadoCivil} onChange={e => setFormData({...formData, ID_EstadoCivil: e.target.value})}>
                    <option value="">Seleccionar...</option>{catalogos.estadosCiviles.map((ec:any) => <option key={ec.ID_EstadoCivil} value={ec.ID_EstadoCivil}>{ec.NombreEstadoCivil}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Sección 3 */}
            <div>
              <label className="label-text font-bold text-slate-500 uppercase text-xs">Dirección del Tutor</label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <input type="text" placeholder="Departamento" className="input input-bordered bg-white" value={formData.DireccionTutor.Departamento} onChange={e => setFormData({...formData, DireccionTutor: {...formData.DireccionTutor, Departamento: e.target.value}})} />
                <input type="text" placeholder="Ciudad" className="input input-bordered bg-white" value={formData.DireccionTutor.Ciudad} onChange={e => setFormData({...formData, DireccionTutor: {...formData.DireccionTutor, Ciudad: e.target.value}})} />
                <input type="text" placeholder="Barrio" className="input input-bordered bg-white" value={formData.DireccionTutor.Barrio} onChange={e => setFormData({...formData, DireccionTutor: {...formData.DireccionTutor, Barrio: e.target.value}})} />
                <input type="text" placeholder="Calle" className="input input-bordered bg-white" value={formData.DireccionTutor.Calle} onChange={e => setFormData({...formData, DireccionTutor: {...formData.DireccionTutor, Calle: e.target.value}})} />
              </div>
            </div>
          </div>
          
          <div className="modal-action bg-slate-50 px-8 py-4 border-t border-slate-200 rounded-b-2xl">
            <button type="button" className="btn btn-ghost hover:bg-slate-100" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary text-white">Actualizar Tutor</button>
          </div>
        </form>
      </div>
    </dialog>
  );
}