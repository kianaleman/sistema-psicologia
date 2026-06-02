import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import type { Stats, Cita } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';

// --- ICONOS SVG INLINE (Para elegancia instantánea) ---
const Icons = {
  Calendar: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>,
  Users: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>,
  Doctor: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>,
  Cash: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  TrendingUp: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>
};

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [agendaHoy, setAgendaHoy] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);

  // ESTADOS GRÁFICOS
  const [dataGraficos, setDataGraficos] = useState<any>({ ingresos: [], generos: [], edades: [] });
  const [filtroGrafico, setFiltroGrafico] = useState<'semana' | 'mes' | 'rango'>('mes');
  const [fechasRango, setFechasRango] = useState({ inicio: '', fin: '' });

  useEffect(() => {
    cargarKPIs();
    cargarGraficos(); 
  }, []);

  useEffect(() => {
    if (filtroGrafico === 'rango' && (!fechasRango.inicio || !fechasRango.fin)) return;
    cargarGraficos();
  }, [filtroGrafico, fechasRango]);

  const cargarKPIs = async () => {
    try {
      const statsData = await api.general.stats();
      setStats(statsData);

      const citasData = await api.citas.getAll();
      const hoyStr = new Date().toLocaleDateString('en-CA');
      const programadasHoy = citasData.filter((c: any) => {
        const fechaCitaStr = c.FechaCita.split('T')[0];
        return fechaCitaStr === hoyStr && c.ID_EstadoCita === 1;
      });
      programadasHoy.sort((a: any, b: any) => new Date(a.HoraCita).getTime() - new Date(b.HoraCita).getTime());
      setAgendaHoy(programadasHoy);
      
      setLoading(false);
    } catch (error) { console.error("Error:", error); setLoading(false); }
  };

  const cargarGraficos = async () => {
    let inicio = '';
    let fin = '';
    const hoy = new Date();

    if (filtroGrafico === 'semana') {
      const primerDia = new Date(hoy.setDate(hoy.getDate() - hoy.getDay())); 
      const ultimoDia = new Date(hoy.setDate(hoy.getDate() - hoy.getDay() + 6)); 
      inicio = primerDia.toISOString().split('T')[0];
      fin = ultimoDia.toISOString().split('T')[0];
    } else if (filtroGrafico === 'mes') {
      const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
      inicio = primerDia.toISOString().split('T')[0];
      fin = ultimoDia.toISOString().split('T')[0];
    } else if (filtroGrafico === 'rango') {
      inicio = fechasRango.inicio;
      fin = fechasRango.fin;
    }

    try {
      const data = await api.general.graficos(inicio, fin);
      setDataGraficos(data);
    } catch (error) { console.error(error); }
  };

  const formatearHora = (h: string) => {
    if (!h) return "--:--";
    const fecha = new Date(h);
    // Forzamos UTC para que lea "20:30" tal cual está en la BD
    // en lugar de restarle 6 horas.
    return fecha.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        timeZone: 'UTC' 
    });
  };

  // Tooltip personalizado y elegante para las gráficas
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 text-white p-3 shadow-xl rounded-lg text-xs">
          <p className="font-bold mb-1 opacity-70">{label}</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <p className="font-medium text-lg">C$ {Number(payload[0].value).toLocaleString('en-NI')}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  // --- COMPONENTE: KPI CARD ---
  const KpiCard = ({ title, value, subtitle, icon, color }: any) => (
    <div className="card bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="card-body p-5 flex flex-row items-center justify-between">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{title}</p>
          {loading ? (
            <div className="skeleton h-8 w-24 rounded"></div>
          ) : (
            <h2 className={`text-3xl font-black tracking-tight ${color}`}>{value}</h2>
          )}
          <p className="text-[10px] text-slate-400 mt-1 font-medium">{subtitle}</p>
        </div>
        <div className={`p-3 rounded-xl bg-slate-50 text-slate-600`}>
          {icon}
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-8 animate-fade-in-up max-w-[1600px] mx-auto">
      
      {/* ENCABEZADO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 font-serif">Panel General</h1>
          <p className="text-slate-500 text-sm">Resumen de actividad clínica y financiera</p>
        </div>
        <div className="text-right hidden md:block">
          <p className="text-xs font-bold text-slate-400 uppercase">Fecha Actual</p>
          <p className="text-lg font-medium text-slate-700">
            {new Date().toLocaleDateString('es-NI', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
      </div>
      
      {/* KPI CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <KpiCard 
          title="Citas Hoy" 
          value={agendaHoy.length} 
          subtitle="Citas programadas" 
          icon={<Icons.Calendar />} 
          color="text-blue-600" 
        />
        <KpiCard 
          title="Pacientes Activos" 
          value={stats?.totalPacientes} 
          subtitle="Pacientes registrados" 
          icon={<Icons.Users />} 
          color="text-slate-800" 
        />
        <KpiCard 
          title="Psicólogos" 
          value={stats?.psicologosActivos} 
          subtitle="Personal disponible" 
          icon={<Icons.Doctor />} 
          color="text-slate-800" 
        />
        <KpiCard 
          title="Ingresos Totales" 
          value={`C$ ${Number(stats?.ingresosTotales).toLocaleString('en-NI', { compactDisplay: "short", maximumFractionDigits: 0 })}`} 
          subtitle="Facturado en total" 
          icon={<Icons.Cash />} 
          color="text-emerald-600" 
        />
      </div>

      {/* SECCIÓN PRINCIPAL: GRÁFICOS Y AGENDA */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* COLUMNA IZQUIERDA: GRÁFICOS (2/3 ancho) */}
        <div className="xl:col-span-2 space-y-8">
          
          {/* GRÁFICO DE INGRESOS */}
          <div className="card bg-white border border-slate-100 shadow-sm">
            <div className="card-body p-6">
              <div className="flex flex-wrap justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><Icons.TrendingUp /></div>
                    <h3 className="font-bold text-lg text-slate-800">Ingresos Financieros</h3>
                </div>
                
                <div className="join bg-slate-100 p-1 rounded-lg">
                  {['semana', 'mes', 'rango'].map((f) => (
                    <button 
                        key={f}
                        className={`join-item btn btn-xs border-none capitalize px-4 ${filtroGrafico === f ? 'bg-white shadow text-slate-900' : 'bg-transparent text-slate-500 hover:bg-slate-200'}`} 
                        onClick={() => setFiltroGrafico(f as any)}
                    >
                        {f}
                    </button>
                  ))}
                </div>
              </div>
              
              {filtroGrafico === 'rango' && (
                <div className="flex justify-end mb-4 animate-fade-in">
                  <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                     <input type="date" className="input input-xs bg-transparent font-medium text-slate-600 focus:outline-none" value={fechasRango.inicio} onChange={e => setFechasRango({...fechasRango, inicio: e.target.value})} />
                     <span className="text-slate-300">➔</span>
                     <input type="date" className="input input-xs bg-transparent font-medium text-slate-600 focus:outline-none" value={fechasRango.fin} onChange={e => setFechasRango({...fechasRango, fin: e.target.value})} />
                  </div>
                </div>
              )}

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dataGraficos.ingresos} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="fecha" tick={{fontSize: 11, fill: '#94a3b8'}} axisLine={false} tickLine={false} dy={10} />
                    <YAxis tick={{fontSize: 11, fill: '#94a3b8'}} axisLine={false} tickLine={false} tickFormatter={(value) => `C$${value}`} />
                    <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}} />
                    <Bar dataKey="monto" fill="#10b981" radius={[6, 6, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* DATOS DEMOGRÁFICOS (Split interno) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* DONA GÉNERO */}
             <div className="card bg-white border border-slate-100 shadow-sm">
                <div className="card-body p-6">
                    <h3 className="font-bold text-sm text-slate-500 uppercase tracking-wider mb-4">Género Pacientes</h3>
                    <div className="h-48 w-full relative">
                       <ResponsiveContainer width="100%" height="100%">
                         <PieChart>
                           <Pie data={dataGraficos.generos} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                             {dataGraficos.generos.map((entry: any, index: number) => (<Cell key={`cell-${index}`} fill={entry.fill} stroke="none" />))}
                           </Pie>
                           <Tooltip />
                           <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" iconSize={8} wrapperStyle={{fontSize: '12px'}} />
                         </PieChart>
                       </ResponsiveContainer>
                       {/* Centro de la Dona */}
                       <div className="absolute top-1/2 left-1/2 transform -translate-x-13 -translate-y-1/2 text-center">
                         <span className="text-2xl font-bold text-slate-700 block">{stats?.totalPacientes}</span>
                       </div>
                    </div>
                </div>
             </div>

             {/* BARRAS EDAD */}
             <div className="card bg-white border border-slate-100 shadow-sm">
                <div className="card-body p-6">
                    <h3 className="font-bold text-sm text-slate-500 uppercase tracking-wider mb-6">Rangos de Edad</h3>
                    <div className="space-y-4">
                       {dataGraficos.edades.map((edad: any) => {
                           const porcentaje = (edad.value / (stats?.totalPacientes || 1)) * 100;
                           return (
                               <div key={edad.name}>
                                   <div className="flex justify-between text-xs mb-1">
                                       <span className="font-medium text-slate-600">{edad.name}</span>
                                       <span className="font-bold text-slate-800">{edad.value} ({porcentaje.toFixed(0)}%)</span>
                                   </div>
                                   <div className="w-full bg-slate-100 rounded-full h-2">
                                       <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${porcentaje}%`, backgroundColor: edad.fill }}></div>
                                   </div>
                               </div>
                           )
                       })}
                    </div>
                </div>
             </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: AGENDA HOY (1/3 ancho) */}
        <div className="card bg-white border border-slate-100 shadow-sm h-fit">
          <div className="card-body p-0">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                    Agenda del Día
                </h2>
                <Link to="/citas" className="text-xs font-bold text-blue-600 hover:text-blue-800">Ver todo</Link>
            </div>
            
            <div className="max-h-[800px] overflow-y-auto">
               {loading ? (
                   <div className="p-8 text-center"><span className="loading loading-spinner text-blue-500"></span></div>
               ) : agendaHoy.length > 0 ? (
                   <ul className="divide-y divide-slate-50">
                       {agendaHoy.map((cita) => (
                           <li key={cita.ID_Cita} className="p-4 hover:bg-slate-50 transition-colors group">
                               <div className="flex gap-4">
                                   {/* Columna Hora */}
                                   <div className="flex flex-col items-center justify-start pt-1">
                                       <span className="text-sm font-bold text-slate-800">{formatearHora(cita.HoraCita)}</span>
                                       <div className="h-full w-px bg-slate-200 mt-2 group-last:hidden"></div>
                                   </div>
                                   
                                   {/* Columna Info */}
                                   <div className="flex-1">
                                       <div className="flex justify-between items-start">
                                           <h4 className="font-bold text-slate-700 text-sm">{cita.Paciente?.Nombre || 'Paciente'} {cita.Paciente?.Apellido || ''}</h4>
                                           <span className="badge badge-xs badge-ghost text-[10px] font-bold uppercase tracking-wide">{cita.TipoDeCita?.Nombre_DeCita || 'N/A'}</span>
                                       </div>
                                       <p className="text-xs text-slate-500 mt-0.5">Dr. {cita.Psicologo?.Apellido || 'N/A'}</p>
                                       
                                       {cita.MotivoConsulta && (
                                           <p className="text-xs text-slate-400 italic mt-2 line-clamp-1 bg-slate-50 p-1.5 rounded">
                                               "{cita.MotivoConsulta}"
                                           </p>
                                       )}
                                       
                                       <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                           {cita.Paciente?.ID_Paciente ? (
                                               <Link to={`/pacientes/${cita.Paciente.ID_Paciente}`} className="btn btn-xs btn-outline w-full">
                                                   Ver Expediente
                                               </Link>
                                           ) : (
                                               <button type="button" className="btn btn-xs btn-outline w-full" disabled>
                                                   Ver Expediente
                                               </button>
                                           )}
                                       </div>
                                   </div>
                               </div>
                           </li>
                       ))}
                   </ul>
               ) : (
                   <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                       <div className="bg-slate-50 p-4 rounded-full mb-3">
                           <Icons.Calendar />
                       </div>
                       <p className="text-sm font-medium text-slate-500">No hay citas para hoy</p>
                       <p className="text-xs text-slate-400 mt-1">¡Disfruta el tiempo libre!</p>
                   </div>
               )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}