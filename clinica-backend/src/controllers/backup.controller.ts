import type { Request, Response } from 'express';
import { BackupService } from '../services/backup.service.js';

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

export const BackupController = {
  generar: async (req: Request, res: Response): Promise<void> => {
    try {
      const backup = await BackupService.generarBackup({
        idUsuario: obtenerIdUsuario(req),
      });

      res.status(201).json({
        message: 'Backup generado correctamente.',
        backup,
      });
    } catch (error: unknown) {
      console.error('Error al generar backup:', error);

      res.status(500).json({
        error: obtenerMensajeError(error, 'No se pudo generar el backup de la base de datos.'),
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
        if (error && !res.headersSent) {
          res.status(500).json({
            error: 'No se pudo descargar el archivo de backup.',
          });
        }
      });
    } catch (error: unknown) {
      console.error('Error al descargar backup:', error);

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

      res.json({
        message: 'Backup eliminado correctamente.',
        resultado,
      });
    } catch (error: unknown) {
      console.error('Error al eliminar backup:', error);

      res.status(400).json({
        error: obtenerMensajeError(error, 'No se pudo eliminar el backup.'),
      });
    }
  },
};
