import { PrismaClient, type Prisma } from '@prisma/client';
import type { AuthUserPayload } from '../middlewares/auth.middleware.js';

const prisma = new PrismaClient();

interface CreatePacienteDTO {
  nombre: string;
  apellido: string;
  fechaNac: string | Date;
  genero: string;
  paisId: number;
  direccion: {
    municipioId: number;
    barrio: string;
    calle?: string;
  };
  esAdulto: boolean;
  datosAdulto?: {
    cedula: string;
    codigoTelefonoId: number;
    telefono: string;
    ocupacionId: number;
    estadoCivilId: number;
  };
  datosMenor?: {
    partNacimiento: string;
    grado: string;
    modoTutor: 'existente' | 'nuevo';
    tutorId?: number;
    nuevoTutor?: {
      cedula: string;
      nombre: string;
      apellido: string;
      codigoTelefonoId: number;
      telefono: string;
      parentescoId: number;
      ocupacionId: number;
      estadoCivilId: number;
    };
  };
}

interface UpdatePacienteDTO extends CreatePacienteDTO {
  activo: boolean;
}

const validarUsuarioAutenticado = (usuario?: AuthUserPayload) => {
  if (!usuario) {
    throw new Error('Acceso no autorizado.');
  }

  return usuario;
};

const validarPuedeVerDatosBasicos = (usuario?: AuthUserPayload) => {
  const usuarioActual = validarUsuarioAutenticado(usuario);

  if (usuarioActual.esAdmin || usuarioActual.esRecepcion || usuarioActual.esPsicologo) {
    return usuarioActual;
  }

  throw new Error('No tiene permisos para consultar pacientes.');
};

const validarPuedeGestionarPaciente = (usuario?: AuthUserPayload) => {
  const usuarioActual = validarUsuarioAutenticado(usuario);

  if (usuarioActual.esAdmin || usuarioActual.esRecepcion) {
    return usuarioActual;
  }

  throw new Error('No tiene permisos para registrar o modificar pacientes.');
};

const validarPuedeVerSesionesClinicas = (usuario: AuthUserPayload) => {
  return usuario.esAdmin || usuario.esPsicologo;
};

const validarPsicologoVinculado = (usuario: AuthUserPayload) => {
  if (!usuario.idPsicologo) {
    throw new Error('El usuario psicólogo no tiene un perfil de psicólogo vinculado.');
  }

  return usuario.idPsicologo;
};

const construirWhereCitasPaciente = (
  pacienteId: number,
  usuario: AuthUserPayload
): Prisma.CitaWhereInput => {
  const where: Prisma.CitaWhereInput = {
    ID_Paciente: pacienteId,
  };

  if (usuario.esPsicologo) {
    where.ID_Psicologo = validarPsicologoVinculado(usuario);
  }

  return where;
};

const validarFormatoCedula = (cedula: string, contexto: string) => {
  const regex = /^\d{3}-\d{6}-\d{4}[A-Z]$/;

  if (!regex.test(cedula)) {
    throw new Error(`La cédula proporcionada para ${contexto} (${cedula}) tiene un formato inválido. Debe ser XXX-XXXXXX-XXXXL`);
  }
};

const validarCedulaUnica = async (
  cedula: string,
  tipo: 'paciente' | 'tutor',
  idExcluir?: number
) => {
  if (tipo === 'paciente') {
    const whereClause: Prisma.PacienteAdultoWhereInput = {
      No_Cedula: cedula,
    };

    if (idExcluir) {
      whereClause.ID_PacienteAdulto = {
        not: idExcluir,
      };
    }

    const existe = await prisma.pacienteAdulto.findFirst({
      where: whereClause,
    });

    if (existe) {
      throw new Error(`La cédula ${cedula} ya está registrada en otro PACIENTE.`);
    }
  }

  if (tipo === 'tutor') {
    const whereClause: Prisma.TutorWhereInput = {
      No_Cedula: cedula,
    };

    if (idExcluir) {
      whereClause.ID_Tutor = {
        not: idExcluir,
      };
    }

    const existe = await prisma.tutor.findFirst({
      where: whereClause,
    });

    if (existe) {
      throw new Error(`La cédula ${cedula} ya está registrada en otro TUTOR.`);
    }
  }
};

const validarTelefonoNica = (telefono: string, contexto: string) => {
  const limpio = telefono.replace(/[\s-]/g, '');
  const regex = /^[2578]\d{7}$/;

  if (!regex.test(limpio)) {
    throw new Error(`El teléfono de ${contexto} es inválido. Debe ser un número de Nicaragua (8 dígitos).`);
  }

  return limpio;
};

const construirNumeroExpediente = (pacienteId: number) => {
  return `EXP-${pacienteId}-${Date.now()}`;
};

const expedienteSelect = {
  ID_Expediente: true,
  No_Expediente: true,
  FechaIngreso: true,
  ID_Paciente: true,
} satisfies Prisma.ExpedienteSelect;

const citaBaseSelect = {
  ID_Cita: true,
  FechaCita: true,
  HoraCita: true,
  MotivoConsulta: true,
  ID_EstadoCita: true,
  ID_Psicologo: true,
  EstadoCita: {
    select: {
      NombreEstado: true,
    },
  },
  TipoDeCita: {
    select: {
      Nombre_DeCita: true,
    },
  },
  Psicologo: {
    select: {
      Nombre: true,
      Apellido: true,
    },
  },
} satisfies Prisma.CitaSelect;

const sesionSelect = {
  ID_Sesion: true,
  ID_Expediente: true,
  HoraDeInicio: true,
  HoraFinal: true,
  Observaciones: true,
  DiagnosticoDiferencial: true,
  HistorialDeEvolucion: true,
  Criterios_DeDiagnostico: true,
  Expediente: {
    select: expedienteSelect,
  },
  Tratamiento: {
    select: {
      Frecuencia: true,
      FechaInicio: true,
      Tratamiento_Farmaceutico: {
        select: {
          Nombre_Medicamento: true,
          Dosis: true,
        },
      },
      Tratamiento_Terapeutico: {
        select: {
          Objetivo: true,
        },
      },
    },
  },
} satisfies Prisma.SesionSelect;

export const PacienteService = {
  getAll: async (usuario?: AuthUserPayload) => {
    validarPuedeVerDatosBasicos(usuario);

    return await prisma.paciente.findMany({
      include: {
        Pais: true,
        Direccion: {
          include: {
            Municipio: {
              include: {
                Departamento: true,
              },
            },
          },
        },
        PacienteAdulto: true,
        Paciente_Menor: {
          include: {
            Tutor_PacienteMenor: {
              include: {
                Tutor: true,
                Parentesco: true,
              },
            },
          },
        },
      },
    });
  },

  getExpediente: async (id: number, usuario?: AuthUserPayload) => {
    const usuarioActual = validarPuedeVerDatosBasicos(usuario);
    const puedeVerSesiones = validarPuedeVerSesionesClinicas(usuarioActual);
    const whereCitas = construirWhereCitasPaciente(id, usuarioActual);

    const citaSelect: Prisma.CitaSelect = puedeVerSesiones
      ? {
          ...citaBaseSelect,
          Sesion: {
            select: sesionSelect,
          },
        }
      : citaBaseSelect;

    const paciente = await prisma.paciente.findUnique({
      where: {
        ID_Paciente: id,
      },
      include: {
        Pais: true,
        Direccion: {
          include: {
            Municipio: {
              include: {
                Departamento: true,
              },
            },
          },
        },
        PacienteAdulto: {
          include: {
            Ocupacion: true,
            EstadoCivil: true,
            CodigoTelefonoPais: true,
          },
        },
        Paciente_Menor: {
          include: {
            Tutor_PacienteMenor: {
              include: {
                Parentesco: true,
                Tutor: {
                  include: {
                    Ocupacion_Tutor_OcupacionToOcupacion: true,
                    EstadoCivil_Tutor_EstadoCivilToEstadoCivil: true,
                    CodigoTelefonoPais: true,
                    Direccion: {
                      include: {
                        Municipio: {
                          include: {
                            Departamento: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        Cita: {
          where: whereCitas,
          select: citaSelect,
          orderBy: {
            FechaCita: 'desc',
          },
        },
      },
    });

    if (!paciente) return null;

    let expediente = await prisma.expediente.findFirst({
      where: {
        ID_Paciente: id,
      },
      orderBy: {
        ID_Expediente: 'asc',
      },
      select: expedienteSelect,
    });

    if (!expediente) {
      expediente = await prisma.expediente.create({
        data: {
          No_Expediente: construirNumeroExpediente(id),
          FechaIngreso: new Date(),
          ID_Paciente: id,
        },
        select: expedienteSelect,
      });
    }

    const { Cita: citasConSesion, ...pacienteSinCitas } = paciente;

    const citas = citasConSesion.map((cita) => {
      const { Sesion, ...datosCita } = cita as typeof cita & {
        Sesion?: unknown;
      };

      return datosCita;
    });

    const sesiones = puedeVerSesiones
      ? citasConSesion
          .filter((cita) => Boolean((cita as { Sesion?: unknown }).Sesion))
          .map((cita) => {
            const citaSesion = cita as typeof cita & {
              Sesion: NonNullable<unknown>;
            };

            const { Sesion, ...datosCita } = citaSesion;

            return {
              ...(Sesion as Record<string, unknown>),
              Expediente: (Sesion as { Expediente?: unknown }).Expediente || expediente,
              ID_Expediente: (Sesion as { ID_Expediente?: number }).ID_Expediente || expediente.ID_Expediente,
              Psicologo: datosCita.Psicologo,
              FechaCita: datosCita.FechaCita,
              HoraCita: datosCita.HoraCita,
              ID_Cita: datosCita.ID_Cita,
            };
          })
      : [];

    return {
      paciente: pacienteSinCitas,
      expediente,
      citas,
      sesiones,
    };
  },

  create: async (data: CreatePacienteDTO, usuario?: AuthUserPayload) => {
    validarPuedeGestionarPaciente(usuario);

    const fechaNacObj = new Date(data.fechaNac);
    const anio = fechaNacObj.getFullYear();

    if (Number.isNaN(fechaNacObj.getTime()) || anio < 1900 || anio > new Date().getFullYear()) {
      throw new Error('Fecha de nacimiento inválida.');
    }

    if (data.esAdulto && data.datosAdulto) {
      validarFormatoCedula(data.datosAdulto.cedula, 'Paciente Adulto');
      await validarCedulaUnica(data.datosAdulto.cedula, 'paciente');
      data.datosAdulto.telefono = validarTelefonoNica(data.datosAdulto.telefono, 'Paciente Adulto');

      if (!data.datosAdulto.ocupacionId || !data.datosAdulto.estadoCivilId || !data.datosAdulto.codigoTelefonoId) {
        throw new Error('Datos de Ocupación, Estado Civil o Código de Teléfono inválidos.');
      }
    }

    if (!data.esAdulto && data.datosMenor?.modoTutor === 'nuevo' && data.datosMenor.nuevoTutor) {
      const tutor = data.datosMenor.nuevoTutor;

      validarFormatoCedula(tutor.cedula, 'Nuevo Tutor');
      await validarCedulaUnica(tutor.cedula, 'tutor');
      tutor.telefono = validarTelefonoNica(tutor.telefono, 'Nuevo Tutor');

      if (!tutor.ocupacionId || !tutor.estadoCivilId || !tutor.parentescoId || !tutor.codigoTelefonoId) {
        throw new Error('Datos incompletos para el Tutor.');
      }
    }

    return await prisma.$transaction(async (tx) => {
      const nuevaDireccion = await tx.direccion.create({
        data: {
          Pais: 'Nicaragua',
          ID_Municipio: data.direccion.municipioId,
          Barrio: data.direccion.barrio,
          Calle: data.direccion.calle || null,
        },
      });

      const nuevoPaciente = await tx.paciente.create({
        data: {
          Nombre: data.nombre,
          Apellido: data.apellido,
          Fecha_Nacimiento: fechaNacObj,
          Genero: data.genero,
          ID_Pais: data.paisId,
          ID_Direccion: nuevaDireccion.ID_Direccion,
          Activo: true,
        },
      });

      const nuevoExpediente = await tx.expediente.create({
        data: {
          No_Expediente: construirNumeroExpediente(nuevoPaciente.ID_Paciente),
          FechaIngreso: new Date(),
          ID_Paciente: nuevoPaciente.ID_Paciente,
        },
      });

      if (data.esAdulto && data.datosAdulto) {
        await tx.pacienteAdulto.create({
          data: {
            ID_PacienteAdulto: nuevoPaciente.ID_Paciente,
            No_Cedula: data.datosAdulto.cedula,
            ID_CodigoTelefono: data.datosAdulto.codigoTelefonoId,
            No_Telefono: data.datosAdulto.telefono,
            ID_Ocupacion: data.datosAdulto.ocupacionId,
            ID_EstadoCivil: data.datosAdulto.estadoCivilId,
          },
        });
      } else if (!data.esAdulto && data.datosMenor) {
        let idTutorFinal: number | null = null;
        const idParentescoFinal = data.datosMenor.nuevoTutor?.parentescoId || 6;

        if (data.datosMenor.modoTutor === 'existente' && data.datosMenor.tutorId) {
          idTutorFinal = data.datosMenor.tutorId;
        } else if (data.datosMenor.nuevoTutor) {
          const tutorData = data.datosMenor.nuevoTutor;

          const tutorCreado = await tx.tutor.create({
            data: {
              No_Cedula: tutorData.cedula,
              Nombre: tutorData.nombre,
              Apellido: tutorData.apellido,
              ID_CodigoTelefono: tutorData.codigoTelefonoId,
              No_Telefono: tutorData.telefono,
              Ocupacion: tutorData.ocupacionId,
              EstadoCivil: tutorData.estadoCivilId,
            },
          });

          idTutorFinal = tutorCreado.ID_Tutor;
        }

        if (idTutorFinal) {
          await tx.paciente_Menor.create({
            data: {
              ID_Paciente_Menor: nuevoPaciente.ID_Paciente,
              PartidaDeNacimiento: data.datosMenor.partNacimiento,
              Grado_Escolar: data.datosMenor.grado,
            },
          });

          await tx.tutor_PacienteMenor.create({
            data: {
              ID_Tutor: idTutorFinal,
              ID_Paciente_Menor: nuevoPaciente.ID_Paciente,
              ID_Parentesco: idParentescoFinal,
              Es_Contacto_Principal: true,
            },
          });
        }
      }

      return {
        ...nuevoPaciente,
        Expediente: nuevoExpediente,
      };
    });
  },

  update: async (id: number, data: UpdatePacienteDTO, usuario?: AuthUserPayload) => {
    validarPuedeGestionarPaciente(usuario);

    const fechaNacObj = new Date(data.fechaNac);

    if (Number.isNaN(fechaNacObj.getTime())) {
      throw new Error('Fecha inválida');
    }

    if (data.esAdulto && data.datosAdulto) {
      validarFormatoCedula(data.datosAdulto.cedula, 'Paciente');
      await validarCedulaUnica(data.datosAdulto.cedula, 'paciente', id);
      data.datosAdulto.telefono = validarTelefonoNica(data.datosAdulto.telefono, 'Paciente');
    }

    return await prisma.$transaction(async (tx) => {
      const pacienteActualizado = await tx.paciente.update({
        where: {
          ID_Paciente: id,
        },
        data: {
          Activo: data.activo,
          Nombre: data.nombre,
          Apellido: data.apellido,
          Fecha_Nacimiento: fechaNacObj,
          Genero: data.genero,
          ID_Pais: data.paisId,
        },
      });

      await tx.direccion.update({
        where: {
          ID_Direccion: pacienteActualizado.ID_Direccion,
        },
        data: {
          ID_Municipio: data.direccion.municipioId,
          Barrio: data.direccion.barrio,
          Calle: data.direccion.calle || null,
        },
      });

      if (data.esAdulto && data.datosAdulto) {
        await tx.pacienteAdulto.update({
          where: {
            ID_PacienteAdulto: id,
          },
          data: {
            No_Cedula: data.datosAdulto.cedula,
            ID_CodigoTelefono: data.datosAdulto.codigoTelefonoId,
            No_Telefono: data.datosAdulto.telefono,
            ID_Ocupacion: data.datosAdulto.ocupacionId,
            ID_EstadoCivil: data.datosAdulto.estadoCivilId,
          },
        });
      } else if (!data.esAdulto && data.datosMenor) {
        await tx.paciente_Menor.update({
          where: {
            ID_Paciente_Menor: id,
          },
          data: {
            PartidaDeNacimiento: data.datosMenor.partNacimiento,
            Grado_Escolar: data.datosMenor.grado,
          },
        });

        if (data.datosMenor.tutorId) {
          await tx.tutor_PacienteMenor.updateMany({
            where: {
              ID_Paciente_Menor: id,
            },
            data: {
              ID_Tutor: data.datosMenor.tutorId,
            },
          });
        }
      }

      return pacienteActualizado;
    });
  },

  getHistorialPaciente: async (id: number, usuario?: AuthUserPayload) => {
    const usuarioActual = validarPuedeVerDatosBasicos(usuario);
    const puedeVerSesiones = validarPuedeVerSesionesClinicas(usuarioActual);
    const whereCitas = construirWhereCitasPaciente(id, usuarioActual);

    const citasConSesion = await prisma.cita.findMany({
      where: {
        ...whereCitas,
        ID_EstadoCita: 2,
      },
      include: {
        Psicologo: true,
        ...(puedeVerSesiones
          ? {
              Sesion: {
                include: {
                  Expediente: true,
                  Tratamiento: {
                    include: {
                      Tratamiento_Farmaceutico: {
                        include: {
                          ViaAdministracion: true,
                        },
                      },
                      Tratamiento_Terapeutico: {
                        include: {
                          TipoDe_Terapia: true,
                        },
                      },
                    },
                  },
                },
              },
            }
          : {}),
      },
      orderBy: {
        FechaCita: 'desc',
      },
    });

    const citas = citasConSesion.map((cita) => {
      const { Sesion, ...datosCita } = cita as typeof cita & {
        Sesion?: unknown;
      };

      return datosCita;
    });

    const sesiones = puedeVerSesiones
      ? citasConSesion
          .filter((cita) => Boolean((cita as { Sesion?: unknown }).Sesion))
          .map((cita) => {
            const citaSesion = cita as typeof cita & {
              Sesion: NonNullable<unknown>;
            };

            const { Sesion, ...datosCita } = citaSesion;

            return {
              ...(Sesion as Record<string, unknown>),
              Psicologo: datosCita.Psicologo,
              FechaCita: datosCita.FechaCita,
              HoraCita: datosCita.HoraCita,
              ID_Cita: datosCita.ID_Cita,
            };
          })
      : [];

    let expediente = await prisma.expediente.findFirst({
      where: {
        ID_Paciente: id,
      },
      orderBy: {
        ID_Expediente: 'asc',
      },
      select: expedienteSelect,
    });

    if (!expediente) {
      expediente = await prisma.expediente.create({
        data: {
          No_Expediente: construirNumeroExpediente(id),
          FechaIngreso: new Date(),
          ID_Paciente: id,
        },
        select: expedienteSelect,
      });
    }

    const sesionesConExpediente = sesiones.map((sesion) => ({
      ...sesion,
      Expediente: (sesion as { Expediente?: unknown }).Expediente || expediente,
      ID_Expediente: (sesion as { ID_Expediente?: number }).ID_Expediente || expediente.ID_Expediente,
    }));

    return {
      expediente,
      citas,
      sesiones: sesionesConExpediente,
    };
  },
};
