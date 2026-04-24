import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// --- IMPORTACIÓN DE LA IMAGEN ---
// Asegúrate de que la ruta coincida con donde guardaste tu archivo.
// Ejemplo: si está en src/assets/logo.png, sería '../assets/logo.png'
import logoClinica from '../assets/logo-clinica.png'; 

export default function Presentacion() {
  const navigate = useNavigate();
  const [fechaHora, setFechaHora] = useState(new Date());

  // Reloj en tiempo real
  useEffect(() => {
    const timer = setInterval(() => setFechaHora(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Formatos
  const fechaFormatoLargo = fechaHora.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const horaFormato = fechaHora.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div 
      onClick={() => navigate('/dashboard')} 
      // CAMBIO DE LAYOUT: Usamos Grid para dividir la pantalla en 2 columnas en desktop
      className="h-screen w-full bg-slate-900 text-white cursor-pointer grid grid-cols-1 lg:grid-cols-2 relative overflow-hidden selection:bg-transparent animate-fade-in"
    >
      {/* Fondos Decorativos Sutiles */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-600/10 rounded-full blur-3xl z-0"></div>
      <div className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-3xl z-0"></div>

      {/* --- COLUMNA IZQUIERDA: LOGO --- */}
      {/* Centrado vertical y horizontalmente */}
      <div className="h-full flex items-center justify-center p-12 lg:p-20 z-20 animate-fade-in-right">
        <img 
            src={logoClinica} 
            alt="Logotipo Clínica Resiliencia" 
            // Clases para que el logo se vea elegante y responsivo
            className="w-full max-w-md md:max-w-lg object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-500"
        />
      </div>

      {/* --- COLUMNA DERECHA: CONTENIDO DE TEXTO --- */}
      {/* Flex column para centrar verticalmente el bloque de texto */}
      <div className="h-full flex flex-col justify-center z-10 text-right p-8 md:pr-24 lg:pr-32 animate-fade-in-left">
         
         {/* 1. TÍTULO Y SUBTÍTULO */}
         <div className="mb-12">
            <h2 className="text-emerald-400 font-bold tracking-[0.3em] uppercase text-sm mb-4 flex justify-end items-center gap-3">
               <span className="w-12 h-[1px] bg-emerald-500/50"></span>
               Sistema Clínico
            </h2>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-bold leading-tight text-white drop-shadow-2xl">
              Clínica Psicológica <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Resiliencia</span>
            </h1>
         </div>

         {/* 2. FECHA Y HORA */}
         <div className="space-y-2 mb-16 border-r-4 border-slate-700 pr-6 ml-auto w-fit">
            <p className="text-2xl md:text-3xl font-light text-slate-300 capitalize tracking-wide">{fechaFormatoLargo}</p>
            <p className="text-6xl md:text-8xl font-mono font-bold text-white tracking-tighter">{horaFormato}</p>
         </div>

         {/* 3. INDICADOR DE ACCESO */}
         <div className="animate-pulse flex flex-col items-end gap-3 text-slate-500 group ml-auto w-fit">
            <span className="text-sm font-medium uppercase tracking-widest group-hover:text-emerald-400 transition-colors">Toque en cualquier parte para acceder</span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
         </div>
      </div>
    </div>
  );
}