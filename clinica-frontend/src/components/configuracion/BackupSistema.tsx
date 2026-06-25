import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { api } from '../../services/api';

interface BackupSistemaItem {
  archivo: string;
  nombreBaseDatos: string;
  tamanoBytes: number;
  tamanoLegible: string;
  fechaCreacion: string;
  fechaModificacion: string;
  verificado?: boolean;
}

const Icons = {
  Database: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <ellipse cx="12" cy="5" rx="8" ry="3" />
      <path d="M4 5v6c0 1.66 3.58 3 8 3s8-1.34 8-3V5" />
      <path d="M4 11v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6" />
    </svg>
  ),
  Download: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  ),
  Trash: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 15H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  ),
  Refresh: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path d="M21 12a9 9 0 0 1-15.5 6.2" />
      <path d="M3 12A9 9 0 0 1 18.5 5.8" />
      <path d="M18 2v4h4" />
      <path d="M6 22v-4H2" />
    </svg>
  ),
};

const obtenerMensajeError = (error: unknown) => {
  if (error instanceof Error) return error.message;
  return 'Ocurrio un error inesperado.';
};

const formatearFecha = (fecha: string) => {
  const valor = new Date(fecha);

  if (Number.isNaN(valor.getTime())) {
    return 'Fecha no disponible';
  }

  return valor.toLocaleString('es-NI', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function BackupSistema() {
  const [backups, setBackups] = useState<BackupSistemaItem[]>([]);
  const [cargando, setCargando] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [descargandoArchivo, setDescargandoArchivo] = useState<string | null>(null);
  const [eliminandoArchivo, setEliminandoArchivo] = useState<string | null>(null);

  const cargarBackups = async () => {
    try {
      setCargando(true);
      const respuesta = await api.backups.listar();
      setBackups(respuesta.backups);
    } catch (error: unknown) {
      toast.error(obtenerMensajeError(error));
    } finally {
      setCargando(false);
    }
  };

  const generarBackup = async () => {
    const confirmado = window.confirm(
      'Se generara un backup completo de la base de datos. Este proceso puede tardar unos segundos. Deseas continuar?'
    );

    if (!confirmado) return;

    try {
      setGenerando(true);
      const respuesta = await api.backups.generar();
      toast.success(respuesta.message || 'Backup generado correctamente.');
      await cargarBackups();
    } catch (error: unknown) {
      toast.error(obtenerMensajeError(error));
    } finally {
      setGenerando(false);
    }
  };

  const descargarBackup = async (archivo: string) => {
    try {
      setDescargandoArchivo(archivo);
      await api.backups.descargar(archivo);
      toast.success('Descarga iniciada.');
    } catch (error: unknown) {
      toast.error(obtenerMensajeError(error));
    } finally {
      setDescargandoArchivo(null);
    }
  };

  const eliminarBackup = async (archivo: string) => {
    const confirmado = window.confirm(`Deseas eliminar el backup ${archivo}?`);

    if (!confirmado) return;

    try {
      setEliminandoArchivo(archivo);
      const respuesta = await api.backups.eliminar(archivo);
      toast.success(respuesta.message || 'Backup eliminado correctamente.');
      await cargarBackups();
    } catch (error: unknown) {
      toast.error(obtenerMensajeError(error));
    } finally {
      setEliminandoArchivo(null);
    }
  };

  useEffect(() => {
    void cargarBackups();
  }, []);

  const ultimoBackup = backups[0] || null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-100 p-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-slate-900 p-3 text-white">
            <Icons.Database />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">Backups de base de datos</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
              Genera, descarga y administra copias de seguridad completas de SQL Server desde el sistema.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            className="btn btn-outline btn-sm gap-2"
            onClick={cargarBackups}
            disabled={cargando || generando}
          >
            {cargando ? <span className="loading loading-spinner loading-xs" /> : <Icons.Refresh />}
            Actualizar
          </button>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={generarBackup}
            disabled={generando}
          >
            {generando ? <span className="loading loading-spinner loading-xs" /> : null}
            Generar backup
          </button>
        </div>
      </div>

      <div className="grid gap-4 p-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total de backups</p>
          <p className="mt-2 text-3xl font-black text-slate-900">{backups.length}</p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 lg:col-span-2">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Ultimo backup</p>
          <p className="mt-2 break-words text-base font-bold text-slate-900">
            {ultimoBackup ? ultimoBackup.archivo : 'Sin backups generados'}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {ultimoBackup ? `${formatearFecha(ultimoBackup.fechaModificacion)} - ${ultimoBackup.tamanoLegible}` : 'Genera una copia para iniciar el historial.'}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto px-6 pb-6">
        <table className="table">
          <thead>
            <tr className="text-xs uppercase text-slate-500">
              <th>Archivo</th>
              <th>Base de datos</th>
              <th>Tamano</th>
              <th>Fecha</th>
              <th>Estado</th>
              <th className="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr>
                <td colSpan={6} className="py-10 text-center">
                  <span className="loading loading-spinner loading-md text-primary" />
                </td>
              </tr>
            ) : backups.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-sm text-slate-500">
                  No hay backups generados.
                </td>
              </tr>
            ) : (
              backups.map((backup) => (
                <tr key={backup.archivo}>
                  <td className="max-w-xs">
                    <p className="break-words font-mono text-xs font-bold text-slate-800">{backup.archivo}</p>
                  </td>
                  <td className="text-sm text-slate-600">{backup.nombreBaseDatos}</td>
                  <td className="font-mono text-sm text-slate-600">{backup.tamanoLegible}</td>
                  <td className="text-sm text-slate-600">{formatearFecha(backup.fechaModificacion)}</td>
                  <td>
                    <span className={`badge badge-sm ${backup.verificado === false ? 'badge-warning' : 'badge-success'}`}>
                      {backup.verificado === false ? 'Sin verificar' : 'Disponible'}
                    </span>
                  </td>
                  <td>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs gap-1"
                        onClick={() => descargarBackup(backup.archivo)}
                        disabled={descargandoArchivo === backup.archivo}
                      >
                        {descargandoArchivo === backup.archivo ? <span className="loading loading-spinner loading-xs" /> : <Icons.Download />}
                        Descargar
                      </button>

                      <button
                        type="button"
                        className="btn btn-ghost btn-xs text-rose-600"
                        onClick={() => eliminarBackup(backup.archivo)}
                        disabled={eliminandoArchivo === backup.archivo}
                      >
                        {eliminandoArchivo === backup.archivo ? <span className="loading loading-spinner loading-xs" /> : <Icons.Trash />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
