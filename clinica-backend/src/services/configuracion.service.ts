import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Definición de la estructura de configuración para cada catálogo
interface ModelConfig {
  model: any; // Delegado de Prisma
  idField: string;
  nameField: string;
}

// 1. Mapeo centralizado de Modelos
const MODEL_MAP: Record<string, ModelConfig> = {
  ocupacion: { model: prisma.ocupacion, idField: 'ID_Ocupacion', nameField: 'NombreDeOcupacion' },
  estadocivil: { model: prisma.estadoCivil, idField: 'ID_EstadoCivil', nameField: 'NombreEstadoCivil' },
  parentesco: { model: prisma.parentesco, idField: 'ID_Parentesco', nameField: 'NombreDeParentesco' },
  especialidad: { model: prisma.especialidadPsicologo, idField: 'ID_Especialidad', nameField: 'NombreEspecialidad' },
  exploracion: { model: prisma.exploracionPsicologica, idField: 'ID_ExploracionPsicologica', nameField: 'NombreDeExploracionPsicologica' },
  terapia: { model: prisma.tipoDeTerapia, idField: 'ID_TipoTerapia', nameField: 'NombreDeTerapia' },
  via: { model: prisma.viaAdministracion, idField: 'ID_ViaAdministracion', nameField: 'NombreDePresentacion' },
  metodo: { model: prisma.metodoPago, idField: 'ID_MetodoPago', nameField: 'NombreMetodo' },
  // Agregamos el nuevo catálogo
  motivo: { model: prisma.motivoCancelacion, idField: 'ID_Motivo', nameField: 'Categoria' }
};

// 2. Definición de Dependencias (Validación de Integridad)
// Clave: nombre del modelo en la URL. 
// Valor: Array de objetos con el nombre de la tabla dependiente en Prisma y el campo FK.
const DEPENDENCIAS: Record<string, { table: string, fk: string }[]> = {
  ocupacion: [
    { table: 'pacienteAdulto', fk: 'ID_Ocupacion' },
    { table: 'tutor', fk: 'ID_Ocupacion' }
  ],
  estadocivil: [
    { table: 'pacienteAdulto', fk: 'ID_EstadoCivil' },
    { table: 'tutor', fk: 'ID_EstadoCivil' }
  ],
  parentesco: [
    { table: 'tutor', fk: 'ID_Parentesco' }
  ],
  especialidad: [
    { table: 'psicologo_EspecialidadPsicologo', fk: 'ID_Especialidad' }
  ],
  exploracion: [
    { table: 'sesion_ExploracionPsicologica', fk: 'ID_ExploracionPsicologica' }
  ],
  terapia: [
    { table: 'tratamientoTerapeutico', fk: 'ID_TipoTerapia' }
  ],
  via: [
    { table: 'tratamientoFarmaceutico', fk: 'ID_ViaAdministracion' }
  ],
  metodo: [
    { table: 'detalleFactura', fk: 'ID_MetodoPago' }
  ],
  motivo: [
    { table: 'cita', fk: 'ID_Motivo' }
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
        // @ts-ignore: Prisma Client dinámico
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