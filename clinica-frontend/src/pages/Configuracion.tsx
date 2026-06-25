import { CATALOGOS_CONFIG, useConfiguracion } from '../hooks/useConfiguracion';
import BackupSistema from '../components/configuracion/BackupSistema';

const Icons = {
  Settings: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-6 w-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25a3.75 3.75 0 100 7.5 3.75 3.75 0 000-7.5z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12a7.44 7.44 0 00-.075-1.055l2.075-1.6-2-3.464-2.45.985a7.54 7.54 0 00-1.825-1.06L14.875 3h-5.75l-.35 2.806a7.54 7.54 0 00-1.825 1.06L4.5 5.881l-2 3.464 2.075 1.6A7.44 7.44 0 004.5 12c0 .358.025.71.075 1.055L2.5 14.655l2 3.464 2.45-.985a7.54 7.54 0 001.825 1.06l.35 2.806h5.75l.35-2.806a7.54 7.54 0 001.825-1.06l2.45.985 2-3.464-2.075-1.6c.05-.345.075-.697.075-1.055z" />
    </svg>
  ),
  Plus: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
      <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
    </svg>
  ),
  Edit: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
      <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
    </svg>
  ),
  Trash: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.5H3.75a.75.75 0 000 1.5h12.5a.75.75 0 000-1.5H14v-.5A2.75 2.75 0 0011.25 1h-2.5zM7.5 4.25v-.5c0-.69.56-1.25 1.25-1.25h2.5c.69 0 1.25.56 1.25 1.25v.5h-5zM5.25 7.25a.75.75 0 01.75-.75h8a.75.75 0 01.75.75l-.45 8.42A2.5 2.5 0 0111.8 18H8.2a2.5 2.5 0 01-2.5-2.33l-.45-8.42z" clipRule="evenodd" />
    </svg>
  ),
  Folder: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 7.5A2.25 2.25 0 016 5.25h4.5l2.25 2.25H18A2.25 2.25 0 0120.25 9.75V18A2.25 2.25 0 0118 20.25H6A2.25 2.25 0 013.75 18V7.5z" />
    </svg>
  ),
  Database: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-6 w-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 6.75c0-2.071 3.358-3.75 7.5-3.75s7.5 1.679 7.5 3.75-3.358 3.75-7.5 3.75-7.5-1.679-7.5-3.75z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 6.75v5.25c0 2.071 3.358 3.75 7.5 3.75s7.5-1.679 7.5-3.75V6.75" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12v5.25c0 2.071 3.358 3.75 7.5 3.75s7.5-1.679 7.5-3.75V12" />
    </svg>
  ),
  List: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-6 w-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12M8.25 17.25h12M3.75 6.75h.01M3.75 12h.01M3.75 17.25h.01" />
    </svg>
  ),
  Empty: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" className="h-12 w-12">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 6.75c0-2.071 3.358-3.75 7.5-3.75s7.5 1.679 7.5 3.75-3.358 3.75-7.5 3.75-7.5-1.679-7.5-3.75z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 6.75v10.5c0 2.071 3.358 3.75 7.5 3.75s7.5-1.679 7.5-3.75V6.75" />
    </svg>
  ),
  Close: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
};

export default function Configuracion() {
  const {
    activeTab, setActiveTab,
    items, loading,
    modalOpen, closeModal,
    inputValue, setInputValue, editItem,
    openModal, handleSave, handleDelete
  } = useConfiguracion();

  return (
    <div className="mx-auto max-w-[1700px] animate-fade-in-up space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-slate-950 px-6 py-7 text-white shadow-2xl shadow-slate-200/80 sm:px-8">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-500/25 blur-3xl"></div>
        <div className="absolute -bottom-28 left-14 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl"></div>

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-blue-300">
              Administración
            </p>
            <h1 className="mt-2 font-serif text-3xl font-black tracking-tight sm:text-4xl">
              Configuración del Sistema
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
              Gestión de catálogos base utilizados por pacientes, citas, sesiones, facturación y datos administrativos.
            </p>
          </div>

          <button
            type="button"
            className="btn min-h-12 rounded-2xl border-white/10 bg-white px-6 text-slate-950 shadow-xl hover:border-white hover:bg-slate-100"
            onClick={() => openModal()}
          >
            <Icons.Plus />
            Agregar registro
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-white/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Catálogos</p>
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-50 text-slate-500">
              <Icons.Folder />
            </span>
          </div>
          <p className="mt-2 text-3xl font-black text-slate-950">{CATALOGOS_CONFIG.length}</p>
          <p className="mt-1 text-xs font-medium text-slate-400">Configuraciones disponibles</p>
        </div>

        <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500">Activo</p>
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-blue-600">
              <Icons.Settings />
            </span>
          </div>
          <p className="mt-2 truncate text-3xl font-black text-blue-700">{activeTab.label}</p>
          <p className="mt-1 text-xs font-medium text-blue-500/70">Catálogo seleccionado</p>
        </div>

        <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500">Registros</p>
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-emerald-600">
              <Icons.Database />
            </span>
          </div>
          <p className="mt-2 text-3xl font-black text-emerald-700">{items.length}</p>
          <p className="mt-1 text-xs font-medium text-emerald-500/70">Elementos en catálogo actual</p>
        </div>
      </section>

      <BackupSistema />

      <section className="grid grid-cols-1 gap-8 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="rounded-[2rem] border border-white/80 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-5">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-600">Navegación</p>
            <h2 className="mt-1 text-xl font-black text-slate-900">Catálogos</h2>
          </div>

          <div className="max-h-[680px] space-y-2 overflow-y-auto p-4">
            {CATALOGOS_CONFIG.map((cat, index) => {
              const isActive = activeTab.key === cat.key;

              return (
                <button
                  key={`catalogo-${String(cat.key)}-${index}`}
                  type="button"
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition-all ${
                    isActive
                      ? 'border-slate-900 bg-slate-950 text-white shadow-lg shadow-slate-200'
                      : 'border-slate-100 bg-white text-slate-600 hover:border-blue-100 hover:bg-blue-50/60 hover:text-blue-700'
                  }`}
                  onClick={() => setActiveTab(cat)}
                >
                  <div className="flex items-center gap-3">
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      isActive
                        ? 'bg-white/10 text-white'
                        : 'bg-slate-50 text-slate-500'
                    }`}>
                      <Icons.Folder />
                    </span>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-black">{cat.label}</p>
                      <p className={`mt-0.5 truncate text-[11px] font-medium ${
                        isActive ? 'text-slate-300' : 'text-slate-400'
                      }`}>
                        Campo: {cat.nameField}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <main className="rounded-[2rem] border border-white/80 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-600">Catálogo activo</p>
                <h3 className="mt-1 text-2xl font-black text-slate-900">{activeTab.label}</h3>
                <p className="mt-1 text-sm font-medium text-slate-400">
                  Administrar registros de {activeTab.label.toLowerCase()}.
                </p>
              </div>

              <button
                type="button"
                className="btn min-h-11 rounded-2xl bg-slate-950 px-6 text-white hover:bg-slate-800"
                onClick={() => openModal()}
              >
                <Icons.Plus />
                Nuevo registro
              </button>
            </div>
          </div>

          <div className="p-5">
            {loading ? (
              <div className="rounded-[1.5rem] border border-slate-100 bg-slate-50 py-24 text-center">
                <span className="loading loading-spinner loading-lg text-primary"></span>
                <p className="mt-4 animate-pulse text-sm text-slate-400">Cargando registros...</p>
              </div>
            ) : items.length > 0 ? (
              <div className="space-y-3">
                {items.map((item, index) => {
                  const rawId = item[activeTab.idField];
                  const id = Number(rawId || 0);
                  const nombre = String(item[activeTab.nameField] || 'Sin nombre');
                  const itemKey = `registro-${String(activeTab.key)}-${index}-${String(rawId ?? 'sin-id')}-${nombre}`;

                  return (
                    <article
                      key={itemKey}
                      className="group rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-xl hover:shadow-slate-200/70"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 items-center gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 font-mono text-xs font-black text-slate-500">
                            #{id.toString().padStart(3, '0')}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-base font-black text-slate-900" title={nombre}>
                              {nombre}
                            </p>
                            <p className="mt-1 text-xs font-medium text-slate-400">
                              ID interno: {id}
                            </p>
                          </div>
                        </div>

                        <div className="flex shrink-0 gap-2">
                          <button
                            type="button"
                            className="btn btn-sm rounded-xl border-blue-100 bg-blue-50 text-blue-700 hover:border-blue-200 hover:bg-blue-100"
                            onClick={() => openModal(item)}
                          >
                            <Icons.Edit />
                            Editar
                          </button>

                          <button
                            type="button"
                            className="btn btn-sm rounded-xl border-rose-100 bg-rose-50 text-rose-700 hover:border-rose-200 hover:bg-rose-100"
                            onClick={() => handleDelete(id)}
                          >
                            <Icons.Trash />
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-6 py-24 text-center">
                <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-white text-slate-300 shadow-sm">
                  <Icons.Empty />
                </div>
                <p className="text-lg font-black text-slate-700">No hay registros en este catálogo</p>
                <p className="mt-2 max-w-sm text-sm font-medium text-slate-400">
                  Agrega el primer registro para comenzar a utilizar este catálogo en el sistema.
                </p>
                <button
                  type="button"
                  className="btn btn-sm mt-6 rounded-xl border-blue-100 bg-blue-50 text-blue-700 hover:border-blue-200 hover:bg-blue-100"
                  onClick={() => openModal()}
                >
                  <Icons.Plus />
                  Agregar registro
                </button>
              </div>
            )}
          </div>
        </main>
      </section>

      {modalOpen && (
        <dialog className="modal modal-open bg-slate-950/50 backdrop-blur-sm">
          <div className="modal-box max-w-xl overflow-hidden rounded-[2rem] bg-white p-0 text-slate-800 shadow-2xl">
            <div className="bg-slate-950 px-6 py-5 text-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-300">
                    {editItem ? 'Edición' : 'Nuevo registro'}
                  </p>
                  <h3 className="mt-1 text-2xl font-black text-white">
                    {editItem ? 'Editar registro' : `Agregar a ${activeTab.label}`}
                  </h3>
                  <p className="mt-2 text-sm text-slate-300">
                    Complete el nombre del elemento para guardar los cambios del catálogo.
                  </p>
                </div>

                <button
                  type="button"
                  className="btn btn-sm btn-circle border-white/10 bg-white/10 text-white hover:bg-white/20"
                  onClick={closeModal}
                >
                  <Icons.Close />
                </button>
              </div>
            </div>

            <form onSubmit={handleSave}>
              <div className="p-6">
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                  Nombre
                </label>
                <input
                  type="text"
                  className="input input-bordered h-12 w-full rounded-2xl bg-slate-50 text-sm font-medium transition-colors focus:bg-white"
                  autoFocus
                  placeholder={`Escriba el nombre de ${activeTab.label.toLowerCase()}...`}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
                <button type="button" className="btn rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-100" onClick={closeModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn rounded-xl bg-slate-950 text-white hover:bg-slate-800">
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </dialog>
      )}
    </div>
  );
}
