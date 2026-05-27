import { Link } from 'react-router-dom';
import { useForgotPassword } from '../hooks/useForgotPassword';
import logoClinica from '../assets/logo-clinica.png';

export default function ForgotPassword() {
    // Extraemos la lógica delegada
    const { email, setEmail, cargando, handleSubmit } = useForgotPassword();

    return (
        <div className="min-h-screen bg-[#0a0f18] flex items-center justify-center p-4">
            <div className="w-full max-w-md space-y-8 bg-[#111827]/50 p-10 rounded-3xl border border-slate-800 backdrop-blur-xl shadow-2xl">
                
                <div className="text-center">
                    <img src={logoClinica} alt="Logo" className="mx-auto h-32 w-auto mb-4 drop-shadow-lg" />
                    <h2 className="text-2xl font-bold text-white font-serif -mt-8">Recuperar Acceso</h2>
                    <p className="text-slate-400 text-sm mt-2">Ingresa tu correo electrónico de especialista</p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-[#00f2ea] uppercase tracking-widest ml-1">
                            Correo Electrónico
                        </label>
                        <input 
                            required 
                            type="email" 
                            className="w-full px-4 py-3 bg-[#1e293b]/50 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-[#00f2ea] focus:border-transparent outline-none transition-all"
                            placeholder="ejemplo123@gmail.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={cargando}
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={cargando}
                        className="w-full py-3 px-4 bg-gradient-to-r from-[#2563eb] to-[#00f2ea] text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 transition-all duration-300 hover:scale-[1.02] hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {cargando ? 'ENVIANDO...' : 'ENVIAR ENLACE DE RECUPERACIÓN'}
                    </button>
                </form>

                <div className="text-center">
                    {/* El Link apunta a "/" para regresar a Presentacion.tsx */}
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