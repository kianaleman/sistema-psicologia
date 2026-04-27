import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    // 1. Buscar usuario e INCLUIR su Rol desde la tabla intermedia
    const usuario = await prisma.usuario.findUnique({
      where: { Email: email },
      include: {
        Usuario_Rol: true // 🟢 CRUCIAL: Para obtener el ID_Rol (1, 2 o 3)
      }
    });

    // 2. Validar existencia y estado
    if (!usuario || usuario.Activo !== true) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // 3. Comparar contraseñas
    const validPassword = await bcrypt.compare(password, usuario.PasswordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // 🟢 EXTRAER EL ROL (Tomamos el primero asignado)
    const idRol = usuario.Usuario_Rol[0]?.ID_Rol;

    // 4. Crear Token JWT incluyendo el ID_Rol
    const token = jwt.sign(
      { 
        id: usuario.ID_Usuario,
        idRol: idRol // 🟢 Ahora el token transporta el permiso (1=Admin, 2=Psicólogo)
      },
      process.env.JWT_SECRET!,
      { expiresIn: '8h' }
    );

    // 5. Enviar Cookie HttpOnly
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 8 * 60 * 60 * 1000 
    });

    // 6. Respuesta al cliente (🟢 CORREGIDO: Incluimos token e id en el JSON)
    res.json({ 
      message: 'Bienvenido a Resiliencia',
      token: token, // 🟢 Necesario para que el request de fetch en api.ts funcione
      user: { 
        id: usuario.ID_Usuario, // 🟢 Agregado para el localStorage.id
        email: usuario.Email,
        idRol: idRol, // 🟢 Informamos al frontend para ocultar menús
        debeCambiarPassword: usuario.Ultimo_Acceso === null // 🟢 Bandera de primer inicio
      } 
    });

    // 🟢 ACTUALIZAR ÚLTIMO ACCESO (Después de generar el token)
    await prisma.usuario.update({
      where: { ID_Usuario: usuario.ID_Usuario },
      data: { Ultimo_Acceso: new Date() }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const logout = (req: Request, res: Response) => {
  res.clearCookie('auth_token');
  res.json({ message: 'Sesión cerrada' });
};