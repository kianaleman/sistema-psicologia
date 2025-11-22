import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// DTOs
interface CreatePsicologoDTO {
  Nombre: string;
  Apellido: string;
  CodigoDeMinsa: string;
  No_Telefono: string;
  Email: string;
  ID_EstadoDeActividad: number;
  direccion: {
    Pais?: string;
    Departamento: string;
    Ciudad: string;
    Barrio: string;
    Calle: string;
  };
  especialidadIds: number[];
}

interface UpdatePsicologoDTO extends CreatePsicologoDTO {}

export const PsicologoService = {
  
  getAll: async () => {
    return await prisma.psicologo.findMany({
      include: {
        DireccionPsicologo: true, 
        EstadoDeActividad: true,
        Psicologo_EspecialidadPsicologo: { 
          include: { EspecialidadPsicologo: true }
        }
      },
      orderBy: { Nombre: 'asc' }
    });
  },

  create: async (data: CreatePsicologoDTO) => {
    return await prisma.$transaction(async (tx) => {
      // 1. Crear Dirección
      const nuevaDireccion = await tx.direccionPsicologo.create({
        data: {
          Pais: data.direccion.Pais || 'Nicaragua',
          Departamento: data.direccion.Departamento,
          Ciudad: data.direccion.Ciudad,
          Barrio: data.direccion.Barrio,
          Calle: data.direccion.Calle
        }
      });

      // 2. Crear Psicólogo
      const psicologoCreado = await tx.psicologo.create({
        data: {
          CodigoDeMinsa: data.CodigoDeMinsa,
          Nombre: data.Nombre,
          Apellido: data.Apellido,
          No_Telefono: data.No_Telefono,
          Email: data.Email,
          ID_DireccionPsicologo: nuevaDireccion.ID_DireccionPsicologo,
          ID_EstadoDeActividad: data.ID_EstadoDeActividad
        }
      });

      // 3. Asignar Especialidades (Relación M:N)
      if (data.especialidadIds && data.especialidadIds.length > 0) {
        const especialidadesData = data.especialidadIds.map((id) => ({
          ID_Psicologo: psicologoCreado.ID_Psicologo,
          ID_Especialidad: id
        }));
        await tx.psicologo_EspecialidadPsicologo.createMany({ data: especialidadesData });
      }
      
      return psicologoCreado;
    });
  },

  update: async (id: number, data: UpdatePsicologoDTO) => {
    // Verificamos existencia previa para obtener el ID de la dirección
    const psicologoActual = await prisma.psicologo.findUnique({
      where: { ID_Psicologo: id },
      select: { ID_DireccionPsicologo: true }
    });

    if (!psicologoActual) throw new Error('Psicólogo no encontrado');

    return await prisma.$transaction(async (tx) => {
      // 1. Actualizar Datos Básicos
      await tx.psicologo.update({
        where: { ID_Psicologo: id },
        data: { 
          CodigoDeMinsa: data.CodigoDeMinsa,
          Nombre: data.Nombre, 
          Apellido: data.Apellido, 
          No_Telefono: data.No_Telefono, 
          Email: data.Email, 
          ID_EstadoDeActividad: data.ID_EstadoDeActividad 
        }
      });

      // 2. Actualizar Dirección
      await tx.direccionPsicologo.update({
        where: { ID_DireccionPsicologo: psicologoActual.ID_DireccionPsicologo },
        data: {
          Departamento: data.direccion.Departamento,
          Ciudad: data.direccion.Ciudad,
          Barrio: data.direccion.Barrio,
          Calle: data.direccion.Calle
        }
      });

      // 3. Actualizar Especialidades (Estrategia: Borrar y Recrear)
      await tx.psicologo_EspecialidadPsicologo.deleteMany({ where: { ID_Psicologo: id } });

      if (data.especialidadIds && data.especialidadIds.length > 0) {
        const especialidadesData = data.especialidadIds.map((espId) => ({
          ID_Psicologo: id,
          ID_Especialidad: espId
        }));
        await tx.psicologo_EspecialidadPsicologo.createMany({ data: especialidadesData });
      }
      
      return { message: 'Psicólogo actualizado correctamente' };
    });
  }
};