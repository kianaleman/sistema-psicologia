import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto'; // Módulo nativo de Node.js para criptografía

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('Falta la variable de entorno JWT_SECRET');
}

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
  }
};