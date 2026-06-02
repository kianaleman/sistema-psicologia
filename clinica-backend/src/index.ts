import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { iniciarCronJobs } from './cron/scheduler.js';

import authRoutes from './routes/auth.routes.js';
import pacienteRoutes from './routes/paciente.routes.js';
import citaRoutes from './routes/cita.routes.js';
import sesionRoutes from './routes/sesion.routes.js';
import psicologoRoutes from './routes/psicologo.routes.js';
import tutorRoutes from './routes/tutor.routes.js';
import generalRoutes from './routes/general.routes.js';
import facturaRoutes from './routes/factura.routes.js';
import configuracionRoutes from './routes/configuracion.routes.js';
import auditoriaRoutes from './routes/auditoria.routes.js';

const app = express();
app.set('trust proxy', 1);

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(helmet());

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 200,
  message: {
    error: 'Demasiados intentos de inicio de sesión, intenta de nuevo en 1 hora.',
  },
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/pacientes', pacienteRoutes);
app.use('/api/citas', citaRoutes);
app.use('/api/sesiones', sesionRoutes);
app.use('/api/psicologos', psicologoRoutes);
app.use('/api/tutores', tutorRoutes);
app.use('/api/facturas', facturaRoutes);
app.use('/api/config', configuracionRoutes);
app.use('/api/general', generalRoutes);
app.use('/api/auditoria', auditoriaRoutes);

app.listen(PORT, () => {
  console.log(`Servidor ONLINE en http://localhost:${PORT}`);
  console.log('Sistema de Seguridad JWT y Módulos cargados correctamente.');
  console.log('Arquitectura MVC conectada.');
  iniciarCronJobs();
});
