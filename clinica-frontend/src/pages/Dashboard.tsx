import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { toast } from 'sonner'; 
import type { Stats, Cita } from '../types';

// 🟢 IMPORTAMOS EL MODAL QUE USA CITA.TSX
import HistorialModal from '../components/citas/HistorialModal'; 

import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';

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
  const [dataGraficos, setDataGraficos] = useState<any>({ ingresos: [], generos: [], edades: [] });
  const [filtroGrafico, setFiltroGrafico] = useState<'semana' | 'mes' | 'rango'>('mes');
  const [fechasRango, setFechasRango] = useState({ inicio: '', fin: '' });

  // 🟢 ESTADOS PARA EL MODAL DE EXPEDIENTE (Replica de Citas.tsx)
  const [selectedCita, setSelectedCita] = useState<Cita | null>(null);
  const [isHistorialOpen, setIsHistorialOpen] = useState(false);

  useEffect(() => {
    cargarKPIs();
  }, []);

  useEffect(() => {
    if (filtroGrafico === 'rango') {
      if (!fechasRango.inicio || !fechasRango.fin) return;
      if (new Date(fechasRango.inicio) > new Date(fechasRango.fin)) {
        toast.error("La fecha inicial no puede ser mayor a la final.");
        return;
      }
    }
    cargarGraficos();
  }, [filtroGrafico, fechasRango]);

  const cargarKPIs = async () => {
    try {
      setLoading(true);
      const [statsData, agendaData] = await Promise.all([
        api.general.stats(),
        api.general.agendaHoy()
      ]);
      setStats(statsData);
      setAgendaHoy(agendaData);
      setLoading(false);
    } catch (error) { 
      console.error("Error cargando KPIs:", error); 
      setLoading(false); 
    }
  };

  const cargarGraficos = async () => {
    let inicio = '';
    let fin = '';
    const hoy = new Date();

    if (filtroGrafico === 'semana') {
      const actual = new Date();
      const primerDia = new Date(actual.setDate(actual.getDate() - actual.getDay()));
      const ultimoDia = new Date(actual.setDate(actual.getDate() - actual.getDay() + 6));
      inicio = primerDia.toISOString().split('T')[0];
      fin = ultimoDia.toISOString().split('T')[0];
    } else if (filtroGrafico === 'mes') {
      inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
      fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().split('T')[0];
    } else {
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
    const partes = h.match(/(\d{2}):(\d{2})/);
    if (!partes) return "--:--";
    let [_, horas, minutos] = partes;
    let hInt = parseInt(horas);
    const ampm = hInt >= 12 ? 'PM' : 'AM';
    hInt = hInt % 12;
    hInt = hInt ? hInt : 12;
    return `${hInt}:${minutos} ${ampm}`;
  };

  // 🟢 FUNCIÓN PARA ABRIR EL EXPEDIENTE
  const handleVerExpediente = (cita: Cita) => {
    setSelectedCita(cita);
    setIsHistorialOpen(true);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 text-white p-3 shadow-xl rounded-lg text-xs border border-slate-700">
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

  const KpiCard = ({ title, value, subtitle, icon, color }: any) => (
    <div className="card bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all">
      <div className="card-body p-5 flex flex-row items-center justify-between">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
          {loading ? (
            <div className="h-8 w-24 bg-slate-100 animate-pulse rounded"></div>
          ) : (
            <div className={`text-2xl font-black tracking-tight ${color}`}>
              {value}
            </div>
          )}
          <p className="text-[10px] text-slate-400 mt-1 font-medium">{subtitle}</p>
        </div>
        <div className="p-3 rounded-xl bg-slate-50 text-slate-500">{icon}</div>
      </div>
    </div>
  );

  return (
    <div className="p-8 animate-fade-in max-w-[1600px] mx-auto bg-[#fcfcfc] min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 font-serif">Panel General</h1>
          <p className="text-slate-500 text-sm">Resiliencia: Actividad clínica y financiera</p>
        </div>
        <div className="text-right hidden md:block bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Hoy es</p>
          <p className="text-sm font-bold text-slate-700">
            {new Date().toLocaleDateString('es-NI', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <KpiCard title="Citas Hoy" value={agendaHoy.length} subtitle="Atenciones pendientes" icon={<Icons.Calendar />} color="text-blue-600" />
        <KpiCard title="Pacientes Activos" value={stats?.totalPacientes || 0} subtitle="Expedientes registrados" icon={<Icons.Users />} color="text-slate-800" />
        <KpiCard title="Psicólogos" value={stats?.psicologosActivos || 0} subtitle="Personal disponible" icon={<Icons.Doctor />} color="text-slate-800" />
        <KpiCard title="Ingresos Totales" value={`C$ ${Number(stats?.ingresosTotalesNIO || 0).toLocaleString('en-NI')}`} subtitle="Facturado histórico" icon={<Icons.Cash />} color="text-emerald-600" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
          {/* Gráfico */}
          <div className="card bg-white border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 flex items-center gap-2"><Icons.TrendingUp /> Ingresos Financieros</h3>
              <div className="join bg-slate-50 p-1 rounded-lg border border-slate-200">
                {['semana', 'mes', 'rango'].map((f) => (
                  <button key={f} className={`join-item btn btn-xs border-none px-4 uppercase font-bold text-[9px] ${filtroGrafico === f ? 'bg-white shadow text-slate-900' : 'bg-transparent text-slate-400'}`} onClick={() => setFiltroGrafico(f as any)}>{f}</button>
                ))}
              </div>
            </div>
            <div className="p-6">
              {filtroGrafico === 'rango' && (
                <div className="flex justify-end gap-2 mb-6 animate-fade-in bg-slate-50 p-3 rounded-xl border border-slate-100">
                   <div className="flex flex-col">
                     <span className="text-[9px] font-bold text-slate-400 ml-1">DESDE</span>
                     <input type="date" className="input input-xs input-bordered bg-white" value={fechasRango.inicio} onChange={e => setFechasRango({...fechasRango, inicio: e.target.value})} />
                   </div>
                   <div className="flex flex-col">
                     <span className="text-[9px] font-bold text-slate-400 ml-1">HASTA</span>
                     <input type="date" className="input input-xs input-bordered bg-white" value={fechasRango.fin} onChange={e => setFechasRango({...fechasRango, fin: e.target.value})} />
                   </div>
                </div>
              )}
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dataGraficos.ingresos}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="fecha" tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                    <YAxis tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} tickFormatter={(v) => `C$${v}`} />
                    <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}} />
                    <Bar dataKey="monto" fill="#10b981" radius={[4, 4, 0, 0]} barSize={35} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="card bg-white border border-slate-100 shadow-sm">
                <div className="p-6">
                    <h3 className="text-xs font-bold text-slate-400 uppercase mb-6">Género Pacientes</h3>
                    <div className="h-48 relative">
                       <ResponsiveContainer width="100%" height="100%">
                         <PieChart>
                           <Pie data={dataGraficos.generos} innerRadius={55} outerRadius={75} paddingAngle={8} dataKey="value">
                             {dataGraficos.generos.map((entry: any, i: number) => (<Cell key={i} fill={entry.fill} stroke="none" />))}
                           </Pie>
                           <Tooltip />
                           <Legend verticalAlign="bottom" iconType="circle" iconSize={8} wrapperStyle={{fontSize: '11px', paddingTop: '20px'}} />
                         </PieChart>
                       </ResponsiveContainer>
                    </div>
                </div>
             </div>

             <div className="card bg-white border border-slate-100 shadow-sm">
                <div className="p-6">
                    <h3 className="text-xs font-bold text-slate-400 uppercase mb-6">Rangos Etarios</h3>
                    <div className="space-y-4">
                        {dataGraficos.edades.map((edad: any) => {
                            const pct = (edad.value / (stats?.totalPacientes || 1)) * 100;
                            return (
                               <div key={edad.name}>
                                   <div className="flex justify-between text-[10px] mb-1 font-bold">
                                       <span className="text-slate-500">{edad.name}</span>
                                       <span className="text-slate-800">{edad.value} ({pct.toFixed(0)}%)</span>
                                   </div>
                                   <div className="w-full bg-slate-100 rounded-full h-1.5">
                                       <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: edad.fill }}></div>
                                   </div>
                               </div>
                            )
                        })}
                    </div>
                </div>
             </div>
          </div>
        </div>

        <div className="card bg-white border border-slate-100 shadow-sm overflow-hidden h-fit">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                <h2 className="font-bold text-slate-800 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Agenda del Día</h2>
                <Link to="/citas" className="text-[10px] font-bold text-blue-600 hover:underline uppercase">Ver Todo</Link>
            </div>
            <div className="max-h-[750px] overflow-y-auto custom-scrollbar">
               {loading ? (
                   <div className="p-10 text-center"><span className="loading loading-spinner text-blue-500"></span></div>
               ) : agendaHoy.length > 0 ? (
                   <ul className="divide-y divide-slate-50">
                       {agendaHoy.map((cita) => (
                           <li key={cita.ID_Cita} className="p-5 hover:bg-slate-50 transition-colors">
                               <div className="flex gap-4">
                                   <div className="text-center min-w-[55px] bg-slate-50 rounded-xl p-2 border border-slate-100">
                                       <span className="text-sm font-black text-slate-800 block">{formatearHora(cita.HoraCita)}</span>
                                   </div>
                                   <div className="flex-1 min-w-0">
                                       <div className="flex justify-between items-start">
                                           <h4 className="font-bold text-slate-700 text-sm truncate">{cita.Paciente?.Nombre} {cita.Paciente?.Apellido}</h4>
                                       </div>
                                       <p className="text-[11px] text-slate-500 font-medium">Dr. {cita.Psicologo?.Apellido}</p>
                                       <div className="mt-3">
                                           {/* 🟢 CAMBIO: Ahora llama a handleVerExpediente pasando el objeto cita */}
                                           <button 
                                              onClick={() => handleVerExpediente(cita)}
                                              className="btn btn-xs btn-ghost border-slate-200 text-slate-500 w-full text-[9px] font-bold"
                                           >
                                              VER EXPEDIENTE
                                           </button>
                                       </div>
                                   </div>
                               </div>
                           </li>
                       ))}
                   </ul>
               ) : (
                   <div className="py-24 text-center px-6">
                        <div className="bg-slate-50 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                            <Icons.Calendar />
                        </div>
                        <p className="text-sm font-bold text-slate-700">No hay citas para hoy</p>
                        <p className="text-xs text-slate-400 mt-1 italic">¡Disfruta el tiempo libre!</p>
                   </div>
               )}
            </div>
        </div>
      </div>

      {/* 🟢 MODAL DE HISTORIAL REUTILIZADO DE CITAS.TSX */}
      <HistorialModal 
        isOpen={isHistorialOpen} 
        onClose={() => {
            setIsHistorialOpen(false);
            setSelectedCita(null);
        }} 
        cita={selectedCita} 
      />
    </div>
  );
}