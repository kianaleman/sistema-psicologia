import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '../services/api';

export default function CambiarPasswordDefault() {
  const navigate = useNavigate();
  const [passwordNuevaRaw, setPasswordNuevaRaw] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [showPasswordNueva, setShowPasswordNueva] = useState(false);
  const [showConfirmacion, setShowConfirmacion] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nuevaPassword = passwordNuevaRaw.trim();
    const passwordConfirmada = confirmacion.trim();

    if (nuevaPassword.length < 6) {
      toast.error('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (nuevaPassword !== passwordConfirmada) {
      toast.error('Las contraseñas no coinciden.');
      return;
    }

    try {
      setLoading(true);

      const response = await api.auth.cambiarPasswordDefault(nuevaPassword);

      localStorage.setItem('token', response.token);
      localStorage.setItem('usuario', JSON.stringify(response.usuario));

      toast.success(response.message || 'Contraseña actualizada correctamente.');
      navigate('/dashboard', { replace: true });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al cambiar la contraseña';
      toast.error(message);
      console.error('Error cambiando contraseña por defecto:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelarSesion = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    navigate('/', { replace: true });
  };

  const passwordsCoinciden =
    passwordNuevaRaw.length > 0 &&
    confirmacion.length > 0 &&
    passwordNuevaRaw.trim() === confirmacion.trim();

  const passwordsNoCoinciden =
    passwordNuevaRaw.length > 0 &&
    confirmacion.length > 0 &&
    passwordNuevaRaw.trim() !== confirmacion.trim();

  return (
    <div className="min-h-screen w-full bg-slate-950 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl shadow-2xl p-8">
        <div className="mb-8">
          <p className="text-emerald-400 text-xs font-black uppercase tracking-[0.2em] mb-2">
            Seguridad de la cuenta
          </p>
          <h1 className="text-3xl font-serif font-bold">Cambiar contraseña</h1>
          <p className="text-slate-400 text-sm mt-2">
            Debes definir una contraseña nueva antes de ingresar al sistema.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] ml-2">
              Nueva contraseña
            </label>

            <div className="relative">
              <input
                type={showPasswordNueva ? 'text' : 'password'}
                required
                minLength={6}
                value={passwordNuevaRaw}
                onChange={(event) => setPasswordNuevaRaw(event.target.value)}
                className="w-full bg-white/5 border border-white/10 p-4 pr-24 rounded-2xl focus:outline-none focus:border-blue-500 focus:bg-white/10 transition-all"
                disabled={loading}
                autoComplete="new-password"
              />

              <button
                type="button"
                disabled={loading}
                onClick={() => setShowPasswordNueva((prev) => !prev)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-blue-400 transition-colors disabled:opacity-50"
              >
                {showPasswordNueva ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] ml-2">
              Confirmar contraseña
            </label>

            <div className="relative">
              <input
                type={showConfirmacion ? 'text' : 'password'}
                required
                minLength={6}
                value={confirmacion}
                onChange={(event) => setConfirmacion(event.target.value)}
                className={`w-full bg-white/5 border p-4 pr-24 rounded-2xl focus:outline-none focus:bg-white/10 transition-all ${
                  passwordsNoCoinciden
                    ? 'border-red-500 focus:border-red-500'
                    : passwordsCoinciden
                      ? 'border-emerald-500 focus:border-emerald-500'
                      : 'border-white/10 focus:border-emerald-500'
                }`}
                disabled={loading}
                autoComplete="new-password"
              />

              <button
                type="button"
                disabled={loading}
                onClick={() => setShowConfirmacion((prev) => !prev)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-emerald-400 transition-colors disabled:opacity-50"
              >
                {showConfirmacion ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>

            {passwordsCoinciden && (
              <p className="text-xs text-emerald-400 ml-2">
                Las contraseñas coinciden.
              </p>
            )}

            {passwordsNoCoinciden && (
              <p className="text-xs text-red-400 ml-2">
                Las contraseñas no coinciden.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || passwordsNoCoinciden}
            className="w-full mt-6 py-4 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-2xl font-bold text-sm tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'ACTUALIZANDO...' : 'GUARDAR NUEVA CONTRASEÑA'}
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={handleCancelarSesion}
            className="w-full py-3 text-sm text-slate-400 hover:text-white transition-colors"
          >
            Cancelar y volver al inicio
          </button>
        </form>
      </div>
    </div>
  );
}
