import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const prisma = new PrismaClient();

const getFechaHoraLocalSistema = () => {
  const fecha = new Date();

  return new Date(fecha.getTime() - fecha.getTimezoneOffset() * 60000);
};

type DireccionDTO = {
  municipioId?: number;
  barrio?: string;
  calle?: string;
};

type PsicologoInput = Record<string, unknown> & {
  nombre?: string;
  Nombre?: string;
  apellido?: string;
  Apellido?: string;
  codigoMinsa?: string;
  CodigoMinsa?: string;
  codigoTelefonoId?: number;
  ID_CodigoTelefono?: number;
  telefono?: string;
  No_Telefono?: string;
  email?: string;
  Email?: string;
  direccion?: DireccionDTO;
  especialidadIds?: Array<number | string>;
  activo?: boolean;
  Activo?: boolean;
};

interface CreatePsicologoDTO extends PsicologoInput {
  direccion: DireccionDTO;
}

interface UpdatePsicologoDTO extends PsicologoInput {}

const ROL_PSICOLOGO_ID = 2;

const esObjeto = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const obtenerTextoOpcional = (
  data: Record<string, unknown>,
  keys: string[],
) => {
  for (const key of keys) {
    const value = data[key];

    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return undefined;
};

const obtenerTextoRequerido = (
  data: Record<string, unknown>,
  keys: string[],
  fieldName: string,
) => {
  const value = obtenerTextoOpcional(data, keys);

  if (!value) {
    throw new Error(`${fieldName} es requerido.`);
  }

  return value;
};

const obtenerNumero = (
  data: Record<string, unknown>,
  keys: string[],
  defaultValue?: number,
) => {
  for (const key of keys) {
    const value = data[key];
    const numberValue = Number(value);

    if (Number.isInteger(numberValue) && numberValue > 0) {
      return numberValue;
    }
  }

  return defaultValue;
};

const validarEmail = (email: string) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!regex.test(email)) {
    throw new Error('El correo electrónico tiene un formato inválido.');
  }

  return email.toLowerCase();
};

const validarTelefonoNica = (telefono: string | undefined | null) => {
  if (!telefono) {
    throw new Error('El teléfono es obligatorio y no fue recibido.');
  }

  const limpio = String(telefono).replace(/[\s-]/g, '');
  const regex = /^[2578]\d{7}$/;

  if (!regex.test(limpio)) {
    throw new Error(`Teléfono inválido (${telefono}). Debe ser de 8 dígitos e iniciar con 2, 5, 7 u 8.`);
  }

  return limpio;
};

const normalizarDireccion = (direccion: unknown) => {
  if (!esObjeto(direccion)) {
    throw new Error('La dirección es requerida.');
  }

  const municipioId = Number(direccion.municipioId);
  const barrio = typeof direccion.barrio === 'string' ? direccion.barrio.trim() : '';
  const calle = typeof direccion.calle === 'string' ? direccion.calle.trim() : '';

  if (!Number.isInteger(municipioId) || municipioId <= 0) {
    throw new Error('El municipio de la dirección es requerido.');
  }

  if (!barrio) {
    throw new Error('El barrio de la dirección es requerido.');
  }

  return {
    municipioId,
    barrio,
    calle,
  };
};

const normalizarEspecialidades = (ids: unknown) => {
  if (!Array.isArray(ids)) return [];

  return ids
    .map((id) => Number(id))
    .filter((id) => Number.isInteger(id) && id > 0);
};

const generarPasswordTemporal = () => {
  return crypto.randomBytes(5).toString('hex');
};

const construirPsicologoRespuesta = async (
  psicologoId: number,
  email?: string | null,
  tx?: Prisma.TransactionClient,
) => {
  const client = tx || prisma;

  const psicologo = await client.psicologo.findUnique({
    where: { ID_Psicologo: psicologoId },
    include: {
      Direccion: {
        include: {
          Municipio: {
            include: {
              Departamento: true,
            },
          },
        },
      },
      CodigoTelefonoPais: true,
      Psicologo_EspecialidadPsicologo: {
        include: {
          EspecialidadPsicologo: true,
        },
      },
      Usuario: {
        select: {
          Email: true,
        },
      },
    },
  });

  if (!psicologo) {
    throw new Error('No se pudo recuperar el psicólogo registrado.');
  }

  const { Usuario, ...datosPsicologo } = psicologo;

  return {
    ...datosPsicologo,
    Email: email || Usuario?.Email || null,
  };
};

export const PsicologoService = {
  getAll: async () => {
    const psicologos = await prisma.psicologo.findMany({
      include: {
        Direccion: {
          include: {
            Municipio: {
              include: {
                Departamento: true,
              },
            },
          },
        },
        CodigoTelefonoPais: true,
        Psicologo_EspecialidadPsicologo: {
          include: {
            EspecialidadPsicologo: true,
          },
        },
        Usuario: {
          select: {
            Email: true,
          },
        },
      },
      orderBy: {
        Apellido: 'asc',
      },
    });

    return psicologos.map((psicologo) => {
      const { Usuario, ...datosPsicologo } = psicologo;

      return {
        ...datosPsicologo,
        Email: Usuario?.Email || null,
      };
    });
  },

  create: async (data: CreatePsicologoDTO) => {
    if (!data || !esObjeto(data)) {
      throw new Error('No se recibieron datos.');
    }

    const nombre = obtenerTextoRequerido(data, ['nombre', 'Nombre'], 'El nombre');
    const apellido = obtenerTextoRequerido(data, ['apellido', 'Apellido'], 'El apellido');
    const codigoMinsa = obtenerTextoRequerido(data, ['codigoMinsa', 'CodigoMinsa'], 'El código MINSA');
    const email = validarEmail(obtenerTextoRequerido(data, ['email', 'Email'], 'El correo electrónico'));
    const telefonoRaw = obtenerTextoRequerido(data, ['telefono', 'No_Telefono'], 'El teléfono');
    const telefonoLimpio = validarTelefonoNica(telefonoRaw);
    const codigoTelefonoId = obtenerNumero(data, ['codigoTelefonoId', 'ID_CodigoTelefono']) ?? 1;
    const direccion = normalizarDireccion(data.direccion);
    const especialidadIds = normalizarEspecialidades(data.especialidadIds);

    if (especialidadIds.length === 0) {
      throw new Error('Debe seleccionar al menos una especialidad.');
    }

    const passwordTemporal = generarPasswordTemporal();
    const passwordHash = await bcrypt.hash(passwordTemporal, 10);

    return await prisma.$transaction(async (tx) => {
      const existeUsuario = await tx.usuario.findUnique({
        where: {
          Email: email,
        },
      });

      if (existeUsuario) {
        throw new Error('Este correo electrónico ya está registrado.');
      }

      const nuevaDireccion = await tx.direccion.create({
        data: {
          Pais: 'Nicaragua',
          ID_Municipio: direccion.municipioId,
          Barrio: direccion.barrio,
          Calle: direccion.calle || null,
        },
      });

      const psicologo = await tx.psicologo.create({
        data: {
          Nombre: nombre,
          Apellido: apellido,
          CodigoMinsa: codigoMinsa,
          ID_CodigoTelefono: codigoTelefonoId,
          No_Telefono: telefonoLimpio,
          ID_Direccion: nuevaDireccion.ID_Direccion,
          Activo: true,
        },
      });

      await tx.psicologo_EspecialidadPsicologo.createMany({
        data: especialidadIds.map((especialidadId) => ({
          ID_Psicologo: psicologo.ID_Psicologo,
          ID_Especialidad: especialidadId,
        })),
      });

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
          Psicologo: {
            connect: {
              ID_Psicologo: psicologo.ID_Psicologo,
            },
          },
        },
      });

      await tx.usuario_Rol.create({
        data: {
          ID_Usuario: nuevoUsuario.ID_Usuario,
          ID_Rol: ROL_PSICOLOGO_ID,
        },
      });

      const psicologoRespuesta = await construirPsicologoRespuesta(
        psicologo.ID_Psicologo,
        nuevoUsuario.Email,
        tx,
      );

      return {
        psicologo: psicologoRespuesta,
        credenciales: {
          email: nuevoUsuario.Email,
          passwordTemporal,
        },
      };
    });
  },

  update: async (id: number, data: UpdatePsicologoDTO) => {
    if (!data || !esObjeto(data)) {
      throw new Error('No se recibieron datos.');
    }

    const telefonoRaw = obtenerTextoOpcional(data, ['telefono', 'No_Telefono']);
    const telefonoLimpio = telefonoRaw ? validarTelefonoNica(telefonoRaw) : undefined;
    const emailRaw = obtenerTextoOpcional(data, ['email', 'Email']);
    const email = emailRaw ? validarEmail(emailRaw) : undefined;

    return await prisma.$transaction(async (tx) => {
      const updateData: Prisma.PsicologoUncheckedUpdateInput = {};

      const nombre = obtenerTextoOpcional(data, ['nombre', 'Nombre']);
      const apellido = obtenerTextoOpcional(data, ['apellido', 'Apellido']);
      const codigoMinsa = obtenerTextoOpcional(data, ['codigoMinsa', 'CodigoMinsa']);
      const codigoTelefonoId = obtenerNumero(data, ['codigoTelefonoId', 'ID_CodigoTelefono']);
      const activo = data.activo ?? data.Activo;

      if (nombre !== undefined) updateData.Nombre = nombre;
      if (apellido !== undefined) updateData.Apellido = apellido;
      if (codigoMinsa !== undefined) updateData.CodigoMinsa = codigoMinsa;
      if (codigoTelefonoId !== undefined) updateData.ID_CodigoTelefono = codigoTelefonoId;
      if (telefonoLimpio !== undefined) updateData.No_Telefono = telefonoLimpio;
      if (activo !== undefined) updateData.Activo = Boolean(activo);

      const psicologo = await tx.psicologo.update({
        where: {
          ID_Psicologo: id,
        },
        data: updateData,
      });

      if (data.direccion) {
        const direccion = normalizarDireccion(data.direccion);

        await tx.direccion.update({
          where: {
            ID_Direccion: psicologo.ID_Direccion,
          },
          data: {
            ID_Municipio: direccion.municipioId,
            Barrio: direccion.barrio,
            Calle: direccion.calle || null,
          },
        });
      }

      if (email) {
        const usuarioActual = await tx.usuario.findFirst({
          where: {
            Psicologo: {
              is: {
                ID_Psicologo: id,
              },
            },
          },
        });

        const usuarioConCorreo = await tx.usuario.findUnique({
          where: {
            Email: email,
          },
        });

        if (usuarioConCorreo && usuarioConCorreo.ID_Usuario !== usuarioActual?.ID_Usuario) {
          throw new Error('Este correo electrónico ya está registrado.');
        }

        if (usuarioActual) {
          await tx.usuario.update({
            where: {
              ID_Usuario: usuarioActual.ID_Usuario,
            },
            data: {
              Email: email,
            },
          });
        }
      }

      if (data.especialidadIds) {
        const especialidadIds = normalizarEspecialidades(data.especialidadIds);

        await tx.psicologo_EspecialidadPsicologo.deleteMany({
          where: {
            ID_Psicologo: id,
          },
        });

        if (especialidadIds.length > 0) {
          await tx.psicologo_EspecialidadPsicologo.createMany({
            data: especialidadIds.map((especialidadId) => ({
              ID_Psicologo: id,
              ID_Especialidad: especialidadId,
            })),
          });
        }
      }

      return await construirPsicologoRespuesta(id, email, tx);
    });
  },
};
