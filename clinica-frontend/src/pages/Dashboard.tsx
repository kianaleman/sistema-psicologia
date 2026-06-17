import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import type { Stats, Cita } from '../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

type FiltroGrafico = 'semana' | 'mes' | 'rango';

type IngresoGrafico = {
  fecha: string;
  monto: number;
};

type SegmentoGrafico = {
  name: string;
  value: number;
  fill: string;
};

type GraficosData = {
  ingresos: IngresoGrafico[];
  generos: SegmentoGrafico[];
  edades: SegmentoGrafico[];
};

type TooltipPayloadItem = {
  value?: number | string;
};

type CustomTooltipProps = {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string | number;
};

type KpiCardProps = {
  title: string;
  value: ReactNode;
  subtitle: string;
  icon: ReactNode;
  color: string;
  loading: boolean;
};

const filtrosGrafico: FiltroGrafico[] = ['semana', 'mes', 'rango'];

const graficosIniciales: GraficosData = {
  ingresos: [],
  generos: [],
  edades: [],
};

const Icons = {
  Calendar: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 3v3M17 3v3M4.5 8.25h15M5.25 5.25h13.5A1.5 1.5 0 0120.25 6.75v12A1.5 1.5 0 0118.75 20.25H5.25A1.5 1.5 0 013.75 18.75v-12A1.5 1.5 0 015.25 5.25z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h2M14 12h2M8 16h2M14 16h2" />
    </svg>
  ),
  Users: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5a6.75 6.75 0 00-13.5 0" />
      <circle cx="9" cy="8.25" r="3.75" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 11.25a3 3 0 100-6 3 3 0 000 6zM21.75 19.5a5.25 5.25 0 00-5.25-5.25" />
    </svg>
  ),
  Doctor: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 7.5a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.25a7.5 7.5 0 0115 0" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5v3M10.5 18h3" />
    </svg>
  ),
  Cash: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="w-6 h-6">
      <circle cx="12" cy="12" r="8.25" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5v9M9.75 14.25c.6.75 1.35 1.125 2.25 1.125 1.24 0 2.25-.756 2.25-1.688 0-.932-1.01-1.687-2.25-1.687s-2.25-.756-2.25-1.688c0-.932 1.01-1.687 2.25-1.687.9 0 1.65.375 2.25 1.125" />
    </svg>
  ),
  TrendingUp: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 16.5l5.25-5.25 3.75 3.75 7.5-7.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 7.5h4.5V12" />
    </svg>
  ),
  Chart: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5V4.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5h15" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15.75v-4.5M12 15.75v-7.5M15.75 15.75v-10.5" />
    </svg>
  ),
  ArrowRight: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 12h13.5M13.5 6.75L18.75 12l-5.25 5.25" />
    </svg>
  ),
  Empty: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="w-7 h-7">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3.75h10.5A2.25 2.25 0 0119.5 6v12a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 18V6a2.25 2.25 0 012.25-2.25z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 8.25h7.5M8.25 12h7.5M8.25 15.75h4.5" />
    </svg>
  ),
};

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  const primerPayload = payload?.[0];

  if (!active || !primerPayload) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-950/95 px-4 py-3 text-xs text-white shadow-2xl">
      <p className="mb-1 font-bold text-slate-400">{label}</p>
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400"></span>
        <p className="text-lg font-black">
          C$ {Number(primerPayload.value || 0).toLocaleString('en-NI')}
        </p>
      </div>
    </div>
  );
}

function KpiCard({ title, value, subtitle, icon, color, loading }: KpiCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-white/80 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-200/80">
      <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-slate-100 transition-all duration-300 group-hover:scale-125"></div>

      <div className="relative z-10 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{title}</p>

          {loading ? (
            <div className="mt-3 h-9 w-28 rounded-xl bg-slate-100 animate-pulse"></div>
          ) : (
            <h2 className={`mt-2 truncate text-3xl font-black tracking-tight ${color}`}>{value}</h2>
          )}

          <p className="mt-2 text-xs font-medium text-slate-400">{subtitle}</p>
        </div>

        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 text-slate-600 shadow-sm">
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [agendaHoy, setAgendaHoy] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataGraficos, setDataGraficos] = useState<GraficosData>(graficosIniciales);
  const [filtroGrafico, setFiltroGrafico] = useState<FiltroGrafico>('mes');
  const [fechasRango, setFechasRango] = useState({
    inicio: '',
    fin: '',
  });

  const cargarKPIs = useCallback(async () => {
    try {
      setLoading(true);

      const statsData = await api.general.stats();
      setStats(statsData);

      const citasData = await api.citas.getAll();
      const hoyStr = new Date().toLocaleDateString('en-CA');

      const programadasHoy = citasData
        .filter((cita) => {
          const fechaCitaStr = String(cita.FechaCita).split('T')[0];

          return fechaCitaStr === hoyStr && cita.ID_EstadoCita === 1;
        })
        .sort((a, b) => new Date(a.HoraCita).getTime() - new Date(b.HoraCita).getTime());

      setAgendaHoy(programadasHoy);
    } catch (error: unknown) {
      console.error('Error cargando KPIs:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const cargarGraficos = useCallback(async () => {
    let inicio = '';
    let fin = '';
    const hoy = new Date();

    if (filtroGrafico === 'semana') {
      const primerDia = new Date(hoy);
      primerDia.setDate(hoy.getDate() - hoy.getDay());

      const ultimoDia = new Date(primerDia);
      ultimoDia.setDate(primerDia.getDate() + 6);

      inicio = primerDia.toISOString().split('T')[0];
      fin = ultimoDia.toISOString().split('T')[0];
    } else if (filtroGrafico === 'mes') {
      const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);

      inicio = primerDia.toISOString().split('T')[0];
      fin = ultimoDia.toISOString().split('T')[0];
    } else {
      inicio = fechasRango.inicio;
      fin = fechasRango.fin;
    }

    try {
      const data = await api.general.graficos(inicio, fin) as GraficosData;
      setDataGraficos({
        ingresos: Array.isArray(data.ingresos) ? data.ingresos : [],
        generos: Array.isArray(data.generos) ? data.generos : [],
        edades: Array.isArray(data.edades) ? data.edades : [],
      });
    } catch (error: unknown) {
      console.error('Error cargando gráficos:', error);
      setDataGraficos(graficosIniciales);
    }
  }, [fechasRango.fin, fechasRango.inicio, filtroGrafico]);

  useEffect(() => {
    void cargarKPIs();
  }, [cargarKPIs]);

  useEffect(() => {
    if (filtroGrafico === 'rango' && (!fechasRango.inicio || !fechasRango.fin)) {
      return;
    }

    void cargarGraficos();
  }, [cargarGraficos, fechasRango.fin, fechasRango.inicio, filtroGrafico]);

  const formatearHora = (hora: string) => {
    if (!hora) return '--:--';

    const fecha = new Date(hora);

    return fecha.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
    });
  };

  const totalIngresosGrafico = dataGraficos.ingresos.reduce((total, item) => total + Number(item.monto || 0), 0);
  const totalPacientes = stats?.totalPacientes ?? 0;

  return (
    <div className="mx-auto max-w-[1700px] animate-fade-in-up space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-slate-950 px-6 py-7 text-white shadow-2xl shadow-slate-200/80 sm:px-8">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-500/25 blur-3xl"></div>
        <div className="absolute -bottom-28 left-16 h-72 w-72 rounded-full bg-emerald-400/15 blur-3xl"></div>

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-blue-300">
              Resumen operativo
            </p>
            <h1 className="mt-2 font-serif text-3xl font-black tracking-tight sm:text-4xl">
              Panel General
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
              Vista consolidada de actividad clínica, agenda del día, pacientes, psicólogos e ingresos financieros.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4 backdrop-blur">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
              Fecha actual
            </p>
            <p className="mt-1 text-lg font-bold capitalize text-white">
              {new Date().toLocaleDateString('es-NI', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Citas hoy"
          value={agendaHoy.length}
          subtitle="Citas programadas"
          icon={<Icons.Calendar />}
          color="text-blue-600"
          loading={loading}
        />

        <KpiCard
          title="Pacientes activos"
          value={totalPacientes}
          subtitle="Pacientes registrados"
          icon={<Icons.Users />}
          color="text-slate-900"
          loading={loading}
        />

        <KpiCard
          title="Psicólogos"
          value={stats?.psicologosActivos ?? 0}
          subtitle="Personal disponible"
          icon={<Icons.Doctor />}
          color="text-slate-900"
          loading={loading}
        />

        <KpiCard
          title="Ingresos totales"
          value={`C$ ${Number(stats?.ingresosTotales ?? 0).toLocaleString('en-NI', {
            compactDisplay: 'short',
            maximumFractionDigits: 0,
          })}`}
          subtitle="Facturado en total"
          icon={<Icons.Cash />}
          color="text-emerald-600"
          loading={loading}
        />
      </section>

      <section className="grid grid-cols-1 gap-8 xl:grid-cols-12">
        <div className="space-y-8 xl:col-span-8">
          <div className="overflow-hidden rounded-[2rem] border border-white/80 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <Icons.TrendingUp />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Ingresos financieros</h3>
                  <p className="text-xs font-medium text-slate-400">
                    Total del periodo: C$ {totalIngresosGrafico.toLocaleString('en-NI')}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-slate-100 p-1.5">
                {filtrosGrafico.map((filtro) => (
                  <button
                    key={filtro}
                    type="button"
                    className={`btn btn-sm min-h-9 rounded-xl border-none px-4 capitalize ${
                      filtroGrafico === filtro
                        ? 'bg-white text-slate-950 shadow-sm hover:bg-white'
                        : 'bg-transparent text-slate-500 hover:bg-slate-200'
                    }`}
                    onClick={() => setFiltroGrafico(filtro)}
                  >
                    {filtro}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6">
              {filtroGrafico === 'rango' && (
                <div className="mb-5 flex justify-end">
                  <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center">
                    <input
                      type="date"
                      className="input input-sm input-bordered bg-white font-medium text-slate-600"
                      value={fechasRango.inicio}
                      onChange={(event) => setFechasRango({
                        ...fechasRango,
                        inicio: event.target.value,
                      })}
                    />
                    <span className="hidden text-slate-300 sm:block">
                      <Icons.ArrowRight />
                    </span>
                    <input
                      type="date"
                      className="input input-sm input-bordered bg-white font-medium text-slate-600"
                      value={fechasRango.fin}
                      onChange={(event) => setFechasRango({
                        ...fechasRango,
                        fin: event.target.value,
                      })}
                    />
                  </div>
                </div>
              )}

              <div className="h-80 w-full">
                {dataGraficos.ingresos.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dataGraficos.ingresos} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="fecha" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} dy={10} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(value) => `C$${value}`} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                      <Bar dataKey="monto" fill="#10b981" radius={[10, 10, 0, 0]} barSize={42} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 text-center">
                    <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
                      <Icons.Chart />
                    </div>
                    <p className="text-sm font-bold text-slate-600">Sin ingresos para mostrar</p>
                    <p className="mt-1 text-xs text-slate-400">Selecciona otro periodo o registra nuevos pagos.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-[2rem] border border-white/80 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-[0.18em] text-slate-700">Género de pacientes</h3>
                  <p className="mt-1 text-xs text-slate-400">Distribución registrada en pacientes activos.</p>
                </div>
              </div>

              <div className="relative h-56 w-full">
                {dataGraficos.generos.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={dataGraficos.generos} cx="45%" cy="50%" innerRadius={58} outerRadius={82} paddingAngle={5} dataKey="value">
                          {dataGraficos.generos.map((entry, index) => (
                            <Cell key={`${entry.name}-${index}`} fill={entry.fill} stroke="none" />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
                      </PieChart>
                    </ResponsiveContainer>

                    <div className="pointer-events-none absolute left-[45%] top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                      <span className="block text-3xl font-black text-slate-900">{totalPacientes}</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total</span>
                    </div>
                  </>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 text-center">
                    <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
                      <Icons.Users />
                    </div>
                    <p className="text-sm font-bold text-slate-600">Sin distribución disponible</p>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/80 bg-white p-6 shadow-sm">
              <div className="mb-6">
                <h3 className="text-sm font-black uppercase tracking-[0.18em] text-slate-700">Rangos de edad</h3>
                <p className="mt-1 text-xs text-slate-400">Segmentación de pacientes por edad.</p>
              </div>

              {dataGraficos.edades.length > 0 ? (
                <div className="space-y-5">
                  {dataGraficos.edades.map((edad) => {
                    const porcentaje = (edad.value / (totalPacientes || 1)) * 100;

                    return (
                      <div key={edad.name}>
                        <div className="mb-2 flex justify-between gap-3 text-xs">
                          <span className="font-bold text-slate-600">{edad.name}</span>
                          <span className="font-black text-slate-900">
                            {edad.value} ({porcentaje.toFixed(0)}%)
                          </span>
                        </div>

                        <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-3 rounded-full transition-all duration-500"
                            style={{
                              width: `${porcentaje}%`,
                              backgroundColor: edad.fill,
                            }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex min-h-48 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 text-center">
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
                    <Icons.Chart />
                  </div>
                  <p className="text-sm font-bold text-slate-600">Sin rangos disponibles</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <aside className="xl:col-span-4">
          <div className="sticky top-24 overflow-hidden rounded-[2rem] border border-white/80 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-600">Agenda</p>
                  <h2 className="mt-1 text-xl font-black text-slate-900">Citas del día</h2>
                </div>

                <Link to="/citas" className="btn btn-sm rounded-xl border-slate-200 bg-white text-slate-600 hover:bg-slate-50">
                  Ver todo
                </Link>
              </div>
            </div>

            <div className="max-h-[820px] overflow-y-auto">
              {loading ? (
                <div className="flex justify-center p-10">
                  <span className="loading loading-spinner text-blue-500"></span>
                </div>
              ) : agendaHoy.length > 0 ? (
                <ul className="divide-y divide-slate-100">
                  {agendaHoy.map((cita) => (
                    <li key={cita.ID_Cita} className="group p-5 transition-colors hover:bg-slate-50">
                      <div className="flex gap-4">
                        <div className="shrink-0">
                          <div className="rounded-2xl bg-slate-950 px-3 py-2 text-center text-white shadow-lg shadow-slate-200">
                            <span className="block text-sm font-black">{formatearHora(cita.HoraCita)}</span>
                          </div>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h4 className="truncate text-sm font-black text-slate-800">
                                {cita.Paciente?.Nombre || 'Paciente'} {cita.Paciente?.Apellido || ''}
                              </h4>
                              <p className="mt-1 text-xs font-medium text-slate-500">
                                Dr. {cita.Psicologo?.Apellido || 'N/A'}
                              </p>
                            </div>

                            <span className="badge badge-sm border-blue-100 bg-blue-50 text-[10px] font-black uppercase tracking-wide text-blue-700">
                              {cita.TipoDeCita?.Nombre_DeCita || 'N/A'}
                            </span>
                          </div>

                          {cita.MotivoConsulta && (
                            <p className="mt-3 line-clamp-2 rounded-2xl border border-slate-100 bg-white px-3 py-2 text-xs leading-relaxed text-slate-500">
                              {cita.MotivoConsulta}
                            </p>
                          )}

                          <div className="mt-4">
                            {cita.Paciente?.ID_Paciente ? (
                              <Link
                                to={`/pacientes/${cita.Paciente.ID_Paciente}`}
                                className="btn btn-sm w-full rounded-xl border-slate-200 bg-white text-slate-600 hover:bg-slate-950 hover:text-white"
                              >
                                Ver expediente
                              </Link>
                            ) : (
                              <button type="button" className="btn btn-sm w-full rounded-xl border-slate-200 bg-white text-slate-400" disabled>
                                Ver expediente
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-50 text-slate-400">
                    <Icons.Empty />
                  </div>
                  <p className="text-sm font-black text-slate-700">No hay citas para hoy</p>
                  <p className="mt-2 max-w-xs text-xs leading-relaxed text-slate-400">
                    No existen registros pendientes para la fecha actual.
                  </p>
                </div>
              )}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
