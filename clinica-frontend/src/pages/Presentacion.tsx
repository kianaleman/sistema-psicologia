import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLogin } from '../hooks/useLogin';
import { useReloj } from '../hooks/useReloj';
import { formatearFechaLarga, formatearHoraConSegundos } from '../utils/formatters';

// --- IMPORTACIÓN DE LA IMAGEN ---
import logoClinica from '../assets/logo-clinica.png';

export default function Presentacion() {
  const { email, setEmail, password, setPassword, loading, handleLogin } = useLogin();
  const fechaHora = useReloj();

  // Estado local para alternar la visibilidad de la contraseña
  const [showPassword, setShowPassword] = useState(false);

  const fechaFormatoLargo = formatearFechaLarga(fechaHora);
  const horaFormato = formatearHoraConSegundos(fechaHora);

  return (
    <div className="h-screen w-full bg-slate-950 text-white grid grid-cols-1 lg:grid-cols-2 relative overflow-hidden animate-in fade-in duration-700">

      {/* Fondos Decorativos */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] z-0 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[100px] z-0 pointer-events-none"></div>

      {/* --- COLUMNA IZQUIERDA: FORMULARIO --- */}
      <div className="h-full flex items-center justify-center p-6 lg:p-20 z-20 order-2 lg:order-1 bg-slate-900/50 backdrop-blur-sm">
        <div className="w-full max-w-md space-y-8 animate-fade-in-up">

          <div className="flex flex-col items-center mb-8">
            <img src={logoClinica} alt="Logo" className="w-42 mb-0 drop-shadow-lg" />
            <h3 className="text-2xl font-serif font-bold -mt-1">Portal de Acceso</h3>
            <p className="text-slate-400 text-sm">Ingrese sus credenciales de especialista</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] ml-2">Correo Electrónico</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@resiliencia.com"
                className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl focus:outline-none focus:border-emerald-500 focus:bg-white/10 transition-all placeholder:text-slate-600"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] ml-2">Contraseña</label>
              
              {/* Contenedor relativo para posicionar el ojo */}
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"} // Alterna entre text y password
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 p-4 pr-14 rounded-2xl focus:outline-none focus:border-blue-500 focus:bg-white/10 transition-all placeholder:text-slate-600"
                  disabled={loading}
                />
                
                {/* Botón del Ojo */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-blue-400 focus:outline-none transition-colors"
                  title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? (
                    // Ojo abierto (Heroicons)
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  ) : (
                    // Ojo cerrado con línea (Heroicons)
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  )}
                </button>
              </div>

              <div className="flex justify-end pr-2 mt-1">
                <Link
                  to="/forgot-password"
                  className="text-[10px] font-bold text-slate-500 hover:text-blue-400 transition-colors uppercase tracking-widest"
                >
                  ¿Olvidó su contraseña?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 py-4 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-2xl font-bold text-sm tracking-widest 
                         transition-all duration-300 ease-in-out border-none outline-none appearance-none overflow-hidden
                         hover:scale-[1.01] hover:brightness-110 active:scale-[0.98] 
                         disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-blue-900/20"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                  <span>AUTENTICANDO...</span>
                </div>
              ) : 'INICIAR SESIÓN'}
            </button>
          </form>

          <p className="text-center text-[10px] text-slate-500 uppercase tracking-widest mt-8">
            © {new Date().getFullYear()} Clínica Psicológica Resiliencia
          </p>
        </div>
      </div>

      {/* --- COLUMNA DERECHA --- */}
      <div className="h-full flex flex-col justify-center z-10 text-center lg:text-right p-8 lg:pr-32 order-1 lg:order-2">
        <div className="mb-8 lg:mb-12">
          <h2 className="text-emerald-400 font-bold tracking-[0.3em] uppercase text-[10px] md:text-xs mb-4 flex justify-center lg:justify-end items-center gap-3">
            <span className="hidden lg:block w-12 h-[1px] bg-emerald-500/50"></span>
            Sistema de Gestión Clínica
          </h2>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold leading-tight text-white">
            Clínica Psicológica <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
              Resiliencia
            </span>
          </h1>
        </div>

        <div className="space-y-2 mb-12 lg:mb-16 lg:border-r-4 border-slate-700 lg:pr-6 lg:ml-auto w-fit self-center lg:self-end">
          <p className="text-xl md:text-2xl font-light text-slate-400 capitalize tracking-wide">
            {fechaFormatoLargo}
          </p>
          <p className="text-5xl md:text-7xl lg:text-8xl font-mono font-black text-white tracking-tighter">
            {horaFormato}
          </p>
        </div>
      </div>
    </div>
  );
}