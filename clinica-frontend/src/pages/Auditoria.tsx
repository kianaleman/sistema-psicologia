import { useState } from 'react';
import { useAuditoria } from '../hooks/useAuditoria';
import type { AuditoriaSistema } from '../types/auditoria';

const MODULOS = [
  'AUTH',
  'SEGURIDAD',
  'PACIENTES',
  'PSICOLOGOS',
  'TUTORES',
  'CITAS',
  'SESIONES',
  'FACTURACION',
  'CONFIGURACION',
];

const formatearFecha = (value: string) => {
  const fecha = new Date(value);

  if (Number.isNaN(fecha.getTime())) return value;

  return fecha.toLocaleString('es-NI', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getResultadoClass = (resultado: string) => {
  return resultado === 'EXITO'
    ? 'badge badge-sm bg-emerald-50 text-emerald-700 border-emerald-200'
    : 'badge badge-sm bg-rose-50 text-rose-700 border-rose-200';
};

const parseJsonSeguro = (value?: string | null) => {
  if (!value) return '';

  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
};

function AuditoriaDetalleModal({
  item,
  onClose,
}: {
  item: AuditoriaSistema | null;
  onClose: () => void;
}) {
  if (!item) return null;

  return (
    <dialog className="modal modal-open bg-slate-950/40 backdrop-blur-sm">
      <div className="modal-box w-11/12 max-w-4xl bg-white rounded-3xl p-0 overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-start gap-4">
          <div>
            <p className="text-xs font-black text-blue-600 uppercase tracking-[0.2em]">Detalle de auditoría</p>
            <h3 className="text-2xl font-bold font-serif text-slate-900 mt-1">{item.Accion}</h3>
            <p className="text-sm text-slate-500 mt-1">{item.Modulo} · {formatearFecha(item.FechaHora)}</p>
          </div>

          <button type="button" className="btn btn-sm btn-circle btn-ghost" onClick={onClose}>✕</button>
        </div>

        <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Usuario</p>
              <p className="text-sm font-semibold text-slate-700 mt-1">{item.UsuarioEmail || 'Sistema / Público'}</p>
            </div>

            <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ruta</p>
              <p className="text-sm font-semibold text-slate-700 mt-1 break-all">{item.MetodoHTTP || '-'} {item.Ruta || '-'}</p>
            </div>

            <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resultado</p>
              <span className={`${getResultadoClass(item.Resultado)} mt-2`}>{item.Resultado}</span>
            </div>
          </div>

          {item.Mensaje && (
            <div className="rounded-2xl border border-slate-100 bg-white p-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mensaje</p>
              <p className="text-sm text-slate-700 mt-2">{item.Mensaje}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase mb-2">Datos antes</p>
              <pre className="text-xs bg-slate-950 text-slate-100 rounded-2xl p-4 overflow-x-auto min-h-32">
                {parseJsonSeguro(item.DatosAntes) || 'Sin datos'}
              </pre>
            </div>

            <div>
              <p className="text-xs font-bold text-slate-500 uppercase mb-2">Datos después</p>
              <pre className="text-xs bg-slate-950 text-slate-100 rounded-2xl p-4 overflow-x-auto min-h-32">
                {parseJsonSeguro(item.DatosDespues) || 'Sin datos'}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </dialog>
  );
}

export default function Auditoria() {
  const {
    filtros,
    data,
    resumen,
    loading,
    actualizarFiltro,
    limpiarFiltros,
    recargar,
  } = useAuditoria();

  const [itemSeleccionado, setItemSeleccionado] = useState<AuditoriaSistema | null>(null);

  return (
    <div className="w-full max-w-full min-w-0 px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up overflow-x-hidden">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4 mb-8">
        <div>
          <p className="text-xs font-black text-blue-600 uppercase tracking-[0.25em]">Administración</p>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight font-serif mt-1">
            Auditoría del Sistema
          </h1>
          <p className="text-slate-500 mt-2 text-sm max-w-2xl">
            Trazabilidad de accesos, cambios de datos, permisos y acciones sensibles.
          </p>
        </div>

        <button type="button" className="btn bg-slate-900 text-white hover:bg-slate-800" onClick={() => void recargar()}>
          Actualizar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase">Eventos totales</p>
          <p className="text-3xl font-black text-slate-900 mt-2">{resumen.total}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase">Exitosos</p>
          <p className="text-3xl font-black text-emerald-600 mt-2">{resumen.exitosos}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase">Fallidos</p>
          <p className="text-3xl font-black text-rose-600 mt-2">{resumen.fallidos}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase">Hoy</p>
          <p className="text-3xl font-black text-blue-600 mt-2">{resumen.hoy}</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <input
            type="text"
            className="input input-bordered bg-slate-50"
            placeholder="Buscar..."
            value={filtros.busqueda}
            onChange={(event) => actualizarFiltro('busqueda', event.target.value)}
          />

          <input
            type="text"
            className="input input-bordered bg-slate-50"
            placeholder="Usuario"
            value={filtros.usuario}
            onChange={(event) => actualizarFiltro('usuario', event.target.value)}
          />

          <select
            className="select select-bordered bg-slate-50"
            value={filtros.modulo}
            onChange={(event) => actualizarFiltro('modulo', event.target.value)}
          >
            <option value="">Todos los módulos</option>
            {MODULOS.map((modulo) => (
              <option key={modulo} value={modulo}>{modulo}</option>
            ))}
          </select>

          <select
            className="select select-bordered bg-slate-50"
            value={filtros.resultado}
            onChange={(event) => actualizarFiltro('resultado', event.target.value as typeof filtros.resultado)}
          >
            <option value="">Todo resultado</option>
            <option value="EXITO">Éxito</option>
            <option value="FALLO">Fallo</option>
          </select>

          <input
            type="date"
            className="input input-bordered bg-slate-50"
            value={filtros.fechaInicio}
            onChange={(event) => actualizarFiltro('fechaInicio', event.target.value)}
          />

          <input
            type="date"
            className="input input-bordered bg-slate-50"
            value={filtros.fechaFin}
            onChange={(event) => actualizarFiltro('fechaFin', event.target.value)}
          />
        </div>

        <div className="flex justify-end mt-4">
          <button type="button" className="btn btn-sm btn-ghost" onClick={limpiarFiltros}>
            Limpiar filtros
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table table-fixed w-full min-w-[1100px]">
            <colgroup>
              <col className="w-[150px]" />
              <col className="w-[170px]" />
              <col className="w-[160px]" />
              <col className="w-[180px]" />
              <col className="w-[170px]" />
              <col className="w-[120px]" />
              <col className="w-[90px]" />
            </colgroup>

            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="py-4 pl-6 text-xs font-bold text-slate-500 uppercase">Fecha</th>
                <th className="py-4 text-xs font-bold text-slate-500 uppercase">Usuario</th>
                <th className="py-4 text-xs font-bold text-slate-500 uppercase">Módulo</th>
                <th className="py-4 text-xs font-bold text-slate-500 uppercase">Acción</th>
                <th className="py-4 text-xs font-bold text-slate-500 uppercase">Ruta</th>
                <th className="py-4 text-xs font-bold text-slate-500 uppercase">Resultado</th>
                <th className="py-4 pr-6 text-xs font-bold text-slate-500 uppercase text-center">Detalle</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td colSpan={7} className="text-center py-20">
                    <span className="loading loading-spinner loading-lg text-primary"></span>
                  </td>
                </tr>
              )}

              {!loading && data.items.map((item) => (
                <tr key={item.ID_Auditoria} className="hover:bg-slate-50">
                  <td className="pl-6 py-4 text-xs text-slate-500">{formatearFecha(item.FechaHora)}</td>
                  <td className="py-4">
                    <div className="text-sm font-semibold text-slate-700 truncate" title={item.UsuarioEmail || ''}>
                      {item.UsuarioEmail || 'Sistema / Público'}
                    </div>
                    <div className="text-xs text-slate-400 truncate" title={item.Roles || ''}>
                      {item.Roles || '-'}
                    </div>
                  </td>
                  <td className="py-4">
                    <span className="badge badge-sm badge-outline text-slate-600 border-slate-300">
                      {item.Modulo}
                    </span>
                  </td>
                  <td className="py-4 text-sm text-slate-700 truncate" title={item.Accion}>{item.Accion}</td>
                  <td className="py-4 text-xs text-slate-500 truncate" title={item.Ruta || ''}>
                    {item.MetodoHTTP || '-'} {item.Ruta || '-'}
                  </td>
                  <td className="py-4">
                    <span className={getResultadoClass(item.Resultado)}>{item.Resultado}</span>
                  </td>
                  <td className="py-4 pr-6 text-center">
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                      onClick={() => setItemSeleccionado(item)}
                    >
                      Ver
                    </button>
                  </td>
                </tr>
              ))}

              {!loading && data.items.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-slate-400">
                    No se encontraron eventos de auditoría.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            Mostrando {data.items.length} de {data.total} eventos
          </p>

          <div className="join">
            <button
              type="button"
              className="btn btn-sm join-item"
              disabled={filtros.page <= 1}
              onClick={() => actualizarFiltro('page', filtros.page - 1)}
            >
              Anterior
            </button>
            <button type="button" className="btn btn-sm join-item">
              {data.page} / {Math.max(data.totalPages, 1)}
            </button>
            <button
              type="button"
              className="btn btn-sm join-item"
              disabled={filtros.page >= data.totalPages}
              onClick={() => actualizarFiltro('page', filtros.page + 1)}
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>

      <AuditoriaDetalleModal item={itemSeleccionado} onClose={() => setItemSeleccionado(null)} />
    </div>
  );
}
