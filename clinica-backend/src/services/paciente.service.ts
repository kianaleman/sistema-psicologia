import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// --- DTOs ---
interface CreatePacienteDTO {
  nombre: string;
  apellido: string;
  fechaNac: string | Date;
  genero: string;
  nacionalidad: string;
  direccion: {
    pais?: string;
    departamento: string;
    ciudad: string;
    barrio: string;
    calle: string;
  };
  esAdulto: boolean;
  datosAdulto?: {
    cedula: string;
    telefono: string;
    ocupacionId: number;
    estadoCivilId: number;
  };
  datosMenor?: {
    partNacimiento: string;
    grado: string;
    modoTutor: 'existente' | 'nuevo';
    tutorId?: number;
    parentescoId: number;
    nuevoTutor?: {
      nombre: string;
      apellido: string;
      noCedula: string;
      telefono: string;
      parentescoId: number;
      ocupacionId: number;
      estadoCivilId: number;
      direccion: {
        departamento: string;
        ciudad: string;
        barrio: string;
        calle: string;
      };
    };
  };
}

// --- HELPERS ---
const validarFormatoCedula = (cedula: string, contexto: string) => {
  const regex = /^\d{3}-\d{6}-\d{4}[A-Z]$/;
  const valor = (cedula || '').trim();

  if (!regex.test(valor)) {
    throw new Error(`Cédula para ${contexto} inválida. Formato: 000-000000-0000X`);
  }
};

const validarCedulaTutorUnica = async (cedula: string) => {
  const valor = (cedula || '').trim();

  const existe = await prisma.tutor.findUnique({
    where: { No_Cedula: valor }
  });

  if (existe) {
    throw new Error(`La cédula ${valor} ya pertenece a un tutor registrado.`);
  }
};

const validarCedulaUnica = async (cedula: string, idExcluir?: number) => {
  const valor = (cedula || '').trim();

  const whereClause: any = { No_Cedula: valor };

  if (idExcluir) {
    whereClause.ID_PacienteAdulto = { not: idExcluir };
  }

  const existe = await prisma.pacienteAdulto.findFirst({
    where: whereClause
  });

  if (existe) {
    throw new Error(`La cédula ${valor} ya pertenece a otro registro.`);
  }
};

//  green: SE MODIFICÓ ESTA FUNCIÓN PARA PERMITIR PREFIJOS INTERNACIONALES DE CENTROAMÉRICA
const validarTelefonoNica = (telefono: string, contexto: string) => {
  // Quitamos espacios, guiones y el símbolo '+' temporalmente para validar limpiamente la estructura
  const limpio = String(telefono || '').replace(/[\s\-\+]/g, '');

  // Valida formatos con códigos regionales o números puros locales:
  // Nicaragua: 505 + 8 dígitos (iniciados con 2,5,7,8) o solo 8 dígitos directos
  // Costa Rica (506), El Salvador (503), Guatemala (502), Honduras (504): Código + 8 dígitos
  // Panamá (507): Código + 7 u 8 dígitos
  const regexRegional = /^(505[2578]\d{7}|[2578]\d{7}|506\d{8}|503\d{8}|502\d{8}|504\d{8}|507\d{7,8})$/;

  if (!regexRegional.test(limpio)) {
    throw new Error(`Teléfono de ${contexto} inválido o no corresponde a Centroamérica.`);
  }

  // Retornamos la cadena original unificada de espacios para guardarse junto con el código
  return String(telefono || '').trim().replace(/\s+/g, ' ');
};

export const PacienteService = {
  create: async (data: CreatePacienteDTO) => {
    const fechaNacObj = new Date(data.fechaNac);

    if (isNaN(fechaNacObj.getTime())) {
      throw new Error("Fecha de nacimiento inválida.");
    }

    if (data.esAdulto && data.datosAdulto) {
      validarFormatoCedula(data.datosAdulto.cedula, 'Paciente');
      await validarCedulaUnica(data.datosAdulto.cedula);
    }

    if (
      !data.esAdulto &&
      data.datosMenor?.modoTutor === 'nuevo' &&
      data.datosMenor.nuevoTutor
    ) {
      validarFormatoCedula(data.datosMenor.nuevoTutor.noCedula, 'Tutor');
      await validarCedulaTutorUnica(data.datosMenor.nuevoTutor.noCedula);
    }

    return await prisma.$transaction(async (tx) => {
      const depto = (data.direccion?.departamento || '').trim();
      const ciudad = (data.direccion?.ciudad || '').trim();
      const barrio = (data.direccion?.barrio || '').trim();
      const calle = (data.direccion?.calle || '').trim();

      let dir = await tx.direccion.findFirst({
        where: {
          Departamento: depto,
          Ciudad: ciudad,
          Barrio: barrio,
          Calle: calle
        }
      });

      if (!dir) {
        dir = await tx.direccion.create({
          data: {
            Pais: data.direccion?.pais || 'Nicaragua',
            Departamento: depto,
            Ciudad: ciudad,
            Barrio: barrio,
            Calle: calle
          }
        });
      }

      const pac = await tx.paciente.create({
        data: {
          Nombre: (data.nombre || '').trim(),
          Apellido: (data.apellido || '').trim(),
          Fecha_Nacimiento: fechaNacObj,
          Genero: data.genero,
          Nacionalidad: data.nacionalidad,
          ID_Direccion: dir.ID_Direccion,
          Activo: true
        }
      });

      await tx.expediente.create({
        data: {
          ID_Paciente: pac.ID_Paciente,
          No_Expediente: `EXP-${new Date().getFullYear()}-${pac.ID_Paciente}`,
          FechaIngreso: new Date()
        }
      });

      if (data.esAdulto && data.datosAdulto) {
        await tx.pacienteAdulto.create({
          data: {
            ID_PacienteAdulto: pac.ID_Paciente,
            No_Cedula: (data.datosAdulto.cedula || '').trim(),
            No_Telefono: validarTelefonoNica(data.datosAdulto.telefono, 'Adulto'),
            ID_Ocupacion: Number(data.datosAdulto.ocupacionId),
            ID_EstadoCivil: Number(data.datosAdulto.estadoCivilId)
          }
        });
      } else if (!data.esAdulto && data.datosMenor) {
        const pMenor = await tx.paciente_Menor.create({
          data: {
            ID_Paciente_Menor: pac.ID_Paciente,
            PartidaDeNacimiento: (data.datosMenor.partNacimiento || '').trim(),
            Grado_Escolar: data.datosMenor.grado
          }
        });

        let idTutorFinal = data.datosMenor.tutorId;

        if (data.datosMenor.modoTutor === 'nuevo' && data.datosMenor.nuevoTutor) {
          const nt = data.datosMenor.nuevoTutor;

          const tut = await tx.tutor.create({
            data: {
              Nombre: (nt.nombre || '').trim(),
              Apellido: (nt.apellido || '').trim(),
              No_Cedula: nt.noCedula.trim(),
              No_Telefono: validarTelefonoNica(nt.telefono, 'Tutor'),
              Ocupacion: Number(nt.ocupacionId),
              EstadoCivil: Number(nt.estadoCivilId)
            }
          });

          idTutorFinal = tut.ID_Tutor;
        }

        await tx.tutor_PacienteMenor.create({
          data: {
            ID_Tutor: Number(idTutorFinal!),
            ID_Paciente_Menor: pMenor.ID_Paciente_Menor,
            ID_Parentesco: Number(data.datosMenor.parentescoId),
            Es_Contacto_Principal: true
          }
        });
      }

      return pac;
    });
  },

  getAll: async () => {
    return await prisma.paciente.findMany({
      include: {
        Direccion: true,
        PacienteAdulto: true,
        Expediente: true,
        Paciente_Menor: {
          include: {
            Tutor_PacienteMenor: {
              include: { Tutor: true, Parentesco: true }
            }
          }
        }
      },
      orderBy: { Nombre: 'asc' }
    });
  },

  getPacientesByPsicologo: async (psicologoId: number) => {
    return await prisma.paciente.findMany({
      where: {
        Cita: {
          some: {
            ID_Psicologo: psicologoId
          }
        },
        Activo: true
      },
      include: {
        Direccion: true,
        PacienteAdulto: true,
        Expediente: true,
        Paciente_Menor: {
          include: {
            Tutor_PacienteMenor: {
              include: { Tutor: true, Parentesco: true }
            }
          }
        }
      },
      orderBy: { Nombre: 'asc' }
    });
  },

  getExpediente: async (id: number) => {
    return await prisma.paciente.findUnique({
      where: { ID_Paciente: id },
      include: {
        Direccion: true,
        PacienteAdulto: { include: { Ocupacion: true, EstadoCivil: true } },
        Paciente_Menor: {
          include: {
            Tutor_PacienteMenor: {
              include: { Tutor: true, Parentesco: true }
            }
          }
        },
        Expediente: true
      }
    });
  },

  update: async (id: number, data: any) => {
    return await prisma.$transaction(async (tx) => {
      const pacientePrevio = await tx.paciente.findUnique({
        where: { ID_Paciente: id },
        select: { ID_Direccion: true }
      });

      if (data.direccion && pacientePrevio?.ID_Direccion) {
        await tx.direccion.update({
          where: { ID_Direccion: pacientePrevio.ID_Direccion },
          data: {
            Pais: 'Nicaragua',
            Departamento: (data.direccion.departamento || '').trim(),
            Ciudad: (data.direccion.ciudad || '').trim(),
            Barrio: (data.direccion.barrio || '').trim(),
            Calle: (data.direccion.calle || '').trim()
          }
        });
      }

      const updateData: any = {
        Nombre: (data.nombre || '').trim(),
        Apellido: (data.apellido || '').trim(),
        Genero: data.genero,
        Nacionalidad: data.nacionalidad
      };

      if (data.fechaNac) {
        updateData.Fecha_Nacimiento = new Date(data.fechaNac);
      }

      const paciente = await tx.paciente.update({
        where: { ID_Paciente: id },
        data: updateData
      });

      if (!data.esAdulto && data.datosMenor) {
        await tx.paciente_Menor.update({
          where: { ID_Paciente_Menor: id },
          data: {
            PartidaDeNacimiento: (data.datosMenor.partNacimiento || '').trim(),
            Grado_Escolar: data.datosMenor.grado
          }
        });
      }

      if (data.esAdulto && data.datosAdulto) {
        await tx.pacienteAdulto.update({
          where: { ID_PacienteAdulto: id },
          data: {
            No_Cedula: (data.datosAdulto.cedula || '').trim(),
            No_Telefono: validarTelefonoNica(data.datosAdulto.telefono, 'Adulto'),
            ID_Ocupacion: Number(data.datosAdulto.ocupacionId),
            ID_EstadoCivil: Number(data.datosAdulto.estadoCivilId)
          }
        });
      }

      return paciente;
    });
  },

  getHistorialPaciente: async (id: number) => {
    const exp = await prisma.expediente.findUnique({
      where: { ID_Paciente: id }
    });

    if (!exp) return [];

    return await prisma.sesion.findMany({
      where: { ID_Expediente: exp.ID_Expediente },
      include: {
        Expediente: true,
        Cita: {
          include: {
            Psicologo: true,
            TipoDeCita: true,
            Paciente: {
              include: {
                Direccion: true,
                PacienteAdulto: {
                  include: {
                    Ocupacion: true,
                    EstadoCivil: true
                  }
                },
                Paciente_Menor: true
              }
            }
          }
        },
        Tratamiento: {
          include: {
            Tratamiento_Farmaceutico: true,
            Tratamiento_Terapeutico: {
              include: {
                TipoDe_Terapia: true
              }
            }
          }
        }
      },
      orderBy: { ID_Sesion: 'asc' }
    });
  }
};