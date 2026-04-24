import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

const validarFormatoCedula = (cedula: string) => {
  const regex = /^\d{3}-\d{6}-\d{4}[A-Z]$/;
  if (!regex.test(cedula)) {
    throw new Error('Formato de cédula inválido. Debe ser XXX-XXXXXX-XXXXL');
  }
};

// Validar Teléfono Nica
const validarTelefonoNica = (telefono: string) => {
  const limpio = telefono.replace(/[\s-]/g, '');
  const regex = /^[2578]\d{7}$/;
  if (!regex.test(limpio)) {
    throw new Error('Teléfono inválido. Debe ser de 8 dígitos e iniciar con 2, 5, 7 u 8.');
  }
  return limpio;
};

export const TutorService = {
  
  getAll: async () => {
    return await prisma.tutor.findMany({
      include: {
        DireccionTutor: true, Ocupacion: true, EstadoCivil: true, Parentesco: true,
        PacienteMenor: { include: { Paciente: true } }
      },
      orderBy: { Nombre: 'asc' }
    });
  },

  update: async (id: number, data: UpdateTutorDTO) => {
    validarFormatoCedula(data.No_Cedula);
    
    // Validamos y limpiamos el teléfono antes de usarlo
    const telefonoLimpio = validarTelefonoNica(data.No_Telefono);

    const cedulaDuplicada = await prisma.tutor.findFirst({
        where: {
            No_Cedula: data.No_Cedula,
            ID_Tutor: { not: id }
        }
    });

    if (cedulaDuplicada) {
        throw new Error(`Error de duplicidad: La cédula ${data.No_Cedula} ya pertenece a otro Tutor.`);
    }

    const existe = await prisma.tutor.findUnique({ where: { ID_Tutor: id } });
    if (!existe) throw new Error('Tutor no encontrado');

    return await prisma.tutor.update({
      where: { ID_Tutor: id },
      data: {
        Nombre: data.Nombre,
        Apellido: data.Apellido,
        No_Cedula: data.No_Cedula,
        No_Telefono: telefonoLimpio, // Usamos el limpio
        Parentesco: { connect: { ID_Parentesco: Number(data.ID_Parentesco) } },
        Ocupacion: { connect: { ID_Ocupacion: Number(data.ID_Ocupacion) } },
        EstadoCivil: { connect: { ID_EstadoCivil: Number(data.ID_EstadoCivil) } },
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