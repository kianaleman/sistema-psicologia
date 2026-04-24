import { BrowserRouter, Routes, Route, Link, useLocation, Outlet } from 'react-router-dom';
import { Toaster } from 'sonner';
import logoClinica from './assets/logo-clinica.png';

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


// ----------------------------------------------------
// NavItem: Componente para el link de navegación
function NavItem({ to, label, icon }: { to: string, label: string, icon: string }) {
  const location = useLocation();
  // Lógica: Activo si es la ruta exacta O si empieza con ella (excepto root / para evitar activos falsos)
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

// ----------------------------------------------------
// Layout: Componente que renderiza el Sidebar y el Outlet para los hijos
function Layout() {
  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      
      {/* --- SIDEBAR LATERAL --- */}
      <aside className="w-64 bg-white border-r border-slate-200 fixed h-full z-20 hidden lg:block overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <img 
                src={logoClinica} 
                alt="Logo" 
                className="w-10 h-10 object-contain" 
            />
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

            {/* --- NUEVO BOTÓN AGREGADO --- */}
            <div className="divider my-4"></div>
            <NavItem to="/" label="Pantalla Inicio" icon="🏠" />
          </ul>
        </div>
        
        {/* Usuario Abajo
        <div className="absolute bottom-0 w-full p-4 border-t border-slate-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="avatar placeholder">
              <div className="bg-slate-900 text-white rounded-full w-8"><span>AD</span></div>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700">Administrador</p>
              <p className="text-xs text-slate-400">En línea</p>
            </div>
          </div>
        </div> */}
      </aside>

      {/* --- ÁREA DE CONTENIDO --- */}
      <main className="flex-1 lg:ml-64 p-8">
        {/* Barra Superior Móvil (Solo visible en pantallas pequeñas) */}
        <div className="lg:hidden flex justify-between items-center mb-6">
           <span className="font-bold text-lg text-slate-800">Clínica Resiliencia</span>
           <Link to="/" className="btn btn-sm btn-ghost">🏠</Link>
        </div>
        
        {/* Punto de Inyección de Rutas Hijas */}
        <Outlet /> 
      </main>

      <Toaster position="top-right" richColors closeButton theme="light" />
    </div>
  );
}

// ----------------------------------------------------
// App: Componente principal que define las rutas
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 1. RUTA DE PRESENTACIÓN (Pantalla completa, sin Layout) */}
        <Route path="/" element={<Presentacion />} />
        
        {/* 2. RUTAS PROTEGIDAS / EN EL SISTEMA (Con Layout y Sidebar) */}
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
      </Routes>
    </BrowserRouter>
  )
}