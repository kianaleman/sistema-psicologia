import { PrismaClient, type Prisma } from '@prisma/client';
import type { AuthUserPayload } from '../middlewares/auth.middleware.js';

const prisma = new PrismaClient();

const validarUsuarioAutenticado = (usuario?: AuthUserPayload) => {
  if (!usuario) {
    throw new Error('Acceso no autorizado.');
  }

  return usuario;
};

const validarPsicologoVinculado = (usuario: AuthUserPayload) => {
  if (!usuario.idPsicologo) {
    throw new Error('El usuario psicólogo no tiene un perfil de psicólogo vinculado.');
  }

  return usuario.idPsicologo;
};

const construirWhereRecibosPermitidos = (usuario?: AuthUserPayload): Prisma.ReciboWhereInput => {
  const usuarioActual = validarUsuarioAutenticado(usuario);

  if (usuarioActual.esAdmin || usuarioActual.esRecepcion) {
    return {};
  }

  if (usuarioActual.esPsicologo) {
    return {
      Cita: {
        ID_Psicologo: validarPsicologoVinculado(usuarioActual),
      },
    };
  }

  throw new Error('No tiene permisos para consultar facturación.');
};

const reciboInclude = {
  MetodoPago: true,
  Divisa: true,
  Banco: true,
  Cita: {
    include: {
      Paciente: {
        include: {
          PacienteAdulto: true,
          Paciente_Menor: {
            include: {
              Tutor_PacienteMenor: {
                include: {
                  Tutor: true,
                },
              },
            },
          },
        },
      },
      Psicologo: true,
      TipoDeCita: true,
    },
  },
} satisfies Prisma.ReciboInclude;

export const FacturaService = {
  getAll: async (usuario?: AuthUserPayload) => {
    return await prisma.recibo.findMany({
      where: construirWhereRecibosPermitidos(usuario),
      include: reciboInclude,
      orderBy: {
        Cod_Recibo: 'desc',
      },
    });
  },

  getById: async (id: number, usuario?: AuthUserPayload) => {
    return await prisma.recibo.findFirst({
      where: {
        Cod_Recibo: id,
        ...construirWhereRecibosPermitidos(usuario),
      },
      include: reciboInclude,
    });
  },
};
