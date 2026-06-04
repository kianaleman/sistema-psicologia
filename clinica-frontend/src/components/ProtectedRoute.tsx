import { Navigate, Outlet, useLocation } from 'react-router-dom';

type RolLike = string | { Nombre_Rol?: string; nombre?: string; name?: string };

type UsuarioSesion = {
  roles?: RolLike[];
  rol?: RolLike;
  role?: RolLike;
  Rol?: RolLike;
  requiereCambioPassword?: boolean;
  esAdmin?: boolean;
  esPsicologo?: boolean;
  esRecepcion?: boolean;
};

const ROLES = {
  ADMINISTRADOR: 'administrador',
  PSICOLOGO: 'psicologo',
  RECEPCION: 'recepcion',
} as const;

const RUTAS_BASE_AUTENTICADAS = [
  '/dashboard',
  '/citas',
  '/pacientes',
  '/tutores',
  '/facturacion',
  '/historial',
];

const normalizarTexto = (value: string) => {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
};

const obtenerNombreRol = (rol: RolLike | undefined | null) => {
  if (!rol) return '';

  if (typeof rol === 'string') {
    return normalizarTexto(rol);
  }

  return normalizarTexto(rol.Nombre_Rol || rol.nombre || rol.name || '');
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

const getRolesNormalizados = (usuario: UsuarioSesion | null) => {
  if (!usuario) return [];

  const roles = [
    ...(Array.isArray(usuario.roles) ? usuario.roles : []),
    usuario.rol,
    usuario.role,
    usuario.Rol,
  ];

  return roles
    .map(obtenerNombreRol)
    .filter(Boolean);
};

const getPermisosUsuario = (usuario: UsuarioSesion | null) => {
  const roles = getRolesNormalizados(usuario);

  const esAdmin = Boolean(usuario?.esAdmin || roles.includes(ROLES.ADMINISTRADOR));
  const esPsicologo = Boolean(usuario?.esPsicologo || roles.includes(ROLES.PSICOLOGO));
  const esRecepcion = Boolean(usuario?.esRecepcion || roles.includes(ROLES.RECEPCION));

  return {
    esAdmin,
    esPsicologo,
    esRecepcion,
    tieneRolReconocido: esAdmin || esPsicologo || esRecepcion,
  };
};

const iniciaConRuta = (pathname: string, rutas: string[]) => {
  return rutas.some((ruta) => pathname === ruta || pathname.startsWith(`${ruta}/`));
};

const puedeAccederRuta = (pathname: string, usuario: UsuarioSesion | null) => {
  const { esAdmin, esPsicologo, esRecepcion, tieneRolReconocido } = getPermisosUsuario(usuario);

  if (pathname.startsWith('/cambiar-password-default')) return true;
  if (esAdmin) return true;

  if (!tieneRolReconocido) {
    return iniciaConRuta(pathname, RUTAS_BASE_AUTENTICADAS);
  }

  if (pathname.startsWith('/dashboard')) return esPsicologo || esRecepcion;
  if (pathname.startsWith('/citas')) return esPsicologo || esRecepcion;
  if (pathname.startsWith('/pacientes')) return esPsicologo || esRecepcion;
  if (pathname.startsWith('/tutores')) return esPsicologo || esRecepcion;
  if (pathname.startsWith('/facturacion')) return esPsicologo || esRecepcion;
  if (pathname.startsWith('/historial')) return esPsicologo;
  if (pathname.startsWith('/tests')) return esPsicologo;

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
