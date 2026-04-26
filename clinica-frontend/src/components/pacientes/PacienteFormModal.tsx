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

const Icons = {
    User: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" /></svg>,
    MapPin: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M9.69 18.283L4.85 13.44a6.5 6.5 0 119.34-9.34 6.5 6.5 0 01-9.34 9.34l-4.847 4.847a.75.75 0 01-1.06 0z" clipRule="evenodd" /></svg>,
    Users: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M7 10a2 2 0 11-4 0 2 2 0 014 0zM17 10a2 2 0 11-4 0 2 2 0 014 0zM12.69 3.516c.15.118.35.25.59.25h1.66c.24 0 .44-.132.59-.25l2.457-1.996a.75.75 0 00-.913-1.134L14.5 2.115V1.75A.75.75 0 0013.75 1h-7.5a.75.75 0 00-.75.75v.365L2.306.386a.75.75 0 00-.913 1.134l2.457 1.996c.15.118.35.25.59.25h1.66c.24 0 .44-.132.59-.25L12.69 3.516z" /></svg>
};

const initialState = {
  nombre: '', apellido: '', fechaNac: '', genero: 'Masculino', nacionalidad: 'Nicaragüense',
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

const formatearCedula = (valor: string) => {
  let v = valor.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (v.length > 14) v = v.slice(0, 14);
  if (v.length > 9) return `${v.slice(0, 3)}-${v.slice(3, 9)}-${v.slice(9)}`;
  if (v.length > 3) return `${v.slice(0, 3)}-${v.slice(3)}`;
  return v;
};

// Validaciones de formato
const esCedulaValida = (cedula: string) => /^\d{3}-\d{6}-\d{4}[A-Z]$/.test(cedula);
const esTelefonoValido = (tel: string) => /^[2578]\d{7}$/.test(tel.replace(/[\s-]/g, ''));

export default function PacienteFormModal({ isOpen, onClose, onSubmit, pacienteEditar, catalogos }: Props) {
  const [formData, setFormData] = useState(initialState);
  const [esAdulto, setEsAdulto] = useState(true);
  const [modoTutor, setModoTutor] = useState<'existente' | 'nuevo'>('existente');
  const [busquedaTutor, setBusquedaTutor] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (pacienteEditar) {
      setEsAdulto(!!pacienteEditar.PacienteAdulto);
      setFormData({
        ...initialState,
        nombre: pacienteEditar.Nombre,
        apellido: pacienteEditar.Apellido,
        fechaNac: pacienteEditar.Fecha_Nacimiento ? pacienteEditar.Fecha_Nacimiento.split('T')[0] : '',
        genero: pacienteEditar.Genero,
        nacionalidad: pacienteEditar.Nacionalidad,
        direccion: pacienteEditar.Direccion ? {
          departamento: pacienteEditar.Direccion.Departamento,
          ciudad: pacienteEditar.Direccion.Ciudad,
          barrio: pacienteEditar.Direccion.Barrio,
          calle: pacienteEditar.Direccion.Calle
        } : initialState.direccion,
        datosAdulto: pacienteEditar.PacienteAdulto ? {
          cedula: pacienteEditar.PacienteAdulto.No_Cedula,
          telefono: pacienteEditar.PacienteAdulto.No_Telefono,
          ocupacionId: pacienteEditar.PacienteAdulto.ID_Ocupacion.toString(),
          estadoCivilId: pacienteEditar.PacienteAdulto.ID_EstadoCivil.toString()
        } : initialState.datosAdulto,
        datosMenor: {
          ...initialState.datosMenor,
          partNacimiento: pacienteEditar.Paciente_Menor?.PartidaDeNacimiento || '',
          grado: pacienteEditar.Paciente_Menor?.Grado_Escolar || '',
          tutorId: pacienteEditar.Paciente_Menor?.Tutor_PacienteMenor?.[0]?.ID_Tutor.toString() || '' 
        }
      });
    } else {
      setFormData(initialState);
    }
  }, [pacienteEditar, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 🟢 USO DE TOAST PARA VALIDACIÓN PRE-ENVÍO (Quita el error 6133)
    if (!formData.nombre.trim() || !formData.apellido.trim()) {
        return toast.error("El nombre y apellido son obligatorios.");
    }

    if (esAdulto) {
        if (!esCedulaValida(formData.datosAdulto.cedula)) {
            return toast.error("Formato de cédula inválido (000-000000-0000X).");
        }
        // 🟢 AGREGAMOS ESTA LÍNEA PARA USAR LA FUNCIÓN:
        if (formData.datosAdulto.telefono && !esTelefonoValido(formData.datosAdulto.telefono)) {
            return toast.error("El teléfono debe tener 8 dígitos y empezar con 2, 5, 7 u 8.");
        }
        if (!formData.datosAdulto.ocupacionId) {
            return toast.error("Seleccione la ocupación del paciente.");
        }
    } else {
        if (!formData.datosMenor.partNacimiento.trim()) {
            return toast.error("La partida de nacimiento es obligatoria para menores.");
        }
        if (modoTutor === 'existente' && !formData.datosMenor.tutorId) {
            return toast.error("Debe seleccionar un tutor existente.");
        }
        if (modoTutor === 'nuevo' && !formData.datosMenor.nuevoTutor.nombre) {
            return toast.error("Complete los datos del nuevo tutor.");
        }
    }
    
    const payload: CreatePacienteDTO = {
      nombre: formData.nombre,
      apellido: formData.apellido,
      fechaNac: formData.fechaNac,
      genero: formData.genero,
      nacionalidad: formData.nacionalidad,
      direccion: { pais: 'Nicaragua', ...formData.direccion },
      esAdulto: esAdulto,
      datosAdulto: esAdulto ? {
          cedula: formData.datosAdulto.cedula,
          telefono: formData.datosAdulto.telefono,
          ocupacionId: parseInt(formData.datosAdulto.ocupacionId) || 0,
          estadoCivilId: parseInt(formData.datosAdulto.estadoCivilId) || 0
      } : undefined,
      datosMenor: !esAdulto ? {
          partNacimiento: formData.datosMenor.partNacimiento,
          grado: formData.datosMenor.grado,
          modoTutor: modoTutor,
          tutorId: formData.datosMenor.tutorId ? parseInt(formData.datosMenor.tutorId) : undefined,
          parentescoId: modoTutor === 'nuevo' ? (parseInt(formData.datosMenor.nuevoTutor.parentescoId) || 0) : 0, 
          nuevoTutor: modoTutor === 'nuevo' ? {
              ...formData.datosMenor.nuevoTutor,
              parentescoId: parseInt(formData.datosMenor.nuevoTutor.parentescoId) || 0,
              ocupacionId: parseInt(formData.datosMenor.nuevoTutor.ocupacionId) || 0,
              estadoCivilId: parseInt(formData.datosMenor.nuevoTutor.estadoCivilId) || 0
          } : undefined
      } : undefined
    };

    setGuardando(true);
    const success = await onSubmit(payload, !!pacienteEditar);
    if (success) onClose();
    setGuardando(false);
  };

  if (!isOpen) return null;

  const tutoresFiltrados = catalogos.listaTutores?.filter((t: any) => {
    const term = busquedaTutor.toLowerCase();
    return `${t.Nombre} ${t.Apellido}`.toLowerCase().includes(term) || t.No_Cedula.includes(term);
  }) || [];

  return (
    <dialog className="modal modal-open bg-black/50 backdrop-blur-sm transition-all duration-200">
      <div className="modal-box w-11/12 max-w-5xl bg-white p-0 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="bg-slate-800 text-white px-8 py-4 flex justify-between items-center">
          <h3 className="font-bold text-xl font-serif">{pacienteEditar ? '✏️ Editar Expediente' : '👤 Registrar Nuevo Paciente'}</h3>
          <button type="button" className="btn btn-sm btn-circle btn-ghost" onClick={onClose} disabled={guardando}>✕</button>
        </div>
        <div className="px-8 py-6 overflow-y-auto bg-slate-50 flex-1">
          <form onSubmit={handleSubmit} className="space-y-8"> 
            <div className="flex justify-center">
              <div className="bg-white p-1 rounded-xl inline-flex shadow-lg border border-slate-200">
                <button type="button" className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${esAdulto ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500'}`} onClick={()=> !pacienteEditar && setEsAdulto(true)}>ADULTO</button>
                <button type="button" className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${!esAdulto ? 'bg-amber-600 text-white shadow-md' : 'text-slate-500'}`} onClick={()=> !pacienteEditar && setEsAdulto(false)}>MENOR</button>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-5 space-y-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="font-bold text-slate-800 uppercase text-xs tracking-wide flex items-center gap-2 mb-2"><Icons.User /> Básicos</div>
                <div className="grid grid-cols-2 gap-3">
                  <input required placeholder="Nombre" className="input input-bordered bg-slate-50" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
                  <input required placeholder="Apellido" className="input input-bordered bg-slate-50" value={formData.apellido} onChange={e => setFormData({...formData, apellido: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="form-control">
                    <label className="label-text text-[10px] uppercase font-bold text-slate-400">Nacimiento</label>
                    <input required type="date" className="input input-bordered bg-slate-50" value={formData.fechaNac} onChange={e => setFormData({...formData, fechaNac: e.target.value})} />
                  </div>
                  <div className="form-control">
                    <label className="label-text text-[10px] uppercase font-bold text-slate-400">Género</label>
                    <select className="select select-bordered bg-slate-50" value={formData.genero} onChange={e => setFormData({...formData, genero: e.target.value})}><option value="Masculino">Masculino</option><option value="Femenino">Femenino</option></select>
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <div className="font-bold text-slate-800 uppercase text-xs tracking-wide flex items-center gap-2"><Icons.MapPin /> Dirección</div>
                  <div className="grid grid-cols-2 gap-2">
                    <input placeholder="Departamento" className="input input-bordered input-sm" value={formData.direccion.departamento} onChange={e => setFormData({...formData, direccion: {...formData.direccion, departamento: e.target.value}})} />
                    <input placeholder="Ciudad" className="input input-bordered input-sm" value={formData.direccion.ciudad} onChange={e => setFormData({...formData, direccion: {...formData.direccion, ciudad: e.target.value}})} />
                  </div>
                  <input placeholder="Barrio" className="input input-bordered input-sm w-full" value={formData.direccion.barrio} onChange={e => setFormData({...formData, direccion: {...formData.direccion, barrio: e.target.value}})} />
                  <textarea placeholder="Calle/Punto de referencia" className="textarea textarea-bordered textarea-sm w-full h-20" value={formData.direccion.calle} onChange={e => setFormData({...formData, direccion: {...formData.direccion, calle: e.target.value}})} />
                </div>
              </div>
              <div className={`lg:col-span-7 p-6 rounded-xl border-2 bg-white ${esAdulto ? 'border-blue-100' : 'border-amber-100'}`}>
                {esAdulto ? (
                  <div className="space-y-4">
                    <div className="font-bold text-blue-600 uppercase text-xs mb-4">Detalles Adulto</div>
                    <input required placeholder="Cédula (000-000000-0000X)" className="input input-bordered w-full font-mono" value={formData.datosAdulto.cedula} onChange={e => setFormData({...formData, datosAdulto: {...formData.datosAdulto, cedula: formatearCedula(e.target.value)}})} maxLength={16} />
                    <input placeholder="Teléfono" className="input input-bordered w-full" value={formData.datosAdulto.telefono} onChange={e => setFormData({...formData, datosAdulto: {...formData.datosAdulto, telefono: e.target.value}})} maxLength={8} />
                    <div className="grid grid-cols-2 gap-3">
                      <select required className="select select-bordered" value={formData.datosAdulto.ocupacionId} onChange={e => setFormData({...formData, datosAdulto: {...formData.datosAdulto, ocupacionId: e.target.value}})}>
                          <option value="">Ocupación...</option>
                          {catalogos.ocupaciones?.map((o: any) => <option key={o.ID_Ocupacion} value={o.ID_Ocupacion}>{o.Nombre_DeOcupacion}</option>)}
                      </select>
                      <select required className="select select-bordered" value={formData.datosAdulto.estadoCivilId} onChange={e => setFormData({...formData, datosAdulto: {...formData.datosAdulto, estadoCivilId: e.target.value}})}>
                          <option value="">Estado Civil...</option>
                          {catalogos.estadosCiviles?.map((ec: any) => <option key={ec.ID_EstadoCivil} value={ec.ID_EstadoCivil}>{ec.Nombre_EstadoCivil}</option>)}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="font-bold text-amber-600 uppercase text-xs mb-4">Datos del Menor</div>
                    <div className="grid grid-cols-2 gap-3">
                       <input required placeholder="Partida Nacimiento" className="input input-bordered w-full" value={formData.datosMenor.partNacimiento} onChange={e => setFormData({...formData, datosMenor: {...formData.datosMenor, partNacimiento: e.target.value}})} />
                       <input placeholder="Grado Escolar" className="input input-bordered w-full" value={formData.datosMenor.grado} onChange={e => setFormData({...formData, datosMenor: {...formData.datosMenor, grado: e.target.value}})} />
                    </div>
                    <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                      <div className="flex justify-between items-center mb-3">
                          <span className="text-xs font-bold text-slate-700">TUTOR</span>
                          {!pacienteEditar && (
                           <div className="tabs tabs-boxed bg-white h-auto p-1">
                              <button type="button" className={`tab tab-xs ${modoTutor==='existente' ? 'tab-active' : ''}`} onClick={()=>setModoTutor('existente')}>Existente</button>
                              <button type="button" className={`tab tab-xs ${modoTutor==='nuevo' ? 'tab-active' : ''}`} onClick={()=>setModoTutor('nuevo')}>Nuevo</button>
                           </div>
                          )}
                      </div>
                      {modoTutor === 'existente' ? (
                        <div className="space-y-2">
                           <input placeholder="Buscar tutor..." className="input input-sm w-full" value={busquedaTutor} onChange={(e) => setBusquedaTutor(e.target.value)} />
                           <select required className="select select-sm w-full" value={formData.datosMenor.tutorId} onChange={e => setFormData({...formData, datosMenor: {...formData.datosMenor, tutorId: e.target.value}})}>
                             <option value="">Seleccione...</option>
                             {tutoresFiltrados.map((t: any) => (<option key={t.ID_Tutor} value={t.ID_Tutor}>{t.Nombre} {t.Apellido}</option>))}
                           </select>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                           <input placeholder="Nombre" className="input input-xs" value={formData.datosMenor.nuevoTutor.nombre} onChange={e => setFormData({...formData, datosMenor: {...formData.datosMenor, nuevoTutor: {...formData.datosMenor.nuevoTutor, nombre: e.target.value}}})} />
                           <input placeholder="Cédula" className="input input-xs font-mono" value={formData.datosMenor.nuevoTutor.cedula} onChange={e => setFormData({...formData, datosMenor: {...formData.datosMenor, nuevoTutor: {...formData.datosMenor.nuevoTutor, cedula: formatearCedula(e.target.value)}}})} maxLength={16} />
                           <select className="select select-xs" value={formData.datosMenor.nuevoTutor.parentescoId} onChange={e => setFormData({...formData, datosMenor: {...formData.datosMenor, nuevoTutor: {...formData.datosMenor.nuevoTutor, parentescoId: e.target.value}}})}>
                              <option value="">Parentesco...</option>
                              {catalogos.parentescos?.map((p:any) => <option key={p.ID_Parentesco} value={p.ID_Parentesco}>{p.Nombre_De_Parentesco}</option>)}
                           </select>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-action p-4 border-t">
              <button type="button" className="btn btn-ghost" onClick={onClose} disabled={guardando}>Cancelar</button>
              <button type="submit" className="btn btn-primary px-10 text-white shadow-md" disabled={guardando}>
                {guardando ? 'Guardando...' : (pacienteEditar ? 'Actualizar Expediente' : 'Guardar Paciente')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </dialog>
  );
}