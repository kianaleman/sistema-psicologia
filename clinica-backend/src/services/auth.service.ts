import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto'; // Módulo nativo de Node.js para criptografía
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('Falta la variable de entorno JWT_SECRET');
}

// Configuración del Transporter para Nodemailer (El Cartero)
const transporter = nodemailer.createTransport({
  service: 'gmail', // Puedes usar 'outlook' u otro dependiendo de tu correo
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

interface RegisterDTO {
  email: string;
  rolId: number;       // 1 = Administrador, 2 = Psicologo, 3 = Recepcionista
  psicologoId?: number; // Opcional, si está enlazado a un psicólogo
}

interface LoginDTO {
  email: string;
  passwordRaw: string;
}

interface CambiarPasswordDTO {
  idUsuario: number;
  passwordNuevaRaw: string;
}

export const AuthService = {
  
  // 1. Registro de Trabajadores con Contraseña Temporal Automática
  register: async (data: RegisterDTO) => {
    const existeUser = await prisma.usuario.findUnique({
      where: { Email: data.email }
    });
    if (existeUser) throw new Error('Este correo electrónico ya está registrado.');

    // Generamos una clave aleatoria de 10 caracteres alfanuméricos (ej: aB3x9ZqW1p)
    const passwordTemporal = crypto.randomBytes(5).toString('hex');

    // Encriptamos la contraseña temporal para guardarla en la BD
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(passwordTemporal, saltRounds);

    return await prisma.$transaction(async (tx) => {
      const nuevoUsuario = await tx.usuario.create({
        data: {
          Email: data.email,
          PasswordHash: passwordHash,
          Activo: true,
          RequiereCambioPassword: true, // Forzamos el cambio en su primer login
          // Vinculación opcional con la entidad psicólogo
          ID_Psicologo: data.psicologoId || null 
        }
      });

      // Insertar en la tabla intermedia Usuario_Rol
      await tx.usuario_Rol.create({
        data: {
          ID_Usuario: nuevoUsuario.ID_Usuario,
          ID_Rol: data.rolId
        }
      });

      // Retornamos los datos del usuario junto a la contraseña temporal en TEXTO PLANO
      // ¡Es crucial para que el administrador la pueda ver en pantalla una única vez!
      return {
        id: nuevoUsuario.ID_Usuario,
        email: nuevoUsuario.Email,
        passwordTemporal // El administrador copiará esto para dárselo al empleado
      };
    });
  },

  // 2. Login Interceptado por Semáforo de Seguridad
  login: async (data: LoginDTO) => {
    const usuario = await prisma.usuario.findUnique({
      where: { Email: data.email },
      include: {
        Usuario_Rol: { include: { Rol: true } },
        Psicologo: { select: { Nombre: true, Apellido: true } }
      }
    });

    if (!usuario) throw new Error('Credenciales inválidas');
    if (!usuario.Activo) throw new Error('Esta cuenta ha sido desactivada');

    const passwordValida = await bcrypt.compare(data.passwordRaw, usuario.PasswordHash);
    if (!passwordValida) throw new Error('Credenciales inválidas');

    const roles = usuario.Usuario_Rol.map(ur => ur.Rol.Nombre_Rol);

    // Creamos el payload clásico del JWT
    const payload = {
      idUsuario: usuario.ID_Usuario,
      email: usuario.Email,
      roles: roles,
      idPsicologo: usuario.ID_Usuario,
      requiereCambioPassword: usuario.RequiereCambioPassword // Viaja en el token para validación en backend
    };

    const token = jwt.sign(payload, JWT_SECRET, { 
      expiresIn: (process.env.JWT_EXPIRES_IN || '8h') as any
    });

    // Enviamos el flag 'requiereCambioPassword' en la raíz de la respuesta.
    // El Frontend leerá esto y sabrá si debe dejarlo entrar al Dashboard o mandarlo al formulario de cambio.
    return {
      token,
      requiereCambioPassword: usuario.RequiereCambioPassword,
      usuario: {
        id: usuario.ID_Usuario,
        email: usuario.Email,
        roles: roles,
        nombre: usuario.Psicologo 
          ? `${usuario.Psicologo.Nombre} ${usuario.Psicologo.Apellido}` 
          : 'Administrador/Recepcionista'
      }
    };
  },

  // 3. Método para actualizar la Contraseña Temporal por la Definitiva
  cambiarPasswordForzado: async (data: CambiarPasswordDTO) => {
    // Validamos que la nueva clave no esté vacía y cumpla con un mínimo de seguridad
    if (!data.passwordNuevaRaw || data.passwordNuevaRaw.trim().length < 6) {
      throw new Error('La nueva contraseña debe tener al menos 6 caracteres.');
    }

    const saltRounds = 10;
    const nuevoHash = await bcrypt.hash(data.passwordNuevaRaw, saltRounds);

    // Actualizamos la contraseña y apagamos el semáforo de cambio obligatorio
    await prisma.usuario.update({
      where: { ID_Usuario: data.idUsuario },
      data: {
        PasswordHash: nuevoHash,
        RequiereCambioPassword: false 
      }
    });

    return { message: 'Contraseña actualizada correctamente. Ya puede utilizar el sistema.' };
  },

  // 4. Solicitar recuperación (Genera token y envía correo)
  forgotPassword: async (email: string) => {
    // A. Buscamos al usuario
    const usuario = await prisma.usuario.findUnique({ where: { Email: email } });
    if (!usuario) {
      // Por seguridad, no decimos "El correo no existe", simplemente decimos que se envió el link
      return { message: 'Si el correo existe en nuestro sistema, recibirá un enlace de recuperación.' };
    }

    // B. Generamos un token criptográfico seguro (ej. 4b8f1... 64 caracteres)
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // C. Guardamos el token en la BD y definimos que expira en 15 minutos
    const expiracion = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos desde ahora

    await prisma.usuario.update({
      where: { ID_Usuario: usuario.ID_Usuario },
      data: {
        ResetToken: resetToken,
        ResetTokenExpire: expiracion
      }
    });

    // D. Enviamos el correo con el enlace
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: `"Clínica Resiliencia" <${process.env.EMAIL_USER}>`,
      to: usuario.Email,
      subject: 'Recuperación de Contraseña - Clínica Resiliencia',
      html: `
        <h2>Recuperación de Contraseña</h2>
        <p>Has solicitado restablecer tu contraseña en el sistema de la Clínica Resiliencia.</p>
        <p>Haz clic en el siguiente enlace para crear una nueva contraseña. <b>Este enlace expirará en 15 minutos.</b></p>
        <a href="${resetLink}" style="padding: 10px 15px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 5px;">Restablecer mi contraseña</a>
        <br><br>
        <p>Si no solicitaste este cambio, puedes ignorar este correo con seguridad.</p>
      `
    };

    await transporter.sendMail(mailOptions);

    return { message: 'Si el correo existe en nuestro sistema, recibirá un enlace de recuperación.' };
  },

  // 5. Validar token y Guardar nueva contraseña
  resetPassword: async (token: string, passwordNuevaRaw: string) => {
    if (!passwordNuevaRaw || passwordNuevaRaw.trim().length < 6) {
      throw new Error('La nueva contraseña debe tener al menos 6 caracteres.');
    }

    // A. Buscamos al usuario que tenga ESE token Y que NO haya expirado
    const usuario = await prisma.usuario.findFirst({
      where: {
        ResetToken: token,
        ResetTokenExpire: {
          gt: new Date() // El token debe ser mayor a la fecha/hora actual (no ha expirado)
        }
      }
    });

    if (!usuario) {
      throw new Error('El enlace de recuperación es inválido o ya ha expirado.');
    }

    // B. Encriptamos la nueva contraseña
    const saltRounds = 10;
    const nuevoHash = await bcrypt.hash(passwordNuevaRaw, saltRounds);

    // C. Actualizamos la BD: Guardamos la clave, y BORRAMOS los tokens por seguridad
    await prisma.usuario.update({
      where: { ID_Usuario: usuario.ID_Usuario },
      data: {
        PasswordHash: nuevoHash,
        ResetToken: null,
        ResetTokenExpire: null,
        RequiereCambioPassword: false // Ya la cambió, no es necesario forzarlo
      }
    });

    return { message: 'Tu contraseña ha sido restablecida exitosamente. Ya puedes iniciar sesión.' };
  }
};