import { PrismaClient } from '@prisma/client';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';

const prisma = new PrismaClient();

export interface BackupSistema {
  archivo: string;
  nombreBaseDatos: string;
  rutaAbsoluta: string;
  tamanoBytes: number;
  tamanoLegible: string;
  fechaCreacion: string;
  fechaModificacion: string;
  verificado?: boolean;
}

interface GenerarBackupOptions {
  idUsuario?: number | null;
}

const EXTENSION_BACKUP = '.bak';

const obtenerDirectorioBackup = () => {
  return process.env.BACKUP_DIR?.trim() || 'C:\\Backups\\PsicologiaResilencia';
};

const obtenerNombreBaseDatos = () => {
  const nombreDesdeEnv = process.env.DATABASE_NAME?.trim();

  if (nombreDesdeEnv) {
    return nombreDesdeEnv;
  }

  const databaseUrl = process.env.DATABASE_URL || '';

  const coincidenciaParametro = databaseUrl.match(/(?:^|[;?&])database=([^;?&]+)/i);
  if (coincidenciaParametro?.[1]) {
    return decodeURIComponent(coincidenciaParametro[1]);
  }

  const coincidenciaRuta = databaseUrl.match(/sqlserver:\/\/[^/]+\/([^?;]+)/i);
  if (coincidenciaRuta?.[1]) {
    return decodeURIComponent(coincidenciaRuta[1]);
  }

  throw new Error('No se pudo determinar el nombre de la base de datos. Define DATABASE_NAME en el .env del backend.');
};

const validarNombreBaseDatos = (nombre: string) => {
  const nombreLimpio = nombre.trim();

  if (!nombreLimpio) {
    throw new Error('El nombre de la base de datos no puede estar vacio.');
  }

  if (/[;\n\r'"\\]/.test(nombreLimpio)) {
    throw new Error('El nombre de la base de datos contiene caracteres no permitidos.');
  }

  return nombreLimpio;
};

const escaparIdentificadorSql = (valor: string) => {
  return `[${valor.replace(/]/g, ']]')}]`;
};

const escaparTextoSql = (valor: string) => {
  return `N'${valor.replace(/'/g, "''")}'`;
};

const generarMarcaTiempo = () => {
  const fecha = new Date();

  const anio = String(fecha.getFullYear());
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  const hora = String(fecha.getHours()).padStart(2, '0');
  const minuto = String(fecha.getMinutes()).padStart(2, '0');
  const segundo = String(fecha.getSeconds()).padStart(2, '0');

  return `${anio}${mes}${dia}_${hora}${minuto}${segundo}`;
};

const obtenerTamanoLegible = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;

  const unidades = ['KB', 'MB', 'GB', 'TB'];
  let valor = bytes / 1024;
  let indice = 0;

  while (valor >= 1024 && indice < unidades.length - 1) {
    valor /= 1024;
    indice += 1;
  }

  return `${valor.toFixed(2)} ${unidades[indice]}`;
};

const validarNombreArchivoBackup = (archivo: string) => {
  const archivoLimpio = archivo.trim();

  if (!archivoLimpio.endsWith(EXTENSION_BACKUP)) {
    throw new Error('Archivo de backup invalido.');
  }

  if (!/^[a-zA-Z0-9_.-]+\.bak$/.test(archivoLimpio)) {
    throw new Error('El nombre del archivo contiene caracteres no permitidos.');
  }

  return archivoLimpio;
};

const obtenerRutaSegura = (archivo: string) => {
  const directorio = path.resolve(obtenerDirectorioBackup());
  const archivoValidado = validarNombreArchivoBackup(archivo);
  const ruta = path.resolve(directorio, archivoValidado);

  if (!ruta.toLowerCase().startsWith(directorio.toLowerCase())) {
    throw new Error('Ruta de backup no permitida.');
  }

  return ruta;
};

const mapearArchivoBackup = async (archivo: string): Promise<BackupSistema> => {
  const nombreBaseDatos = validarNombreBaseDatos(obtenerNombreBaseDatos());
  const rutaAbsoluta = obtenerRutaSegura(archivo);
  const stats = await fs.stat(rutaAbsoluta);

  return {
    archivo,
    nombreBaseDatos,
    rutaAbsoluta,
    tamanoBytes: stats.size,
    tamanoLegible: obtenerTamanoLegible(stats.size),
    fechaCreacion: stats.birthtime.toISOString(),
    fechaModificacion: stats.mtime.toISOString(),
  };
};

const asegurarDirectorioBackup = async () => {
  const directorio = obtenerDirectorioBackup();

  await fs.mkdir(directorio, { recursive: true });

  return directorio;
};

export const BackupService = {
  generarBackup: async (options?: GenerarBackupOptions): Promise<BackupSistema> => {
    const directorio = await asegurarDirectorioBackup();
    const nombreBaseDatos = validarNombreBaseDatos(obtenerNombreBaseDatos());
    const marcaTiempo = generarMarcaTiempo();

    const archivo = `${nombreBaseDatos}_FULL_${marcaTiempo}.bak`;
    const rutaAbsoluta = path.join(directorio, archivo);

    const usarCompresion = process.env.BACKUP_USE_COMPRESSION === 'true';

    const opcionesBackup = [
      'INIT',
      'CHECKSUM',
      'STATS = 10',
      ...(usarCompresion ? ['COMPRESSION'] : []),
    ].join(', ');

    const sqlBackup = `
      BACKUP DATABASE ${escaparIdentificadorSql(nombreBaseDatos)}
      TO DISK = ${escaparTextoSql(rutaAbsoluta)}
      WITH ${opcionesBackup};
    `;

    const sqlVerificacion = `
      RESTORE VERIFYONLY
      FROM DISK = ${escaparTextoSql(rutaAbsoluta)}
      WITH CHECKSUM;
    `;

    await prisma.$executeRawUnsafe(sqlBackup);
    await prisma.$executeRawUnsafe(sqlVerificacion);

    const backup = await mapearArchivoBackup(archivo);

    return {
      ...backup,
      verificado: true,
    };
  },

  listarBackups: async (): Promise<BackupSistema[]> => {
    const directorio = await asegurarDirectorioBackup();
    const archivos = await fs.readdir(directorio);

    const backups = await Promise.all(
      archivos
        .filter((archivo) => archivo.toLowerCase().endsWith(EXTENSION_BACKUP))
        .map((archivo) => mapearArchivoBackup(archivo))
    );

    return backups.sort((a, b) => {
      return new Date(b.fechaModificacion).getTime() - new Date(a.fechaModificacion).getTime();
    });
  },

  obtenerBackupParaDescarga: async (archivo: string): Promise<BackupSistema> => {
    const archivoValidado = validarNombreArchivoBackup(archivo);
    const rutaAbsoluta = obtenerRutaSegura(archivoValidado);

    if (!fsSync.existsSync(rutaAbsoluta)) {
      throw new Error('El archivo de backup no existe.');
    }

    return mapearArchivoBackup(archivoValidado);
  },

  eliminarBackup: async (archivo: string): Promise<{ archivo: string; eliminado: boolean }> => {
    const archivoValidado = validarNombreArchivoBackup(archivo);
    const rutaAbsoluta = obtenerRutaSegura(archivoValidado);

    if (!fsSync.existsSync(rutaAbsoluta)) {
      throw new Error('El archivo de backup no existe.');
    }

    await fs.unlink(rutaAbsoluta);

    return {
      archivo: archivoValidado,
      eliminado: true,
    };
  },
};
