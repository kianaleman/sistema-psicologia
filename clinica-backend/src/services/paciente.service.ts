import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// --- DTOs Actualizados ---
interface CreatePacienteDTO {
  nombre: string;
  apellido: string;
  fechaNac: string | Date;
  genero: string;
  paisId: number; // Reemplaza a 'nacionalidad'
  direccion: { municipioId: number; barrio: string; calle?: string; }; // Usando catálogos de geografía
  esAdulto: boolean;
  datosAdulto?: { cedula: string; codigoTelefonoId: number; telefono: string; ocupacionId: number; estadoCivilId: number; };
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
  activo: boolean; // Reemplaza a ID_EstadoDeActividad
}

// --- HELPERS ---
const validarFormatoCedula = (cedula: string, contexto: string) => {
  const regex = /^\d{3}-\d{6}-\d{4}[A-Z]$/;
  if (!regex.test(cedula)) {
    throw new Error(`La cédula proporcionada para ${contexto} (${cedula}) tiene un formato inválido. Debe ser XXX-XXXXXX-XXXXL`);
  }
};

const validarCedulaUnica = async (cedula: string, tipo: 'paciente' | 'tutor', idExcluir?: number) => {
  if (tipo === 'paciente') {
    // Construimos el objeto where de forma dinámica
    const whereClause: any = { No_Cedula: cedula };
    if (idExcluir) {
      whereClause.ID_PacienteAdulto = { not: idExcluir };
    }

    const existe = await prisma.pacienteAdulto.findFirst({ where: whereClause });
    if (existe) throw new Error(`La cédula ${cedula} ya está registrada en otro PACIENTE.`);
  }

  if (tipo === 'tutor') {
    const whereClause: any = { No_Cedula: cedula };
    if (idExcluir) {
      whereClause.ID_Tutor = { not: idExcluir };
    }

    const existe = await prisma.tutor.findFirst({ where: whereClause });
    if (existe) throw new Error(`La cédula ${cedula} ya está registrada en otro TUTOR.`);
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

// ❌ Se eliminó la función corregirFechasSesiones() ya que ahora existe una FK directa entre Cita y Sesion.

export const PacienteService = {

  getAll: async () => {
    return await prisma.paciente.findMany({
      include: {
        Pais: true, // Nuevo Catálogo
        Direccion: {
          include: { Municipio: { include: { Departamento: true } } }
        },
        PacienteAdulto: true,
        // Nueva estructura para menores debido a la tabla intermedia
        Paciente_Menor: {
          include: {
            Tutor_PacienteMenor: { include: { Tutor: true, Parentesco: true } }
          }
        }
      }
    });
  },

  getExpediente: async (id: number) => {
    const paciente = await prisma.paciente.findUnique({
      where: { ID_Paciente: id },
      include: {
        Pais: true,
        Direccion: { include: { Municipio: { include: { Departamento: true } } } },
        PacienteAdulto: { include: { Ocupacion: true, EstadoCivil: true, CodigoTelefonoPais: true } },
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
                            Departamento: true
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        // Al consultar las citas, traemos su sesión (1:1) directamente
        Cita: {
          select: {
            ID_Cita: true, FechaCita: true, HoraCita: true, MotivoConsulta: true, ID_EstadoCita: true, ID_Psicologo: true,
            EstadoCita: { select: { NombreEstado: true } },
            TipoDeCita: { select: { Nombre_DeCita: true } }, // Renombrado en la DB
            Psicologo: { select: { Nombre: true, Apellido: true } },
            Sesion: { // <--- Magia de la nueva FK
              select: {
                ID_Sesion: true, HoraDeInicio: true, HoraFinal: true, Observaciones: true, DiagnosticoDiferencial: true, HistorialDeEvolucion: true, Criterios_DeDiagnostico: true,
                Tratamiento: {
                  select: {
                    Frecuencia: true, FechaInicio: true,
                    Tratamiento_Farmaceutico: { select: { Nombre_Medicamento: true, Dosis: true } },
                    Tratamiento_Terapeutico: { select: { Objetivo: true } }
                  }
                }
              }
            }
          },
          orderBy: { FechaCita: 'desc' }
        }
      }
    });

    if (!paciente) return null;

    // Separamos las citas y sesiones para mantener la compatibilidad con el formato de respuesta antiguo.
    // Cada sesion incluye datos basicos de la cita y del psicologo para facilitar su uso en el frontend.
    const citas = paciente.Cita.map((c) => {
      const { Sesion, ...datosCita } = c;
      return datosCita;
    });

    const sesiones = paciente.Cita
      .filter((c) => c.Sesion !== null)
      .map((c) => ({
        ...c.Sesion!,
        Psicologo: c.Psicologo,
        FechaCita: c.FechaCita,
        HoraCita: c.HoraCita,
        ID_Cita: c.ID_Cita
      }));

    return { paciente, citas, sesiones };
  },

  create: async (data: CreatePacienteDTO) => {
    const fechaNacObj = new Date(data.fechaNac);
    const anio = fechaNacObj.getFullYear();
    if (isNaN(fechaNacObj.getTime()) || anio < 1900 || anio > new Date().getFullYear()) {
      throw new Error("Fecha de nacimiento inválida.");
    }

    if (data.esAdulto && data.datosAdulto) {
      validarFormatoCedula(data.datosAdulto.cedula, 'Paciente Adulto');
      await validarCedulaUnica(data.datosAdulto.cedula, 'paciente');
      data.datosAdulto.telefono = validarTelefonoNica(data.datosAdulto.telefono, 'Paciente Adulto');

      if (!data.datosAdulto.ocupacionId || !data.datosAdulto.estadoCivilId || !data.datosAdulto.codigoTelefonoId) {
        throw new Error("Datos de Ocupación, Estado Civil o Código de Teléfono inválidos.");
      }
    }

    if (!data.esAdulto && data.datosMenor?.modoTutor === 'nuevo' && data.datosMenor.nuevoTutor) {
      const tutor = data.datosMenor.nuevoTutor;
      validarFormatoCedula(tutor.cedula, 'Nuevo Tutor');
      await validarCedulaUnica(tutor.cedula, 'tutor');
      tutor.telefono = validarTelefonoNica(tutor.telefono, 'Nuevo Tutor');

      if (!tutor.ocupacionId || !tutor.estadoCivilId || !tutor.parentescoId || !tutor.codigoTelefonoId) {
        throw new Error("Datos incompletos para el Tutor.");
      }
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Crear Dirección (con catálogo de municipios)
      const nuevaDireccion = await tx.direccion.create({
        data: {
          Pais: 'Nicaragua', // Soluciona el error: Prisma exige la columna Pais
          ID_Municipio: data.direccion.municipioId,
          Barrio: data.direccion.barrio,
          Calle: data.direccion.calle || null // Convierte undefined a null
        }
      });

      // 2. Crear Paciente (con catálogo de país)
      const nuevoPaciente = await tx.paciente.create({
        data: {
          Nombre: data.nombre,
          Apellido: data.apellido,
          Fecha_Nacimiento: fechaNacObj, // Renombrado
          Genero: data.genero,
          ID_Pais: data.paisId,
          ID_Direccion: nuevaDireccion.ID_Direccion,
          Activo: true // Renombrado
        }
      });

      // 3. Lógica para Adulto vs Menor
      if (data.esAdulto && data.datosAdulto) {
        await tx.pacienteAdulto.create({
          data: {
            ID_PacienteAdulto: nuevoPaciente.ID_Paciente,
            No_Cedula: data.datosAdulto.cedula,
            ID_CodigoTelefono: data.datosAdulto.codigoTelefonoId,
            No_Telefono: data.datosAdulto.telefono,
            ID_Ocupacion: data.datosAdulto.ocupacionId,
            ID_EstadoCivil: data.datosAdulto.estadoCivilId
          }
        });
      } else if (!data.esAdulto && data.datosMenor) {
        let idTutorFinal = null;
        const idParentescoFinal = data.datosMenor.nuevoTutor?.parentescoId || 6; // 6 = Tutor Legal por defecto

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
              Ocupacion: tutorData.ocupacionId, // El schema dice 'Ocupacion', no 'ID_Ocupacion'
              EstadoCivil: tutorData.estadoCivilId // El schema dice 'EstadoCivil', no 'ID_EstadoCivil'
            }
          });
          idTutorFinal = tutorCreado.ID_Tutor;
        }

        if (idTutorFinal) {
          await tx.paciente_Menor.create({
            data: {
              ID_Paciente_Menor: nuevoPaciente.ID_Paciente,
              PartidaDeNacimiento: data.datosMenor.partNacimiento,
              Grado_Escolar: data.datosMenor.grado
            }
          });

          // Llenar tabla intermedia Tutor_PacienteMenor
          await tx.tutor_PacienteMenor.create({
            data: {
              ID_Tutor: idTutorFinal,
              ID_Paciente_Menor: nuevoPaciente.ID_Paciente,
              ID_Parentesco: idParentescoFinal,
              Es_Contacto_Principal: true
            }
          });
        }
      }
      return nuevoPaciente;
    });
  },

  update: async (id: number, data: UpdatePacienteDTO) => {
    const fechaNacObj = new Date(data.fechaNac);
    if (isNaN(fechaNacObj.getTime())) throw new Error("Fecha inválida");

    if (data.esAdulto && data.datosAdulto) {
      validarFormatoCedula(data.datosAdulto.cedula, 'Paciente');
      await validarCedulaUnica(data.datosAdulto.cedula, 'paciente', id);
      data.datosAdulto.telefono = validarTelefonoNica(data.datosAdulto.telefono, 'Paciente');
    }

    return await prisma.$transaction(async (tx) => {
      const pacienteActualizado = await tx.paciente.update({
        where: { ID_Paciente: id },
        data: {
          Activo: data.activo,
          Nombre: data.nombre,
          Apellido: data.apellido,
          Fecha_Nacimiento: fechaNacObj,
          Genero: data.genero,
          ID_Pais: data.paisId,
        }
      });

      await tx.direccion.update({
        where: { ID_Direccion: pacienteActualizado.ID_Direccion },
        data: {
          ID_Municipio: data.direccion.municipioId,
          Barrio: data.direccion.barrio,
          Calle: data.direccion.calle || null // Soluciona la incompatibilidad de tipos
        }
      });

      if (data.esAdulto && data.datosAdulto) {
        await tx.pacienteAdulto.update({
          where: { ID_PacienteAdulto: id },
          data: {
            No_Cedula: data.datosAdulto.cedula,
            ID_CodigoTelefono: data.datosAdulto.codigoTelefonoId,
            No_Telefono: data.datosAdulto.telefono,
            ID_Ocupacion: data.datosAdulto.ocupacionId,
            ID_EstadoCivil: data.datosAdulto.estadoCivilId
          }
        });
      } else if (!data.esAdulto && data.datosMenor) {
        await tx.paciente_Menor.update({
          where: { ID_Paciente_Menor: id },
          data: {
            PartidaDeNacimiento: data.datosMenor.partNacimiento,
            Grado_Escolar: data.datosMenor.grado,
          }
        });

        // Si se necesita actualizar el tutor, se hace en la tabla intermedia Tutor_PacienteMenor
        if (data.datosMenor.tutorId) {
          await tx.tutor_PacienteMenor.updateMany({
            where: { ID_Paciente_Menor: id },
            data: { ID_Tutor: data.datosMenor.tutorId }
          });
        }
      }
      return pacienteActualizado;
    });
  },

  getHistorialPaciente: async (id: number) => {
    // Al igual que en Expediente, la llave foránea ahora nos hace el trabajo fácil
    const citasConSesion = await prisma.cita.findMany({
      where: { ID_Paciente: id, ID_EstadoCita: 2 }, // Solo citas realizadas
      include: {
        Psicologo: true,
        Sesion: {
          include: {
            Expediente: true,
            Tratamiento: {
              include: {
                Tratamiento_Farmaceutico: { include: { ViaAdministracion: true } },
                Tratamiento_Terapeutico: { include: { TipoDe_Terapia: true } } // Renombrado
              }
            }
          }
        }
      },
      orderBy: { FechaCita: 'desc' }
    });

    const citas = citasConSesion.map(c => {
      const { Sesion, ...datosCita } = c;
      return datosCita;
    });

    const sesiones = citasConSesion
      .filter((c) => c.Sesion !== null)
      .map((c) => ({
        ...c.Sesion!,
        Psicologo: c.Psicologo,
        FechaCita: c.FechaCita,
        HoraCita: c.HoraCita,
        ID_Cita: c.ID_Cita
      }));

    return { citas, sesiones };
  }
};