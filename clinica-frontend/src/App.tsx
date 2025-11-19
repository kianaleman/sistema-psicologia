import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Pacientes from './pages/Pacientes';
import Citas from './pages/Citas';
import Historial from './pages/Historial';
import PacienteDetalle from './pages/PacienteDetalle';
import Tutores from './pages/Tutores';
import Psicologos from './pages/Psicologos';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
        
        {/* --- NAVBAR FIJO --- */}
        <div className="navbar bg-white shadow-sm px-8 z-50 sticky top-0">
          <div className="flex-1">
            <Link to="/" className="btn btn-ghost text-xl text-blue-600 font-bold">
              🏥 Clínica Resiliencia
            </Link>
          </div>
          <div className="flex-none">
            <ul className="menu menu-horizontal px-1 font-medium">
              {/* Estos son los botones que cambian de página */}
              <li><Link to="/">Inicio</Link></li>
              <li><Link to="/pacientes">Pacientes</Link></li>
              <li><Link to="/citas">Citas</Link></li>
              <li><Link to="/historial">Historial</Link></li>
              <li><Link to="/tutores">Tutores</Link></li>
              <li><Link to="/psicologos">Psicólogos</Link></li>
            </ul>
            
            <div className="dropdown dropdown-end ml-4">
              <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar placeholder">
                <div className="bg-neutral text-neutral-content rounded-full w-10">
                  <span>AD</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- CONTENIDO CAMBIANTE --- */}
        <div className="container mx-auto p-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/pacientes" element={<Pacientes />} />
            <Route path="/pacientes/:id" element={<PacienteDetalle />} />
            <Route path="/citas" element={<Citas />} />
            <Route path="/historial" element={<Historial />} />
            <Route path="/tutores" element={<Tutores />} />
            <Route path="/psicologos" element={<Psicologos />} />
          </Routes>
        </div>

      </div>
    </BrowserRouter>
  )
}

export default App