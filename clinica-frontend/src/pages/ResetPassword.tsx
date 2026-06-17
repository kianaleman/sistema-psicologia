import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import { api } from '../services/api';
import logoClinica from '../assets/logo-clinica.png';

type ResetPasswordResponse = {
  message?: string;
};

type ResetPasswordBody = {
  token: string;
  passwordNuevaRaw: string;
};

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token') || '';

  const [passwordNueva, setPasswordNueva] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [passwordActualizada, setPasswordActualizada] = useState(false);

  const tokenValido = token.trim().length > 0;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!tokenValido) {
      toast.error('El enlace de recuperación no contiene un token válido.');
      return;
    }

    if (passwordNueva.trim().length < 6) {
      toast.warning('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (passwordNueva !== confirmarPassword) {
      toast.warning('Las contraseñas no coinciden.');
      return;
    }

    setCargando(true);

    try {
      const response = await api.post<ResetPasswordResponse, ResetPasswordBody>('/auth/reset-password', {
        token,
        passwordNuevaRaw: passwordNueva,
      });

      setPasswordActualizada(true);

      toast.success(response.message || 'Contraseña restablecida correctamente.', {
        duration: 3500,
      });

      window.setTimeout(() => {
        navigate('/');
      }, 3500);
    } catch (error: unknown) {
      const message = error instanceof Error
        ? error.message
        : 'Error al restablecer contraseña';

      toast.error(message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f18] flex items-center justify-center p-4">
      <Toaster position="top-right" richColors closeButton theme="dark" />

      <div className="w-full max-w-md space-y-8 bg-[#111827]/50 p-10 rounded-3xl border border-slate-800 backdrop-blur-xl shadow-2xl">
        <div className="text-center">
          <img src={logoClinica} alt="Logo" className="mx-auto h-32 w-auto mb-4 drop-shadow-lg" />
          <h2 className="text-2xl font-bold text-white font-serif -mt-8">Restablecer Contraseña</h2>
          <p className="text-slate-400 text-sm mt-2">
            Crea una nueva contraseña para recuperar el acceso al sistema.
          </p>
        </div>

        {!tokenValido ? (
          <div className="space-y-6">
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
              <p className="text-sm text-red-200 font-medium">
                El enlace de recuperación no es válido o no contiene token.
              </p>
              <p className="text-xs text-red-200/70 mt-2">
                Solicita un nuevo enlace desde la pantalla de recuperación de acceso.
              </p>
            </div>

            <Link
              to="/forgot-password"
              className="block w-full text-center py-3 px-4 bg-gradient-to-r from-[#2563eb] to-[#00f2ea] text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 transition-all duration-300 hover:scale-[1.02] hover:brightness-110 active:scale-[0.98]"
            >
              Solicitar nuevo enlace
            </Link>
          </div>
        ) : passwordActualizada ? (
          <div className="space-y-6">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
              <p className="text-sm text-emerald-200 font-medium">
                Tu contraseña fue restablecida correctamente.
              </p>
              <p className="text-xs text-emerald-200/70 mt-2">
                Serás redirigido al inicio de sesión.
              </p>
            </div>

            <Link
              to="/"
              className="block w-full text-center py-3 px-4 bg-gradient-to-r from-[#2563eb] to-[#00f2ea] text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 transition-all duration-300 hover:scale-[1.02] hover:brightness-110 active:scale-[0.98]"
            >
              Ir al inicio de sesión
            </Link>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[#00f2ea] uppercase tracking-widest ml-1">
                Nueva Contraseña
              </label>
              <input
                required
                type="password"
                className="w-full px-4 py-3 bg-[#1e293b]/50 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-[#00f2ea] focus:border-transparent outline-none transition-all"
                placeholder="Mínimo 6 caracteres"
                value={passwordNueva}
                onChange={(event) => setPasswordNueva(event.target.value)}
                disabled={cargando}
                minLength={6}
                autoComplete="new-password"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-[#00f2ea] uppercase tracking-widest ml-1">
                Confirmar Contraseña
              </label>
              <input
                required
                type="password"
                className="w-full px-4 py-3 bg-[#1e293b]/50 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-[#00f2ea] focus:border-transparent outline-none transition-all"
                placeholder="Repite la nueva contraseña"
                value={confirmarPassword}
                onChange={(event) => setConfirmarPassword(event.target.value)}
                disabled={cargando}
                minLength={6}
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="w-full py-3 px-4 bg-gradient-to-r from-[#2563eb] to-[#00f2ea] text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 transition-all duration-300 hover:scale-[1.02] hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cargando ? 'RESTABLECIENDO...' : 'RESTABLECER CONTRASEÑA'}
            </button>
          </form>
        )}

        <div className="text-center">
          <Link to="/" className="text-sm text-slate-500 hover:text-[#00f2ea] transition-colors uppercase tracking-widest font-bold text-[10px]">
            ← Volver al inicio de sesión
          </Link>
        </div>

        <p className="text-center text-[10px] text-slate-600 uppercase tracking-tighter">
          © {new Date().getFullYear()} CLÍNICA PSICOLÓGICA RESILIENCIA
        </p>
      </div>
    </div>
  );
}
