import { useState, type FormEvent } from 'react';
import { useTutores, type TutorCompleto } from '../hooks/useTutores';
import TutorFormModal from '../components/tutores/TutorFormModal';
import PacientesListModal from '../components/tutores/PacientesListModal';

type CatalogoOcupacion = {
  ID_Ocupacion: number;
  Nombre_DeOcupacion: string;
};

type CatalogoEstadoCivil = {
  ID_EstadoCivil: number;
  Nombre_EstadoCivil: string;
};

type TutorConRelacionesCompatibles = TutorCompleto & {
  Ocupacion?: number | string | null;
  EstadoCivil?: number | string | null;
  Ocupacion_Tutor?: CatalogoOcupacion | null;
  EstadoCivil_Tutor?: CatalogoEstadoCivil | null;
  Ocupacion_Tutor_OcupacionToOcupacion?: CatalogoOcupacion | null;
  EstadoCivil_Tutor_EstadoCivilToEstadoCivil?: CatalogoEstadoCivil | null;
};

const Icons = {
  UserGroup: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M5.5 5.25a7.5 7.5 0 0113 0c.27.085.52.203.738.351A8.25 8.25 0 0012 2a8.25 8.25 0 00-7.738 3.601.75.75 0 01.738-.351zM12 18a6 6 0 100-12 6 6 0 000 12z" /></svg>,
  Search: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-slate-400"><path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" /></svg>,
  Edit: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" /><path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" /></svg>,
  Eye: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" /><path fillRule="evenodd" d="M.328 10.05a.75.75 0 010-.1C2.828 5.95 6.102 3.75 10 3.75s7.172 2.2 9.672 6.2a.75.75 0 010 .1c-2.5 4-5.774 6.2-9.672 6.2s-7.172-2.2-9.672-6.2zM10 14a4 4 0 100-8 4 4 0 000 8z" clipRule="evenodd" /></svg>,
  Empty: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-12 h-12 mb-2 opacity-50"><path fillRule="evenodd" d="M7.5 7.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM11.5 7.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM14 7.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM2 6.5C2 5.672 2.672 5 3.5 5h13c.828 0 1.5.672 1.5 1.5v6.25c0 .828-.672 1.5-1.5 1.5h-2.197l-3.328 3.328a1.5 1.5 0 01-2.122 0l-3.328-3.328H3.5c-.828 0-1.5-.672-1.5-1.5v-6.25z" clipRule="evenodd" /></svg>,
};

function getParentesco(tutor: TutorCompleto) {
  const relacionPrincipal = tutor.Tutor_PacienteMenor?.find((relacion) => relacion.Es_Contacto_Principal);
  const relacion = relacionPrincipal || tutor.Tutor_PacienteMenor?.[0];

  return relacion?.Parentesco?.Nombre_De_Parentesco ||
    tutor.Parentesco?.Nombre_De_Parentesco ||
    'N/A';
}

function getOcupacion(tutor: TutorCompleto, ocupaciones: CatalogoOcupacion[] = []) {
  const tutorCompatible = tutor as TutorConRelacionesCompatibles;
  const ocupacionId = Number(tutorCompatible.Ocupacion);
  const ocupacionCatalogo = ocupaciones.find((ocupacion) => ocupacion.ID_Ocupacion === ocupacionId);

  return tutorCompatible.Ocupacion_Tutor_OcupacionToOcupacion?.Nombre_DeOcupacion ||
    tutorCompatible.Ocupacion_Tutor?.Nombre_DeOcupacion ||
    ocupacionCatalogo?.Nombre_DeOcupacion ||
    'N/A';
}

function getEstadoCivil(tutor: TutorCompleto, estadosCiviles: CatalogoEstadoCivil[] = []) {
  const tutorCompatible = tutor as TutorConRelacionesCompatibles;
  const estadoCivilId = Number(tutorCompatible.EstadoCivil);
  const estadoCivilCatalogo = estadosCiviles.find((estadoCivil) => estadoCivil.ID_EstadoCivil === estadoCivilId);

  return tutorCompatible.EstadoCivil_Tutor_EstadoCivilToEstadoCivil?.Nombre_EstadoCivil ||
    tutorCompatible.EstadoCivil_Tutor?.Nombre_EstadoCivil ||
    estadoCivilCatalogo?.Nombre_EstadoCivil ||
    'N/A';
}

function getPacientesMenores(tutor: TutorCompleto) {
  const desdeRelacion = tutor.Tutor_PacienteMenor
    ?.map((relacion) => relacion.Paciente_Menor)
    .filter((paciente): paciente is NonNullable<typeof paciente> => Boolean(paciente)) || [];

  return tutor.PacienteMenor || tutor.Paciente_Menor || desdeRelacion;
}

function getUbicacion(tutor: TutorCompleto) {
  const direccion = tutor.Direccion;

  if (!direccion) return 'Dirección no registrada';

  const municipio = direccion.Municipio?.Nombre_Municipio || '';
  const departamento = direccion.Municipio?.Departamento?.Nombre_Departamento || '';
  const barrio = direccion.Barrio || '';

  return [municipio, departamento, barrio].filter(Boolean).join(', ') || 'Dirección no registrada';
}

export default function Tutores() {
  const {
    tutores,
    loading,
    busqueda,
    setBusqueda,
    catalogos,
    formData,
    setFormData,
    prepareEdit,
    saveTutor,
  } = useTutores();

  const [modalOpen, setModalOpen] = useState<'edit' | 'view' | null>(null);
  const [selectedTutor, setSelectedTutor] = useState<TutorCompleto | null>(null);

  const handleOpenEditar = (tutor: TutorCompleto) => {
    prepareEdit(tutor);
    setSelectedTutor(tutor);
    setModalOpen('edit');
  };

  const handleOpenPacientes = (tutor: TutorCompleto) => {
    setSelectedTutor(tutor);
    setModalOpen('view');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const success = await saveTutor();

    if (success) {
      setModalOpen(null);
    }
  };

  return (
    <div className="w-full max-w-full min-w-0 px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up overflow-x-hidden">
      {/* ENCABEZADO */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4 mb-8 min-w-0">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight font-serif flex items-center gap-3">
            <span className="p-2 bg-slate-100 rounded-xl text-slate-600 shrink-0"><Icons.UserGroup /></span>
            <span className="truncate">Gestión de Tutores</span>
          </h1>
          <p className="text-slate-500 mt-2 text-sm sm:ml-12 max-w-2xl">
            Directorio de responsables y pacientes asociados menores
          </p>
        </div>
      </div>

      {/* BUSCADOR */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 mb-8 w-full max-w-full min-w-0 overflow-hidden">
        <div className="relative w-full min-w-0">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icons.Search />
          </div>
          <input
            type="text"
            placeholder="Buscar tutor por nombre, apellido, cédula o teléfono..."
            className="input input-bordered w-full pl-10 bg-slate-50 focus:bg-white shadow-sm transition-colors"
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
          />
        </div>
      </div>

      {/* TABLA */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden w-full max-w-full min-w-0">
        <div className="w-full max-w-full overflow-x-auto">
          <table className="table table-fixed w-full min-w-[1020px]">
            <colgroup>
              <col className="w-[240px]" />
              <col className="w-[190px]" />
              <col className="w-[145px]" />
              <col className="w-[170px]" />
              <col className="w-[130px]" />
              <col className="w-[110px]" />
            </colgroup>

            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="py-4 pl-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre y cédula</th>
                <th className="py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Contacto</th>
                <th className="py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Parentesco</th>
                <th className="py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Ocupación</th>
                <th className="py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Pacientes</th>
                <th className="py-4 pr-6 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td colSpan={6} className="text-center py-20">
                    <span className="loading loading-spinner loading-lg text-primary"></span>
                  </td>
                </tr>
              )}

              {!loading && tutores.map((tutor) => {
                const nombreCompleto = `${tutor.Nombre} ${tutor.Apellido}`.trim();
                const pacientes = getPacientesMenores(tutor);
                const ubicacion = getUbicacion(tutor);
                const ocupacion = getOcupacion(tutor, catalogos.ocupaciones);
                const estadoCivil = getEstadoCivil(tutor, catalogos.estadosCiviles);

                return (
                  <tr key={tutor.ID_Tutor} className="hover:bg-slate-50 transition-colors group align-top">
                    <td className="pl-6 py-4">
                      <div className="font-bold text-slate-800 text-base truncate" title={nombreCompleto}>
                        {nombreCompleto}
                      </div>
                      <div className="font-mono text-xs text-slate-500 mt-1 bg-slate-100 px-2 py-0.5 rounded w-fit max-w-full truncate" title={tutor.No_Cedula || 'Sin cédula'}>
                        {tutor.No_Cedula || 'Sin cédula'}
                      </div>
                    </td>

                    <td className="py-4">
                      <div className="text-sm font-medium text-slate-600 truncate" title={tutor.No_Telefono || 'Sin teléfono'}>
                        {tutor.No_Telefono || 'Sin teléfono'}
                      </div>
                      <div className="text-xs text-slate-400 truncate" title={ubicacion}>
                        {ubicacion}
                      </div>
                    </td>

                    <td className="py-4">
                      <span className="badge badge-sm badge-outline text-slate-600 border-slate-300 bg-white max-w-full truncate" title={getParentesco(tutor)}>
                        {getParentesco(tutor)}
                      </span>
                    </td>

                    <td className="py-4">
                      <span className="text-sm text-slate-600 block truncate" title={ocupacion}>
                        {ocupacion}
                      </span>
                      <span className="text-xs text-slate-400 block truncate" title={estadoCivil}>
                        {estadoCivil}
                      </span>
                    </td>

                    <td className="py-4 text-center">
                      {pacientes.length > 0 ? (
                        <button
                          type="button"
                          className="btn btn-xs btn-outline btn-info gap-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                          onClick={() => handleOpenPacientes(tutor)}
                        >
                          <Icons.Eye /> Ver ({pacientes.length})
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Ninguno</span>
                      )}
                    </td>

                    <td className="py-4 pr-6 text-center">
                      <button
                        type="button"
                        className="btn btn-sm btn-ghost text-slate-500 hover:text-blue-600 hover:bg-blue-50 tooltip"
                        data-tip="Editar Datos de Tutor"
                        onClick={() => handleOpenEditar(tutor)}
                      >
                        <Icons.Edit />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {!loading && tutores.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-20">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Icons.Empty />
                      <p className="text-lg font-medium text-slate-600">No se encontraron tutores</p>
                      <p className="text-sm mt-1">Intenta buscar por otro nombre, cédula o teléfono</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <TutorFormModal
        isOpen={modalOpen === 'edit'}
        onClose={() => setModalOpen(null)}
        onSubmit={handleSubmit}
        formData={formData}
        setFormData={setFormData}
        catalogos={catalogos}
      />

      <PacientesListModal
        isOpen={modalOpen === 'view'}
        onClose={() => setModalOpen(null)}
        tutor={selectedTutor}
      />
    </div>
  );
}
