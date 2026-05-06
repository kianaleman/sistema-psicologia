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
    onOpenAddPaciente?: () => void; // 🟢 Propiedad para abrir el registro de paciente
    datosSeguimiento?: any; // 🟢 Nueva propiedad para precarga desde SesionModal
}

export default function CitaFormModal({ isOpen, onClose, onSubmit, citaEditar, catalogos, onOpenAddPaciente, datosSeguimiento }: Props) {
    // 🟢 DETECTAR ROL Y USUARIO PARA RESTRICCIONES
    const userRole = Number(localStorage.getItem('user_role'));
    const userId = localStorage.getItem('user_id');
    const esPsicologo = userRole === 2;

    // 🟢 DETERMINAR SI ES UN MODO RESTRINGIDO (EDICIÓN O SEGUIMIENTO)
    const esModoRestringido = !!citaEditar || !!datosSeguimiento;

    // 🟢 FUNCIÓN PARA BUSCAR LA DIRECCIÓN DE LA CLÍNICA EN LOS CATÁLOGOS (ID 3 SEGÚN DB)
    const getDireccionClinicaDB = () => {
        const listaDirecciones = catalogos?.direcciones || [];
        const clinica = listaDirecciones.find((d: any) => d.ID_Direccion === 3);
        
        return clinica ? {
            ID_Direccion: clinica.ID_Direccion,
            departamento: clinica.Departamento || 'Managua',
            ciudad: clinica.Ciudad || 'Managua',
            barrio: clinica.Barrio || 'Camilo Chamorro',
            calle: clinica.Calle || 'N/A'
        } : { 
            ID_Direccion: 3, departamento: 'Managua', ciudad: 'Managua', barrio: 'Camilo Chamorro', calle: 'N/A' 
        };
    };

    const [formData, setFormData] = useState<any>({
        fecha: '', hora: '', motivo: '', pacienteId: '', 
        psicologoId: esPsicologo ? userId : '', 
        tipoCitaId: '', precio: '', metodoPagoId: '1', idDivisa: '1', tasaCambio: '1',
        direccion: getDireccionClinicaDB()
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

    // 🟢 VALIDACIÓN ESTRICTA: SOLO NÚMEROS Y UN PUNTO (SIN LETRAS NI NEGATIVOS)
    const validarFinanciero = (valor: string, nombreCampo: string) => {
        if (!valor) return;
        const regexValido = /^\d*\.?\d*$/;

        if (!regexValido.test(valor)) {
            toast.warning(`Entrada no válida en ${nombreCampo}`, {
                description: "Este campo no puede contener letras, signos negativos ni caracteres especiales. Solo se permite el punto decimal.",
                duration: 6000
            });
        }
    };

    const validarFechaInmediata = (fechaSeleccionada: string) => {
        if (!fechaSeleccionada || (citaEditar && fechaSeleccionada === citaEditar.FechaCita.split('T')[0])) return;
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const [anio, mes, dia] = fechaSeleccionada.split('-').map(Number);
        const fechaElegida = new Date(anio, mes - 1, dia);
        if (fechaElegida < hoy) {
            toast.warning("La fecha que estás ingresando ya pasó", {
                description: "Por favor, selecciona una fecha actual o futura.",
                duration: 7000
            });
        }
    };

    const validarHoraInmediata = (horaSeleccionada: string) => {
        if (!horaSeleccionada) return;
        const [horas] = horaSeleccionada.split(':').map(Number);
        if (horas < 8 || horas >= 19) {
            toast.warning("Horario no disponible", {
                description: "La clínica atiende únicamente de 8:00 AM a 7:00 PM.",
                duration: 7000
            });
        }
    };

    // 🟢 Sincronizar dirección del paciente o clínica
    useEffect(() => {
        if (!isOpen) return;

        if (usarDireccionPaciente && formData.pacienteId) {
            const paciente = catalogos?.pacientes?.find((p: any) => p.ID_Paciente.toString() === formData.pacienteId);
            const dir = paciente?.Direccion || paciente?.DireccionPaciente;
            if (dir) {
                setFormData((prev: any) => ({
                    ...prev,
                    direccion: {
                        ID_Direccion: dir.ID_Direccion || 0,
                        departamento: dir.Departamento || '',
                        ciudad: dir.Ciudad || '',
                        barrio: dir.Barrio || '',
                        calle: dir.Calle || ''
                    }
                }));
            }
        } else if (!usarDireccionPaciente) {
            setFormData((prev: any) => ({
                ...prev,
                direccion: getDireccionClinicaDB()
            }));
        }
    }, [usarDireccionPaciente, formData.pacienteId, isOpen]);

    // 🟢 Reset completo al abrir/cerrar para evitar errores de caché en campos
    useEffect(() => {
        if (isOpen) {
            if (citaEditar) {
                const esDirPaciente = citaEditar.ID_Direccion !== 3;
                setUsarDireccionPaciente(esDirPaciente);
                setFormData({
                    ...citaEditar,
                    fecha: citaEditar.FechaCita.split('T')[0],
                    hora: citaEditar.HoraCita.includes('T') ? citaEditar.HoraCita.split('T')[1].substring(0, 5) : citaEditar.HoraCita.substring(0, 5),
                    motivo: citaEditar.MotivoConsulta || '', 
                    pacienteId: citaEditar.ID_Paciente?.toString(),
                    psicologoId: citaEditar.ID_Psicologo?.toString(),
                    tipoCitaId: citaEditar.ID_TipoCita?.toString(),
                    precio: citaEditar.Recibo?.MontoTotal?.toString() || '',
                    idDivisa: citaEditar.Recibo?.ID_Divisa?.toString() || '1',
                    metodoPagoId: citaEditar.Recibo?.ID_MetodoPago?.toString() || '1',
                    tasaCambio: citaEditar.Recibo?.Tasa_Cambio?.toString() || '1',
                    direccion: citaEditar.Direccion || getDireccionClinicaDB()
                });
            } else if (datosSeguimiento) {
                // 🟢 LÓGICA PARA CARGA AUTOMÁTICA DE SEGUIMIENTO
                setUsarDireccionPaciente(datosSeguimiento.usarDireccionPaciente);
                setFormData({
                    fecha: '', 
                    hora: '', 
                    motivo: 'Cita de seguimiento.',
                    pacienteId: datosSeguimiento.pacienteId?.toString(),
                    psicologoId: datosSeguimiento.psicologoId?.toString(),
                    tipoCitaId: '4', 
                    precio: '', 
                    metodoPagoId: '1', 
                    idDivisa: '1', 
                    tasaCambio: '1',
                    direccion: datosSeguimiento.direccion || getDireccionClinicaDB()
                });
            } else {
                setUsarDireccionPaciente(false);
                setFormData({
                    fecha: '', hora: '', motivo: '', pacienteId: '', 
                    psicologoId: esPsicologo ? userId : '', 
                    tipoCitaId: '', precio: '', metodoPagoId: '1', idDivisa: '1', tasaCambio: '1',
                    direccion: getDireccionClinicaDB() 
                });
                setBusquedaPaciente('');
                setBusquedaPsicologo('');
            }
        }
    }, [isOpen, citaEditar, esPsicologo, userId, datosSeguimiento]);

    const handleLocalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.pacienteId || !formData.psicologoId || !formData.tipoCitaId) {
            return toast.error("Por favor complete los campos obligatorios");
        }

        const [horas, minutos] = formData.hora.split(':').map(Number);
        const ahora = new Date();
        const [anio, mes, dia] = formData.fecha.split('-').map(Number);
        const fechaCitaCompleta = new Date(anio, mes - 1, dia, horas, minutos);

        if (!citaEditar && fechaCitaCompleta < ahora) {
            return toast.error("La fecha que estás ingresando ya pasó", {
                description: "No puedes agendar una cita para un horario que ya pasó.",
                duration: 5000
            });
        }

        if (horas < 8 || horas >= 19) {
            return toast.warning("Horario no disponible", {
                description: "La clínica atiende de 8:00 AM a 7:00 PM.",
                duration: 5000
            });
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
            idDireccion: usarDireccionPaciente ? (formData.direccion.ID_Direccion || 0) : 3, // 🟢 ID 3 es la clínica
            direccionManual: !usarDireccionPaciente && formData.direccion.ID_Direccion !== 3 ? { ...formData.direccion } : undefined
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
                        <h3 className="text-xl font-bold font-serif">📅 {citaEditar ? 'Editar Cita Clínica' : (datosSeguimiento ? 'Agendar Seguimiento' : 'Agendar Nueva Cita')}</h3>
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
                                <div className="flex justify-between items-center">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Paciente</label>
                                    {/* 🟢 OCULTAR BOTÓN SI ES EDICIÓN O SEGUIMIENTO */}
                                    {!esModoRestringido && (
                                        <button 
                                            type="button" 
                                            onClick={onOpenAddPaciente}
                                            className="text-[9px] font-bold text-blue-600 hover:text-blue-800 uppercase flex items-center gap-1 transition-colors"
                                        >
                                            <span className="text-sm">+</span> Agregar paciente
                                        </button>
                                    )}
                                </div>
                                <input 
                                    type="text" 
                                    placeholder="🔍 Buscar por nombre o cédula..." 
                                    className="input input-sm input-bordered w-full bg-slate-50 disabled:opacity-30" 
                                    value={busquedaPaciente} 
                                    onChange={e => setBusquedaPaciente(e.target.value)} 
                                    disabled={esModoRestringido} // 🟢 BLOQUEO
                                />
                                <select 
                                    required 
                                    className="select select-bordered select-sm w-full bg-white text-slate-900 font-medium disabled:bg-slate-100" 
                                    value={formData.pacienteId} 
                                    onChange={e => setFormData({ ...formData, pacienteId: e.target.value })}
                                    disabled={esModoRestringido} // 🟢 BLOQUEO
                                >
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
                                    className="input input-sm input-bordered w-full bg-slate-50 disabled:opacity-30" 
                                    value={busquedaPsicologo} 
                                    disabled={esPsicologo || esModoRestringido} // 🟢 BLOQUEO
                                    onChange={e => setBusquedaPsicologo(e.target.value)} 
                                />
                                <select 
                                    required 
                                    className="select select-bordered select-sm w-full bg-white text-slate-900 font-medium disabled:bg-slate-100" 
                                    value={formData.psicologoId} 
                                    disabled={esPsicologo || esModoRestringido} // 🟢 BLOQUEO
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
                                <input 
                                    required 
                                    type="date" 
                                    min={hoyString} 
                                    className="input input-bordered w-full bg-white font-bold text-slate-700" 
                                    value={formData.fecha} 
                                    onChange={e => setFormData({ ...formData, fecha: e.target.value })}
                                    onBlur={(e) => validarFechaInmediata(e.target.value)} 
                                />
                            </div>
                            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">🕒 Hora de Encuentro</label>
                                <input 
                                    required 
                                    type="time" 
                                    className="input input-bordered w-full bg-white font-bold text-slate-700" 
                                    value={formData.hora} 
                                    onChange={e => setFormData({ ...formData, hora: e.target.value })}
                                    onBlur={(e) => validarHoraInmediata(e.target.value)} 
                                />
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
                                    <input 
                                        key={field} 
                                        placeholder={field.charAt(0).toUpperCase() + field.slice(1)} 
                                        className="input input-bordered input-sm bg-white" 
                                        value={formData.direccion[field]} 
                                        readOnly={usarDireccionPaciente} 
                                        onChange={e => setFormData({ ...formData, direccion: { ...formData.direccion, [field]: e.target.value } })} 
                                    />
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
                                    <input 
                                        required 
                                        type="text" 
                                        className="input input-bordered input-sm w-full bg-white font-black text-lg text-emerald-700" 
                                        value={formData.precio} 
                                        onChange={e => setFormData({ ...formData, precio: e.target.value })} 
                                        onBlur={(e) => validarFinanciero(e.target.value, 'Monto')}
                                    />
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
                                        <input 
                                            required 
                                            type="text" 
                                            className={`input input-bordered input-sm w-full font-bold ${formData.idDivisa === '1' ? 'bg-slate-100 text-slate-400' : 'bg-white text-emerald-700'}`} 
                                            value={formData.tasaCambio} 
                                            readOnly={formData.idDivisa === '1'} 
                                            onChange={e => setFormData({ ...formData, tasaCambio: e.target.value })} 
                                            onBlur={(e) => formData.idDivisa !== '1' && validarFinanciero(e.target.value, 'Tasa de Cambio')} 
                                        />
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