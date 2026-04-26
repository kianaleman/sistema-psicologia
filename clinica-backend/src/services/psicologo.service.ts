import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// --- DTOs ---
interface CreatePsicologoDTO {
  nombre: string;
  apellido: string;
  codigoMinsa: string;
  telefono: string;
  email?: string;
  direccion: { 
    pais?: string; 
    departamento: string; 
    ciudad: string; 
    barrio: string; 
    calle: string; 
  };
  especialidadIds?: number[];
  especialidades?: number[]; // Soporte para JSON de Thunder Client
  No_Telefono?: string;
  Activo?: boolean;
}

// --- HELPER VALIDACIÓN NICARAGUA ---
const validarTelefonoNica = (telefono: string | undefined | null) => {
  if (!telefono) throw new Error('El teléfono es obligatorio.');
  const limpio = String(telefono).replace(/[\s-]/g, '');
  const regex = /^[2578]\d{7}$/;
  if (!regex.test(limpio)) {
    throw new Error(`Teléfono inválido (${telefono}). Debe ser de 8 dígitos e iniciar con 2, 5, 7 u 8.`);
  }
  return limpio;
};

export const PsicologoService = {
  
  // 1. Obtener todos con relaciones
  getAll: async () => {
    return await prisma.psicologo.findMany({
      include: {
        Direccion: true, 
        Psicologo_EspecialidadPsicologo: { 
          include: { EspecialidadPsicologo: true } 
        }
      },
      orderBy: { Apellido: 'asc' }
    });
  },

  // 2. Crear con Blindaje de Integridad (Buscar o Crear Dirección)
  create: async (data: CreatePsicologoDTO) => {
    if (!data) throw new Error("No se recibieron datos.");

    const telefonoRaw = data.telefono || data.No_Telefono;
    const telefonoLimpio = validarTelefonoNica(telefonoRaw);

    // Normalización para evitar errores de Unique Constraint en SQL Server
    const depto = data.direccion?.departamento?.trim();
    const ciudad = data.direccion?.ciudad?.trim();
    const barrio = data.direccion?.barrio?.trim();
    const calle = data.direccion?.calle?.trim();

    return await prisma.$transaction(async (tx) => {
      
      let direccion;

      // A. Buscar dirección existente
      direccion = await tx.direccion.findFirst({
        where: {
          Departamento: depto,
          Ciudad: ciudad,
          Barrio: barrio,
          Calle: calle
        }
      });

      // B. Si no existe, crearla
      if (!direccion) {
        try {
          direccion = await tx.direccion.create({
            data: {
              Pais: data.direccion?.pais?.trim() || 'Nicaragua',
              Departamento: depto,
              Ciudad: ciudad,
              Barrio: barrio,
              Calle: calle
            }
          });
        } catch (error) {
          // Rescate en caso de colisión de concurrencia
          direccion = await tx.direccion.findFirst({
            where: { Departamento: depto, Ciudad: ciudad, Barrio: barrio, Calle: calle }
          });
          if (!direccion) throw new Error("Error de integridad al gestionar la dirección.");
        }
      }

      // C. Crear el Psicólogo
      const psicologo = await tx.psicologo.create({
        data: {
          Nombre: data.nombre.trim(),
          Apellido: data.apellido.trim(),
          CodigoMinsa: data.codigoMinsa.trim(),
          No_Telefono: telefonoLimpio,
          ID_Direccion: direccion.ID_Direccion,
          Activo: data.Activo ?? true,
          ID_Usuario: null 
        }
      });

      // D. Registrar Especialidades (Igual al código viejo)
      const idsEspecialidades = data.especialidadIds || data.especialidades;
      if (idsEspecialidades && idsEspecialidades.length > 0) {
        const relaciones = idsEspecialidades.map(espId => ({
          ID_Psicologo: psicologo.ID_Psicologo,
          ID_Especialidad: Number(espId)
        }));
        await tx.psicologo_EspecialidadPsicologo.createMany({ data: relaciones });
      }

      return psicologo;
    });
  },

  // 3. Actualizar con Sincronización Completa (Como el código viejo)
  update: async (id: number, data: any) => {
    let telefonoLimpio: string | undefined = undefined;
    const telefonoRaw = data.telefono || data.No_Telefono;

    if (telefonoRaw) {
      telefonoLimpio = validarTelefonoNica(telefonoRaw);
    }

    return await prisma.$transaction(async (tx) => {
      // A. Actualizar datos básicos del Psicólogo
      const updateData: any = {
        Nombre: data.nombre?.trim(),
        Apellido: data.apellido?.trim(),
        CodigoMinsa: data.codigoMinsa?.trim(),
        Activo: data.Activo !== undefined ? data.Activo : true
      };

      if (telefonoLimpio !== undefined) updateData.No_Telefono = telefonoLimpio;

      const psicologo = await tx.psicologo.update({
        where: { ID_Psicologo: id },
        data: updateData
      });

      // B. Actualizar Dirección vinculada
      if (data.direccion) {
        await tx.direccion.update({
          where: { ID_Direccion: psicologo.ID_Direccion },
          data: {
            Departamento: data.direccion.departamento?.trim(),
            Ciudad: data.direccion.ciudad?.trim(),
            Barrio: data.direccion.barrio?.trim(),
            Calle: data.direccion.calle?.trim()
          }
        });
      }

      // C. Sincronizar Especialidades (Borrar antiguas y crear nuevas)
      const idsEspecialidades = data.especialidadIds || data.especialidades;
      if (idsEspecialidades) {
        await tx.psicologo_EspecialidadPsicologo.deleteMany({ 
          where: { ID_Psicologo: id } 
        });

        if (idsEspecialidades.length > 0) {
          const relaciones = idsEspecialidades.map((espId: any) => ({
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