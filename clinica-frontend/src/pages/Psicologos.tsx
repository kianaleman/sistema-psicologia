import { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { Psicologo } from '../types';

// Interfaces extendidas localmente para detalles
interface Especialidad { ID_Especialidad: number; NombreEspecialidad: string; }
interface EstadoActividad { ID_EstadoDeActividad: number; NombreEstadoActividad: string; }

// Extendemos la interfaz base para incluir las especialidades anidadas
interface PsicologoCompleto extends Psicologo {
  Psicologo_EspecialidadPsicologo: { EspecialidadPsicologo: Especialidad }[];
  DireccionPsicologo: { Departamento: string, Ciudad: string, Barrio: string, Calle: string };
}

const initialState = {
  Nombre: '', Apellido: '', CodigoDeMinsa: '', No_Telefono: '', Email: '', ID_EstadoDeActividad: 1,
  direccion: { Departamento: '', Ciudad: '', Barrio: '', Calle: '' },
};

export default function Psicologos() {
  const [psicologos, setPsicologos] = useState<PsicologoCompleto[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroActividad, setFiltroActividad] = useState<'todos' | 'activos' | 'inactivos'>('todos');
  
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [estadosActividad, setEstadosActividad] = useState<EstadoActividad[]>([]);
  
  const [modoModal, setModoModal] = useState<'nuevo' | 'editar'>('nuevo');
  const [psicologoSeleccionado, setPsicologoSeleccionado] = useState<PsicologoCompleto | null>(null);
  const [formData, setFormData] = useState(initialState);
  const [selectedEspecialidades, setSelectedEspecialidades] = useState<Set<number>>(new Set());

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const dataPsicologos = await api.psicologos.getAll();
      // @ts-ignore (Casting seguro si la estructura del backend coincide)
      setPsicologos(dataPsicologos);

      const dataCatalogos = await api.general.catalogos();
      setEspecialidades(dataCatalogos.especialidades || []);
      setEstadosActividad(dataCatalogos.estadosActividad || []);
    } catch (e) { console.error(e); }
  };

  // Lógica Filtros (Igual)
  const psicologosFiltrados = psicologos.filter(p => {
    const busquedaLower = busqueda.toLowerCase().trim();
    let pasaBusqueda = true;
    if (busquedaLower) {
      const nombreCompleto = `${p.Nombre} ${p.Apellido}`.toLowerCase();
      pasaBusqueda = nombreCompleto.includes(busquedaLower) || p.CodigoDeMinsa.toLowerCase().includes(busquedaLower);
    }
    let pasaActividad = true;
    const estado = p.EstadoDeActividad?.NombreEstadoActividad?.toLowerCase();
    if (filtroActividad === 'activos') pasaActividad = estado === 'activo';
    else if (filtroActividad === 'inactivos') pasaActividad = estado === 'inactivo';
    return pasaBusqueda && pasaActividad;
  });

  // Modales
  const handleOpenNuevoModal = () => {
    setModoModal('nuevo');
    setPsicologoSeleccionado(null);
    setFormData(initialState);
    setSelectedEspecialidades(new Set());
    (document.getElementById('modal_gestion_psicologo') as HTMLDialogElement).showModal();
  };

  const handleOpenEditarModal = (psicologo: PsicologoCompleto) => {
    setModoModal('editar');
    setPsicologoSeleccionado(psicologo);
    
    setFormData({
      Nombre: psicologo.Nombre,
      Apellido: psicologo.Apellido,
      CodigoDeMinsa: psicologo.CodigoDeMinsa,
      No_Telefono: psicologo.No_Telefono,
      Email: psicologo.Email,
      ID_EstadoDeActividad: psicologo.ID_EstadoDeActividad,
      direccion: psicologo.DireccionPsicologo || initialState.direccion
    });

    const especialidadIds = psicologo.Psicologo_EspecialidadPsicologo.map(esp => esp.EspecialidadPsicologo.ID_Especialidad);
    setSelectedEspecialidades(new Set(especialidadIds));

    (document.getElementById('modal_gestion_psicologo') as HTMLDialogElement).showModal();
  };

  const handleSpecialtyChange = (id: number) => {
    setSelectedEspecialidades(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
      return newSet;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData, especialidadIds: Array.from(selectedEspecialidades) };

    try {
      if (modoModal === 'nuevo') {
        await api.psicologos.create(payload);
        alert("✅ Psicólogo registrado correctamente");
      } else {
        // @ts-expect-error (Seguro si psicologoSeleccionado no es null en modo editar)
        await api.psicologos.update(psicologoSeleccionado.ID_Psicologo, payload);
        alert("✅ Psicólogo actualizado correctamente");
      }
      (document.getElementById('modal_gestion_psicologo') as HTMLDialogElement).close();
      loadData();
    } catch (e: any) { alert("Error: " + e.message); }
  };

  return (
    <div className="p-6 animate-fade-in-up">
      <div className="flex justify-between items-center mb-8">
        <div><h1 className="text-3xl font-bold text-slate-800 tracking-tight">Gestión de Psicólogos</h1><p className="text-slate-500">Directorio de profesionales de la clínica</p></div>
        <button className="btn btn-primary shadow-lg text-white" onClick={handleOpenNuevoModal}>+ Nuevo Psicólogo</button>
      </div>
      
      {/* Filtros */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 space-y-4">
        <input type="text" placeholder="Buscar por nombre, apellido o Código MINSA..." className="input input-bordered w-full bg-slate-50 text-slate-800" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Estado:</span>
            <div className="join border border-slate-200 rounded-lg p-1 bg-slate-100">
              <button className={`join-item btn btn-sm ${filtroActividad === 'todos' ? 'btn-neutral' : 'btn-ghost'}`} onClick={() => setFiltroActividad('todos')}>Todos</button>
              <button className={`join-item btn btn-sm ${filtroActividad === 'activos' ? 'btn-neutral' : 'btn-ghost'}`} onClick={() => setFiltroActividad('activos')}>Activos</button>
              <button className={`join-item btn btn-sm ${filtroActividad === 'inactivos' ? 'btn-neutral' : 'btn-ghost'}`} onClick={() => setFiltroActividad('inactivos')}>Inactivos</button>
            </div>
          </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs">
              <tr><th className="py-4">Nombre / Estado</th><th>Identificación</th><th>Contacto</th><th>Especialidades</th><th>Acciones</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {psicologosFiltrados.map(p => (
                <tr key={p.ID_Psicologo} className="hover:bg-slate-50">
                  <td>
                    <div className="font-bold text-slate-700">{p.Nombre} {p.Apellido}</div>
                    <span className={`badge badge-xs ${p.EstadoDeActividad?.NombreEstadoActividad === 'Activo' ? 'badge-success' : 'badge-error'} text-white`}>{p.EstadoDeActividad?.NombreEstadoActividad}</span>
                  </td>
                  <td><span className="font-mono text-slate-600">{p.CodigoDeMinsa}</span></td>
                  <td><div className="text-sm text-slate-500">{p.No_Telefono}</div><div className="text-xs text-slate-400">{p.Email}</div></td>
                  <td>
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {p.Psicologo_EspecialidadPsicologo.map(esp => (<span key={esp.EspecialidadPsicologo.ID_Especialidad} className="badge badge-outline badge-info">{esp.EspecialidadPsicologo.NombreEspecialidad}</span>))}
                    </div>
                  </td>
                  <td><button className="btn btn-xs btn-outline" onClick={() => handleOpenEditarModal(p)}>Editar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <dialog id="modal_gestion_psicologo" className="modal modal-bottom sm:modal-middle backdrop-blur-sm">
        <div className="modal-box w-11/12 max-w-4xl bg-white p-0 rounded-2xl shadow-xl">
          <div className="bg-slate-50 px-8 py-4 border-b border-slate-200 flex justify-between items-center">
            <h3 className="font-bold text-lg text-slate-800">{modoModal === 'nuevo' ? 'Registrar Nuevo Psicólogo' : 'Editar Psicólogo'}</h3>
            <form method="dialog"><button className="btn btn-sm btn-circle btn-ghost">✕</button></form>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="label-text font-bold text-slate-500 uppercase text-xs">Datos Personales</label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <input required type="text" placeholder="Nombre" className="input input-bordered bg-white" value={formData.Nombre} onChange={e => setFormData({...formData, Nombre: e.target.value})} />
                  <input required type="text" placeholder="Apellido" className="input input-bordered bg-white" value={formData.Apellido} onChange={e => setFormData({...formData, Apellido: e.target.value})} />
                  <input required type="text" placeholder="Código MINSA" className="input input-bordered bg-white" value={formData.CodigoDeMinsa} onChange={e => setFormData({...formData, CodigoDeMinsa: e.target.value})} />
                  <input required type="text" placeholder="No. Teléfono" className="input input-bordered bg-white" value={formData.No_Telefono} onChange={e => setFormData({...formData, No_Telefono: e.target.value})} />
                  <input required type="email" placeholder="Email" className="input input-bordered bg-white col-span-2" value={formData.Email} onChange={e => setFormData({...formData, Email: e.target.value})} />
                  <select className="select select-bordered bg-white col-span-2" value={formData.ID_EstadoDeActividad} onChange={e => setFormData({...formData, ID_EstadoDeActividad: parseInt(e.target.value)})}>
                    <option value={0} disabled>Seleccione un estado...</option>
                    {estadosActividad.map(est => (<option key={est.ID_EstadoDeActividad} value={est.ID_EstadoDeActividad}>{est.NombreEstadoActividad}</option>))}
                  </select>
                </div>
              </div>
              <div>
                <label className="label-text font-bold text-slate-500 uppercase text-xs">Dirección</label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <input required type="text" placeholder="Departamento" className="input input-bordered bg-white" value={formData.direccion.Departamento} onChange={e => setFormData({...formData, direccion: {...formData.direccion, Departamento: e.target.value}})} />
                  <input required type="text" placeholder="Ciudad" className="input input-bordered bg-white" value={formData.direccion.Ciudad} onChange={e => setFormData({...formData, direccion: {...formData.direccion, Ciudad: e.target.value}})} />
                  <input required type="text" placeholder="Barrio" className="input input-bordered bg-white" value={formData.direccion.Barrio} onChange={e => setFormData({...formData, direccion: {...formData.direccion, Barrio: e.target.value}})} />
                  <input required type="text" placeholder="Calle" className="input input-bordered bg-white" value={formData.direccion.Calle} onChange={e => setFormData({...formData, direccion: {...formData.direccion, Calle: e.target.value}})} />
                </div>
              </div>
              <div>
                <label className="label-text font-bold text-slate-500 uppercase text-xs">Especialidades</label>
                <div className="p-4 mt-2 bg-slate-50 rounded-lg border border-slate-200 flex flex-wrap gap-3">
                  {especialidades.map(esp => (
                    <button type="button" key={esp.ID_Especialidad} onClick={() => handleSpecialtyChange(esp.ID_Especialidad)} className={`btn btn-sm rounded-full font-medium transition-all ${selectedEspecialidades.has(esp.ID_Especialidad) ? 'btn-primary text-white shadow' : 'btn-ghost bg-white border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
                      {selectedEspecialidades.has(esp.ID_Especialidad) && '✓ '} {esp.NombreEspecialidad}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-action bg-slate-50 px-8 py-4 border-t border-slate-200">
              <form method="dialog"><button className="btn btn-ghost">Cancelar</button></form>
              <button type="submit" className="btn btn-primary text-white">{modoModal === 'nuevo' ? 'Registrar Psicólogo' : 'Actualizar Cambios'}</button>
            </div>
          </form>
        </div>
      </dialog>
    </div>
  );
}