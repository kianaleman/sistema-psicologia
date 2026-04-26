import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// --- DTOs ---
interface CreatePacienteDTO {
  nombre: string;
  apellido: string;
  fechaNac: string | Date;
  genero: string;
  nacionalidad: string;
  direccion: { pais?: string; departamento: string; ciudad: string; barrio: string; calle: string; };
  esAdulto: boolean;
  datosAdulto?: { cedula: string; telefono: string; ocupacionId: number; estadoCivilId: number; };
  datosMenor?: { 
    partNacimiento: string; 
    grado: string; 
    modoTutor: 'existente' | 'nuevo'; 
    tutorId?: number; 
    parentescoId: number; // Ahora es obligatorio para menores
    nuevoTutor?: { 
      cedula: string; nombre: string; apellido: string; telefono: string; 
      parentescoId: number; ocupacionId: number; estadoCivilId: number; 
      direccion: { departamento: string; ciudad: string; barrio: string; calle: string; }; 
    };
  };
}

// --- HELPERS ---
const validarFormatoCedula = (cedula: string, contexto: string) => {
  const regex = /^\d{3}-\d{6}-\d{4}[A-Z]$/;
  if (!regex.test(cedula.trim())) throw new Error(`Cédula para ${contexto} inválida.`);
};

const validarCedulaUnica = async (cedula: string, idExcluir?: number) => {
    const whereClause: any = { No_Cedula: cedula.trim() };
    if (idExcluir) whereClause.ID_PacienteAdulto = { not: idExcluir };
    
    const existe = await prisma.pacienteAdulto.findFirst({ where: whereClause });
    if (existe) throw new Error(`La cédula ${cedula} ya pertenece a otro registro.`);
};

const validarTelefonoNica = (telefono: string, contexto: string) => {
  const limpio = String(telefono).replace(/[\s-]/g, '');
  if (!/^[2578]\d{7}$/.test(limpio)) throw new Error(`Teléfono de ${contexto} inválido.`);
  return limpio;
};

export const PacienteService = {
  
  create: async (data: CreatePacienteDTO) => {
    const fechaNacObj = new Date(data.fechaNac);
    if (isNaN(fechaNacObj.getTime())) throw new Error("Fecha inválida.");

    if (data.esAdulto && data.datosAdulto) {
        validarFormatoCedula(data.datosAdulto.cedula, 'Paciente');
        await validarCedulaUnica(data.datosAdulto.cedula);
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Buscar o Crear Dirección (Normalizada con .trim())
      const depto = data.direccion.departamento.trim();
      const ciudad = data.direccion.ciudad.trim();
      const barrio = data.direccion.barrio.trim();
      const calle = data.direccion.calle.trim();

      let dir = await tx.direccion.findFirst({
        where: { Departamento: depto, Ciudad: ciudad, Barrio: barrio, Calle: calle }
      });

      if (!dir) {
        dir = await tx.direccion.create({ 
          data: { 
            Pais: data.direccion.pais || 'Nicaragua', 
            Departamento: depto, 
            Ciudad: ciudad, 
            Barrio: barrio, 
            Calle: calle 
          } 
        });
      }

      // 2. Crear Paciente Base
      const pac = await tx.paciente.create({ 
        data: { 
          Nombre: data.nombre.trim(), 
          Apellido: data.apellido.trim(), 
          Fecha_Nacimiento: fechaNacObj, 
          Genero: data.genero, 
          Nacionalidad: data.nacionalidad, 
          ID_Direccion: dir.ID_Direccion, 
          Activo: true 
        } 
      });

      // 3. Generar Expediente (Formato: EXP-2026-ID)
      const anioActual = new Date().getFullYear();
      const codigoExpediente = `EXP-${anioActual}-${pac.ID_Paciente}`;

      await tx.expediente.create({
        data: { 
            ID_Paciente: pac.ID_Paciente,
            No_Expediente: codigoExpediente,
            FechaIngreso: new Date()
        }
      });

      // 4. Especialización
      if (data.esAdulto && data.datosAdulto) {
        // --- LÓGICA ADULTO ---
        await tx.pacienteAdulto.create({
          data: { 
            ID_PacienteAdulto: pac.ID_Paciente, 
            No_Cedula: data.datosAdulto.cedula.trim(), 
            No_Telefono: validarTelefonoNica(data.datosAdulto.telefono, 'Adulto'), 
            ID_Ocupacion: Number(data.datosAdulto.ocupacionId), 
            ID_EstadoCivil: Number(data.datosAdulto.estadoCivilId) 
          }
        });
      } else if (!data.esAdulto && data.datosMenor) {
        // --- LÓGICA MENOR ---
        const pMenor = await tx.paciente_Menor.create({ 
          data: { 
            ID_Paciente_Menor: pac.ID_Paciente, 
            PartidaDeNacimiento: data.datosMenor.partNacimiento.trim(), 
            Grado_Escolar: data.datosMenor.grado 
          } 
        });
        
        let idTutor = data.datosMenor.tutorId;

        if (data.datosMenor.modoTutor === 'nuevo' && data.datosMenor.nuevoTutor) {
          const nt = data.datosMenor.nuevoTutor;
          validarFormatoCedula(nt.cedula, 'Tutor');
          
          // Dirección del Tutor
          let dirT = await tx.direccion.findFirst({
            where: { Barrio: nt.direccion.barrio.trim(), Calle: nt.direccion.calle.trim() }
          });
          if(!dirT){
            dirT = await tx.direccion.create({ 
                data: { 
                    Pais: 'Nicaragua', 
                    Departamento: nt.direccion.departamento.trim(), 
                    Ciudad: nt.direccion.ciudad.trim(), 
                    Barrio: nt.direccion.barrio.trim(), 
                    Calle: nt.direccion.calle.trim() 
                } 
            });
          }

          const tut = await tx.tutor.create({ 
            data: { 
              No_Cedula: nt.cedula.trim(), 
              Nombre: nt.nombre.trim(), 
              Apellido: nt.apellido.trim(), 
              No_Telefono: validarTelefonoNica(nt.telefono, 'Tutor'), 
              Ocupacion: Number(nt.ocupacionId), 
              EstadoCivil: Number(nt.estadoCivilId) 
            } 
          });
          idTutor = tut.ID_Tutor;
        }

        // VINCULACIÓN EN TABLA INTERMEDIA (Aquí se guarda el Parentesco)
        await tx.tutor_PacienteMenor.create({ 
          data: { 
            ID_Tutor: Number(idTutor!), 
            ID_Paciente_Menor: pMenor.ID_Paciente_Menor, 
            ID_Parentesco: Number(data.datosMenor.parentescoId),
            Es_Contacto_Principal: true
          } 
        });
      }
      return pac;
    });
  },

  getAll: async () => {
    return await prisma.paciente.findMany({
      include: { 
        Direccion: true, 
        PacienteAdulto: true, 
        Paciente_Menor: { 
            include: { 
                Tutor_PacienteMenor: { 
                    include: { Tutor: true, Parentesco: true } 
                } 
            } 
        } 
      },
      orderBy: { Nombre: 'asc' }
    });
  }
};