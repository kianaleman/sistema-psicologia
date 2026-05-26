// src/components/Layout.tsx
import { Link, useLocation, Outlet } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import logoClinica from '../assets/logo-clinica.png';

// Subcomponente de navegación interno
function NavItem({ to, label, icon }: { to: string, label: string, icon: string }) {
  const location = useLocation();
  const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
  
  return (
    <li>
      <Link 
        to={to} 
        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group
        ${isActive 
          ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20 font-medium' 
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
      >
        <span className="text-lg">{icon}</span>
        <span>{label}</span>
      </Link>
    </li>
  );
}

export default function Layout() {
  const handleLogout = () => {
    localStorage.removeItem('token');
    toast.info('Sesión cerrada correctamente');
    window.location.href = '/'; 
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <aside className="w-64 bg-white border-r border-slate-200 fixed h-full z-20 hidden lg:block overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <img src={logoClinica} alt="Logo" className="w-10 h-10 object-contain" />
            <span className="text-xl font-bold text-slate-800 tracking-tight">Clínica Resiliencia</span>
          </div>
          
          <ul className="menu space-y-1 p-0">
            <span className="text-xs font-bold text-slate-400 uppercase px-4 mb-2 mt-2">Principal</span>
            <NavItem to="/dashboard" label="Dashboard" icon="📊" />
            <NavItem to="/citas" label="Agenda" icon="📅" />
            <NavItem to="/pacientes" label="Pacientes" icon="👥" />
            
            <span className="text-xs font-bold text-slate-400 uppercase px-4 mb-2 mt-6">Clínica</span>
            <NavItem to="/historial" label="Historial" icon="📂" />
            <NavItem to="/facturacion" label="Finanzas" icon="💰" />
            
            <span className="text-xs font-bold text-slate-400 uppercase px-4 mb-2 mt-6">Administración</span>
            <NavItem to="/psicologos" label="Equipo" icon="🥼" />
            <NavItem to="/tutores" label="Tutores" icon="👨‍👩‍👦" />
            <NavItem to="/configuracion" label="Ajustes" icon="⚙️" />

            <div className="divider my-4 border-slate-100"></div>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 mt-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-300 group text-left"
            >
              <span className="text-xl group-hover:scale-110 transition-transform">🚪</span>
              <span className="font-medium tracking-wide">Cerrar Sesión</span>
            </button>
          </ul>
        </div>
      </aside>

      <main className="flex-1 lg:ml-64 p-8">
        <div className="lg:hidden flex justify-between items-center mb-6">
           <span className="font-bold text-lg text-slate-800">Clínica Resiliencia</span>
           <button onClick={handleLogout} className="btn btn-sm btn-ghost hover:bg-red-100 hover:text-red-500 text-xl">
             🚪
           </button>
        </div>
        <Outlet /> 
      </main>

      <Toaster position="top-right" richColors closeButton theme="light" />
    </div>
  );
}