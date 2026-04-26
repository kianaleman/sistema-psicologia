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
  // Lógica: Activo si es la ruta exacta O si empieza con ella (excepto root /)
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
  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      
      {/* --- SIDEBAR LATERAL --- */}
      <aside className="w-64 bg-white border-r border-slate-200 fixed h-full z-30 hidden lg:block overflow-y-auto">
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-10 px-2">
            <img 
                src={logoClinica} 
                alt="Logo" 
                className="w-10 h-10 object-contain drop-shadow-sm" 
            />
            <span className="text-xl font-black text-slate-800 tracking-tight font-serif">Resiliencia</span>
          </div>
          
          <ul className="menu space-y-1 p-0 flex-1">
            <span className="text-[10px] font-black text-slate-400 uppercase px-4 mb-2 tracking-widest">Principal</span>
            <NavItem to="/dashboard" label="Dashboard" icon="📊" />
            <NavItem to="/citas" label="Agenda" icon="📅" />
            <NavItem to="/pacientes" label="Pacientes" icon="👥" />
            
            <span className="text-[10px] font-black text-slate-400 uppercase px-4 mb-2 mt-6 tracking-widest">Clínica</span>
            <NavItem to="/historial" label="Historial" icon="📂" />
            <NavItem to="/facturacion" label="Finanzas" icon="💰" />
            
            <span className="text-[10px] font-black text-slate-400 uppercase px-4 mb-2 mt-6 tracking-widest">Administración</span>
            <NavItem to="/psicologos" label="Equipo" icon="🥼" />
            <NavItem to="/tutores" label="Tutores" icon="👨‍👩‍👦" />
            <NavItem to="/configuracion" label="Ajustes" icon="⚙️" />
          </ul>

          {/* Botón de Retorno a Inicio en la parte inferior */}
          <div className="pt-4 mt-4 border-t border-slate-100">
            <NavItem to="/" label="Pantalla Inicio" icon="🏠" />
          </div>
        </div>
      </aside>

      {/* --- ÁREA DE CONTENIDO --- */}
      <main className="flex-1 lg:ml-64 min-h-screen flex flex-col">
        {/* Barra Superior Móvil */}
        <header className="lg:hidden flex justify-between items-center p-4 bg-white border-b border-slate-200 sticky top-0 z-20">
            <div className="flex items-center gap-2">
                <img src={logoClinica} className="w-8 h-8 object-contain" alt="Logo" />
                <span className="font-bold text-slate-800">Resiliencia</span>
            </div>
            <Link to="/" className="btn btn-sm btn-ghost text-xl">🏠</Link>
        </header>
        
        {/* Contenedor de las páginas */}
        <div className="p-4 md:p-8 flex-1 overflow-x-hidden">
          <Outlet /> 
        </div>
      </main>

      <Toaster position="top-right" richColors closeButton theme="light" />
    </div>
  );
}

// ----------------------------------------------------
// App: Componente principal
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 1. PRESENTACIÓN (Full Screen) */}
        <Route path="/" element={<Presentacion />} />
        
        {/* 2. SISTEMA (With Sidebar) */}
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

        {/* Redirección por defecto si la ruta no existe */}
        <Route path="*" element={<Presentacion />} />
      </Routes>
    </BrowserRouter>
  )
}