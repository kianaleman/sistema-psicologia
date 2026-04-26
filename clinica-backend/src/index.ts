import express from 'express';
import cors from 'cors';
import { iniciarCronJobs } from './cron/scheduler.js'; // <--- IMPORTAR AQUÍ

// Importar Rutas Modulares
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
app.use(cors());
app.use(express.json());

// --- CONEXIÓN DE RUTAS ---

// 1. Módulos Principales
app.use('/api/pacientes', pacienteRoutes);
app.use('/api/citas', citaRoutes);
app.use('/api/sesiones', sesionRoutes);
app.use('/api/psicologos', psicologoRoutes);
app.use('/api/tutores', tutorRoutes);
app.use('/api/facturas', reciboRoutes);
app.use('/api/config', configuracionRoutes);

// 2. Rutas Generales (Dashboard, Catálogos, Historial)
// Nota: Estas rutas no tienen un prefijo común fuerte, así que las montamos en /api
app.use('/api', generalRoutes); 

app.use('/api/general', generalRoutes);

// --- INICIO DEL SERVIDOR ---
app.listen(PORT, () => {
  console.log(`🚀 Servidor ONLINE en http://localhost:${PORT}`);
  console.log(`📂 Arquitectura MVC cargada correctamente.`);
  iniciarCronJobs();
});