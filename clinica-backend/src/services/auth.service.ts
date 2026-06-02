import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('Falta la variable de entorno JWT_SECRET');
}

const ROLES = {
  ADMINISTRADOR: 'Administrador',
  PSICOLOGO: 'Psicologo',
  RECEPCION: 'Recepcion',
} as const;

const getFechaHoraLocalSistema = () => {
  const fecha = new Date();

  return new Date(fecha.getTime() - fecha.getTimezoneOffset() * 60000);
};

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

interface RegisterDTO {
  email: string;
  rolId: number;
  psicologoId?: number;
}

interface LoginDTO {
  email: string;
  passwordRaw: string;
}

interface CambiarPasswordDTO {
  idUsuario: number;
  passwordNuevaRaw: string;
}

type UsuarioTokenData = {
  idUsuario: number;
  email: string;
  roles: string[];
  idPsicologo: number | null;
  requiereCambioPassword: boolean;
};

const firmarToken = (payload: UsuarioTokenData) => {
  const expiresIn = (process.env.JWT_EXPIRES_IN || '8h') as NonNullable<jwt.SignOptions['expiresIn']>;

  return jwt.sign(payload, JWT_SECRET as jwt.Secret, {
    expiresIn,
  });
};

const construirSesionUsuario = async (idUsuario: number) => {
  const usuario = await prisma.usuario.findUnique({
    where: {
      ID_Usuario: idUsuario,
    },
    include: {
      Usuario_Rol: {
        include: {
          Rol: true,
        },
      },
      Psicologo: {
        select: {
          ID_Psicologo: true,
          Nombre: true,
          Apellido: true,
        },
      },
    },
  });

  if (!usuario) {
    throw new Error('Usuario no encontrado.');
  }

  const roles = usuario.Usuario_Rol.map((usuarioRol) => usuarioRol.Rol.Nombre_Rol);
  const requiereCambioPassword = Boolean(usuario.RequiereCambioPassword);
  const idPsicologo = usuario.Psicologo?.ID_Psicologo || null;
  const esAdmin = roles.includes(ROLES.ADMINISTRADOR);
  const esPsicologo = roles.includes(ROLES.PSICOLOGO);
  const esRecepcion = roles.includes(ROLES.RECEPCION);

  const payload: UsuarioTokenData = {
    idUsuario: usuario.ID_Usuario,
    email: usuario.Email,
    roles,
    idPsicologo,
    requiereCambioPassword,
  };

  const token = firmarToken(payload);

  return {
    token,
    requiereCambioPassword,
    usuario: {
      id: usuario.ID_Usuario,
      email: usuario.Email,
      roles,
      idPsicologo,
      requiereCambioPassword,
      esAdmin,
      esPsicologo,
      esRecepcion,
      nombre: usuario.Psicologo
        ? `${usuario.Psicologo.Nombre} ${usuario.Psicologo.Apellido}`
        : 'Administrador/Recepcionista',
    },
  };
};

export const AuthService = {
  register: async (data: RegisterDTO) => {
    const email = data.email.trim().toLowerCase();

    const existeUser = await prisma.usuario.findUnique({
      where: {
        Email: email,
      },
    });

    if (existeUser) {
      throw new Error('Este correo electrónico ya está registrado.');
    }

    const rol = await prisma.rol.findUnique({
      where: {
        ID_Rol: data.rolId,
      },
      select: {
        ID_Rol: true,
        Nombre_Rol: true,
      },
    });

    if (!rol) {
      throw new Error('El rol seleccionado no existe.');
    }

    if (rol.Nombre_Rol === ROLES.PSICOLOGO && !data.psicologoId) {
      throw new Error('Debe vincular un perfil de psicólogo para usuarios con rol Psicologo.');
    }

    const passwordTemporal = crypto.randomBytes(5).toString('hex');
    const passwordHash = await bcrypt.hash(passwordTemporal, 10);

    return await prisma.$transaction(async (tx) => {
      const nuevoUsuario = await tx.usuario.create({
        data: {
          Email: email,
          PasswordHash: passwordHash,
          Fecha_Creacion: getFechaHoraLocalSistema(),
          Ultimo_Acceso: null,
          Activo: true,
          ResetToken: null,
          ResetTokenExpire: null,
          Verificado: true,
          RequiereCambioPassword: true,
          ...(data.psicologoId
            ? {
                Psicologo: {
                  connect: {
                    ID_Psicologo: data.psicologoId,
                  },
                },
              }
            : {}),
        },
      });

      await tx.usuario_Rol.create({
        data: {
          ID_Usuario: nuevoUsuario.ID_Usuario,
          ID_Rol: rol.ID_Rol,
        },
      });

      return {
        id: nuevoUsuario.ID_Usuario,
        email: nuevoUsuario.Email,
        rol: rol.Nombre_Rol,
        passwordTemporal,
      };
    });
  },

  login: async (data: LoginDTO) => {
    const usuario = await prisma.usuario.findUnique({
      where: {
        Email: data.email.trim().toLowerCase(),
      },
      include: {
        Usuario_Rol: {
          include: {
            Rol: true,
          },
        },
        Psicologo: {
          select: {
            ID_Psicologo: true,
            Nombre: true,
            Apellido: true,
          },
        },
      },
    });

    if (!usuario) {
      throw new Error('Credenciales inválidas');
    }

    if (!usuario.Activo) {
      throw new Error('Esta cuenta ha sido desactivada');
    }

    const passwordValida = await bcrypt.compare(data.passwordRaw, usuario.PasswordHash);

    if (!passwordValida) {
      throw new Error('Credenciales inválidas');
    }

    await prisma.usuario.update({
      where: {
        ID_Usuario: usuario.ID_Usuario,
      },
      data: {
        Ultimo_Acceso: getFechaHoraLocalSistema(),
      },
    });

    return await construirSesionUsuario(usuario.ID_Usuario);
  },

  cambiarPasswordForzado: async (data: CambiarPasswordDTO) => {
    if (!data.passwordNuevaRaw || data.passwordNuevaRaw.trim().length < 6) {
      throw new Error('La nueva contraseña debe tener al menos 6 caracteres.');
    }

    const usuario = await prisma.usuario.findUnique({
      where: {
        ID_Usuario: data.idUsuario,
      },
    });

    if (!usuario) {
      throw new Error('Usuario no encontrado.');
    }

    const esMismaPassword = await bcrypt.compare(data.passwordNuevaRaw, usuario.PasswordHash);

    if (esMismaPassword) {
      throw new Error('La nueva contraseña no puede ser igual a la contraseña temporal.');
    }

    const nuevoHash = await bcrypt.hash(data.passwordNuevaRaw, 10);

    await prisma.usuario.update({
      where: {
        ID_Usuario: data.idUsuario,
      },
      data: {
        PasswordHash: nuevoHash,
        RequiereCambioPassword: false,
        Verificado: true,
        ResetToken: null,
        ResetTokenExpire: null,
      },
    });

    return {
      message: 'Contraseña actualizada correctamente. Ya puede utilizar el sistema.',
      ...(await construirSesionUsuario(data.idUsuario)),
    };
  },

  forgotPassword: async (email: string) => {
    const usuario = await prisma.usuario.findUnique({
      where: {
        Email: email.trim().toLowerCase(),
      },
    });

    if (!usuario) {
      return {
        message: 'Si el correo existe en nuestro sistema, recibirá un enlace de recuperación.',
      };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiracion = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.usuario.update({
      where: {
        ID_Usuario: usuario.ID_Usuario,
      },
      data: {
        ResetToken: resetToken,
        ResetTokenExpire: expiracion,
      },
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

    await transporter.sendMail({
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
      `,
    });

    return {
      message: 'Si el correo existe en nuestro sistema, recibirá un enlace de recuperación.',
    };
  },

  resetPassword: async (token: string, passwordNuevaRaw: string) => {
    if (!passwordNuevaRaw || passwordNuevaRaw.trim().length < 6) {
      throw new Error('La nueva contraseña debe tener al menos 6 caracteres.');
    }

    const usuario = await prisma.usuario.findFirst({
      where: {
        ResetToken: token,
        ResetTokenExpire: {
          gt: getFechaHoraLocalSistema(),
        },
      },
    });

    if (!usuario) {
      throw new Error('El enlace de recuperación es inválido o ya ha expirado.');
    }

    const nuevoHash = await bcrypt.hash(passwordNuevaRaw, 10);

    await prisma.usuario.update({
      where: {
        ID_Usuario: usuario.ID_Usuario,
      },
      data: {
        PasswordHash: nuevoHash,
        ResetToken: null,
        ResetTokenExpire: null,
        RequiereCambioPassword: false,
        Verificado: true,
      },
    });

    return {
      message: 'Tu contraseña ha sido restablecida exitosamente. Ya puedes iniciar sesión.',
    };
  },
};
