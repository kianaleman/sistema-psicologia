import { createPortal } from 'react-dom';
import { toast } from 'sonner';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formData: any;
  setFormData: (data: any) => void;
  catalogos: any;
}

const formatearCedula = (valor: string) => {
    let v = valor.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (v.length > 14) v = v.slice(0, 14);
    if (v.length > 9) return `${v.slice(0, 3)}-${v.slice(3, 9)}-${v.slice(9)}`;
    else if (v.length > 3) return `${v.slice(0, 3)}-${v.slice(3)}`;
    return v;
};

const esCedulaValida = (cedula: string) => /^\d{3}-\d{6}-\d{4}[A-Z]$/.test(cedula);
const esTelefonoValido = (tel: string) => /^[2578]\d{7}$/.test(tel.replace(/[\s-]/g, ''));

export default function TutorFormModal({ isOpen, onClose, onSubmit, formData, setFormData, catalogos }: Props) {
  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!esCedulaValida(formData.No_Cedula)) {
        return toast.error('Formato de cédula inválido (XXX-XXXXXX-XXXXL)');
    }
    if (!esTelefonoValido(formData.No_Telefono)) {
        return toast.error('Teléfono inválido (8 dígitos, inicia con 2, 5, 7 u 8)');
    }
    onSubmit(e);
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[92vh] border border-slate-200 overflow-hidden animate-fade-in-up">
        
        <div className="bg-slate-800 text-white px-8 py-5 border-b border-slate-700 flex justify-between items-center shrink-0">
            <h3 className="font-bold text-xl font-serif">Editar Información del Tutor</h3>
            <button className="btn btn-sm btn-circle btn-ghost text-slate-300" onClick={onClose}>✕</button>
        </div>

        <div className="overflow-y-auto flex-1 bg-slate-50 p-8 custom-scrollbar">
          <form id="edit-tutor-form" onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Datos del Responsable</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="form-control">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 mb-2">Nombre</label>
                  <input type="text" required className="input input-bordered bg-white border-slate-200 focus:border-blue-500 rounded-xl" value={formData.Nombre} onChange={e => setFormData({...formData, Nombre: e.target.value})} />
                </div>
                <div className="form-control">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 mb-2">Apellido</label>
                  <input type="text" required className="input input-bordered bg-white border-slate-200 focus:border-blue-500 rounded-xl" value={formData.Apellido} onChange={e => setFormData({...formData, Apellido: e.target.value})} />
                </div>
                <div className="form-control">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 mb-2">Cédula</label>
                  <input type="text" required className="input input-bordered bg-white font-mono border-slate-200 focus:border-blue-500 rounded-xl" value={formData.No_Cedula} maxLength={16} onChange={e => setFormData({...formData, No_Cedula: formatearCedula(e.target.value)})} />
                </div>
                <div className="form-control">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 mb-2">Teléfono</label>
                  <input type="text" required className="input input-bordered bg-white font-mono border-slate-200 focus:border-blue-500 rounded-xl" value={formData.No_Telefono} onChange={e => setFormData({...formData, No_Telefono: e.target.value})} maxLength={8} />
                </div>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Información Civil y Laboral</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="form-control">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 mb-2">Ocupación</label>
                    <select required className="select select-bordered bg-white border-slate-200 focus:border-blue-500 rounded-xl" value={formData.ID_Ocupacion} onChange={e => setFormData({...formData, ID_Ocupacion: parseInt(e.target.value)})}>
                        <option value="">Seleccionar...</option>
                        {catalogos.ocupaciones?.map((o:any) => <option key={o.ID_Ocupacion} value={o.ID_Ocupacion}>{o.Nombre_DeOcupacion}</option>)}
                    </select>
                </div>
                <div className="form-control">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 mb-2">Estado Civil</label>
                    <select required className="select select-bordered bg-white border-slate-200 focus:border-blue-500 rounded-xl" value={formData.ID_EstadoCivil} onChange={e => setFormData({...formData, ID_EstadoCivil: parseInt(e.target.value)})}>
                        <option value="">Seleccionar...</option>
                        {catalogos.estadosCiviles?.map((ec:any) => <option key={ec.ID_EstadoCivil} value={ec.ID_EstadoCivil}>{ec.Nombre_EstadoCivil}</option>)}
                    </select>
                </div>
              </div>
            </div>
          </form>
        </div>
        
        <div className="bg-white px-8 py-5 border-t border-slate-100 flex justify-end gap-3 shrink-0">
          <button type="button" className="btn btn-ghost px-8 font-bold text-slate-400" onClick={onClose}>Cancelar</button>
          <button type="submit" form="edit-tutor-form" className="btn bg-slate-900 hover:bg-slate-800 text-white px-10 rounded-xl font-bold shadow-lg transition-all">
            Actualizar Tutor
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.getElementById('modal-root')!);
}