import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Definición de la estructura de configuración para cada catálogo
interface ModelConfig {
  model: any; // Delegado de Prisma
  idField: string;
  nameField: string;
}

// 1. Mapeo centralizado de Modelos (Actualizado al nuevo esquema de BD)
const MODEL_MAP: Record<string, ModelConfig> = {
  ocupacion: { model: prisma.ocupacion, idField: 'ID_Ocupacion', nameField: 'Nombre_DeOcupacion' },
  estadocivil: { model: prisma.estadoCivil, idField: 'ID_EstadoCivil', nameField: 'Nombre_EstadoCivil' },
  parentesco: { model: prisma.parentesco, idField: 'ID_Parentesco', nameField: 'Nombre_De_Parentesco' },
  especialidad: { model: prisma.especialidadPsicologo, idField: 'ID_Especialidad', nameField: 'Nombre_Especialidad' },
  exploracion: { model: prisma.exploracionPsicologica, idField: 'ID_ExploracionPsicologica', nameField: 'Nombre_De_ExploracionPsicologica' },
  terapia: { model: prisma.tipoDe_Terapia, idField: 'ID_Tipo_Terapia', nameField: 'Nombre_De_Terapia' },
  via: { model: prisma.viaAdministracion, idField: 'ID_ViaAdministracion', nameField: 'Nombre_De_Presentacion' },
  metodo: { model: prisma.metodoPago, idField: 'ID_Metodo_Pago', nameField: 'Nombre_Metodo' },
  motivo: { model: prisma.motivoCancelacion, idField: 'ID_MotivoCancelacion', nameField: 'Motivo' },
  // 🌟 Nuevos catálogos agregados
  banco: { model: prisma.banco, idField: 'ID_Banco', nameField: 'Nombre_Banco' },
  pais: { model: prisma.pais, idField: 'ID_Pais', nameField: 'Nombre_Pais' }
};

// 2. Definición de Dependencias (Validación de Integridad)
// Clave: nombre del modelo en la URL. 
// Valor: Array de objetos con el nombre de la tabla dependiente en Prisma y el campo FK.
const DEPENDENCIAS: Record<string, { table: string, fk: string }[]> = {
  ocupacion: [
    { table: 'pacienteAdulto', fk: 'ID_Ocupacion' },
    { table: 'tutor', fk: 'Ocupacion' } // En la BD quedó como 'Ocupacion'
  ],
  estadocivil: [
    { table: 'pacienteAdulto', fk: 'ID_EstadoCivil' },
    { table: 'tutor', fk: 'EstadoCivil' } // En la BD quedó como 'EstadoCivil'
  ],
  parentesco: [
    { table: 'tutor_PacienteMenor', fk: 'ID_Parentesco' } // Apunta a la tabla intermedia
  ],
  especialidad: [
    { table: 'psicologo_EspecialidadPsicologo', fk: 'ID_Especialidad' }
  ],
  exploracion: [
    { table: 'sesion_ExploracionPsicologica', fk: 'ID_ExploracionPsicologica' }
  ],
  terapia: [
    { table: 'tratamiento_Terapeutico', fk: 'ID_Tipo_Terapia' } // Nombres actualizados
  ],
  via: [
    { table: 'tratamiento_Farmaceutico', fk: 'ID_ViaAdministracion' } // Nombres actualizados
  ],
  metodo: [
    { table: 'recibo', fk: 'ID_MetodoPago' } // Cambiado a Recibo
  ],
  motivo: [
    { table: 'cita', fk: 'ID_MotivoCancelacion' } // Cambiado a ID_MotivoCancelacion
  ],
  banco: [
    { table: 'recibo', fk: 'ID_Banco' }
  ],
  pais: [
    { table: 'paciente', fk: 'ID_Pais' },
    { table: 'codigoTelefonoPais', fk: 'ID_Pais' }
  ]
};

// Helper privado
const getConfig = (modelo: string) => {
  const config = MODEL_MAP[modelo];
  if (!config) throw new Error('Catálogo no válido');
  return config;
};

export const ConfiguracionService = {
  
  getAll: async (modelo: string) => {
    const config = getConfig(modelo);
    return await config.model.findMany();
  },

  create: async (modelo: string, nombre: string) => {
    const config = getConfig(modelo);
    const data = { [config.nameField]: nombre };
    return await config.model.create({ data });
  },

  update: async (modelo: string, id: number, nombre: string) => {
    const config = getConfig(modelo);
    const data = { [config.nameField]: nombre };

    return await config.model.update({
      where: { [config.idField]: id },
      data
    });
  },

  delete: async (modelo: string, id: number) => {
    const config = getConfig(modelo);
    
    // --- VALIDACIÓN DE DEPENDENCIAS ---
    const reglas = DEPENDENCIAS[modelo] || [];

    for (const regla of reglas) {
        // Accedemos dinámicamente al modelo de prisma (ej: prisma.pacienteAdulto)
        // @ts-ignore: Prisma Client dinámico (Mantenido para flexibilidad)
        const count = await prisma[regla.table].count({
            where: { [regla.fk]: id }
        });

        if (count > 0) {
            throw new Error(`No se puede eliminar: Este registro está siendo usado en ${count} elemento(s) de la tabla '${regla.table}'.`);
        }
    }

    // Si pasa las validaciones, procedemos a eliminar
    return await config.model.delete({
      where: { [config.idField]: id }
    });
  }
};