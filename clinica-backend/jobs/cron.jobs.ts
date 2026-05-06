import cron from 'node-cron';
import { EmailService } from '../src/services/email.service.js';
import { CitaService } from '../src/services/cita.service.js';

// TAREA 1: Enviar resúmenes (8:30 PM)
// Esta tarea busca las citas que quedaron en "limbo" y avisa al admin y psicólogos.
cron.schedule('30 20 * * *', async () => {
    try {
        console.log('Generando resúmenes de citas pendientes...');
        
        // 🟢 Usamos el nuevo método de tu CitaService
        const citasPendientes = await CitaService.obtenerPendientesHoy();

        if (citasPendientes && citasPendientes.length > 0) {
            // 1. Enviar resumen global al Administrador
            const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER || '';
            
            // Adaptamos el formato para el EmailService
            const citasFormateadas = citasPendientes.map((c: any) => ({
                Paciente: { Nombre: c.Paciente.Nombre, Apellido: c.Paciente.Apellido },
                HoraCita: c.HoraCita,
                Psicologo: { Apellido: c.Psicologo.Apellido }
            }));

            await EmailService.sendDailySummary(adminEmail, 'Administrador', citasFormateadas, true);

            // 2. Enviar resúmenes individuales a cada Psicólogo
            // Agrupamos las citas por el email del psicólogo para no mandar múltiples correos a la misma persona
            const citasPorPsicologo = citasPendientes.reduce((acc: any, cita: any) => {
                const email = cita.Psicologo.Usuario.Email;
                if (!acc[email]) acc[email] = { nombre: cita.Psicologo.Nombre, citas: [] };
                acc[email].citas.push(cita);
                return acc;
            }, {});

            for (const email in citasPorPsicologo) {
                const data = citasPorPsicologo[email];
                const citasPropias = data.citas.map((c: any) => ({
                    Paciente: { Nombre: c.Paciente.Nombre, Apellido: c.Paciente.Apellido },
                    HoraCita: c.HoraCita
                }));

                await EmailService.sendDailySummary(email, data.nombre, citasPropias, false);
            }
        }
    } catch (error) {
        console.error('Error en Job de resúmenes:', error);
    }
}, { timezone: "America/Managua" });

// TAREA 2: Cierre oficial (11:59 PM)
// Cambia el estado de Pendiente (1) a No Procesada (5) automáticamente.
cron.schedule('59 23 * * *', async () => {
    try {
        const total = await CitaService.marcarCitasComoNoProcesadas();
        console.log(`Jornada cerrada: ${total} citas marcadas como No Procesadas.`);
    } catch (error) {
        console.error('Error en cierre de jornada:', error);
    }
}, { timezone: "America/Managua" });