import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// DTO simplificado: Sin objeto de dirección
interface UpdateTutorDTO {
  Nombre: string;
  Apellido: string;
  No_Cedula: string;
  No_Telefono: string;
  ID_Ocupacion: number;
  ID_EstadoCivil: number;
}

// --- HELPERS DE VALIDACIÓN ---
const validarFormatoCedula = (cedula: string) => {
  const regex = /^\d{3}-\d{6}-\d{4}[A-Z]$/;
  if (!regex.test(cedula)) {
    throw new Error('Formato de cédula inválido. Debe ser XXX-XXXXXX-XXXXL');
  }
};

const validarTelefonoNica = (telefono: string) => {
  const limpio = String(telefono).replace(/[\s-]/g, '');
  const regex = /^[2578]\d{7}$/;
  if (!regex.test(limpio)) {
    throw new Error('Teléfono inválido. Debe ser de 8 dígitos e iniciar con 2, 5, 7 u 8.');
  }
  return limpio;
};

export const TutorService = {
  
  // 1. Obtener todos los tutores (Solo datos personales y relaciones de ocupación/pacientes)
  getAll: async () => {
    return await prisma.tutor.findMany({
      include: {
        // Nombres de relación según el db pull de tu nueva base de datos
        Ocupacion_Tutor_OcupacionToOcupacion: true, 
        EstadoCivil_Tutor_EstadoCivilToEstadoCivil: true,
        Tutor_PacienteMenor: {
          include: {
            Parentesco: true, 
            Paciente_Menor: { 
              include: { 
                Paciente: true 
              } 
            }
          }
        }
      },
      orderBy: { Nombre: 'asc' }
    });
  },

  // 2. Actualizar Tutor (Sin tocar direcciones)
  update: async (id: number, data: UpdateTutorDTO) => {
    validarFormatoCedula(data.No_Cedula);
    const telefonoLimpio = validarTelefonoNica(data.No_Telefono);

    // Validar si existe
    const existe = await prisma.tutor.findUnique({ where: { ID_Tutor: id } });
    if (!existe) throw new Error('Tutor no encontrado');

    // Validar duplicidad de cédula
    const cedulaDuplicada = await prisma.tutor.findFirst({
        where: {
            No_Cedula: data.No_Cedula,
            ID_Tutor: { not: id }
        }
    });
    if (cedulaDuplicada) {
        throw new Error(`La cédula ${data.No_Cedula} ya la tiene otro tutor registrado.`);
    }

    // Actualización directa en dbo.Tutor
    return await prisma.tutor.update({
      where: { ID_Tutor: id },
      data: {
        Nombre: data.Nombre,
        Apellido: data.Apellido,
        No_Cedula: data.No_Cedula,
        No_Telefono: telefonoLimpio,
        // Usando los IDs directos como campos FK
        Ocupacion: Number(data.ID_Ocupacion),
        EstadoCivil: Number(data.ID_EstadoCivil)
      }
    });
  }
};