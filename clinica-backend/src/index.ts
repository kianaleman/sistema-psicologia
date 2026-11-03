import { createApp } from './app.js';
import { iniciarCronJobs } from './cron/scheduler.js';

const app = createApp();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor ONLINE en http://localhost:${PORT}`);
  console.log('Sistema de Seguridad JWT y Módulos cargados correctamente.');
  console.log('Arquitectura MVC conectada.');
  iniciarCronJobs();
});
