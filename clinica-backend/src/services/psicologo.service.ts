import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// DTOs
interface CreatePsicologoDTO {
  nombre: string;
  apellido: string;
  codigoMinsa: string;
  telefono: string;
  email: string;
  direccion: { pais?: string; departamento: string; ciudad: string; barrio: string; calle: string; };
  especialidadIds: number[];
  // Compatibilidad por si llega con otro nombre
  No_Telefono?: string;
}

// --- HELPER VALIDACIÓN ---
const validarTelefonoNica = (telefono: string | undefined | null) => {
  if (!telefono) {
    throw new Error('El teléfono es obligatorio y no fue recibido.');
  }
  const limpio = String(telefono).replace(/[\s-]/g, '');
  const regex = /^[2578]\d{7}$/;
  if (!regex.test(limpio)) {
    throw new Error(`Teléfono inválido (${telefono}). Debe ser de 8 dígitos e iniciar con 2, 5, 7 u 8.`);
  }
  return limpio;
};

export const PsicologoService = {
  
  getAll: async () => {
    return await prisma.psicologo.findMany({
      include: {
        DireccionPsicologo: true,
        EstadoDeActividad: true,
        Psicologo_EspecialidadPsicologo: { include: { EspecialidadPsicologo: true } }
      },
      orderBy: { Apellido: 'asc' }
    });
  },

  create: async (data: CreatePsicologoDTO) => {
    if (!data) throw new Error("No se recibieron datos.");

    // 1. Normalización: Buscamos 'telefono' O 'No_Telefono'
    const telefonoRaw = data.telefono || data.No_Telefono;
    
    // 2. Validación
    const telefonoLimpio = validarTelefonoNica(telefonoRaw);

    return await prisma.$transaction(async (tx) => {
       const direccion = await tx.direccionPsicologo.create({
          data: {
             Pais: data.direccion?.pais || 'Nicaragua',
             Departamento: data.direccion?.departamento || 'Managua',
             Ciudad: data.direccion?.ciudad || 'Managua',
             Barrio: data.direccion?.barrio || '',
             Calle: data.direccion?.calle || ''
          }
       });

       const psicologo = await tx.psicologo.create({
          data: {
             Nombre: data.nombre,
             Apellido: data.apellido,
             CodigoDeMinsa: data.codigoMinsa,
             No_Telefono: telefonoLimpio, // Guardamos el validado
             Email: data.email,
             ID_DireccionPsicologo: direccion.ID_DireccionPsicologo,
             ID_EstadoDeActividad: 1
          }
       });

       if (data.especialidadIds && data.especialidadIds.length > 0) {
           const relaciones = data.especialidadIds.map(espId => ({
               ID_Psicologo: psicologo.ID_Psicologo,
               ID_Especialidad: Number(espId)
           }));
           await tx.psicologo_EspecialidadPsicologo.createMany({ data: relaciones });
       }

       return psicologo;
    });
  },

  update: async (id: number, data: any) => {
    // Normalización y Validación en Update
    let telefonoLimpio = undefined;
    const telefonoRaw = data.telefono || data.No_Telefono;

    if (telefonoRaw) {
       telefonoLimpio = validarTelefonoNica(telefonoRaw);
    }

    return await prisma.$transaction(async (tx) => {
       const psicologo = await tx.psicologo.update({
          where: { ID_Psicologo: id },
          data: {
             Nombre: data.nombre,
             Apellido: data.apellido,
             CodigoDeMinsa: data.codigoMinsa,
             No_Telefono: telefonoLimpio, // Si es undefined no se actualiza
             Email: data.email,
             ID_EstadoDeActividad: Number(data.ID_EstadoDeActividad)
          }
       });

       if (data.direccion) {
           await tx.direccionPsicologo.update({
               where: { ID_DireccionPsicologo: psicologo.ID_DireccionPsicologo },
               data: {
                   Departamento: data.direccion.departamento,
                   Ciudad: data.direccion.ciudad,
                   Barrio: data.direccion.barrio,
                   Calle: data.direccion.calle
               }
           });
       }

       if (data.especialidadIds) {
           await tx.psicologo_EspecialidadPsicologo.deleteMany({ where: { ID_Psicologo: id } });
           if (data.especialidadIds.length > 0) {
               const relaciones = data.especialidadIds.map((espId: any) => ({
                   ID_Psicologo: id,
                   ID_Especialidad: Number(espId)
               }));
               await tx.psicologo_EspecialidadPsicologo.createMany({ data: relaciones });
           }
       }

       return psicologo;
    });
  }
};