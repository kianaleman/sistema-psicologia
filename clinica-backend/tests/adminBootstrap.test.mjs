import assert from 'node:assert/strict';
import { test } from 'node:test';
import { spawnSync } from 'node:child_process';
import bcrypt from 'bcrypt';
import { crearAdministradorInicial } from '../src/services/adminBootstrap.service.ts';

const input = { email: 'ADMIN@example.test ', passwordTemporal: 'Entrada-Temporal-Segura-123' };
const memoryDatabase = (initial = {}) => {
  const state = { roles: initial.roles ?? [], users: initial.users ?? [], links: initial.links ?? [], attempts: 0, options: [] };
  const tx = {
    rol: {
      findFirst: async ({ where }) => state.roles.find((r) => r.Nombre_Rol === where.Nombre_Rol) ?? null,
      create: async ({ data }) => {
        const row = { ID_Rol: 87, ...data };
        state.roles.push(row);
        return row;
      },
    },
    usuario: {
      findUnique: async ({ where }) => state.users.find((u) => u.Email === where.Email) ?? null,
      create: async ({ data }) => {
        const row = { ID_Usuario: 10, ...data };
        state.users.push(row);
        return row;
      },
    },
    usuario_Rol: {
      upsert: async ({ where, create }) => {
        const key = where.ID_Usuario_ID_Rol;
        let link = state.links.find((l) => l.ID_Usuario === key.ID_Usuario && l.ID_Rol === key.ID_Rol);
        if (!link) { link = { ...create }; state.links.push(link); }
        return link;
      },
    },
  };
  const db = { $transaction: async (work, options) => {
    state.attempts += 1;
    state.options.push(options);
    if (state.failures > 0) {
      state.failures -= 1;
      throw Object.assign(new Error('conflicto simulado'), { code: state.failureCode ?? 'P2034' });
    }
    return work(tx);
  } };
  return { db, state };
};

test('crea administrador con hash, rol por nombre y cambio obligatorio', async () => {
  const { db, state } = memoryDatabase();
  const result = await crearAdministradorInicial(db, input);
  assert.equal(result.cuentaCreada, true);
  assert.equal(state.users[0].Email, 'admin@example.test');
  assert.notEqual(state.users[0].PasswordHash, input.passwordTemporal);
  assert.equal(await bcrypt.compare(input.passwordTemporal, state.users[0].PasswordHash), true);
  assert.equal(state.users[0].RequiereCambioPassword, true);
  assert.equal(state.roles[0].Nombre_Rol, 'Administrador');
  assert.deepEqual(state.links, [{ ID_Usuario: 10, ID_Rol: 87 }]);
  assert.equal(state.options[0].isolationLevel, 'Serializable');
  assert.equal(JSON.stringify(result).includes(input.passwordTemporal), false);
  assert.equal(JSON.stringify(result).includes('PasswordHash'), false);
});

test('reejecutar no duplica usuario, rol o asociación ni restablece contraseña', async () => {
  const { db, state } = memoryDatabase();
  await crearAdministradorInicial(db, input);
  const originalHash = state.users[0].PasswordHash;
  state.users[0].RequiereCambioPassword = false; // El usuario ya completó el primer acceso.
  const result = await crearAdministradorInicial(db, { ...input, passwordTemporal: 'Otra-Entrada-Segura-456' });
  assert.equal(result.cuentaCreada, false);
  assert.equal(state.users.length, 1);
  assert.equal(state.roles.length, 1);
  assert.equal(state.links.length, 1);
  assert.equal(state.users[0].PasswordHash, originalHash);
  assert.equal(state.users[0].RequiereCambioPassword, false);
});

test('reutiliza el rol Administrador existente aunque su ID no sea 1', async () => {
  const { db, state } = memoryDatabase({ roles: [{ ID_Rol: 59, Nombre_Rol: 'Administrador' }] });
  await crearAdministradorInicial(db, input);
  assert.equal(state.roles.length, 1);
  assert.equal(state.links[0].ID_Rol, 59);
});

test('repara la asociación faltante de una cuenta existente sin reemplazar su estado', async () => {
  const old = { ID_Usuario: 42, Email: 'admin@example.test', PasswordHash: 'HASH-EXISTENTE', Activo: false, RequiereCambioPassword: true };
  const { db, state } = memoryDatabase({ users: [old] });
  await crearAdministradorInicial(db, input);
  assert.equal(state.users.length, 1);
  assert.equal(state.users[0].PasswordHash, 'HASH-EXISTENTE');
  assert.equal(state.users[0].Activo, false);
  assert.deepEqual(state.links, [{ ID_Usuario: 42, ID_Rol: 87 }]);
});

for (const [name, data] of [
  ['correo inválido', { ...input, email: 'incorrecto' }],
  ['correo demasiado largo', { ...input, email: 'a'.repeat(100) + '@example.test' }],
  ['contraseña corta', { ...input, passwordTemporal: 'corta' }],
  ['contraseña de espacios', { ...input, passwordTemporal: ' '.repeat(30) }],
  ['contraseña superior al límite de bcrypt', { ...input, passwordTemporal: 'á'.repeat(37) }],
]) test('rechaza ' + name + ' antes de escribir', async () => {
  const { db, state } = memoryDatabase();
  await assert.rejects(crearAdministradorInicial(db, data));
  assert.equal(state.attempts, 0);
  assert.equal(state.users.length, 0);
});

for (const code of ['P2034', 'P2002']) test('reintenta un conflicto concurrente ' + code, async () => {
  const { db, state } = memoryDatabase();
  state.failures = 1;
  state.failureCode = code;
  await crearAdministradorInicial(db, input);
  assert.equal(state.attempts, 2);
  assert.equal(state.users.length, 1);
  assert.equal(state.links.length, 1);
});

test('no reintenta indefinidamente si la persistencia falla', async () => {
  const { db, state } = memoryDatabase();
  state.failures = 5;
  await assert.rejects(crearAdministradorInicial(db, input));
  assert.equal(state.attempts, 3);
});

test('CLI no acepta una contraseña como argumento ni la imprime', () => {
  const secret = 'NO-IMPRIMIR-CREDENCIAL';
  const result = spawnSync(process.execPath, ['--import', 'tsx', 'crearAdmin.ts', 'admin@example.test', secret], {
    cwd: new URL('..', import.meta.url),
    encoding: 'utf8',
    env: { ...process.env, BOOTSTRAP_ADMIN_PASSWORD: '', DATABASE_URL: 'sqlserver://127.0.0.1:1;database=SinAcceso' },
    timeout: 5000,
  });
  assert.equal(result.status, 1);
  assert.equal((result.stdout + result.stderr).includes(secret), false);
  assert.equal((result.stdout + result.stderr).includes('PrismaClient'), false);
});
