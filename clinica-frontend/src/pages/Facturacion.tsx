import { useFacturacion } from '../hooks/useFacturacion';
import { generarPDFFactura, generarPDFReporteFinanciero } from '../services/pdfGenerator';

export default function Facturacion() {
  // Toda la lógica viene del Hook
  const { facturas, loading, filtros, setFiltro, limpiarFiltros, totales } = useFacturacion();

  // Helpers visuales locales
  const formatearFecha = (fecha: string) => {
     if (!fecha) return "-";
     const fechaPura = fecha.split('T')[0]; 
     const partes = fechaPura.split('-');
     const fechaObj = new Date(parseInt(partes[0]), parseInt(partes[1]) - 1, parseInt(partes[2]));
     return fechaObj.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatearDinero = (m: number) => `C$ ${Number(m).toFixed(2)}`;

  return (
    <div className="p-6 animate-fade-in-up">
      
      {/* ENCABEZADO */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Control Financiero</h1>
          <p className="text-slate-500">Historial de facturación y pagos</p>
        </div>
        <button 
          className="btn btn-outline btn-sm gap-2 hover:bg-slate-800 hover:text-white transition-colors" 
          onClick={() => generarPDFReporteFinanciero(facturas, filtros.fechaInicio, filtros.fechaFin)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Descargar Reporte General
        </button>
      </div>

      {/* TARJETAS DE RESUMEN (Datos vienen de totales) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card bg-emerald-50 border border-emerald-100 shadow-sm">
           <div className="card-body p-6">
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Ingresos (Periodo)</p>
              <h2 className="text-3xl font-bold text-emerald-800">{formatearDinero(totales.ingresos)}</h2>
           </div>
        </div>
        <div className="card bg-white border border-slate-200 shadow-sm">
           <div className="card-body p-6">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Transacciones</p>
              <h2 className="text-3xl font-bold text-slate-700">{totales.transacciones}</h2>
           </div>
        </div>
        <div className="card bg-white border border-slate-200 shadow-sm">
           <div className="card-body p-6">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ticket Promedio</p>
              <h2 className="text-3xl font-bold text-slate-700">
                {formatearDinero(totales.ticketPromedio)}
              </h2>
           </div>
        </div>
      </div>

      {/* BARRA DE FILTROS */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-wrap gap-4 items-end">
         <div className="form-control w-full md:w-auto flex-1">
            <label className="label py-1"><span className="label-text-alt font-bold text-slate-500">Buscar</span></label>
            <input 
              type="text" 
              placeholder="Paciente, Doctor o N° Factura..." 
              className="input input-bordered w-full bg-white" 
              value={filtros.busqueda} 
              onChange={e => setFiltro('busqueda', e.target.value)} 
            />
         </div>
         <div className="form-control">
            <label className="label py-1"><span className="label-text-alt font-bold text-slate-500">Desde</span></label>
            <input 
              type="date" 
              className="input input-bordered bg-white" 
              value={filtros.fechaInicio} 
              onChange={e => setFiltro('fechaInicio', e.target.value)} 
            />
         </div>
         <div className="form-control">
            <label className="label py-1"><span className="label-text-alt font-bold text-slate-500">Hasta</span></label>
            <input 
              type="date" 
              className="input input-bordered bg-white" 
              value={filtros.fechaFin} 
              onChange={e => setFiltro('fechaFin', e.target.value)} 
            />
         </div>
         <button className="btn btn-ghost" onClick={limpiarFiltros}>Limpiar</button>
      </div>

      {/* TABLA DE DATOS */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
              <tr>
                <th className="py-4 pl-6">N° Factura</th>
                <th>Fecha</th>
                <th>Paciente</th>
                <th>Psicólogo</th>
                <th>Servicio / Motivo</th>
                <th>Método Pago</th>
                <th className="text-right pr-6">Monto</th>
                <th className="text-center pr-6">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {!loading && facturas.map((factura) => (
                  <tr key={factura.Cod_Factura} className="hover:bg-slate-50">
                    <td className="pl-6 font-mono text-slate-500">#{factura.Cod_Factura.toString().padStart(5, '0')}</td>
                    <td>{formatearFecha(factura.FechaFactura)}</td>
                    <td><div className="font-bold text-slate-700">{factura.Cita.Paciente.Nombre} {factura.Cita.Paciente.Apellido}</div></td>
                    <td><div className="font-medium text-slate-600">Dr. {factura.Cita.Psicologo.Nombre} {factura.Cita.Psicologo.Apellido}</div></td>
                    <td>
                       <span className="badge badge-outline badge-sm mr-2">{factura.Cita.TipoDeCita?.NombreDeCita || 'Cita'}</span>
                       <span className="text-slate-500 italic">{factura.Cita.MotivoConsulta.substring(0, 20)}...</span>
                    </td>
                    <td>
                      {factura.DetalleFactura.length > 0 ? (
                        <span className="badge badge-ghost font-medium">
                          {factura.DetalleFactura[0].MetodoPago.NombreMetodo}
                        </span>
                      ) : <span className="text-xs text-error">Sin detalle</span>}
                    </td>
                    <td className="text-right pr-6 font-bold text-slate-700">
                      {formatearDinero(factura.MontoTotal)}
                    </td>
                    <td className="text-center pr-6">
                      <button 
                        className="btn btn-ghost btn-xs text-slate-500 hover:text-blue-600 tooltip" 
                        data-tip="Descargar PDF"
                        onClick={() => generarPDFFactura(factura)}
                      >
                        🖨️ PDF
                      </button>
                    </td>
                  </tr>
                ))
              }
              {facturas.length === 0 && (
                 <tr><td colSpan={8} className="text-center py-12 text-slate-400">No se encontraron registros.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}