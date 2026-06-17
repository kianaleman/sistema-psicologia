import { PrismaClient, type Prisma } from '@prisma/client';
import type { AuthUserPayload } from '../middlewares/auth.middleware.js';

const prisma = new PrismaClient();

interface DireccionTutorDTO {
  Pais?: string;
  Barrio?: string;
  Calle?: string;
  ID_Municipio?: number;
  municipioId?: number;
}

interface UpdateTutorDTO {
  Nombre: string;
  Apellido: string;
  No_Cedula: string;
  No_Telefono: string;

  codigoTelefonoId?: number;
  ID_CodigoTelefono?: number;

  ocupacionId?: number;
  Ocupacion?: number;

  estadoCivilId?: number;
  EstadoCivil?: number;

  Direccion?: DireccionTutorDTO;
}

const tutorInclude = {
  CodigoTelefonoPais: true,
  Ocupacion_Tutor_OcupacionToOcupacion: true,
  EstadoCivil_Tutor_EstadoCivilToEstadoCivil: true,
  Direccion: {
    include: {
      Municipio: {
        include: {
          Departamento: true,
        },
      },
    },
  },
  Tutor_PacienteMenor: {
    include: {
      Parentesco: true,
      Paciente_Menor: {
        include: {
          Paciente: true,
        },
      },
    },
  },
} satisfies Prisma.TutorInclude;

const validarUsuarioAutenticado = (usuario?: AuthUserPayload) => {
  if (!usuario) {
    throw new Error('Acceso no autorizado.');
  }

  return usuario;
};

const validarPuedeVerTutores = (usuario?: AuthUserPayload) => {
  const usuarioActual = validarUsuarioAutenticado(usuario);

  if (usuarioActual.esAdmin || usuarioActual.esRecepcion || usuarioActual.esPsicologo) {
    return usuarioActual;
  }

  throw new Error('No tiene permisos para consultar tutores.');
};

const validarPuedeGestionarTutores = (usuario?: AuthUserPayload) => {
  const usuarioActual = validarUsuarioAutenticado(usuario);

  if (usuarioActual.esAdmin || usuarioActual.esRecepcion) {
    return usuarioActual;
  }

  throw new Error('No tiene permisos para registrar o modificar tutores.');
};

const validarFormatoCedula = (cedula: string) => {
  const regex = /^\d{3}-\d{6}-\d{4}[A-Z]$/;

  if (!regex.test(cedula)) {
    throw new Error('Formato de cédula inválido. Debe ser XXX-XXXXXX-XXXXL');
  }
};

const validarTelefonoNica = (telefono: string) => {
  const limpio = telefono.replace(/[\s-]/g, '');
  const regex = /^[2578]\d{7}$/;

  if (!regex.test(limpio)) {
    throw new Error('Teléfono inválido. Debe ser de 8 dígitos e iniciar con 2, 5, 7 u 8.');
  }

  return limpio;
};

const obtenerNumeroValido = (...values: Array<number | string | null | undefined>) => {
  for (const value of values) {
    const numero = Number(value);

    if (Number.isInteger(numero) && numero > 0) {
      return numero;
    }
  }

  return undefined;
};

const construirDireccionData = (direccion: DireccionTutorDTO): Prisma.DireccionUncheckedCreateInput => {
  const municipioId = obtenerNumeroValido(direccion.ID_Municipio, direccion.municipioId);

  if (!municipioId) {
    throw new Error('Debe seleccionar un municipio válido para la dirección del tutor.');
  }

  if (!direccion.Pais?.trim()) {
    throw new Error('Debe seleccionar un país válido para la dirección del tutor.');
  }

  if (!direccion.Barrio?.trim()) {
    throw new Error('El barrio de la dirección del tutor es obligatorio.');
  }

  return {
    Pais: direccion.Pais.trim(),
    Barrio: direccion.Barrio.trim(),
    Calle: direccion.Calle?.trim() || null,
    ID_Municipio: municipioId,
  };
};

export const TutorService = {
  getAll: async (usuario?: AuthUserPayload) => {
    validarPuedeVerTutores(usuario);

    return await prisma.tutor.findMany({
      include: tutorInclude,
      orderBy: {
        Nombre: 'asc',
      },
    });
  },

  update: async (id: number, data: UpdateTutorDTO, usuario?: AuthUserPayload) => {
    validarPuedeGestionarTutores(usuario);
    validarFormatoCedula(data.No_Cedula);

    const telefonoLimpio = validarTelefonoNica(data.No_Telefono);

    const whereClause: Prisma.TutorWhereInput = {
      No_Cedula: data.No_Cedula,
    };

    if (id) {
      whereClause.ID_Tutor = {
        not: id,
      };
    }

    const cedulaDuplicada = await prisma.tutor.findFirst({
      where: whereClause,
    });

    if (cedulaDuplicada) {
      throw new Error(`Error de duplicidad: La cédula ${data.No_Cedula} ya pertenece a otro Tutor.`);
    }

    const existe = await prisma.tutor.findUnique({
      where: {
        ID_Tutor: id,
      },
    });

    if (!existe) {
      throw new Error('Tutor no encontrado');
    }

    const codigoTelefonoId = obtenerNumeroValido(data.codigoTelefonoId, data.ID_CodigoTelefono, existe.ID_CodigoTelefono);
    const ocupacionId = obtenerNumeroValido(data.ocupacionId, data.Ocupacion);
    const estadoCivilId = obtenerNumeroValido(data.estadoCivilId, data.EstadoCivil);

    if (!codigoTelefonoId) {
      throw new Error('Debe seleccionar un código telefónico válido.');
    }

    if (!ocupacionId) {
      throw new Error('Debe seleccionar una ocupación válida.');
    }

    if (!estadoCivilId) {
      throw new Error('Debe seleccionar un estado civil válido.');
    }

    await prisma.$transaction(async (tx) => {
      const tutorData: Prisma.TutorUncheckedUpdateInput = {
        Nombre: data.Nombre.trim(),
        Apellido: data.Apellido.trim(),
        No_Cedula: data.No_Cedula.trim().toUpperCase(),
        ID_CodigoTelefono: codigoTelefonoId,
        No_Telefono: telefonoLimpio,
        Ocupacion: ocupacionId,
        EstadoCivil: estadoCivilId,
      };

      if (data.Direccion) {
        const direccionData = construirDireccionData(data.Direccion);

        if (existe.ID_Direccion) {
          await tx.direccion.update({
            where: {
              ID_Direccion: existe.ID_Direccion,
            },
            data: direccionData,
          });
        } else {
          const direccionCreada = await tx.direccion.create({
            data: direccionData,
          });

          tutorData.ID_Direccion = direccionCreada.ID_Direccion;
        }
      }

      await tx.tutor.update({
        where: {
          ID_Tutor: id,
        },
        data: tutorData,
      });
    });

    return await prisma.tutor.findUniqueOrThrow({
      where: {
        ID_Tutor: id,
      },
      include: tutorInclude,
    });
  },
};

export const createTutorService = async (
  tutorData: Prisma.TutorUncheckedCreateInput,
  usuario?: AuthUserPayload
) => {
  validarPuedeGestionarTutores(usuario);

  return await prisma.tutor.create({
    data: tutorData,
    include: tutorInclude,
  });
};
