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

const Icons = {
  Refresh: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 7.5h4.25V3.25" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5A8.25 8.25 0 105.5 17.625" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 16.5H3.25v4.25" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 16.5A8.25 8.25 0 0018.5 6.375" />
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
  Shield: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-6 w-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s7-3.75 7-10.5V5.25L12 3 5 5.25v5.25C5 17.25 12 21 12 21z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75l2.25 2.25L15.75 9.75" />
    </svg>
  ),
  Check: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-6 w-6">
      <circle cx="12" cy="12" r="8.25" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.75 12.25l2.25 2.25 4.5-5" />
    </svg>
  ),
  Alert: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-6 w-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4.25" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5h.01" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.29 3.86L2.82 17.25A2.25 2.25 0 004.79 20.5h14.42a2.25 2.25 0 001.97-3.25L13.71 3.86a2 2 0 00-3.42 0z" />
    </svg>
  ),
  Calendar: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 3v3M17 3v3M4.5 8.25h15M5.25 5.25h13.5A1.5 1.5 0 0120.25 6.75v12A1.5 1.5 0 0118.75 20.25H5.25A1.5 1.5 0 013.75 18.75v-12A1.5 1.5 0 015.25 5.25z" />
    </svg>
  ),
  User: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-5 w-5">
      <circle cx="12" cy="8" r="3.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 21a7 7 0 0114 0" />
    </svg>
  ),
  Route: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.01M17.25 17.25h.01" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 6.75h5.25a3 3 0 010 6H11.25a3 3 0 000 6h5.25" />
      <circle cx="6.75" cy="6.75" r="2.25" />
      <circle cx="17.25" cy="17.25" r="2.25" />
    </svg>
  ),
  Module: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-5 w-5">
      <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" />
    </svg>
  ),
  Filter: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path
        fillRule="evenodd"
        d="M2.628 1.601C5.028 1.206 7.49 1 10 1s4.973.206 7.372.601a.75.75 0 01.628.74v2.288a2.25 2.25 0 01-.659 1.59l-4.682 4.683a2.25 2.25 0 00-.659 1.59v3.037c0 .684-.31 1.33-.844 1.757l-1.937 1.55A.75.75 0 018 18.25v-5.757a2.25 2.25 0 00-.659-1.591L2.659 6.22A2.25 2.25 0 012 4.629V2.34a.75.75 0 01.628-.74z"
        clipRule="evenodd"
      />
    </svg>
  ),
  Eye: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
      <path
        fillRule="evenodd"
        d="M.328 10.05a.75.75 0 010-.1C2.828 5.95 6.102 3.75 10 3.75s7.172 2.2 9.672 6.2a.75.75 0 010 .1c-2.5 4-5.774 6.2-9.672 6.2s-7.172-2.2-9.672-6.2zM10 14a4 4 0 100-8 4 4 0 000 8z"
        clipRule="evenodd"
      />
    </svg>
  ),
  Empty: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" className="h-12 w-12">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3.75h9A2.25 2.25 0 0118.75 6v12A2.25 2.25 0 0116.5 20.25h-9A2.25 2.25 0 015.25 18V6A2.25 2.25 0 017.5 3.75z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25h6M9 12h6M9 15.75h3" />
    </svg>
  ),
  Close: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  ChevronLeft: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
  ),
  ChevronRight: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  ),
};

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
    ? 'badge badge-sm border-emerald-200 bg-emerald-50 text-emerald-700'
    : 'badge badge-sm border-rose-200 bg-rose-50 text-rose-700';
};

const getResultadoCardClass = (resultado: string) => {
  return resultado === 'EXITO'
    ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
    : 'border-rose-100 bg-rose-50 text-rose-700';
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
    <dialog className="modal modal-open bg-slate-950/50 backdrop-blur-sm">
      <div className="modal-box w-11/12 max-w-5xl overflow-hidden rounded-[2rem] bg-white p-0">
        <div className="bg-slate-950 px-6 py-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-300">Detalle de auditoría</p>
              <h3 className="mt-1 truncate text-2xl font-black text-white">{item.Accion}</h3>
              <p className="mt-1 text-xs font-medium text-slate-400">
                {item.Modulo} · {formatearFecha(item.FechaHora)}
              </p>
            </div>

            <button type="button" className="btn btn-sm btn-circle border-white/10 bg-white/10 text-white hover:bg-white/20" onClick={onClose}>
              <Icons.Close />
            </button>
          </div>
        </div>

        <div className="max-h-[72vh] overflow-y-auto p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Usuario</p>
              <p className="mt-2 break-all text-sm font-bold text-slate-700">{item.UsuarioEmail || 'Sistema / Público'}</p>
              <p className="mt-1 break-all text-xs font-medium text-slate-400">{item.Roles || '-'}</p>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Ruta</p>
              <p className="mt-2 break-all text-sm font-bold text-slate-700">
                {item.MetodoHTTP || '-'} {item.Ruta || '-'}
              </p>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Resultado</p>
              <div className="mt-2">
                <span className={getResultadoClass(item.Resultado)}>{item.Resultado}</span>
              </div>
            </div>
          </div>

          {item.Mensaje && (
            <div className="mt-5 rounded-3xl border border-slate-100 bg-white p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Mensaje</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">{item.Mensaje}</p>
            </div>
          )}

          <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-slate-500">Datos antes</p>
              <pre className="min-h-48 overflow-x-auto rounded-3xl bg-slate-950 p-5 text-xs leading-relaxed text-slate-100">
                {parseJsonSeguro(item.DatosAntes) || 'Sin datos'}
              </pre>
            </div>

            <div>
              <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-slate-500">Datos después</p>
              <pre className="min-h-48 overflow-x-auto rounded-3xl bg-slate-950 p-5 text-xs leading-relaxed text-slate-100">
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
              Auditoría del Sistema
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
              Trazabilidad de accesos, cambios de datos, permisos, rutas consultadas y acciones sensibles.
            </p>
          </div>

          <button
            type="button"
            className="btn min-h-12 rounded-2xl border-white/10 bg-white px-6 text-slate-950 shadow-xl hover:border-white hover:bg-slate-100"
            onClick={() => void recargar()}
          >
            <Icons.Refresh />
            Actualizar
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-white/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Eventos</p>
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-50 text-slate-500">
              <Icons.Shield />
            </span>
          </div>
          <p className="mt-2 text-3xl font-black text-slate-950">{resumen.total}</p>
          <p className="mt-1 text-xs font-medium text-slate-400">Eventos totales</p>
        </div>

        <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500">Exitosos</p>
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-emerald-600">
              <Icons.Check />
            </span>
          </div>
          <p className="mt-2 text-3xl font-black text-emerald-700">{resumen.exitosos}</p>
          <p className="mt-1 text-xs font-medium text-emerald-500/70">Operaciones completadas</p>
        </div>

        <div className="rounded-3xl border border-rose-100 bg-rose-50 p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500">Fallidos</p>
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-rose-600">
              <Icons.Alert />
            </span>
          </div>
          <p className="mt-2 text-3xl font-black text-rose-700">{resumen.fallidos}</p>
          <p className="mt-1 text-xs font-medium text-rose-500/70">Eventos con error</p>
        </div>

        <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500">Hoy</p>
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-blue-600">
              <Icons.Calendar />
            </span>
          </div>
          <p className="mt-2 text-3xl font-black text-blue-700">{resumen.hoy}</p>
          <p className="mt-1 text-xs font-medium text-blue-500/70">Eventos del día</p>
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/80 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-600">Filtros</p>
            <h2 className="mt-1 text-xl font-black text-slate-900">Consulta de eventos</h2>
          </div>

          <button type="button" className="btn btn-sm rounded-xl border-slate-200 bg-white text-slate-600 hover:bg-slate-50" onClick={limpiarFiltros}>
            Limpiar filtros
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
          <div className="relative xl:col-span-2">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
              <Icons.Search />
            </div>
            <input
              type="text"
              className="input input-bordered h-12 w-full rounded-2xl bg-slate-50 pl-11 text-sm font-medium transition-colors focus:bg-white"
              placeholder="Buscar evento..."
              value={filtros.busqueda}
              onChange={(event) => actualizarFiltro('busqueda', event.target.value)}
            />
          </div>

          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
              <Icons.User />
            </div>
            <input
              type="text"
              className="input input-bordered h-12 w-full rounded-2xl bg-slate-50 pl-11 text-sm font-medium transition-colors focus:bg-white"
              placeholder="Usuario"
              value={filtros.usuario}
              onChange={(event) => actualizarFiltro('usuario', event.target.value)}
            />
          </div>

          <select
            className="select select-bordered h-12 w-full rounded-2xl bg-slate-50 text-sm font-medium transition-colors focus:bg-white"
            value={filtros.modulo}
            onChange={(event) => actualizarFiltro('modulo', event.target.value)}
          >
            <option value="">Todos los módulos</option>
            {MODULOS.map((modulo) => (
              <option key={modulo} value={modulo}>{modulo}</option>
            ))}
          </select>

          <select
            className="select select-bordered h-12 w-full rounded-2xl bg-slate-50 text-sm font-medium transition-colors focus:bg-white"
            value={filtros.resultado}
            onChange={(event) => actualizarFiltro('resultado', event.target.value as typeof filtros.resultado)}
          >
            <option value="">Todo resultado</option>
            <option value="EXITO">Éxito</option>
            <option value="FALLO">Fallo</option>
          </select>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:col-span-1 xl:grid-cols-1">
            <input
              type="date"
              className="input input-bordered h-12 w-full rounded-2xl bg-slate-50 text-sm font-medium transition-colors focus:bg-white"
              value={filtros.fechaInicio}
              onChange={(event) => actualizarFiltro('fechaInicio', event.target.value)}
            />

            <input
              type="date"
              className="input input-bordered h-12 w-full rounded-2xl bg-slate-50 text-sm font-medium transition-colors focus:bg-white"
              value={filtros.fechaFin}
              onChange={(event) => actualizarFiltro('fechaFin', event.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/80 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-600">Eventos</p>
              <h2 className="mt-1 text-2xl font-black text-slate-900">Bitácora de auditoría</h2>
            </div>
            <p className="text-sm font-medium text-slate-400">
              Mostrando {data.items.length} de {data.total} eventos
            </p>
          </div>
        </div>

        <div className="p-5">
          {loading && (
            <div className="rounded-[1.5rem] border border-slate-100 bg-slate-50 py-24 text-center">
              <span className="loading loading-spinner loading-lg text-primary"></span>
              <p className="mt-4 animate-pulse text-sm text-slate-400">Cargando eventos...</p>
            </div>
          )}

          {!loading && data.items.length > 0 && (
            <div className="space-y-4">
              {data.items.map((item) => (
                <article
                  key={item.ID_Auditoria}
                  className="group overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-xl hover:shadow-slate-200/70"
                >
                  <div className="grid grid-cols-1 gap-5 p-5 xl:grid-cols-[175px_minmax(0,1.35fr)_minmax(0,1.1fr)_minmax(0,1.3fr)_130px] xl:items-center">
                    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm">
                        <Icons.Calendar />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Fecha</p>
                        <p className="mt-1 text-xs font-black leading-relaxed text-slate-700">
                          {formatearFecha(item.FechaHora)}
                        </p>
                      </div>
                    </div>

                    <div className="min-w-0">
                      <div className="flex min-w-0 items-start gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-700 shadow-sm">
                          <Icons.User />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-slate-900" title={item.UsuarioEmail || ''}>
                            {item.UsuarioEmail || 'Sistema / Público'}
                          </p>
                          <p className="mt-1 truncate text-xs font-medium text-slate-400" title={item.Roles || ''}>
                            {item.Roles || '-'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="min-w-0 rounded-2xl bg-slate-50 p-4">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wide text-slate-600">
                          {item.Modulo}
                        </span>
                        <span className={getResultadoClass(item.Resultado)}>{item.Resultado}</span>
                      </div>
                      <p className="line-clamp-2 text-sm font-bold leading-relaxed text-slate-800" title={item.Accion}>
                        {item.Accion}
                      </p>
                    </div>

                    <div className="min-w-0">
                      <div className={`rounded-2xl border px-4 py-3 ${getResultadoCardClass(item.Resultado)}`}>
                        <p className="mb-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em]">
                          <Icons.Route />
                          Ruta
                        </p>
                        <p className="line-clamp-2 break-all text-xs font-bold leading-relaxed" title={`${item.MetodoHTTP || '-'} ${item.Ruta || '-'}`}>
                          {item.MetodoHTTP || '-'} {item.Ruta || '-'}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-start xl:justify-end">
                      <button
                        type="button"
                        className="btn btn-sm rounded-xl border-blue-100 bg-blue-50 text-blue-700 hover:border-blue-200 hover:bg-blue-100"
                        onClick={() => setItemSeleccionado(item)}
                      >
                        <Icons.Eye />
                        Ver
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {!loading && data.items.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-6 py-24 text-center">
              <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-white text-slate-300 shadow-sm">
                <Icons.Empty />
              </div>
              <p className="text-lg font-black text-slate-700">No se encontraron eventos</p>
              <p className="mt-2 max-w-sm text-sm font-medium text-slate-400">
                Ajusta los filtros de búsqueda, usuario, módulo, resultado o rango de fechas.
              </p>
              <button
                type="button"
                className="btn btn-sm mt-6 rounded-xl border-blue-100 bg-blue-50 text-blue-700 hover:border-blue-200 hover:bg-blue-100"
                onClick={limpiarFiltros}
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-6 py-4 sm:flex-row">
          <p className="text-xs font-medium text-slate-500">
            Página {data.page} de {Math.max(data.totalPages, 1)}
          </p>

          <div className="join">
            <button
              type="button"
              className="btn btn-sm join-item"
              disabled={filtros.page <= 1}
              onClick={() => actualizarFiltro('page', filtros.page - 1)}
            >
              <Icons.ChevronLeft />
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
              <Icons.ChevronRight />
            </button>
          </div>
        </div>
      </section>

      <AuditoriaDetalleModal item={itemSeleccionado} onClose={() => setItemSeleccionado(null)} />
    </div>
  );
}
