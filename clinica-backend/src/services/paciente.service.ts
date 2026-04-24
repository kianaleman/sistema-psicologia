import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// --- DTOs ---
interface CreatePacienteDTO {
  nombre: string;
  apellido: string;
  fechaNac: string | Date;
  genero: string;
  nacionalidad: string;
  direccion: { pais?: string; departamento: string; ciudad: string; barrio: string; calle: string; };
  esAdulto: boolean;
  datosAdulto?: { cedula: string; telefono: string; ocupacionId: string | number; estadoCivilId: string | number; };
  datosMenor?: { 
    partNacimiento: string; grado: string; modoTutor: 'existente' | 'nuevo'; tutorId?: string | number;
    nuevoTutor?: { cedula: string; nombre: string; apellido: string; telefono: string; parentescoId: string | number; ocupacionId: string | number; estadoCivilId: string | number; direccion: { departamento: string; ciudad: string; barrio: string; calle: string; }; };
  };
}

interface UpdatePacienteDTO extends CreatePacienteDTO {
  ID_EstadoDeActividad: string | number;
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
    const existe = await prisma.pacienteAdulto.findFirst({
      where: { No_Cedula: cedula, ID_PacienteAdulto: idExcluir ? { not: idExcluir } : undefined }
    });
    if (existe) throw new Error(`La cédula ${cedula} ya está registrada en otro PACIENTE.`);
  } 
  if (tipo === 'tutor') {
    const existe = await prisma.tutor.findFirst({
      where: { No_Cedula: cedula, ID_Tutor: idExcluir ? { not: idExcluir } : undefined }
    });
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

const corregirFechasSesiones = (sesiones: any[], citas: any[]) => {
  let citasDisponibles = citas
    .filter(c => c.ID_EstadoCita === 2)
    .sort((a, b) => new Date(b.FechaCita).getTime() - new Date(a.FechaCita).getTime());

  return sesiones.map(sesion => {
    const matchIndex = citasDisponibles.findIndex(c => c.ID_Psicologo === sesion.ID_Psicologo);
    let nuevaFechaInicio;

    if (matchIndex !== -1) {
      const cita = citasDisponibles[matchIndex];
      const fechaBaseCita = new Date(cita.FechaCita);
      const horaSesion = new Date(sesion.HoraDeInicio);
      nuevaFechaInicio = new Date(fechaBaseCita);
      nuevaFechaInicio.setUTCHours(horaSesion.getUTCHours(), horaSesion.getUTCMinutes(), 0, 0);
      citasDisponibles.splice(matchIndex, 1);
    } else {
      nuevaFechaInicio = new Date(sesion.HoraDeInicio);
    }
    return { ...sesion, HoraDeInicio: nuevaFechaInicio, FechaReal: nuevaFechaInicio };
  });
};

export const PacienteService = {
  
  getAll: async () => {
    return await prisma.paciente.findMany({
      include: {
        DireccionPaciente: true,
        PacienteAdulto: true,
        PacienteMenor: { include: { Tutor: true } },
        EstadoDeActividad: true
      }
    });
  },

  getExpediente: async (id: number) => {
    const [paciente, citas, sesionesRaw] = await Promise.all([
      prisma.paciente.findUnique({
        where: { ID_Paciente: id },
        include: {
          DireccionPaciente: true,
          EstadoDeActividad: true,
          PacienteAdulto: { include: { Ocupacion: true, EstadoCivil: true } }, 
          PacienteMenor: { 
            include: { 
              Tutor: { 
                  include: { 
                      Parentesco: true, Ocupacion: true, EstadoCivil: true, DireccionTutor: true 
                  } 
              } 
            } 
          }
        }
      }),
      prisma.cita.findMany({
        where: { ID_Paciente: id },
        select: {
            ID_Cita: true, FechaCita: true, HoraCita: true, MotivoConsulta: true, ID_EstadoCita: true, ID_Psicologo: true,
            EstadoCita: { select: { NombreEstado: true } },
            TipoDeCita: { select: { NombreDeCita: true } },
            Psicologo: { select: { Nombre: true, Apellido: true } }
        },
        orderBy: { FechaCita: 'desc' }
      }),
      prisma.sesion.findMany({
        where: { ID_Paciente: id },
        select: {
            ID_Sesion: true, HoraDeInicio: true, HoraFinal: true, Observaciones: true, DiagnosticoDiferencial: true, HistorialDevolucion: true, CriteriosDeDiagnostico: true, ID_Psicologo: true,
            Psicologo: { select: { Nombre: true, Apellido: true } },
            Tratamiento: {
                select: {
                    Frecuencia: true, FechaInicio: true,
                    TratamientoFarmaceutico: { select: { NombreMedicamento: true, Dosis: true } },
                    TratamientoTerapeutico: { select: { Objetivo: true } }
                }
            }
        },
        orderBy: { ID_Sesion: 'desc' }
      })
    ]);

    if (!paciente) return null;
    const sesionesCorregidas = corregirFechasSesiones(sesionesRaw, citas);
    return { paciente, citas, sesiones: sesionesCorregidas };
  },

  create: async (data: CreatePacienteDTO) => {
    const fechaNacObj = new Date(data.fechaNac);
    const anio = fechaNacObj.getFullYear();
    if (isNaN(fechaNacObj.getTime()) || anio < 1900 || anio > new Date().getFullYear()) {
        throw new Error("Fecha de nacimiento inválida.");
    }

    let cedulaFinal = null;
    let telefonoFinal = null;

    if (data.esAdulto && data.datosAdulto) {
       validarFormatoCedula(data.datosAdulto.cedula, 'Paciente Adulto');
       await validarCedulaUnica(data.datosAdulto.cedula, 'paciente');
       data.datosAdulto.telefono = validarTelefonoNica(data.datosAdulto.telefono, 'Paciente Adulto');
       
       cedulaFinal = data.datosAdulto.cedula;
       telefonoFinal = data.datosAdulto.telefono;

       if (!Number(data.datosAdulto.ocupacionId) || !Number(data.datosAdulto.estadoCivilId)) {
            throw new Error("Datos de Ocupación o Estado Civil inválidos.");
       }
    }

    if (!data.esAdulto && data.datosMenor?.modoTutor === 'nuevo' && data.datosMenor.nuevoTutor) {
       const tutor = data.datosMenor.nuevoTutor;
       validarFormatoCedula(tutor.cedula, 'Nuevo Tutor');
       await validarCedulaUnica(tutor.cedula, 'tutor');
       tutor.telefono = validarTelefonoNica(tutor.telefono, 'Nuevo Tutor');

       if (!Number(tutor.ocupacionId) || Number(tutor.ocupacionId) <= 0 || 
           !Number(tutor.estadoCivilId) || Number(tutor.estadoCivilId) <= 0 || 
           !Number(tutor.parentescoId) || Number(tutor.parentescoId) <= 0) {
          throw new Error("Datos incompletos para el Tutor.");
       }
    }

    return await prisma.$transaction(async (tx) => {
      const nuevaDireccion = await tx.direccionPaciente.create({
        data: {
          Pais: data.direccion.pais || 'Nicaragua',
          Departamento: data.direccion.departamento,
          Ciudad: data.direccion.ciudad,
          Barrio: data.direccion.barrio,
          Calle: data.direccion.calle
        }
      });

      const nuevoPaciente = await tx.paciente.create({
        data: {
          Nombre: data.nombre,
          Apellido: data.apellido,
          Fecha_Nac: fechaNacObj,
          Genero: data.genero,
          Nacionalidad: data.nacionalidad,
          ID_DireccionPaciente: nuevaDireccion.ID_DireccionPaciente,
          ID_EstadoDeActividad: 1
        }
      });

      if (data.esAdulto && data.datosAdulto) {
        await tx.pacienteAdulto.create({
          data: {
            ID_PacienteAdulto: nuevoPaciente.ID_Paciente,
            No_Cedula: data.datosAdulto.cedula,
            No_Telefono: data.datosAdulto.telefono,
            ID_Ocupacion: Number(data.datosAdulto.ocupacionId),
            ID_EstadoCivil: Number(data.datosAdulto.estadoCivilId)
          }
        });
      } else if (!data.esAdulto && data.datosMenor) {
        let idTutorFinal = null;

        if (data.datosMenor.modoTutor === 'existente' && data.datosMenor.tutorId) {
           idTutorFinal = Number(data.datosMenor.tutorId);
        } else if (data.datosMenor.nuevoTutor) {
           const tutorData = data.datosMenor.nuevoTutor;
           const dirTutor = await tx.direccionTutor.create({
             data: {
               Pais: 'Nicaragua',
               Departamento: tutorData.direccion.departamento,
               Ciudad: tutorData.direccion.ciudad,
               Barrio: tutorData.direccion.barrio,
               Calle: tutorData.direccion.calle
             }
           });
           const tutorCreado = await tx.tutor.create({
             data: {
               No_Cedula: tutorData.cedula,
               Nombre: tutorData.nombre,
               Apellido: tutorData.apellido,
               No_Telefono: tutorData.telefono,
               ID_Parentesco: Number(tutorData.parentescoId),
               ID_Ocupacion: Number(tutorData.ocupacionId),
               ID_EstadoCivil: Number(tutorData.estadoCivilId),
               ID_DireccionTutor: dirTutor.ID_DireccionTutor
             }
           });
           idTutorFinal = tutorCreado.ID_Tutor;
        }

        if (idTutorFinal) {
            await tx.pacienteMenor.create({
              data: {
                ID_PacienteMenor: nuevoPaciente.ID_Paciente,
                PartNacimiento: data.datosMenor.partNacimiento,
                GradoEscolar: data.datosMenor.grado,
                ID_Tutor: idTutorFinal
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
          ID_EstadoDeActividad: Number(data.ID_EstadoDeActividad),
          Nombre: data.nombre,
          Apellido: data.apellido,
          Fecha_Nac: fechaNacObj,
          Genero: data.genero,
          Nacionalidad: data.nacionalidad,
        }
      });

      await tx.direccionPaciente.update({
        where: { ID_DireccionPaciente: pacienteActualizado.ID_DireccionPaciente },
        data: {
          Departamento: data.direccion.departamento,
          Ciudad: data.direccion.ciudad,
          Barrio: data.direccion.barrio,
          Calle: data.direccion.calle
        }
      });

      if (data.esAdulto && data.datosAdulto) {
        await tx.pacienteAdulto.update({
          where: { ID_PacienteAdulto: id },
          data: {
            No_Cedula: data.datosAdulto.cedula,
            No_Telefono: data.datosAdulto.telefono,
            ID_Ocupacion: Number(data.datosAdulto.ocupacionId),
            ID_EstadoCivil: Number(data.datosAdulto.estadoCivilId)
          }
        });
      } else if (!data.esAdulto && data.datosMenor) {
        await tx.pacienteMenor.update({
          where: { ID_PacienteMenor: id },
          data: {
            PartNacimiento: data.datosMenor.partNacimiento,
            GradoEscolar: data.datosMenor.grado,
            ID_Tutor: Number(data.datosMenor.tutorId)
          }
        });
      }
      return pacienteActualizado;
    });
  },

  // --- ESTA ES LA FUNCIÓN QUE FALTABA ---
  getHistorialPaciente: async (id: number) => {
    const sesiones = await prisma.sesion.findMany({
      where: { ID_Paciente: id },
      include: { 
        Psicologo: true, 
        Expediente: true,
        Tratamiento: {
          include: {
            TratamientoFarmaceutico: { include: { ViaAdministracion: true } },
            TratamientoTerapeutico: { include: { TipoDeTerapia: true } }
          }
        }
      },
      orderBy: { ID_Sesion: 'desc' } 
    });

    const citas = await prisma.cita.findMany({ where: { ID_Paciente: id } });
    return corregirFechasSesiones(sesiones, citas);
  }
};