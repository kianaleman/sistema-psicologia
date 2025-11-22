import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// DTO para actualización
interface UpdateTutorDTO {
  Nombre: string;
  Apellido: string;
  No_Cedula: string;
  No_Telefono: string;
  ID_Parentesco: number;
  ID_Ocupacion: number;
  ID_EstadoCivil: number;
  DireccionTutor: {
    Departamento: string;
    Ciudad: string;
    Barrio: string;
    Calle: string;
  };
}

// --- HELPER: VALIDACIÓN FORMATO CÉDULA ---
const validarFormatoCedula = (cedula: string) => {
  const regex = /^\d{3}-\d{6}-\d{4}[A-Z]$/;
  if (!regex.test(cedula)) {
    throw new Error('Formato de cédula inválido. Debe ser XXX-XXXXXX-XXXXL (Ej: 001-010100-0000A)');
  }
};

export const TutorService = {
  
  getAll: async () => {
    return await prisma.tutor.findMany({
      include: {
        DireccionTutor: true, 
        Ocupacion: true, 
        EstadoCivil: true, 
        Parentesco: true,
        // Incluimos los menores a cargo para visualización en el frontend
        PacienteMenor: { 
          include: { Paciente: true } 
        }
      },
      orderBy: { Nombre: 'asc' }
    });
  },

  update: async (id: number, data: UpdateTutorDTO) => {
    // 1. VALIDACIÓN DE FORMATO
    validarFormatoCedula(data.No_Cedula);

    // 2. VALIDACIÓN DE UNICIDAD (DUPLICADOS)
    // Buscamos si existe OTRO tutor (que no sea este mismo ID) con la misma cédula
    const cedulaDuplicada = await prisma.tutor.findFirst({
        where: {
            No_Cedula: data.No_Cedula,
            ID_Tutor: { not: id } // Excluimos al tutor actual de la búsqueda
        }
    });

    if (cedulaDuplicada) {
        throw new Error(`Error de duplicidad: La cédula ${data.No_Cedula} ya pertenece al tutor ${cedulaDuplicada.Nombre} ${cedulaDuplicada.Apellido}.`);
    }

    // 3. VERIFICAR EXISTENCIA
    const existe = await prisma.tutor.findUnique({ where: { ID_Tutor: id } });
    if (!existe) throw new Error('Tutor no encontrado');

    // 4. ACTUALIZAR
    return await prisma.tutor.update({
      where: { ID_Tutor: id },
      data: {
        Nombre: data.Nombre,
        Apellido: data.Apellido,
        No_Cedula: data.No_Cedula,
        No_Telefono: data.No_Telefono,
        // Actualización de Relaciones (FKs)
        Parentesco: { connect: { ID_Parentesco: Number(data.ID_Parentesco) } },
        Ocupacion: { connect: { ID_Ocupacion: Number(data.ID_Ocupacion) } },
        EstadoCivil: { connect: { ID_EstadoCivil: Number(data.ID_EstadoCivil) } },
        // Actualización anidada de dirección
        DireccionTutor: {
          update: {
            Departamento: data.DireccionTutor.Departamento,
            Ciudad: data.DireccionTutor.Ciudad,
            Barrio: data.DireccionTutor.Barrio,
            Calle: data.DireccionTutor.Calle
          }
        }
      }
    });
  }
};