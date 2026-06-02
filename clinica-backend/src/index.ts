import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { iniciarCronJobs } from './cron/scheduler.js';


// Importar Rutas Modulares (Con extensiones .js para ESM)
import authRoutes from './routes/auth.routes.js'; // <-- NUEVA RUTA DE AUTH
import pacienteRoutes from './routes/paciente.routes.js';
import citaRoutes from './routes/cita.routes.js';
import sesionRoutes from './routes/sesion.routes.js';
import psicologoRoutes from './routes/psicologo.routes.js';
import tutorRoutes from './routes/tutor.routes.js';
import generalRoutes from './routes/general.routes.js';
import facturaRoutes from './routes/factura.routes.js';
import configuracionRoutes from './routes/configuracion.routes.js';

const app = express();
app.set('trust proxy', 1); // Si estás detrás de un proxy (como Heroku), esto es importante para obtener la IP real del cliente
// El puerto dinámico es fundamental para despliegues en producción
const PORT = process.env.PORT || 3000; 

// Middlewares
app.use(cors());
app.use(express.json());


// ==========================================
// SEGURIDAD DE CABECERAS (HELMET)
// ==========================================
// Helmet oculta "X-Powered-By: Express" y añade cabeceras anti-XSS, 
// anti-clickjacking y protección contra descargas maliciosas.
app.use(helmet());


// ==========================================
// LIMITADOR DE PETICIONES GLOBAL (RATE LIMIT)
// ==========================================
// Previene ataques de Denegación de Servicio (DDoS) básicos.
// const limiterGlobal = rateLimit({
//   windowMs: 15 * 60 * 1000, // Ventana de 15 minutos
//   max: 100, // Límite de 100 peticiones por ventana por IP
//   message: { 
//     error: 'Demasiadas peticiones desde esta IP, por favor intenta de nuevo en 15 minutos.' 
//   },
//   standardHeaders: true, // Envía la información en las cabeceras `RateLimit-*`
//   legacyHeaders: false, // Desactiva las cabeceras antiguas `X-RateLimit-*`
// });

// // Aplicar el limitador global a todas las rutas
// app.use(limiterGlobal);


// Limitador estricto para autenticación (Rutas de Auth)

// Para evitar ataques de fuerza bruta adivinando contraseñas.
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // Ventana de 1 hora
  max: 2000, // Solo permite 5 intentos fallidos/peticiones por hora por IP
  message: { 
    error: 'Demasiados intentos de inicio de sesión, intenta de nuevo en 1 hora.' 
  }
});

// Aplicamos este limitador solo a las rutas de autenticación
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);

// --- CONEXIÓN DE RUTAS ---

// 0. Autenticación y Seguridad (Debe ir accesible)
app.use('/api/auth', authRoutes);

// 1. Módulos Principales (Protegidos internamente por su middleware)
app.use('/api/pacientes', pacienteRoutes);
app.use('/api/citas', citaRoutes);
app.use('/api/sesiones', sesionRoutes);
app.use('/api/psicologos', psicologoRoutes);
app.use('/api/tutores', tutorRoutes);
app.use('/api/facturas', facturaRoutes);
app.use('/api/config', configuracionRoutes);

// 2. Rutas Generales (Dashboard, Catálogos, Historial)
app.use('/api/general', generalRoutes);

// --- INICIO DEL SERVIDOR ---
app.listen(PORT, () => {
  console.log(`🚀 Servidor ONLINE en http://localhost:${PORT}`);
  console.log(`🔒 Sistema de Seguridad JWT y Módulos cargados correctamente.`);
  console.log(`📂 Arquitectura MVC conectada.`);
  iniciarCronJobs();
});