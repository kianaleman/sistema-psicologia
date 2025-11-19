import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: Tutores con pacientes
export const getTutores = async (req: Request, res: Response) => {
  try {
    const tutores = await prisma.tutor.findMany({
      include: {
        DireccionTutor: true, Ocupacion: true, EstadoCivil: true, Parentesco: true,
        PacienteMenor: { include: { Paciente: true } }
      },
      orderBy: { Nombre: 'asc' }
    });
    res.json(tutores);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener tutores' });
  }
};

// PUT: Actualizar Tutor
export const updateTutor = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { Nombre, Apellido, No_Cedula, No_Telefono, ID_Parentesco, ID_Ocupacion, ID_EstadoCivil, DireccionTutor } = req.body;

  try {
    const tutorActualizado = await prisma.tutor.update({
      where: { ID_Tutor: parseInt(id) },
      data: {
        Nombre, Apellido, No_Cedula, No_Telefono,
        Parentesco: { connect: { ID_Parentesco: parseInt(ID_Parentesco) } },
        Ocupacion: { connect: { ID_Ocupacion: parseInt(ID_Ocupacion) } },
        EstadoCivil: { connect: { ID_EstadoCivil: parseInt(ID_EstadoCivil) } },
        DireccionTutor: {
          update: {
            Departamento: DireccionTutor.Departamento,
            Ciudad: DireccionTutor.Ciudad,
            Barrio: DireccionTutor.Barrio,
            Calle: DireccionTutor.Calle
          }
        }
      }
    });
    res.json(tutorActualizado);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar tutor' });
  }
};