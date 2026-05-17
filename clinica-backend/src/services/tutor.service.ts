import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface UpdateTutorDTO {
  Nombre: string;
  Apellido: string;
  No_Cedula: string;
  codigoTelefonoId: number; // Nuevo requerimiento del catálogo
  No_Telefono: string;
  ocupacionId: number;
  estadoCivilId: number;
  
  // ❌ ID_Parentesco se eliminó: Ahora pertenece a la tabla intermedia (Tutor_PacienteMenor)
  // ❌ DireccionTutor se eliminó: Ya no existe en el esquema de BD para Tutor
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
        // Relaciones directas (Nota: Si Prisma marca error en Ocupacion, verifica en tu schema 
        // si lo nombró distinto al coincidir la columna y la tabla, ej: Ocupacion_relation)
        CodigoTelefonoPais: true, 
        
        // La navegación hacia el paciente menor ahora se hace a través de la tabla intermedia
        Tutor_PacienteMenor: { 
          include: { 
            Parentesco: true,
            Paciente_Menor: { 
                include: { Paciente: true } 
            } 
          } 
        }
      },
      orderBy: { Nombre: 'asc' }
    });
  },

  update: async (id: number, data: UpdateTutorDTO) => {
    validarFormatoCedula(data.No_Cedula);
    const telefonoLimpio = validarTelefonoNica(data.No_Telefono);

    // Validación dinámica para evitar el error de "undefined" de TypeScript
    const whereClause: any = { No_Cedula: data.No_Cedula };
    if (id) {
        whereClause.ID_Tutor = { not: id };
    }

    const cedulaDuplicada = await prisma.tutor.findFirst({
        where: whereClause
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
        ID_CodigoTelefono: data.codigoTelefonoId,
        No_Telefono: telefonoLimpio,
        // Al actualizar, pasamos directamente los números a las columnas foráneas
        Ocupacion: data.ocupacionId,
        EstadoCivil: data.estadoCivilId
      }
    });
  }
};