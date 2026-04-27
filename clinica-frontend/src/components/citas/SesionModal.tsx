import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import type { Cita, TratamientoLocal } from "../../types";
import { toast } from "sonner";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  cita: Cita | null;
  catalogos: any;
}

const Icons = {
  Brain: () => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M11 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM13.5 10a.5.5 0 00-.5.5v3.25a2.75 2.75 0 005.5 0v-3.25a.5.5 0 00-.5-.5h-4.5zM3 13.5a.5.5 0 00.5.5h3.25a2.75 2.75 0 000-5.5H3.5a.5.5 0 00-.5.5v4.5z" /></svg>),
  Pill: () => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M11.5 2.25a.75.75 0 00-1.5 0v3.75h-3.75a.75.75 0 000 1.5h3.75v3.75a.75.75 0 001.5 0v-3.75h3.75a.75.75 0 000-1.5h-3.75V2.25z" /></svg>),
};

const initialTratamiento: TratamientoLocal = {
  id: 0,
  tipo: "terapeutico",
  frecuencia: "",
  medicamento: "",
  dosis: "",
  viaAdminId: undefined,
  objetivo: "",
  tipoTerapiaId: undefined,
};

export default function SesionModal({ isOpen, onClose, onSubmit, cita, catalogos }: Props) {
  const [datosSesion, setDatosSesion] = useState({
    horaInicio: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    horaFinal: "",
    observaciones: "",
    diagnostico: "",
    historial: "",
    criterios: "DSM-5",
  });
  const [listaTratamientos, setListaTratamientos] = useState<TratamientoLocal[]>([]);
  const [selectedExploraciones, setSelectedExploraciones] = useState<Set<number>>(new Set());
  const [formTratamiento, setFormTratamiento] = useState<TratamientoLocal>(initialTratamiento);

  const viaMap = useMemo(() => 
    new Map<number, string>(catalogos.viasAdmin?.map((v: any) => [v.ID_ViaAdministracion, v.Nombre_De_Presentacion])), 
    [catalogos.viasAdmin]
  );
  
  const terapiaMap = useMemo(() => 
    new Map<number, string>(catalogos.tiposTerapia?.map((t: any) => [t.ID_Tipo_Terapia, t.Nombre_De_Terapia])), 
    [catalogos.tiposTerapia]
  );

  if (!isOpen || !cita) return null;

  const getViaNombre = (id: number | undefined) => id ? viaMap.get(id) || "N/A" : "N/A";
  const getTerapiaNombre = (id: number | undefined) => id ? terapiaMap.get(id) || "N/A" : "N/A";

  const handleSave = () => {
    if (!datosSesion.diagnostico.trim()) return toast.error("El diagnóstico es obligatorio");
    if (!datosSesion.horaFinal) return toast.error("Indique la hora final");
    
    const [hIn, mIn] = datosSesion.horaInicio.split(':').map(Number);
    const [hOut, mOut] = datosSesion.horaFinal.split(':').map(Number);
    if ((hOut * 60 + mOut) <= (hIn * 60 + mIn)) {
        return toast.error("La hora final debe ser posterior a la de inicio");
    }

    const fechaBase = cita.FechaCita.split('T')[0];
    
    // 🟢 CORRECCIÓN: Se añade pacienteId y psicologoId al envío de datos
    onSubmit({
      citaId: cita.ID_Cita,
      pacienteId: cita.ID_Paciente, // <--- Dato requerido por el service para el expediente
      psicologoId: cita.ID_Psicologo,
      idExpediente: cita.Paciente?.Expediente?.ID_Expediente,
      horaInicio: `${fechaBase}T${datosSesion.horaInicio}:00Z`,
      horaFinal: `${fechaBase}T${datosSesion.horaFinal}:00Z`,
      observaciones: datosSesion.observaciones,
      diagnostico: datosSesion.diagnostico,
      historial: datosSesion.historial,
      criterios: datosSesion.criterios,
      tratamientos: listaTratamientos,
      exploracionIds: Array.from(selectedExploraciones),
    });
  };

  const agregarTratamiento = () => {
    if (!formTratamiento.frecuencia) return toast.error("Indica la frecuencia");
    setListaTratamientos([...listaTratamientos, { ...formTratamiento, id: Date.now() }]);
    setFormTratamiento(initialTratamiento);
  };

  const toggleExploracion = (id: number) => setSelectedExploraciones((p) => {
    const n = new Set(p);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-5xl rounded-[2.5rem] shadow-2xl flex flex-col max-h-[92vh] border border-slate-200 overflow-hidden animate-fade-in-up text-slate-800">
        
        <div className="bg-[#1e293b] text-white px-10 py-6 flex justify-between items-center shrink-0">
          <div>
            <h3 className="text-xl font-bold font-serif italic">Finalizar Sesión Clínica</h3>
            <p className="text-slate-300 text-[10px] uppercase tracking-widest mt-1">
              Paciente: <span className="text-white font-black">{cita.Paciente?.Nombre} {cita.Paciente?.Apellido}</span>
            </p>
          </div>
          <button className="btn btn-sm btn-circle btn-ghost text-white" onClick={onClose}>✕</button>
        </div>

        <div className="p-10 overflow-y-auto flex-1 space-y-10 bg-slate-50/50">
          
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-8">
            <div className="flex-1">
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Icons.Brain /> Exploraciones</h4>
               <div className="flex flex-wrap gap-2">
                 {catalogos.exploraciones?.map((exp: any) => (
                   <button type="button" key={exp.ID_ExploracionPsicologica} onClick={() => toggleExploracion(exp.ID_ExploracionPsicologica)}
                     className={`btn btn-xs rounded-full font-bold transition-all ${selectedExploraciones.has(exp.ID_ExploracionPsicologica) ? "bg-blue-600 text-white shadow-md" : "bg-white text-slate-500 border-slate-200"}`}>
                     {exp.Nombre_De_ExploracionPsicologica}
                   </button>
                 ))}
               </div>
            </div>
            <div className="grid grid-cols-2 gap-4 min-w-[280px]">
               <div className="form-control">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Inicio</label>
                  <input type="time" className="input input-bordered input-sm bg-white font-black text-blue-600" value={datosSesion.horaInicio} onChange={(e) => setDatosSesion({...datosSesion, horaInicio: e.target.value})} />
               </div>
               <div className="form-control">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Final</label>
                  <input type="time" className="input input-bordered input-sm bg-white font-black text-blue-600 border-blue-200" value={datosSesion.horaFinal} onChange={(e) => setDatosSesion({...datosSesion, horaFinal: e.target.value})} />
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Observaciones</label>
              <textarea className="textarea textarea-bordered w-full h-44 bg-white text-sm shadow-inner" placeholder="Notas..." value={datosSesion.observaciones} onChange={(e) => setDatosSesion({ ...datosSesion, observaciones: e.target.value })} />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Diagnóstico *</label>
              <textarea className="textarea textarea-bordered w-full h-44 bg-white border-blue-100 focus:border-blue-500 text-sm shadow-inner" placeholder="Diagnóstico..." value={datosSesion.diagnostico} onChange={(e) => setDatosSesion({ ...datosSesion, diagnostico: e.target.value })} />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Evolución</label>
              <textarea className="textarea textarea-bordered w-full h-44 bg-white text-sm shadow-inner" placeholder="Detalles..." value={datosSesion.historial} onChange={(e) => setDatosSesion({ ...datosSesion, historial: e.target.value })} />
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2rem] border border-emerald-100 shadow-sm border-l-8 border-l-emerald-500">
            <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-6 flex items-center gap-2"><Icons.Pill /> Plan de Tratamiento</h4>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-emerald-50/30 p-6 rounded-2xl mb-6">
              <div className="md:col-span-2">
                <label className="text-[9px] font-bold text-emerald-700 uppercase mb-2 block">Tipo</label>
                <select className="select select-bordered select-sm w-full bg-white font-bold" value={formTratamiento.tipo} onChange={(e) => setFormTratamiento({ ...formTratamiento, tipo: e.target.value as any })}>
                  <option value="terapeutico">Terapia</option>
                  <option value="farmacologico">Fármaco</option>
                </select>
              </div>

              {formTratamiento.tipo === "farmacologico" ? (
                <>
                  <div className="md:col-span-3">
                    <label className="text-[9px] font-bold text-emerald-700 uppercase mb-2 block">Medicamento</label>
                    <input className="input input-bordered input-sm w-full bg-white font-bold" value={formTratamiento.medicamento} onChange={(e) => setFormTratamiento({ ...formTratamiento, medicamento: e.target.value })} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[9px] font-bold text-emerald-700 uppercase mb-2 block">Dosis</label>
                    <input className="input input-bordered input-sm w-full bg-white font-bold" value={formTratamiento.dosis} onChange={(e) => setFormTratamiento({ ...formTratamiento, dosis: e.target.value })} />
                  </div>
                  <div className="md:col-span-3">
                    <label className="text-[9px] font-bold text-emerald-700 uppercase mb-2 block">Vía</label>
                    <select className="select select-bordered select-sm w-full bg-white font-bold" value={formTratamiento.viaAdminId || ""} onChange={(e) => setFormTratamiento({ ...formTratamiento, viaAdminId: Number(e.target.value) })}>
                      <option value="">-- Seleccionar --</option>
                      {catalogos.viasAdmin?.map((v: any) => (<option key={v.ID_ViaAdministracion} value={v.ID_ViaAdministracion}>{v.Nombre_De_Presentacion}</option>))}
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div className="md:col-span-3">
                    <label className="text-[9px] font-bold text-emerald-700 uppercase mb-2 block">Objetivo</label>
                    <input className="input input-bordered input-sm w-full bg-white font-bold" value={formTratamiento.objetivo} onChange={(e) => setFormTratamiento({ ...formTratamiento, objetivo: e.target.value })} />
                  </div>
                  <div className="md:col-span-5">
                    <label className="text-[9px] font-bold text-emerald-700 uppercase mb-2 block">Terapia</label>
                    <select className="select select-bordered select-sm w-full bg-white font-bold" value={formTratamiento.tipoTerapiaId || ""} onChange={(e) => setFormTratamiento({ ...formTratamiento, tipoTerapiaId: Number(e.target.value) })}>
                      <option value="">-- Seleccionar --</option>
                      {catalogos.tiposTerapia?.map((t: any) => (<option key={t.ID_Tipo_Terapia} value={t.ID_Tipo_Terapia}>{t.Nombre_De_Terapia}</option>))}
                    </select>
                  </div>
                </>
              )}
              <div className="md:col-span-2">
                <label className="text-[9px] font-bold text-emerald-700 uppercase mb-2 block">Frecuencia</label>
                <input className="input input-bordered input-sm w-full bg-white font-bold" placeholder="Ej: Cada 8h" value={formTratamiento.frecuencia} onChange={(e) => setFormTratamiento({ ...formTratamiento, frecuencia: e.target.value })} />
              </div>
              <div className="md:col-span-12 flex justify-end">
                <button type="button" className="btn btn-sm btn-primary px-10 text-white rounded-xl shadow-lg" onClick={agregarTratamiento}>+ Añadir Indicación</button>
              </div>
            </div>

            {listaTratamientos.length > 0 && (
              <div className="overflow-x-auto border border-slate-100 rounded-2xl bg-white shadow-inner">
                <table className="table table-xs w-full">
                  <thead className="bg-slate-50 text-[9px] uppercase font-black tracking-widest text-slate-400">
                    <tr><th>Tipo</th><th>Detalle</th><th>Especificación</th><th>Frecuencia</th><th className="w-10"></th></tr>
                  </thead>
                  <tbody>
                    {listaTratamientos.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50 border-b border-slate-50">
                        <td><span className={`badge badge-xs font-bold ${t.tipo === "farmacologico" ? "bg-blue-100 text-blue-600" : "bg-emerald-100 text-emerald-600"} border-none`}>{t.tipo === "farmacologico" ? "Fármaco" : "Terapia"}</span></td>
                        <td className="font-bold text-xs">{t.tipo === "farmacologico" ? t.medicamento : t.objetivo}</td>
                        <td className="text-xs">{t.tipo === "farmacologico" ? `${t.dosis} (${getViaNombre(t.viaAdminId)})` : getTerapiaNombre(t.tipoTerapiaId)}</td>
                        <td className="text-xs font-medium">{t.frecuencia}</td>
                        <td><button type="button" className="text-red-400 hover:text-red-600 transition-colors" onClick={() => setListaTratamientos(prev => prev.filter(x => x.id !== t.id))}>✕</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="px-10 py-6 border-t border-slate-100 flex justify-between items-center bg-white shrink-0">
          <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Expediente #{cita.Paciente?.Expediente?.ID_Expediente}</span>
          <div className="flex gap-4">
            <button className="btn btn-ghost px-10 font-bold text-slate-400" onClick={onClose}>Cancelar</button>
            <button className="btn btn-primary px-16 text-white shadow-xl shadow-blue-200 font-bold" onClick={handleSave}>
              ✅ Finalizar Consulta
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.getElementById("modal-root")!);
}