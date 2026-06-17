import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import type { Paciente, CreatePacienteDTO, Ocupacion, EstadoCivil, Parentesco, Tutor, Pais, Municipio, Departamento } from '../../types';

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
  User: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-5 w-5">
      <circle cx="12" cy="8" r="3.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 21a7 7 0 0114 0" />
    </svg>
  ),
  Users: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-5 w-5">
      <circle cx="8.5" cy="8" r="3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 20a5.75 5.75 0 0111.5 0" />
      <circle cx="17" cy="10.25" r="2.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 16.25A4.5 4.5 0 0120.25 20" />
    </svg>
  ),
  MapPin: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s7.5-4.875 7.5-11.25a7.5 7.5 0 10-15 0C4.5 16.125 12 21 12 21z" />
      <circle cx="12" cy="9.75" r="2.75" />
    </svg>
  ),
  Identification: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-5 w-5">
      <rect x="3.75" y="5.25" width="16.5" height="13.5" rx="2.25" />
      <circle cx="9" cy="11" r="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 16.25a3 3 0 014.5 0M14.25 10h3M14.25 13h3M14.25 16h2" />
    </svg>
  ),
  Calendar: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 3v3M17 3v3M4.5 8.25h15M5.25 5.25h13.5A1.5 1.5 0 0120.25 6.75v12A1.5 1.5 0 0118.75 20.25H5.25A1.5 1.5 0 013.75 18.75v-12A1.5 1.5 0 015.25 5.25z" />
    </svg>
  ),
  Briefcase: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 6V5.25A2.25 2.25 0 0111.25 3h1.5A2.25 2.25 0 0115 5.25V6" />
      <rect x="3.75" y="6" width="16.5" height="13.5" rx="2.25" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 11.25h16.5M10.5 11.25v1.5h3v-1.5" />
    </svg>
  ),
  Search: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path
        fillRule="evenodd"
        d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
        clipRule="evenodd"
      />
    </svg>
  ),
  Check: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-5 w-5">
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

const initialState = {
  nombre: '', apellido: '', fechaNac: '', genero: 'Masculino',
  activo: true,
  paisId: '',
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
      const relacionTutor = pacienteEditar.Paciente_Menor?.Tutor_PacienteMenor?.find(
        (t: { Es_Contacto_Principal?: boolean | null }) => t.Es_Contacto_Principal === true
      ) || pacienteEditar.Paciente_Menor?.Tutor_PacienteMenor?.[0];

      const esPacienteAdulto = pacienteEditar.PacienteAdulto != null;
      setEsAdulto(esPacienteAdulto);

      if (!esPacienteAdulto) {
        setModoTutor('existente');
      }

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
          tutorId: relacionTutor?.ID_Tutor?.toString() || '',
          nuevoTutor: initialState.datosMenor.nuevoTutor
        } : initialState.datosMenor
      });
    } else {
      setFormData(initialState);
      setModoTutor('existente');
      setEsAdulto(true);
    }
  }, [pacienteEditar]);

  const handleTextoChange = (field: string, value: string) => {
    if (value === '' || esTextoValido(value)) setFormData({ ...formData, [field]: value });
  };

  const updateDatosAdulto = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, datosAdulto: { ...prev.datosAdulto, [field]: value } }));
  };

  const updateDatosMenor = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, datosMenor: { ...prev.datosMenor, [field]: value } }));
  };

  const updateNuevoTutor = (field: string, value: string) => {
    if ((field === 'nombre' || field === 'apellido') && value !== '' && !esTextoValido(value)) return;

    setFormData((prev) => ({
      ...prev,
      datosMenor: { ...prev.datosMenor, nuevoTutor: { ...prev.datosMenor.nuevoTutor, [field]: value } }
    }));
  };

  const updateDireccionTutor = (field: string, value: string) => {
    setFormData((prev) => ({
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!esTextoValido(formData.nombre) || !esTextoValido(formData.apellido)) {
      return toast.error('El nombre y apellido no pueden contener números ni símbolos.');
    }

    if (esAdulto) {
      if (!esCedulaValida(formData.datosAdulto.cedula)) return toast.error('La cédula del paciente es inválida (XXX-XXXXXX-XXXXL)');
      if (formData.datosAdulto.telefono && !esTelefonoValido(formData.datosAdulto.telefono)) return toast.error('Teléfono inválido. Debe ser 8 dígitos.');
    } else if (modoTutor === 'nuevo') {
      if (!esCedulaValida(formData.datosMenor.nuevoTutor.cedula)) return toast.error('La cédula del tutor es inválida');
      if (formData.datosMenor.nuevoTutor.telefono && !esTelefonoValido(formData.datosMenor.nuevoTutor.telefono)) return toast.error('Teléfono del tutor inválido.');

      const nuevoT = formData.datosMenor.nuevoTutor;
      if (!esTextoValido(nuevoT.nombre) || !esTextoValido(nuevoT.apellido)) return toast.error('El nombre del tutor no debe tener números.');
      if (!nuevoT.ocupacionId || !nuevoT.estadoCivilId || !nuevoT.parentescoId) return toast.error('Debe completar Ocupación, Estado Civil y Parentesco del Tutor.');
    }

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
        codigoTelefonoId: 1,
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
          codigoTelefonoId: 1,
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
      console.error('Error', error);
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

  const municipiosFiltradosPaciente = catalogos.municipios?.filter(
    (m) => m.ID_Departamento === Number(formData.direccion.departamentoId)
  ) || [];

  const municipiosFiltradosTutor = catalogos.municipios?.filter(
    (m) => m.ID_Departamento === Number(formData.datosMenor.nuevoTutor.direccion.departamentoId)
  ) || [];

  const nombreCompleto = `${formData.nombre} ${formData.apellido}`.trim() || 'Sin nombre';
  const tipoPaciente = esAdulto ? 'Paciente adulto' : 'Paciente menor';
  const direccionCompleta = [
    catalogos.departamentos?.find((d) => d.ID_Departamento === Number(formData.direccion.departamentoId))?.Nombre_Departamento,
    catalogos.municipios?.find((m) => m.ID_Municipio === Number(formData.direccion.municipioId))?.Nombre_Municipio,
    formData.direccion.barrio
  ].filter(Boolean).join(', ') || 'Sin dirección completa';

  const pasosCompletos = [
    Boolean(formData.nombre && formData.apellido && formData.fechaNac && formData.genero),
    Boolean(formData.paisId && formData.direccion.departamentoId && formData.direccion.municipioId && formData.direccion.barrio),
    esAdulto
      ? Boolean(formData.datosAdulto.cedula && formData.datosAdulto.ocupacionId && formData.datosAdulto.estadoCivilId)
      : Boolean(formData.datosMenor.partNacimiento && (modoTutor === 'existente' ? formData.datosMenor.tutorId : formData.datosMenor.nuevoTutor.nombre))
  ].filter(Boolean).length;

  return (
    <dialog className="modal modal-open bg-slate-950/50 backdrop-blur-sm">
      <div className="modal-box grid h-[92vh] w-11/12 max-w-7xl grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-[2rem] bg-white p-0 text-slate-800 shadow-2xl">
        <div className="relative overflow-hidden bg-slate-950 px-6 py-5 text-white">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-500/25 blur-3xl"></div>
          <div className="absolute -bottom-28 left-14 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl"></div>

          <div className="relative z-10 flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-blue-300">
                Expediente clínico
              </p>
              <h3 className="mt-1 font-serif text-2xl font-black tracking-tight text-white">
                {pacienteEditar ? 'Editar expediente' : 'Registrar nuevo paciente'}
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">
                Complete la información general, dirección y datos específicos según el tipo de paciente.
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
                    Resumen del expediente
                  </p>

                  <div className="mt-4 flex items-center gap-4">
                    <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl font-black shadow-sm ${
                      esAdulto
                        ? 'border border-blue-100 bg-blue-50 text-blue-700'
                        : 'border border-amber-100 bg-amber-50 text-amber-700'
                    }`}>
                      <Icons.User />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-lg font-black text-slate-950" title={nombreCompleto}>
                        {nombreCompleto}
                      </p>
                      <p className="mt-1 text-xs font-bold text-slate-400">{tipoPaciente}</p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Fecha nacimiento</p>
                      <p className="mt-1 text-sm font-black text-slate-800">{formData.fechaNac || '-'}</p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Dirección</p>
                      <p className="mt-1 line-clamp-2 text-sm font-bold leading-relaxed text-slate-700" title={direccionCompleta}>
                        {direccionCompleta}
                      </p>
                    </div>

                    {pacienteEditar && (
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
                    {[
                      { label: 'Información general', done: pasosCompletos >= 1 },
                      { label: 'Dirección principal', done: pasosCompletos >= 2 },
                      { label: esAdulto ? 'Datos de adulto' : 'Datos de menor/tutor', done: pasosCompletos >= 3 }
                    ].map((step) => (
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
                  <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-blue-600">
                        <Icons.User />
                        Tipo de expediente
                      </p>
                      <h4 className="mt-1 text-lg font-black text-slate-900">Clasificación del paciente</h4>
                    </div>

                    <div className="grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1">
                      <button
                        type="button"
                        className={`btn btn-sm min-h-10 rounded-xl border-none ${
                          esAdulto ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-transparent text-slate-500 hover:bg-slate-200'
                        } ${isTypeSelectionDisabled ? 'cursor-not-allowed opacity-60' : ''}`}
                        onClick={() => !isTypeSelectionDisabled && setEsAdulto(true)}
                        disabled={isTypeSelectionDisabled}
                      >
                        Adulto
                      </button>

                      <button
                        type="button"
                        className={`btn btn-sm min-h-10 rounded-xl border-none ${
                          !esAdulto ? 'bg-amber-600 text-white hover:bg-amber-700' : 'bg-transparent text-slate-500 hover:bg-slate-200'
                        } ${isTypeSelectionDisabled ? 'cursor-not-allowed opacity-60' : ''}`}
                        onClick={() => !isTypeSelectionDisabled && setEsAdulto(false)}
                        disabled={isTypeSelectionDisabled}
                      >
                        Menor
                      </button>
                    </div>
                  </div>

                  {isTypeSelectionDisabled && (
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm font-medium text-slate-500">
                      El tipo de expediente queda definido por la fecha de nacimiento o por el registro existente.
                    </div>
                  )}
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-5">
                    <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-blue-600">
                      <Icons.Identification />
                      Información general
                    </p>
                    <h4 className="mt-1 text-lg font-black text-slate-900">Datos personales</h4>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">Nombre</label>
                      <input
                        required
                        type="text"
                        placeholder="Nombre"
                        className="input input-bordered h-12 w-full rounded-2xl bg-slate-50 text-sm font-medium transition-colors focus:bg-white"
                        value={formData.nombre}
                        onChange={(e) => handleTextoChange('nombre', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">Apellido</label>
                      <input
                        required
                        type="text"
                        placeholder="Apellido"
                        className="input input-bordered h-12 w-full rounded-2xl bg-slate-50 text-sm font-medium transition-colors focus:bg-white"
                        value={formData.apellido}
                        onChange={(e) => handleTextoChange('apellido', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">Fecha de nacimiento</label>
                      <input
                        required
                        type="date"
                        className="input input-bordered h-12 w-full rounded-2xl bg-slate-50 text-sm font-medium transition-colors focus:bg-white"
                        value={formData.fechaNac}
                        onChange={(e) => handleFechaNacChange(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">Género</label>
                      <select
                        className="select select-bordered h-12 w-full rounded-2xl bg-slate-50 text-sm font-medium transition-colors focus:bg-white"
                        value={formData.genero}
                        onChange={(e) => setFormData({ ...formData, genero: e.target.value })}
                      >
                        <option value="Masculino">Masculino</option>
                        <option value="Femenino">Femenino</option>
                      </select>
                    </div>

                    {pacienteEditar && (
                      <div className="md:col-span-2">
                        <label className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">Estado de actividad</label>
                        <select
                          className="select select-bordered h-12 w-full rounded-2xl bg-slate-50 text-sm font-medium transition-colors focus:bg-white"
                          value={formData.activo ? 'true' : 'false'}
                          onChange={(e) => setFormData({ ...formData, activo: e.target.value === 'true' })}
                        >
                          <option value="true">Activo</option>
                          <option value="false">Inactivo</option>
                        </select>
                      </div>
                    )}
                  </div>
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-5">
                    <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-blue-600">
                      <Icons.MapPin />
                      Dirección principal
                    </p>
                    <h4 className="mt-1 text-lg font-black text-slate-900">Ubicación del paciente</h4>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <select
                      required
                      className="select select-bordered h-12 w-full rounded-2xl bg-slate-50 text-sm font-medium transition-colors focus:bg-white"
                      value={formData.paisId}
                      onChange={(e) => setFormData({
                        ...formData,
                        paisId: e.target.value,
                        direccion: { ...formData.direccion, departamentoId: '', municipioId: '' }
                      })}
                    >
                      <option value="">1. Seleccione el país...</option>
                      {catalogos.paises?.map((p) => (
                        <option key={p.ID_Pais} value={p.ID_Pais}>{p.Nombre_Pais}</option>
                      ))}
                    </select>

                    <select
                      required
                      className="select select-bordered h-12 w-full rounded-2xl bg-slate-50 text-sm font-medium transition-colors focus:bg-white"
                      value={formData.direccion.departamentoId}
                      onChange={(e) => setFormData({
                        ...formData,
                        direccion: { ...formData.direccion, departamentoId: e.target.value, municipioId: '' }
                      })}
                      disabled={!formData.paisId}
                    >
                      <option value="">2. Seleccione el departamento...</option>
                      {catalogos.departamentos?.map((d) => (
                        <option key={d.ID_Departamento} value={d.ID_Departamento}>{d.Nombre_Departamento}</option>
                      ))}
                    </select>

                    <select
                      required
                      className="select select-bordered h-12 w-full rounded-2xl bg-slate-50 text-sm font-medium transition-colors focus:bg-white"
                      value={formData.direccion.municipioId}
                      onChange={(e) => setFormData({ ...formData, direccion: { ...formData.direccion, municipioId: e.target.value } })}
                      disabled={!formData.direccion.departamentoId}
                    >
                      <option value="">3. Seleccione el municipio...</option>
                      {municipiosFiltradosPaciente.map((m) => (
                        <option key={m.ID_Municipio} value={m.ID_Municipio}>{m.Nombre_Municipio}</option>
                      ))}
                    </select>

                    <input
                      required
                      type="text"
                      placeholder="Barrio"
                      className="input input-bordered h-12 w-full rounded-2xl bg-slate-50 text-sm font-medium transition-colors focus:bg-white"
                      value={formData.direccion.barrio}
                      onChange={(e) => setFormData({ ...formData, direccion: { ...formData.direccion, barrio: e.target.value } })}
                    />

                    <input
                      type="text"
                      placeholder="Calle / detalle opcional"
                      className="input input-bordered h-12 w-full rounded-2xl bg-slate-50 text-sm font-medium transition-colors focus:bg-white md:col-span-2"
                      value={formData.direccion.calle}
                      onChange={(e) => setFormData({ ...formData, direccion: { ...formData.direccion, calle: e.target.value } })}
                    />
                  </div>
                </section>

                {esAdulto ? (
                  <section className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm">
                    <div className="mb-5">
                      <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-blue-600">
                        <Icons.Briefcase />
                        Datos de adulto
                      </p>
                      <h4 className="mt-1 text-lg font-black text-slate-900">Identificación y perfil</h4>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">Cédula</label>
                        <input
                          required
                          type="text"
                          placeholder="XXX-XXXXXX-XXXXL"
                          className="input input-bordered h-12 w-full rounded-2xl bg-slate-50 font-mono text-sm font-bold transition-colors focus:bg-white"
                          value={formData.datosAdulto.cedula}
                          onChange={(e) => updateDatosAdulto('cedula', formatearCedula(e.target.value))}
                          maxLength={16}
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">Teléfono</label>
                        <input
                          type="text"
                          placeholder="8 dígitos"
                          className="input input-bordered h-12 w-full rounded-2xl bg-slate-50 text-sm font-medium transition-colors focus:bg-white"
                          value={formData.datosAdulto.telefono}
                          onChange={(e) => updateDatosAdulto('telefono', e.target.value)}
                          maxLength={8}
                        />
                      </div>

                      <select
                        required
                        className="select select-bordered h-12 w-full rounded-2xl bg-slate-50 text-sm font-medium transition-colors focus:bg-white"
                        value={formData.datosAdulto.ocupacionId}
                        onChange={(e) => updateDatosAdulto('ocupacionId', e.target.value)}
                      >
                        <option value="">Ocupación...</option>
                        {catalogos.ocupaciones?.map((o) => (
                          <option key={o.ID_Ocupacion} value={o.ID_Ocupacion}>{o.Nombre_DeOcupacion}</option>
                        ))}
                      </select>

                      <select
                        required
                        className="select select-bordered h-12 w-full rounded-2xl bg-slate-50 text-sm font-medium transition-colors focus:bg-white"
                        value={formData.datosAdulto.estadoCivilId}
                        onChange={(e) => updateDatosAdulto('estadoCivilId', e.target.value)}
                      >
                        <option value="">Estado civil...</option>
                        {catalogos.estadosCiviles?.map((ec) => (
                          <option key={ec.ID_EstadoCivil} value={ec.ID_EstadoCivil}>{ec.Nombre_EstadoCivil}</option>
                        ))}
                      </select>
                    </div>
                  </section>
                ) : (
                  <section className="rounded-3xl border border-amber-100 bg-white p-5 shadow-sm">
                    <div className="mb-5">
                      <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-amber-600">
                        <Icons.Users />
                        Datos de menor
                      </p>
                      <h4 className="mt-1 text-lg font-black text-slate-900">Escolaridad y tutor responsable</h4>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <input
                        required
                        type="text"
                        placeholder="Código de partida de nacimiento"
                        className="input input-bordered h-12 w-full rounded-2xl bg-slate-50 text-sm font-medium transition-colors focus:bg-white"
                        value={formData.datosMenor.partNacimiento}
                        onChange={(e) => updateDatosMenor('partNacimiento', e.target.value)}
                      />

                      <input
                        type="text"
                        placeholder="Grado escolar"
                        className="input input-bordered h-12 w-full rounded-2xl bg-slate-50 text-sm font-medium transition-colors focus:bg-white"
                        value={formData.datosMenor.grado}
                        onChange={(e) => updateDatosMenor('grado', e.target.value)}
                      />
                    </div>

                    <div className="mt-5 rounded-3xl border border-amber-100 bg-amber-50/70 p-5">
                      <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-amber-700">
                            <Icons.Users />
                            Tutor responsable
                          </p>
                          <p className="mt-1 text-sm font-medium text-amber-700/80">
                            Selecciona un tutor existente o registra uno nuevo.
                          </p>
                        </div>

                        {!pacienteEditar && (
                          <div className="grid grid-cols-2 gap-1 rounded-2xl bg-white p-1 shadow-sm">
                            <button
                              type="button"
                              className={`btn btn-sm min-h-10 rounded-xl border-none ${modoTutor === 'existente' ? 'bg-slate-950 text-white hover:bg-slate-800' : 'bg-transparent text-slate-500 hover:bg-slate-100'}`}
                              onClick={() => setModoTutor('existente')}
                            >
                              Buscar
                            </button>
                            <button
                              type="button"
                              className={`btn btn-sm min-h-10 rounded-xl border-none ${modoTutor === 'nuevo' ? 'bg-slate-950 text-white hover:bg-slate-800' : 'bg-transparent text-slate-500 hover:bg-slate-100'}`}
                              onClick={() => setModoTutor('nuevo')}
                            >
                              Crear nuevo
                            </button>
                          </div>
                        )}
                      </div>

                      {modoTutor === 'existente' ? (
                        <div className="space-y-3">
                          <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                              <Icons.Search />
                            </div>
                            <input
                              type="text"
                              placeholder="Buscar por nombre, apellido o cédula..."
                              className="input input-bordered h-12 w-full rounded-2xl bg-white pl-11 text-sm font-medium"
                              value={busquedaTutor}
                              onChange={(e) => setBusquedaTutor(e.target.value)}
                            />
                          </div>

                          <select
                            required={modoTutor === 'existente'}
                            className="select select-bordered h-12 w-full rounded-2xl bg-white text-sm font-medium"
                            value={formData.datosMenor.tutorId}
                            onChange={(e) => updateDatosMenor('tutorId', e.target.value)}
                          >
                            <option value="">Seleccione un tutor ({tutoresFiltrados.length} encontrados)</option>
                            {tutoresFiltrados.map((t) => (
                              <option key={t.ID_Tutor} value={t.ID_Tutor}>{t.Nombre} {t.Apellido} - {t.No_Cedula}</option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            <input required={modoTutor === 'nuevo'} type="text" placeholder="Nombre tutor" className="input input-bordered h-11 rounded-2xl bg-white text-sm font-medium" value={formData.datosMenor.nuevoTutor.nombre} onChange={(e) => updateNuevoTutor('nombre', e.target.value)} />
                            <input required={modoTutor === 'nuevo'} type="text" placeholder="Apellido tutor" className="input input-bordered h-11 rounded-2xl bg-white text-sm font-medium" value={formData.datosMenor.nuevoTutor.apellido} onChange={(e) => updateNuevoTutor('apellido', e.target.value)} />
                            <input required={modoTutor === 'nuevo'} type="text" placeholder="Cédula tutor" className="input input-bordered h-11 rounded-2xl bg-white font-mono text-sm font-bold" value={formData.datosMenor.nuevoTutor.cedula} maxLength={16} onChange={(e) => updateNuevoTutor('cedula', formatearCedula(e.target.value))} />
                            <input type="text" placeholder="Teléfono tutor" className="input input-bordered h-11 rounded-2xl bg-white text-sm font-medium" value={formData.datosMenor.nuevoTutor.telefono} onChange={(e) => updateNuevoTutor('telefono', e.target.value)} maxLength={8} />
                            <select required={modoTutor === 'nuevo'} className="select select-bordered h-11 rounded-2xl bg-white text-sm font-medium" value={formData.datosMenor.nuevoTutor.parentescoId} onChange={(e) => updateNuevoTutor('parentescoId', e.target.value)}>
                              <option value="">Parentesco...</option>
                              {catalogos.parentescos?.map((p) => (
                                <option key={p.ID_Parentesco} value={p.ID_Parentesco}>{p.Nombre_De_Parentesco}</option>
                              ))}
                            </select>
                            <select required={modoTutor === 'nuevo'} className="select select-bordered h-11 rounded-2xl bg-white text-sm font-medium" value={formData.datosMenor.nuevoTutor.ocupacionId} onChange={(e) => updateNuevoTutor('ocupacionId', e.target.value)}>
                              <option value="">Ocupación...</option>
                              {catalogos.ocupaciones?.map((o) => (
                                <option key={o.ID_Ocupacion} value={o.ID_Ocupacion}>{o.Nombre_DeOcupacion}</option>
                              ))}
                            </select>
                            <select required={modoTutor === 'nuevo'} className="select select-bordered h-11 rounded-2xl bg-white text-sm font-medium md:col-span-2" value={formData.datosMenor.nuevoTutor.estadoCivilId} onChange={(e) => updateNuevoTutor('estadoCivilId', e.target.value)}>
                              <option value="">Estado civil...</option>
                              {catalogos.estadosCiviles?.map((ec) => (
                                <option key={ec.ID_EstadoCivil} value={ec.ID_EstadoCivil}>{ec.Nombre_EstadoCivil}</option>
                              ))}
                            </select>
                          </div>

                          <div className="rounded-2xl border border-amber-100 bg-white p-4">
                            <p className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-amber-700">
                              <Icons.MapPin />
                              Dirección del tutor
                            </p>

                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                              <select
                                required={modoTutor === 'nuevo'}
                                className="select select-bordered h-11 rounded-2xl bg-slate-50 text-sm font-medium"
                                value={formData.datosMenor.nuevoTutor.direccion.departamentoId}
                                onChange={(e) => setFormData((prev) => ({
                                  ...prev,
                                  datosMenor: {
                                    ...prev.datosMenor,
                                    nuevoTutor: {
                                      ...prev.datosMenor.nuevoTutor,
                                      direccion: {
                                        ...prev.datosMenor.nuevoTutor.direccion,
                                        departamentoId: e.target.value,
                                        municipioId: ''
                                      }
                                    }
                                  }
                                }))}
                              >
                                <option value="">1. Departamento...</option>
                                {catalogos.departamentos?.map((d) => (
                                  <option key={d.ID_Departamento} value={d.ID_Departamento}>{d.Nombre_Departamento}</option>
                                ))}
                              </select>

                              <select
                                required={modoTutor === 'nuevo'}
                                className="select select-bordered h-11 rounded-2xl bg-slate-50 text-sm font-medium"
                                value={formData.datosMenor.nuevoTutor.direccion.municipioId}
                                onChange={(e) => updateDireccionTutor('municipioId', e.target.value)}
                                disabled={!formData.datosMenor.nuevoTutor.direccion.departamentoId}
                              >
                                <option value="">2. Municipio...</option>
                                {municipiosFiltradosTutor.map((m) => (
                                  <option key={m.ID_Municipio} value={m.ID_Municipio}>{m.Nombre_Municipio}</option>
                                ))}
                              </select>

                              <input required={modoTutor === 'nuevo'} type="text" placeholder="Barrio" className="input input-bordered h-11 rounded-2xl bg-slate-50 text-sm font-medium" value={formData.datosMenor.nuevoTutor.direccion.barrio} onChange={(e) => updateDireccionTutor('barrio', e.target.value)} />
                              <input type="text" placeholder="Calle opcional" className="input input-bordered h-11 rounded-2xl bg-slate-50 text-sm font-medium" value={formData.datosMenor.nuevoTutor.direccion.calle} onChange={(e) => updateDireccionTutor('calle', e.target.value)} />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </section>
                )}
              </div>
            </div>
          </div>

          <div className="z-10 flex flex-col gap-3 border-t border-slate-200 bg-white px-6 py-4 shadow-[0_-12px_30px_rgba(15,23,42,0.08)] sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-medium text-slate-400">
              Verifica los datos antes de guardar el expediente.
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
                  pacienteEditar ? 'Actualizar cambios' : 'Guardar paciente'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </dialog>
  );
}
