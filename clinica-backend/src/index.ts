import express from 'express';
import cors from 'cors';
import { iniciarCronJobs } from './cron/scheduler.js'; // <-- Extensión .js añadida

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
// El puerto dinámico es fundamental para despliegues en producción
const PORT = process.env.PORT || 3000; 

// Middlewares
app.use(cors());
app.use(express.json());

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