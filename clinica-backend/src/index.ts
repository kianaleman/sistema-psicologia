import express from 'express';
import cors from 'cors';

// Importar Rutas Modulares
import pacienteRoutes from './routes/paciente.routes';
import citaRoutes from './routes/cita.routes';
import sesionRoutes from './routes/sesion.routes';
import psicologoRoutes from './routes/psicologo.routes';
import tutorRoutes from './routes/tutor.routes';
import generalRoutes from './routes/general.routes';

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

// 2. Rutas Generales (Dashboard, Catálogos, Historial)
// Nota: Estas rutas no tienen un prefijo común fuerte, así que las montamos en /api
app.use('/api', generalRoutes); 

// --- INICIO DEL SERVIDOR ---
app.listen(PORT, () => {
  console.log(`🚀 Servidor ONLINE en http://localhost:${PORT}`);
  console.log(`📂 Arquitectura MVC cargada correctamente.`);
});