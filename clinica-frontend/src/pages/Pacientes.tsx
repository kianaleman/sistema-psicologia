import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
// USAMOS 'import type' PARA EVITAR ERRORES DE VITE
import type { Tutor, Paciente } from '../types'; 
import { api } from '../services/api';

// --- ESTADO INICIAL ---
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

export default function Pacientes() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  
  // CATÁLOGOS
  const [ocupaciones, setOcupaciones] = useState<any[]>([]);
  const [estadosCiviles, setEstadosCiviles] = useState<any[]>([]);
  const [parentescos, setParentescos] = useState<any[]>([]);
  const [listaTutores, setListaTutores] = useState<Tutor[]>([]);
  
  // FILTROS
  const [busquedaTutor, setBusquedaTutor] = useState('');
  const [busquedaPaciente, setBusquedaPaciente] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'adultos' | 'menores'>('todos');
  const [filtroActividad, setFiltroActividad] = useState<'todos' | 'activos' | 'inactivos'>('todos');

  // FORMULARIO
  const [modoModal, setModoModal] = useState<'nuevo' | 'editar'>('nuevo');
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<Paciente | null>(null);
  const [esAdulto, setEsAdulto] = useState(true);
  const [modoTutor, setModoTutor] = useState<'existente' | 'nuevo'>('existente');
  const [formData, setFormData] = useState(initialState);

  // CARGAR DATOS
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Cargar Pacientes
      const dataPacientes = await api.pacientes.getAll();
      setPacientes(dataPacientes);

      // Cargar Catálogos
      const dataCatalogos = await api.general.catalogos();
      setOcupaciones(dataCatalogos.ocupaciones);
      setEstadosCiviles(dataCatalogos.estadosCiviles);
      setParentescos(dataCatalogos.parentescos);
      setListaTutores(dataCatalogos.tutores);
    } catch (error) {
      console.error("Error cargando datos:", error);
    }
  };

  // --- APERTURA DE MODALES ---
  const handleOpenNuevoModal = () => {
    setModoModal('nuevo');
    setPacienteSeleccionado(null);
    setFormData(initialState); 
    setEsAdulto(true);
    setModoTutor('existente'); 
    (document.getElementById('modal_gestion_paciente') as HTMLDialogElement).showModal();
  };

  const handleOpenEditarModal = (paciente: Paciente) => {
    setModoModal('editar');
    setPacienteSeleccionado(paciente);
    const esPacienteAdulto = paciente.PacienteAdulto !== null;
    setEsAdulto(esPacienteAdulto);
    setModoTutor('existente'); 
    
    setFormData({
      nombre: paciente.Nombre || '',
      apellido: paciente.Apellido || '',
      fechaNac: paciente.Fecha_Nac ? new Date(paciente.Fecha_Nac).toISOString().split('T')[0] : '',
      genero: paciente.Genero || 'Masculino',
      nacionalidad: paciente.Nacionalidad || 'Nicaragüense',
      ID_EstadoDeActividad: paciente.EstadoDeActividad?.ID_EstadoDeActividad || 1,
      
      direccion: paciente.DireccionPaciente ? {
        departamento: paciente.DireccionPaciente.Departamento || '',
        ciudad: paciente.DireccionPaciente.Ciudad || '',
        barrio: paciente.DireccionPaciente.Barrio || '',
        calle: paciente.DireccionPaciente.Calle || ''
      } : initialState.direccion,
      
      datosAdulto: paciente.PacienteAdulto ? {
        cedula: paciente.PacienteAdulto.No_Cedula || '',
        telefono: paciente.PacienteAdulto.No_Telefono || '',
        ocupacionId: paciente.PacienteAdulto.ID_Ocupacion || '',
        estadoCivilId: paciente.PacienteAdulto.ID_EstadoCivil || ''
      } : initialState.datosAdulto,
      
      datosMenor: {
        ...initialState.datosMenor,
        partNacimiento: paciente.PacienteMenor?.PartNacimiento || '',
        grado: paciente.PacienteMenor?.GradoEscolar || '',
        tutorId: paciente.PacienteMenor?.ID_Tutor || '' 
      }
    });
    (document.getElementById('modal_gestion_paciente') as HTMLDialogElement).showModal();
  };

  // --- GUARDAR ---
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      ...formData,
      esAdulto,
      datosMenor: {
        ...formData.datosMenor,
        modoTutor: modoTutor, 
        nuevoTutor: (modoModal === 'nuevo' && modoTutor === 'nuevo') ? formData.datosMenor.nuevoTutor : null 
      }
    };

    try {
      if (modoModal === 'nuevo') {
        await api.pacientes.create(payload);
        alert("✅ Paciente registrado correctamente");
      } else {
        // @ts-ignore
        await api.pacientes.update(pacienteSeleccionado.ID_Paciente, payload);
        alert("✅ Paciente actualizado correctamente");
      }
      
      (document.getElementById('modal_gestion_paciente') as HTMLDialogElement).close();
      loadData(); 
      
    } catch (e: any) { 
      alert("Error: " + e.message); 
    }
  };

  // --- FILTROS ---
  const tutoresFiltrados = listaTutores.filter(tutor => {
    const busquedaLower = busquedaTutor.toLowerCase();
    const nombreCompleto = `${tutor.Nombre} ${tutor.Apellido}`.toLowerCase();
    return nombreCompleto.includes(busquedaLower) || tutor.No_Cedula.includes(busquedaTutor);
  });

  const pacientesFiltrados = pacientes.filter(p => {
    const busquedaLower = busquedaPaciente.toLowerCase().trim();
    
    let pasaBusqueda = true;
    if (busquedaLower) {
      const nombreCompleto = `${p.Nombre} ${p.Apellido}`.toLowerCase();
      const cedula = p.PacienteAdulto?.No_Cedula?.toLowerCase() || '';
      const partida = p.PacienteMenor?.PartNacimiento?.toLowerCase() || '';
      pasaBusqueda = nombreCompleto.includes(busquedaLower) || cedula.includes(busquedaLower) || partida.includes(busquedaLower);
    }

    let pasaTipo = true;
    if (filtroTipo === 'adultos') pasaTipo = p.PacienteAdulto !== null;
    else if (filtroTipo === 'menores') pasaTipo = p.PacienteMenor !== null;

    let pasaActividad = true;
    const estado = p.EstadoDeActividad?.NombreEstadoActividad?.toLowerCase();
    if (filtroActividad === 'activos') pasaActividad = estado === 'activo';
    else if (filtroActividad === 'inactivos') pasaActividad = estado === 'inactivo';

    return pasaBusqueda && pasaTipo && pasaActividad;
  });

  return (
    <div className="p-6 animate-fade-in-up">
      {/* Encabezado */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Expedientes</h1>
          <p className="text-slate-500">Directorio general de pacientes</p>
        </div>
        <button className="btn btn-primary shadow-lg text-white" 
          onClick={handleOpenNuevoModal}> 
          + Nuevo Paciente
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 space-y-4">
        <input 
          type="text" 
          placeholder="Buscar por nombre, cédula o partida de nacimiento..."
          className="input input-bordered w-full bg-slate-50 text-slate-800"
          value={busquedaPaciente}
          onChange={(e) => setBusquedaPaciente(e.target.value)}
        />
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Tipo:</span>
            <div className="join border border-slate-200 rounded-lg p-1 bg-slate-100">
              <button className={`join-item btn btn-sm ${filtroTipo === 'todos' ? 'btn-neutral' : 'btn-ghost'}`} onClick={() => setFiltroTipo('todos')}>Todos</button>
              <button className={`join-item btn btn-sm ${filtroTipo === 'adultos' ? 'btn-neutral' : 'btn-ghost'}`} onClick={() => setFiltroTipo('adultos')}>Adultos</button>
              <button className={`join-item btn btn-sm ${filtroTipo === 'menores' ? 'btn-neutral' : 'btn-ghost'}`} onClick={() => setFiltroTipo('menores')}>Menores</button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Estado:</span>
            <div className="join border border-slate-200 rounded-lg p-1 bg-slate-100">
              <button className={`join-item btn btn-sm ${filtroActividad === 'todos' ? 'btn-neutral' : 'btn-ghost'}`} onClick={() => setFiltroActividad('todos')}>Todos</button>
              <button className={`join-item btn btn-sm ${filtroActividad === 'activos' ? 'btn-neutral' : 'btn-ghost'}`} onClick={() => setFiltroActividad('activos')}>Activos</button>
              <button className={`join-item btn btn-sm ${filtroActividad === 'inactivos' ? 'btn-neutral' : 'btn-ghost'}`} onClick={() => setFiltroActividad('inactivos')}>Inactivos</button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="table w-full">
          <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs tracking-wider">
            <tr><th className="py-4">Nombre / Estado</th><th>Tipo</th><th>Info. Adicional</th><th>Acciones</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pacientesFiltrados.map(p => ( 
              <tr key={p.ID_Paciente} className="hover:bg-slate-50 transition-colors">
                <td>
                  <div className="font-bold text-slate-700">{p.Nombre} {p.Apellido}</div>
                  <span className={`badge badge-xs ${p.EstadoDeActividad?.NombreEstadoActividad === 'Activo' ? 'badge-success' : 'badge-error'} text-white`}>
                    {p.EstadoDeActividad?.NombreEstadoActividad}
                  </span>
                </td>
                <td>
                  {p.PacienteAdulto 
                    ? <span className="badge bg-blue-100 text-blue-700">Adulto</span> 
                    : <span className="badge bg-amber-100 text-amber-700">Menor</span>}
                </td>
                <td className="text-sm text-slate-500">
                   {p.PacienteAdulto 
                     ? `Cédula: ${p.PacienteAdulto.No_Cedula}` 
                     : `Tutor: ${p.PacienteMenor?.Tutor?.No_Cedula || 'N/A'}`
                   }
                </td>
                <td className="space-x-1">
                  <Link 
                    to={`/pacientes/${p.ID_Paciente}`} 
                    className="btn btn-xs btn-outline btn-info">
                    Expediente
                  </Link>
                  <button 
                    className="btn btn-xs btn-outline"
                    onClick={() => handleOpenEditarModal(p)}>
                    Editar
                  </button>
                  {/* BOTÓN ELIMINADO AQUÍ */}
                </td>
              </tr>
            ))}
            {pacientesFiltrados.length === 0 && (
              <tr><td colSpan={5} className="text-center py-8 text-slate-400 italic">No se encontraron pacientes.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Único */}
      <dialog id="modal_gestion_paciente" className="modal modal-bottom sm:modal-middle backdrop-blur-sm">
        <div className="modal-box w-11/12 max-w-5xl bg-white p-0 rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-slate-50 px-8 py-4 border-b border-slate-200 flex justify-between items-center">
            <h3 className="font-bold text-lg text-slate-800">
              {modoModal === 'nuevo' ? 'Registrar Nuevo Paciente' : 'Editar Paciente'}
            </h3>
            <form method="dialog"><button className="btn btn-sm btn-circle btn-ghost">✕</button></form>
          </div>
          <div className="px-8 py-6 max-h-[75vh] overflow-y-auto">
            <form onSubmit={handleFormSubmit} className="space-y-8"> 
              <div className="flex justify-center">
                <div className="bg-slate-100 p-1 rounded-lg inline-flex">
                  <button type="button" className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${esAdulto ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`} onClick={()=>setEsAdulto(true)} disabled={modoModal === 'editar'}>PACIENTE ADULTO</button>
                  <button type="button" className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${!esAdulto ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500'}`} onClick={()=>setEsAdulto(false)} disabled={modoModal === 'editar'}>PACIENTE MENOR</button>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Columna Izquierda */}
                <div className="lg:col-span-5 space-y-5">
                  <div className="flex items-center gap-2 text-slate-400 uppercase text-xs font-bold tracking-widest mb-2"><span className="w-2 h-2 bg-blue-500 rounded-full"></span> Información Básica</div>
                  <div className="grid grid-cols-2 gap-3">
                    <input required type="text" placeholder="Nombre" className="input input-bordered bg-white w-full" value={formData.nombre || ''} onChange={e => setFormData({...formData, nombre: e.target.value})} />
                    <input required type="text" placeholder="Apellido" className="input input-bordered bg-white w-full" value={formData.apellido || ''} onChange={e => setFormData({...formData, apellido: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="form-control">
                      <label className="label pt-0 pb-1"><span className="label-text-alt text-slate-400">Nacimiento</span></label>
                      <input required type="date" className="input input-bordered bg-white w-full" value={formData.fechaNac || ''} onChange={e => setFormData({...formData, fechaNac: e.target.value})} />
                    </div>
                    <div className="form-control">
                      <label className="label pt-0 pb-1"><span className="label-text-alt text-slate-400">Género</span></label>
                      <select className="select select-bordered bg-white w-full" value={formData.genero || 'Masculino'} onChange={e => setFormData({...formData, genero: e.target.value})}>
                        <option value="Masculino">Masculino</option>
                        <option value="Femenino">Femenino</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-control">
                    <label className="label pt-0 pb-1"><span className="label-text font-bold text-slate-500">Estado</span></label>
                    <select className="select select-bordered bg-white w-full" value={formData.ID_EstadoDeActividad || 1} disabled={modoModal === 'nuevo'} onChange={e => setFormData({...formData, ID_EstadoDeActividad: parseInt(e.target.value)})}>
                      <option value={1}>Activo</option>
                      <option value={2}>Inactivo</option>
                    </select>
                  </div>
                  <div className="pt-4">
                     <div className="flex items-center gap-2 text-slate-400 uppercase text-xs font-bold tracking-widest mb-3"><span className="w-2 h-2 bg-slate-400 rounded-full"></span> Dirección</div>
                     <div className="space-y-3">
                       <input type="text" placeholder="Departamento" className="input input-bordered bg-white w-full" value={formData.direccion.departamento || ''} onChange={e => setFormData({...formData, direccion: {...formData.direccion, departamento: e.target.value}})} />
                       <input type="text" placeholder="Ciudad" className="input input-bordered bg-white w-full" value={formData.direccion.ciudad || ''} onChange={e => setFormData({...formData, direccion: {...formData.direccion, ciudad: e.target.value}})} />
                       <input type="text" placeholder="Barrio" className="input input-bordered bg-white w-full" value={formData.direccion.barrio || ''} onChange={e => setFormData({...formData, direccion: {...formData.direccion, barrio: e.target.value}})} />
                       <input type="text" placeholder="Calle" className="input input-bordered bg-white w-full" value={formData.direccion.calle || ''} onChange={e => setFormData({...formData, direccion: {...formData.direccion, calle: e.target.value}})} />
                     </div>
                  </div>
                </div>
                {/* Columna Derecha */}
                <div className={`lg:col-span-7 pl-0 lg:pl-8 border-t lg:border-t-0 lg:border-l-2 ${esAdulto ? 'border-blue-100' : 'border-amber-100'}`}>
                  {esAdulto && (
                    <div className="space-y-5 animate-fade-in">
                      <div className="flex items-center gap-2 text-blue-600 uppercase text-xs font-bold tracking-widest">Datos Específicos (Adulto)</div>
                      <input required type="text" placeholder="No. Cédula" className="input input-bordered bg-white w-full" value={formData.datosAdulto.cedula || ''} onChange={e => setFormData({...formData, datosAdulto: {...formData.datosAdulto, cedula: e.target.value}})} />
                      <input type="text" placeholder="Teléfono" className="input input-bordered bg-white w-full" value={formData.datosAdulto.telefono || ''} onChange={e => setFormData({...formData, datosAdulto: {...formData.datosAdulto, telefono: e.target.value}})} />
                      <div className="grid grid-cols-2 gap-3">
                        <select className="select select-bordered bg-white w-full" value={formData.datosAdulto.ocupacionId || ''} onChange={e => setFormData({...formData, datosAdulto: {...formData.datosAdulto, ocupacionId: e.target.value}})}><option value="">Ocupación...</option>{ocupaciones.map((o: any) => <option key={o.ID_Ocupacion} value={o.ID_Ocupacion}>{o.NombreDeOcupacion}</option>)}</select>
                        <select className="select select-bordered bg-white w-full" value={formData.datosAdulto.estadoCivilId || ''} onChange={e => setFormData({...formData, datosAdulto: {...formData.datosAdulto, estadoCivilId: e.target.value}})}><option value="">Estado Civil...</option>{estadosCiviles.map((ec: any) => <option key={ec.ID_EstadoCivil} value={ec.ID_EstadoCivil}>{ec.NombreEstadoCivil}</option>)}</select>
                      </div>
                    </div>
                  )}
                  {!esAdulto && (
                    <div className="space-y-5 animate-fade-in">
                      <div className="flex items-center gap-2 text-amber-600 uppercase text-xs font-bold tracking-widest">Datos del Menor</div>
                      <div className="grid grid-cols-2 gap-3">
                         <input required type="text" placeholder="Cód. Partida Nacimiento" className="input input-bordered bg-white w-full" value={formData.datosMenor.partNacimiento || ''} onChange={e => setFormData({...formData, datosMenor: {...formData.datosMenor, partNacimiento: e.target.value}})} />
                         <input type="text" placeholder="Grado Escolar" className="input input-bordered bg-white w-full" value={formData.datosMenor.grado || ''} onChange={e => setFormData({...formData, datosMenor: {...formData.datosMenor, grado: e.target.value}})} />
                      </div>
                      <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 mt-4">
                        <div className="flex justify-between items-center mb-4">
                           <span className="text-sm font-bold text-slate-600">TUTOR RESPONSABLE</span>
                           {modoModal === 'nuevo' && (
                             <div className="tabs tabs-boxed bg-white p-1 h-auto shadow-sm border border-slate-100">
                                <a className={`tab tab-sm transition-colors ${modoTutor==='existente' ? 'tab-active !bg-slate-800 !text-white' : 'text-slate-500'}`} onClick={()=>setModoTutor('existente')}>Buscar</a>
                                <a className={`tab tab-sm transition-colors ${modoTutor==='nuevo' ? 'tab-active !bg-slate-800 !text-white' : 'text-slate-500'}`} onClick={()=>setModoTutor('nuevo')}>Crear Nuevo</a>
                             </div>
                           )}
                        </div>
                        {modoTutor === 'existente' ? (
                           <div className="space-y-3 animate-fade-in">
                              <input type="text" placeholder="Buscar por nombre, apellido o cédula..." className="input input-bordered w-full bg-white" value={busquedaTutor} onChange={(e) => setBusquedaTutor(e.target.value)} />
                              <select className="select select-bordered w-full bg-white" value={formData.datosMenor.tutorId || ''} onChange={e => setFormData({...formData, datosMenor: {...formData.datosMenor, tutorId: e.target.value}})}>
                                <option value="">Seleccione un Tutor ({tutoresFiltrados.length} encontrados)</option>
                                {tutoresFiltrados.map(t => (<option key={t.ID_Tutor} value={t.ID_Tutor}>{t.Nombre} {t.Apellido} - {t.No_Cedula}</option>))}
                              </select>
                           </div>
                        ) : (
                           <div className="space-y-3 animate-fade-in">
                              <div className="grid grid-cols-2 gap-2">
                                <input type="text" placeholder="Nombre Tutor" className="input input-bordered input-sm w-full bg-white" value={formData.datosMenor.nuevoTutor.nombre} onChange={e => setFormData({...formData, datosMenor: {...formData.datosMenor, nuevoTutor: {...formData.datosMenor.nuevoTutor, nombre: e.target.value}}})} />
                                <input type="text" placeholder="Apellido Tutor" className="input input-bordered input-sm w-full bg-white" value={formData.datosMenor.nuevoTutor.apellido} onChange={e => setFormData({...formData, datosMenor: {...formData.datosMenor, nuevoTutor: {...formData.datosMenor.nuevoTutor, apellido: e.target.value}}})} />
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <input type="text" placeholder="Cédula Tutor" className="input input-bordered input-sm w-full bg-white" value={formData.datosMenor.nuevoTutor.cedula} onChange={e => setFormData({...formData, datosMenor: {...formData.datosMenor, nuevoTutor: {...formData.datosMenor.nuevoTutor, cedula: e.target.value}}})} />
                                <input type="text" placeholder="Teléfono Tutor" className="input input-bordered input-sm w-full bg-white" value={formData.datosMenor.nuevoTutor.telefono} onChange={e => setFormData({...formData, datosMenor: {...formData.datosMenor, nuevoTutor: {...formData.datosMenor.nuevoTutor, telefono: e.target.value}}})} />
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                 <select className="select select-bordered select-sm bg-white" value={formData.datosMenor.nuevoTutor.parentescoId} onChange={e => setFormData({...formData, datosMenor: {...formData.datosMenor, nuevoTutor: {...formData.datosMenor.nuevoTutor, parentescoId: e.target.value}}})}>
                                    <option value="">Parentesco...</option>{parentescos.map((p:any) => <option key={p.ID_Parentesco} value={p.ID_Parentesco}>{p.NombreDeParentesco}</option>)}
                                 </select>
                                 <select className="select select-bordered select-sm bg-white" value={formData.datosMenor.nuevoTutor.ocupacionId} onChange={e => setFormData({...formData, datosMenor: {...formData.datosMenor, nuevoTutor: {...formData.datosMenor.nuevoTutor, ocupacionId: e.target.value}}})}>
                                    <option value="">Ocupación...</option>{ocupaciones.map((o:any) => <option key={o.ID_Ocupacion} value={o.ID_Ocupacion}>{o.NombreDeOcupacion}</option>)}
                                 </select>
                              </div>
                              <select className="select select-bordered select-sm w-full bg-white" value={formData.datosMenor.nuevoTutor.estadoCivilId} onChange={e => setFormData({...formData, datosMenor: {...formData.datosMenor, nuevoTutor: {...formData.datosMenor.nuevoTutor, estadoCivilId: e.target.value}}})}>
                                  <option value="">Estado Civil...</option>{estadosCiviles.map((ec:any) => <option key={ec.ID_EstadoCivil} value={ec.ID_EstadoCivil}>{ec.NombreEstadoCivil}</option>)}
                              </select>
                              <div className="pt-2">
                                <label className="label-text-alt text-slate-500">Dirección del Tutor</label>
                                <div className="grid grid-cols-2 gap-2 mt-1">
                                    <input type="text" placeholder="Departamento" className="input input-bordered input-sm w-full bg-white" value={formData.datosMenor.nuevoTutor.direccion.departamento} onChange={e => setFormData({...formData, datosMenor: {...formData.datosMenor, nuevoTutor: {...formData.datosMenor.nuevoTutor, direccion: {...formData.datosMenor.nuevoTutor.direccion, departamento: e.target.value}}}})} />
                                    <input type="text" placeholder="Ciudad" className="input input-bordered input-sm w-full bg-white" value={formData.datosMenor.nuevoTutor.direccion.ciudad} onChange={e => setFormData({...formData, datosMenor: {...formData.datosMenor, nuevoTutor: {...formData.datosMenor.nuevoTutor, direccion: {...formData.datosMenor.nuevoTutor.direccion, ciudad: e.target.value}}}})} />
                                </div>
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    <input type="text" placeholder="Barrio" className="input input-bordered input-sm w-full bg-white" value={formData.datosMenor.nuevoTutor.direccion.barrio} onChange={e => setFormData({...formData, datosMenor: {...formData.datosMenor, nuevoTutor: {...formData.datosMenor.nuevoTutor, direccion: {...formData.datosMenor.nuevoTutor.direccion, barrio: e.target.value}}}})} />
                                    <input type="text" placeholder="Calle" className="input input-bordered input-sm w-full bg-white" value={formData.datosMenor.nuevoTutor.direccion.calle} onChange={e => setFormData({...formData, datosMenor: {...formData.datosMenor, nuevoTutor: {...formData.datosMenor.nuevoTutor, direccion: {...formData.datosMenor.nuevoTutor.direccion, calle: e.target.value}}}})} />
                                </div>
                              </div>
                           </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-action border-t pt-4 mt-6">
                <form method="dialog"><button className="btn btn-ghost hover:bg-slate-100">Cancelar</button></form>
                <button type="submit" className="btn btn-primary text-white px-8">{modoModal === 'nuevo' ? 'Guardar Paciente' : 'Actualizar Cambios'}</button>
              </div>
            </form>
          </div>
        </div>
      </dialog>
    </div>
  );
}