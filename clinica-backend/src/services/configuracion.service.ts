import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Definición de la estructura de configuración para cada catálogo
interface ModelConfig {
  model: any; // Delegado de Prisma (prisma.ocupacion, prisma.estadoCivil, etc.)
  idField: string;
  nameField: string;
}

// Mapeo centralizado: La "Inteligencia" del servicio
const MODEL_MAP: Record<string, ModelConfig> = {
  ocupacion: { model: prisma.ocupacion, idField: 'ID_Ocupacion', nameField: 'NombreDeOcupacion' },
  estadocivil: { model: prisma.estadoCivil, idField: 'ID_EstadoCivil', nameField: 'NombreEstadoCivil' },
  parentesco: { model: prisma.parentesco, idField: 'ID_Parentesco', nameField: 'NombreDeParentesco' },
  especialidad: { model: prisma.especialidadPsicologo, idField: 'ID_Especialidad', nameField: 'NombreEspecialidad' },
  exploracion: { model: prisma.exploracionPsicologica, idField: 'ID_ExploracionPsicologica', nameField: 'NombreDeExploracionPsicologica' },
  terapia: { model: prisma.tipoDeTerapia, idField: 'ID_TipoTerapia', nameField: 'NombreDeTerapia' },
  via: { model: prisma.viaAdministracion, idField: 'ID_ViaAdministracion', nameField: 'NombreDePresentacion' },
  metodo: { model: prisma.metodoPago, idField: 'ID_MetodoPago', nameField: 'NombreMetodo' }
};

// Helper privado para obtener la config o fallar
const getConfig = (modelo: string) => {
  const config = MODEL_MAP[modelo];
  if (!config) throw new Error('Catálogo no válido');
  return config;
};

export const ConfiguracionService = {
  
  getAll: async (modelo: string) => {
    const config = getConfig(modelo);
    // prisma.model.findMany()
    return await config.model.findMany();
  },

  create: async (modelo: string, nombre: string) => {
    const config = getConfig(modelo);
    // Construcción dinámica del objeto: { [NombreCampo]: "Valor" }
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
    
    // El manejo de error P2003 se hará mejor dejando que prisma lance el error
    // y atrapándolo en el controlador o aquí mismo si queremos personalizar el mensaje.
    return await config.model.delete({
      where: { [config.idField]: id }
    });
  }
};