import { Navigate, Outlet, useLocation } from 'react-router-dom';

type UsuarioSesion = {
  roles?: string[];
  requiereCambioPassword?: boolean;
  esAdmin?: boolean;
  esPsicologo?: boolean;
  esRecepcion?: boolean;
};

const ROLES = {
  ADMINISTRADOR: 'Administrador',
  PSICOLOGO: 'Psicologo',
  RECEPCION: 'Recepcion',
} as const;

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

const tieneRol = (usuario: UsuarioSesion | null, rol: string) => {
  return usuario?.roles?.includes(rol) || false;
};

const getPermisosUsuario = (usuario: UsuarioSesion | null) => {
  const esAdmin = Boolean(usuario?.esAdmin || tieneRol(usuario, ROLES.ADMINISTRADOR));
  const esPsicologo = Boolean(usuario?.esPsicologo || tieneRol(usuario, ROLES.PSICOLOGO));
  const esRecepcion = Boolean(usuario?.esRecepcion || tieneRol(usuario, ROLES.RECEPCION));

  return {
    esAdmin,
    esPsicologo,
    esRecepcion,
  };
};

const puedeAccederRuta = (pathname: string, usuario: UsuarioSesion | null) => {
  const { esAdmin, esPsicologo, esRecepcion } = getPermisosUsuario(usuario);

  if (esAdmin) return true;

  if (pathname.startsWith('/cambiar-password-default')) return true;

  if (pathname.startsWith('/dashboard')) return esPsicologo || esRecepcion;
  if (pathname.startsWith('/citas')) return esPsicologo || esRecepcion;
  if (pathname.startsWith('/pacientes')) return esPsicologo || esRecepcion;
  if (pathname.startsWith('/tutores')) return esPsicologo || esRecepcion;
  if (pathname.startsWith('/facturacion')) return esPsicologo || esRecepcion;
  if (pathname.startsWith('/historial')) return esPsicologo;

  if (pathname.startsWith('/psicologos')) return false;
  if (pathname.startsWith('/configuracion')) return false;

  return false;
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

  if (!puedeAccederRuta(location.pathname, usuario)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
