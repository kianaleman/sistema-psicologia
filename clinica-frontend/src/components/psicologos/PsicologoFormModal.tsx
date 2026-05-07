import { useEffect, useState, useMemo } from 'react';
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

// 🟢 DATA ESTRUCTURADA DE NICARAGUA
const DIVISION_TERRITORIAL: Record<string, string[]> = {
    "Boaco": ["Boaco", "Camoapa", "San José de los Remates", "San Lorenzo", "Santa Lucía", "Teustepe"],
    "Carazo": ["Diriamba", "Dolores", "El Rosario", "Jinotepe", "La Conquista", "La Paz de Carazo", "San Marcos", "Santa Teresa"],
    "Chinandega": ["Chichigalpa", "Chinandega", "Cinco Pinos", "Corinto", "El Realejo", "El Viejo", "Posoltega", "Puerto Morazán", "San Francisco del Norte", "San Pedro del Norte", "Santo Tomás del Norte", "Somotillo", "Villanueva"],
    "Chontales": ["Acoyapa", "Comalapa", "Cuapa", "El Coral", "Juigalpa", "La Libertad", "San Francisco de Cuapa", "San Pedro de Lóvago", "Santo Domingo", "Santo Tomás", "Villa Sandino"],
    "Estelí": ["Condega", "Estelí", "La Trinidad", "Pueblo Nuevo", "San Juan de Limay", "San Nicolás"],
    "Granada": ["Diriá", "Diriomo", "Granada", "Nandaime"],
    "Jinotega": ["El Cuá", "Jinotega", "La Concordia", "San José de Bocay", "San Rafael del Norte", "San Sebastián de Yalí", "Santa María de Pantasma", "Wiwilí de Jinotega"],
    "León": ["Achuapa", "El Jicaral", "El Sauce", "La Paz Centro", "Larreynaga", "León", "Nagarote", "Quezalguaque", "Santa Rosa del Peñón", "Telica"],
    "Madriz": ["Las Sabanas", "Palacagüina", "San José de Cusmapa", "San Juan de Río Coco", "San Lucas", "Somoto", "Telpaneca", "Totogalpa"],
    "Managua": ["Ciudad Sandino", "El Crucero", "Managua", "Mateare", "San Francisco Libre", "San Rafael del Sur", "Ticuantepe", "Tipitapa", "Villa El Carmen"],
    "Masaya": ["Catarina", "La Concepción", "Masatepe", "Masaya", "Nandasmo", "Nindirí", "Niquinohomo", "San Juan de Oriente", "Tisma"],
    "Matagalpa": ["Ciudad Darío", "El Tuma - La Dalia", "Esquipulas", "Matagalpa", "Matiguás", "Muy Muy", "Rancho Grande", "Río Blanco", "San Dionisio", "San Isidro", "San Ramón", "Sébaco", "Terrabona"],
    "Nueva Segovia": ["Ciudad Antigua", "Dipilto", "El Jícaro", "Jalapa", "Macuelizo", "Mozonte", "Murra", "Ocotal", "Quilalí", "San Fernando", "Santa María", "Wiwilí"],
    "Río San Juan": ["El Almendro", "El Castillo", "Morrito", "San Carlos", "San Juan del Norte", "San Miguelito"],
    "Rivas": ["Altagracia", "Belén", "Buenos Aires", "Cárdenas", "Moyogalpa", "Potosí", "Rivas", "San Jorge", "San Juan del Sur", "Tola"],
    "RACCN": ["Bonanza", "Mulukukú", "Prinzapolka", "Puerto Cabezas", "Rosita", "Siuna", "Waslala", "Waspam"],
    "RACCS": ["Bluefields", "Corn Island", "Desembocadura de Río Grande", "El Ayote", "El Rama", "El Tortuguero", "Kukra Hill", "La Cruz de Río Grande", "Laguna de Perlas", "Muelle de los Bueyes", "Nueva Guinea", "Paiwas"]
};

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

    // 🟢 ESTADOS PARA LISTAS FLOTANTES
    const [busquedaDepto, setBusquedaDepto] = useState('');
    const [busquedaCiudad, setBusquedaCiudad] = useState('');
    const [showListaDepto, setShowListaDepto] = useState(false);
    const [showListaCiudad, setShowListaCiudad] = useState(false);

    // 🟢 MODIFICACIÓN: Reset de búsquedas al cambiar psicologoEditar o isOpen
    useEffect(() => {
        setBusquedaDepto('');  // Limpiar campo de texto de departamento
        setBusquedaCiudad(''); // Limpiar campo de texto de ciudad
        
        if (psicologoEditar) {
             setFormData({
                 nombre: psicologoEditar.Nombre,
                 apellido: psicologoEditar.Apellido,
                 codigoMinsa: psicologoEditar.CodigoMinsa,
                 telefono: psicologoEditar.No_Telefono,
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

    // 🟢 EFECTO PARA CERRAR LISTAS AL HACER CLIC FUERA
    useEffect(() => {
        const cerrar = () => {
            setShowListaDepto(false);
            setShowListaCiudad(false);
        };
        window.addEventListener('click', cerrar);
        return () => window.removeEventListener('click', cerrar);
    }, []);

    // 🟢 FILTRADO DE DEPTOS Y CIUDADES
    const deptosFiltrados = useMemo(() => {
        const term = busquedaDepto.toLowerCase().trim();
        return Object.keys(DIVISION_TERRITORIAL).filter(d => d.toLowerCase().includes(term));
    }, [busquedaDepto]);

    const ciudadesFiltradas = useMemo(() => {
        const depto = formData.direccion.departamento;
        const lista = DIVISION_TERRITORIAL[depto] || [];
        const term = busquedaCiudad.toLowerCase().trim();
        return lista.filter(c => c.toLowerCase().includes(term));
    }, [busquedaCiudad, formData.direccion.departamento]);

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

    // 🟢 FUNCIÓN DE CIERRE PERSONALIZADA PARA LIMPIAR TODO
    const handleManualClose = () => {
        setBusquedaDepto('');
        setBusquedaCiudad('');
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!esTelefonoValido(formData.telefono)) {
            return toast.error('El teléfono debe ser de 8 dígitos (empezar con 2, 5, 7 u 8)');
        }

        const emailLower = formData.email.toLowerCase().trim();
        if (!emailLower.endsWith('@gmail.com')) {
            return toast.error('El sistema solo permite correos de Google (@gmail.com) para crear la cuenta de acceso');
        }

        if (formData.especialidadIds.length === 0) {
            return toast.error('Debe seleccionar al menos una especialidad');
        }
        
        setGuardando(true);
        try {
            const payload = { 
                ...formData, 
                email: emailLower, 
                especialidadIds: formData.especialidadIds.map(Number),
                idRol: 2 
            };
            await onSubmit(payload, !!psicologoEditar);
            handleManualClose(); // Usar el cierre limpio
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
                    <button type="button" className="btn btn-sm btn-circle btn-ghost text-slate-400" onClick={handleManualClose} disabled={guardando}>✕</button>
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
                                                    placeholder="ejemplo@gmail.com" 
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
                                            {/* 🟢 DEPARTAMENTO BUSCADOR */}
                                            <div className="relative" onClick={e => e.stopPropagation()}>
                                                <input 
                                                    placeholder="Depto..." 
                                                    className="input input-bordered input-sm w-full bg-white" 
                                                    value={busquedaDepto} 
                                                    onFocus={() => setShowListaDepto(true)}
                                                    onChange={e => { setBusquedaDepto(e.target.value); setShowListaDepto(true); }}
                                                />
                                                {showListaDepto && busquedaDepto.length > 0 && (
                                                    <div className="absolute z-[110] w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-40 overflow-y-auto animate-fade-in">
                                                        {deptosFiltrados.map(d => (
                                                            <div key={d} className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-[10px] font-bold border-b border-slate-50 last:border-none"
                                                                onClick={() => {
                                                                    setFormData(prev => ({ ...prev, direccion: { ...prev.direccion, departamento: d, ciudad: '' } }));
                                                                    setBusquedaDepto('');
                                                                    setBusquedaCiudad('');
                                                                    setShowListaDepto(false);
                                                                }}>
                                                                {d.toUpperCase()}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                <select 
                                                    required
                                                    className="select select-bordered select-sm w-full bg-slate-50 mt-1 text-[10px]"
                                                    value={formData.direccion.departamento}
                                                    onChange={e => {
                                                        setFormData(prev => ({ ...prev, direccion: { ...prev.direccion, departamento: e.target.value, ciudad: '' } }));
                                                        setBusquedaDepto('');
                                                    }}
                                                >
                                                    <option value="">-- Depto ({deptosFiltrados.length}) --</option>
                                                    {Object.keys(DIVISION_TERRITORIAL).map(d => <option key={d} value={d}>{d}</option>)}
                                                </select>
                                            </div>

                                            {/* 🟢 CIUDAD BUSCADOR */}
                                            <div className="relative" onClick={e => e.stopPropagation()}>
                                                <input 
                                                    placeholder="Ciudad..." 
                                                    className="input input-bordered input-sm w-full bg-white disabled:bg-slate-100 font-medium" 
                                                    value={busquedaCiudad}
                                                    disabled={!formData.direccion.departamento}
                                                    onFocus={() => setShowListaCiudad(true)}
                                                    onChange={e => { setBusquedaCiudad(e.target.value); setShowListaCiudad(true); }}
                                                />
                                                {showListaCiudad && busquedaCiudad.length > 0 && (
                                                    <div className="absolute z-[110] w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-40 overflow-y-auto animate-fade-in">
                                                        {ciudadesFiltradas.map(c => (
                                                            <div key={c} className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-[10px] font-bold border-b border-slate-50 last:border-none"
                                                                onClick={() => {
                                                                    setFormData(prev => ({ ...prev, direccion: { ...prev.direccion, ciudad: c } }));
                                                                    setBusquedaCiudad('');
                                                                    setShowListaCiudad(false);
                                                                }}>
                                                                {c.toUpperCase()}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                <select 
                                                    required
                                                    className="select select-bordered select-sm w-full bg-slate-50 mt-1 text-[10px]"
                                                    disabled={!formData.direccion.departamento}
                                                    value={formData.direccion.ciudad}
                                                    onChange={e => {
                                                        setFormData(prev => ({ ...prev, direccion: { ...prev.direccion, ciudad: e.target.value } }));
                                                        setBusquedaCiudad('');
                                                    }}
                                                >
                                                    <option value="">-- Ciudad ({ciudadesFiltradas.length}) --</option>
                                                    {(DIVISION_TERRITORIAL[formData.direccion.departamento] || []).map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                            </div>
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
                    <button type="button" className="btn btn-ghost px-8 font-bold text-slate-400" onClick={handleManualClose} disabled={guardando}>Cancelar</button>
                    <button type="submit" form="psicologo-form" className="btn bg-slate-900 hover:bg-slate-800 text-white px-12 rounded-2xl font-bold shadow-xl shadow-slate-200 transition-all" disabled={guardando}>
                        {guardando ? <span className="loading loading-spinner loading-xs"></span> : 'Guardar Perfil Profesional'}
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.getElementById("modal-root")!);
}