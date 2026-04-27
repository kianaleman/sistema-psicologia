import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { iniciarCronJobs } from './cron/scheduler.js';

// Importar Middlewares de Seguridad
import { verificarToken } from './middlewares/auth.middleware.js';
import { permitirRoles } from './middlewares/role.middleware.js'; // 🟢 1. IMPORTAR EL NUEVO MIDDLEWARE

// Importar Rutas Modulares
import authRoutes from './routes/auth.routes.js';
import pacienteRoutes from './routes/paciente.routes.js';
import citaRoutes from './routes/cita.routes.js';
import sesionRoutes from './routes/sesion.routes.js';
import psicologoRoutes from './routes/psicologo.routes.js';
import tutorRoutes from './routes/tutor.routes.js';
import generalRoutes from './routes/general.routes.js';
import reciboRoutes from './routes/recibo.routes.js';
import configuracionRoutes from './routes/configuracion.routes.js';

const app = express();
const PORT = 3000;

// Middlewares
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true 
}));

app.use(cookieParser());
app.use(express.json());

// --- CONEXIÓN DE RUTAS ---

// 🟢 RUTA DE AUTENTICACIÓN (PÚBLICA)
app.use('/api/auth', authRoutes);

// 🔒 MÓDULOS CON ACCESO COMPARTIDO (Admin y Psicólogo)
// Rol 1: Administrador, Rol 2: Psicólogo
app.use('/api/pacientes', verificarToken, permitirRoles(1, 2), pacienteRoutes);
app.use('/api/citas', verificarToken, permitirRoles(1, 2), citaRoutes);
app.use('/api/sesiones', verificarToken, permitirRoles(1, 2), sesionRoutes);
app.use('/api/tutores', verificarToken, permitirRoles(1, 2), tutorRoutes);

// 🔒 MÓDULOS RESTRINGIDOS (Solo Administrador - Rol 1)
// 🔴 El Psicólogo (Rol 2) recibirá un error 403 si intenta acceder aquí
app.use('/api/psicologos', verificarToken, permitirRoles(1), psicologoRoutes);
app.use('/api/facturas', verificarToken, permitirRoles(1), reciboRoutes);
app.use('/api/config', verificarToken, permitirRoles(1), configuracionRoutes);

// 🔓 Rutas Generales (Dashboard, Catálogos)
app.use('/api/general', verificarToken, permitirRoles(1, 2), generalRoutes);

// --- INICIO DEL SERVIDOR ---
app.listen(PORT, () => {
  console.log(`🚀 Servidor ONLINE en http://localhost:${PORT}`);
  console.log(`🔐 Seguridad por Roles (RBAC) activada correctamente.`);
  iniciarCronJobs();
});