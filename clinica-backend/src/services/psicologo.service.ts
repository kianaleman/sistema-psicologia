import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt'; 

const prisma = new PrismaClient();

// --- DTOs ---
interface CreatePsicologoDTO {
  nombre: string;
  apellido: string;
  codigoMinsa: string;
  telefono: string;
  email: string; 
  password?: string; 
  idRol: number; 
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

// 🟢 HELPER VALIDACIÓN GMAIL
const validarGmail = (email: string) => {
  if (!email) throw new Error('El correo electrónico es obligatorio.');
  const emailLower = email.toLowerCase().trim();
  if (!emailLower.endsWith('@gmail.com')) {
    throw new Error('El sistema solo permite correos de Google (@gmail.com).');
  }
  return emailLower;
};

export const PsicologoService = {
  
  getAll: async () => {
    return await prisma.psicologo.findMany({
      include: {
        Usuario: true, 
        Direccion: true, 
        Psicologo_EspecialidadPsicologo: { 
          include: { EspecialidadPsicologo: true } 
        }
      },
      orderBy: { Apellido: 'asc' }
    });
  },

  create: async (data: CreatePsicologoDTO) => {
    if (!data) throw new Error("No se recibieron datos.");

    const telefonoRaw = data.telefono || data.No_Telefono;
    const telefonoLimpio = validarTelefonoNica(telefonoRaw);
    
    // 🟢 Validar que el correo sea Gmail antes de procesar
    const emailValidado = validarGmail(data.email);

    const depto = data.direccion?.departamento?.trim();
    const ciudad = data.direccion?.ciudad?.trim();
    const barrio = data.direccion?.barrio?.trim();
    const calle = data.direccion?.calle?.trim();

    const saltRounds = 10;
    const passwordOriginal = data.password || 'Resiliencia2026*';
    const hashedPassword = await bcrypt.hash(passwordOriginal, saltRounds);

    return await prisma.$transaction(async (tx) => {
      
      let direccion = await tx.direccion.findFirst({
        where: {
          Departamento: depto,
          Ciudad: ciudad,
          Barrio: barrio,
          Calle: calle
        }
      });

      if (!direccion) {
        direccion = await tx.direccion.create({
          data: {
            Pais: data.direccion?.pais?.trim() || 'Nicaragua',
            Departamento: depto,
            Ciudad: ciudad,
            Barrio: barrio,
            Calle: calle
          }
        });
      }

      const usuario = await tx.usuario.create({
        data: {
          Email: emailValidado, // 🟢 Usar el email validado
          PasswordHash: hashedPassword, 
          Activo: true,
          Verificado: true 
        }
      });

      await tx.usuario_Rol.create({
        data: {
          ID_Usuario: usuario.ID_Usuario,
          ID_Rol: data.idRol
        }
      });

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