import { Link, useLocation, Outlet } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import type { ReactNode } from 'react';
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

type IconName =
  | 'dashboard'
  | 'calendar'
  | 'patients'
  | 'history'
  | 'tests'
  | 'finance'
  | 'team'
  | 'tutors'
  | 'audit'
  | 'settings'
  | 'logout'
  | 'user'
  | 'menu';

type NavItemProps = {
  to: string;
  label: string;
  icon: IconName;
};

type SidebarSectionProps = {
  title: string;
  children: ReactNode;
};

const ROLES = {
  ADMINISTRADOR: 'administrador',
  PSICOLOGO: 'psicologo',
  RECEPCION: 'recepcion',
} as const;

const Icons = {
  dashboard: () => (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 13.5h6.5V20H4z" />
      <path d="M13.5 4H20v16h-6.5z" />
      <path d="M4 4h6.5v6.5H4z" />
    </svg>
  ),
  calendar: () => (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 3v3" />
      <path d="M17 3v3" />
      <path d="M4 8h16" />
      <rect x="4" y="5" width="16" height="16" rx="2.5" />
      <path d="M8 12h2" />
      <path d="M14 12h2" />
      <path d="M8 16h2" />
      <path d="M14 16h2" />
    </svg>
  ),
  patients: () => (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 20a4 4 0 0 0-8 0" />
      <circle cx="12" cy="10" r="3" />
      <path d="M20 19a3 3 0 0 0-3-3" />
      <path d="M4 19a3 3 0 0 1 3-3" />
      <path d="M18 8.5a2 2 0 1 1-1.5-1.94" />
      <path d="M6 8.5A2 2 0 1 0 7.5 6.56" />
    </svg>
  ),
  history: () => (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H10l2 2h5.5A2.5 2.5 0 0 1 20 9.5v7A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5z" />
      <path d="M9 12h6" />
      <path d="M9 15h4" />
    </svg>
  ),
  tests: () => (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 3.5h6" />
      <path d="M10 3.5v5.25L5.5 17a2.25 2.25 0 0 0 2 3.5h9a2.25 2.25 0 0 0 2-3.5L14 8.75V3.5" />
      <path d="M8 15h8" />
      <path d="M10 18h4" />
    </svg>
  ),
  finance: () => (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 18V7a2 2 0 0 1 2-2h12" />
      <path d="M6 8h13a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H6a2 2 0 0 1-2-2V7" />
      <path d="M16 13h2" />
    </svg>
  ),
  team: () => (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 7v10" />
      <path d="M7 12h10" />
      <circle cx="12" cy="12" r="8" />
      <path d="M6.5 20.5 9 18" />
      <path d="M17.5 20.5 15 18" />
    </svg>
  ),
  tutors: () => (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
      <circle cx="17" cy="10" r="2.5" />
      <path d="M14.5 18.5a4 4 0 0 1 6 1.5" />
    </svg>
  ),
  audit: () => (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21s7-3.5 7-10V5l-7-2-7 2v6c0 6.5 7 10 7 10z" />
      <path d="m9 12 2 2 4-5" />
    </svg>
  ),
  settings: () => (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.8 1.8 0 0 0 .36 1.98l.04.04a2 2 0 0 1-2.83 2.83l-.04-.04A1.8 1.8 0 0 0 15 19.4a1.8 1.8 0 0 0-1 .6 1.8 1.8 0 0 0-.4 1.2V21a2 2 0 0 1-4 0v-.06A1.8 1.8 0 0 0 9 19.4a1.8 1.8 0 0 0-1.98.36l-.04.04a2 2 0 0 1-2.83-2.83l.04-.04A1.8 1.8 0 0 0 4.6 15a1.8 1.8 0 0 0-.6-1 1.8 1.8 0 0 0-1.2-.4H3a2 2 0 0 1 0-4h.06A1.8 1.8 0 0 0 4.6 9a1.8 1.8 0 0 0-.36-1.98l-.04-.04a2 2 0 0 1 2.83-2.83l.04.04A1.8 1.8 0 0 0 9 4.6a1.8 1.8 0 0 0 1-.6 1.8 1.8 0 0 0 .4-1.2V3a2 2 0 0 1 4 0v.06A1.8 1.8 0 0 0 15 4.6a1.8 1.8 0 0 0 1.98-.36l.04-.04a2 2 0 0 1 2.83 2.83l-.04.04A1.8 1.8 0 0 0 19.4 9c.2.4.4.73.6 1 .28.28.7.4 1.2.4H21a2 2 0 0 1 0 4h-.06A1.8 1.8 0 0 0 19.4 15z" />
    </svg>
  ),
  logout: () => (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 17 5 12l5-5" />
      <path d="M5 12h12" />
      <path d="M14 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
    </svg>
  ),
  user: () => (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 21a7 7 0 0 1 14 0" />
    </svg>
  ),
  menu: () => (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </svg>
  ),
};

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

const getRolPrincipal = (usuario: UsuarioSesion | null) => {
  const { esAdmin, esPsicologo, esRecepcion } = getPermisosUsuario(usuario);

  if (esAdmin) return 'Administrador';
  if (esPsicologo) return 'Psicólogo';
  if (esRecepcion) return 'Recepción';

  return 'Usuario';
};

function SidebarSection({ title, children }: SidebarSectionProps) {
  return (
    <section className="space-y-2">
      <p className="px-4 text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">
        {title}
      </p>

      <ul className="space-y-1">
        {children}
      </ul>
    </section>
  );
}

function NavItem({ to, label, icon }: NavItemProps) {
  const location = useLocation();
  const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
  const Icon = Icons[icon];

  return (
    <li>
      <Link
        to={to}
        className={`group relative flex items-center gap-3 rounded-2xl px-3.5 py-3 transition-all duration-200
          ${isActive
            ? 'bg-white text-slate-950 shadow-[0_14px_35px_rgba(15,23,42,0.22)]'
            : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}
      >
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-200
          ${isActive
            ? 'bg-slate-950 text-white'
            : 'bg-white/10 text-slate-300 group-hover:bg-white/15 group-hover:text-white'}`}
        >
          <Icon />
        </span>

        <span className="text-sm font-semibold tracking-wide">
          {label}
        </span>

        {isActive && (
          <span className="ml-auto h-2 w-2 rounded-full bg-blue-500"></span>
        )}
      </Link>
    </li>
  );
}

export default function Layout() {
  const usuario = getUsuarioSesion();
  const { esAdmin, esPsicologo, esRecepcion } = getPermisosUsuario(usuario);
  const rolPrincipal = getRolPrincipal(usuario);

  const puedeVerHistorial = esAdmin || esPsicologo;
  const puedeVerFinanzas = esAdmin || esRecepcion || esPsicologo;
  const puedeVerTests = esAdmin || esPsicologo;
  const puedeVerEquipo = esAdmin;
  const puedeVerConfiguracion = esAdmin;
  const puedeVerAuditoria = esAdmin;
  const puedeVerTutores = esAdmin || esRecepcion || esPsicologo;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    toast.info('Sesión cerrada correctamente');
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[296px] overflow-hidden bg-slate-950 text-white lg:flex lg:flex-col">
        <div className="pointer-events-none absolute -left-28 top-16 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl"></div>
        <div className="pointer-events-none absolute bottom-10 right-[-120px] h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl"></div>

        <div className="relative z-10 border-b border-white/10 px-6 py-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white shadow-xl">
              <img src={logoClinica} alt="Logo" className="h-10 w-10 object-contain" />
            </div>

            <div className="min-w-0">
              <p className="truncate text-lg font-black tracking-tight">
                Clínica Resiliencia
              </p>
              <p className="mt-1 truncate text-xs font-medium text-slate-400">
                Gestión clínica integral
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-10 px-6 py-5">
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-4 shadow-2xl shadow-black/20 backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-slate-100">
                <Icons.user />
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-white">
                  {usuario?.nombre || 'Usuario del sistema'}
                </p>
                <p className="mt-0.5 truncate text-xs font-semibold text-blue-300">
                  {rolPrincipal}
                </p>
              </div>
            </div>
          </div>
        </div>

        <nav className="relative z-10 flex-1 space-y-6 overflow-y-auto px-5 pb-5">
          <SidebarSection title="Operación">
            <NavItem to="/dashboard" label="Dashboard" icon="dashboard" />
            <NavItem to="/citas" label="Agenda" icon="calendar" />
            <NavItem to="/pacientes" label="Pacientes" icon="patients" />
          </SidebarSection>

          {(puedeVerHistorial || puedeVerFinanzas || puedeVerTests) && (
            <SidebarSection title="Clínica">
              {puedeVerHistorial && (
                <NavItem to="/historial" label="Historial" icon="history" />
              )}

              {puedeVerTests && (
                <NavItem to="/tests" label="Tests" icon="tests" />
              )}

              {puedeVerFinanzas && (
                <NavItem to="/facturacion" label="Finanzas" icon="finance" />
              )}
            </SidebarSection>
          )}

          {(puedeVerEquipo || puedeVerTutores || puedeVerConfiguracion || puedeVerAuditoria) && (
            <SidebarSection title="Administración">
              {puedeVerEquipo && (
                <NavItem to="/psicologos" label="Equipo" icon="team" />
              )}

              {puedeVerTutores && (
                <NavItem to="/tutores" label="Tutores" icon="tutors" />
              )}

              {puedeVerAuditoria && (
                <NavItem to="/auditoria" label="Auditoría" icon="audit" />
              )}

              {puedeVerConfiguracion && (
                <NavItem to="/configuracion" label="Ajustes" icon="settings" />
              )}
            </SidebarSection>
          )}
        </nav>

        <div className="relative z-10 border-t border-white/10 p-5">
          <button
            onClick={handleLogout}
            className="group flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left text-slate-300 transition-all duration-200 hover:border-red-400/30 hover:bg-red-500/10 hover:text-red-200"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 transition-all group-hover:bg-red-500/20">
              <Icons.logout />
            </span>
            <span className="text-sm font-semibold tracking-wide">
              Cerrar sesión
            </span>
          </button>
        </div>
      </aside>

      <div className="lg:pl-[296px]">
        <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-slate-50/90 backdrop-blur-xl">
          <div className="flex min-h-20 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4 min-w-0">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg shadow-slate-950/20 lg:hidden">
                <Icons.menu />
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-600">
                  Panel administrativo
                </p>
                <h1 className="truncate text-xl font-black tracking-tight text-slate-950">
                  Clínica Resiliencia
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden rounded-2xl border border-slate-200 bg-white px-4 py-2 shadow-sm sm:block">
                <p className="max-w-[240px] truncate text-sm font-bold text-slate-800">
                  {usuario?.nombre || 'Usuario del sistema'}
                </p>
                <p className="text-xs font-semibold text-slate-400">
                  {rolPrincipal}
                </p>
              </div>

              <button
                onClick={handleLogout}
                className="btn btn-sm border-red-100 bg-red-50 text-red-600 hover:border-red-200 hover:bg-red-100 lg:hidden"
                aria-label="Cerrar sesión"
              >
                <Icons.logout />
              </button>
            </div>
          </div>

          <div className="border-t border-slate-200/80 bg-white/70 px-4 py-3 sm:px-6 lg:hidden">
            <div className="flex gap-2 overflow-x-auto pb-1">
              <Link to="/dashboard" className="btn btn-sm rounded-full bg-slate-950 text-white border-slate-950">Dashboard</Link>
              <Link to="/citas" className="btn btn-sm rounded-full bg-white text-slate-600 border-slate-200">Agenda</Link>
              <Link to="/pacientes" className="btn btn-sm rounded-full bg-white text-slate-600 border-slate-200">Pacientes</Link>
              {puedeVerHistorial && (
                <Link to="/historial" className="btn btn-sm rounded-full bg-white text-slate-600 border-slate-200">Historial</Link>
              )}
              {puedeVerTests && (
                <Link to="/tests" className="btn btn-sm rounded-full bg-white text-slate-600 border-slate-200">Tests</Link>
              )}
              {puedeVerFinanzas && (
                <Link to="/facturacion" className="btn btn-sm rounded-full bg-white text-slate-600 border-slate-200">Finanzas</Link>
              )}
              {puedeVerTutores && (
                <Link to="/tutores" className="btn btn-sm rounded-full bg-white text-slate-600 border-slate-200">Tutores</Link>
              )}
              {puedeVerEquipo && (
                <Link to="/psicologos" className="btn btn-sm rounded-full bg-white text-slate-600 border-slate-200">Equipo</Link>
              )}
              {puedeVerAuditoria && (
                <Link to="/auditoria" className="btn btn-sm rounded-full bg-white text-slate-600 border-slate-200">Auditoría</Link>
              )}
              {puedeVerConfiguracion && (
                <Link to="/configuracion" className="btn btn-sm rounded-full bg-white text-slate-600 border-slate-200">Ajustes</Link>
              )}
            </div>
          </div>
        </header>

        <main className="min-h-[calc(100vh-5rem)] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-[1680px]">
            <Outlet />
          </div>
        </main>
      </div>

      <Toaster position="top-right" richColors closeButton theme="light" />
    </div>
  );
}
