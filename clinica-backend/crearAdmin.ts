import { PrismaClient } from '@prisma/client';
import { createInterface } from 'node:readline';
import { Writable } from 'node:stream';
import { pathToFileURL } from 'node:url';
import { crearAdministradorInicial, validarAdminInicial } from './src/services/adminBootstrap.service.js';

const leerPasswordOculta = (): Promise<string> => {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error('Use una terminal interactiva o inyecte BOOTSTRAP_ADMIN_PASSWORD desde un almacén de secretos.');
  }
  process.stdout.write('Contraseña temporal (entrada oculta): ');
  const salidaOculta = new Writable({ write(_chunk, _encoding, callback) { callback(); } });
  const lector = createInterface({ input: process.stdin, output: salidaOculta, terminal: true });
  return new Promise((resolve, reject) => {
    lector.once('SIGINT', () => {
      lector.close();
      reject(new Error('Operación cancelada.'));
    });
    lector.question('', (password) => {
      lector.close();
      process.stdout.write('\n');
      resolve(password);
    });
  });
};

export async function main() {
  const args = process.argv.slice(2);
  if (args.length > 1) throw new Error('Indique solo el correo; no pase contraseñas por argumentos.');
  const email = args[0] || process.env.BOOTSTRAP_ADMIN_EMAIL || '';
  if (!email) throw new Error('Indique el correo como argumento o en BOOTSTRAP_ADMIN_EMAIL.');
  const passwordTemporal = process.env.BOOTSTRAP_ADMIN_PASSWORD ?? await leerPasswordOculta();
  delete process.env.BOOTSTRAP_ADMIN_PASSWORD;
  const data = validarAdminInicial({ email, passwordTemporal });
  const prisma = new PrismaClient();
  try {
    const result = await crearAdministradorInicial(prisma, data);
    console.log(result.cuentaCreada
      ? 'Administrador creado. Debe cambiar la contraseña en el primer acceso.'
      : 'La cuenta ya existía. Rol asegurado; contraseña y estado conservados.');
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(() => {
    // No imprimir errores Prisma: pueden contener parámetros o detalles de conexión.
    console.error('No se pudo preparar el administrador. Revise correo, entrada segura y conexión a la base.');
    process.exitCode = 1;
  });
}
