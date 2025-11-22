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

// --- HELPER 1: VALIDACIÓN FORMATO CÉDULA ---
const validarFormatoCedula = (cedula: string, contexto: string) => {
  // Regex estricto: 3 digitos - 6 digitos - 4 digitos + Letra Mayúscula
  const regex = /^\d{3}-\d{6}-\d{4}[A-Z]$/;
  if (!regex.test(cedula)) {
    throw new Error(`La cédula proporcionada para ${contexto} (${cedula}) tiene un formato inválido. Debe ser XXX-XXXXXX-XXXXL`);
  }
};

// --- HELPER 2: VALIDACIÓN DUPLICADOS (UNICIDAD) ---
const validarCedulaUnica = async (cedula: string, tipo: 'paciente' | 'tutor', idExcluir?: number) => {
  if (tipo === 'paciente') {
    const existe = await prisma.pacienteAdulto.findFirst({
      where: {
        No_Cedula: cedula,
        // Si estamos editando, excluimos al propio paciente de la búsqueda
        ID_PacienteAdulto: idExcluir ? { not: idExcluir } : undefined
      }
    });
    if (existe) throw new Error(`La cédula ${cedula} ya está registrada en otro PACIENTE.`);
  } 
  
  if (tipo === 'tutor') {
    const existe = await prisma.tutor.findFirst({
      where: {
        No_Cedula: cedula,
        ID_Tutor: idExcluir ? { not: idExcluir } : undefined
      }
    });
    if (existe) throw new Error(`La cédula ${cedula} ya está registrada en otro TUTOR.`);
  }
};

// --- HELPER 3: MATCHING SECUENCIAL (LÓGICA DE FECHAS) ---
const corregirFechasSesiones = (sesiones: any[], citas: any[]) => {
  // 1. Filtramos solo citas COMPLETADAS (ID 2) y las ordenamos por fecha descendente.
  let citasDisponibles = citas
    .filter(c => c.ID_EstadoCita === 2)
    .sort((a, b) => new Date(b.FechaCita).getTime() - new Date(a.FechaCita).getTime());

  return sesiones.map(sesion => {
    // 2. Buscamos la primera cita disponible de ESTE doctor.
    const matchIndex = citasDisponibles.findIndex(c => c.ID_Psicologo === sesion.ID_Psicologo);

    let nuevaFechaInicio;

    if (matchIndex !== -1) {
      // ¡MATCH ENCONTRADO!
      const cita = citasDisponibles[matchIndex];
      
      // 3. Construimos la fecha correcta: Año/Mes/Dia de Cita + Hora de Sesion
      const fechaBaseCita = new Date(cita.FechaCita);
      const horaSesion = new Date(sesion.HoraDeInicio);
      
      nuevaFechaInicio = new Date(fechaBaseCita);
      // Inyectamos la hora usando UTC
      nuevaFechaInicio.setUTCHours(horaSesion.getUTCHours(), horaSesion.getUTCMinutes(), 0, 0);
      
      // 4. "Consumimos" la cita
      citasDisponibles.splice(matchIndex, 1);
    } else {
      // Fallback
      nuevaFechaInicio = new Date(sesion.HoraDeInicio);
    }

    return {
      ...sesion,
      HoraDeInicio: nuevaFechaInicio,
      FechaReal: nuevaFechaInicio 
    };
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
      // 1. Paciente
      prisma.paciente.findUnique({
        where: { ID_Paciente: id },
        include: {
          DireccionPaciente: true,
          EstadoDeActividad: true,
          PacienteAdulto: { include: { Ocupacion: true, EstadoCivil: true } },
          PacienteMenor: { 
            include: { 
              Tutor: { include: { Parentesco: true, Ocupacion: true, EstadoCivil: true, DireccionTutor: true } } 
            } 
          }
        }
      }),
      // 2. Citas (Traemos TODAS para poder filtrar en el helper)
      prisma.cita.findMany({
        where: { ID_Paciente: id },
        include: { Psicologo: true, TipoDeCita: true, EstadoCita: true },
        orderBy: { FechaCita: 'desc' }
      }),
      // 3. Sesiones
      prisma.sesion.findMany({
        where: { ID_Paciente: id },
        include: { Psicologo: true },
        orderBy: { ID_Sesion: 'desc' }
      })
    ]);

    if (!paciente) return null;

    // Aplicamos la corrección secuencial
    const sesionesCorregidas = corregirFechasSesiones(sesionesRaw, citas);

    return { paciente, citas, sesiones: sesionesCorregidas };
  },

  create: async (data: CreatePacienteDTO) => {
    // --- VALIDACIONES PREVIAS (Backend Check) ---
    
    // 1. Validar Paciente Adulto (Cédula y Unicidad)
    if (data.esAdulto && data.datosAdulto) {
       const cedula = data.datosAdulto.cedula;
       validarFormatoCedula(cedula, 'Paciente Adulto');
       await validarCedulaUnica(cedula, 'paciente');
    }

    // 2. Validar Nuevo Tutor (Cédula y Unicidad)
    if (!data.esAdulto && data.datosMenor?.modoTutor === 'nuevo' && data.datosMenor.nuevoTutor) {
       const tutor = data.datosMenor.nuevoTutor;
       
       // A. Validar Cédula
       validarFormatoCedula(tutor.cedula, 'Nuevo Tutor');
       await validarCedulaUnica(tutor.cedula, 'tutor');

       // B. VALIDACIÓN DE CATÁLOGOS (¡AQUÍ ESTÁ LA CORRECCIÓN DEL ERROR FK!)
       if (!Number(tutor.ocupacionId) || Number(tutor.ocupacionId) <= 0) {
          throw new Error("Debe seleccionar una Ocupación válida para el Tutor.");
       }
       if (!Number(tutor.estadoCivilId) || Number(tutor.estadoCivilId) <= 0) {
          throw new Error("Debe seleccionar un Estado Civil válido para el Tutor.");
       }
       if (!Number(tutor.parentescoId) || Number(tutor.parentescoId) <= 0) {
          throw new Error("Debe seleccionar un Parentesco válido para el Tutor.");
       }
    }
    // --------------------------------------------

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
      
      // ... (Resto del código create igual) ...
      
      const nuevoPaciente = await tx.paciente.create({
        data: {
          Nombre: data.nombre,
          Apellido: data.apellido,
          Fecha_Nac: new Date(data.fechaNac),
          Genero: data.genero,
          Nacionalidad: data.nacionalidad,
          ID_DireccionPaciente: nuevaDireccion.ID_DireccionPaciente,
          ID_EstadoDeActividad: 1
        }
      });

      if (data.esAdulto && data.datosAdulto) {
        // Validamos también aquí por seguridad extra
        if (!Number(data.datosAdulto.ocupacionId) || !Number(data.datosAdulto.estadoCivilId)) {
            throw new Error("Datos de Ocupación o Estado Civil inválidos para el Paciente Adulto.");
        }

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
           
           // Al llegar aquí, ya validamos arriba que los IDs son números válidos > 0
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
    // --- VALIDACIONES PREVIAS (Update) ---
    if (data.esAdulto && data.datosAdulto) {
        const cedula = data.datosAdulto.cedula;
        validarFormatoCedula(cedula, 'Paciente Adulto');
        // Validamos duplicado excluyendo el ID actual para permitir guardar sin cambios
        await validarCedulaUnica(cedula, 'paciente', id);
    }
    // Nota: No validamos tutor aquí porque solo enlazamos ID, no creamos uno nuevo.
    // -------------------------------------

    return await prisma.$transaction(async (tx) => {
      const pacienteActualizado = await tx.paciente.update({
        where: { ID_Paciente: id },
        data: {
          ID_EstadoDeActividad: Number(data.ID_EstadoDeActividad),
          Nombre: data.nombre,
          Apellido: data.apellido,
          Fecha_Nac: new Date(data.fechaNac),
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

  getHistorial: async (id: number) => {
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

    const citas = await prisma.cita.findMany({
      where: { ID_Paciente: id } 
    });

    return corregirFechasSesiones(sesiones, citas);
  }
};