import BackupSistema from '../components/configuracion/BackupSistema';

export default function Backups() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400">Administracion</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">
          Backups del sistema
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
          Gestiona copias de seguridad completas de la base de datos SQL Server.
        </p>
      </div>

      <BackupSistema />
    </div>
  );
}
