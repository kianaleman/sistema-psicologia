import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: Listar Psicólogos
export const getPsicologos = async (req: Request, res: Response) => {
  try {
    const psicologos = await prisma.psicologo.findMany({
      include: {
        DireccionPsicologo: true, 
        EstadoDeActividad: true,
        Psicologo_EspecialidadPsicologo: { 
          include: { EspecialidadPsicologo: true }
        }
      },
      orderBy: { Nombre: 'asc' }
    });
    res.json(psicologos);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener psicólogos' });
  }
};

// POST: Crear Psicólogo
export const createPsicologo = async (req: Request, res: Response) => {
  const { Nombre, Apellido, CodigoDeMinsa, No_Telefono, Email, ID_EstadoDeActividad, direccion, especialidadIds } = req.body;

  try {
    const nuevoPsicologo = await prisma.$transaction(async (tx) => {
      const nuevaDireccion = await tx.direccionPsicologo.create({
        data: {
          Pais: direccion.Pais || 'Nicaragua',
          Departamento: direccion.Departamento,
          Ciudad: direccion.Ciudad,
          Barrio: direccion.Barrio,
          Calle: direccion.Calle
        }
      });

      const psicologoCreado = await tx.psicologo.create({
        data: {
          CodigoDeMinsa, Nombre, Apellido, No_Telefono, Email,
          ID_DireccionPsicologo: nuevaDireccion.ID_DireccionPsicologo,
          ID_EstadoDeActividad: parseInt(ID_EstadoDeActividad)
        }
      });

      if (especialidadIds && especialidadIds.length > 0) {
        const especialidadesData = especialidadIds.map((id: number) => ({
          ID_Psicologo: psicologoCreado.ID_Psicologo,
          ID_Especialidad: id
        }));
        await tx.psicologo_EspecialidadPsicologo.createMany({ data: especialidadesData });
      }
      return psicologoCreado;
    });
    res.json(nuevoPsicologo);
  } catch (error: any) {
    if (error.code === 'P2002') return res.status(400).json({ error: 'El Email o Código MINSA ya existe.' });
    res.status(500).json({ error: 'Error al crear psicólogo' });
  }
};

// PUT: Actualizar Psicólogo
export const updatePsicologo = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { Nombre, Apellido, CodigoDeMinsa, No_Telefono, Email, ID_EstadoDeActividad, direccion, especialidadIds } = req.body;

  try {
    const psicologoActual = await prisma.psicologo.findUnique({
      where: { ID_Psicologo: parseInt(id) },
      select: { ID_DireccionPsicologo: true }
    });

    if (!psicologoActual) return res.status(404).json({ error: 'Psicólogo no encontrado' });

    await prisma.$transaction(async (tx) => {
      await tx.psicologo.update({
        where: { ID_Psicologo: parseInt(id) },
        data: { CodigoDeMinsa, Nombre, Apellido, No_Telefono, Email, ID_EstadoDeActividad: parseInt(ID_EstadoDeActividad) }
      });

      await tx.direccionPsicologo.update({
        where: { ID_DireccionPsicologo: psicologoActual.ID_DireccionPsicologo },
        data: {
          Departamento: direccion.Departamento,
          Ciudad: direccion.Ciudad,
          Barrio: direccion.Barrio,
          Calle: direccion.Calle
        }
      });

      await tx.psicologo_EspecialidadPsicologo.deleteMany({ where: { ID_Psicologo: parseInt(id) } });

      if (especialidadIds && especialidadIds.length > 0) {
        const especialidadesData = especialidadIds.map((espId: number) => ({
          ID_Psicologo: parseInt(id),
          ID_Especialidad: espId
        }));
        await tx.psicologo_EspecialidadPsicologo.createMany({ data: especialidadesData });
      }
    });

    res.json({ message: 'Psicólogo actualizado correctamente' });
  } catch (error: any) {
    if (error.code === 'P2002') return res.status(400).json({ error: 'Datos duplicados (Email o Código).' });
    res.status(500).json({ error: 'Error al actualizar psicólogo' });
  }
};