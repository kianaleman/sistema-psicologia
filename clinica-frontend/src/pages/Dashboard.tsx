import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import type { Stats, Cita } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [agendaHoy, setAgendaHoy] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);

  // ESTADOS PARA GRÁFICOS
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
    return `${fecha.getUTCHours().toString().padStart(2, '0')}:${fecha.getUTCMinutes().toString().padStart(2, '0')}`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-slate-200 shadow-xl rounded-lg text-sm">
          <p className="font-bold text-slate-700 mb-1">{label}</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <p className="text-emerald-600 font-medium">Ingreso: C$ {Number(payload[0].value).toFixed(2)}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 animate-fade-in-up">
      <h1 className="text-3xl font-bold text-slate-800 mb-6">Dashboard</h1>
      
      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <div className="card bg-white border border-slate-200 shadow-sm"><div className="card-body p-6"><p className="text-sm font-medium text-slate-500 uppercase">Citas para Hoy</p>{loading ? <div className="skeleton h-10 w-1/2 mt-1"></div> : <h2 className="text-4xl font-bold text-blue-600 mt-1">{agendaHoy.length}</h2>}<div className="mt-4 text-xs text-slate-400">Pacientes agendados</div></div></div>
        <div className="card bg-white border border-slate-200 shadow-sm"><div className="card-body p-6"><p className="text-sm font-medium text-slate-500 uppercase">Pacientes Activos</p>{loading ? <div className="skeleton h-10 w-1/2 mt-1"></div> : <h2 className="text-4xl font-bold text-slate-800 mt-1">{stats?.totalPacientes}</h2>}<div className="mt-4 text-xs text-slate-400">Total expedientes</div></div></div>
        <div className="card bg-white border border-slate-200 shadow-sm"><div className="card-body p-6"><p className="text-sm font-medium text-slate-500 uppercase">Psicólogos</p>{loading ? <div className="skeleton h-10 w-1/2 mt-1"></div> : <h2 className="text-4xl font-bold text-slate-800 mt-1">{stats?.psicologosActivos}</h2>}<div className="mt-4 text-xs text-slate-400">En turno</div></div></div>
        <div className="card bg-white border border-slate-200 shadow-sm"><div className="card-body p-6"><p className="text-sm font-medium text-slate-500 uppercase">Ingresos Totales</p>{loading ? <div className="skeleton h-10 w-1/2 mt-1"></div> : <h2 className="text-4xl font-bold text-emerald-600 mt-1">C$ {Number(stats?.ingresosTotales).toFixed(2)}</h2>}<div className="mt-4 text-xs text-slate-400">Histórico</div></div></div>
      </div>

      {/* GRÁFICOS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* GRÁFICO DE INGRESOS */}
        <div className="lg:col-span-2 card bg-white border border-slate-200 shadow-sm">
          <div className="card-body p-6">
            <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
              <h3 className="font-bold text-lg text-slate-700">Tendencia de Ingresos</h3>
              
              <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-100">
                <button className={`btn btn-xs ${filtroGrafico==='semana'?'btn-white shadow text-blue-600':'btn-ghost text-slate-500'}`} onClick={()=>setFiltroGrafico('semana')}>Semana</button>
                <button className={`btn btn-xs ${filtroGrafico==='mes'?'btn-white shadow text-blue-600':'btn-ghost text-slate-500'}`} onClick={()=>setFiltroGrafico('mes')}>Mes</button>
                <button className={`btn btn-xs ${filtroGrafico==='rango'?'btn-white shadow text-blue-600':'btn-ghost text-slate-500'}`} onClick={()=>setFiltroGrafico('rango')}>Rango</button>
              </div>
            </div>
            
            {/* --- SELECTOR DE RANGO MEJORADO (COLORIMETRÍA) --- */}
            {filtroGrafico === 'rango' && (
              <div className="flex justify-end mb-6 animate-fade-in">
                <div className="flex items-center gap-2 bg-white p-1.5 rounded-lg border border-slate-200 shadow-sm">
                   <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">DE</span>
                      <input 
                        type="date" 
                        className="input input-xs input-bordered pl-8 bg-slate-50 text-slate-600 font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded" 
                        value={fechasRango.inicio} 
                        onChange={e => setFechasRango({...fechasRango, inicio: e.target.value})} 
                      />
                   </div>
                   <span className="text-slate-300">➔</span>
                   <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">A</span>
                      <input 
                        type="date" 
                        className="input input-xs input-bordered pl-6 bg-slate-50 text-slate-600 font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded" 
                        value={fechasRango.fin} 
                        onChange={e => setFechasRango({...fechasRango, fin: e.target.value})} 
                      />
                   </div>
                </div>
              </div>
            )}

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataGraficos.ingresos}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="fecha" tick={{fontSize: 11, fill: '#64748b'}} axisLine={false} tickLine={false} />
                  <YAxis tick={{fontSize: 11, fill: '#64748b'}} axisLine={false} tickLine={false} tickFormatter={(value) => `C$${value}`} />
                  <Tooltip content={<CustomTooltip />} cursor={{fill: '#f1f5f9'}} />
                  <Bar dataKey="monto" fill="#10b981" radius={[4, 4, 0, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* GRÁFICO DE DEMOGRAFÍA */}
        <div className="card bg-white border border-slate-200 shadow-sm">
          <div className="card-body p-6">
            <h3 className="font-bold text-lg text-slate-700 mb-4">Demografía</h3>
            <div className="h-64 w-full relative">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={dataGraficos.generos} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {dataGraficos.generos.map((entry: any, index: number) => (<Cell key={`cell-${index}`} fill={entry.fill} stroke="none" />))}
                    </Pie>
                    <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
               </ResponsiveContainer>
               <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center mt-[-15px]">
                 <span className="text-3xl font-bold text-slate-700">{stats?.totalPacientes}</span>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pacientes</p>
               </div>
            </div>
            
            <div className="mt-4 space-y-3">
               <p className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b pb-1">Distribución por Edad</p>
               <div className="flex h-3 rounded-full overflow-hidden bg-slate-100 w-full">
                  {dataGraficos.edades.map((edad: any) => (
                    <div key={edad.name} style={{ width: `${(edad.value / (stats?.totalPacientes || 1)) * 100}%`, backgroundColor: edad.fill }} title={`${edad.name}: ${edad.value}`} className="h-full hover:opacity-80 transition-opacity"></div>
                  ))}
               </div>
               <div className="grid grid-cols-2 gap-y-1 gap-x-2">
                  {dataGraficos.edades.map((edad: any) => (
                    <div key={edad.name} className="flex items-center gap-1.5 text-[10px] text-slate-500">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{backgroundColor: edad.fill}}></span>
                      <span className="truncate">{edad.name}</span>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* AGENDA DEL DÍA */}
      <h2 className="text-2xl font-bold text-slate-800 mb-4">Agenda del Día</h2>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold"><tr><th className="py-4">Hora</th><th>Paciente</th><th>Psicólogo</th><th>Tipo</th><th>Acción</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (<tr><td colSpan={5} className="text-center py-8"><span className="loading loading-spinner"></span></td></tr>) : agendaHoy.length > 0 ? (agendaHoy.map((cita) => (<tr key={cita.ID_Cita} className="hover:bg-slate-50"><td className="font-mono text-blue-600 font-bold text-base">{formatearHora(cita.HoraCita)}</td><td><div className="font-bold text-slate-700">{cita.Paciente.Nombre} {cita.Paciente.Apellido}</div><div className="text-xs text-slate-400 italic" title={cita.MotivoConsulta}>Motivo: {cita.MotivoConsulta.substring(0, 30)}...</div></td><td><span className="text-sm text-slate-600">Dr. {cita.Psicologo.Apellido}</span></td><td><span className="badge badge-outline">{cita.TipoDeCita.NombreDeCita}</span></td><td><Link to={`/pacientes/${cita.Paciente.ID_Paciente}`} className="btn btn-xs btn-outline btn-info">Ver Expediente</Link></td></tr>))) : (<tr><td colSpan={5} className="text-center py-10 text-slate-400 italic">No hay citas programadas para hoy.</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}