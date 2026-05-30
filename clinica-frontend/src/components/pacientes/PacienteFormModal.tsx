import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { Paciente, CreatePacienteDTO, Ocupacion, EstadoCivil, Parentesco, Tutor, Pais, Municipio, Departamento } from '../../types';
// import type { DireccionPaciente } from '../../types/index';

interface CatalogosProps {
  ocupaciones: Ocupacion[];
  estadosCiviles: EstadoCivil[];
  parentescos: Parentesco[];
  listaTutores: Tutor[];
  paises: Pais[];
  departamentos: Departamento[];
  municipios: Municipio[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePacienteDTO, isEdit: boolean) => Promise<boolean | void>;
  pacienteEditar: Paciente | null;
  catalogos: CatalogosProps;
}

const Icons = {
    User: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" /></svg>,
    Users: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M7 10a2 2 0 11-4 0 2 2 0 014 0zM17 10a2 2 0 11-4 0 2 2 0 014 0zM12.69 3.516c.15.118.35.25.59.25h1.66c.24 0 .44-.132.59-.25l2.457-1.996a.75.75 0 00-.913-1.134L14.5 2.115V1.75A.75.75 0 0013.75 1h-7.5a.75.75 0 00-.75.75v.365L2.306.386a.75.75 0 00-.913 1.134l2.457 1.996c.15.118.35.25.59.25h1.66c.24 0 .44-.132.59-.25L12.69 3.516z" /></svg>
};

const initialState = {
  nombre: '', apellido: '', fechaNac: '', genero: 'Masculino',
  activo: true, 
  paisId: '', // ID temporal para Nicaragua
  direccion: { departamentoId: '', municipioId: '', barrio: '', calle: '' },
  datosAdulto: { cedula: '', telefono: '', ocupacionId: '', estadoCivilId: '' },
  datosMenor: { 
    partNacimiento: '', grado: '', tutorId: '', modoTutor: 'existente' as 'existente' | 'nuevo',
    nuevoTutor: { 
      nombre: '', apellido: '', cedula: '', telefono: '', parentescoId: '', 
      ocupacionId: '', estadoCivilId: '', 
      direccion: { departamentoId: '', municipioId: '', barrio: '', calle: '' }
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

const esCedulaValida = (cedula: string) => /^\d{3}-\d{6}-\d{4}[A-Z]$/.test(cedula);
const esTelefonoValido = (tel: string) => /^[2578]\d{7}$/.test(tel.replace(/[\s-]/g, ''));
const esTextoValido = (texto: string) => /^[a-zA-Z\u00C0-\u017F\s]+$/.test(texto);

export default function PacienteFormModal({ isOpen, onClose, onSubmit, pacienteEditar, catalogos }: Props) {
  const [formData, setFormData] = useState(initialState);
  const [esAdulto, setEsAdulto] = useState(true);
  const [modoTutor, setModoTutor] = useState<'existente' | 'nuevo'>('existente');
  const [busquedaTutor, setBusquedaTutor] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (pacienteEditar) {
      // 1. Extraemos de forma segura el tutor desde el arreglo de la tabla intermedia M:N
      // Buscamos primero al que tenga 'Es_Contacto_Principal', si no, tomamos el primero disponible
      const relacionTutor = pacienteEditar.Paciente_Menor?.Tutor_PacienteMenor?.find(
        (t: { Es_Contacto_Principal?: boolean | null }) => t.Es_Contacto_Principal === true
      ) || pacienteEditar.Paciente_Menor?.Tutor_PacienteMenor?.[0];

      // 2. Sincronizamos los estados booleanos del componente
      const esPacienteAdulto = pacienteEditar.PacienteAdulto != null;
      setEsAdulto(esPacienteAdulto);
      
      if (!esPacienteAdulto) {
        setModoTutor('existente'); // Forzamos la pestaña de "Buscar" al editar un menor
      }

      // 3. Llenamos el formData con toda la estructura relacional limpia
      setFormData({
        nombre: pacienteEditar.Nombre,
        apellido: pacienteEditar.Apellido,
        fechaNac: pacienteEditar.Fecha_Nacimiento ? new Date(pacienteEditar.Fecha_Nacimiento).toISOString().split('T')[0] : '',
        genero: pacienteEditar.Genero,
        activo: pacienteEditar.Activo !== false,
        paisId: pacienteEditar.ID_Pais?.toString() || '',
        
        direccion: pacienteEditar.Direccion ? {
          departamentoId: pacienteEditar.Direccion.Municipio?.ID_Departamento?.toString() || '',
          municipioId: pacienteEditar.Direccion.ID_Municipio?.toString() || '',
          barrio: pacienteEditar.Direccion.Barrio || '',
          calle: pacienteEditar.Direccion.Calle || ''
        } : initialState.direccion,

        datosAdulto: pacienteEditar.PacienteAdulto ? {
          cedula: pacienteEditar.PacienteAdulto.No_Cedula,
          telefono: pacienteEditar.PacienteAdulto.No_Telefono,
          ocupacionId: pacienteEditar.PacienteAdulto.ID_Ocupacion.toString(),
          estadoCivilId: pacienteEditar.PacienteAdulto.ID_EstadoCivil.toString(),
        } : initialState.datosAdulto,

        datosMenor: pacienteEditar.Paciente_Menor ? {
          partNacimiento: pacienteEditar.Paciente_Menor.PartidaDeNacimiento,
          grado: pacienteEditar.Paciente_Menor.Grado_Escolar || '',
          modoTutor: 'existente',
          tutorId: relacionTutor?.ID_Tutor?.toString() || '', // 👈 ¡AQUÍ ESTÁ LA MAGIA! Cargamos el ID del tutor
          nuevoTutor: initialState.datosMenor.nuevoTutor
        } : initialState.datosMenor
      });
    } else {
      // Si no estamos editando, reiniciamos al estado inicial limpio
      setFormData(initialState);
      setModoTutor('existente');
      setEsAdulto(true);
    }
  }, [pacienteEditar]);

  const handleTextoChange = (field: string, value: string) => {
    if (value === '' || esTextoValido(value)) setFormData({ ...formData, [field]: value });
  };

  const updateDatosAdulto = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, datosAdulto: { ...prev.datosAdulto, [field]: value } }));
  };

  const updateDatosMenor = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, datosMenor: { ...prev.datosMenor, [field]: value } }));
  };

  const updateNuevoTutor = (field: string, value: string) => {
    if ((field === 'nombre' || field === 'apellido') && value !== '' && !esTextoValido(value)) return;
    setFormData(prev => ({
      ...prev,
      datosMenor: { ...prev.datosMenor, nuevoTutor: { ...prev.datosMenor.nuevoTutor, [field]: value } }
    }));
  };

  const updateDireccionTutor = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      datosMenor: {
        ...prev.datosMenor,
        nuevoTutor: { ...prev.datosMenor.nuevoTutor, direccion: { ...prev.datosMenor.nuevoTutor.direccion, [field]: value } }
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
    
    if (!esTextoValido(formData.nombre) || !esTextoValido(formData.apellido)) {
        return toast.error("El nombre y apellido no pueden contener números ni símbolos.");
    }

    if (esAdulto) {
       if (!esCedulaValida(formData.datosAdulto.cedula)) return toast.error("La cédula del paciente es inválida (XXX-XXXXXX-XXXXL)");
       if (formData.datosAdulto.telefono && !esTelefonoValido(formData.datosAdulto.telefono)) return toast.error("Teléfono inválido. Debe ser 8 dígitos.");
    } else if (modoTutor === 'nuevo') {
       if (!esCedulaValida(formData.datosMenor.nuevoTutor.cedula)) return toast.error("La cédula del tutor es inválida");
       if (formData.datosMenor.nuevoTutor.telefono && !esTelefonoValido(formData.datosMenor.nuevoTutor.telefono)) return toast.error("Teléfono del tutor inválido.");
       
       const nuevoT = formData.datosMenor.nuevoTutor;
       if (!esTextoValido(nuevoT.nombre) || !esTextoValido(nuevoT.apellido)) return toast.error("El nombre del tutor no debe tener números.");
       if (!nuevoT.ocupacionId || !nuevoT.estadoCivilId || !nuevoT.parentescoId) return toast.error("Debe completar Ocupación, Estado Civil y Parentesco del Tutor.");
    }

    // El payload exacto que exige paciente.service.ts
    const payload = {
      nombre: formData.nombre,
      apellido: formData.apellido,
      fechaNac: formData.fechaNac,
      genero: formData.genero,
      activo: formData.activo,
      paisId: Number(formData.paisId), 
      direccion: {
          municipioId: Number(formData.direccion.municipioId),
          barrio: formData.direccion.barrio || 'Sin especificar',
          calle: formData.direccion.calle || ''
      },
      esAdulto: esAdulto,
      datosAdulto: esAdulto ? {
          cedula: formData.datosAdulto.cedula,
          codigoTelefonoId: 1, // ID temporal para +505
          telefono: formData.datosAdulto.telefono,
          ocupacionId: Number(formData.datosAdulto.ocupacionId),
          estadoCivilId: Number(formData.datosAdulto.estadoCivilId)
      } : undefined,
      datosMenor: !esAdulto ? {
          partNacimiento: formData.datosMenor.partNacimiento,
          grado: formData.datosMenor.grado,
          modoTutor: modoTutor,
          tutorId: formData.datosMenor.tutorId ? Number(formData.datosMenor.tutorId) : undefined,
          nuevoTutor: modoTutor === 'nuevo' ? {
              ...formData.datosMenor.nuevoTutor,
              codigoTelefonoId: 1, // ID temporal para +505
              ocupacionId: Number(formData.datosMenor.nuevoTutor.ocupacionId),
              estadoCivilId: Number(formData.datosMenor.nuevoTutor.estadoCivilId),
              parentescoId: Number(formData.datosMenor.nuevoTutor.parentescoId),
              direccion: {
                  municipioId: 1,
                  barrio: formData.datosMenor.nuevoTutor.direccion.barrio || 'Sin especificar',
                  calle: formData.datosMenor.nuevoTutor.direccion.calle || ''
              }
          } : undefined
      } : undefined
    };

    try {
        setGuardando(true);
        const success = await onSubmit(payload, !!pacienteEditar);
        if (success) onClose();
    } catch (error) {
        console.error("Error", error);
    } finally {
        setGuardando(false);
    }
  };

  if (!isOpen) return null;

  const tutoresFiltrados = catalogos.listaTutores ? catalogos.listaTutores.filter((t) => {
    const term = busquedaTutor.toLowerCase();
    const nombre = `${t.Nombre} ${t.Apellido}`.toLowerCase();
    const cedula = t.No_Cedula ? t.No_Cedula.toLowerCase() : ''; 
    return nombre.includes(term) || cedula.includes(term);
  }) : [];

  const isTypeSelectionDisabled = !!pacienteEditar || formData.fechaNac !== '';

  // Coloca esto justo arriba del return (...)
  const municipiosFiltradosPaciente = catalogos.municipios?.filter(
    (m) => m.ID_Departamento === Number(formData.direccion.departamentoId)
  ) || [];

  const municipiosFiltradosTutor = catalogos.municipios?.filter(
    (m) => m.ID_Departamento === Number(formData.datosMenor.nuevoTutor.direccion.departamentoId)
  ) || [];

  return (
    <dialog className="modal modal-open bg-black/50 backdrop-blur-sm">
      <div className="modal-box w-11/12 max-w-5xl bg-white p-0 rounded-2xl shadow-2xl">
        
        <div className="bg-slate-800 text-white px-8 py-4 border-b border-slate-200 flex justify-between items-center flex-shrink-0">
          <h3 className="font-bold text-xl font-serif">
            {pacienteEditar ? 'Editar Expediente' : 'Registrar Nuevo Paciente'}
          </h3>
          <button type="button" className="btn btn-sm btn-circle btn-ghost text-slate-200 hover:text-white" onClick={onClose} disabled={guardando}>✕</button>
        </div>
        
        <div className="px-8 py-6 max-h-[75vh] overflow-y-auto bg-slate-50">
          <form onSubmit={handleSubmit} className="space-y-8"> 
            
            <div className="flex justify-center">
              <div className="bg-white p-1 rounded-xl inline-flex relative shadow-lg border border-slate-200">
                <button type="button" 
                  className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${esAdulto ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700' : 'text-slate-500 hover:bg-slate-100'} ${isTypeSelectionDisabled ? 'cursor-not-allowed opacity-60' : ''}`}
                  onClick={()=> !isTypeSelectionDisabled && setEsAdulto(true)} 
                  disabled={isTypeSelectionDisabled}>
                  <Icons.User /> PACIENTE ADULTO
                </button>
                <button type="button" 
                  className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${!esAdulto ? 'bg-amber-600 text-white shadow-md hover:bg-amber-700' : 'text-slate-500 hover:bg-slate-100'} ${isTypeSelectionDisabled ? 'cursor-not-allowed opacity-60' : ''}`}
                  onClick={()=> !isTypeSelectionDisabled && setEsAdulto(false)} 
                  disabled={isTypeSelectionDisabled}>
                  <Icons.User /> PACIENTE MENOR
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* COLUMNA IZQUIERDA: INFORMACIÓN GENERAL Y DIRECCIÓN */}
              <div className="lg:col-span-5 space-y-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="font-bold text-slate-800 uppercase text-sm tracking-wide border-b border-blue-500/30 pb-2 flex items-center gap-2">
                  <Icons.User /> Información General
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <input required type="text" placeholder="Nombre" className="input input-bordered bg-slate-50 w-full" value={formData.nombre} onChange={e => handleTextoChange('nombre', e.target.value)} />
                  <input required type="text" placeholder="Apellido" className="input input-bordered bg-slate-50 w-full" value={formData.apellido} onChange={e => handleTextoChange('apellido', e.target.value)} />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="form-control">
                    <label className="label pt-0 pb-1 text-xs"><span className="label-text-alt text-slate-500">Fecha de Nacimiento</span></label>
                    <input required type="date" className="input input-bordered bg-slate-50 w-full" value={formData.fechaNac} onChange={e => handleFechaNacChange(e.target.value)} />
                  </div>
                  <div className="form-control">
                    <label className="label pt-0 pb-1 text-xs"><span className="label-text-alt text-slate-500">Género</span></label>
                    <select className="select select-bordered bg-slate-50 w-full" value={formData.genero} onChange={e => setFormData({...formData, genero: e.target.value})}>
                      <option value="Masculino">Masculino</option>
                      <option value="Femenino">Femenino</option>
                    </select>
                  </div>
                </div>
                
                {pacienteEditar && (
                  <div className="form-control">
                    <label className="label pt-0 pb-1 text-xs"><span className="label-text font-bold text-slate-500">Estado de Actividad</span></label>
                    <select className="select select-bordered bg-slate-50 w-full" value={formData.activo ? "true" : "false"} onChange={e => setFormData({...formData, activo: e.target.value === "true"})}>
                      <option value="true">Activo</option>
                      <option value="false">Inactivo</option>
                    </select>
                  </div>
                )}

                {/* BLOQUE DE DIRECCIÓN PRINCIPAL ACTUALIZADO CON CASCADA */}
                <div className="pt-4 border-t border-slate-100">
                  <div className="font-bold text-slate-800 uppercase text-sm tracking-wide mb-3 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clipRule="evenodd" /></svg>
                    Dirección Principal
                  </div>
                  <div className="space-y-3">
                    <select 
                      required 
                      className="select select-bordered bg-slate-50 w-full" 
                      value={formData.paisId} 
                      onChange={e => setFormData({
                        ...formData, 
                        paisId: e.target.value,
                        // Al cambiar el país, limpiamos toda la cascada hacia abajo
                        direccion: { ...formData.direccion, departamentoId: '', municipioId: '' }
                      })}
                    >
                      <option value="">1. Seleccione el País...</option>
                      {catalogos.paises?.map((p) => (
                        <option key={p.ID_Pais} value={p.ID_Pais}>{p.Nombre_Pais}</option>
                      ))}
                    </select>

                    <select 
                      required 
                      className="select select-bordered bg-slate-50 w-full" 
                      value={formData.direccion.departamentoId} 
                      onChange={e => setFormData({
                        ...formData, 
                        direccion: {...formData.direccion, departamentoId: e.target.value, municipioId: ''} 
                      })}
                      disabled={!formData.paisId} // <-- BLOQUEO MIENTRAS NO HAYA PAÍS
                    >
                      <option value="">2. Seleccione el Departamento...</option>
                      {catalogos.departamentos?.map((d) => (
                        <option key={d.ID_Departamento} value={d.ID_Departamento}>{d.Nombre_Departamento}</option>
                      ))}
                    </select>

                    <select 
                      required 
                      className="select select-bordered bg-slate-50 w-full" 
                      value={formData.direccion.municipioId} 
                      onChange={e => setFormData({...formData, direccion: {...formData.direccion, municipioId: e.target.value}})}
                      disabled={!formData.direccion.departamentoId} // Deshabilita si no hay departamento
                    >
                      <option value="">3. Seleccione el Municipio...</option>
                      {municipiosFiltradosPaciente.map((m) => (
                        <option key={m.ID_Municipio} value={m.ID_Municipio}>{m.Nombre_Municipio}</option>
                      ))}
                    </select>

                    <input required type="text" placeholder="Barrio" className="input input-bordered bg-slate-50 w-full" value={formData.direccion.barrio} onChange={e => setFormData({...formData, direccion: {...formData.direccion, barrio: e.target.value}})} />
                    <input type="text" placeholder="Calle/Detalle (Opcional)" className="input input-bordered bg-slate-50 w-full" value={formData.direccion.calle} onChange={e => setFormData({...formData, direccion: {...formData.direccion, calle: e.target.value}})} />
                  </div>
                </div>

              </div>

              {/* COLUMNA DERECHA: ADULTO O MENOR */}
              <div className={`lg:col-span-7 pl-0 lg:pl-8 border-t lg:border-t-0 lg:border-l-4 p-6 rounded-xl shadow-sm ${esAdulto ? 'border-blue-200 bg-white' : 'border-amber-200 bg-white'}`}>
                
                {esAdulto ? (
                  <div className="space-y-6 animate-fade-in">
                    <div className="font-bold text-blue-600 uppercase text-sm tracking-wide border-b border-blue-200 pb-2">Detalles del Adulto</div>
                    
                    <input required type="text" placeholder="No. Cédula (XXX-XXXXXX-XXXXL)" className="input input-bordered bg-slate-50 w-full font-mono" value={formData.datosAdulto.cedula} onChange={e => updateDatosAdulto('cedula', formatearCedula(e.target.value))} maxLength={16} />
                    <input type="text" placeholder="Teléfono (8 dígitos)" className="input input-bordered bg-slate-50 w-full" value={formData.datosAdulto.telefono} onChange={e => updateDatosAdulto('telefono', e.target.value)} maxLength={8} />
                    <div className="grid grid-cols-2 gap-3">
                      <select required className="select select-bordered bg-slate-50 w-full" value={formData.datosAdulto.ocupacionId} onChange={e => updateDatosAdulto('ocupacionId', e.target.value)}>
                          <option value="">Ocupación...</option>
                          {catalogos.ocupaciones?.map((o) => <option key={o.ID_Ocupacion} value={o.ID_Ocupacion}>{o.Nombre_DeOcupacion}</option>)}
                      </select>
                      <select required className="select select-bordered bg-slate-50 w-full" value={formData.datosAdulto.estadoCivilId} onChange={e => updateDatosAdulto('estadoCivilId', e.target.value)}>
                          <option value="">Estado Civil...</option>
                          {catalogos.estadosCiviles?.map((ec) => <option key={ec.ID_EstadoCivil} value={ec.ID_EstadoCivil}>{ec.Nombre_EstadoCivil}</option>)}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 animate-fade-in">
                    <div className="font-bold text-amber-600 uppercase text-sm tracking-wide border-b border-amber-200 pb-2">Datos del Menor</div>
                    
                    <div className="grid grid-cols-2 gap-3">
                       <input required type="text" placeholder="Cód. Partida Nacimiento" className="input input-bordered bg-slate-50 w-full" value={formData.datosMenor.partNacimiento} onChange={e => updateDatosMenor('partNacimiento', e.target.value)} />
                       <input type="text" placeholder="Grado Escolar" className="input input-bordered bg-slate-50 w-full" value={formData.datosMenor.grado} onChange={e => updateDatosMenor('grado', e.target.value)} />
                    </div>

                    <div className="bg-amber-50 p-5 rounded-xl border border-amber-200 mt-4">
                      <div className="flex justify-between items-center mb-4 border-b border-amber-200 pb-2">
                          <span className="text-sm font-bold text-slate-800 flex items-center gap-2"><Icons.Users /> TUTOR RESPONSABLE</span>
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
                               {tutoresFiltrados.map((t) => (<option key={t.ID_Tutor} value={t.ID_Tutor}>{t.Nombre} {t.Apellido} - {t.No_Cedula}</option>))}
                             </select>
                          </div>
                      ) : (
                          <div className="space-y-3 animate-fade-in">
                             <div className="grid grid-cols-2 gap-2">
                               <input required={modoTutor === 'nuevo'} type="text" placeholder="Nombre Tutor" className="input input-bordered input-sm w-full bg-white" value={formData.datosMenor.nuevoTutor.nombre} onChange={e => updateNuevoTutor('nombre', e.target.value)} />
                               <input required={modoTutor === 'nuevo'} type="text" placeholder="Apellido Tutor" className="input input-bordered input-sm w-full bg-white" value={formData.datosMenor.nuevoTutor.apellido} onChange={e => updateNuevoTutor('apellido', e.target.value)} />
                             </div>
                             <div className="grid grid-cols-2 gap-2">
                               <input required={modoTutor === 'nuevo'} type="text" placeholder="Cédula Tutor" className="input input-bordered input-sm w-full bg-white font-mono" value={formData.datosMenor.nuevoTutor.cedula} maxLength={16} onChange={e => updateNuevoTutor('cedula', formatearCedula(e.target.value))} />
                               <input type="text" placeholder="Teléfono Tutor" className="input input-bordered input-sm w-full bg-white" value={formData.datosMenor.nuevoTutor.telefono} onChange={e => updateNuevoTutor('telefono', e.target.value)} maxLength={8} />
                             </div>
                             <div className="grid grid-cols-2 gap-2">
                                <select required={modoTutor === 'nuevo'} className="select select-bordered select-sm bg-white" value={formData.datosMenor.nuevoTutor.parentescoId} onChange={e => updateNuevoTutor('parentescoId', e.target.value)}><option value="">Parentesco...</option>{catalogos.parentescos?.map((p) => <option key={p.ID_Parentesco} value={p.ID_Parentesco}>{p.Nombre_De_Parentesco}</option>)}</select>
                                <select required={modoTutor === 'nuevo'} className="select select-bordered select-sm bg-white" value={formData.datosMenor.nuevoTutor.ocupacionId} onChange={e => updateNuevoTutor('ocupacionId', e.target.value)}><option value="">Ocupación...</option>{catalogos.ocupaciones?.map((o) => <option key={o.ID_Ocupacion} value={o.ID_Ocupacion}>{o.Nombre_DeOcupacion}</option>)}</select>
                             </div>
                             <select required={modoTutor === 'nuevo'} className="select select-bordered select-sm w-full bg-white" value={formData.datosMenor.nuevoTutor.estadoCivilId} onChange={e => updateNuevoTutor('estadoCivilId', e.target.value)}><option value="">Estado Civil...</option>{catalogos.estadosCiviles?.map((ec) => <option key={ec.ID_EstadoCivil} value={ec.ID_EstadoCivil}>{ec.Nombre_EstadoCivil}</option>)}</select>
                             
                             {/* DIRECCIÓN DEL TUTOR ACTUALIZADA CON CASCADA */}
                             <div className="border-t border-amber-200/50 pt-2 mt-2">
                               <span className="text-xs font-bold text-amber-700 mb-2 block">Dirección del Tutor</span>
                               
                               <select 
                                 required={modoTutor === 'nuevo'} 
                                 className="select select-bordered select-sm w-full bg-white mb-2" 
                                 value={formData.datosMenor.nuevoTutor.direccion.departamentoId} 
                                 onChange={e => setFormData(prev => ({
                                   ...prev, 
                                   datosMenor: {
                                     ...prev.datosMenor, 
                                     nuevoTutor: {
                                       ...prev.datosMenor.nuevoTutor, 
                                       direccion: {
                                         ...prev.datosMenor.nuevoTutor.direccion, 
                                         departamentoId: e.target.value, 
                                         municipioId: '' // Limpia el municipio
                                       }
                                     }
                                   }
                                 }))}
                               >
                                 <option value="">1. Seleccione el Departamento...</option>
                                 {catalogos.departamentos?.map((d) => (
                                   <option key={d.ID_Departamento} value={d.ID_Departamento}>{d.Nombre_Departamento}</option>
                                 ))}
                               </select>

                               <select 
                                 required={modoTutor === 'nuevo'} 
                                 className="select select-bordered select-sm w-full bg-white mb-2" 
                                 value={formData.datosMenor.nuevoTutor.direccion.municipioId} 
                                 onChange={e => updateDireccionTutor('municipioId', e.target.value)}
                                 disabled={!formData.datosMenor.nuevoTutor.direccion.departamentoId}
                               >
                                 <option value="">2. Seleccione el Municipio...</option>
                                 {municipiosFiltradosTutor.map((m) => (
                                   <option key={m.ID_Municipio} value={m.ID_Municipio}>{m.Nombre_Municipio}</option>
                                 ))}
                               </select>

                               <div className="grid grid-cols-2 gap-2">
                                  <input required={modoTutor === 'nuevo'} type="text" placeholder="Barrio" className="input input-bordered input-sm w-full bg-white" value={formData.datosMenor.nuevoTutor.direccion.barrio} onChange={e => updateDireccionTutor('barrio', e.target.value)} />
                                  <input type="text" placeholder="Calle (Opcional)" className="input input-bordered input-sm w-full bg-white" value={formData.datosMenor.nuevoTutor.direccion.calle} onChange={e => updateDireccionTutor('calle', e.target.value)} />
                               </div>
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
              <button type="submit" className="btn btn-primary text-white px-8 shadow-md" disabled={guardando}>
                {guardando ? 'Guardando...' : (pacienteEditar ? 'Actualizar Cambios' : 'Guardar Paciente')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </dialog>
  );
}