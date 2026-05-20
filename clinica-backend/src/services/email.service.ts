import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// 🟢 Verificar conexión con el servidor de correos al arrancar
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Error de configuración de EmailService:', error);
  } else {
    console.log('✅ Servidor de correos listo para enviar mensajes');
  }
});

export const EmailService = {
  // Enviar link de recuperación
  sendResetPassword: async (email: string, token: string) => {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    const mailOptions = {
      from: `"Clínica Resiliencia" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Recuperación de Contraseña - Resiliencia',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px;">
          <h2 style="color: #1e293b; text-align: center;">Clínica Resiliencia</h2>
          <p>Hola,</p>
          <p>Has solicitado restablecer tu contraseña. Haz clic en el botón de abajo para elegir una nueva:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Restablecer mi contraseña
            </a>
          </div>
          <p style="font-size: 12px; color: #64748b;">Este enlace expirará en 1 hora. Si no solicitaste este cambio, puedes ignorar este correo de forma segura.</p>
        </div>
      `,
    };

    return await transporter.sendMail(mailOptions);
  },

  // 🟢 Enviar resumen diario de citas no procesadas
  sendDailySummary: async (email: string, nombreUsuario: string, citas: any[], esAdmin: boolean) => {
    try {
      console.log(`📧 Intentando enviar resumen a: ${email}...`);

      const listaCitasHtml = citas.map(c => `
        <li style="margin-bottom: 12px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; list-style: none;">
          <span style="color: #475569; font-size: 14px;">👤 <strong>Paciente:</strong> ${c.Paciente?.Nombre} ${c.Paciente?.Apellido}</span><br>
          <span style="color: #475569; font-size: 14px;">⏰ <strong>Hora:</strong> ${new Date(c.HoraCita).toLocaleTimeString('es-NI', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'UTC' })}</span>
          ${esAdmin ? `<br><span style="color: #64748b; font-size: 12px;">👨‍⚕️ <strong>Especialista:</strong> Dr. ${c.Psicologo?.Apellido || 'No asignado'}</span>` : ''}
        </li>
      `).join('');

      const mailOptions = {
        from: `"Clínica Resiliencia" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `⚠️ Resumen de Citas Pendientes - ${new Date().toLocaleDateString('es-NI')}`,
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 16px; padding: 30px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 20px;">
               <h2 style="color: #0f172a; margin: 0;">Clínica Resiliencia</h2>
               <p style="color: #64748b; font-size: 14px;">Gestión de Agenda Diaria</p>
            </div>
            <p style="color: #1e293b; font-size: 16px;">Hola, <strong>${nombreUsuario}</strong>.</p>
            <p style="color: #475569; font-size: 14px; line-height: 1.6;">Se han detectado las siguientes citas de hoy que aún no han sido gestionadas:</p>
            
            <div style="margin: 25px 0; background-color: #f8fafc; border-radius: 12px; padding: 20px; border: 1px solid #f1f5f9;">
              <ul style="padding: 0; margin: 0;">
                ${listaCitasHtml}
              </ul>
            </div>

            <div style="background-color: #fff7ed; border-left: 4px solid #f97316; padding: 15px; border-radius: 4px;">
              <p style="color: #9a3412; font-size: 13px; margin: 0;">
                <strong>⚠️ Nota importante:</strong> Estas citas pasarán automáticamente al estado <strong>"No Procesada"</strong> al finalizar el día (11:59 PM).
              </p>
            </div>
            
            <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-top: 30px;">
              Este es un correo automático generado por el sistema Resiliencia.
            </p>
          </div>
        `,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`✅ Correo enviado con éxito a ${email}: ${info.messageId}`);
      return info;
    } catch (error) {
      console.error(`❌ Error al enviar correo a ${email}:`, error);
      throw error;
    }
  }
};