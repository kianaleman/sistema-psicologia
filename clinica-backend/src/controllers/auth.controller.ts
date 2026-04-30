import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { EmailService } from '../services/email.service.js';

const prisma = new PrismaClient();

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    // 1. Buscar usuario e INCLUIR su Rol
    const usuario = await prisma.usuario.findUnique({
      where: { Email: email },
      include: {
        Usuario_Rol: true
      }
    });

    // 2. Validar existencia y estado activo
    if (!usuario || usuario.Activo !== true) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // 3. Validar VERIFICACIÓN
    if (usuario.Verificado === false) {
      return res.status(403).json({
        error: 'Cuenta no verificada. Por favor, revisa tu correo para activar tu perfil.'
      });
    }

    // 4. Comparar contraseñas
    const validPassword = await bcrypt.compare(password, usuario.PasswordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const idRol = usuario.Usuario_Rol[0]?.ID_Rol;

    // 5. Crear Token JWT
    const token = jwt.sign(
      { id: usuario.ID_Usuario, idRol: idRol },
      process.env.JWT_SECRET!,
      { expiresIn: '8h' }
    );

    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 8 * 60 * 60 * 1000
    });

    // 🟢 ENVIAR RESPUESTA ÚNICA AL CLIENTE
    res.json({
      message: 'Bienvenido a Resiliencia',
      token: token,
      user: {
        id: usuario.ID_Usuario,
        email: usuario.Email,
        idRol: idRol,
        // Si Ultimo_Acceso es NULL, el frontend lo obliga a cambiar clave
        debeCambiarPassword: usuario.Ultimo_Acceso === null
      }
    });

    // 🟢 ACTUALIZAR ÚLTIMO ACCESO (Después de la respuesta)
    await prisma.usuario.update({
      where: { ID_Usuario: usuario.ID_Usuario },
      data: { Ultimo_Acceso: new Date() }
    });

  } catch (error) {
    console.error(error);
    // Verificamos si ya se envió respuesta para evitar errores de headers
    if (!res.headersSent) {
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;
  try {
    const usuario = await prisma.usuario.findUnique({ where: { Email: email } });
    if (!usuario) {
      return res.json({ message: 'Si el correo existe, recibirá un enlace de recuperación.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiracion = new Date(Date.now() + 3600000); // 1 hora

    await prisma.usuario.update({
      where: { Email: email },
      data: {
        ResetToken: token,
        ResetTokenExpire: expiracion
      }
    });

    await EmailService.sendResetPassword(email, token);
    res.json({ message: 'Enlace de recuperación enviado.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al procesar la solicitud' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;
  try {
    const usuario = await prisma.usuario.findFirst({
      where: {
        ResetToken: token,
        ResetTokenExpire: { gte: new Date() }
      }
    });

    if (!usuario) {
      return res.status(400).json({ error: 'Token inválido o expirado' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    await prisma.usuario.update({
      where: { ID_Usuario: usuario.ID_Usuario },
      data: {
        PasswordHash: hashedPassword,
        ResetToken: null,
        ResetTokenExpire: null,
        Verificado: true 
      }
    });

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar contraseña' });
  }
};

export const logout = (req: Request, res: Response) => {
  res.clearCookie('auth_token');
  res.json({ message: 'Sesión cerrada' });
};