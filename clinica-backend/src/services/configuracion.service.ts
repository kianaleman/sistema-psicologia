import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ModelConfig {
  model: any; 
  idField: string;
  nameField: string;
}

const MODEL_MAP: Record<string, ModelConfig> = {
  ocupacion: { model: prisma.ocupacion, idField: 'ID_Ocupacion', nameField: 'Nombre_DeOcupacion' },
  estadocivil: { model: prisma.estadoCivil, idField: 'ID_EstadoCivil', nameField: 'Nombre_EstadoCivil' },
  parentesco: { model: prisma.parentesco, idField: 'ID_Parentesco', nameField: 'Nombre_De_Parentesco' },
  metodo: { model: prisma.metodoPago, idField: 'ID_Metodo_Pago', nameField: 'Nombre_Metodo' },
  motivo: { model: prisma.motivoCancelacion, idField: 'ID_MotivoCancelacion', nameField: 'Motivo' },
  estadocita: { model: prisma.estadoCita, idField: 'ID_EstadoCita', nameField: 'NombreEstado' },
  tipocita: { model: prisma.tipoDeCita, idField: 'ID_TipoCita', nameField: 'Nombre_DeCita' },
  divisa: { model: prisma.divisa, idField: 'ID_Divisa', nameField: 'Nombre' },

  // --- NUEVOS CATÁLOGOS CLÍNICOS ---
  via: { 
    model: prisma.viaAdministracion, 
    idField: 'ID_ViaAdministracion', 
    nameField: 'Nombre_De_Presentacion' 
  },
  terapia: { 
    model: prisma.tipoDe_Terapia, 
    idField: 'ID_Tipo_Terapia', 
    nameField: 'Nombre_De_Terapia' 
  },
  exploracion: { 
    model: prisma.exploracionPsicologica, 
    idField: 'ID_ExploracionPsicologica', 
    nameField: 'Nombre_De_ExploracionPsicologica' 
  },
  especialidad: { 
    model: prisma.especialidadPsicologo, 
    idField: 'ID_Especialidad', 
    nameField: 'Nombre_Especialidad' 
  },
  alergia: { 
    model: prisma.alergia, 
    idField: 'ID_Alergia', 
    nameField: 'Nombre_Alergia'
  },
  rol: { 
    model: prisma.rol, 
    idField: 'ID_Rol', 
    nameField: 'Nombre_Rol' 
  }
};

const DEPENDENCIAS: Record<string, { table: string, fk: string }[]> = {
  ocupacion: [{ table: 'pacienteAdulto', fk: 'ID_Ocupacion' }, { table: 'tutor', fk: 'ID_Ocupacion' }],
  estadocivil: [{ table: 'pacienteAdulto', fk: 'ID_EstadoCivil' }, { table: 'tutor', fk: 'ID_EstadoCivil' }],
  parentesco: [{ table: 'tutor_PacienteMenor', fk: 'ID_Parentesco' }],
  metodo: [{ table: 'recibo', fk: 'ID_MetodoPago' }],
  motivo: [{ table: 'cita', fk: 'ID_MotivoCancelacion' }],
  estadocita: [{ table: 'cita', fk: 'ID_EstadoCita' }],
  tipocita: [{ table: 'cita', fk: 'ID_TipoCita' }],
  divisa: [{ table: 'recibo', fk: 'ID_Divisa' }],
  
  // --- DEPENDENCIAS DE NUEVOS CATÁLOGOS ---
  via: [{ table: 'recetaMedica', fk: 'ID_ViaAdministracion' }],
  terapia: [{ table: 'sesion', fk: 'ID_Tipo_Terapia' }],
  exploracion: [{ table: 'exploracion_Sesion', fk: 'ID_ExploracionPsicologica' }],
  especialidad: [{ table: 'especialidad_Psicologo', fk: 'ID_Especialidad' }],
  alergia: [{ table: 'alergia_Paciente', fk: 'ID_Alergia' }],
  rol: [{ table: 'usuario', fk: 'ID_Rol' }]
};

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

  // CORRECCIÓN AQUÍ: Ahora acepta 'payload' que puede ser string u objeto
  create: async (modelo: string, payload: any) => {
    if (modelo === 'rol') {
        throw new Error('La creación de roles solo está permitida desde el gestor de base de datos por seguridad.');
    }
    const config = getConfig(modelo);
    
    // Si mandas un string (como en Ocupación), se usa el nameField.
    // Si mandas un objeto (como en Divisa), se usa el objeto completo.
    const data = typeof payload === 'string' 
      ? { [config.nameField]: payload } 
      : payload;

    return await config.model.create({ data });
  },

  update: async (modelo: string, id: number, nombre: string) => {
    if (modelo === 'rol') {
        throw new Error('La edición de roles es una operación crítica restringida al DBA.');
    }
    const config = getConfig(modelo);
    const data = { [config.nameField]: nombre };
    return await config.model.update({
      where: { [config.idField]: id },
      data
    });
  },

  delete: async (modelo: string, id: number) => {
    if (modelo === 'rol') {
        throw new Error('No se pueden eliminar roles desde el sistema para prevenir fallos de acceso catastróficos.');
    }
    const config = getConfig(modelo);
    const reglas = DEPENDENCIAS[modelo] || [];
    for (const regla of reglas) {
        // @ts-ignore
        const count = await prisma[regla.table].count({ where: { [regla.fk]: id } });
        if (count > 0) throw new Error(`No se puede eliminar: Registro en uso en la tabla '${regla.table}'.`);
    }
    return await config.model.delete({ where: { [config.idField]: id } });
  }
};