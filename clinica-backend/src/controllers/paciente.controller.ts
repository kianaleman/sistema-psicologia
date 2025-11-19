import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: Obtener todos los pacientes
export const getPacientes = async (req: Request, res: Response) => {
  try {
    const pacientes = await prisma.paciente.findMany({
      include: {
        DireccionPaciente: true,
        PacienteAdulto: true,
        PacienteMenor: { include: { Tutor: true } },
        EstadoDeActividad: true
      }
    });
    res.json(pacientes);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo pacientes' });
  }
};

// GET: Obtener expediente completo de UNO
export const getExpediente = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [paciente, citas, sesiones] = await Promise.all([
      prisma.paciente.findUnique({
        where: { ID_Paciente: parseInt(id) },
        include: {
          DireccionPaciente: true,
          EstadoDeActividad: true,
          PacienteAdulto: { include: { Ocupacion: true, EstadoCivil: true } },
          PacienteMenor: { 
            include: { 
              Tutor: { 
                include: { Parentesco: true, Ocupacion: true, EstadoCivil: true, DireccionTutor: true } 
              } 
            } 
          }
        }
      }),
      prisma.cita.findMany({
        where: { ID_Paciente: parseInt(id) },
        include: { Psicologo: true, TipoDeCita: true, EstadoCita: true },
        orderBy: { FechaCita: 'desc' }
      }),
      prisma.sesion.findMany({
        where: { ID_Paciente: parseInt(id) },
        include: { Psicologo: true },
        orderBy: { ID_Sesion: 'desc' }
      })
    ]);

    if (!paciente) return res.status(404).json({ error: 'Paciente no encontrado' });
    res.json({ paciente, citas, sesiones });
  } catch (error) {
    res.status(500).json({ error: 'Error al cargar expediente' });
  }
};

// POST: Crear Paciente
export const createPaciente = async (req: Request, res: Response) => {
  const { nombre, apellido, fechaNac, genero, nacionalidad, direccion, esAdulto, datosAdulto, datosMenor } = req.body;
  try {
    const result = await prisma.$transaction(async (tx) => {
      const nuevaDireccion = await tx.direccionPaciente.create({
        data: {
          Pais: direccion.pais || 'Nicaragua',
          Departamento: direccion.departamento,
          Ciudad: direccion.ciudad,
          Barrio: direccion.barrio,
          Calle: direccion.calle
        }
      });

      const nuevoPaciente = await tx.paciente.create({
        data: {
          Nombre: nombre,
          Apellido: apellido,
          Fecha_Nac: new Date(fechaNac),
          Genero: genero,
          Nacionalidad: nacionalidad,
          ID_DireccionPaciente: nuevaDireccion.ID_DireccionPaciente,
          ID_EstadoDeActividad: 1
        }
      });

      if (esAdulto) {
        await tx.pacienteAdulto.create({
          data: {
            ID_PacienteAdulto: nuevoPaciente.ID_Paciente,
            No_Cedula: datosAdulto.cedula,
            No_Telefono: datosAdulto.telefono,
            ID_Ocupacion: parseInt(datosAdulto.ocupacionId),
            ID_EstadoCivil: parseInt(datosAdulto.estadoCivilId)
          }
        });
      } else {
        let idTutorFinal = null;
        if (datosMenor.modoTutor === 'existente') {
           idTutorFinal = parseInt(datosMenor.tutorId);
        } else {
           const dirTutor = await tx.direccionTutor.create({
             data: {
               Pais: 'Nicaragua',
               Departamento: datosMenor.nuevoTutor.direccion.departamento,
               Ciudad: datosMenor.nuevoTutor.direccion.ciudad,
               Barrio: datosMenor.nuevoTutor.direccion.barrio,
               Calle: datosMenor.nuevoTutor.direccion.calle
             }
           });
           const tutorCreado = await tx.tutor.create({
             data: {
               No_Cedula: datosMenor.nuevoTutor.cedula,
               Nombre: datosMenor.nuevoTutor.nombre,
               Apellido: datosMenor.nuevoTutor.apellido,
               No_Telefono: datosMenor.nuevoTutor.telefono,
               ID_Parentesco: parseInt(datosMenor.nuevoTutor.parentescoId),
               ID_Ocupacion: parseInt(datosMenor.nuevoTutor.ocupacionId),
               ID_EstadoCivil: parseInt(datosMenor.nuevoTutor.estadoCivilId),
               ID_DireccionTutor: dirTutor.ID_DireccionTutor
             }
           });
           idTutorFinal = tutorCreado.ID_Tutor;
        }
        await tx.pacienteMenor.create({
          data: {
            ID_PacienteMenor: nuevoPaciente.ID_Paciente,
            PartNacimiento: datosMenor.partNacimiento,
            GradoEscolar: datosMenor.grado,
            ID_Tutor: idTutorFinal
          }
        });
      }
      return nuevoPaciente;
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Error registrando paciente' });
  }
};

// PUT: Actualizar Paciente
export const updatePaciente = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { nombre, apellido, fechaNac, genero, nacionalidad, direccion, ID_EstadoDeActividad, esAdulto, datosAdulto, datosMenor } = req.body;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const pacienteActualizado = await tx.paciente.update({
        where: { ID_Paciente: parseInt(id) },
        data: {
          ID_EstadoDeActividad: parseInt(ID_EstadoDeActividad),
          Nombre: nombre,
          Apellido: apellido,
          Fecha_Nac: new Date(fechaNac),
          Genero: genero,
          Nacionalidad: nacionalidad,
        }
      });

      await tx.direccionPaciente.update({
        where: { ID_DireccionPaciente: pacienteActualizado.ID_DireccionPaciente },
        data: {
          Departamento: direccion.departamento,
          Ciudad: direccion.ciudad,
          Barrio: direccion.barrio,
          Calle: direccion.calle
        }
      });

      if (esAdulto) {
        await tx.pacienteAdulto.update({
          where: { ID_PacienteAdulto: parseInt(id) },
          data: {
            No_Cedula: datosAdulto.cedula,
            No_Telefono: datosAdulto.telefono,
            ID_Ocupacion: parseInt(datosAdulto.ocupacionId),
            ID_EstadoCivil: parseInt(datosAdulto.estadoCivilId)
          }
        });
      } else {
        await tx.pacienteMenor.update({
          where: { ID_PacienteMenor: parseInt(id) },
          data: {
            PartNacimiento: datosMenor.partNacimiento,
            GradoEscolar: datosMenor.grado,
            ID_Tutor: parseInt(datosMenor.tutorId)
          }
        });
      }
      return pacienteActualizado;
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Error actualizando paciente' });
  }
};

// GET: Historial de sesiones (mini-expediente)
export const getHistorialPaciente = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const sesiones = await prisma.sesion.findMany({
        where: { ID_Paciente: parseInt(id) },
        include: { Psicologo: true, Expediente: true },
        orderBy: { ID_Sesion: 'desc' } 
      });
  
      const citas = await prisma.cita.findMany({
        where: { ID_Paciente: parseInt(id), ID_EstadoCita: 2 }
      });
  
      const historialCombinado = sesiones.map(sesion => {
        const citaMatch = citas.find(c => 
           c.ID_Psicologo === sesion.ID_Psicologo &&
           new Date(c.HoraCita).toLocaleTimeString('en-GB', {timeZone: 'UTC', hour: '2-digit', minute: '2-digit'}) ===
           new Date(sesion.HoraDeInicio).toLocaleTimeString('en-GB', {timeZone: 'UTC', hour: '2-digit', minute: '2-digit'})
        );
        return {
          ...sesion,
          FechaReal: citaMatch ? citaMatch.FechaCita : new Date() 
        };
      });
  
      if (historialCombinado.length > 0) res.json(historialCombinado);
      else res.status(404).json({ error: 'Sin sesiones previas' });
    } catch (error) {
      res.status(500).json({ error: 'Error buscando historial' });
    }
};