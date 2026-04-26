import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// Asegúrate de que el archivo exista en assets para evitar error de compilación
import logoClinica from '../assets/logo-clinica.png'; 

export default function Presentacion() {
  const navigate = useNavigate();
  const [fechaHora, setFechaHora] = useState(new Date());

  // Reloj en tiempo real
  useEffect(() => {
    const timer = setInterval(() => setFechaHora(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Formatos elegantes para Nicaragua
  const fechaFormatoLargo = fechaHora.toLocaleDateString('es-ES', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
  
  const horaFormato = fechaHora.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit',
    hour12: true 
  });

  return (
    <div 
      onClick={() => navigate('/dashboard')} 
      className="h-screen w-full bg-slate-900 text-white cursor-pointer grid grid-cols-1 lg:grid-cols-2 relative overflow-hidden selection:bg-transparent animate-in fade-in duration-700"
    >
      {/* Fondos Decorativos con Blur */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] z-0"></div>
      <div className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[100px] z-0"></div>

      {/* --- COLUMNA IZQUIERDA: LOGO --- */}
      <div className="h-full flex items-center justify-center p-8 lg:p-20 z-20 order-2 lg:order-1">
        <div className="relative group">
          {/* Brillo detrás del logo */}
          <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-3xl group-hover:bg-emerald-500/30 transition-colors"></div>
          <img 
              src={logoClinica} 
              alt="Logotipo Clínica Resiliencia" 
              className="relative w-full max-w-[280px] md:max-w-md lg:max-w-lg object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] transform transition-all duration-700 hover:scale-105"
          />
        </div>
      </div>

      {/* --- COLUMNA DERECHA: TEXTO --- */}
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

         {/* FECHA Y HORA */}
         <div className="space-y-2 mb-12 lg:mb-16 lg:border-r-4 border-slate-700 lg:pr-6 lg:ml-auto w-fit self-center lg:self-end">
            <p className="text-xl md:text-2xl font-light text-slate-400 capitalize tracking-wide">
              {fechaFormatoLargo}
            </p>
            <p className="text-5xl md:text-7xl lg:text-8xl font-mono font-black text-white tracking-tighter">
              {horaFormato}
            </p>
         </div>

         {/* INDICADOR DE ACCESO */}
         <div className="flex flex-col items-center lg:items-end gap-3 text-slate-500 group self-center lg:self-end">
            <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] group-hover:text-emerald-400 transition-colors animate-pulse">
              Click en cualquier parte para iniciar
            </span>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              strokeWidth={1.5} 
              stroke="currentColor" 
              className="w-6 h-6 md:w-8 md:h-8 transform group-hover:translate-x-2 transition-transform"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
         </div>
      </div>
    </div>
  );
}