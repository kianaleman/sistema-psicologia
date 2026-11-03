import { Prisma, type PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { ROLES } from '../security/roles.js';

export interface AdminInicialInput {
  email: string;
  passwordTemporal: string;
}

export const validarAdminInicial = (data: AdminInicialInput) => {
  const email = data.email.trim().toLowerCase();
  if (email.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Indique un correo válido para el administrador inicial.');
  }
  if (data.passwordTemporal.trim().length < 12 || Buffer.byteLength(data.passwordTemporal, 'utf8') > 72) {
    throw new Error('La contraseña temporal debe tener al menos 12 caracteres y como máximo 72 bytes.');
  }
  return { ...data, email };
};

export const crearAdministradorInicial = async (
  db: Pick<PrismaClient, '$transaction'>,
  input: AdminInicialInput,
) => {
  const data = validarAdminInicial(input);
  const passwordHash = await bcrypt.hash(data.passwordTemporal, 12);

  for (let intento = 0; ; intento += 1) {
    try {
      return await db.$transaction(async (tx) => {
        let rol = await tx.rol.findFirst({
          where: { Nombre_Rol: ROLES.ADMINISTRADOR },
          orderBy: { ID_Rol: 'asc' },
        });
        if (!rol) {
          rol = await tx.rol.create({ data: {
            Nombre_Rol: ROLES.ADMINISTRADOR,
            Descripcion: 'Administración del sistema',
          } });
        }

        let usuario = await tx.usuario.findUnique({ where: { Email: data.email } });
        const cuentaCreada = !usuario;
        if (!usuario) {
          usuario = await tx.usuario.create({ data: {
            Email: data.email,
            PasswordHash: passwordHash,
            Activo: true,
            Verificado: true,
            RequiereCambioPassword: true,
            ResetToken: null,
            ResetTokenExpire: null,
          } });
        }

        // La PK compuesta impide repetir la asociación incluso al reejecutar.
        await tx.usuario_Rol.upsert({
          where: { ID_Usuario_ID_Rol: { ID_Usuario: usuario.ID_Usuario, ID_Rol: rol.ID_Rol } },
          create: { ID_Usuario: usuario.ID_Usuario, ID_Rol: rol.ID_Rol },
          update: {},
        });
        return { idUsuario: usuario.ID_Usuario, cuentaCreada };
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error: unknown) {
      const code = typeof error === 'object' && error !== null && 'code' in error ? error.code : null;
      if (intento < 2 && (code === 'P2034' || code === 'P2002')) continue;
      throw error;
    }
  }
};
