import type { ReactNode } from 'react';
import { useFacturacion, type ReciboFacturacion } from '../hooks/useFacturacion';
import { generarPDFFactura, generarPDFReporteFinanciero } from '../services/pdfGenerator';

const Icons = {
  Printer: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5V3.75h10.5V7.5M6.75 17.25H5.25A2.25 2.25 0 013 15V10.5A2.25 2.25 0 015.25 8.25h13.5A2.25 2.25 0 0121 10.5V15a2.25 2.25 0 01-2.25 2.25h-1.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25h9v6H7.5z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.75 16.5h6.5M8.75 18.25h4.25" />
    </svg>
  ),
  DocumentReport: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3.75h6L19.5 9.75v10.5H7.5A3 3 0 014.5 17.25V6.75A3 3 0 017.5 3.75z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 3.75V9.75h6M8.25 15.75v-3M12 15.75v-5.25M15.75 15.75v-2.25" />
    </svg>
  ),
  Search: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197M15.803 15.803A7.5 7.5 0 105.197 5.197a7.5 7.5 0 0010.606 10.606z" />
    </svg>
  ),
  TrendingUp: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-6 w-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 16.5l5.25-5.25 3.75 3.75 7.5-7.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 7.5h4.5V12" />
    </svg>
  ),
  Receipt: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-6 w-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3.75h10.5v16.5l-2.25-1.5-2.25 1.5-2.25-1.5-2.25 1.5-2.25-1.5v-15z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25h6M9 12h6M9 15.75h3.75" />
    </svg>
  ),
  CreditCard: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-6 w-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 7.5h16.5M3.75 10.5h16.5M6.75 15h4.5M6.75 17.25h2.25" />
      <rect x="3.75" y="5.25" width="16.5" height="13.5" rx="2.25" />
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
  Doctor: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-5 w-5">
      <circle cx="12" cy="7.5" r="3.75" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 20.25a7.5 7.5 0 0115 0" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5v3M10.5 18h3" />
    </svg>
  ),
  Wallet: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 7.5A2.25 2.25 0 016.75 5.25h10.5A2.25 2.25 0 0119.5 7.5v1.125H16.5a3.375 3.375 0 000 6.75h3V16.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 16.5v-9z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 8.625h3.75v6.75H16.5a3.375 3.375 0 010-6.75z" />
    </svg>
  ),
  EmptyMoney: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" className="h-12 w-12">
      <circle cx="12" cy="12" r="8.25" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5v9M9.75 14.25c.6.75 1.35 1.125 2.25 1.125 1.24 0 2.25-.756 2.25-1.688 0-.932-1.01-1.687-2.25-1.687s-2.25-.756-2.25-1.688c0-.932 1.01-1.687 2.25-1.687.9 0 1.65.375 2.25 1.125" />
    </svg>
  ),
};

type KpiCardProps = {
  title: string;
  value: string | number;
  subtitle: string;
  icon: ReactNode;
  colorClass: string;
  bgClass: string;
};

const KpiCard = ({ title, value, subtitle, icon, colorClass, bgClass }: KpiCardProps) => (
  <div className={`relative overflow-hidden rounded-3xl border p-5 shadow-sm ${bgClass} ${colorClass}`}>
    <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/50"></div>

    <div className="relative z-10 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-75">{title}</p>
        <h2 className="mt-2 truncate text-3xl font-black tracking-tight">{value}</h2>
        <p className="mt-1 text-xs font-medium opacity-70">{subtitle}</p>
      </div>

      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/70 shadow-sm">
        {icon}
      </div>
    </div>
  </div>
);

function formatearFecha(fecha?: string | null) {
  if (!fecha) return '-';

  const fechaPura = fecha.toString().split('T')[0];
  const partes = fechaPura.split('-');

  if (partes.length !== 3) return '-';

  const fechaObj = new Date(
    Number(partes[0]),
    Number(partes[1]) - 1,
    Number(partes[2])
  );

  if (Number.isNaN(fechaObj.getTime())) return '-';

  return fechaObj.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatearDinero(monto?: number | string | null) {
  return `C$ ${Number(monto || 0).toFixed(2)}`;
}

function formatearNumeroRecibo(codRecibo: number) {
  return `#${codRecibo.toString().padStart(5, '0')}`;
}

function obtenerPaciente(factura: ReciboFacturacion) {
  const paciente = factura.Cita?.Paciente;

  if (!paciente) return 'Paciente no disponible';

  return `${paciente.Nombre || ''} ${paciente.Apellido || ''}`.trim() || 'Paciente no disponible';
}

function obtenerPsicologo(factura: ReciboFacturacion) {
  const psicologo = factura.Cita?.Psicologo;

  if (!psicologo) return 'Psicólogo no disponible';

  return `Dr. ${`${psicologo.Nombre || ''} ${psicologo.Apellido || ''}`.trim()}`;
}

function obtenerServicio(factura: ReciboFacturacion) {
  return factura.Cita?.TipoDeCita?.Nombre_DeCita || 'Cita';
}

function obtenerFechaFactura(factura: ReciboFacturacion) {
  return factura.FechaDePago || factura.FechaRecibo;
}

function obtenerMetodoPago(factura: ReciboFacturacion) {
  return factura.MetodoPago?.Nombre_Metodo || 'Sin método';
}

export default function Facturacion() {
  const { facturas, loading, filtros, setFiltro, limpiarFiltros, totales } = useFacturacion();

  return (
    <div className="mx-auto max-w-[1700px] animate-fade-in-up space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-slate-950 px-6 py-7 text-white shadow-2xl shadow-slate-200/80 sm:px-8">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-500/25 blur-3xl"></div>
        <div className="absolute -bottom-28 left-14 h-72 w-72 rounded-full bg-blue-400/15 blur-3xl"></div>

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-emerald-300">
              Gestión financiera
            </p>
            <h1 className="mt-2 font-serif text-3xl font-black tracking-tight sm:text-4xl">
              Control Financiero
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
              Historial de recibos, métodos de pago, referencias bancarias y reportes de ingresos.
            </p>
          </div>

          <button
            type="button"
            className="btn min-h-12 rounded-2xl border-white/10 bg-white px-6 text-slate-950 shadow-xl hover:border-white hover:bg-slate-100"
            onClick={() => generarPDFReporteFinanciero(facturas, filtros.fechaInicio, filtros.fechaFin)}
          >
            <Icons.DocumentReport />
            Descargar reporte
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <KpiCard
          title="Ingresos periodo"
          value={formatearDinero(totales.ingresos)}
          subtitle="Suma de recibos filtrados"
          icon={<Icons.TrendingUp />}
          bgClass="border-emerald-100 bg-emerald-50"
          colorClass="text-emerald-800"
        />

        <KpiCard
          title="Transacciones"
          value={totales.transacciones}
          subtitle="Recibos en el periodo"
          icon={<Icons.Receipt />}
          bgClass="border-white/80 bg-white"
          colorClass="text-slate-800"
        />

        <KpiCard
          title="Ticket promedio"
          value={formatearDinero(totales.ticketPromedio)}
          subtitle="Promedio por recibo"
          icon={<Icons.CreditCard />}
          bgClass="border-blue-100 bg-blue-50"
          colorClass="text-blue-800"
        />
      </section>

      <section className="rounded-[2rem] border border-white/80 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <div className="xl:col-span-6">
            <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-400">
              <Icons.Search />
              Búsqueda
            </div>

            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                <Icons.Search />
              </div>
              <input
                type="text"
                placeholder="Paciente, doctor, recibo, método, banco o referencia..."
                className="input input-bordered h-12 w-full rounded-2xl bg-slate-50 pl-11 text-sm font-medium transition-colors focus:bg-white"
                value={filtros.busqueda}
                onChange={(event) => setFiltro('busqueda', event.target.value)}
              />
            </div>
          </div>

          <div className="xl:col-span-6">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                <Icons.Calendar />
                Rango de fechas
              </div>

              {(filtros.busqueda || filtros.fechaInicio || filtros.fechaFin) && (
                <button
                  type="button"
                  className="text-xs font-bold text-blue-600 transition-colors hover:text-blue-800"
                  onClick={limpiarFiltros}
                >
                  Limpiar filtros
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto]">
              <input
                type="date"
                className="input input-bordered h-12 rounded-2xl bg-slate-50 text-sm font-medium transition-colors focus:bg-white"
                value={filtros.fechaInicio}
                onChange={(event) => setFiltro('fechaInicio', event.target.value)}
              />

              <input
                type="date"
                className="input input-bordered h-12 rounded-2xl bg-slate-50 text-sm font-medium transition-colors focus:bg-white"
                value={filtros.fechaFin}
                onChange={(event) => setFiltro('fechaFin', event.target.value)}
              />

              <button
                type="button"
                className="btn h-12 rounded-2xl border-slate-200 bg-white px-5 text-slate-600 hover:bg-slate-50"
                onClick={limpiarFiltros}
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/80 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-600">Recibos</p>
              <h2 className="mt-1 text-2xl font-black text-slate-900">Historial de facturación</h2>
            </div>
            <p className="text-sm font-medium text-slate-400">
              {facturas.length} resultado(s)
            </p>
          </div>
        </div>

        <div className="p-5">
          {loading && (
            <div className="rounded-[1.5rem] border border-slate-100 bg-slate-50 py-24 text-center">
              <span className="loading loading-spinner loading-lg text-primary"></span>
              <p className="mt-4 animate-pulse text-sm text-slate-400">Cargando recibos...</p>
            </div>
          )}

          {!loading && facturas.length > 0 && (
            <div className="space-y-4">
              {facturas.map((factura) => {
                const paciente = obtenerPaciente(factura);
                const psicologo = obtenerPsicologo(factura);
                const servicio = obtenerServicio(factura);
                const metodoPago = obtenerMetodoPago(factura);
                const motivoConsulta = factura.Cita?.MotivoConsulta || 'Sin motivo registrado';

                return (
                  <article
                    key={factura.Cod_Recibo}
                    className="group overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-100 hover:shadow-xl hover:shadow-slate-200/70"
                  >
                    <div className="grid grid-cols-1 gap-5 p-5 xl:grid-cols-[150px_minmax(0,1.3fr)_minmax(0,1.35fr)_minmax(0,1fr)_170px_120px] xl:items-center">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Recibo</p>
                        <p className="mt-1 font-mono text-sm font-black text-slate-800">
                          {formatearNumeroRecibo(factura.Cod_Recibo)}
                        </p>
                        <p className="mt-1 text-xs font-medium text-slate-500">
                          {formatearFecha(obtenerFechaFactura(factura))}
                        </p>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-700 shadow-sm">
                            <Icons.User />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-lg font-black leading-tight text-slate-950 transition-colors group-hover:text-blue-700" title={paciente}>
                              {paciente}
                            </p>
                            <div className="mt-2 flex min-w-0 items-center gap-2 text-xs font-medium text-slate-400">
                              <Icons.Doctor />
                              <span className="truncate" title={psicologo}>
                                {psicologo}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="min-w-0 rounded-2xl bg-slate-50 p-4">
                        <p className="mb-2 w-fit max-w-full truncate rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wide text-slate-600">
                          {servicio}
                        </p>
                        <p className="line-clamp-2 text-sm font-medium leading-relaxed text-slate-600" title={motivoConsulta}>
                          {motivoConsulta}
                        </p>
                      </div>

                      <div className="min-w-0">
                        <div className="rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3">
                          <p className="mb-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-blue-700">
                            <Icons.Wallet />
                            Método
                          </p>
                          <p className="truncate text-sm font-black text-blue-900" title={metodoPago}>
                            {metodoPago}
                          </p>

                          {factura.Banco?.Nombre_Banco && (
                            <p className="mt-1 truncate text-xs font-medium text-blue-700/70" title={factura.Banco.Nombre_Banco}>
                              {factura.Banco.Nombre_Banco}
                            </p>
                          )}

                          {factura.Numero_Referencia && (
                            <p className="mt-1 truncate text-xs font-medium text-blue-700/70" title={factura.Numero_Referencia}>
                              Ref: {factura.Numero_Referencia}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-left xl:text-right">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Monto</p>
                        <p className="mt-1 font-mono text-xl font-black text-emerald-600">
                          {formatearDinero(factura.MontoTotal)}
                        </p>
                      </div>

                      <div className="flex justify-start xl:justify-end">
                        <button
                          type="button"
                          className="btn btn-sm rounded-xl border-emerald-100 bg-emerald-50 text-emerald-700 hover:border-emerald-200 hover:bg-emerald-100"
                          onClick={() => generarPDFFactura(factura)}
                        >
                          <Icons.Printer />
                          Imprimir
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {!loading && facturas.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-6 py-24 text-center">
              <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-white text-slate-300 shadow-sm">
                <Icons.EmptyMoney />
              </div>
              <p className="text-lg font-black text-slate-700">No se encontraron recibos</p>
              <p className="mt-2 max-w-sm text-sm font-medium text-slate-400">
                Intenta cambiar el rango de fechas, ajustar la búsqueda o limpiar los filtros.
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
      </section>
    </div>
  );
}
