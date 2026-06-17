import { toast } from 'sonner';
import type { Dispatch, FormEvent, SetStateAction } from 'react';
import type {
  Departamento,
  EstadoCivil,
  Municipio,
  Ocupacion,
  Pais,
  Parentesco,
} from '../../types';
import type { TutorFormData } from '../../hooks/useTutores';

interface TutorFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  formData: TutorFormData;
  setFormData: Dispatch<SetStateAction<TutorFormData>>;
  catalogos: {
    ocupaciones: Ocupacion[];
    estadosCiviles: EstadoCivil[];
    parentescos: Parentesco[];
    paises: Pais[];
    departamentos: Departamento[];
    municipios: Municipio[];
  };
}

const Icons = {
  User: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 7.5a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 20.25a7.5 7.5 0 0115 0" />
    </svg>
  ),
  Identification: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h12A2.25 2.25 0 0120.25 6v12A2.25 2.25 0 0118 20.25H6A2.25 2.25 0 013.75 18V6z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h4.5M7.5 12h9M7.5 15.75h6" />
    </svg>
  ),
  Phone: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25A2.25 2.25 0 0021.75 19.5v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106a1.125 1.125 0 00-1.173.417l-.97 1.293a1.125 1.125 0 01-1.21.38 12.035 12.035 0 01-7.143-7.143 1.125 1.125 0 01.38-1.21l1.293-.97a1.125 1.125 0 00.417-1.173L6.963 3.102A1.125 1.125 0 005.872 2.25H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
    </svg>
  ),
  Briefcase: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.1A2.25 2.25 0 0118 20.5H6a2.25 2.25 0 01-2.25-2.25v-4.1m16.5 0A2.25 2.25 0 0022.5 11.9V8.25A2.25 2.25 0 0020.25 6h-16.5A2.25 2.25 0 001.5 8.25v3.65a2.25 2.25 0 002.25 2.25m16.5 0H3.75m6-8.15V4.5A1.5 1.5 0 0111.25 3h1.5a1.5 1.5 0 011.5 1.5V6" />
    </svg>
  ),
  MapPin: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s7.5-4.875 7.5-11.25a7.5 7.5 0 10-15 0C4.5 16.125 12 21 12 21z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 12.75a3 3 0 100-6 3 3 0 000 6z" />
    </svg>
  ),
  Close: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  Check: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l5.25 5.25L19.5 6.75" />
    </svg>
  ),
};

const inputClass = 'input input-bordered w-full bg-slate-50 border-slate-200 text-slate-700 placeholder:text-slate-400 focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all';
const selectClass = 'select select-bordered w-full bg-slate-50 border-slate-200 text-slate-700 focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all';
const labelClass = 'label pb-1 pt-0';
const labelTextClass = 'label-text text-[11px] font-black uppercase tracking-[0.16em] text-slate-500';

const formatearCedula = (valor: string) => {
  let texto = valor.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

  if (texto.length > 14) texto = texto.slice(0, 14);
  if (texto.length > 9) return `${texto.slice(0, 3)}-${texto.slice(3, 9)}-${texto.slice(9)}`;
  if (texto.length > 3) return `${texto.slice(0, 3)}-${texto.slice(3)}`;

  return texto;
};

const esCedulaValida = (cedula: string) => /^\d{3}-\d{6}-\d{4}[A-Z]$/.test(cedula);
const esTelefonoValido = (telefono: string) => /^[2578]\d{7}$/.test(telefono.replace(/[\s-]/g, ''));

const toNumber = (value: string) => {
  const parsed = Number(value);

  return Number.isInteger(parsed) ? parsed : 0;
};

const obtenerNombrePais = (paisId: string, paises: Pais[], fallback: string) => {
  const id = Number(paisId);
  const pais = paises.find((item) => item.ID_Pais === id);

  return pais?.Nombre_Pais || fallback;
};

export default function TutorFormModal({
  isOpen,
  onClose,
  onSubmit,
  formData,
  setFormData,
  catalogos,
}: TutorFormModalProps) {
  if (!isOpen) return null;

  const municipiosFiltrados = catalogos.municipios.filter((municipio) => {
    return municipio.ID_Departamento === Number(formData.Direccion.departamentoId);
  });

  const departamentoSeleccionado = catalogos.departamentos.find((departamento) => {
    return departamento.ID_Departamento === Number(formData.Direccion.departamentoId);
  });

  const municipioSeleccionado = municipiosFiltrados.find((municipio) => {
    return municipio.ID_Municipio === Number(formData.Direccion.municipioId);
  });

  const nombreCompleto = `${formData.Nombre} ${formData.Apellido}`.trim() || 'Tutor seleccionado';

  const resumenDireccion = [
    formData.Direccion.Pais,
    departamentoSeleccionado?.Nombre_Departamento,
    municipioSeleccionado?.Nombre_Municipio,
    formData.Direccion.Barrio,
  ].filter(Boolean).join(', ');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!esCedulaValida(formData.No_Cedula)) {
      toast.error('Formato de cédula inválido. Usa XXX-XXXXXX-XXXXL.');
      return;
    }

    if (!esTelefonoValido(formData.No_Telefono)) {
      toast.error('Teléfono inválido. Debe tener 8 dígitos e iniciar con 2, 5, 7 u 8.');
      return;
    }

    if (!formData.ID_Parentesco || !formData.Ocupacion || !formData.EstadoCivil) {
      toast.error('Selecciona parentesco, ocupación y estado civil.');
      return;
    }

    if (!formData.Direccion.paisId || !formData.Direccion.departamentoId || !formData.Direccion.municipioId) {
      toast.error('Selecciona país, departamento y municipio.');
      return;
    }

    if (!formData.Direccion.Barrio.trim()) {
      toast.error('El barrio es obligatorio.');
      return;
    }

    onSubmit(event);
  };

  return (
    <dialog className="modal modal-open bg-slate-950/50 backdrop-blur-sm">
      <div className="modal-box w-11/12 max-w-5xl bg-white p-0 rounded-[2rem] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col border border-white/70">
        <div className="relative overflow-hidden bg-slate-950 px-8 py-7 text-white">
          <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl"></div>
          <div className="absolute -bottom-28 -left-20 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl"></div>

          <div className="relative z-10 flex items-start justify-between gap-5">
            <div className="flex items-center gap-4 min-w-0">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15 shadow-xl">
                <Icons.User />
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-emerald-300">
                  Registro de responsable
                </p>
                <h3 className="mt-1 truncate font-serif text-2xl font-bold tracking-tight">
                  Editar información del tutor
                </h3>
                <p className="mt-1 truncate text-sm text-slate-300">
                  {nombreCompleto}
                </p>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-sm btn-circle border-white/10 bg-white/10 text-white hover:border-white/20 hover:bg-white/20 shrink-0"
              onClick={onClose}
              aria-label="Cerrar modal"
            >
              <Icons.Close />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto bg-slate-50">
          <div className="p-5 sm:p-8">
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              <div className="xl:col-span-7 space-y-6">
                <section className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                      <Icons.Identification />
                    </div>
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-[0.18em] text-slate-800">
                        Datos personales
                      </h4>
                      <p className="text-xs text-slate-400">
                        Identidad y contacto directo del responsable.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="form-control">
                      <label className={labelClass}>
                        <span className={labelTextClass}>Nombre</span>
                      </label>
                      <input
                        required
                        type="text"
                        placeholder="Nombre del tutor"
                        className={inputClass}
                        value={formData.Nombre}
                        onChange={(event) => setFormData((prev) => ({ ...prev, Nombre: event.target.value }))}
                      />
                    </div>

                    <div className="form-control">
                      <label className={labelClass}>
                        <span className={labelTextClass}>Apellido</span>
                      </label>
                      <input
                        required
                        type="text"
                        placeholder="Apellido del tutor"
                        className={inputClass}
                        value={formData.Apellido}
                        onChange={(event) => setFormData((prev) => ({ ...prev, Apellido: event.target.value }))}
                      />
                    </div>

                    <div className="form-control">
                      <label className={labelClass}>
                        <span className={labelTextClass}>Cédula</span>
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                          <Icons.Identification />
                        </div>
                        <input
                          required
                          type="text"
                          placeholder="000-000000-0000A"
                          className={`${inputClass} pl-11 font-mono tracking-wide`}
                          value={formData.No_Cedula}
                          maxLength={16}
                          onChange={(event) => setFormData((prev) => ({
                            ...prev,
                            No_Cedula: formatearCedula(event.target.value),
                          }))}
                        />
                      </div>
                    </div>

                    <div className="form-control">
                      <label className={labelClass}>
                        <span className={labelTextClass}>Teléfono</span>
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                          <Icons.Phone />
                        </div>
                        <input
                          required
                          type="text"
                          placeholder="88888888"
                          className={`${inputClass} pl-11 font-mono`}
                          value={formData.No_Telefono}
                          onChange={(event) => setFormData((prev) => ({ ...prev, No_Telefono: event.target.value }))}
                          maxLength={8}
                        />
                      </div>
                    </div>
                  </div>
                </section>

                <section className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                      <Icons.Briefcase />
                    </div>
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-[0.18em] text-slate-800">
                        Información adicional
                      </h4>
                      <p className="text-xs text-slate-400">
                        Relación con el paciente y datos sociofamiliares.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    <div className="form-control">
                      <label className={labelClass}>
                        <span className={labelTextClass}>Parentesco</span>
                      </label>
                      <select
                        className={selectClass}
                        value={formData.ID_Parentesco}
                        onChange={(event) => setFormData((prev) => ({
                          ...prev,
                          ID_Parentesco: toNumber(event.target.value),
                        }))}
                      >
                        <option value={0}>Seleccionar...</option>
                        {catalogos.parentescos.map((parentesco) => (
                          <option key={parentesco.ID_Parentesco} value={parentesco.ID_Parentesco}>
                            {parentesco.Nombre_De_Parentesco}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-control">
                      <label className={labelClass}>
                        <span className={labelTextClass}>Ocupación</span>
                      </label>
                      <select
                        className={selectClass}
                        value={formData.Ocupacion}
                        onChange={(event) => setFormData((prev) => ({
                          ...prev,
                          Ocupacion: toNumber(event.target.value),
                        }))}
                      >
                        <option value={0}>Seleccionar...</option>
                        {catalogos.ocupaciones.map((ocupacion) => (
                          <option key={ocupacion.ID_Ocupacion} value={ocupacion.ID_Ocupacion}>
                            {ocupacion.Nombre_DeOcupacion}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-control">
                      <label className={labelClass}>
                        <span className={labelTextClass}>Estado civil</span>
                      </label>
                      <select
                        className={selectClass}
                        value={formData.EstadoCivil}
                        onChange={(event) => setFormData((prev) => ({
                          ...prev,
                          EstadoCivil: toNumber(event.target.value),
                        }))}
                      >
                        <option value={0}>Seleccionar...</option>
                        {catalogos.estadosCiviles.map((estadoCivil) => (
                          <option key={estadoCivil.ID_EstadoCivil} value={estadoCivil.ID_EstadoCivil}>
                            {estadoCivil.Nombre_EstadoCivil}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </section>
              </div>

              <div className="xl:col-span-5">
                <section className="h-full rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                      <Icons.MapPin />
                    </div>
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-[0.18em] text-slate-800">
                        Dirección del tutor
                      </h4>
                      <p className="text-xs text-slate-400">
                        Selección territorial en cascada.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-4">
                      <div className="form-control">
                        <label className={labelClass}>
                          <span className={labelTextClass}>País</span>
                        </label>
                        <select
                          required
                          className={selectClass}
                          value={formData.Direccion.paisId}
                          onChange={(event) => {
                            const paisId = event.target.value;

                            setFormData((prev) => ({
                              ...prev,
                              Direccion: {
                                ...prev.Direccion,
                                paisId,
                                Pais: obtenerNombrePais(paisId, catalogos.paises, ''),
                                departamentoId: '',
                                municipioId: '',
                                ID_Municipio: 0,
                              },
                            }));
                          }}
                        >
                          <option value="">1. Seleccionar país...</option>
                          {catalogos.paises.map((pais) => (
                            <option key={pais.ID_Pais} value={pais.ID_Pais}>
                              {pais.Nombre_Pais}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-control">
                        <label className={labelClass}>
                          <span className={labelTextClass}>Departamento</span>
                        </label>
                        <select
                          required
                          className={selectClass}
                          value={formData.Direccion.departamentoId}
                          disabled={!formData.Direccion.paisId}
                          onChange={(event) => setFormData((prev) => ({
                            ...prev,
                            Direccion: {
                              ...prev.Direccion,
                              departamentoId: event.target.value,
                              municipioId: '',
                              ID_Municipio: 0,
                            },
                          }))}
                        >
                          <option value="">2. Seleccionar departamento...</option>
                          {catalogos.departamentos.map((departamento) => (
                            <option key={departamento.ID_Departamento} value={departamento.ID_Departamento}>
                              {departamento.Nombre_Departamento}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="form-control">
                      <label className={labelClass}>
                        <span className={labelTextClass}>Municipio</span>
                      </label>
                      <select
                        required
                        className={selectClass}
                        value={formData.Direccion.municipioId}
                        disabled={!formData.Direccion.departamentoId}
                        onChange={(event) => setFormData((prev) => ({
                          ...prev,
                          Direccion: {
                            ...prev.Direccion,
                            municipioId: event.target.value,
                            ID_Municipio: toNumber(event.target.value),
                          },
                        }))}
                      >
                        <option value="">3. Seleccionar municipio...</option>
                        {municipiosFiltrados.map((municipio) => (
                          <option key={municipio.ID_Municipio} value={municipio.ID_Municipio}>
                            {municipio.Nombre_Municipio}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-4">
                      <div className="form-control">
                        <label className={labelClass}>
                          <span className={labelTextClass}>Barrio</span>
                        </label>
                        <input
                          required
                          type="text"
                          placeholder="Barrio / Residencial"
                          className={inputClass}
                          value={formData.Direccion.Barrio}
                          onChange={(event) => setFormData((prev) => ({
                            ...prev,
                            Direccion: { ...prev.Direccion, Barrio: event.target.value },
                          }))}
                        />
                      </div>

                      <div className="form-control">
                        <label className={labelClass}>
                          <span className={labelTextClass}>Calle</span>
                        </label>
                        <textarea
                          placeholder="Calle / Dirección exacta"
                          className="textarea textarea-bordered min-h-24 w-full resize-none bg-slate-50 border-slate-200 text-slate-700 placeholder:text-slate-400 focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all"
                          value={formData.Direccion.Calle}
                          onChange={(event) => setFormData((prev) => ({
                            ...prev,
                            Direccion: { ...prev.Direccion, Calle: event.target.value },
                          }))}
                        />
                      </div>
                    </div>

                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
                          <Icons.Check />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                            Resumen de ubicación
                          </p>
                          <p className="mt-1 text-sm leading-relaxed text-slate-600">
                            {resumenDireccion || 'Selecciona la dirección del tutor.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 z-20 flex flex-col gap-4 border-t border-slate-200 bg-white/95 px-6 py-5 backdrop-blur sm:flex-row sm:items-center sm:justify-between lg:px-8">
            <p className="text-center text-xs text-slate-400 sm:text-left">
              Los cambios actualizarán la información general y la dirección del tutor.
            </p>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <button
                type="button"
                className="btn btn-ghost w-full text-slate-500 hover:bg-slate-100 sm:w-auto"
                onClick={onClose}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="btn w-full rounded-xl border-slate-900 bg-slate-900 px-8 text-white shadow-lg shadow-slate-900/20 hover:border-slate-800 hover:bg-slate-800 sm:w-auto"
              >
                Actualizar Tutor
              </button>
            </div>
          </div>
        </form>
      </div>
    </dialog>
  );
}
