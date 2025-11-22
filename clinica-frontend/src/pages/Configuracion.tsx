import { CATALOGOS_CONFIG, useConfiguracion } from '../hooks/useConfiguracion';

export default function Configuracion() {
  const {
    activeTab, setActiveTab,
    items, loading,
    modalOpen, closeModal,
    inputValue, setInputValue, editItem,
    openModal, handleSave, handleDelete
  } = useConfiguracion();

  return (
    <div className="p-6 animate-fade-in-up flex flex-col md:flex-row gap-6 min-h-[80vh]">
      
      {/* SIDEBAR DE NAVEGACIÓN */}
      <div className="w-full md:w-64 flex-shrink-0">
        <h2 className="text-2xl font-bold text-slate-800 mb-6 px-2">Configuración</h2>
        <ul className="menu bg-white rounded-box w-full shadow-sm border border-slate-200">
          <li className="menu-title text-slate-400 uppercase text-xs font-bold p-2">Catálogos del Sistema</li>
          {CATALOGOS_CONFIG.map((cat) => (
            <li key={cat.key}>
              <a 
                className={activeTab.key === cat.key ? 'active font-bold bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-50'}
                onClick={() => setActiveTab(cat)}
              >
                {cat.label}
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* ÁREA DE CONTENIDO */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <div>
            <h3 className="text-xl font-bold text-slate-800">{activeTab.label}</h3>
            <p className="text-sm text-slate-500">Administrar registros de {activeTab.label.toLowerCase()}</p>
          </div>
          <button className="btn btn-primary text-white shadow-md" onClick={() => openModal()}>
            + Agregar Nuevo
          </button>
        </div>

        <div className="flex-1 overflow-x-auto">
          {loading ? (
            <div className="text-center py-20"><span className="loading loading-spinner loading-lg text-primary"></span></div>
          ) : (
            <table className="table w-full">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold">
                <tr>
                  <th className="w-16 py-4 pl-6">ID</th>
                  <th>Nombre / Descripción</th>
                  <th className="text-right pr-6">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr key={item[activeTab.idField]} className="hover:bg-slate-50 transition-colors">
                    <td className="font-mono text-slate-400 pl-6">#{item[activeTab.idField]}</td>
                    <td className="font-bold text-slate-700">{item[activeTab.nameField]}</td>
                    <td className="text-right pr-6 space-x-2">
                      <button className="btn btn-xs btn-outline" onClick={() => openModal(item)}>Editar</button>
                      <button className="btn btn-xs btn-ghost text-error hover:bg-red-50" onClick={() => handleDelete(item[activeTab.idField])}>Eliminar</button>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr><td colSpan={3} className="text-center py-16 text-slate-400 italic">No hay registros en este catálogo.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* MODAL REUTILIZABLE */}
      {modalOpen && (
        <dialog className="modal modal-open backdrop-blur-sm">
          <div className="modal-box bg-white text-slate-800 shadow-2xl">
            <h3 className="font-bold text-lg mb-4">
              {editItem ? 'Editar Registro' : `Agregar a ${activeTab.label}`}
            </h3>
            <form onSubmit={handleSave}>
              <div className="form-control w-full mb-6">
                <label className="label font-bold text-slate-500 text-xs uppercase">Nombre</label>
                <input 
                  type="text" 
                  className="input input-bordered w-full bg-white focus:border-blue-500" 
                  autoFocus
                  placeholder={`Escriba el nombre...`}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
              </div>
              <div className="modal-action">
                <button type="button" className="btn btn-ghost hover:bg-slate-100" onClick={closeModal}>Cancelar</button>
                <button type="submit" className="btn btn-primary text-white">Guardar</button>
              </div>
            </form>
          </div>
        </dialog>
      )}

    </div>
  );
}