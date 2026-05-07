import { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import type { Paciente, CreatePacienteDTO } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePacienteDTO, isEdit: boolean) => Promise<boolean | void>;
  pacienteEditar: Paciente | null;
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
  User: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" /></svg>,
  MapPin: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M9.69 18.283L4.85 13.44a6.5 6.5 0 119.34-9.34 6.5 6.5 0 01-9.34 9.34l-4.847 4.847a.75.75 0 01-1.06 0z" clipRule="evenodd" /></svg>
};

const initialState = {
  nombre: '', apellido: '', fechaNac: '', genero: 'Masculino', nacionalidad: 'Nicaragüense',
  direccion: { departamento: '', ciudad: '', barrio: '', calle: '' },
  datosAdulto: { cedula: '', telefono: '', ocupacionId: '', estadoCivilId: '' },
  datosMenor: {
    partNacimiento: '', grado: '', tutorId: '',
    nuevoTutor: { 
        nombre: '', 
        apellido: '', 
        noCedula: '', 
        telefono: '', 
        parentescoId: '', 
        ocupacionId: '', 
        estadoCivilId: '' 
    }
  }
};

const formatearCedula = (valor: string) => {
  if (!valor) return '';
  let v = valor.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (v.length > 14) v = v.slice(0, 14);
  if (v.length > 9) return `${v.slice(0, 3)}-${v.slice(3, 9)}-${v.slice(9)}`;
  if (v.length > 3) return `${v.slice(0, 3)}-${v.slice(3)}`;
  return v;
};

const esCedulaValida = (cedula: string) => /^\d{3}-\d{6}-\d{4}[A-Z]$/.test(cedula);
const esTelefonoValido = (tel: string) => /^[2578]\d{7}$/.test(tel.replace(/[\s-]/g, ''));

export default function PacienteFormModal({ isOpen, onClose, onSubmit, pacienteEditar, catalogos }: Props) {
  const [formData, setFormData] = useState(initialState);
  const [esAdulto, setEsAdulto] = useState(true);
  const [modoTutor, setModoTutor] = useState<'existente' | 'nuevo'>('existente');
  const [busquedaTutor, setBusquedaTutor] = useState('');
  const [guardando, setGuardando] = useState(false);
  
  // 🟢 ESTADOS PARA LISTAS FLOTANTES
  const [showListaTutores, setShowListaTutores] = useState(false);
  const [busquedaDepto, setBusquedaDepto] = useState('');
  const [busquedaCiudad, setBusquedaCiudad] = useState('');
  const [showListaDepto, setShowListaDepto] = useState(false);
  const [showListaCiudad, setShowListaCiudad] = useState(false);

  // 🟢 MODIFICACIÓN: Reset de búsquedas al cambiar pacienteEditar o isOpen
  useEffect(() => {
    // Limpiar todos los campos de búsqueda de texto cada vez que el modal se abre o cambia de modo
    setBusquedaDepto('');
    setBusquedaCiudad('');
    setBusquedaTutor('');
    setShowListaDepto(false);
    setShowListaCiudad(false);
    setShowListaTutores(false);

    if (pacienteEditar && isOpen) {
      setEsAdulto(!!pacienteEditar.PacienteAdulto);
      setFormData({
        ...initialState,
        nombre: pacienteEditar.Nombre || '',
        apellido: pacienteEditar.Apellido || '',
        fechaNac: pacienteEditar.Fecha_Nacimiento ? pacienteEditar.Fecha_Nacimiento.split('T')[0] : '',
        genero: pacienteEditar.Genero || 'Masculino',
        nacionalidad: pacienteEditar.Nacionalidad || 'Nicaragüense',
        direccion: {
          departamento: pacienteEditar.Direccion?.Departamento || '',
          ciudad: pacienteEditar.Direccion?.Ciudad || '',
          barrio: pacienteEditar.Direccion?.Barrio || '',
          calle: pacienteEditar.Direccion?.Calle || ''
        },
        datosAdulto: {
          cedula: pacienteEditar.PacienteAdulto?.No_Cedula || '',
          telefono: pacienteEditar.PacienteAdulto?.No_Telefono || '',
          ocupacionId: pacienteEditar.PacienteAdulto?.ID_Ocupacion?.toString() || '',
          estadoCivilId: pacienteEditar.PacienteAdulto?.ID_EstadoCivil?.toString() || ''
        },
        datosMenor: {
          ...initialState.datosMenor,
          partNacimiento: pacienteEditar.Paciente_Menor?.PartidaDeNacimiento || '',
          grado: pacienteEditar.Paciente_Menor?.Grado_Escolar || '',
          tutorId: pacienteEditar.Paciente_Menor?.Tutor_PacienteMenor?.[0]?.ID_Tutor?.toString() || ''
        },
      });
    } else if (isOpen) {
      setFormData(initialState);
      setEsAdulto(true);
    }
  }, [pacienteEditar, isOpen]);

  // 🟢 FUNCIÓN DE CIERRE PERSONALIZADA PARA LIMPIAR ESTADOS DE BÚSQUEDA
  const handleManualClose = () => {
    setBusquedaDepto('');
    setBusquedaCiudad('');
    setBusquedaTutor('');
    onClose();
  };

  // 🟢 EFECTO PARA CERRAR LISTAS AL HACER CLIC FUERA
  useEffect(() => {
    const cerrar = () => {
        setShowListaTutores(false);
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

  // 🟢 LÓGICA DE DETECCIÓN AUTOMÁTICA DE EDAD
  const detectarTipoDePaciente = (fecha: string) => {
    if (!fecha) return;
    const hoy = new Date();
    const nacimiento = new Date(fecha);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const m = hoy.getMonth() - nacimiento.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
        edad--;
    }

    if (edad >= 18) {
        setEsAdulto(true);
        toast.info(`Perfil Adulto (${edad} años)`);
    } else {
        setEsAdulto(false);
        toast.info(`Perfil Menor (${edad} años)`);
    }
  };

  const handleSubmitInternal = async (e: React.FormEvent) => {
    e.preventDefault();

    const hoy = new Date();
    const fechaNacObj = formData.fechaNac ? new Date(formData.fechaNac) : null;
    if (!fechaNacObj || isNaN(fechaNacObj.getTime())) return toast.error("Fecha requerida.");

    let edad = hoy.getFullYear() - fechaNacObj.getFullYear();
    const mes = hoy.getMonth() - fechaNacObj.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNacObj.getDate())) edad--;

    if (esAdulto && edad < 18) return toast.error(`Edad: ${edad} años. Registre como MENOR.`);
    if (!esAdulto && edad >= 18) return toast.error(`Edad: ${edad} años. Registre como ADULTO.`);

    const pNombre = (formData.nombre || '').trim();
    const pApellido = (formData.apellido || '').trim();
    if (!pNombre || !pApellido) return toast.error("Datos del paciente incompletos.");

    const payload: CreatePacienteDTO = {
      nombre: pNombre,
      apellido: pApellido,
      fechaNac: formData.fechaNac,
      genero: formData.genero,
      nacionalidad: formData.nacionalidad,
      direccion: { pais: 'Nicaragua', ...formData.direccion },
      esAdulto,
      datosAdulto: esAdulto ? {
        cedula: formData.datosAdulto.cedula,
        telefono: formData.datosAdulto.telefono,
        ocupacionId: parseInt(formData.datosAdulto.ocupacionId) || 0,
        estadoCivilId: parseInt(formData.datosAdulto.estadoCivilId) || 0
      } : undefined,
      datosMenor: !esAdulto ? {
        partNacimiento: formData.datosMenor.partNacimiento,
        grado: formData.datosMenor.grado,
        modoTutor,
        tutorId: modoTutor === 'existente' ? parseInt(formData.datosMenor.tutorId) : undefined,
        parentescoId: modoTutor === 'nuevo' ? parseInt(formData.datosMenor.nuevoTutor.parentescoId) : 0,
        nuevoTutor: modoTutor === 'nuevo' ? {
          ...formData.datosMenor.nuevoTutor,
          parentescoId: parseInt(formData.datosMenor.nuevoTutor.parentescoId) || 0,
          ocupacionId: parseInt(formData.datosMenor.nuevoTutor.ocupacionId) || 0,
          estadoCivilId: parseInt(formData.datosMenor.nuevoTutor.estadoCivilId) || 0,
          direccion: { ...formData.direccion }
        } : undefined
      } : undefined
    };

    if (esAdulto && !esCedulaValida(payload.datosAdulto!.cedula)) return toast.error("Cédula de paciente inválida.");
    
    if (!esAdulto && modoTutor === 'nuevo') {
        if (!payload.datosMenor?.nuevoTutor?.noCedula || !esCedulaValida(payload.datosMenor.nuevoTutor.noCedula)) {
            return toast.error("La cédula del tutor es obligatoria y debe ser válida.");
        }
        if (!payload.datosMenor?.nuevoTutor?.nombre || !esTelefonoValido(payload.datosMenor.nuevoTutor.telefono)) {
            return toast.error("Verifique los datos del tutor y su teléfono.");
        }
    }

    setGuardando(true);
    const success = await onSubmit(payload, !!pacienteEditar);
    if (success) handleManualClose(); // Usar función de cierre que limpia
    setGuardando(false);
  };

  const tutoresFiltrados = useMemo(() => {
    const lista = catalogos.listaTutores || [];
    const term = busquedaTutor.toLowerCase().trim();
    if (!term) return lista;
    return lista.filter((t: any) =>
      `${t.Nombre} ${t.Apellido}`.toLowerCase().includes(term) ||
      (t.No_Cedula || '').toLowerCase().includes(term)
    );
  }, [catalogos.listaTutores, busquedaTutor]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-5xl rounded-[2rem] shadow-2xl flex flex-col max-h-[92vh] border border-slate-200 overflow-hidden animate-fade-in-up">

        <div className="bg-slate-900 text-white px-8 py-5 flex justify-between items-center shrink-0">
          <h3 className="font-bold text-xl font-serif">
            {pacienteEditar ? '✏️ Editar Expediente' : '👤 Registro de Paciente'}
          </h3>
          <button type="button" className="btn btn-sm btn-circle btn-ghost" onClick={handleManualClose}>✕</button>
        </div>

        <div className="p-8 overflow-y-auto bg-slate-50 flex-1 custom-scrollbar">
          <form id="form-paciente" onSubmit={handleSubmitInternal} className="space-y-8">
            <div className="flex justify-center shrink-0">
              <div className="bg-white p-1.5 rounded-2xl inline-flex shadow-sm border border-slate-200">
                <button 
                  type="button" 
                  disabled={formData.fechaNac !== ''}
                  className={`px-10 py-2.5 rounded-xl text-xs font-black transition-all ${esAdulto ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 disabled:opacity-50'}`} 
                  onClick={() => setEsAdulto(true)}
                >
                  ADULTO
                </button>
                <button 
                  type="button" 
                  disabled={formData.fechaNac !== ''}
                  className={`px-10 py-2.5 rounded-xl text-xs font-black transition-all ${!esAdulto ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-400 disabled:opacity-50'}`} 
                  onClick={() => setEsAdulto(false)}
                >
                  MENOR
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Información General</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <input required placeholder="Nombre" className="input input-bordered input-sm bg-white" value={formData.nombre} onChange={e => setFormData(prev => ({ ...prev, nombre: e.target.value }))} />
                    <input required placeholder="Apellido" className="input input-bordered input-sm bg-white" value={formData.apellido} onChange={e => setFormData(prev => ({ ...prev, apellido: e.target.value }))} />
                  </div>
                  <input 
                    required 
                    type="date" 
                    className="input input-bordered input-sm bg-white w-full font-bold" 
                    value={formData.fechaNac} 
                    onChange={e => setFormData(prev => ({ ...prev, fechaNac: e.target.value }))} 
                    onBlur={(e) => detectarTipoDePaciente(e.target.value)}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <select required className="select select-bordered select-sm bg-white font-medium" value={formData.genero} onChange={e => setFormData(prev => ({ ...prev, genero: e.target.value }))}>
                        <option value="Masculino">Masculino</option>
                        <option value="Femenino">Femenino</option>
                        <option value="Otro">Otro</option>
                    </select>
                    <input required placeholder="Nacionalidad" className="input input-bordered input-sm bg-white" value={formData.nacionalidad} onChange={e => setFormData(prev => ({ ...prev, nacionalidad: e.target.value }))} />
                  </div>
                </div>

                <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Icons.MapPin /> Domicilio</h4>
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
                            className="input input-bordered input-sm w-full bg-white disabled:bg-slate-100" 
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
                  <input placeholder="Barrio" className="input input-bordered input-sm w-full bg-white font-medium" value={formData.direccion.barrio} onChange={e => setFormData(prev => ({ ...prev, direccion: { ...prev.direccion, barrio: e.target.value } }))} />
                  <textarea placeholder="Calle / Detalle..." className="textarea textarea-bordered textarea-sm w-full h-20 bg-white text-slate-900" value={formData.direccion.calle} onChange={e => setFormData(prev => ({ ...prev, direccion: { ...prev.direccion, calle: e.target.value } }))} />
                </div>
              </div>

              <div className={`lg:col-span-7 p-8 rounded-2xl border-2 bg-white transition-colors duration-500 ${esAdulto ? 'border-blue-50' : 'border-amber-50'}`}>
                {esAdulto ? (
                  <div className="space-y-6 animate-fade-in">
                    <h4 className="text-blue-600 font-black text-[10px] uppercase">Perfil de Adulto</h4>
                    <input required placeholder="Cédula" className="input input-bordered w-full font-mono bg-slate-50" value={formData.datosAdulto.cedula} onChange={e => setFormData(prev => ({ ...prev, datosAdulto: { ...prev.datosAdulto, cedula: formatearCedula(e.target.value) } }))} />
                    <input required placeholder="Teléfono" className="input input-bordered w-full bg-white font-bold" value={formData.datosAdulto.telefono} onChange={e => setFormData(prev => ({ ...prev, datosAdulto: { ...prev.datosAdulto, telefono: e.target.value } }))} maxLength={8} />
                    <div className="grid grid-cols-2 gap-4">
                      <select required className="select select-bordered bg-white" value={formData.datosAdulto.ocupacionId} onChange={e => setFormData(prev => ({ ...prev, datosAdulto: { ...prev.datosAdulto, ocupacionId: e.target.value } }))}>
                        <option value="">Ocupación...</option>
                        {catalogos.ocupaciones?.map((o: any) => <option key={o.ID_Ocupacion} value={o.ID_Ocupacion}>{o.Nombre_DeOcupacion}</option>)}
                      </select>
                      <select required className="select select-bordered bg-white" value={formData.datosAdulto.estadoCivilId} onChange={e => setFormData(prev => ({ ...prev, datosAdulto: { ...prev.datosAdulto, estadoCivilId: e.target.value } }))}>
                        <option value="">Estado Civil...</option>
                        {catalogos.estadosCiviles?.map((ec: any) => <option key={ec.ID_EstadoCivil} value={ec.ID_EstadoCivil}>{ec.Nombre_EstadoCivil}</option>)}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 animate-fade-in">
                    <h4 className="text-amber-600 font-black text-[10px] uppercase">Detalles del Menor</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <input required placeholder="Partida Nacimiento" className="input input-bordered input-sm bg-slate-50" value={formData.datosMenor.partNacimiento} onChange={e => setFormData(prev => ({ ...prev, datosMenor: { ...prev.datosMenor, partNacimiento: e.target.value } }))} />
                      <input placeholder="Grado Escolar" className="input input-bordered input-sm bg-white" value={formData.datosMenor.grado} onChange={e => setFormData(prev => ({ ...prev, datosMenor: { ...prev.datosMenor, grado: e.target.value } }))} />
                    </div>

                    <div className="bg-amber-50/50 p-6 rounded-2xl border border-amber-100 mt-6 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-amber-700 uppercase">Gestión de Tutor</span>
                        <div className="tabs tabs-boxed bg-white border p-1 scale-90">
                          <button type="button" className={`tab tab-xs font-bold ${modoTutor === 'existente' ? 'tab-active !bg-amber-600 !text-white' : ''}`} onClick={() => setModoTutor('existente')}>BUSCAR</button>
                          <button type="button" className={`tab tab-xs font-bold ${modoTutor === 'nuevo' ? 'tab-active !bg-amber-600 !text-white' : ''}`} onClick={() => setModoTutor('nuevo')}>NUEVO</button>
                        </div>
                      </div>

                      {modoTutor === 'existente' ? (
                        <div className="space-y-3 relative" onClick={e => e.stopPropagation()}>
                          <input 
                            placeholder="🔍 Buscar por nombre o cédula..." 
                            className="input input-bordered input-sm w-full bg-white" 
                            value={busquedaTutor} 
                            onFocus={() => setShowListaTutores(true)}
                            onChange={(e) => {
                                setBusquedaTutor(e.target.value);
                                setShowListaTutores(true);
                            }} 
                          />

                          {showListaTutores && busquedaTutor.length > 0 && (
                            <div className="absolute z-[100] w-full mt-1 bg-white border border-amber-200 rounded-xl shadow-xl max-h-40 overflow-y-auto animate-fade-in">
                                {tutoresFiltrados.length > 0 ? (
                                    tutoresFiltrados.map((t: any) => (
                                        <div 
                                            key={t.ID_Tutor} 
                                            className="px-4 py-2 hover:bg-amber-50 cursor-pointer text-sm border-b border-slate-50 last:border-none"
                                            onClick={() => {
                                                setFormData(prev => ({ ...prev, datosMenor: { ...prev.datosMenor, tutorId: t.ID_Tutor.toString() } }));
                                                setBusquedaTutor(''); // Limpia al seleccionar
                                                setShowListaTutores(false);
                                            }}
                                        >
                                            <p className="font-bold text-slate-700">{t.Nombre} {t.Apellido}</p>
                                            <p className="text-[10px] text-amber-600">{t.No_Cedula || 'Sin Cédula'}</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="px-4 py-3 text-slate-400 text-xs italic text-center">No se encontraron resultados</div>
                                )}
                            </div>
                          )}

                          <select 
                            required 
                            className="select select-bordered select-sm w-full bg-white text-slate-900 font-medium" 
                            value={formData.datosMenor.tutorId} 
                            onChange={e => {
                                setFormData(prev => ({ ...prev, datosMenor: { ...prev.datosMenor, tutorId: e.target.value } }));
                                setBusquedaTutor('');
                            }}
                          >
                            <option value="">-- Seleccionar ({tutoresFiltrados.length}) --</option>
                            {tutoresFiltrados.map((t: any) => <option key={t.ID_Tutor} value={t.ID_Tutor}>{t.Nombre} {t.Apellido}</option>)}
                          </select>
                        </div>
                      ) : (
                        <div className="space-y-3 animate-fade-in">
                          <input 
                            required 
                            placeholder="Cédula del Tutor (001-000000-0000X)" 
                            className="input input-bordered input-sm w-full font-mono bg-white" 
                            value={formData.datosMenor.nuevoTutor.noCedula} 
                            onChange={e => setFormData(prev => ({ 
                                ...prev, 
                                datosMenor: { 
                                    ...prev.datosMenor, 
                                    nuevoTutor: { ...prev.datosMenor.nuevoTutor, noCedula: formatearCedula(e.target.value) } 
                                } 
                            }))} 
                          />
                          <div className="grid grid-cols-2 gap-3">
                            <input required placeholder="Nombre Tutor" className="input input-bordered input-sm bg-white" value={formData.datosMenor.nuevoTutor.nombre} onChange={e => setFormData(prev => ({ ...prev, datosMenor: { ...prev.datosMenor, nuevoTutor: { ...prev.datosMenor.nuevoTutor, nombre: e.target.value } } }))} />
                            <input required placeholder="Apellido Tutor" className="input input-bordered input-sm bg-white" value={formData.datosMenor.nuevoTutor.apellido} onChange={e => setFormData(prev => ({ ...prev, datosMenor: { ...prev.datosMenor, nuevoTutor: { ...prev.datosMenor.nuevoTutor, apellido: e.target.value } } }))} />
                          </div>
                          <input required placeholder="Teléfono" className="input input-bordered input-sm bg-white font-bold" value={formData.datosMenor.nuevoTutor.telefono} onChange={e => setFormData(prev => ({ ...prev, datosMenor: { ...prev.datosMenor, nuevoTutor: { ...prev.datosMenor.nuevoTutor, telefono: e.target.value } } }))} maxLength={8} />
                          <select required className="select select-bordered select-sm bg-white" value={formData.datosMenor.nuevoTutor.parentescoId} onChange={e => setFormData(prev => ({ ...prev, datosMenor: { ...prev.datosMenor, nuevoTutor: { ...prev.datosMenor.nuevoTutor, parentescoId: e.target.value } } }))}>
                            <option value="">¿Relación con menor?</option>
                            {catalogos.parentescos?.map((p: any) => <option key={p.ID_Parentesco} value={p.ID_Parentesco}>{p.Nombre_De_Parentesco}</option>)}
                          </select>
                          <div className="grid grid-cols-2 gap-3">
                            <select required className="select select-bordered select-sm bg-white" value={formData.datosMenor.nuevoTutor.ocupacionId} onChange={e => setFormData(prev => ({ ...prev, datosMenor: { ...prev.datosMenor, nuevoTutor: { ...prev.datosMenor.nuevoTutor, ocupacionId: e.target.value } } }))}>
                               <option value="">Ocupación...</option>
                               {catalogos.ocupaciones?.map((o: any) => <option key={o.ID_Ocupacion} value={o.ID_Ocupacion}>{o.Nombre_DeOcupacion}</option>)}
                            </select>
                            <select required className="select select-bordered select-sm bg-white" value={formData.datosMenor.nuevoTutor.estadoCivilId} onChange={e => setFormData(prev => ({ ...prev, datosMenor: { ...prev.datosMenor, nuevoTutor: { ...prev.datosMenor.nuevoTutor, estadoCivilId: e.target.value } } }))}>
                               <option value="">E. Civil...</option>
                               {catalogos.estadosCiviles?.map((ec: any) => <option key={ec.ID_EstadoCivil} value={ec.ID_EstadoCivil}>{ec.Nombre_EstadoCivil}</option>)}
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>

        <div className="px-8 py-5 border-t flex justify-end gap-3 bg-white shrink-0">
          <button type="button" className="btn btn-ghost px-8 font-bold text-slate-400 hover:bg-slate-100 rounded-xl" onClick={handleManualClose}>CANCELAR</button>
          <button type="submit" form="form-paciente" className={`btn px-12 text-white shadow-xl font-bold rounded-xl transition-all ${esAdulto ? 'bg-blue-600 hover:bg-blue-700' : 'bg-amber-600 hover:bg-amber-700'}`} disabled={guardando}>
            {guardando ? 'GUARDANDO...' : (pacienteEditar ? 'ACTUALIZAR' : 'GUARDAR')}
          </button>
        </div>
      </div>
    </div>,
    document.getElementById('modal-root')!
  );
}