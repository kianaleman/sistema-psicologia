// src/components/Layout.tsx
import { Link, useLocation, Outlet } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import logoClinica from '../assets/logo-clinica.png';

type RolLike = string | { Nombre_Rol?: string; nombre?: string; name?: string };

type UsuarioSesion = {
  roles?: RolLike[];
  rol?: RolLike;
  role?: RolLike;
  Rol?: RolLike;
  esAdmin?: boolean;
  esPsicologo?: boolean;
  esRecepcion?: boolean;
  nombre?: string;
};

type NavItemProps = {
  to: string;
  label: string;
  icon: string;
};

const ROLES = {
  ADMINISTRADOR: 'administrador',
  PSICOLOGO: 'psicologo',
  RECEPCION: 'recepcion',
} as const;

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

const getUsuarioSesion = (): UsuarioSesion | null => {
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

  const esAdmin = Boolean(
    usuario?.esAdmin ||
    roles.includes(ROLES.ADMINISTRADOR)
  );

  const esPsicologo = Boolean(
    usuario?.esPsicologo ||
    roles.includes(ROLES.PSICOLOGO)
  );

  const esRecepcion = Boolean(
    usuario?.esRecepcion ||
    roles.includes(ROLES.RECEPCION)
  );

  return {
    esAdmin,
    esPsicologo,
    esRecepcion,
  };
};

function NavItem({ to, label, icon }: NavItemProps) {
  const location = useLocation();
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

export default function Layout() {
  const usuario = getUsuarioSesion();
  const { esAdmin, esPsicologo, esRecepcion } = getPermisosUsuario(usuario);

  const puedeVerHistorial = esAdmin || esPsicologo;
  const puedeVerFinanzas = esAdmin || esRecepcion || esPsicologo;
  const puedeVerEquipo = esAdmin;
  const puedeVerConfiguracion = esAdmin;
  const puedeVerTutores = esAdmin || esRecepcion || esPsicologo;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    toast.info('Sesión cerrada correctamente');
    window.location.href = '/';
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <aside className="w-64 bg-white border-r border-slate-200 fixed h-full z-20 hidden lg:block overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <img src={logoClinica} alt="Logo" className="w-10 h-10 object-contain" />
            <div>
              <span className="block text-xl font-bold text-slate-800 tracking-tight">Clínica Resiliencia</span>
              {usuario?.nombre && (
                <span className="block text-xs text-slate-400 mt-1 truncate max-w-[180px]">
                  {usuario.nombre}
                </span>
              )}
            </div>
          </div>

          <ul className="menu space-y-1 p-0">
            <span className="text-xs font-bold text-slate-400 uppercase px-4 mb-2 mt-2">Principal</span>
            <NavItem to="/dashboard" label="Dashboard" icon="📊" />
            <NavItem to="/citas" label="Agenda" icon="📅" />
            <NavItem to="/pacientes" label="Pacientes" icon="👥" />

            {(puedeVerHistorial || puedeVerFinanzas) && (
              <span className="text-xs font-bold text-slate-400 uppercase px-4 mb-2 mt-6">Clínica</span>
            )}

            {puedeVerHistorial && (
              <NavItem to="/historial" label="Historial" icon="📂" />
            )}

            {puedeVerFinanzas && (
              <NavItem to="/facturacion" label="Finanzas" icon="💰" />
            )}

            {(puedeVerEquipo || puedeVerTutores || puedeVerConfiguracion) && (
              <span className="text-xs font-bold text-slate-400 uppercase px-4 mb-2 mt-6">Administración</span>
            )}

            {puedeVerEquipo && (
              <NavItem to="/psicologos" label="Equipo" icon="🥼" />
            )}

            {puedeVerTutores && (
              <NavItem to="/tutores" label="Tutores" icon="👨‍👩‍👦" />
            )}

            {puedeVerConfiguracion && (
              <NavItem to="/configuracion" label="Ajustes" icon="⚙️" />
            )}

            <div className="divider my-4 border-slate-100"></div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 mt-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-300 group text-left"
            >
              <span className="text-xl group-hover:scale-110 transition-transform">🚪</span>
              <span className="font-medium tracking-wide">Cerrar Sesión</span>
            </button>
          </ul>
        </div>
      </aside>

      <main className="flex-1 lg:ml-64 p-8">
        <div className="lg:hidden flex justify-between items-center mb-6">
          <span className="font-bold text-lg text-slate-800">Clínica Resiliencia</span>
          <button onClick={handleLogout} className="btn btn-sm btn-ghost hover:bg-red-100 hover:text-red-500 text-xl">
            🚪
          </button>
        </div>

        <Outlet />
      </main>

      <Toaster position="top-right" richColors closeButton theme="light" />
    </div>
  );
}
