import type { ReactNode } from 'react';
import { useFacturacion, type ReciboFacturacion } from '../hooks/useFacturacion';
import { generarPDFFactura, generarPDFReporteFinanciero } from '../services/pdfGenerator';

// Iconos SVG Inline para diseno consistente
const Icons = {
  Printer: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" /></svg>,
  DocumentReport: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>,
  Search: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>,
  TrendingUp: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>,
  Receipt: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" /></svg>,
  CreditCard: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" /></svg>,
  EmptyMoney: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mb-2 opacity-50"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
};

type KpiCardProps = {
  title: string;
  value: string | number;
  icon: ReactNode;
  colorClass: string;
  bgClass: string;
};

const KpiCard = ({ title, value, icon, colorClass, bgClass }: KpiCardProps) => (
  <div className={`card border shadow-sm ${bgClass} ${colorClass}`}>
    <div className="card-body p-5 flex flex-row items-center justify-between">
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-wider opacity-80 truncate">{title}</p>
        <h2 className="text-3xl font-bold mt-1 truncate">{value}</h2>
      </div>
      <div className="p-3 bg-white/50 rounded-xl backdrop-blur-sm shrink-0">
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
    <div className="w-full max-w-full min-w-0 px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up overflow-x-hidden">

      {/* ENCABEZADO */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4 mb-8 min-w-0">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight font-serif">
            Control Financiero
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Historial de facturación y control de ingresos
          </p>
        </div>

        <button
          type="button"
          className="btn btn-outline gap-2 rounded-xl border-slate-300 text-slate-600 hover:bg-slate-800 hover:text-white hover:border-slate-800 transition-all shadow-sm w-full sm:w-auto shrink-0"
          onClick={() => generarPDFReporteFinanciero(facturas, filtros.fechaInicio, filtros.fechaFin)}
        >
          <Icons.DocumentReport />
          Descargar Reporte
        </button>
      </div>

      {/* TARJETAS DE RESUMEN */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8 min-w-0">
        <KpiCard
          title="Ingresos (Periodo)"
          value={formatearDinero(totales.ingresos)}
          icon={<Icons.TrendingUp />}
          bgClass="bg-emerald-50 border-emerald-100"
          colorClass="text-emerald-800"
        />

        <KpiCard
          title="Transacciones"
          value={totales.transacciones}
          icon={<Icons.Receipt />}
          bgClass="bg-white border-slate-200"
          colorClass="text-slate-700"
        />

        <KpiCard
          title="Ticket promedio"
          value={formatearDinero(totales.ticketPromedio)}
          icon={<Icons.CreditCard />}
          bgClass="bg-blue-50 border-blue-100"
          colorClass="text-blue-800"
        />
      </div>

      {/* BARRA DE FILTROS */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 mb-8 w-full max-w-full min-w-0 overflow-hidden">
        <div className="flex flex-col xl:flex-row gap-5 xl:items-end min-w-0">

          <div className="form-control flex-1 w-full min-w-0">
            <label className="label pt-0 pb-1">
              <span className="label-text font-bold text-slate-500 text-xs uppercase">Buscar</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><Icons.Search /></div>
              <input
                type="text"
                placeholder="Paciente, doctor, recibo, método, banco o referencia..."
                className="input input-bordered w-full pl-10 bg-slate-50 focus:bg-white transition-colors"
                value={filtros.busqueda}
                onChange={(event) => setFiltro('busqueda', event.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full xl:w-auto">
            <div className="form-control w-full xl:w-44">
              <label className="label pt-0 pb-1">
                <span className="label-text font-bold text-slate-500 text-xs uppercase">Desde</span>
              </label>
              <input
                type="date"
                className="input input-bordered bg-slate-50 focus:bg-white transition-colors w-full"
                value={filtros.fechaInicio}
                onChange={(event) => setFiltro('fechaInicio', event.target.value)}
              />
            </div>

            <div className="form-control w-full xl:w-44">
              <label className="label pt-0 pb-1">
                <span className="label-text font-bold text-slate-500 text-xs uppercase">Hasta</span>
              </label>
              <input
                type="date"
                className="input input-bordered bg-slate-50 focus:bg-white transition-colors w-full"
                value={filtros.fechaFin}
                onChange={(event) => setFiltro('fechaFin', event.target.value)}
              />
            </div>
          </div>

          <button
            type="button"
            className="btn btn-ghost text-slate-400 hover:text-red-500 w-full xl:w-auto shrink-0"
            onClick={limpiarFiltros}
            title="Limpiar filtros"
          >
            Limpiar
          </button>
        </div>
      </div>

      {/* TABLA DE DATOS */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden w-full max-w-full min-w-0">
        <div className="w-full max-w-full overflow-x-auto">
          <table className="table table-fixed w-full min-w-[980px]">
            <colgroup>
              <col className="w-[120px]" />
              <col className="w-[120px]" />
              <col className="w-[230px]" />
              <col className="w-[220px]" />
              <col className="w-[160px]" />
              <col className="w-[130px]" />
              <col className="w-[90px]" />
            </colgroup>

            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="py-4 pl-6 text-xs font-bold text-slate-500 uppercase tracking-wider">N° Recibo</th>
                <th className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha</th>
                <th className="text-xs font-bold text-slate-500 uppercase tracking-wider">Paciente</th>
                <th className="text-xs font-bold text-slate-500 uppercase tracking-wider">Servicio</th>
                <th className="text-xs font-bold text-slate-500 uppercase tracking-wider">Método Pago</th>
                <th className="text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Monto</th>
                <th className="text-xs font-bold text-slate-500 uppercase tracking-wider text-center pr-6">Acciones</th>
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

              {!loading && facturas.map((factura) => {
                const paciente = obtenerPaciente(factura);
                const psicologo = obtenerPsicologo(factura);
                const servicio = obtenerServicio(factura);
                const metodoPago = obtenerMetodoPago(factura);
                const motivoConsulta = factura.Cita?.MotivoConsulta || 'Sin motivo registrado';

                return (
                  <tr key={factura.Cod_Recibo} className="hover:bg-slate-50 transition-colors align-top">

                    <td className="pl-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-slate-500 font-medium bg-slate-100 px-2 py-1 rounded text-xs">
                        {formatearNumeroRecibo(factura.Cod_Recibo)}
                      </span>
                    </td>

                    <td className="py-4 text-sm text-slate-600 font-medium whitespace-nowrap">
                      {formatearFecha(obtenerFechaFactura(factura))}
                    </td>

                    <td className="py-4">
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-slate-800 text-sm truncate" title={paciente}>
                          {paciente}
                        </span>
                        <span className="text-xs text-slate-400 truncate" title={psicologo}>
                          {psicologo}
                        </span>
                      </div>
                    </td>

                    <td className="py-4">
                      <div className="flex flex-col gap-1 min-w-0">
                        <span className="badge badge-sm badge-outline text-slate-600 border-slate-300 bg-white font-medium w-fit max-w-full truncate">
                          {servicio}
                        </span>
                        <span className="text-xs text-slate-400 italic truncate" title={motivoConsulta}>
                          {motivoConsulta}
                        </span>
                      </div>
                    </td>

                    <td className="py-4">
                      <div className="flex flex-col gap-1 min-w-0">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100 w-fit max-w-full truncate" title={metodoPago}>
                          {metodoPago}
                        </span>

                        {factura.Banco?.Nombre_Banco && (
                          <span className="text-[11px] text-slate-400 truncate" title={factura.Banco.Nombre_Banco}>
                            {factura.Banco.Nombre_Banco}
                          </span>
                        )}

                        {factura.Numero_Referencia && (
                          <span className="text-[11px] text-slate-400 truncate" title={factura.Numero_Referencia}>
                            Ref: {factura.Numero_Referencia}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-4 text-right">
                      <span className="font-bold text-emerald-600 text-base font-mono">
                        {formatearDinero(factura.MontoTotal)}
                      </span>
                    </td>

                    <td className="py-4 text-center pr-6">
                      <button
                        type="button"
                        className="btn btn-sm btn-ghost text-slate-400 hover:text-blue-600 hover:bg-blue-50 tooltip"
                        data-tip="Imprimir Recibo"
                        onClick={() => generarPDFFactura(factura)}
                      >
                        <Icons.Printer />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {!loading && facturas.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-20">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Icons.EmptyMoney />
                      <p className="text-lg font-medium text-slate-600">No se encontraron recibos</p>
                      <p className="text-sm mt-1">Intenta cambiar el rango de fechas o limpiar los filtros</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
