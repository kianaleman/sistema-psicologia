import { Navigate, Outlet, useLocation } from 'react-router-dom';

type UsuarioSesion = {
  requiereCambioPassword?: boolean;
};

const getUsuarioSesion = () => {
  const usuarioRaw = localStorage.getItem('usuario');

  if (!usuarioRaw) return null;

  try {
    return JSON.parse(usuarioRaw) as UsuarioSesion;
  } catch {
    localStorage.removeItem('usuario');
    return null;
  }
};

export default function ProtectedRoute() {
  const location = useLocation();
  const token = localStorage.getItem('token');
  const usuario = getUsuarioSesion();
  const estaEnCambioPassword = location.pathname === '/cambiar-password-default';

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (usuario?.requiereCambioPassword && !estaEnCambioPassword) {
    return <Navigate to="/cambiar-password-default" replace />;
  }

  return <Outlet />;
}
