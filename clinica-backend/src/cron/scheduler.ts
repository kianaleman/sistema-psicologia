import cron from 'node-cron';
import { CitaService } from '../services/cita.service.js';

export const iniciarCronJobs = () => {
  // Sintaxis Cron: "minuto hora dia mes dia_semana"
  // "*/1 * * * *" significa: Ejecutar cada 1 minuto
  cron.schedule('*/1 * * * *', async () => {
    try {
      await CitaService.procesarInasistencias();
    } catch (error) {
      console.error('Error en el Cron Job de Inasistencias:', error);
    }
  });

  console.log('Cron Scheduler iniciado: Revisión de citas cada 1 minuto.');
};
