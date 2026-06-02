import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import type {
  Especialidad,
  PsicologoCompleto,
  PsicologoFormData,
} from '../../hooks/usePsicologos';
import type { Departamento, Municipio, Pais } from '../../types';

interface PsicologoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PsicologoFormData, isEdit: boolean) => Promise<boolean>;
  psicologoEditar: PsicologoCompleto | null;
  catalogos: {
    especialidades: Especialidad[];
    paises: Pais[];
    departamentos: Departamento[];
    municipios: Municipio[];
  };
}

const Icons = {
  User: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-5 w-5">
      <circle cx="12" cy="8" r="3.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 21a7 7 0 0114 0" />
    </svg>
  ),
  Hash: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 9h14M4 15h14M10 4L8 20M16 4l-2 16" />
    </svg>
  ),
  Phone: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3.75h3l1.5 4-2 1.25a11.25 11.25 0 005.75 5.75l1.25-2 4 1.5v3a2.25 2.25 0 01-2.25 2.25A15.75 15.75 0 013.75 6a2.25 2.25 0 012.25-2.25h.75z" />
    </svg>
  ),
  Mail: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-5 w-5">
      <rect x="3.75" y="5.25" width="16.5" height="13.5" rx="2.25" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 7.5l7.5 5.25L19.5 7.5" />
    </svg>
  ),
  MapPin: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s7.5-4.875 7.5-11.25a7.5 7.5 0 10-15 0C4.5 16.125 12 21 12 21z" />
      <circle cx="12" cy="9.75" r="2.75" />
    </svg>
  ),
  Award: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-5 w-5">
      <circle cx="12" cy="8" r="5.25" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.5 12.25L7.5 21l4.5-2.5 4.5 2.5-1-8.75" />
    </svg>
  ),
  Check: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.9} stroke="currentColor" className="h-5 w-5">
      <circle cx="12" cy="12" r="8.25" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.75 12.25l2.25 2.25 4.5-5" />
    </svg>
  ),
  Close: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
};

const initialForm: PsicologoFormData = {
  nombre: '',
  apellido: '',
  codigoMinsa: '',
  telefono: '',
  email: '',
  activo: true,
  direccion: {
    paisId: '',
    departamentoId: '',
    municipioId: '',
    barrio: '',
    calle: '',
  },
  especialidadIds: [],
};

const esTelefonoValido = (telefono: string) => {
  return /^[2578]\d{7}$/.test(telefono.replace(/[\s-]/g, ''));
};

function getNombreEspecialidad(especialidad: Especialidad) {
  return especialidad.Nombre_Especialidad || especialidad.NombreEspecialidad || 'Especialidad';
}

function getEspecialidadesSeleccionadas(psicologo: PsicologoCompleto) {
  return (psicologo.Psicologo_EspecialidadPsicologo || [])
    .map((relacion) => relacion.ID_Especialidad || relacion.EspecialidadPsicologo?.ID_Especialidad || relacion.Especialidad?.ID_Especialidad)
    .filter((id): id is number => typeof id === 'number')
    .map((id) => id.toString());
}

function getPaisIdDesdeDireccion(psicologo: PsicologoCompleto, paises: Pais[]) {
  const paisDireccion = psicologo.Direccion?.Pais?.trim().toLowerCase();

  if (paisDireccion) {
    const paisEncontrado = paises.find((pais) => pais.Nombre_Pais.trim().toLowerCase() === paisDireccion);

    if (paisEncontrado) return paisEncontrado.ID_Pais.toString();
  }

  return paises.length === 1 ? paises[0].ID_Pais.toString() : '';
}

function getInitialForm(psicologoEditar: PsicologoCompleto | null, paises: Pais[]): PsicologoFormData {
  if (!psicologoEditar) {
    return {
      ...initialForm,
      direccion: {
        ...initialForm.direccion,
        paisId: paises.length === 1 ? paises[0].ID_Pais.toString() : '',
      },
    };
  }

  return {
    nombre: psicologoEditar.Nombre || '',
    apellido: psicologoEditar.Apellido || '',
    codigoMinsa: psicologoEditar.CodigoMinsa || '',
    telefono: psicologoEditar.No_Telefono || '',
    email: psicologoEditar.Email || '',
    activo: psicologoEditar.Activo ?? true,
    direccion: {
      paisId: getPaisIdDesdeDireccion(psicologoEditar, paises),
      departamentoId:
        psicologoEditar.Direccion?.Municipio?.ID_Departamento?.toString() ||
        psicologoEditar.Direccion?.Municipio?.Departamento?.ID_Departamento?.toString() ||
        '',
      municipioId:
        psicologoEditar.Direccion?.ID_Municipio?.toString() ||
        psicologoEditar.Direccion?.Municipio?.ID_Municipio?.toString() ||
        '',
      barrio: psicologoEditar.Direccion?.Barrio || '',
      calle: psicologoEditar.Direccion?.Calle || '',
    },
    especialidadIds: getEspecialidadesSeleccionadas(psicologoEditar),
  };
}

export default function PsicologoFormModal({
  isOpen,
  onClose,
  onSubmit,
  psicologoEditar,
  catalogos,
}: PsicologoFormModalProps) {
  const [formData, setFormData] = useState<PsicologoFormData>(initialForm);
  const [guardando, setGuardando] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setFormData(getInitialForm(psicologoEditar, catalogos.paises));
    }
  }, [psicologoEditar, isOpen, catalogos.paises]);

  const handleEspecialidadChange = (id: string) => {
    setFormData((prev) => {
      const exists = prev.especialidadIds.includes(id);

      return {
        ...prev,
        especialidadIds: exists
          ? prev.especialidadIds.filter((item) => item !== id)
          : [...prev.especialidadIds, id],
      };
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!esTelefonoValido(formData.telefono)) {
      toast.error('Formato de teléfono incorrecto. Deben ser 8 dígitos y comenzar con 2, 5, 7 u 8.');
      return;
    }

    if (!formData.direccion.paisId || !formData.direccion.departamentoId || !formData.direccion.municipioId) {
      toast.error('Selecciona país, departamento y municipio.');
      return;
    }

    if (!formData.direccion.barrio.trim()) {
      toast.error('El barrio es obligatorio.');
      return;
    }

    if (formData.especialidadIds.length === 0) {
      toast.error('Selecciona al menos una especialidad.');
      return;
    }

    try {
      setGuardando(true);
      await onSubmit(formData, Boolean(psicologoEditar));
    } finally {
      setGuardando(false);
    }
  };

  if (!isOpen) return null;

  const municipiosFiltrados = catalogos.municipios.filter(
    (municipio) => municipio.ID_Departamento === Number(formData.direccion.departamentoId)
  );

  const nombreCompleto = `${formData.nombre} ${formData.apellido}`.trim() || 'Sin nombre';
  const especialidadesTexto = formData.especialidadIds.length === 1
    ? '1 especialidad seleccionada'
    : `${formData.especialidadIds.length} especialidades seleccionadas`;

  const direccionResumen = [
    catalogos.departamentos.find((departamento) => departamento.ID_Departamento === Number(formData.direccion.departamentoId))?.Nombre_Departamento,
    catalogos.municipios.find((municipio) => municipio.ID_Municipio === Number(formData.direccion.municipioId))?.Nombre_Municipio,
    formData.direccion.barrio,
  ].filter(Boolean).join(', ') || 'Sin dirección completa';

  const pasos = [
    { label: 'Identidad', done: Boolean(formData.nombre.trim() && formData.apellido.trim() && formData.codigoMinsa.trim()) },
    { label: 'Contacto', done: Boolean(formData.telefono.trim() && formData.email.trim()) },
    { label: 'Ubicación', done: Boolean(formData.direccion.paisId && formData.direccion.departamentoId && formData.direccion.municipioId && formData.direccion.barrio.trim()) },
    { label: 'Especialidades', done: formData.especialidadIds.length > 0 },
  ];

  return (
    <dialog className="modal modal-open bg-slate-950/50 backdrop-blur-sm">
      <div className="modal-box grid h-[92vh] w-11/12 max-w-7xl grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-[2rem] bg-white p-0 text-slate-800 shadow-2xl">
        <div className="relative overflow-hidden bg-slate-950 px-6 py-5 text-white">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-500/25 blur-3xl"></div>
          <div className="absolute -bottom-28 left-14 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl"></div>

          <div className="relative z-10 flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-blue-300">
                Equipo clínico
              </p>
              <h2 className="mt-1 font-serif text-2xl font-black tracking-tight text-white">
                {psicologoEditar ? 'Editar perfil profesional' : 'Registrar nuevo psicólogo'}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">
                Complete la identidad profesional, contacto, ubicación y especialidades clínicas del psicólogo.
              </p>
            </div>

            <button
              type="button"
              className="btn btn-sm btn-circle border-white/10 bg-white/10 text-white hover:bg-white/20"
              onClick={onClose}
              disabled={guardando}
            >
              <Icons.Close />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="contents">
          <div className="min-h-0 overflow-y-auto bg-slate-50/70 p-5">
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[315px_minmax(0,1fr)]">
              <aside className="space-y-4 xl:sticky xl:top-0 xl:self-start">
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-600">
                    Resumen profesional
                  </p>

                  <div className="mt-4 flex items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-700 shadow-sm">
                      <Icons.User />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-lg font-black text-slate-950" title={nombreCompleto}>
                        {nombreCompleto}
                      </p>
                      <p className="mt-1 truncate text-xs font-bold text-slate-400" title={formData.codigoMinsa || 'Sin código MINSA'}>
                        {formData.codigoMinsa || 'Sin código MINSA'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Contacto</p>
                      <p className="mt-1 truncate text-sm font-black text-slate-800" title={formData.email || 'Sin correo'}>
                        {formData.email || 'Sin correo'}
                      </p>
                      <p className="mt-1 font-mono text-xs font-bold text-slate-500">
                        {formData.telefono || 'Sin teléfono'}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Dirección</p>
                      <p className="mt-1 text-sm font-bold leading-relaxed text-slate-700" title={direccionResumen}>
                        {direccionResumen}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-blue-50 p-4 text-blue-700">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em]">Especialidades</p>
                      <p className="mt-1 text-sm font-black">{especialidadesTexto}</p>
                    </div>

                    {psicologoEditar && (
                      <div className={`rounded-2xl p-4 ${formData.activo ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                        <p className="text-[10px] font-black uppercase tracking-[0.18em]">Estado</p>
                        <p className="mt-1 text-sm font-black">{formData.activo ? 'Activo' : 'Inactivo'}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                    Progreso
                  </p>

                  <div className="mt-4 space-y-3">
                    {pasos.map((step) => (
                      <div key={step.label} className="flex items-center gap-3">
                        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl ${
                          step.done ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                        }`}>
                          <Icons.Check />
                        </span>
                        <span className={`text-sm font-bold ${step.done ? 'text-slate-700' : 'text-slate-400'}`}>
                          {step.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </aside>

              <div className="space-y-5">
                <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-5">
                    <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-blue-600">
                      <Icons.User />
                      Identidad
                    </p>
                    <h4 className="mt-1 text-lg font-black text-slate-900">Datos profesionales</h4>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">Nombre</label>
                      <input
                        required
                        type="text"
                        placeholder="Ej. Juan"
                        className="input input-bordered h-12 w-full rounded-2xl bg-slate-50 text-sm font-medium transition-colors focus:bg-white"
                        value={formData.nombre}
                        onChange={(event) => setFormData({ ...formData, nombre: event.target.value })}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">Apellido</label>
                      <input
                        required
                        type="text"
                        placeholder="Ej. Pérez"
                        className="input input-bordered h-12 w-full rounded-2xl bg-slate-50 text-sm font-medium transition-colors focus:bg-white"
                        value={formData.apellido}
                        onChange={(event) => setFormData({ ...formData, apellido: event.target.value })}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">Código MINSA</label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                          <Icons.Hash />
                        </div>
                        <input
                          required
                          type="text"
                          placeholder="MINSA-0000"
                          className="input input-bordered h-12 w-full rounded-2xl bg-slate-50 pl-12 font-mono text-sm font-bold tracking-wide transition-colors focus:bg-white"
                          value={formData.codigoMinsa}
                          onChange={(event) => setFormData({ ...formData, codigoMinsa: event.target.value })}
                        />
                      </div>
                    </div>

                    {psicologoEditar && (
                      <div className="md:col-span-2">
                        <label className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">Estado profesional</label>
                        <select
                          className={`select select-bordered h-12 w-full rounded-2xl text-sm font-black ${
                            formData.activo
                              ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                              : 'border-rose-100 bg-rose-50 text-rose-700'
                          }`}
                          value={formData.activo ? 'true' : 'false'}
                          onChange={(event) => setFormData({ ...formData, activo: event.target.value === 'true' })}
                        >
                          <option value="true">Profesional activo</option>
                          <option value="false">Profesional inactivo</option>
                        </select>
                      </div>
                    )}
                  </div>
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-5">
                    <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-blue-600">
                      <Icons.Phone />
                      Contacto
                    </p>
                    <h4 className="mt-1 text-lg font-black text-slate-900">Teléfono y correo</h4>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">Teléfono móvil</label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                          <Icons.Phone />
                        </div>
                        <input
                          required
                          type="text"
                          placeholder="88888888"
                          className="input input-bordered h-12 w-full rounded-2xl bg-slate-50 pl-12 font-mono text-sm font-bold transition-colors focus:bg-white"
                          value={formData.telefono}
                          maxLength={8}
                          onChange={(event) => setFormData({ ...formData, telefono: event.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">Correo electrónico</label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                          <Icons.Mail />
                        </div>
                        <input
                          required
                          type="email"
                          placeholder="doctor@clinica.com"
                          className="input input-bordered h-12 w-full rounded-2xl bg-slate-50 pl-12 text-sm font-medium transition-colors focus:bg-white"
                          value={formData.email}
                          onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-5">
                    <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-blue-600">
                      <Icons.MapPin />
                      Ubicación
                    </p>
                    <h4 className="mt-1 text-lg font-black text-slate-900">Dirección profesional</h4>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <select
                      required
                      className="select select-bordered h-12 w-full rounded-2xl bg-slate-50 text-sm font-medium transition-colors focus:bg-white"
                      value={formData.direccion.paisId}
                      onChange={(event) => setFormData({
                        ...formData,
                        direccion: {
                          ...formData.direccion,
                          paisId: event.target.value,
                          departamentoId: '',
                          municipioId: '',
                        },
                      })}
                    >
                      <option value="">1. Seleccione el país...</option>
                      {catalogos.paises.map((pais) => (
                        <option key={pais.ID_Pais} value={pais.ID_Pais}>
                          {pais.Nombre_Pais}
                        </option>
                      ))}
                    </select>

                    <select
                      required
                      className="select select-bordered h-12 w-full rounded-2xl bg-slate-50 text-sm font-medium transition-colors focus:bg-white"
                      value={formData.direccion.departamentoId}
                      onChange={(event) => setFormData({
                        ...formData,
                        direccion: {
                          ...formData.direccion,
                          departamentoId: event.target.value,
                          municipioId: '',
                        },
                      })}
                      disabled={!formData.direccion.paisId}
                    >
                      <option value="">2. Seleccione el departamento...</option>
                      {catalogos.departamentos.map((departamento) => (
                        <option key={departamento.ID_Departamento} value={departamento.ID_Departamento}>
                          {departamento.Nombre_Departamento}
                        </option>
                      ))}
                    </select>

                    <select
                      required
                      className="select select-bordered h-12 w-full rounded-2xl bg-slate-50 text-sm font-medium transition-colors focus:bg-white"
                      value={formData.direccion.municipioId}
                      onChange={(event) => setFormData({
                        ...formData,
                        direccion: {
                          ...formData.direccion,
                          municipioId: event.target.value,
                        },
                      })}
                      disabled={!formData.direccion.departamentoId}
                    >
                      <option value="">3. Seleccione el municipio...</option>
                      {municipiosFiltrados.map((municipio) => (
                        <option key={municipio.ID_Municipio} value={municipio.ID_Municipio}>
                          {municipio.Nombre_Municipio}
                        </option>
                      ))}
                    </select>

                    <input
                      required
                      type="text"
                      placeholder="Barrio / residencial"
                      className="input input-bordered h-12 w-full rounded-2xl bg-slate-50 text-sm font-medium transition-colors focus:bg-white"
                      value={formData.direccion.barrio}
                      onChange={(event) => setFormData({
                        ...formData,
                        direccion: { ...formData.direccion, barrio: event.target.value },
                      })}
                    />

                    <textarea
                      placeholder="Calle / dirección exacta"
                      className="textarea textarea-bordered min-h-28 w-full resize-none rounded-3xl bg-slate-50 text-sm leading-relaxed transition-colors focus:bg-white md:col-span-2"
                      value={formData.direccion.calle}
                      onChange={(event) => setFormData({
                        ...formData,
                        direccion: { ...formData.direccion, calle: event.target.value },
                      })}
                    ></textarea>
                  </div>
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-blue-600">
                        <Icons.Award />
                        Especialidades
                      </p>
                      <h4 className="mt-1 text-lg font-black text-slate-900">Áreas clínicas</h4>
                    </div>

                    <span className="w-fit rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                      {especialidadesTexto}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {catalogos.especialidades.length > 0 ? (
                      catalogos.especialidades.map((especialidad) => {
                        const id = especialidad.ID_Especialidad.toString();
                        const isSelected = formData.especialidadIds.includes(id);
                        const nombre = getNombreEspecialidad(especialidad);

                        return (
                          <button
                            key={especialidad.ID_Especialidad}
                            type="button"
                            onClick={() => handleEspecialidadChange(id)}
                            className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-black transition-all duration-200 ${
                              isSelected
                                ? 'border-slate-950 bg-slate-950 text-white shadow-lg shadow-slate-200'
                                : 'border-slate-200 bg-white text-slate-500 hover:border-blue-100 hover:bg-blue-50 hover:text-blue-700'
                            }`}
                          >
                            {isSelected && <Icons.Check />}
                            {nombre}
                          </button>
                        );
                      })
                    ) : (
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-400">
                        No hay especialidades disponibles
                      </span>
                    )}
                  </div>
                </section>
              </div>
            </div>
          </div>

          <div className="z-10 flex flex-col gap-3 border-t border-slate-200 bg-white px-6 py-4 shadow-[0_-12px_30px_rgba(15,23,42,0.08)] sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-medium text-slate-400">
              Verifica los datos profesionales antes de guardar.
            </p>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <button
                type="button"
                className="btn w-full rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-100 sm:w-auto"
                onClick={onClose}
                disabled={guardando}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="btn w-full rounded-xl bg-slate-950 px-8 text-white shadow-lg hover:bg-slate-800 sm:w-auto"
                disabled={guardando}
              >
                {guardando ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Guardando...
                  </>
                ) : (
                  psicologoEditar ? 'Actualizar profesional' : 'Guardar profesional'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </dialog>
  );
}
