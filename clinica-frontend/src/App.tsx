import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';

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

// Componente de Item de Menú para detectar activo
function NavItem({ to, label, icon }: { to: string, label: string, icon: string }) {
  const location = useLocation();
  // Lógica simple: si la URL empieza con el link, está activo
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

function Layout() {
  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      
      {/* --- SIDEBAR LATERAL --- */}
      <aside className="w-64 bg-white border-r border-slate-200 fixed h-full z-20 hidden lg:block">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">R</div>
            <span className="text-xl font-bold text-slate-800 tracking-tight">Resiliencia</span>
          </div>
          
          <ul className="menu space-y-1 p-0">
            <span className="text-xs font-bold text-slate-400 uppercase px-4 mb-2 mt-2">Principal</span>
            <NavItem to="/" label="Dashboard" icon="📊" />
            <NavItem to="/citas" label="Agenda" icon="📅" />
            <NavItem to="/pacientes" label="Pacientes" icon="👥" />
            
            <span className="text-xs font-bold text-slate-400 uppercase px-4 mb-2 mt-6">Clínica</span>
            <NavItem to="/historial" label="Historial" icon="📂" />
            <NavItem to="/facturacion" label="Finanzas" icon="💰" />
            
            <span className="text-xs font-bold text-slate-400 uppercase px-4 mb-2 mt-6">Administración</span>
            <NavItem to="/psicologos" label="Equipo" icon="🥼" />
            <NavItem to="/tutores" label="Tutores" icon="👨‍👩‍👦" />
            <NavItem to="/configuracion" label="Ajustes" icon="⚙️" />
          </ul>
        </div>
        
        {/* Usuario Abajo */}
        <div className="absolute bottom-0 w-full p-4 border-t border-slate-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="avatar placeholder">
              <div className="bg-slate-900 text-white rounded-full w-8"><span>AD</span></div>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700">Administrador</p>
              <p className="text-xs text-slate-400">admin@clinica.com</p>
            </div>
          </div>
        </div>
      </aside>

      {/* --- ÁREA DE CONTENIDO --- */}
      <main className="flex-1 lg:ml-64 p-8">
        {/* Barra Superior Móvil (Solo visible en pantallas pequeñas) */}
        <div className="lg:hidden flex justify-between items-center mb-6">
           <span className="font-bold text-lg">Clínica Resiliencia</span>
           {/* Aquí iría un botón de menú móvil si fuera necesario */}
        </div>

        {/* Aquí se renderizan las páginas */}
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/pacientes" element={<Pacientes />} />
          <Route path="/pacientes/:id" element={<PacienteDetalle />} />
          <Route path="/citas" element={<Citas />} />
          <Route path="/historial" element={<Historial />} />
          <Route path="/tutores" element={<Tutores />} />
          <Route path="/psicologos" element={<Psicologos />} />
          <Route path="/facturacion" element={<Facturacion />} />
          <Route path="/configuracion" element={<Configuracion />} />
        </Routes>
      </main>

      <Toaster position="top-right" richColors closeButton theme="light" />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  )
}