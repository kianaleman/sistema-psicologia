import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

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
import ForgotPassword from './pages/ForgotPassword';
import CambiarPasswordDefault from './pages/CambiarPasswordDefault';
import ResetPassword from './pages/ResetPassword';
import Auditoria from './pages/Auditoria';
import TestsPsicologicos from './pages/TestsPsicologicos';
import TestPublico from './pages/TestPublico';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Presentacion />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/test-publico/:token" element={<TestPublico />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/cambiar-password-default" element={<CambiarPasswordDefault />} />

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
            <Route path="/auditoria" element={<Auditoria />} />
            <Route path="/tests" element={<TestsPsicologicos />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
