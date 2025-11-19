import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api'; // <-- Importamos el servicio
// Debe verse así:
// Debe verse así:
import type { Stats, Cita } from '../types';

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [agendaHoy, setAgendaHoy] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      // 1. Cargar Stats usando el servicio
      const statsData = await api.general.stats();
      setStats(statsData);

      // 2. Cargar Citas y filtrar en frontend (como antes, pero más limpio)
      const citasData = await api.citas.getAll();
      const hoyStr = new Date().toLocaleDateString('en-CA');
      
      const programadasHoy = citasData.filter((c: any) => {
        const fechaCitaStr = c.FechaCita.split('T')[0];
        return fechaCitaStr === hoyStr && c.ID_EstadoCita === 1;
      });
      
      programadasHoy.sort((a: any, b: any) => new Date(a.HoraCita).getTime() - new Date(b.HoraCita).getTime());
      setAgendaHoy(programadasHoy);
      
      setLoading(false);
    } catch (error) {
      console.error("Error cargando dashboard:", error);
      setLoading(false);
    }
  };

  // Helper para hora
  const formatearHora = (h: string) => {
    if (!h) return "--:--";
    const fecha = new Date(h);
    return `${fecha.getUTCHours().toString().padStart(2, '0')}:${fecha.getUTCMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-6 animate-fade-in-up">
      <h1 className="text-3xl font-bold text-slate-800 mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {/* Card 1 */}
        <div className="card bg-white border border-slate-200 shadow-sm">
          <div className="card-body p-6">
            <p className="text-sm font-medium text-slate-500 uppercase">Citas para Hoy</p>
            {loading ? <div className="skeleton h-10 w-1/2 mt-1"></div> : <h2 className="text-4xl font-bold text-blue-600 mt-1">{stats?.citasHoy}</h2>}
          </div>
        </div>
        {/* Card 2 */}
        <div className="card bg-white border border-slate-200 shadow-sm">
          <div className="card-body p-6">
            <p className="text-sm font-medium text-slate-500 uppercase">Pacientes Activos</p>
            {loading ? <div className="skeleton h-10 w-1/2 mt-1"></div> : <h2 className="text-4xl font-bold text-slate-800 mt-1">{stats?.totalPacientes}</h2>}
          </div>
        </div>
        {/* Card 3 */}
        <div className="card bg-white border border-slate-200 shadow-sm">
          <div className="card-body p-6">
            <p className="text-sm font-medium text-slate-500 uppercase">Psicólogos Activos</p>
            {loading ? <div className="skeleton h-10 w-1/2 mt-1"></div> : <h2 className="text-4xl font-bold text-slate-800 mt-1">{stats?.psicologosActivos}</h2>}
          </div>
        </div>
        {/* Card 4 */}
        <div className="card bg-white border border-slate-200 shadow-sm">
          <div className="card-body p-6">
            <p className="text-sm font-medium text-slate-500 uppercase">Ingresos Totales</p>
            {loading ? <div className="skeleton h-10 w-1/2 mt-1"></div> : <h2 className="text-4xl font-bold text-emerald-600 mt-1">C$ {Number(stats?.ingresosTotales).toFixed(2)}</h2>}
          </div>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-slate-800 mb-4">Agenda del Día</h2>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold">
              <tr><th className="py-4">Hora</th><th>Paciente</th><th>Psicólogo</th><th>Tipo</th><th>Acción</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-8"><span className="loading loading-spinner"></span></td></tr>
              ) : agendaHoy.length > 0 ? (
                agendaHoy.map((cita) => (
                  <tr key={cita.ID_Cita} className="hover:bg-slate-50">
                    <td className="font-mono text-blue-600 font-bold text-base">{formatearHora(cita.HoraCita)}</td>
                    <td><div className="font-bold text-slate-700">{cita.Paciente.Nombre} {cita.Paciente.Apellido}</div></td>
                    <td><span className="text-sm text-slate-600">Dr. {cita.Psicologo.Apellido}</span></td>
                    <td><span className="badge badge-outline">{cita.TipoDeCita.NombreDeCita}</span></td>
                    <td><Link to={`/pacientes/${cita.Paciente.ID_Paciente}`} className="btn btn-xs btn-outline btn-info">Ver Expediente</Link></td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={5} className="text-center py-10 text-slate-400 italic">No hay citas programadas para hoy.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}