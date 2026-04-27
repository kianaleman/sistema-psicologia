import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt'; // 🟢 IMPORTACIÓN NECESARIA

const prisma = new PrismaClient();

// --- DTOs ---
interface CreatePsicologoDTO {
  nombre: string;
  apellido: string;
  codigoMinsa: string;
  telefono: string;
  email: string; // 🟢 Ahora es obligatorio para el login
  password?: string; // 🟢 Para la cuenta de acceso
  idRol: number; // 🟢 ID del Rol de Psicólogo
  direccion: { 
    pais?: string; 
    departamento: string; 
    ciudad: string; 
    barrio: string; 
    calle: string; 
  };
  especialidadIds?: number[];
  especialidades?: number[]; 
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
  
  // 1. Obtener todos con relaciones (CORREGIDO: Incluye Usuario para el correo)
  getAll: async () => {
    return await prisma.psicologo.findMany({
      include: {
        Usuario: true, // 🟢 CRUCIAL: Permite ver el correo en el listado y modal
        Direccion: true, 
        Psicologo_EspecialidadPsicologo: { 
          include: { EspecialidadPsicologo: true } 
        }
      },
      orderBy: { Apellido: 'asc' }
    });
  },

  // 2. Crear con Blindaje de Integridad y Creación de Cuenta
  create: async (data: CreatePsicologoDTO) => {
    if (!data) throw new Error("No se recibieron datos.");

    const telefonoRaw = data.telefono || data.No_Telefono;
    const telefonoLimpio = validarTelefonoNica(telefonoRaw);

    const depto = data.direccion?.departamento?.trim();
    const ciudad = data.direccion?.ciudad?.trim();
    const barrio = data.direccion?.barrio?.trim();
    const calle = data.direccion?.calle?.trim();

    // 🟢 ENCRIPTACIÓN DE CONTRASEÑA (MAESTRA O PROPORCIONADA)
    const saltRounds = 10;
    const passwordOriginal = data.password || 'Resiliencia2026*';
    const hashedPassword = await bcrypt.hash(passwordOriginal, saltRounds);

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
          direccion = await tx.direccion.findFirst({
            where: { Departamento: depto, Ciudad: ciudad, Barrio: barrio, Calle: calle }
          });
          if (!direccion) throw new Error("Error de integridad al gestionar la dirección.");
        }
      }

      // 🟢 PASO CORREGIDO: Crear el Usuario con el Hash generado
      const usuario = await tx.usuario.create({
        data: {
          Email: data.email.trim(),
          PasswordHash: hashedPassword, 
          Activo: true
        }
      });

      // 🟢 PASO: Asignar el Rol al Usuario
      await tx.usuario_Rol.create({
        data: {
          ID_Usuario: usuario.ID_Usuario,
          ID_Rol: data.idRol
        }
      });

      // C. Crear el Psicólogo vinculado al nuevo Usuario
      const psicologo = await tx.psicologo.create({
        data: {
          Nombre: data.nombre.trim(),
          Apellido: data.apellido.trim(),
          CodigoMinsa: data.codigoMinsa.trim(),
          No_Telefono: telefonoLimpio,
          ID_Direccion: direccion.ID_Direccion,
          ID_Usuario: usuario.ID_Usuario,
          Activo: data.Activo ?? true
        }
      });

      // D. Registrar Especialidades
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

  // 3. Actualizar con Sincronización Completa
  update: async (id: number, data: any) => {
    let telefonoLimpio: string | undefined = undefined;
    const telefonoRaw = data.telefono || data.No_Telefono;

    if (telefonoRaw) {
      telefonoLimpio = validarTelefonoNica(telefonoRaw);
    }

    return await prisma.$transaction(async (tx) => {
      const updateData: any = {
        Nombre: data.nombre?.trim(),
        Apellido: data.apellido?.trim(),
        CodigoMinsa: data.codigoMinsa?.trim(),
        Activo: data.Activo !== undefined ? data.Activo : true
      };

      if (telefonoLimpio !== undefined) updateData.No_Telefono = telefonoLimpio;

      const psicologo = await tx.psicologo.update({
        where: { ID_Psicologo: id },
        data: updateData,
        include: { Usuario: true } 
      });

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