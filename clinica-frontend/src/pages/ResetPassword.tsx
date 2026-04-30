import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '../services/api';

export default function ResetPassword() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [passwords, setPasswords] = useState({ newPassword: '', confirm: '' });
    const [cargando, setCargando] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwords.newPassword !== passwords.confirm) {
            return toast.error("Las contraseñas no coinciden");
        }

        setCargando(true);
        try {
            await api.post('/auth/reset-password', { 
                token, 
                newPassword: passwords.newPassword 
            });
            toast.success("Contraseña actualizada con éxito");
            navigate('/login');
        } catch (error: any) {
            const mensaje = error.response?.data?.error || "El enlace ha expirado o es inválido";
            toast.error(mensaje);
        } finally {
            setCargando(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0f18] flex items-center justify-center p-4">
            <div className="w-full max-w-md space-y-8 bg-[#111827]/50 p-10 rounded-3xl border border-slate-800 backdrop-blur-xl shadow-2xl">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-white font-serif">Nueva Contraseña</h2>
                    <p className="text-slate-400 text-sm mt-2">Crea una credencial segura para tu cuenta</p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-[#00f2ea] uppercase tracking-widest ml-1">Nueva Contraseña</label>
                            <input 
                                required 
                                type="password" 
                                className="w-full px-4 py-3 bg-[#1e293b]/50 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-[#00f2ea] outline-none transition-all"
                                value={passwords.newPassword}
                                onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-[#00f2ea] uppercase tracking-widest ml-1">Confirmar Contraseña</label>
                            <input 
                                required 
                                type="password" 
                                className="w-full px-4 py-3 bg-[#1e293b]/50 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-[#00f2ea] outline-none transition-all"
                                value={passwords.confirm}
                                onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={cargando}
                        className="w-full py-3 px-4 bg-gradient-to-r from-[#2563eb] to-[#00f2ea] text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 transition-all duration-300 hover:scale-[1.02] hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {cargando ? 'ACTUALIZANDO...' : 'RESTABLECER CONTRASEÑA'}
                    </button>
                </form>
            </div>
        </div>
    );
}