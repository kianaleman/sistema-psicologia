import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { PsicologoCompleto } from '../../hooks/usePsicologos';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any, isEdit: boolean) => Promise<void>;
  psicologoEditar: PsicologoCompleto | null;
  catalogos: any;
}

// --- ICONOS SVG MINIMALISTAS ---
const Icons = {
    User: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>,
    Hash: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><line x1="4" y1="9" x2="20" y2="9"></line><line x1="4" y1="15" x2="20" y2="15"></line><line x1="10" y1="3" x2="8" y2="21"></line><line x1="16" y1="3" x2="14" y2="21"></line></svg>,
    Phone: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>,
    Mail: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>,
    MapPin: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>,
    Award: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>,
    Check: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><polyline points="20 6 9 17 4 12"></polyline></svg>
};

const initialForm = {
    nombre: '', apellido: '', codigoMinsa: '', telefono: '', email: '',
    ID_EstadoDeActividad: 1,
    direccion: { departamento: '', ciudad: '', barrio: '', calle: '' },
    especialidadIds: [] as string[]
};

const esTelefonoValido = (tel: string) => /^[2578]\d{7}$/.test(tel.replace(/[\s-]/g, ''));

export default function PsicologoFormModal({ isOpen, onClose, onSubmit, psicologoEditar, catalogos }: Props) {
    const [formData, setFormData] = useState(initialForm);
    const [guardando, setGuardando] = useState(false);

    useEffect(() => {
        if (psicologoEditar) {
             setFormData({
                 nombre: psicologoEditar.Nombre,
                 apellido: psicologoEditar.Apellido,
                 codigoMinsa: psicologoEditar.CodigoDeMinsa,
                 telefono: psicologoEditar.No_Telefono,
                 email: psicologoEditar.Email,
                 ID_EstadoDeActividad: psicologoEditar.ID_EstadoDeActividad || 1,
                 direccion: {
                     departamento: psicologoEditar.DireccionPsicologo?.Departamento || '',
                     ciudad: psicologoEditar.DireccionPsicologo?.Ciudad || '',
                     barrio: psicologoEditar.DireccionPsicologo?.Barrio || '',
                     calle: psicologoEditar.DireccionPsicologo?.Calle || ''
                 },
                 especialidadIds: psicologoEditar.Psicologo_EspecialidadPsicologo.map(e => e.ID_Especialidad.toString())
             });
        } else {
            setFormData(initialForm);
        }
    }, [psicologoEditar, isOpen]);

    const handleEspecialidadChange = (id: string) => {
        setFormData(prev => {
            const exists = prev.especialidadIds.includes(id);
            return {
                ...prev,
                especialidadIds: exists 
                  ? prev.especialidadIds.filter(e => e !== id)
                  : [...prev.especialidadIds, id]
            };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!esTelefonoValido(formData.telefono)) {
            return toast.error('Formato de teléfono incorrecto (8 dígitos)');
        }
        
        setGuardando(true);
        await onSubmit(formData, !!psicologoEditar);
        setGuardando(false);
    };

    if (!isOpen) return null;

    return (
        <dialog className="modal modal-open bg-slate-900/40 backdrop-blur-sm transition-all duration-300">
            <div className="modal-box w-11/12 max-w-5xl bg-white p-0 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                
                {/* --- HEADER ELEGANTE --- */}
                <div className="bg-white px-8 py-6 border-b border-slate-100 flex justify-between items-center sticky top-0 z-10">
                    <div>
                        <h2 className="font-serif text-2xl font-bold text-slate-900 tracking-tight">
                            {psicologoEditar ? 'Editar Perfil Profesional' : 'Registrar Nuevo Psicólogo'}
                        </h2>
                        <p className="text-slate-500 text-sm mt-1">Gestión de credenciales y asignación de especialidades.</p>
                    </div>
                    <button 
                        type="button" 
                        className="btn btn-sm btn-circle btn-ghost text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors" 
                        onClick={onClose} 
                        disabled={guardando}
                    >✕</button>
                </div>
                
                <div className="overflow-y-auto flex-1 bg-[#FAFAFA]">
                    <form onSubmit={handleSubmit} className="p-8 space-y-8">
                        
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            
                            {/* --- COLUMNA IZQUIERDA (Datos Personales y Contacto) --- */}
                            <div className="lg:col-span-7 space-y-6">
                                
                                {/* TARJETA 1: IDENTIDAD */}
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <Icons.User /> Identidad
                                    </h4>
                                    <div className="grid grid-cols-2 gap-5">
                                        <div className="form-control">
                                            <label className="label pb-1"><span className="label-text font-medium text-slate-600">Nombre</span></label>
                                            <input required type="text" placeholder="Ej. Juan" className="input input-bordered bg-slate-50 border-slate-200 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
                                        </div>
                                        <div className="form-control">
                                            <label className="label pb-1"><span className="label-text font-medium text-slate-600">Apellido</span></label>
                                            <input required type="text" placeholder="Ej. Pérez" className="input input-bordered bg-slate-50 border-slate-200 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all" value={formData.apellido} onChange={e => setFormData({...formData, apellido: e.target.value})} />
                                        </div>
                                    </div>
                                    <div className="mt-5">
                                        <label className="label pb-1"><span className="label-text font-medium text-slate-600">Código MINSA</span></label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><Icons.Hash /></div>
                                            <input required type="text" placeholder="MINSA-0000" className="input input-bordered pl-10 w-full bg-slate-50 border-slate-200 focus:border-blue-500 focus:bg-white font-mono tracking-wide" value={formData.codigoMinsa} onChange={e => setFormData({...formData, codigoMinsa: e.target.value})} />
                                        </div>
                                    </div>
                                </div>

                                {/* TARJETA 2: CONTACTO */}
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <Icons.Phone /> Contacto
                                    </h4>
                                    <div className="space-y-4">
                                        <div className="form-control">
                                            <label className="label pb-1"><span className="label-text font-medium text-slate-600">Teléfono Móvil</span></label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><Icons.Phone /></div>
                                                <input required type="text" placeholder="88888888" className="input input-bordered pl-10 w-full bg-slate-50 border-slate-200 focus:border-blue-500 focus:bg-white font-mono" value={formData.telefono} maxLength={8} onChange={e => setFormData({...formData, telefono: e.target.value})} />
                                            </div>
                                        </div>
                                        <div className="form-control">
                                            <label className="label pb-1"><span className="label-text font-medium text-slate-600">Correo Electrónico</span></label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><Icons.Mail /></div>
                                                <input required type="email" placeholder="doctor@clinica.com" className="input input-bordered pl-10 w-full bg-slate-50 border-slate-200 focus:border-blue-500 focus:bg-white" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* --- COLUMNA DERECHA (Ubicación y Especialidades) --- */}
                            <div className="lg:col-span-5 space-y-6">
                                
                                {/* TARJETA 3: UBICACIÓN */}
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <Icons.MapPin /> Ubicación
                                    </h4>
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            <input type="text" placeholder="Departamento" className="input input-sm input-bordered bg-slate-50" value={formData.direccion.departamento} onChange={e => setFormData({...formData, direccion: {...formData.direccion, departamento: e.target.value}})} />
                                            <input type="text" placeholder="Ciudad" className="input input-sm input-bordered bg-slate-50" value={formData.direccion.ciudad} onChange={e => setFormData({...formData, direccion: {...formData.direccion, ciudad: e.target.value}})} />
                                        </div>
                                        <input type="text" placeholder="Barrio / Residencial" className="input input-sm input-bordered w-full bg-slate-50" value={formData.direccion.barrio} onChange={e => setFormData({...formData, direccion: {...formData.direccion, barrio: e.target.value}})} />
                                        <textarea placeholder="Dirección exacta (Calle, Casa, Referencia)" className="textarea textarea-bordered bg-slate-50 w-full h-20 resize-none text-sm" value={formData.direccion.calle} onChange={e => setFormData({...formData, direccion: {...formData.direccion, calle: e.target.value}})}></textarea>
                                    </div>
                                </div>

                                {/* TARJETA 4: ESPECIALIDADES (Chips Interactivos) */}
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <Icons.Award /> Especialidades
                                    </h4>
                                    
                                    {psicologoEditar && (
                                        <div className="mb-4">
                                            <select className={`select select-sm w-full font-bold ${formData.ID_EstadoDeActividad === 1 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`} value={formData.ID_EstadoDeActividad} onChange={e => setFormData({...formData, ID_EstadoDeActividad: parseInt(e.target.value)})}>
                                                <option value={1}>🟢 Profesional Activo</option>
                                                <option value={2}>🔴 Profesional Inactivo</option>
                                            </select>
                                        </div>
                                    )}

                                    <div className="flex flex-wrap gap-2">
                                        {catalogos.especialidades?.map((esp: any) => {
                                            const isSelected = formData.especialidadIds.includes(esp.ID_Especialidad.toString());
                                            return (
                                                <button
                                                    key={esp.ID_Especialidad}
                                                    type="button"
                                                    onClick={() => handleEspecialidadChange(esp.ID_Especialidad.toString())}
                                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border
                                                        ${isSelected 
                                                            ? 'bg-slate-800 text-white border-slate-800 shadow-md transform scale-105' 
                                                            : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400 hover:bg-slate-50'
                                                        }`}
                                                >
                                                    {isSelected && <Icons.Check />}
                                                    {esp.NombreEspecialidad}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                        </div>
                    </form>
                </div>

                {/* FOOTER */}
                <div className="bg-white p-6 border-t border-slate-100 flex justify-end gap-4 sticky bottom-0 z-10">
                    <button 
                        type="button" 
                        className="btn btn-ghost text-slate-500 hover:bg-slate-50 font-normal" 
                        onClick={onClose} 
                        disabled={guardando}
                    >
                        Cancelar
                    </button>
                    <button 
                        type="button" // Cambiado a type button y onClick en el form trigger o form submit
                        onClick={(e) => handleSubmit(e as any)}
                        className="btn bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/20 px-8 rounded-xl font-medium tracking-wide transition-all hover:scale-105 active:scale-95" 
                        disabled={guardando}
                    >
                        {guardando ? <span className="loading loading-spinner loading-sm"></span> : 'Guardar Profesional'}
                    </button>
                </div>
            </div>
        </dialog>
    );
}