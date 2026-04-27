import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom'; // 🟢 Importación para el Portal
import { toast } from 'sonner';
import type { PsicologoCompleto } from '../../hooks/usePsicologos';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any, isEdit: boolean) => Promise<void>;
    psicologoEditar: PsicologoCompleto | null;
    catalogos: any;
}

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
    nombre: '', apellido: '', codigoMinsa: '', telefono: '', 
    email: '', 
    activo: true,
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
                 codigoMinsa: psicologoEditar.CodigoMinsa,
                 telefono: psicologoEditar.No_Telefono,
                 // 🟢 CORRECCIÓN: Se asegura el acceso al Email del Usuario vinculado
                 email: psicologoEditar.Usuario?.Email || '', 
                 activo: psicologoEditar.Activo ?? true,
                 direccion: {
                     departamento: psicologoEditar.Direccion?.Departamento || '',
                     ciudad: psicologoEditar.Direccion?.Ciudad || '',
                     barrio: psicologoEditar.Direccion?.Barrio || '',
                     calle: psicologoEditar.Direccion?.Calle || ''
                 },
                 especialidadIds: psicologoEditar.Psicologo_EspecialidadPsicologo?.map((rel: any) => rel.ID_Especialidad.toString()) || []
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
            return toast.error('El teléfono debe ser de 8 dígitos (empezar con 2, 5, 7 u 8)');
        }
        if (!formData.email.includes('@')) {
            return toast.error('Debe ingresar un correo electrónico válido para la cuenta');
        }
        if (formData.especialidadIds.length === 0) {
            return toast.error('Debe seleccionar al menos una especialidad');
        }
        
        setGuardando(true);
        try {
            const payload = { 
                ...formData, 
                especialidadIds: formData.especialidadIds.map(Number),
                idRol: 2 
            };
            await onSubmit(payload, !!psicologoEditar);
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setGuardando(false);
        }
    };

    if (!isOpen) return null;

    const modalContent = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white w-full max-w-5xl rounded-[2.5rem] shadow-2xl flex flex-col max-h-[92vh] border border-slate-200 overflow-hidden animate-fade-in-up text-slate-800">
                
                <div className="bg-white px-10 py-7 border-b border-slate-100 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="font-serif text-2xl font-bold text-slate-900 tracking-tight">
                            {psicologoEditar ? '✏️ Editar Perfil Profesional' : '👤 Registrar Nuevo Psicólogo'}
                        </h2>
                        <p className="text-slate-500 text-xs mt-1 uppercase font-black tracking-widest opacity-70">
                            Gestión de credenciales y cuenta de acceso
                        </p>
                    </div>
                    <button type="button" className="btn btn-sm btn-circle btn-ghost text-slate-400" onClick={onClose} disabled={guardando}>✕</button>
                </div>
                
                <div className="overflow-y-auto flex-1 bg-slate-50/50 p-10">
                    <form id="psicologo-form" onSubmit={handleSubmit} className="space-y-8">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            
                            <div className="lg:col-span-7 space-y-6">
                                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2"><Icons.User /> Identidad Profesional</h4>
                                    <div className="grid grid-cols-2 gap-5">
                                        <div className="form-control">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 mb-2">Nombre</label>
                                            <input required placeholder="Juan" className="input input-bordered bg-slate-50 border-slate-200 focus:border-blue-500 rounded-xl" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
                                        </div>
                                        <div className="form-control">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 mb-2">Apellido</label>
                                            <input required placeholder="Pérez" className="input input-bordered bg-slate-50 border-slate-200 focus:border-blue-500 rounded-xl" value={formData.apellido} onChange={e => setFormData({...formData, apellido: e.target.value})} />
                                        </div>
                                    </div>
                                    <div className="mt-6">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 mb-2">Código MINSA</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><Icons.Hash /></div>
                                            <input required placeholder="Cód-0000" className="input input-bordered pl-10 w-full bg-slate-50 font-mono border-slate-200 rounded-xl" value={formData.codigoMinsa} onChange={e => setFormData({...formData, codigoMinsa: e.target.value})} />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2"><Icons.Mail /> Cuenta y Contacto</h4>
                                    <div className="space-y-5">
                                        <div className="form-control">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 mb-2">Correo Electrónico (Login)</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400"><Icons.Mail /></div>
                                                <input 
                                                    required 
                                                    type="email" 
                                                    placeholder="ejemplo@clinica.com" 
                                                    // 🟢 BLOQUEO DE SEGURIDAD EN EDICIÓN
                                                    disabled={!!psicologoEditar}
                                                    className={`input input-bordered pl-10 w-full bg-slate-50 border-slate-200 rounded-xl ${psicologoEditar ? 'opacity-60 cursor-not-allowed' : ''}`} 
                                                    value={formData.email} 
                                                    onChange={e => setFormData({...formData, email: e.target.value})} 
                                                />
                                            </div>
                                            {psicologoEditar && (
                                                <p className="text-[9px] text-amber-600 font-bold mt-1 ml-1 uppercase tracking-tighter">
                                                    ⚠️ El correo de acceso no puede modificarse desde este módulo
                                                </p>
                                            )}
                                        </div>
                                        <div className="form-control">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 mb-2">Teléfono Móvil</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400"><Icons.Phone /></div>
                                                <input required placeholder="88888888" className="input input-bordered pl-10 w-full bg-slate-50 font-mono border-slate-200 rounded-xl" value={formData.telefono} maxLength={8} onChange={e => setFormData({...formData, telefono: e.target.value})} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="lg:col-span-5 space-y-6">
                                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2"><Icons.MapPin /> Ubicación</h4>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-3">
                                            <input placeholder="Departamento" className="input input-sm input-bordered bg-slate-50 border-slate-200 rounded-lg" value={formData.direccion.departamento} onChange={e => setFormData({...formData, direccion: {...formData.direccion, departamento: e.target.value}})} />
                                            <input placeholder="Ciudad" className="input input-sm input-bordered bg-slate-50 border-slate-200 rounded-lg" value={formData.direccion.ciudad} onChange={e => setFormData({...formData, direccion: {...formData.direccion, ciudad: e.target.value}})} />
                                        </div>
                                        <input placeholder="Barrio" className="input input-sm input-bordered w-full bg-slate-50 border-slate-200 rounded-lg" value={formData.direccion.barrio} onChange={e => setFormData({...formData, direccion: {...formData.direccion, barrio: e.target.value}})} />
                                        <textarea placeholder="Referencia exacta" className="textarea textarea-bordered bg-slate-50 w-full h-24 resize-none text-sm border-slate-200 rounded-xl" value={formData.direccion.calle} onChange={e => setFormData({...formData, direccion: {...formData.direccion, calle: e.target.value}})} />
                                    </div>
                                </div>

                                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2"><Icons.Award /> Especialidades</h4>
                                    
                                    {psicologoEditar && (
                                        <div className="mb-5">
                                            <select className={`select select-sm w-full font-bold rounded-lg ${formData.activo ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`} value={formData.activo ? 1 : 2} onChange={e => setFormData({...formData, activo: e.target.value === '1'})}>
                                                <option value={1}>🟢 Activo</option>
                                                <option value={2}>🔴 Inactivo</option>
                                            </select>
                                        </div>
                                    )}

                                    <div className="flex flex-wrap gap-2">
                                        {catalogos.especialidades?.map((esp: any) => {
                                            const idEsp = esp.ID_Especialidad.toString();
                                            const isSelected = formData.especialidadIds.includes(idEsp);
                                            return (
                                                <button key={idEsp} type="button" onClick={() => handleEspecialidadChange(idEsp)}
                                                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-bold border transition-all ${isSelected ? 'bg-slate-800 text-white border-slate-800 shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>
                                                    {isSelected && <Icons.Check />}
                                                    {esp.Nombre_Especialidad}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                <div className="bg-white px-10 py-7 border-t border-slate-100 flex justify-end gap-4 shrink-0">
                    <button type="button" className="btn btn-ghost px-8 font-bold text-slate-400" onClick={onClose} disabled={guardando}>Cancelar</button>
                    <button type="submit" form="psicologo-form" className="btn bg-slate-900 hover:bg-slate-800 text-white px-12 rounded-2xl font-bold shadow-xl shadow-slate-200 transition-all" disabled={guardando}>
                        {guardando ? <span className="loading loading-spinner loading-xs"></span> : 'Guardar Perfil Profesional'}
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.getElementById("modal-root")!);
}