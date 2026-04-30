import { BrowserRouter, Routes, Route, Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import logoClinica from './assets/logo_resiliencia.png';
import { api } from './services/api';

// Páginas
import Dashboard from './pages/Dashboard';
import Pacientes from './pages/Pacientes';
import Citas from './pages/Citas';
import Historial from './pages/Historial';
import Tutores from './pages/Tutores';
import Psicologos from './pages/Psicologos';
import Facturacion from './pages/Facturacion';
import Configuracion from './pages/Configuracion';
import PacienteDetalle from './pages/PacienteDetalle';
import Presentacion from './pages/Presentacion';

// 🟢 IMPORTACIÓN DE NUEVAS PÁGINAS
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// ----------------------------------------------------
// NavItem: Componente para el link de navegación
function NavItem({ to, label, icon }: { to: string, label: string, icon: string }) {
  const location = useLocation();
  const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));

  return (
    <li>
      <Link
        to={to}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
        ${isActive
            ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20 font-semibold'
            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
      >
        <span className={`text-lg transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>{icon}</span>
        <span className="text-sm">{label}</span>
      </Link>
    </li>
  );
}

// ----------------------------------------------------
// Layout: Componente que renderiza el Sidebar y el Outlet
function Layout() {
  const navigate = useNavigate();
  const userRole = Number(localStorage.getItem('user_role')) || 2;

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout', {});
      localStorage.removeItem('user_role');
      toast.success('Sesión cerrada correctamente');
      navigate('/', { replace: true });
    } catch (error) {
      localStorage.removeItem('user_role');
      navigate('/', { replace: true });
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">

      {/* --- SIDEBAR LATERAL --- */}
      <aside className="w-64 bg-white border-r border-slate-200 fixed h-full z-30 hidden lg:block overflow-y-auto">
        <div className="p-6 flex flex-col h-full">
          {/* Cambié px-2 por pl-0 para eliminar el espacio de la izquierda */}
          <div className="flex items-center gap-4 mb-10 pl-0">

            {/* Contenedor del logo con tamaño robusto */}
            <div className="flex-shrink-0 w-28 h-28 -ml-8">
              <img
                src={logoClinica}
                alt="Logo"
                className="w-full h-full object-contain drop-shadow-md"
              />
            </div>

            {/* Bloque de texto alineado */}
            <div className="flex flex-col justify-center -ml-10"> {/* Margen negativo opcional para acercarlo aún más al logo */}
              <h1 className="text-[28px] font-black text-slate-800 tracking-tighter font-serif leading-[0.8]">
                Resiliencia
              </h1>
              <span className="text-[12px] text-emerald-600 font-bold uppercase tracking-[0.3em] mt-1">
                Clínica
              </span>
            </div>
          </div>

          <ul className="menu space-y-1 p-0 flex-1">
            <span className="text-[10px] font-black text-slate-400 uppercase px-4 mb-2 tracking-widest -mt-10">Principal</span>
            <NavItem to="/dashboard" label="Dashboard" icon="📊" />
            <NavItem to="/citas" label="Agenda" icon="📅" />
            <NavItem to="/pacientes" label="Pacientes" icon="👥" />

            <span className="text-[10px] font-black text-slate-400 uppercase px-4 mb-2 mt-6 tracking-widest">Clínica</span>
            <NavItem to="/historial" label="Historial" icon="📂" />

            {userRole === 1 && (
              <NavItem to="/facturacion" label="Finanzas" icon="💰" />
            )}

            {userRole === 1 && (
              <>
                <span className="text-[10px] font-black text-slate-400 uppercase px-4 mb-2 mt-6 tracking-widest">Administración</span>
                <NavItem to="/psicologos" label="Equipo" icon="🥼" />
                <NavItem to="/tutores" label="Tutores" icon="👨‍👩‍👦" />
                <NavItem to="/configuracion" label="Ajustes" icon="⚙️" />
              </>
            )}
          </ul>

          <div className="pt-4 mt-4 border-t border-slate-100">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-slate-500 hover:bg-red-50 hover:text-red-600 w-full"
            >
              <span className="text-lg transition-transform duration-200 group-hover:scale-110">🏠</span>
              <span className="text-sm">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 lg:ml-64 min-h-screen flex flex-col">
        <header className="lg:hidden flex justify-between items-center p-4 bg-white border-b border-slate-200 sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <img src={logoClinica} className="w-8 h-8 object-contain" alt="Logo" />
            <span className="font-bold text-slate-800">Resiliencia</span>
          </div>
          <button onClick={handleLogout} className="btn btn-sm btn-ghost text-xl">🏠</button>
        </header>

        <div className="p-4 md:p-8 flex-1 overflow-x-hidden">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      {/* 🟢 Toaster movido aquí para que funcione en TODAS las páginas (Públicas y Privadas) */}
      <Toaster position="top-right" richColors closeButton theme="dark" />

      <Routes>
        {/* Rutas Públicas */}
        <Route path="/" element={<Presentacion />} />
        <Route path="/login" element={<Presentacion />} />

        {/* 🟢 RUTAS DE RECUPERACIÓN (Fuera del Layout) */}
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Rutas Privadas */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/citas" element={<Citas />} />
          <Route path="/pacientes" element={<Pacientes />} />
          <Route path="/pacientes/:id" element={<PacienteDetalle />} />
          <Route path="/historial" element={<Historial />} />
          <Route path="/tutores" element={<Tutores />} />
          <Route path="/psicologos" element={<Psicologos />} />
          <Route path="/facturacion" element={<Facturacion />} />
          <Route path="/configuracion" element={<Configuracion />} />
        </Route>

        <Route path="*" element={<Presentacion />} />
      </Routes>
    </BrowserRouter>
  )
}