import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Es buena práctica lanzar un error claro si falta la variable de entorno
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('Falta la variable de entorno JWT_SECRET');
}

interface RegisterDTO {
  email: string;
  passwordRaw: string;
  rolId: number; // Ej: 1 = Administrador, 2 = Psicologo, 3 = Recepcionista
  psicologoId?: number; // Opcional, si este usuario pertenece a un psicólogo existente
}

interface LoginDTO {
  email: string;
  passwordRaw: string;
}

export const AuthService = {
  
  register: async (data: RegisterDTO) => {
    // 1. Verificar si el correo ya existe
    const existeUser = await prisma.usuario.findUnique({
      where: { Email: data.email }
    });
    if (existeUser) throw new Error('Este correo electrónico ya está registrado.');

    // 2. Encriptar la contraseña (Cost Factor: 10 es el estándar seguro y rápido)
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(data.passwordRaw, saltRounds);

    // 3. Crear el Usuario y asignarle su Rol de forma transaccional
    return await prisma.$transaction(async (tx) => {
      const nuevoUsuario = await tx.usuario.create({
        data: {
          Email: data.email,
          PasswordHash: passwordHash,
          Activo: true,
          // Si el usuario es un psicólogo, lo vinculamos directamente
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

      // Retornamos los datos seguros (sin el hash de la contraseña)
      const { PasswordHash, ...usuarioSeguro } = nuevoUsuario;
      return usuarioSeguro;
    });
  },

  login: async (data: LoginDTO) => {
    // 1. Buscar al usuario con sus roles
    const usuario = await prisma.usuario.findUnique({
      where: { Email: data.email },
      include: {
        Usuario_Rol: { include: { Rol: true } },
        Psicologo: { select: { Nombre: true, Apellido: true } } // Traemos su info si es psicólogo
      }
    });

    if (!usuario) throw new Error('Credenciales inválidas');
    if (!usuario.Activo) throw new Error('Esta cuenta ha sido desactivada');

    // 2. Comparar la contraseña enviada con el Hash de la base de datos
    const passwordValida = await bcrypt.compare(data.passwordRaw, usuario.PasswordHash);
    if (!passwordValida) throw new Error('Credenciales inválidas');

    // 3. Extraer los roles para el Token
    const roles = usuario.Usuario_Rol.map(ur => ur.Rol.Nombre_Rol);

    // 4. Crear el Payload (Los datos que irán dentro del JWT)
    const payload = {
      idUsuario: usuario.ID_Usuario,
      email: usuario.Email,
      roles: roles,
      idPsicologo: usuario.ID_Usuario // Útil para filtrar las citas del psicólogo logueado
    };

    // 5. Firmar el Token
    const token = jwt.sign(payload, JWT_SECRET, { 
      expiresIn: (process.env.JWT_EXPIRES_IN || '8h') as any // Puedes configurar el tiempo de expiración desde las variables de entorno 
    });

    // 6. Retornar el token y la info útil
    return {
      token,
      usuario: {
        id: usuario.ID_Usuario,
        email: usuario.Email,
        roles: roles,
        nombre: usuario.Psicologo 
          ? `${usuario.Psicologo.Nombre} ${usuario.Psicologo.Apellido}` 
          : 'Administrador/Recepcionista'
      }
    };
  }
};