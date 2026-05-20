import cron from 'node-cron';
import { EmailService } from '../src/services/email.service.js';
import { CitaService } from '../src/services/cita.service.js';

// 🟢 TAREA 0: Monitoreo cada hora (Alertas Inmediatas)
cron.schedule('0 * * * *', async () => {
    try {
        console.log('Verificando citas olvidadas para alertas inmediatas...');
        const citasOlvidadas = await CitaService.obtenerPendientesHoy();
        
        const ahora = new Date();
        const retrasoLimite = 2; 

        const citasParaAvisar = citasOlvidadas.filter((c: any) => {
            const horaCita = new Date(c.HoraCita);
            const diferencia = (ahora.getTime() - horaCita.getTime()) / (1000 * 60 * 60);
            // 🟢 Validamos que el Usuario y el Email existan antes de procesar
            return diferencia >= retrasoLimite && c.Psicologo?.Usuario?.Email;
        });

        if (citasParaAvisar.length > 0) {
            for (const cita of citasParaAvisar) {
                // 🟢 Usamos encadenamiento opcional ?. para evitar el error de "posiblemente null"
                const emailDestino = cita.Psicologo?.Usuario?.Email;
                if (emailDestino) {
                    await EmailService.sendDailySummary(
                        emailDestino, 
                        cita.Psicologo.Nombre, 
                        [{
                            Paciente: { Nombre: cita.Paciente.Nombre, Apellido: cita.Paciente.Apellido },
                            HoraCita: cita.HoraCita
                        }], 
                        false
                    );
                }
            }
        }
    } catch (error) {
        console.error('Error en Job de alertas por hora:', error);
    }
}, { timezone: "America/Managua" });

// TAREA 1: Enviar resúmenes (8:30 PM)
cron.schedule('15 20 * * *', async () => {
    try {
        console.log('Generando resúmenes de citas pendientes...');
        const citasPendientes = await CitaService.obtenerPendientesHoy();

        if (citasPendientes && citasPendientes.length > 0) {
            const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER || '';
            
            const citasFormateadas = citasPendientes.map((c: any) => ({
                Paciente: { Nombre: c.Paciente.Nombre, Apellido: c.Paciente.Apellido },
                HoraCita: c.HoraCita,
                Psicologo: { Apellido: c.Psicologo.Apellido }
            }));

            await EmailService.sendDailySummary(adminEmail, 'Administrador', citasFormateadas, true);

            const citasPorPsicologo = citasPendientes.reduce((acc: any, cita: any) => {
                // 🟢 Validación de seguridad para evitar el error de null
                const email = cita.Psicologo?.Usuario?.Email;
                if (!email) return acc;

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
cron.schedule('59 23 * * *', async () => {
    try {
        const total = await CitaService.marcarCitasComoNoProcesadas();
        console.log(`Jornada cerrada: ${total} citas marcadas como No Procesadas.`);
    } catch (error) {
        console.error('Error en cierre de jornada:', error);
    }
}, { timezone: "America/Managua" });