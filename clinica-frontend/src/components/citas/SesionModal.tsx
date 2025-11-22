import { useState } from 'react';
import type { Cita, TratamientoLocal } from '../../types';
import { toast } from 'sonner';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  cita: Cita | null;
  catalogos: any;
}

// Estado inicial limpio para el formulario de tratamiento
const initialTratamiento: TratamientoLocal = { 
    id: 0, 
    tipo: 'terapeutico', 
    frecuencia: '', 
    medicamento: '', 
    dosis: '', 
    viaAdminId: '', 
    objetivo: '', 
    tipoTerapiaId: '' 
};

export default function SesionModal({ isOpen, onClose, onSubmit, cita, catalogos }: Props) {
  const [datosSesion, setDatosSesion] = useState({ 
      observaciones: '', 
      diagnostico: '', 
      historial: '', 
      criterios: 'DSM-5' 
  });
  
  const [listaTratamientos, setListaTratamientos] = useState<TratamientoLocal[]>([]);
  const [selectedExploraciones, setSelectedExploraciones] = useState<Set<number>>(new Set());
  
  const [formTratamiento, setFormTratamiento] = useState<TratamientoLocal>(initialTratamiento);

  if (!isOpen || !cita) return null;

  const handleSave = () => {
    if (!datosSesion.diagnostico.trim()) {
        return toast.error("El diagnóstico es obligatorio");
    }

    // Formato HH:MM:SS para el backend
    const horaInicio = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    onSubmit({ 
      citaId: cita.ID_Cita, 
      pacienteId: cita.Paciente?.ID_Paciente, 
      psicologoId: cita.Psicologo?.ID_Psicologo, 
      ...datosSesion, 
      horaInicio, 
      tratamientos: listaTratamientos, 
      exploracionIds: Array.from(selectedExploraciones) 
    });
  };

  const agregarTratamiento = () => {
     // Validación básica
     if (!formTratamiento.frecuencia) return toast.error("Indica la frecuencia");
     
     if (formTratamiento.tipo === 'farmacologico') {
         if (!formTratamiento.medicamento || !formTratamiento.viaAdminId) return toast.error("Completa datos del fármaco");
     } else {
         if (!formTratamiento.objetivo || !formTratamiento.tipoTerapiaId) return toast.error("Completa datos de terapia");
     }

     // Agregar a la lista visual
     setListaTratamientos([...listaTratamientos, { ...formTratamiento, id: Date.now() }]); 
     
     // Resetear formulario parcial
     setFormTratamiento(initialTratamiento);
  };
  
  const eliminarTratamiento = (id: number) => {
      setListaTratamientos(prev => prev.filter(t => t.id !== id));
  };

  const toggleExploracion = (id: number) => {
    setSelectedExploraciones(p => { 
        const n = new Set(p); 
        if (n.has(id)) n.delete(id); 
        else n.add(id); 
        return n; 
    });
  };

  // Helpers de nombres para visualización
  const getViaNombre = (id: string) => catalogos.viasAdmin?.find((v:any) => v.ID_ViaAdministracion == id)?.NombreDePresentacion;
  const getTerapiaNombre = (id: string) => catalogos.tiposTerapia?.find((t:any) => t.ID_TipoTerapia == id)?.NombreDeTerapia;

  return (
    <dialog className="modal modal-open bg-black/50 backdrop-blur-sm">
      <div className="modal-box w-11/12 max-w-5xl bg-white text-slate-800 p-0 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Encabezado Fijo */}
        <div className="bg-emerald-700 text-white px-8 py-4 flex justify-between items-center">
           <div>
             <h3 className="font-bold text-xl">Consulta Clínica en Curso</h3>
             <p className="text-emerald-100 text-sm">Paciente: {cita.Paciente?.Nombre} {cita.Paciente?.Apellido}</p>
           </div>
           <button className="btn btn-circle btn-ghost text-white" onClick={onClose}>✕</button>
        </div>

        {/* Cuerpo Scrollable */}
        <div className="p-8 overflow-y-auto flex-1 space-y-8">
            
            {/* 1. Exploraciones (Chips) */}
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
               <h4 className="font-bold text-slate-600 text-sm uppercase mb-3 flex items-center gap-2">
                 🧠 Exploraciones Psicológicas
               </h4>
               <div className="flex flex-wrap gap-2">
                  {catalogos.exploraciones?.map((exp: any) => (
                    <button 
                      type="button" 
                      key={exp.ID_ExploracionPsicologica} 
                      onClick={() => toggleExploracion(exp.ID_ExploracionPsicologica)} 
                      className={`btn btn-sm rounded-full transition-all ${selectedExploraciones.has(exp.ID_ExploracionPsicologica) 
                          ? 'btn-primary text-white shadow-md' 
                          : 'btn-ghost bg-white border-slate-200 hover:border-primary'}`}
                    >
                      {exp.NombreDeExploracionPsicologica}
                    </button>
                  ))}
               </div>
            </div>

            {/* 2. Diagnóstico y Notas (Grid) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="form-control">
                   <label className="label font-bold text-slate-500 text-xs uppercase">Observaciones</label>
                   <textarea className="textarea textarea-bordered bg-white h-32 focus:border-emerald-500" placeholder="Notas generales..." value={datosSesion.observaciones} onChange={e => setDatosSesion({...datosSesion, observaciones: e.target.value})} />
               </div>
               <div className="form-control">
                   <label className="label font-bold text-slate-500 text-xs uppercase">Diagnóstico Diferencial *</label>
                   <textarea className="textarea textarea-bordered bg-white h-32 focus:border-emerald-500" placeholder="Diagnóstico principal..." value={datosSesion.diagnostico} onChange={e => setDatosSesion({...datosSesion, diagnostico: e.target.value})} />
               </div>
               <div className="form-control">
                   <label className="label font-bold text-slate-500 text-xs uppercase">Evolución / Historial</label>
                   <textarea className="textarea textarea-bordered bg-white h-32 focus:border-emerald-500" placeholder="Detalles evolutivos..." value={datosSesion.historial} onChange={e => setDatosSesion({...datosSesion, historial: e.target.value})} />
               </div>
            </div>

            {/* 3. Plan de Tratamiento (Complejo) */}
            <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-100">
               <h4 className="font-bold text-emerald-800 text-sm uppercase mb-4 flex items-center gap-2">
                 💊 Plan de Tratamiento
               </h4>
               
               {/* Formulario de Entrada */}
               <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-white p-4 rounded-lg shadow-sm border border-emerald-100 mb-4">
                  {/* Selector Tipo */}
                  <div className="md:col-span-2">
                      <label className="label-text text-xs text-slate-400 font-bold">Tipo</label>
                      <select className="select select-bordered select-sm w-full bg-slate-50" value={formTratamiento.tipo} onChange={e => setFormTratamiento({...formTratamiento, tipo: e.target.value as any})}>
                          <option value="terapeutico">Terapia</option>
                          <option value="farmacologico">Fármaco</option>
                      </select>
                  </div>

                  {/* Campos Dinámicos */}
                  {formTratamiento.tipo === 'farmacologico' ? (
                      <>
                        <div className="md:col-span-3">
                            <label className="label-text text-xs text-slate-400 font-bold">Medicamento</label>
                            <input className="input input-bordered input-sm w-full bg-slate-50" placeholder="Ej: Sertralina" value={formTratamiento.medicamento} onChange={e => setFormTratamiento({...formTratamiento, medicamento: e.target.value})} />
                        </div>
                        <div className="md:col-span-2">
                            <label className="label-text text-xs text-slate-400 font-bold">Dosis</label>
                            <input className="input input-bordered input-sm w-full bg-slate-50" placeholder="Ej: 50mg" value={formTratamiento.dosis} onChange={e => setFormTratamiento({...formTratamiento, dosis: e.target.value})} />
                        </div>
                        <div className="md:col-span-3">
                            <label className="label-text text-xs text-slate-400 font-bold">Vía Admin.</label>
                            <select className="select select-bordered select-sm w-full bg-slate-50" value={formTratamiento.viaAdminId} onChange={e => setFormTratamiento({...formTratamiento, viaAdminId: e.target.value})}>
                                <option value="">Seleccionar...</option>
                                {catalogos.viasAdmin?.map((v:any) => <option key={v.ID_ViaAdministracion} value={v.ID_ViaAdministracion}>{v.NombreDePresentacion}</option>)}
                            </select>
                        </div>
                      </>
                  ) : (
                      <>
                        <div className="md:col-span-3">
                            <label className="label-text text-xs text-slate-400 font-bold">Objetivo</label>
                            <input className="input input-bordered input-sm w-full bg-slate-50" placeholder="Ej: Reducir ansiedad" value={formTratamiento.objetivo} onChange={e => setFormTratamiento({...formTratamiento, objetivo: e.target.value})} />
                        </div>
                        <div className="md:col-span-5">
                            <label className="label-text text-xs text-slate-400 font-bold">Tipo Terapia</label>
                            <select className="select select-bordered select-sm w-full bg-slate-50" value={formTratamiento.tipoTerapiaId} onChange={e => setFormTratamiento({...formTratamiento, tipoTerapiaId: e.target.value})}>
                                <option value="">Seleccionar...</option>
                                {catalogos.tiposTerapia?.map((t:any) => <option key={t.ID_TipoTerapia} value={t.ID_TipoTerapia}>{t.NombreDeTerapia}</option>)}
                            </select>
                        </div>
                      </>
                  )}

                  {/* Frecuencia (Común) */}
                  <div className="md:col-span-2">
                      <label className="label-text text-xs text-slate-400 font-bold">Frecuencia</label>
                      <input className="input input-bordered input-sm w-full bg-slate-50" placeholder="Ej: Cada 8h" value={formTratamiento.frecuencia} onChange={e => setFormTratamiento({...formTratamiento, frecuencia: e.target.value})} />
                  </div>

                  {/* Botón Agregar */}
                  <div className="md:col-span-12 flex justify-end mt-2">
                      <button className="btn btn-sm btn-secondary text-white" onClick={agregarTratamiento}>
                        + Agregar Item
                      </button>
                  </div>
               </div>

               {/* Tabla de Items Agregados */}
               {listaTratamientos.length > 0 && (
                   <div className="overflow-x-auto">
                       <table className="table table-xs w-full bg-white rounded-lg">
                           <thead>
                               <tr className="bg-emerald-100 text-emerald-800">
                                   <th>Tipo</th>
                                   <th>Detalle Principal</th>
                                   <th>Especificación</th>
                                   <th>Frecuencia</th>
                                   <th></th>
                               </tr>
                           </thead>
                           <tbody>
                               {listaTratamientos.map(t => (
                                   <tr key={t.id} className="border-b border-emerald-50">
                                       <td>
                                           <span className={`badge badge-xs ${t.tipo === 'farmacologico' ? 'badge-info' : 'badge-warning'}`}>
                                               {t.tipo === 'farmacologico' ? 'Fármaco' : 'Terapia'}
                                           </span>
                                       </td>
                                       <td className="font-bold">
                                           {t.tipo === 'farmacologico' ? t.medicamento : t.objetivo}
                                       </td>
                                       <td>
                                           {t.tipo === 'farmacologico' 
                                              ? `${t.dosis} (${getViaNombre(t.viaAdminId as string)})` 
                                              : getTerapiaNombre(t.tipoTerapiaId as string)}
                                       </td>
                                       <td>{t.frecuencia}</td>
                                       <td>
                                           <button className="btn btn-ghost btn-xs text-red-500" onClick={() => eliminarTratamiento(t.id)}>✕</button>
                                       </td>
                                   </tr>
                               ))}
                           </tbody>
                       </table>
                   </div>
               )}
            </div>
        </div>

        {/* Pie Fijo */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end gap-3">
           <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
           <button className="btn btn-primary text-white shadow-lg px-8" onClick={handleSave}>
             ✅ Finalizar Consulta y Guardar
           </button>
        </div>

      </div>
    </dialog>
  );
}