import { useState, useMemo } from "react";
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
  Diagnosis: () => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M12.79 3.523A3.75 3.75 0 0011.25 2H5.25A3.75 3.75 0 001.5 5.25v9.5A3.75 3.75 0 005.25 18h9.5a3.75 3.75 0 003.75-3.75V8.71a2.25 2.25 0 00-.477-1.423l-3.228-3.229zM10.5 15a.75.75 0 00-1.5 0v.008a.75.75 0 001.5 0v-.008zm1.5-6.75a.75.75 0 00-1.5 0v4.5a.75.75 0 001.5 0v-4.5z" clipRule="evenodd" /></svg>),
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
    observaciones: "",
    diagnostico: "",
    historial: "",
    criterios: "DSM-5",
  });
  const [listaTratamientos, setListaTratamientos] = useState<TratamientoLocal[]>([]);
  const [selectedExploraciones, setSelectedExploraciones] = useState<Set<number>>(new Set());
  const [formTratamiento, setFormTratamiento] = useState<TratamientoLocal>(initialTratamiento);

  // 🟢 CORRECCIÓN: Definición de tipos genéricos para evitar 'unknown'
  const viaMap = useMemo(() => 
    new Map<number, string>(catalogos.viasAdmin?.map((v: any) => [v.ID_ViaAdministracion, v.NombreDePresentacion])), 
    [catalogos.viasAdmin]
  );
  
  const terapiaMap = useMemo(() => 
    new Map<number, string>(catalogos.tiposTerapia?.map((t: any) => [t.ID_TipoTerapia, t.NombreDeTerapia])), 
    [catalogos.tiposTerapia]
  );

  if (!isOpen || !cita) return null;

  const getViaNombre = (id: number | undefined): string => {
    if (!id) return "N/A";
    return viaMap.get(id) || "No encontrado";
  };

  const getTerapiaNombre = (id: number | undefined): string => {
    if (!id) return "N/A";
    return terapiaMap.get(id) || "No encontrado";
  };

  const handleSave = () => {
    if (!datosSesion.diagnostico.trim()) return toast.error("El diagnóstico es obligatorio");
    const horaInicio = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

    onSubmit({
      ID_Cita: cita.ID_Cita,
      ID_Paciente: cita.ID_Paciente,
      ID_Psicologo: cita.ID_Psicologo,
      Observaciones: datosSesion.observaciones,
      DiagnosticoDiferencial: datosSesion.diagnostico,
      HistorialDeEvolucion: datosSesion.historial,
      Criterios_DeDiagnostico: datosSesion.criterios,
      HoraDeInicio: horaInicio,
      tratamientos: listaTratamientos,
      exploracionIds: Array.from(selectedExploraciones),
    });
  };

  const agregarTratamiento = () => {
    if (!formTratamiento.frecuencia) return toast.error("Indica la frecuencia");
    if (formTratamiento.tipo === "farmacologico") {
      if (!formTratamiento.medicamento || !formTratamiento.viaAdminId) return toast.error("Completa datos del fármaco");
    } else {
      if (!formTratamiento.objetivo || !formTratamiento.tipoTerapiaId) return toast.error("Completa datos de terapia");
    }

    setListaTratamientos([...listaTratamientos, { ...formTratamiento, id: Date.now() }]);
    setFormTratamiento(initialTratamiento);
  };

  const eliminarTratamiento = (id: number) => setListaTratamientos((prev) => prev.filter((t) => t.id !== id));
  const toggleExploracion = (id: number) => setSelectedExploraciones((p) => {
    const n = new Set(p);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });

  return (
    <dialog className="modal modal-open bg-black/50 backdrop-blur-sm">
      <div className="modal-box w-11/12 max-w-5xl bg-white text-slate-800 p-0 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="bg-slate-800 text-white px-8 py-4 flex justify-between items-center flex-shrink-0">
          <div className="flex flex-col">
            <h3 className="font-bold text-xl font-serif">Finalizar Sesión Clínica</h3>
            <p className="text-slate-300 text-sm">Paciente: <span className="font-medium text-white">{cita.Paciente?.Nombre} {cita.Paciente?.Apellido}</span></p>
          </div>
          <button className="btn btn-circle btn-ghost text-slate-200" onClick={onClose}>✕</button>
        </div>

        <div className="p-8 overflow-y-auto flex-1 space-y-8 bg-slate-50">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h4 className="font-bold text-slate-700 text-xs uppercase mb-3 flex items-center gap-2"><Icons.Brain /> Exploraciones Psicológicas Realizadas</h4>
            <div className="flex flex-wrap gap-2">
              {catalogos.exploraciones?.map((exp: any) => (
                <button type="button" key={exp.ID_ExploracionPsicologica} onClick={() => toggleExploracion(exp.ID_ExploracionPsicologica)}
                  className={`btn btn-sm rounded-full transition-all text-xs font-medium ${selectedExploraciones.has(exp.ID_ExploracionPsicologica) ? "bg-blue-600 text-white shadow-md" : "btn-outline border-slate-300 text-slate-600"}`}>
                  {exp.NombreDeExploracionPsicologica}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="form-control">
              <label className="label font-bold text-slate-600 text-xs uppercase">Observaciones</label>
              <textarea className="textarea textarea-bordered bg-white h-32 focus:border-primary" placeholder="Notas..." value={datosSesion.observaciones} onChange={(e) => setDatosSesion({ ...datosSesion, observaciones: e.target.value })} />
            </div>
            <div className="form-control">
              <label className="label font-bold text-slate-600 text-xs uppercase flex justify-between"><span>Diagnóstico Diferencial *</span></label>
              <textarea className="textarea textarea-bordered bg-white h-32 focus:border-red-500" placeholder="Diagnóstico principal..." value={datosSesion.diagnostico} onChange={(e) => setDatosSesion({ ...datosSesion, diagnostico: e.target.value })} />
            </div>
            <div className="form-control">
              <label className="label font-bold text-slate-600 text-xs uppercase">Evolución</label>
              <textarea className="textarea textarea-bordered bg-white h-32 focus:border-amber-500" placeholder="Detalles evolutivos..." value={datosSesion.historial} onChange={(e) => setDatosSesion({ ...datosSesion, historial: e.target.value })} />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-emerald-300 shadow-md">
            <h4 className="font-bold text-emerald-800 text-sm uppercase mb-4 flex items-center gap-2"><Icons.Pill /> Plan de Tratamiento</h4>
            <div className="grid grid-cols-12 gap-3 items-end bg-slate-50 p-4 rounded-lg border border-slate-100 mb-4">
              <div className="col-span-2">
                <label className="label-text text-xs text-slate-500 font-bold">Tipo</label>
                <select className="select select-bordered select-sm w-full bg-white" value={formTratamiento.tipo} onChange={(e) => setFormTratamiento({ ...formTratamiento, tipo: e.target.value as any })}>
                  <option value="terapeutico">Terapia</option>
                  <option value="farmacologico">Fármaco</option>
                </select>
              </div>

              {formTratamiento.tipo === "farmacologico" ? (
                <>
                  <div className="col-span-3">
                    <label className="label-text text-xs text-slate-500 font-bold">Medicamento</label>
                    <input className="input input-bordered input-sm w-full bg-white" placeholder="Ej: Sertralina" value={formTratamiento.medicamento} onChange={(e) => setFormTratamiento({ ...formTratamiento, medicamento: e.target.value })} />
                  </div>
                  <div className="col-span-2">
                    <label className="label-text text-xs text-slate-500 font-bold">Dosis</label>
                    <input className="input input-bordered input-sm w-full bg-white" placeholder="Ej: 50mg" value={formTratamiento.dosis} onChange={(e) => setFormTratamiento({ ...formTratamiento, dosis: e.target.value })} />
                  </div>
                  <div className="col-span-3">
                    <label className="label-text text-xs text-slate-500 font-bold">Vía Admin.</label>
                    <select className="select select-bordered select-sm w-full bg-white" value={formTratamiento.viaAdminId || ""} onChange={(e) => setFormTratamiento({ ...formTratamiento, viaAdminId: Number(e.target.value) })}>
                      <option value="">Seleccionar...</option>
                      {catalogos.viasAdmin?.map((v: any) => (<option key={v.ID_ViaAdministracion} value={v.ID_ViaAdministracion}>{v.NombreDePresentacion}</option>))}
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div className="col-span-3">
                    <label className="label-text text-xs text-slate-500 font-bold">Objetivo</label>
                    <input className="input input-bordered input-sm w-full bg-white" placeholder="Ej: Reducir ansiedad" value={formTratamiento.objetivo} onChange={(e) => setFormTratamiento({ ...formTratamiento, objetivo: e.target.value })} />
                  </div>
                  <div className="col-span-5">
                    <label className="label-text text-xs text-slate-500 font-bold">Tipo Terapia</label>
                    <select className="select select-bordered select-sm w-full bg-white" value={formTratamiento.tipoTerapiaId || ""} onChange={(e) => setFormTratamiento({ ...formTratamiento, tipoTerapiaId: Number(e.target.value) })}>
                      <option value="">Seleccionar...</option>
                      {catalogos.tiposTerapia?.map((t: any) => (<option key={t.ID_TipoTerapia} value={t.ID_TipoTerapia}>{t.NombreDeTerapia}</option>))}
                    </select>
                  </div>
                </>
              )}
              <div className="col-span-2">
                <label className="label-text text-xs text-slate-500 font-bold">Frecuencia</label>
                <input className="input input-bordered input-sm w-full bg-white" placeholder="Ej: Cada 8h" value={formTratamiento.frecuencia} onChange={(e) => setFormTratamiento({ ...formTratamiento, frecuencia: e.target.value })} />
              </div>
              <div className="col-span-12 flex justify-end mt-2">
                <button type="button" className="btn btn-sm bg-emerald-600 text-white hover:bg-emerald-700 shadow-md" onClick={agregarTratamiento}>+ Agregar Indicación</button>
              </div>
            </div>

            {listaTratamientos.length > 0 && (
              <div className="overflow-x-auto mt-6">
                <table className="table table-xs w-full bg-white rounded-lg border border-slate-200">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 uppercase text-xs font-bold">
                      <th>Tipo</th><th>Detalle Principal</th><th>Especificación</th><th>Frecuencia</th><th className="w-16"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {listaTratamientos.map((t) => (
                      <tr key={t.id} className="hover:bg-emerald-50/50 transition-colors">
                        <td>
                          <span className={`badge badge-xs ${t.tipo === "farmacologico" ? "bg-info/30 text-info" : "bg-warning/30 text-warning"} border-none font-medium`}>
                            {t.tipo === "farmacologico" ? "Fármaco" : "Terapia"}
                          </span>
                        </td>
                        <td className="font-bold text-slate-700">{t.tipo === "farmacologico" ? t.medicamento : t.objetivo}</td>
                        <td>{t.tipo === "farmacologico" ? `${t.dosis} (${getViaNombre(t.viaAdminId)})` : getTerapiaNombre(t.tipoTerapiaId)}</td>
                        <td className="text-sm text-slate-600">{t.frecuencia}</td>
                        <td><button type="button" className="btn btn-ghost btn-xs text-red-500 hover:bg-red-100" onClick={() => eliminarTratamiento(t.id)}>✕</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-4 border-t border-slate-200 flex justify-between items-center flex-shrink-0">
          <span className="text-xs text-slate-400">Guardando para Exp. #{cita.ID_Paciente}</span>
          <div className="flex gap-3">
            <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
            <button className="btn bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg px-8" onClick={handleSave}>✅ Finalizar Consulta y Guardar</button>
          </div>
        </div>
      </div>
    </dialog>
  );
}