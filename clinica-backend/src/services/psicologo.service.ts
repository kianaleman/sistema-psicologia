import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// DTOs
interface CreatePsicologoDTO {
  nombre: string;
  apellido: string;
  codigoMinsa: string;
  codigoTelefonoId: number; // Requisito del nuevo catálogo
  telefono: string;
  // email: string; // ⚠️ Movido a la tabla 'Usuario' en la nueva BD
  direccion: { municipioId: number; barrio: string; calle?: string; }; // Geografía normalizada
  especialidadIds: number[];
  No_Telefono?: string;
}


interface UpdatePsicologoDTO {
  nombre?: string;
  apellido?: string;
  codigoMinsa?: string;
  codigoTelefonoId?: number;
  telefono?: string;
  No_Telefono?: string;
  direccion?: { municipioId: number; barrio: string; calle?: string; };
  especialidadIds?: number[];
  activo?: boolean;
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
        // Traemos la dirección normalizada
        Direccion: { include: { Municipio: { include: { Departamento: true } } } },
        CodigoTelefonoPais: true,
        Psicologo_EspecialidadPsicologo: { include: { EspecialidadPsicologo: true } },
        // Si el psicólogo ya tiene un usuario vinculado, traemos su email
        Usuario: { select: { Email: true } } 
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
       // 3. Crear Dirección Unificada
       const direccion = await tx.direccion.create({
          data: {
             Pais: 'Nicaragua',
             ID_Municipio: data.direccion.municipioId,
             Barrio: data.direccion.barrio,
             Calle: data.direccion.calle ?? null
          }
       });

       // 4. Crear Psicólogo
       const psicologo = await tx.psicologo.create({
          data: {
             Nombre: data.nombre,
             Apellido: data.apellido,
             CodigoMinsa: data.codigoMinsa, // Nombre corregido
             ID_CodigoTelefono: data.codigoTelefonoId,
             No_Telefono: telefonoLimpio,
             ID_Direccion: direccion.ID_Direccion,
             Activo: true // Reemplaza a ID_EstadoDeActividad
          }
       });

       // 5. Crear Especialidades
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

  update: async (id: number, data: UpdatePsicologoDTO) => {
    // Normalización y Validación en Update
    let telefonoLimpio: string | undefined = undefined;
    const telefonoRaw = data.telefono || data.No_Telefono;

    if (telefonoRaw) {
       telefonoLimpio = validarTelefonoNica(telefonoRaw);
    }

    return await prisma.$transaction(async (tx) => {
       // 1. Construir el objeto de actualización de forma dinámica
       // Usamos Prisma.PsicologoUncheckedUpdateInput para permitir llaves foráneas directas
       const updateData: Prisma.PsicologoUncheckedUpdateInput = {};
       
       if (data.nombre !== undefined) updateData.Nombre = data.nombre;
       if (data.apellido !== undefined) updateData.Apellido = data.apellido;
       if (data.codigoMinsa !== undefined) updateData.CodigoMinsa = data.codigoMinsa;
       if (data.codigoTelefonoId !== undefined) updateData.ID_CodigoTelefono = Number(data.codigoTelefonoId);
       if (telefonoLimpio !== undefined) updateData.No_Telefono = telefonoLimpio;
       if (data.activo !== undefined) updateData.Activo = Boolean(data.activo);

       // 2. Actualizar Psicólogo
       const psicologo = await tx.psicologo.update({
          where: { ID_Psicologo: id },
          data: updateData // Pasamos el objeto limpio, sin ningún undefined
       });

       // 3. Actualizar Dirección
       if (data.direccion) {
           await tx.direccion.update({
               where: { ID_Direccion: psicologo.ID_Direccion },
               data: {
                   ID_Municipio: data.direccion.municipioId,
                   Barrio: data.direccion.barrio,
                   Calle: data.direccion.calle ?? null
               }
           });
       }

       // 4. Actualizar Especialidades
       if (data.especialidadIds) {
           await tx.psicologo_EspecialidadPsicologo.deleteMany({ where: { ID_Psicologo: id } });
           if (data.especialidadIds.length > 0) {
               const relaciones = data.especialidadIds.map((espId: number | string) => ({
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