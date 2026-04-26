import { useFacturacion } from '../hooks/useFacturacion';
import { generarPDFRecibo, generarPDFReporteFinanciero } from '../services/pdfGenerator';
// 🟢 CORRECCIÓN: Importación de tipos sincronizada con index.ts
import type { Recibo } from "../types";

// Iconos SVG Inline para diseño consistente
const Icons = {
  Printer: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" /></svg>,
  DocumentReport: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>,
  Search: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>,
  TrendingUp: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>,
  Receipt: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" /></svg>
};

export default function Facturacion() {
  const { facturas, loading, filtros, setFiltro, limpiarFiltros, totales } = useFacturacion();

  // Helpers visuales
  const formatearFecha = (fecha: string) => {
    if (!fecha) return "-";
    const fechaObj = new Date(fecha);
    return fechaObj.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
  };

  const formatearDinero = (m: number, iso: string = 'NIO') => {
    const symbol = iso === 'USD' ? '$' : 'C$';
    return `${symbol} ${Number(m).toLocaleString('en-NI', { minimumFractionDigits: 2 })}`;
  };

  return (
    <div className="p-8 animate-fade-in-up max-w-7xl mx-auto">
      
      {/* ENCABEZADO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight font-serif">Control Financiero</h1>
          <p className="text-slate-500 mt-1 text-sm">Historial de facturación bimoneda (Nicaragua)</p>
        </div>
        <button 
          className="btn btn-outline gap-2 rounded-xl border-slate-300 text-slate-600 hover:bg-slate-800 hover:text-white transition-all shadow-sm" 
          onClick={() => generarPDFReporteFinanciero(facturas, filtros.fechaInicio, filtros.fechaFin)}
        >
          <Icons.DocumentReport /> Descargar Reporte
        </button>
      </div>

      {/* KPIs DE INGRESOS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card bg-emerald-50 border border-emerald-100 p-5 shadow-sm">
            <p className="text-[10px] font-bold uppercase text-emerald-600 tracking-widest">Ingresos (NIO)</p>
            <h2 className="text-2xl font-black text-emerald-800">{formatearDinero(totales.ingresosNIO, 'NIO')}</h2>
        </div>
        <div className="card bg-blue-50 border border-blue-100 p-5 shadow-sm">
            <p className="text-[10px] font-bold uppercase text-blue-600 tracking-widest">Ingresos (USD)</p>
            <h2 className="text-2xl font-black text-blue-800">{formatearDinero(totales.ingresosUSD, 'USD')}</h2>
        </div>
        <div className="card bg-white border border-slate-200 p-5 shadow-sm">
            <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Transacciones</p>
            <h2 className="text-2xl font-black text-slate-700">{totales.transacciones}</h2>
        </div>
      </div>

      {/* BARRA DE FILTROS */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 mb-8">
         <div className="flex flex-col lg:flex-row gap-6 items-end">
             <div className="form-control flex-1 w-full">
                <label className="label pt-0 pb-1 text-xs font-bold text-slate-500 uppercase">Buscar</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400"><Icons.Search /></div>
                    <input 
                      type="text" 
                      placeholder="Paciente, Doctor o N° Recibo..." 
                      className="input input-bordered w-full pl-10 bg-slate-50 focus:bg-white" 
                      value={filtros.busqueda} 
                      onChange={e => setFiltro('busqueda', e.target.value)} 
                    />
                </div>
             </div>
             <div className="flex gap-4">
                <input type="date" className="input input-bordered input-sm bg-slate-50" value={filtros.fechaInicio} onChange={e => setFiltro('fechaInicio', e.target.value)} />
                <input type="date" className="input input-bordered input-sm bg-slate-50" value={filtros.fechaFin} onChange={e => setFiltro('fechaFin', e.target.value)} />
             </div>
             <button className="btn btn-ghost text-slate-400" onClick={limpiarFiltros}>Limpiar</button>
         </div>
      </div>

      {/* TABLA DE RECIBOS */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="py-4 pl-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">N° Recibo</th>
                <th className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Fecha</th>
                <th className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Paciente</th>
                <th className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pago</th>
                <th className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Monto</th>
                <th className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!loading && facturas.map((recibo: Recibo) => (
                <tr key={recibo.Cod_Recibo} className="hover:bg-slate-50 transition-colors">
                  <td className="pl-6 py-4 whitespace-nowrap">
                    <span className="font-mono text-slate-500 font-medium bg-slate-100 px-2 py-1 rounded text-xs">
                      #{recibo.Cod_Recibo.toString().padStart(5, '0')}
                    </span>
                  </td>
                  <td className="py-4 text-sm text-slate-600 font-medium">
                    {formatearFecha(recibo.FechaRecibo)}
                  </td>
                  <td className="py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800 text-sm">
                        {recibo.Cita?.Paciente?.Nombre} {recibo.Cita?.Paciente?.Apellido}
                      </span>
                      <span className="text-[10px] text-slate-400 uppercase">
                        Dr. {recibo.Cita?.Psicologo?.Apellido}
                      </span>
                    </div>
                  </td>
                  <td className="py-4">
                    {recibo.MetodoPago ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100 uppercase">
                        {recibo.MetodoPago.NombreMetodo}
                      </span>
                    ) : <span className="text-xs text-slate-300 italic">---</span>}
                  </td>
                  <td className="py-4 text-right pr-6">
                    <span className={`font-black text-sm ${recibo.ID_Divisa === 2 ? 'text-blue-600' : 'text-emerald-600'}`}>
                      {recibo.Divisa?.Codigo_ISO || (recibo.ID_Divisa === 2 ? 'USD' : 'NIO')} {recibo.MontoTotal.toLocaleString('en-NI', { minimumFractionDigits: 2 })}
                    </span>
                  </td>
                  <td className="py-4 text-center pr-6">
                    <button 
                      className="btn btn-sm btn-ghost text-slate-400 hover:text-blue-600 tooltip" 
                      data-tip="Imprimir Recibo" 
                      onClick={() => generarPDFRecibo(recibo)}
                    >
                      <Icons.Printer />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && facturas.length === 0 && (
              <div className="py-20 text-center text-slate-400 italic">No hay registros para mostrar.</div>
          )}
        </div>
      </div>
    </div>
  );
}