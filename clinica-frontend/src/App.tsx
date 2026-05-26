// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Componentes Estructurales
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Páginas
import Presentacion from './pages/Presentacion';
import Dashboard from './pages/Dashboard';
import Pacientes from './pages/Pacientes';
import Citas from './pages/Citas';
import Historial from './pages/Historial';
import Tutores from './pages/Tutores';
import Psicologos from './pages/Psicologos';
import Facturacion from './pages/Facturacion';
import Configuracion from './pages/Configuracion';
import PacienteDetalle from './pages/PacienteDetalle';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* RUTA PÚBLICA */}
        <Route path="/" element={<Presentacion />} />
        
        {/* RUTAS PROTEGIDAS Y CON DISEÑO (LAYOUT) */}
        <Route element={<ProtectedRoute />}>
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
        </Route>

        {/* RUTA COMODÍN (404) */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}