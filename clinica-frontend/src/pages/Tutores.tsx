import { useEffect, useState } from 'react';
import { api } from '../services/api';
// Importamos el tipo base, pero definiremos una extensión local para los detalles de edición
import type { Tutor } from '../types'; 

// Extendemos la interfaz Tutor porque la vista de administración necesita datos extra (IDs y Dirección)
// que el backend envía pero que tal vez no están en el tipo base 'light'.
interface TutorAdmin extends Tutor {
  No_Telefono: string;
  ID_Parentesco: number;
  ID_Ocupacion: number;
  ID_EstadoCivil: number;
  Ocupacion: { NombreDeOcupacion: string };
  DireccionTutor: { Departamento: string, Ciudad: string, Barrio: string, Calle: string };
  // Aseguramos la estructura exacta de los menores para esta vista
  PacienteMenor: { 
    PartNacimiento: string; 
    GradoEscolar: string;
    Paciente: { Nombre: string, Apellido: string } 
  }[];
}

// Estado inicial limpio
const initialState = {
  Nombre: '', Apellido: '', No_Cedula: '', No_Telefono: '',
  ID_Parentesco: 0, ID_Ocupacion: 0, ID_EstadoCivil: 0,
  DireccionTutor: { Departamento: '', Ciudad: '', Barrio: '', Calle: '' }
};

export default function Tutores() {
  const [tutores, setTutores] = useState<TutorAdmin[]>([]);
  const [busqueda, setBusqueda] = useState('');
  
  // Modal Edición
  const [tutorSeleccionado, setTutorSeleccionado] = useState<TutorAdmin | null>(null);
  const [formData, setFormData] = useState<any>(initialState);

  // Modal Ver Pacientes
  const [pacientesModal, setPacientesModal] = useState<TutorAdmin['PacienteMenor'] | null>(null);
  const [tutorModalNombre, setTutorModalNombre] = useState('');

  // Catálogos
  const [ocupaciones, setOcupaciones] = useState<any[]>([]);
  const [estadosCiviles, setEstadosCiviles] = useState<any[]>([]);
  const [parentescos, setParentescos] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // 1. Cargar Tutores usando el servicio
      // (Hacemos un cast 'as any' temporal si el tipo estricto difiere ligeramente, o confiamos en la extensión)
      const dataTutores = await api.tutores.getAll();
      setTutores(dataTutores as unknown as TutorAdmin[]);

      // 2. Cargar Catálogos usando el servicio
      const dataCatalogos = await api.general.catalogos();
      setOcupaciones(dataCatalogos.ocupaciones);
      setEstadosCiviles(dataCatalogos.estadosCiviles);
      setParentescos(dataCatalogos.parentescos);
    } catch (error) {
      console.error("Error cargando datos:", error);
    }
  };

  // Lógica de Búsqueda
  const tutoresFiltrados = tutores.filter(t => {
    const busquedaLower = busqueda.toLowerCase();
    const nombreCompleto = `${t.Nombre} ${t.Apellido}`.toLowerCase();
    return nombreCompleto.includes(busquedaLower) || t.No_Cedula.includes(busqueda);
  });

  // --- ABRIR MODAL EDICIÓN ---
  const handleOpenEditar = (tutor: TutorAdmin) => {
    setTutorSeleccionado(tutor);
    setFormData({
      Nombre: tutor.Nombre,
      Apellido: tutor.Apellido,
      No_Cedula: tutor.No_Cedula,
      No_Telefono: tutor.No_Telefono,
      ID_Parentesco: tutor.ID_Parentesco,
      ID_Ocupacion: tutor.ID_Ocupacion,
      ID_EstadoCivil: tutor.ID_EstadoCivil,
      DireccionTutor: tutor.DireccionTutor || initialState.DireccionTutor
    });
    (document.getElementById('modal_editar_tutor') as HTMLDialogElement).showModal();
  };

  // --- GUARDAR CAMBIOS (Usando el Servicio) ---
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tutorSeleccionado) return;

    try {
      await api.tutores.update(tutorSeleccionado.ID_Tutor, formData);
      alert("✅ Tutor actualizado correctamente");
      (document.getElementById('modal_editar_tutor') as HTMLDialogElement).close();
      loadData(); // Recargar la lista
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  // --- ABRIR MODAL PACIENTES ---
  const handleOpenPacientesModal = (tutor: TutorAdmin) => {
    setTutorModalNombre(`${tutor.Nombre} ${tutor.Apellido}`);
    setPacientesModal(tutor.PacienteMenor); 
    (document.getElementById('modal_ver_pacientes') as HTMLDialogElement).showModal();
  };

  return (
    <div className="p-6 animate-fade-in-up">
      {/* Encabezado y Búsqueda */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Gestión de Tutores</h1>
          <p className="text-slate-500">Directorio de responsables y pacientes asociados</p>
        </div>
      </div>
      
      <div className="mb-6">
        <input 
          type="text" 
          placeholder="Buscar tutor por nombre o cédula..."
          className="input input-bordered w-full bg-white shadow-sm text-slate-800 focus:border-blue-500"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {/* Tabla de Tutores */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs">
              <tr>
                <th className="py-4">Nombre</th>
                <th>Cédula</th>
                <th>Contacto</th>
                <th>Ocupación</th>
                <th className="text-center">Pacientes a Cargo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tutoresFiltrados.map(tutor => (
                <tr key={tutor.ID_Tutor} className="hover:bg-slate-50 transition-colors">
                  <td><div className="font-bold text-slate-700">{tutor.Nombre} {tutor.Apellido}</div></td>
                  <td><span className="font-mono text-slate-600">{tutor.No_Cedula}</span></td>
                  <td><span className="text-sm text-slate-500">{tutor.No_Telefono}</span></td>
                  <td><span className="badge badge-ghost badge-sm">{tutor.Ocupacion?.NombreDeOcupacion || 'N/A'}</span></td>
                  
                  <td className="text-center">
                    {tutor.PacienteMenor && tutor.PacienteMenor.length > 0 ? (
                      <button 
                        className="btn btn-xs btn-outline btn-info"
                        onClick={() => handleOpenPacientesModal(tutor)}>
                        Ver ({tutor.PacienteMenor.length})
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Aún no tiene</span>
                    )}
                  </td>

                  <td>
                    <button 
                      className="btn btn-xs btn-outline"
                      onClick={() => handleOpenEditar(tutor)}>
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
              {tutoresFiltrados.length === 0 && (
                 <tr><td colSpan={6} className="text-center py-8 text-slate-400 italic">No se encontraron tutores.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODAL DE EDICIÓN --- */}
      <dialog id="modal_editar_tutor" className="modal modal-bottom sm:modal-middle backdrop-blur-sm">
        <div className="modal-box w-11/12 max-w-3xl bg-white p-0 rounded-2xl shadow-xl">
          <div className="bg-slate-50 px-8 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-800">Editar Información del Tutor</h3>
              <form method="dialog"><button className="btn btn-sm btn-circle btn-ghost">✕</button></form>
          </div>

          <form onSubmit={handleFormSubmit}>
            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              
              {/* Sección 1 */}
              <div>
                <label className="label-text font-bold text-slate-500 uppercase text-xs">Datos Personales</label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="form-control">
                    <label className="label pt-0"><span className="label-text-alt">Nombre</span></label>
                    <input type="text" className="input input-bordered bg-white" value={formData.Nombre} onChange={e => setFormData({...formData, Nombre: e.target.value})} />
                  </div>
                  <div className="form-control">
                    <label className="label pt-0"><span className="label-text-alt">Apellido</span></label>
                    <input type="text" className="input input-bordered bg-white" value={formData.Apellido} onChange={e => setFormData({...formData, Apellido: e.target.value})} />
                  </div>
                  <div className="form-control">
                    <label className="label pt-0"><span className="label-text-alt">Cédula</span></label>
                    <input type="text" className="input input-bordered bg-white" value={formData.No_Cedula} onChange={e => setFormData({...formData, No_Cedula: e.target.value})} />
                  </div>
                  <div className="form-control">
                    <label className="label pt-0"><span className="label-text-alt">Teléfono</span></label>
                    <input type="text" className="input input-bordered bg-white" value={formData.No_Telefono} onChange={e => setFormData({...formData, No_Telefono: e.target.value})} />
                  </div>
                </div>
              </div>

              {/* Sección 2 */}
              <div>
                <label className="label-text font-bold text-slate-500 uppercase text-xs">Información Adicional</label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="form-control">
                    <label className="label pt-0"><span className="label-text-alt">Parentesco</span></label>
                    <select className="select select-bordered bg-white" value={formData.ID_Parentesco} onChange={e => setFormData({...formData, ID_Parentesco: e.target.value})}>
                      <option value="">Seleccionar...</option>{parentescos.map((p:any) => <option key={p.ID_Parentesco} value={p.ID_Parentesco}>{p.NombreDeParentesco}</option>)}
                    </select>
                  </div>
                  <div className="form-control">
                    <label className="label pt-0"><span className="label-text-alt">Ocupación</span></label>
                    <select className="select select-bordered bg-white" value={formData.ID_Ocupacion} onChange={e => setFormData({...formData, ID_Ocupacion: e.target.value})}>
                      <option value="">Seleccionar...</option>{ocupaciones.map((o:any) => <option key={o.ID_Ocupacion} value={o.ID_Ocupacion}>{o.NombreDeOcupacion}</option>)}
                    </select>
                  </div>
                  <div className="form-control col-span-2">
                    <label className="label pt-0"><span className="label-text-alt">Estado Civil</span></label>
                    <select className="select select-bordered bg-white w-full" value={formData.ID_EstadoCivil} onChange={e => setFormData({...formData, ID_EstadoCivil: e.target.value})}>
                      <option value="">Seleccionar...</option>{estadosCiviles.map((ec:any) => <option key={ec.ID_EstadoCivil} value={ec.ID_EstadoCivil}>{ec.NombreEstadoCivil}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Sección 3 */}
              <div>
                <label className="label-text font-bold text-slate-500 uppercase text-xs">Dirección del Tutor</label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <input type="text" placeholder="Departamento" className="input input-bordered bg-white" value={formData.DireccionTutor.Departamento} onChange={e => setFormData({...formData, DireccionTutor: {...formData.DireccionTutor, Departamento: e.target.value}})} />
                  <input type="text" placeholder="Ciudad" className="input input-bordered bg-white" value={formData.DireccionTutor.Ciudad} onChange={e => setFormData({...formData, DireccionTutor: {...formData.DireccionTutor, Ciudad: e.target.value}})} />
                  <input type="text" placeholder="Barrio" className="input input-bordered bg-white" value={formData.DireccionTutor.Barrio} onChange={e => setFormData({...formData, DireccionTutor: {...formData.DireccionTutor, Barrio: e.target.value}})} />
                  <input type="text" placeholder="Calle" className="input input-bordered bg-white" value={formData.DireccionTutor.Calle} onChange={e => setFormData({...formData, DireccionTutor: {...formData.DireccionTutor, Calle: e.target.value}})} />
                </div>
              </div>
            </div>

            <div className="modal-action bg-slate-50 px-8 py-4 border-t border-slate-200">
              <form method="dialog"><button className="btn btn-ghost">Cancelar</button></form>
              <button type="submit" className="btn btn-primary text-white">Actualizar Tutor</button>
            </div>
          </form>
        </div>
      </dialog>

      {/* --- MODAL: VER PACIENTES --- */}
      <dialog id="modal_ver_pacientes" className="modal modal-bottom sm:modal-middle backdrop-blur-sm">
        <div className="modal-box bg-white text-slate-800 rounded-xl">
          <h3 className="font-bold text-lg border-b pb-3 mb-4">Pacientes a cargo de <span className="text-blue-600">{tutorModalNombre}</span></h3>
          
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead className="text-slate-500 font-bold uppercase text-xs">
                <tr><th>Nombre del Paciente</th><th>Partida de Nacimiento</th><th>Grado</th></tr>
              </thead>
              <tbody>
                {pacientesModal?.map((pm: any) => (
                  <tr key={pm.PartNacimiento}>
                    <td className="font-medium">{pm.Paciente.Nombre} {pm.Paciente.Apellido}</td>
                    <td><span className="font-mono badge badge-ghost">{pm.PartNacimiento}</span></td>
                    <td className="text-sm">{pm.GradoEscolar}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="modal-action">
            <form method="dialog"><button className="btn btn-primary text-white">Cerrar</button></form>
          </div>
        </div>
      </dialog>

    </div>
  );
}