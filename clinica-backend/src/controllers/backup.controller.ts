import type { Request, Response } from 'express';
import { BackupService } from '../services/backup.service.js';
import { AuditoriaService } from '../services/auditoria.service.js';

const obtenerMensajeError = (error: unknown, mensajePorDefecto: string) => {
  if (error instanceof Error) return error.message;
  return mensajePorDefecto;
};

const obtenerParametroString = (valor: unknown) => {
  if (Array.isArray(valor)) {
    return typeof valor[0] === 'string' ? valor[0] : '';
  }

  return typeof valor === 'string' ? valor : '';
};

const obtenerIdUsuario = (req: Request) => {
  const usuario = req.user as { idUsuario?: unknown } | undefined;

  if (typeof usuario?.idUsuario === 'number') {
    return usuario.idUsuario;
  }

  return null;
};

const registrarOperacion = (
  req: Request,
  accion: string,
  resultado: 'EXITO' | 'FALLO',
  codigoEstado: number,
  archivo?: string,
) => AuditoriaService.registrarDesdeRequest(req, {
  accion,
  modulo: 'BACKUPS',
  entidad: 'Backup',
  resultado,
  codigoEstado,
  mensaje: resultado === 'EXITO' ? 'Operación de respaldo completada.' : 'La operación de respaldo no se completó.',
  // Sin rutas absolutas, cuerpos de petición, credenciales ni errores del motor SQL.
  datosDespues: archivo && /^[a-zA-Z0-9_.-]+\.bak$/.test(archivo) ? { archivo } : undefined,
});

export const BackupController = {
  generar: async (req: Request, res: Response): Promise<void> => {
    try {
      const backup = await BackupService.generarBackup({
        idUsuario: obtenerIdUsuario(req),
      });

      await registrarOperacion(req, 'BACKUP_GENERADO', 'EXITO', 201, backup.archivo);

      res.status(201).json({
        message: 'Backup generado correctamente.',
        backup,
      });
    } catch (error: unknown) {
      await registrarOperacion(req, 'BACKUP_GENERADO', 'FALLO', 500);

      res.status(500).json({
        error: 'No se pudo generar el backup de la base de datos.',
      });
    }
  },

  listar: async (_req: Request, res: Response): Promise<void> => {
    try {
      const backups = await BackupService.listarBackups();

      res.json({
        total: backups.length,
        backups,
      });
    } catch (error: unknown) {
      console.error('Error al listar backups:', error);

      res.status(500).json({
        error: obtenerMensajeError(error, 'No se pudo obtener el listado de backups.'),
      });
    }
  },

  descargar: async (req: Request, res: Response): Promise<void> => {
    try {
      const archivo = obtenerParametroString(req.params.archivo);

      if (!archivo.trim()) {
        res.status(400).json({ error: 'Debe especificar el archivo de backup.' });
        return;
      }

      const backup = await BackupService.obtenerBackupParaDescarga(archivo);

      res.download(backup.rutaAbsoluta, backup.archivo, (error) => {
        void registrarOperacion(req, 'BACKUP_DESCARGADO', error ? 'FALLO' : 'EXITO', error ? 500 : 200, backup.archivo);
        if (error && !res.headersSent) {
          res.status(500).json({
            error: 'No se pudo descargar el archivo de backup.',
          });
        }
      });
    } catch (error: unknown) {
      await registrarOperacion(req, 'BACKUP_DESCARGADO', 'FALLO', 404);

      res.status(404).json({
        error: obtenerMensajeError(error, 'No se pudo descargar el backup solicitado.'),
      });
    }
  },

  eliminar: async (req: Request, res: Response): Promise<void> => {
    try {
      const archivo = obtenerParametroString(req.params.archivo);

      if (!archivo.trim()) {
        res.status(400).json({ error: 'Debe especificar el archivo de backup.' });
        return;
      }

      const resultado = await BackupService.eliminarBackup(archivo);

      await registrarOperacion(req, 'BACKUP_ELIMINADO', 'EXITO', 200, resultado.archivo);

      res.json({
        message: 'Backup eliminado correctamente.',
        resultado,
      });
    } catch (error: unknown) {
      await registrarOperacion(req, 'BACKUP_ELIMINADO', 'FALLO', 400);

      res.status(400).json({
        error: obtenerMensajeError(error, 'No se pudo eliminar el backup.'),
      });
    }
  },
};
