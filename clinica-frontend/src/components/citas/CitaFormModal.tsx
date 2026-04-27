import { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import type { Cita, CreateCitaDTO } from '../../types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateCitaDTO, isEdit: boolean) => Promise<boolean | void>;
    citaEditar: Cita | null;
    catalogos: any;
}

export default function CitaFormModal({ isOpen, onClose, onSubmit, citaEditar, catalogos }: Props) {
    // 🟢 DETECTAR ROL Y USUARIO PARA RESTRICCIONES
    const userRole = Number(localStorage.getItem('user_role'));
    const userId = localStorage.getItem('user_id');
    const esPsicologo = userRole === 2;

    const [formData, setFormData] = useState<any>({
        fecha: '', hora: '', motivo: '', pacienteId: '', 
        psicologoId: esPsicologo ? userId : '', // Pre-asignar si es psicólogo
        tipoCitaId: '', precio: '', metodoPagoId: '1', idDivisa: '1', tasaCambio: '1',
        direccion: { departamento: '', ciudad: '', barrio: '', calle: '' }
    });

    const [usarDireccionPaciente, setUsarDireccionPaciente] = useState(false);
    const [busquedaPaciente, setBusquedaPaciente] = useState('');
    const [busquedaPsicologo, setBusquedaPsicologo] = useState('');
    const [guardando, setGuardando] = useState(false);

    const hoyString = new Date().toISOString().split('T')[0];

    const pacientesFiltrados = useMemo(() => {
        const lista = catalogos?.pacientes || [];
        const term = busquedaPaciente.toLowerCase().trim();
        if (!term) return lista;
        return lista.filter((p: any) =>
            `${p.Nombre} ${p.Apellido}`.toLowerCase().includes(term) ||
            (p.PacienteAdulto?.No_Cedula || '').toLowerCase().includes(term)
        );
    }, [busquedaPaciente, catalogos?.pacientes]);

    const psicologosFiltrados = useMemo(() => {
        const lista = catalogos?.psicologos || [];
        const term = busquedaPsicologo.toLowerCase().trim();
        if (!term) return lista;
        return lista.filter((p: any) =>
            `${p.Nombre} ${p.Apellido}`.toLowerCase().includes(term)
        );
    }, [busquedaPsicologo, catalogos?.psicologos]);

    // 🟢 Sincronizar dirección del paciente
    useEffect(() => {
        if (usarDireccionPaciente && formData.pacienteId) {
            const paciente = catalogos?.pacientes?.find((p: any) => p.ID_Paciente.toString() === formData.pacienteId);
            const dir = paciente?.Direccion || paciente?.DireccionPaciente;
            if (dir) {
                setFormData((prev: any) => ({
                    ...prev,
                    direccion: {
                        departamento: dir.Departamento || '',
                        ciudad: dir.Ciudad || '',
                        barrio: dir.Barrio || '',
                        calle: dir.Calle || ''
                    }
                }));
            }
        }
    }, [usarDireccionPaciente, formData.pacienteId, catalogos?.pacientes]);

    // 🟢 Cargar datos al editar o resetear al abrir
    useEffect(() => {
        if (citaEditar && isOpen) {
            setUsarDireccionPaciente(false);
            setFormData({
                ...citaEditar,
                pacienteId: citaEditar.ID_Paciente?.toString(),
                psicologoId: citaEditar.ID_Psicologo?.toString(),
                tipoCitaId: citaEditar.ID_TipoCita?.toString(),
                precio: citaEditar.Recibo?.MontoTotal || '',
                idDivisa: citaEditar.Recibo?.ID_Divisa?.toString() || '1',
                metodoPagoId: citaEditar.Recibo?.ID_MetodoPago?.toString() || '1',
                tasaCambio: citaEditar.Recibo?.Tasa_Cambio || '1',
                direccion: citaEditar.Direccion || { departamento: '', ciudad: '', barrio: '', calle: '' }
            });
        } else if (isOpen) {
            setFormData({
                fecha: '', hora: '', motivo: '', pacienteId: '', 
                psicologoId: esPsicologo ? userId : '', // Resetear a su propio ID si es psicólogo
                tipoCitaId: '', precio: '', metodoPagoId: '1', idDivisa: '1', tasaCambio: '1',
                direccion: { departamento: '', ciudad: '', barrio: '', calle: '' }
            });
            setBusquedaPaciente('');
            setBusquedaPsicologo('');
            setUsarDireccionPaciente(false);
        }
    }, [citaEditar, isOpen, esPsicologo, userId]);

    const handleLocalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.pacienteId || !formData.psicologoId || !formData.tipoCitaId) {
            return toast.error("Por favor complete los campos obligatorios");
        }

        const [horas, minutos] = formData.hora.split(':').map(Number);
        if (horas < 8 || horas >= 19) {
            return toast.warning("Horario no disponible", {
                description: "La clínica atiende de 8:00 AM a 7:00 PM.",
                duration: 5000
            });
        }

        // 🟢 VALIDACIÓN DE TIEMPO REAL
        const ahora = new Date();
        const [anio, mes, dia] = formData.fecha.split('-').map(Number);
        // Creamos la fecha de la cita (mes - 1 porque en JS los meses van de 0 a 11)
        const fechaCitaCompleta = new Date(anio, mes - 1, dia, horas, minutos);

        if (!citaEditar && fechaCitaCompleta < ahora) {
            return toast.error("Cita inválida", {
                description: "No puedes agendar una cita para un horario que ya pasó hoy.",
                duration: 5000
            });
        }

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const fechaSeleccionada = new Date(formData.fecha);
        fechaSeleccionada.setMinutes(fechaSeleccionada.getMinutes() + fechaSeleccionada.getTimezoneOffset());
        fechaSeleccionada.setHours(0, 0, 0, 0);

        if (fechaSeleccionada < hoy && !citaEditar) {
            return toast.error("No se pueden agendar citas en fechas pasadas.");
        }

        const payload: any = {
            ...formData,
            pacienteId: Number(formData.pacienteId),
            psicologoId: Number(formData.psicologoId),
            tipoCitaId: Number(formData.tipoCitaId),
            precio: Number(formData.precio),
            metodoPagoId: Number(formData.metodoPagoId),
            idDivisa: Number(formData.idDivisa),
            tasaCambio: Number(formData.tasaCambio),
            idDireccion: usarDireccionPaciente ? 0 : (formData.ID_Direccion || 1),
            direccionManual: !usarDireccionPaciente ? { ...formData.direccion } : undefined
        };

        setGuardando(true);
        const success = await onSubmit(payload, !!citaEditar);
        if (success) onClose();
        setGuardando(false);
    };

    if (!isOpen) return null;

    const modalContent = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl flex flex-col max-h-[95vh] border border-slate-200 overflow-hidden animate-fade-in-up">

                <div className="bg-[#1e293b] text-white px-8 py-6 flex justify-between items-center shrink-0">
                    <div>
                        <h3 className="text-xl font-bold font-serif">📅 {citaEditar ? 'Editar Cita Clínica' : 'Agendar Nueva Cita'}</h3>
                        <p className="text-slate-400 text-xs mt-1">
                            {esPsicologo ? 'Usted está registrando una cita bajo su propia agenda profesional.' : 'Asegúrese de verificar la disponibilidad del especialista'}
                        </p>
                    </div>
                    <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost text-white">✕</button>
                </div>

                <div className="p-8 overflow-y-auto bg-slate-50/50 flex-1 text-slate-800">
                    <form className="space-y-8" id="form-cita" onSubmit={handleLocalSubmit}>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Paciente</label>
                                <input type="text" placeholder="🔍 Buscar por nombre o cédula..." className="input input-sm input-bordered w-full bg-slate-50" value={busquedaPaciente} onChange={e => setBusquedaPaciente(e.target.value)} />
                                <select required className="select select-bordered select-sm w-full bg-white text-slate-900 font-medium" value={formData.pacienteId} onChange={e => setFormData({ ...formData, pacienteId: e.target.value })}>
                                    <option value="">-- Seleccionar ({pacientesFiltrados.length}) --</option>
                                    {pacientesFiltrados.map((p: any) => (
                                        <option key={p.ID_Paciente} value={p.ID_Paciente}>{p.Nombre} {p.Apellido}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Psicólogo Especialista</label>
                                <input 
                                    type="text" 
                                    placeholder="🔍 Buscar doctor..." 
                                    className="input input-sm input-bordered w-full bg-slate-50 disabled:opacity-50" 
                                    value={busquedaPsicologo} 
                                    disabled={esPsicologo}
                                    onChange={e => setBusquedaPsicologo(e.target.value)} 
                                />
                                <select 
                                    required 
                                    className="select select-bordered select-sm w-full bg-white text-slate-900 font-medium disabled:bg-slate-100" 
                                    value={formData.psicologoId} 
                                    disabled={esPsicologo}
                                    onChange={e => setFormData({ ...formData, psicologoId: e.target.value })}
                                >
                                    <option value="">-- Seleccionar Especialista --</option>
                                    {psicologosFiltrados.map((p: any) => (
                                        <option key={p.ID_Psicologo} value={p.ID_Psicologo}>Dr. {p.Nombre} {p.Apellido}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">📅 Fecha Programada</label>
                                <input required type="date" min={hoyString} className="input input-bordered w-full bg-white font-bold text-slate-700" value={formData.fecha} onChange={e => setFormData({ ...formData, fecha: e.target.value })} />
                            </div>
                            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">🕒 Hora de Encuentro</label>
                                <input required type="time" className="input input-bordered w-full bg-white font-bold text-slate-700" value={formData.hora} onChange={e => setFormData({ ...formData, hora: e.target.value })} />
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                            <div className="flex justify-between items-center">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">📍 Punto de Atención</h4>
                                <label className="label cursor-pointer gap-2 bg-blue-50 px-3 py-1 rounded-xl border border-blue-100">
                                    <input type="checkbox" className="checkbox checkbox-xs checkbox-primary" checked={usarDireccionPaciente} onChange={e => setUsarDireccionPaciente(e.target.checked)} />
                                    <span className="label-text text-[10px] font-bold text-blue-600 uppercase">Domicilio del paciente</span>
                                </label>
                            </div>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                {['departamento', 'ciudad', 'barrio', 'calle'].map((field) => (
                                    <input key={field} placeholder={field.charAt(0).toUpperCase() + field.slice(1)} className="input input-bordered input-sm bg-white" value={formData.direccion[field]} readOnly={usarDireccionPaciente} onChange={e => setFormData({ ...formData, direccion: { ...formData.direccion, [field]: e.target.value } })} />
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="bg-emerald-50/50 p-6 rounded-3xl border border-emerald-100 space-y-4">
                                <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">+ Cobro y Facturación</h4>
                                
                                <div className="form-control">
                                    <label className="text-[9px] font-bold text-emerald-700 uppercase mb-1 ml-1">Tipo de Servicio</label>
                                    <select required className="select select-bordered select-sm w-full bg-white font-bold" value={formData.tipoCitaId} onChange={e => setFormData({ ...formData, tipoCitaId: e.target.value })}>
                                        <option value="">Seleccionar...</option>
                                        {catalogos?.tiposCita?.map((t: any) => <option key={t.ID_TipoCita} value={t.ID_TipoCita}>{t.Nombre_DeCita || t.NombreDeCita}</option>)}
                                    </select>
                                </div>

                                <div className="form-control">
                                    <label className="text-[9px] font-bold text-emerald-700 uppercase mb-1 ml-1">Monto (Subtotal)</label>
                                    <input required type="number" step="0.01" className="input input-bordered input-sm w-full bg-white font-black text-lg text-emerald-700" value={formData.precio} onChange={e => setFormData({ ...formData, precio: e.target.value })} />
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div className="form-control">
                                        <label className="text-[9px] font-bold text-emerald-700 uppercase mb-1 ml-1">Moneda</label>
                                        <select className="select select-bordered select-sm w-full bg-white font-bold" value={formData.idDivisa} onChange={e => setFormData({ ...formData, idDivisa: e.target.value, tasaCambio: e.target.value === '1' ? '1' : formData.tasaCambio })}>
                                            {catalogos?.divisas?.map((d: any) => <option key={d.ID_Divisa} value={d.ID_Divisa}>{d.Codigo_ISO}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-control">
                                        <label className="text-[9px] font-bold text-emerald-700 uppercase mb-1 ml-1">Tasa</label>
                                        <input required type="number" step="0.01" className={`input input-bordered input-sm w-full font-bold ${formData.idDivisa === '1' ? 'bg-slate-100 text-slate-400' : 'bg-white text-emerald-700'}`} value={formData.tasaCambio} readOnly={formData.idDivisa === '1'} onChange={e => setFormData({ ...formData, tasaCambio: e.target.value })} />
                                    </div>
                                </div>

                                <div className="form-control">
                                    <label className="text-[9px] font-bold text-emerald-700 uppercase mb-1 ml-1">Forma de Pago</label>
                                    <select required className="select select-bordered select-sm w-full bg-white" value={formData.metodoPagoId} onChange={e => setFormData({ ...formData, metodoPagoId: e.target.value })}>
                                        <option value="">Seleccionar...</option>
                                        {catalogos?.metodosPago?.map((m: any) => (
                                            <option key={m.ID_Metodo_Pago} value={m.ID_Metodo_Pago}>{m.Nombre_Metodo}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="lg:col-span-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">📝 Motivo y Notas de la Consulta</label>
                                <textarea required className="textarea textarea-bordered w-full h-full bg-white min-h-[200px] text-sm leading-relaxed shadow-inner rounded-3xl" placeholder="Describa brevemente el motivo de la cita..." value={formData.motivo} onChange={e => setFormData({ ...formData, motivo: e.target.value })} />
                            </div>
                        </div>
                    </form>
                </div>

                <div className="px-8 py-6 border-t border-slate-100 flex justify-end gap-3 bg-white shrink-0">
                    <button onClick={onClose} type="button" className="btn btn-ghost px-8 font-bold text-slate-400 hover:bg-slate-100 rounded-2xl">Cerrar</button>
                    <button type="submit" form="form-cita" className="btn btn-primary px-12 text-white shadow-xl shadow-blue-200 font-bold rounded-2xl" disabled={guardando}>
                        {guardando ? 'Guardando...' : (citaEditar ? 'Sincronizar Cambios' : 'Agendar Cita')}
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.getElementById('modal-root')!);
}