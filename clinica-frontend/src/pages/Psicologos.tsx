import { useState } from 'react';
import {
  usePsicologos,
  type FiltroActividad,
  type CredencialesTemporales,
  type PsicologoCompleto,
  type PsicologoEspecialidadRelacion,
  type PsicologoFormData,
} from '../hooks/usePsicologos';
import PsicologoFormModal from '../components/psicologos/PsicologoFormModal';
import { toast } from 'sonner';

const Icons = {
  Plus: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>,
  Search: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-slate-400"><path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" /></svg>,
  Doctor: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v3.5h3.5a.75.75 0 010 1.5h-3.5v3.5a.75.75 0 01-1.5 0v-3.5h-3.5a.75.75 0 010-1.5h3.5v-3.5A.75.75 0 0110 5z" clipRule="evenodd" /></svg>,
  Edit: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" /><path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" /></svg>,
  Empty: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mb-2 opacity-50"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>,
};

const filtrosActividad: FiltroActividad[] = ['todos', 'activos', 'inactivos'];

function getEspecialidades(psicologo: PsicologoCompleto) {
  return psicologo.Psicologo_EspecialidadPsicologo || [];
}

function getNombreEspecialidad(relacion: PsicologoEspecialidadRelacion) {
  return relacion.EspecialidadPsicologo?.Nombre_Especialidad ||
    relacion.EspecialidadPsicologo?.NombreEspecialidad ||
    relacion.Especialidad?.Nombre_Especialidad ||
    relacion.Especialidad?.NombreEspecialidad ||
    'Especialidad';
}

function getDireccion(psicologo: PsicologoCompleto) {
  const direccion = psicologo.Direccion;

  if (!direccion) return 'Dirección no registrada';

  const municipio = direccion.Municipio?.Nombre_Municipio || '';
  const departamento = direccion.Municipio?.Departamento?.Nombre_Departamento || '';
  const barrio = direccion.Barrio || '';

  return [municipio, departamento, barrio].filter(Boolean).join(', ') || 'Dirección no registrada';
}

export default function Psicologos() {
  const {
    psicologos,
    loading,
    busqueda,
    setBusqueda,
    filtroActividad,
    setFiltroActividad,
    catalogos,
    acciones,
  } = usePsicologos();

  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [selectedPsicologo, setSelectedPsicologo] = useState<PsicologoCompleto | null>(null);
  const [credencialesTemporales, setCredencialesTemporales] = useState<CredencialesTemporales | null>(null);

  const handleOpenNuevo = () => {
    setSelectedPsicologo(null);
    setModalOpen(true);
  };

  const handleOpenEditar = (psicologo: PsicologoCompleto) => {
    setSelectedPsicologo(psicologo);
    setModalOpen(true);
  };

  const handleSubmit = async (data: PsicologoFormData, isEdit: boolean) => {
    if (isEdit && selectedPsicologo) {
      const success = await acciones.actualizarPsicologo(selectedPsicologo.ID_Psicologo, data);

      if (success) {
        setModalOpen(false);
        setSelectedPsicologo(null);
      }

      return success;
    }

    const result = await acciones.crearPsicologo(data);

    if (result) {
      setModalOpen(false);
      setSelectedPsicologo(null);
      setCredencialesTemporales(result.credenciales);
      return true;
    }

    return false;
  };

  const copiarCredenciales = async () => {
    if (!credencialesTemporales) return;

    const texto = `Correo: ${credencialesTemporales.email}\nContraseña temporal: ${credencialesTemporales.passwordTemporal}`;

    await navigator.clipboard.writeText(texto);
    toast.success('Credenciales copiadas');
  };

  return (
    <div className="w-full max-w-full min-w-0 px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up overflow-x-hidden">
      {/* ENCABEZADO */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4 mb-8 min-w-0">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight font-serif flex items-center gap-3">
            <span className="p-2 bg-slate-100 rounded-xl text-slate-600 shrink-0"><Icons.Doctor /></span>
            <span className="truncate">Gestión de Psicólogos</span>
          </h1>
          <p className="text-slate-500 mt-2 text-sm sm:ml-12 max-w-2xl">
            Directorio y administración de profesionales de la clínica
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary shadow-lg text-white gap-2 rounded-xl px-6 w-full sm:w-auto shrink-0"
          onClick={handleOpenNuevo}
        >
          <Icons.Plus />
          Nuevo Psicólogo
        </button>
      </div>

      {/* FILTROS */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 mb-8 w-full max-w-full min-w-0 overflow-hidden">
        <div className="flex flex-col xl:flex-row gap-5 xl:items-end min-w-0">
          <div className="flex-1 relative min-w-0 w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Icons.Search />
            </div>
            <input
              type="text"
              placeholder="Buscar por nombre, Código MINSA, teléfono o email..."
              className="input input-bordered w-full pl-10 bg-slate-50 focus:bg-white transition-colors"
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 shrink-0">
            <span className="text-xs font-bold text-slate-500 uppercase">Estado:</span>
            <div className="join border border-slate-200 rounded-lg p-1 bg-slate-100">
              {filtrosActividad.map((estado) => (
                <button
                  type="button"
                  key={estado}
                  className={`join-item btn btn-sm border-none capitalize font-medium px-4 ${
                    filtroActividad === estado
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'bg-transparent text-slate-500 hover:text-slate-700'
                  }`}
                  onClick={() => setFiltroActividad(estado)}
                >
                  {estado}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* TABLA */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden w-full max-w-full min-w-0">
        <div className="w-full max-w-full overflow-x-auto">
          <table className="table table-fixed w-full min-w-[960px]">
            <colgroup>
              <col className="w-[260px]" />
              <col className="w-[150px]" />
              <col className="w-[220px]" />
              <col className="w-[250px]" />
              <col className="w-[120px]" />
            </colgroup>

            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="py-4 pl-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre / Estado</th>
                <th className="py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Código MINSA</th>
                <th className="py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Contacto</th>
                <th className="py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Especialidades</th>
                <th className="py-4 pr-6 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td colSpan={5} className="text-center py-20">
                    <span className="loading loading-spinner loading-lg text-primary"></span>
                  </td>
                </tr>
              )}

              {!loading && psicologos.map((psicologo) => {
                const nombreCompleto = `Dr. ${psicologo.Nombre} ${psicologo.Apellido}`;
                const especialidades = getEspecialidades(psicologo);
                const direccion = getDireccion(psicologo);

                return (
                  <tr key={psicologo.ID_Psicologo} className="hover:bg-slate-50 transition-colors group align-top">
                    <td className="pl-6 py-4">
                      <div className="flex flex-col min-w-0">
                        <div className="font-bold text-slate-800 text-sm truncate" title={nombreCompleto}>
                          {nombreCompleto}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${psicologo.Activo ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                          <span className="text-xs text-slate-500 font-medium">
                            {psicologo.Activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 truncate mt-1" title={direccion}>
                          {direccion}
                        </span>
                      </div>
                    </td>

                    <td className="py-4">
                      <div className="text-sm font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded text-xs w-fit max-w-full truncate" title={psicologo.CodigoMinsa || 'S/C'}>
                        {psicologo.CodigoMinsa || 'S/C'}
                      </div>
                    </td>

                    <td className="py-4">
                      <div className="text-sm text-slate-600 font-medium truncate" title={psicologo.No_Telefono || 'Sin teléfono'}>
                        {psicologo.No_Telefono || 'Sin teléfono'}
                      </div>
                      <div className="text-xs text-blue-500 italic truncate max-w-full" title={psicologo.Email || 'Sin email'}>
                        {psicologo.Email || 'Sin email'}
                      </div>
                    </td>

                    <td className="py-4">
                      <div className="flex flex-wrap gap-1 max-w-full">
                        {especialidades.length > 0 ? (
                          especialidades.map((relacion, index) => (
                            <span
                              key={`${psicologo.ID_Psicologo}-${relacion.ID_Especialidad || index}`}
                              className="badge badge-sm bg-blue-50 text-blue-700 border border-blue-100 max-w-full truncate"
                              title={getNombreEspecialidad(relacion)}
                            >
                              {getNombreEspecialidad(relacion)}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400 italic">Sin especialidades</span>
                        )}
                      </div>
                    </td>

                    <td className="py-4 text-center pr-6">
                      <button
                        type="button"
                        className="btn btn-sm btn-ghost text-slate-500 hover:text-blue-600 hover:bg-blue-50 tooltip"
                        data-tip="Editar Datos"
                        onClick={() => handleOpenEditar(psicologo)}
                      >
                        <Icons.Edit />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {!loading && psicologos.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-20">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Icons.Empty />
                      <p className="text-lg font-medium text-slate-600">No se encontraron psicólogos</p>
                      <p className="text-sm mt-1">Intenta cambiar los filtros de búsqueda</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <PsicologoFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        psicologoEditar={selectedPsicologo}
        catalogos={catalogos}
      />

      {credencialesTemporales && (
        <dialog className="modal modal-open bg-black/50 backdrop-blur-sm">
          <div className="modal-box max-w-lg bg-white text-slate-800 rounded-2xl shadow-2xl">
            <h3 className="font-bold text-xl text-slate-900">Credenciales temporales</h3>

            <p className="text-sm text-slate-500 mt-2">
              Guarda estas credenciales antes de cerrar este cuadro. La contraseña temporal solo se muestra después de crear el psicólogo.
            </p>

            <div className="mt-5 space-y-3 bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div>
                <span className="text-xs font-bold uppercase text-slate-400">Correo</span>
                <p className="font-mono text-sm text-slate-800 break-all">{credencialesTemporales.email}</p>
              </div>

              <div>
                <span className="text-xs font-bold uppercase text-slate-400">Contraseña temporal</span>
                <p className="font-mono text-lg font-bold text-slate-900 tracking-wide break-all">
                  {credencialesTemporales.passwordTemporal}
                </p>
              </div>
            </div>

            <div className="modal-action">
              <button
                type="button"
                className="btn btn-outline"
                onClick={copiarCredenciales}
              >
                Copiar
              </button>

              <button
                type="button"
                className="btn bg-slate-900 text-white hover:bg-slate-800"
                onClick={() => setCredencialesTemporales(null)}
              >
                Entendido
              </button>
            </div>
          </div>
        </dialog>
      )}

    </div>
  );
}
