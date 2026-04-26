import { CATALOGOS_CONFIG, useConfiguracion } from '../hooks/useConfiguracion';

// Iconos SVG Inline (se mantienen para coherencia visual)
const Icons = {
  Settings: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.945a.75.75 0 01.106 1.06l-1.597 1.598a.75.75 0 11-1.06-1.06l1.598-1.597a.75.75 0 011.06-.106zM6.945 18.894a.75.75 0 01-1.06.106l-1.598-1.597a.75.75 0 111.06-1.06l1.597 1.598a.75.75 0 01-.106 1.06zM15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /><path d="M4.5 12a.75.75 0 01.75-.75h2.25a.75.75 0 010 1.5H5.25A.75.75 0 014.5 12zM17.25 12a.75.75 0 01.75-.75h2.25a.75.75 0 010 1.5H18a.75.75 0 01-.75-.75zM12 15.75a.75.75 0 01.75-.75v2.25a.75.75 0 01-1.5 0V15a.75.75 0 01.75-.75zM12 5.25a.75.75 0 01.75-.75h2.25a.75.75 0 010 1.5H13.5a.75.75 0 01-.75-.75zM6.945 6.945a.75.75 0 011.06-.106l1.597 1.598a.75.75 0 01-1.06 1.06L6.945 6.945zM18.894 17.651a.75.75 0 01-.106 1.06l-1.597 1.598a.75.75 0 01-1.06-1.06l1.598-1.597a.75.75 0 011.06-.106z" /></svg>,
  Plus: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>,
  Edit: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" /><path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" /></svg>,
  Trash: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.5A2.75 2.75 0 008.75 7h2.5A2.75 2.75 0 0014 4.25v-.5A2.75 2.75 0 0011.25 1h-2.5zM12.5 10A2.5 2.5 0 0010 7.5H8.75A1.25 1.25 0 017.5 6h-1A1.25 1.25 0 015.25 7.5V16c0 .59.41 1.05 1 1.05h7.5c.59 0 1.05-.46 1.05-1.05V7.5A2.5 2.5 0 0012.5 10zM5.5 8h9" clipRule="evenodd" /></svg>
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
    <div className="p-8 animate-fade-in-up flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto min-h-[80vh]">
      
      {/* SIDEBAR DE NAVEGACIÓN */}
      <div className="w-full lg:w-64 flex-shrink-0">
        <h2 className="text-3xl font-bold text-slate-900 mb-6 font-serif flex items-center gap-2">
            <span className="p-2 bg-slate-100 rounded-xl text-slate-600"><Icons.Settings /></span>
            Ajustes
        </h2>
        <ul className="menu bg-white rounded-2xl w-full shadow-md border border-slate-200 p-4">
          <li className="menu-title text-slate-400 uppercase text-xs font-bold p-2 mb-1">Catálogos del Sistema</li>
          {CATALOGOS_CONFIG.map((cat) => (
            <li key={cat.key} className="p-0">
              <button 
                className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors w-full text-left ${
                    activeTab.key === cat.key 
                        ? 'bg-slate-800 text-white font-semibold shadow-md' 
                        : 'text-slate-600 hover:bg-slate-50'
                }`}
                onClick={() => setActiveTab(cat)}
              >
                {cat.label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* ÁREA DE CONTENIDO PRINCIPAL */}
      <div className="flex-1 bg-white rounded-2xl shadow-md border border-slate-200 p-6 flex flex-col">
        
        {/* HEADER DE CONTENIDO */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-6">
          <div>
            <h3 className="text-2xl font-bold text-slate-900">{activeTab.label}</h3>
            <p className="text-sm text-slate-500">Administrar registros de {activeTab.label.toLowerCase()}</p>
          </div>
          <button className="btn btn-primary text-white shadow-md gap-2 px-6" onClick={() => openModal()}>
            <Icons.Plus /> Agregar Nuevo
          </button>
        </div>

        {/* TABLA DE REGISTROS */}
        <div className="flex-1 overflow-x-auto">
          {loading ? (
            <div className="text-center py-20"><span className="loading loading-spinner loading-lg text-primary"></span></div>
          ) : (
            <table className="table w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="w-24 py-4 pl-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Código</th>
                  <th className="py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Descripción / Nombre</th>
                  <th className="py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right pr-6">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => {
                  const idValue = item[activeTab.idField];
                  const nameValue = item[activeTab.nameField];

                  return (
                    <tr key={idValue} className="hover:bg-slate-50 transition-colors group">
                      <td className="font-mono text-slate-400 text-sm pl-6">
                          #{ idValue?.toString().padStart(3, '0') || '---' } 
                      </td>
                      <td className="font-bold text-slate-700 text-base">
                        {nameValue || <span className="text-rose-400 italic">Sin nombre</span>}
                      </td>
                      <td className="text-right pr-6">
                        <div className="flex justify-end gap-2">
                            <button 
                              className="btn btn-sm btn-ghost text-slate-500 hover:text-blue-600 hover:bg-blue-50 tooltip" 
                              data-tip="Editar" 
                              onClick={() => openModal(item)}
                            >
                               <Icons.Edit />
                            </button>
                            <button 
                              className="btn btn-sm btn-ghost text-red-500 hover:bg-red-50 tooltip" 
                              data-tip="Eliminar" 
                              onClick={() => handleDelete(idValue)}
                            >
                               <Icons.Trash />
                            </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {items.length === 0 && (
                  <tr><td colSpan={3} className="text-center py-20 text-slate-400 italic">No hay registros cargados en este catálogo.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* MODAL REUTILIZABLE */}
      {modalOpen && (
        <dialog className="modal modal-open backdrop-blur-sm">
          <div className="modal-box bg-white text-slate-800 shadow-2xl p-0 rounded-2xl overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-lg text-slate-900">
                    {editItem ? '✏️ Editar Registro' : `➕ Nuevo: ${activeTab.label}`}
                </h3>
                <button type="button" className="btn btn-sm btn-circle btn-ghost" onClick={closeModal}>✕</button>
            </div>
            
            <form onSubmit={handleSave}>
              <div className="p-6">
                <div className="form-control w-full">
                  <label className="label font-bold text-slate-500 text-xs uppercase">Nombre / Descripción</label>
                  <input 
                    type="text" 
                    className="input input-bordered w-full bg-slate-50 focus:bg-white focus:border-blue-500 transition-colors" 
                    autoFocus
                    required
                    placeholder={`Escriba aquí...`}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="modal-action px-6 py-4 bg-slate-50 border-t border-slate-100">
                <button type="button" className="btn btn-ghost hover:bg-slate-100" onClick={closeModal}>Cancelar</button>
                <button type="submit" className="btn btn-primary text-white shadow-md">
                    {editItem ? 'Actualizar' : 'Crear Registro'}
                </button>
              </div>
            </form>
          </div>
        </dialog>
      )}

    </div>
  );
}