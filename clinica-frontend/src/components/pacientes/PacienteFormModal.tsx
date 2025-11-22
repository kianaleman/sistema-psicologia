import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { Paciente, CreatePacienteDTO } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePacienteDTO, isEdit: boolean) => Promise<boolean | void>;
  pacienteEditar: Paciente | null;
  catalogos: any;
}

const initialState = {
  nombre: '', apellido: '', fechaNac: '', genero: 'Masculino', nacionalidad: 'Nicaragüense',
  ID_EstadoDeActividad: 1, 
  direccion: { departamento: '', ciudad: '', barrio: '', calle: '' }, 
  datosAdulto: { cedula: '', telefono: '', ocupacionId: '', estadoCivilId: '' },
  datosMenor: { 
    partNacimiento: '', grado: '', tutorId: '',
    nuevoTutor: { 
      nombre: '', apellido: '', cedula: '', telefono: '', parentescoId: '', 
      ocupacionId: '', estadoCivilId: '', 
      direccion: { departamento: '', ciudad: '', barrio: '', calle: '' } 
    }
  }
};

// --- HELPERS GLOBALES ---
const formatearCedula = (valor: string) => {
  let v = valor.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (v.length > 14) v = v.slice(0, 14);
  if (v.length > 9) {
    return `${v.slice(0, 3)}-${v.slice(3, 9)}-${v.slice(9)}`;
  } else if (v.length > 3) {
    return `${v.slice(0, 3)}-${v.slice(3)}`;
  }
  return v;
};

const esCedulaValida = (cedula: string) => {
  const regex = /^\d{3}-\d{6}-\d{4}[A-Z]$/;
  return regex.test(cedula);
};

export default function PacienteFormModal({ isOpen, onClose, onSubmit, pacienteEditar, catalogos }: Props) {
  const [formData, setFormData] = useState(initialState);
  const [esAdulto, setEsAdulto] = useState(true);
  const [modoTutor, setModoTutor] = useState<'existente' | 'nuevo'>('existente');
  const [busquedaTutor, setBusquedaTutor] = useState('');
  const [guardando, setGuardando] = useState(false);

  // --- CARGAR DATOS AL EDITAR ---
  useEffect(() => {
    if (pacienteEditar) {
      const esPacienteAdulto = !!pacienteEditar.PacienteAdulto;
      setEsAdulto(esPacienteAdulto);
      setModoTutor('existente');

      setFormData({
        nombre: pacienteEditar.Nombre,
        apellido: pacienteEditar.Apellido,
        fechaNac: pacienteEditar.Fecha_Nac ? new Date(pacienteEditar.Fecha_Nac).toISOString().split('T')[0] : '',
        genero: pacienteEditar.Genero,
        nacionalidad: pacienteEditar.Nacionalidad,
        ID_EstadoDeActividad: pacienteEditar.EstadoDeActividad?.ID_EstadoDeActividad || 1,
        
        direccion: pacienteEditar.DireccionPaciente ? {
          departamento: pacienteEditar.DireccionPaciente.Departamento,
          ciudad: pacienteEditar.DireccionPaciente.Ciudad,
          barrio: pacienteEditar.DireccionPaciente.Barrio,
          calle: pacienteEditar.DireccionPaciente.Calle
        } : initialState.direccion,
        
        datosAdulto: pacienteEditar.PacienteAdulto ? {
          cedula: pacienteEditar.PacienteAdulto.No_Cedula,
          telefono: pacienteEditar.PacienteAdulto.No_Telefono,
          ocupacionId: pacienteEditar.PacienteAdulto.ID_Ocupacion.toString(),
          estadoCivilId: pacienteEditar.PacienteAdulto.ID_EstadoCivil.toString()
        } : initialState.datosAdulto,
        
        datosMenor: {
          ...initialState.datosMenor,
          partNacimiento: pacienteEditar.PacienteMenor?.PartNacimiento || '',
          grado: pacienteEditar.PacienteMenor?.GradoEscolar || '',
          tutorId: pacienteEditar.PacienteMenor?.ID_Tutor.toString() || '' 
        }
      });
    } else {
      setFormData(initialState);
      setEsAdulto(true);
      setModoTutor('existente');
    }
  }, [pacienteEditar, isOpen]);

  // --- HELPERS DE ACTUALIZACIÓN DE ESTADO (SOLUCIÓN AL ERROR) ---
  const updateDatosAdulto = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      datosAdulto: { ...prev.datosAdulto, [field]: value }
    }));
  };

  const updateDatosMenor = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      datosMenor: { ...prev.datosMenor, [field]: value }
    }));
  };

  const updateNuevoTutor = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      datosMenor: {
        ...prev.datosMenor,
        nuevoTutor: { ...prev.datosMenor.nuevoTutor, [field]: value }
      }
    }));
  };

  const updateDireccionTutor = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      datosMenor: {
        ...prev.datosMenor,
        nuevoTutor: {
          ...prev.datosMenor.nuevoTutor,
          direccion: { ...prev.datosMenor.nuevoTutor.direccion, [field]: value }
        }
      }
    }));
  };

  const handleFechaNacChange = (fecha: string) => {
    setFormData({ ...formData, fechaNac: fecha });
    if (fecha) {
      const hoy = new Date();
      const nacimiento = new Date(fecha);
      let edad = hoy.getFullYear() - nacimiento.getFullYear();
      const mes = hoy.getMonth() - nacimiento.getMonth();
      if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
      setEsAdulto(edad >= 18);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (esAdulto) {
       if (!esCedulaValida(formData.datosAdulto.cedula)) {
          toast.error("La cédula del paciente es inválida (XXX-XXXXXX-XXXXL)");
          return;
       }
    } else if (modoTutor === 'nuevo') {
       if (!esCedulaValida(formData.datosMenor.nuevoTutor.cedula)) {
          toast.error("La cédula del tutor es inválida (XXX-XXXXXX-XXXXL)");
          return;
       }
       const nuevoT = formData.datosMenor.nuevoTutor;
       if (!nuevoT.ocupacionId || !nuevoT.estadoCivilId || !nuevoT.parentescoId) {
          toast.error("Debe completar Ocupación, Estado Civil y Parentesco del Tutor.");
          return;
       }
    }

    const payload: CreatePacienteDTO = {
      nombre: formData.nombre,
      apellido: formData.apellido,
      fechaNac: formData.fechaNac,
      genero: formData.genero,
      nacionalidad: formData.nacionalidad,
      // @ts-ignore
      ID_EstadoDeActividad: formData.ID_EstadoDeActividad,
      direccion: {
          pais: 'Nicaragua',
          ...formData.direccion
      },
      esAdulto: esAdulto,
      datosAdulto: esAdulto ? {
          cedula: formData.datosAdulto.cedula,
          telefono: formData.datosAdulto.telefono,
          ocupacionId: formData.datosAdulto.ocupacionId,
          estadoCivilId: formData.datosAdulto.estadoCivilId
      } : undefined,
      datosMenor: !esAdulto ? {
          partNacimiento: formData.datosMenor.partNacimiento,
          grado: formData.datosMenor.grado,
          modoTutor: modoTutor,
          tutorId: formData.datosMenor.tutorId,
          nuevoTutor: modoTutor === 'nuevo' ? formData.datosMenor.nuevoTutor : undefined
      } : undefined
    };

    try {
        setGuardando(true);
        const success = await onSubmit(payload, !!pacienteEditar);
        if (success) {
            onClose();
        } 
    } catch (error) {
        console.error("Error", error);
    } finally {
        setGuardando(false);
    }
  };

  if (!isOpen) return null;

  const tutoresFiltrados = catalogos.listaTutores ? catalogos.listaTutores.filter((t: any) => {
    const term = busquedaTutor.toLowerCase();
    const nombre = `${t.Nombre} ${t.Apellido}`.toLowerCase();
    return nombre.includes(term) || t.No_Cedula.includes(term);
  }) : [];

  const isTypeSelectionDisabled = !!pacienteEditar || formData.fechaNac !== '';

  return (
    <dialog className="modal modal-open bg-black/50 backdrop-blur-sm">
      <div className="modal-box w-11/12 max-w-5xl bg-white p-0 rounded-2xl shadow-2xl">
        
        <div className="bg-slate-50 px-8 py-4 border-b border-slate-200 flex justify-between items-center">
          <h3 className="font-bold text-lg text-slate-800">
            {pacienteEditar ? 'Editar Paciente' : 'Registrar Nuevo Paciente'}
          </h3>
          <button type="button" className="btn btn-sm btn-circle btn-ghost" onClick={onClose} disabled={guardando}>✕</button>
        </div>
        
        <div className="px-8 py-6 max-h-[75vh] overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-8"> 
            
            <div className="flex justify-center">
              <div className="bg-slate-100 p-1 rounded-lg inline-flex relative">
                <button type="button" 
                  className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${esAdulto ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'} ${isTypeSelectionDisabled ? 'cursor-not-allowed opacity-60' : ''}`}
                  onClick={()=> !isTypeSelectionDisabled && setEsAdulto(true)} 
                  disabled={isTypeSelectionDisabled}>
                  PACIENTE ADULTO
                </button>
                <button type="button" 
                  className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${!esAdulto ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500'} ${isTypeSelectionDisabled ? 'cursor-not-allowed opacity-60' : ''}`}
                  onClick={()=> !isTypeSelectionDisabled && setEsAdulto(false)} 
                  disabled={isTypeSelectionDisabled}>
                  PACIENTE MENOR
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              <div className="lg:col-span-5 space-y-5">
                <div className="flex items-center gap-2 text-slate-400 uppercase text-xs font-bold tracking-widest mb-2"><span className="w-2 h-2 bg-blue-500 rounded-full"></span> Información Básica</div>
                <div className="grid grid-cols-2 gap-3">
                  <input required type="text" placeholder="Nombre" className="input input-bordered bg-white w-full" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
                  <input required type="text" placeholder="Apellido" className="input input-bordered bg-white w-full" value={formData.apellido} onChange={e => setFormData({...formData, apellido: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="form-control">
                    <label className="label pt-0 pb-1"><span className="label-text-alt text-slate-400">Nacimiento</span></label>
                    <input required type="date" className="input input-bordered bg-white w-full" value={formData.fechaNac} onChange={e => handleFechaNacChange(e.target.value)} />
                  </div>
                  <div className="form-control">
                    <label className="label pt-0 pb-1"><span className="label-text-alt text-slate-400">Género</span></label>
                    <select className="select select-bordered bg-white w-full" value={formData.genero} onChange={e => setFormData({...formData, genero: e.target.value})}><option value="Masculino">Masculino</option><option value="Femenino">Femenino</option></select>
                  </div>
                </div>
                
                {pacienteEditar && (
                  <div className="form-control">
                    <label className="label pt-0 pb-1"><span className="label-text font-bold text-slate-500">Estado</span></label>
                    <select className="select select-bordered bg-white w-full" value={formData.ID_EstadoDeActividad} onChange={e => setFormData({...formData, ID_EstadoDeActividad: parseInt(e.target.value)})}>
                      <option value={1}>Activo</option><option value={2}>Inactivo</option>
                    </select>
                  </div>
                )}

                <div className="pt-4">
                    <div className="flex items-center gap-2 text-slate-400 uppercase text-xs font-bold tracking-widest mb-3"><span className="w-2 h-2 bg-slate-400 rounded-full"></span> Dirección</div>
                    <div className="space-y-3">
                      <input type="text" placeholder="Departamento" className="input input-bordered bg-white w-full" value={formData.direccion.departamento} onChange={e => setFormData({...formData, direccion: {...formData.direccion, departamento: e.target.value}})} />
                      <input type="text" placeholder="Ciudad" className="input input-bordered bg-white w-full" value={formData.direccion.ciudad} onChange={e => setFormData({...formData, direccion: {...formData.direccion, ciudad: e.target.value}})} />
                      <input type="text" placeholder="Barrio" className="input input-bordered bg-white w-full" value={formData.direccion.barrio} onChange={e => setFormData({...formData, direccion: {...formData.direccion, barrio: e.target.value}})} />
                      <input type="text" placeholder="Calle" className="input input-bordered bg-white w-full" value={formData.direccion.calle} onChange={e => setFormData({...formData, direccion: {...formData.direccion, calle: e.target.value}})} />
                    </div>
                </div>
              </div>

              <div className={`lg:col-span-7 pl-0 lg:pl-8 border-t lg:border-t-0 lg:border-l-2 ${esAdulto ? 'border-blue-100' : 'border-amber-100'}`}>
                
                {esAdulto ? (
                  <div className="space-y-5 animate-fade-in">
                    <div className="flex items-center gap-2 text-blue-600 uppercase text-xs font-bold tracking-widest">Datos Específicos (Adulto)</div>
                    
                    {/* INPUT CÉDULA ADULTO - USANDO HELPER */}
                    <input 
                        required 
                        type="text" 
                        placeholder="No. Cédula (XXX-XXXXXX-XXXXL)" 
                        className="input input-bordered bg-white w-full font-mono" 
                        value={formData.datosAdulto.cedula} 
                        onChange={e => updateDatosAdulto('cedula', formatearCedula(e.target.value))} 
                        maxLength={16} 
                    />
                    
                    <input type="text" placeholder="Teléfono" className="input input-bordered bg-white w-full" value={formData.datosAdulto.telefono} onChange={e => updateDatosAdulto('telefono', e.target.value)} />
                    <div className="grid grid-cols-2 gap-3">
                      <select required className="select select-bordered bg-white w-full" value={formData.datosAdulto.ocupacionId} onChange={e => updateDatosAdulto('ocupacionId', e.target.value)}>
                          <option value="">Ocupación...</option>
                          {catalogos.ocupaciones?.map((o: any) => <option key={o.ID_Ocupacion} value={o.ID_Ocupacion}>{o.NombreDeOcupacion}</option>)}
                      </select>
                      <select required className="select select-bordered bg-white w-full" value={formData.datosAdulto.estadoCivilId} onChange={e => updateDatosAdulto('estadoCivilId', e.target.value)}>
                          <option value="">Estado Civil...</option>
                          {catalogos.estadosCiviles?.map((ec: any) => <option key={ec.ID_EstadoCivil} value={ec.ID_EstadoCivil}>{ec.NombreEstadoCivil}</option>)}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5 animate-fade-in">
                    <div className="flex items-center gap-2 text-amber-600 uppercase text-xs font-bold tracking-widest">Datos del Menor</div>
                    <div className="grid grid-cols-2 gap-3">
                       <input required type="text" placeholder="Cód. Partida Nacimiento" className="input input-bordered bg-white w-full" value={formData.datosMenor.partNacimiento} onChange={e => updateDatosMenor('partNacimiento', e.target.value)} />
                       <input type="text" placeholder="Grado Escolar" className="input input-bordered bg-white w-full" value={formData.datosMenor.grado} onChange={e => updateDatosMenor('grado', e.target.value)} />
                    </div>

                    <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 mt-4">
                      <div className="flex justify-between items-center mb-4">
                          <span className="text-sm font-bold text-slate-600">TUTOR RESPONSABLE</span>
                          {!pacienteEditar && (
                           <div className="tabs tabs-boxed bg-white p-1 h-auto shadow-sm border border-slate-100">
                              <a className={`tab tab-sm transition-colors ${modoTutor==='existente' ? 'tab-active !bg-slate-800 !text-white' : 'text-slate-500'}`} onClick={()=>setModoTutor('existente')}>Buscar</a>
                              <a className={`tab tab-sm transition-colors ${modoTutor==='nuevo' ? 'tab-active !bg-slate-800 !text-white' : 'text-slate-500'}`} onClick={()=>setModoTutor('nuevo')}>Crear Nuevo</a>
                           </div>
                          )}
                      </div>
                      
                      {modoTutor === 'existente' ? (
                          <div className="space-y-3 animate-fade-in">
                             <input type="text" placeholder="Buscar por nombre, apellido o cédula..." className="input input-bordered w-full bg-white" value={busquedaTutor} onChange={(e) => setBusquedaTutor(e.target.value)} />
                             <select required={modoTutor === 'existente'} className="select select-bordered w-full bg-white" value={formData.datosMenor.tutorId} onChange={e => updateDatosMenor('tutorId', e.target.value)}>
                               <option value="">Seleccione un Tutor ({tutoresFiltrados.length} encontrados)</option>
                               {tutoresFiltrados.map((t: any) => (<option key={t.ID_Tutor} value={t.ID_Tutor}>{t.Nombre} {t.Apellido} - {t.No_Cedula}</option>))}
                             </select>
                          </div>
                      ) : (
                          <div className="space-y-3 animate-fade-in">
                             <div className="grid grid-cols-2 gap-2">
                               <input required={modoTutor === 'nuevo'} type="text" placeholder="Nombre Tutor" className="input input-bordered input-sm w-full bg-white" value={formData.datosMenor.nuevoTutor.nombre} onChange={e => updateNuevoTutor('nombre', e.target.value)} />
                               <input required={modoTutor === 'nuevo'} type="text" placeholder="Apellido Tutor" className="input input-bordered input-sm w-full bg-white" value={formData.datosMenor.nuevoTutor.apellido} onChange={e => updateNuevoTutor('apellido', e.target.value)} />
                             </div>
                             <div className="grid grid-cols-2 gap-2">
                               {/* CÉDULA TUTOR CON MÁSCARA Y HELPER */}
                               <input 
                                    required={modoTutor === 'nuevo'} 
                                    type="text" 
                                    placeholder="Cédula Tutor" 
                                    className="input input-bordered input-sm w-full bg-white font-mono" 
                                    value={formData.datosMenor.nuevoTutor.cedula} 
                                    maxLength={16} 
                                    onChange={e => updateNuevoTutor('cedula', formatearCedula(e.target.value))} 
                                />
                               <input type="text" placeholder="Teléfono Tutor" className="input input-bordered input-sm w-full bg-white" value={formData.datosMenor.nuevoTutor.telefono} onChange={e => updateNuevoTutor('telefono', e.target.value)} />
                             </div>
                             <div className="grid grid-cols-2 gap-2">
                                <select required={modoTutor === 'nuevo'} className="select select-bordered select-sm bg-white" value={formData.datosMenor.nuevoTutor.parentescoId} onChange={e => updateNuevoTutor('parentescoId', e.target.value)}>
                                    <option value="">Parentesco...</option>{catalogos.parentescos?.map((p:any) => <option key={p.ID_Parentesco} value={p.ID_Parentesco}>{p.NombreDeParentesco}</option>)}
                                </select>
                                <select required={modoTutor === 'nuevo'} className="select select-bordered select-sm bg-white" value={formData.datosMenor.nuevoTutor.ocupacionId} onChange={e => updateNuevoTutor('ocupacionId', e.target.value)}>
                                    <option value="">Ocupación...</option>{catalogos.ocupaciones?.map((o:any) => <option key={o.ID_Ocupacion} value={o.ID_Ocupacion}>{o.NombreDeOcupacion}</option>)}
                                </select>
                             </div>
                             <select required={modoTutor === 'nuevo'} className="select select-bordered select-sm w-full bg-white" value={formData.datosMenor.nuevoTutor.estadoCivilId} onChange={e => updateNuevoTutor('estadoCivilId', e.target.value)}>
                                <option value="">Estado Civil...</option>{catalogos.estadosCiviles?.map((ec:any) => <option key={ec.ID_EstadoCivil} value={ec.ID_EstadoCivil}>{ec.NombreEstadoCivil}</option>)}
                             </select>
                             
                             <div className="grid grid-cols-2 gap-2 mt-2">
                                <input type="text" placeholder="Departamento" className="input input-bordered input-sm w-full bg-white" value={formData.datosMenor.nuevoTutor.direccion.departamento} onChange={e => updateDireccionTutor('departamento', e.target.value)} />
                                <input type="text" placeholder="Ciudad" className="input input-bordered input-sm w-full bg-white" value={formData.datosMenor.nuevoTutor.direccion.ciudad} onChange={e => updateDireccionTutor('ciudad', e.target.value)} />
                             </div>
                             <div className="grid grid-cols-2 gap-2">
                                <input type="text" placeholder="Barrio" className="input input-bordered input-sm w-full bg-white" value={formData.datosMenor.nuevoTutor.direccion.barrio} onChange={e => updateDireccionTutor('barrio', e.target.value)} />
                                <input type="text" placeholder="Calle" className="input input-bordered input-sm w-full bg-white" value={formData.datosMenor.nuevoTutor.direccion.calle} onChange={e => updateDireccionTutor('calle', e.target.value)} />
                             </div>
                          </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-action bg-slate-50 px-8 py-4 border-t border-slate-200">
              <button type="button" className="btn btn-ghost hover:bg-slate-100" onClick={onClose} disabled={guardando}>Cancelar</button>
              <button type="submit" className="btn btn-primary text-white px-8" disabled={guardando}>
                {guardando ? 'Guardando...' : (pacienteEditar ? 'Actualizar Cambios' : 'Guardar Paciente')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </dialog>
  );
}