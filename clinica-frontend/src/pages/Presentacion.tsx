import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { toast } from 'sonner';
import logoClinica from '../assets/logo_resiliencia.png';

export default function Presentacion() {
  const navigate = useNavigate();
  const [fechaHora, setFechaHora] = useState(new Date());

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setFechaHora(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post<any>('/auth/login', { email, password });
      
      const { user, token } = response;

      if (user && token) {
        const roleId = user.idRol || user.ID_Rol;
        const userId = user.id || user.ID_Usuario;

        localStorage.setItem('token', token);
        localStorage.setItem('user_role', String(roleId));
        localStorage.setItem('user_id', String(userId));

        if (user.debeCambiarPassword) {
          toast.info("Por seguridad, debe actualizar su contraseña temporal.");
          navigate('/forgot-password'); 
        } else {
          const nombreRol = roleId === 1 ? 'Administrador' : 'Especialista';
          toast.success(`Bienvenido, acceso como ${nombreRol}`);
          navigate('/dashboard');
        }
      } else {
        throw new Error("Respuesta del servidor incompleta");
      }
    } catch (error: any) {
      console.error("Error en Login:", error);
      toast.error(
        error.response?.data?.error || 
        error.message || 
        "Error de conexión"
      );
    } finally {
      setLoading(false);
    }
  };

  const fechaFormatoLargo = fechaHora.toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  const horaFormato = fechaHora.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
  });

  return (
    <div className="h-screen w-full bg-slate-950 text-white grid grid-cols-1 lg:grid-cols-2 relative overflow-hidden animate-in fade-in duration-700">

      {/* Fondos Decorativos */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] z-0"></div>
      <div className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[100px] z-0"></div>

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
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] ml-2">Contraseña</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl focus:outline-none focus:border-blue-500 focus:bg-white/10 transition-all placeholder:text-slate-600"
              />
              <div className="flex justify-end pr-2">
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
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-2xl font-bold text-sm tracking-widest 
                         transition-all duration-300 ease-in-out border-none outline-none appearance-none overflow-hidden
                         hover:scale-[1.01] hover:brightness-110 active:scale-[0.98] 
                         disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-blue-900/20"
            >
              {loading ? <span className="loading loading-spinner loading-sm"></span> : 'INICIAR SESIÓN'}
            </button>
          </form>

          <p className="text-center text-[10px] text-slate-500 uppercase tracking-widest mt-8">
            © 2026 Clínica Psicológica Resiliencia
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