import assert from 'node:assert/strict';
import { after, before, beforeEach, mock, test } from 'node:test';
import { once } from 'node:events';
import { createRequire } from 'node:module';
import { gzipSync } from 'node:zlib';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

// Se fijan ANTES de importar Prisma, la aplicación o cualquier servicio.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'hito-1-secret-exclusivo-de-pruebas';
process.env.DATABASE_URL = 'sqlserver://127.0.0.1:1;database=SoloPruebas;user=sinacceso;password=sinacceso;trustServerCertificate=true';
const { prisma } = await import('../src/lib/prisma.ts');
const { AuditoriaService } = await import('../src/services/auditoria.service.ts');
const { BackupService } = await import('../src/services/backup.service.ts');
const { ConfiguracionService } = await import('../src/services/configuracion.service.ts');
const { AuthService } = await import('../src/services/auth.service.ts');
const { createApp } = await import('../src/app.ts');

const ROLES = { admin: ['Administrador'], psicologo: ['Psicologo'], recepcion: ['Recepcion'], sinRoles: [] };
const ids = { admin: 1, psicologo: 2, recepcion: 3, sinRoles: 4, temporal: 5, mixto: 6 };
let state;
let server;
let baseUrl;
const restorePersistence = [];
// Los delegados Prisma son proxies con descriptores virtuales. Sustituir sus
// métodos directamente evita invocar el motor y permite restaurarlos por prueba.
const stub = (object, name, implementation) => {
  const original = object[name];
  object[name] = mock.fn(implementation);
  restorePersistence.push(() => { object[name] = original; });
  return object[name];
};
const restoreQueries = () => {
  while (restorePersistence.length) restorePersistence.pop()();
};

const session = (id) => ({
  ID_Sesion: id, ID_Cita: id, ID_Expediente: id, HoraDeInicio: null, HoraFinal: null,
  Observaciones: 'CLINICO-observaciones', DiagnosticoDiferencial: 'CLINICO-diagnostico',
  HistorialDeEvolucion: 'CLINICO-evolucion', Criterios_DeDiagnostico: 'CLINICO-criterios',
  Tratamiento: [{ Nombre_Medicamento: 'CLINICO-tratamiento' }],
});
const professional = (id) => ({
  ID_Psicologo: id, ID_Usuario: id + 100, Nombre: 'Profesional', Apellido: String(id),
  CodigoMinsa: 'MINSA-' + id, Activo: true, No_Telefono: '88887777', ID_Direccion: 1,
  Direccion: null, CodigoTelefonoPais: null,
  Usuario: { Email: 'privado@example.test', PasswordHash: 'HASH-NO-DEBE-SALIR', ResetToken: 'RESET-NO-DEBE-SALIR' },
  Psicologo_EspecialidadPsicologo: [{ ID_Especialidad: 1, EspecialidadPsicologo: { ID_Especialidad: 1, Nombre_Especialidad: 'General' } }],
});
const appointment = (id, idPsicologo) => ({
  ID_Cita: id, ID_Psicologo: idPsicologo, ID_Paciente: id, ID_TipoCita: 1, ID_Direccion: 1,
  ID_EstadoCita: 1, ID_MotivoCancelacion: null, NotasCancelacion: null,
  FechaCita: new Date('2099-11-03T00:00:00Z'), HoraCita: new Date('1970-01-01T08:00:00Z'),
  MotivoConsulta: 'CLINICO-motivo', Sesion: session(id),
  Paciente: { ID_Paciente: id, Nombre: 'Paciente', Apellido: String(id), Expediente: { Observaciones_Generales: 'CLINICO-expediente' } },
  Psicologo: professional(idPsicologo),
  TipoDeCita: { ID_TipoCita: 1, Nombre_DeCita: 'Consulta' },
  EstadoCita: { ID_EstadoCita: 1, NombreEstado: 'Programada' },
  Direccion: null, MotivoCancelacion: null,
  Recibo: { Cod_Recibo: id, ID_Cita: id, MontoTotal: 500, Observacion: 'CLINICO-no-incluir-notas-libres', MetodoPago: null, Divisa: null, Banco: null },
});

// Emula únicamente persistencia: los servicios de citas/profesionales, las
// proyecciones, controladores, router, JWT y permisos son los de producción.
const project = (row, args = {}) => {
  if (row == null) return null;
  if (Array.isArray(row)) return row.map((item) => project(item, args));
  if (!args.select) {
    const copy = { ...row };
    for (const [key, value] of Object.entries(args.include ?? {})) {
      copy[key] = value === true ? row[key] : project(row[key], value);
    }
    return copy;
  }
  return Object.fromEntries(Object.entries(args.select)
    .filter(([, value]) => Boolean(value))
    .map(([key, value]) => [key, value === true ? row[key] ?? null : project(row[key], value)]));
};
const matches = (row, where = {}) => Object.entries(where).every(([key, expected]) => {
  if (expected instanceof Date) return row[key]?.getTime() === expected.getTime();
  if (expected && typeof expected === 'object') {
    if ('in' in expected) return expected.in.includes(row[key]);
    if ('notIn' in expected) return !expected.notIn.includes(row[key]);
    if ('not' in expected) return row[key] !== expected.not;
  }
  return row[key] === expected;
});
const account = (id, roles, extra = {}) => ({
  ID_Usuario: id, Email: 'usuario' + id + '@example.test', Activo: true,
  RequiereCambioPassword: false, Psicologo: id === 2 || id === 6 ? { ID_Psicologo: 10 } : null,
  Usuario_Rol: roles.map((name) => ({ Rol: { Nombre_Rol: name } })), ...extra,
});

before(async () => {
  const app = createApp();
  app.get('/__pruebas/vivo', (_req, res) => res.json({ ok: true }));
  app.post('/__pruebas/json', (req, res) => res.json({ recibido: req.body }));
  // Archivo exclusivamente en memoria; nunca resuelve una ruta real ni lee .bak.
  app.response.download = function (path, filename, callback) {
    assert.equal(path, 'memory:/respaldo-simulado.bak');
    state.files.push({ path, filename });
    if (state.failDownload) {
      callback(new Error('fallo simulado'));
      return this;
    }
    this.attachment(filename).send(Buffer.from('RESPALDO-SIMULADO-SIN-DATOS'));
    callback();
    return this;
  };
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  baseUrl = 'http://127.0.0.1:' + server.address().port;
});

beforeEach(() => {
  restoreQueries();
  mock.restoreAll();
  state = {
    accounts: new Map([
      [1, account(1, ROLES.admin)], [2, account(2, ROLES.psicologo)],
      [3, account(3, ROLES.recepcion)], [4, account(4, [])],
      [5, account(5, ROLES.admin, { RequiereCambioPassword: true })],
      [6, account(6, ['Psicologo', 'Recepcion'])],
      [120, account(120, ['Psicologo'], { Psicologo: { ID_Psicologo: 20 } })],
    ]),
    appointments: [appointment(1, 10), appointment(2, 20)],
    professionals: [professional(10), professional(20)],
    audit: [], operations: [], files: [], queries: [], userWrites: [], roleWrites: [],
  };
  mock.method(AuditoriaService, 'registrar', async (event) => { state.audit.push(event); });
  stub(prisma.usuario, 'findUnique', async (args) => {
    const found = args.where.ID_Usuario
      ? state.accounts.get(args.where.ID_Usuario)
      : [...state.accounts.values()].find((u) => u.Email === args.where.Email);
    return project(found, args);
  });
  stub(prisma.usuario, 'findFirst', async (args) => {
    const id = args.where.Psicologo.is.ID_Psicologo;
    return project([...state.accounts.values()].find((u) => u.Psicologo?.ID_Psicologo === id), args);
  });
  stub(prisma.usuario, 'update', async ({ where, data }) => {
    state.userWrites.push({ where, data });
    const row = state.accounts.get(where.ID_Usuario);
    Object.assign(row, data);
    return row;
  });
  stub(prisma.usuario, 'create', async ({ data }) => {
    state.userWrites.push({ data });
    const row = account(200, ['Psicologo'], { ...data, ID_Usuario: 200 });
    state.accounts.set(200, row);
    return row;
  });
  stub(prisma.cita, 'findMany', async (args = {}) => {
    state.queries.push(args);
    return state.appointments.filter((row) => matches(row, args.where)).map((row) => project(row, args));
  });
  stub(prisma.cita, 'findUnique', async (args) => project(state.appointments.find((row) => row.ID_Cita === args.where.ID_Cita), args));
  stub(prisma.cita, 'create', async ({ data, ...args }) => {
    state.operations.push('cita.create');
    const row = { ...appointment(30, data.ID_Psicologo), ...data, ID_Cita: 30, Sesion: null };
    state.appointments.push(row);
    return project(row, args);
  });
  stub(prisma.cita, 'update', async ({ where, data, ...args }) => {
    state.operations.push('cita.update');
    const row = state.appointments.find((item) => item.ID_Cita === where.ID_Cita);
    Object.assign(row, data);
    return project(row, args);
  });
  stub(prisma.paciente, 'findUnique', async () => ({ Activo: true }));
  stub(prisma.psicologo, 'findMany', async (args = {}) => state.professionals
    .filter((row) => matches(row, args.where)).map((row) => project(row, args)));
  stub(prisma.psicologo, 'findUnique', async ({ where, ...args }) => {
    const row = state.professionals.find((item) => item.ID_Psicologo === where.ID_Psicologo);
    const owner = [...state.accounts.values()].find((u) => u.Psicologo?.ID_Psicologo === where.ID_Psicologo);
    return project(row && { ...row, Usuario: owner ?? row.Usuario }, args);
  });
  stub(prisma.psicologo, 'create', async ({ data }) => {
    state.operations.push('psicologo.create');
    const row = { ...professional(30), ...data, ID_Psicologo: 30, ID_Usuario: 200 };
    state.professionals.push(row);
    return row;
  });
  stub(prisma.psicologo, 'update', async ({ where, data }) => {
    state.operations.push('psicologo.update');
    const row = state.professionals.find((item) => item.ID_Psicologo === where.ID_Psicologo);
    Object.assign(row, data);
    return row;
  });
  stub(prisma.direccion, 'create', async () => ({ ID_Direccion: 1 }));
  stub(prisma.direccion, 'update', async () => ({ ID_Direccion: 1 }));
  stub(prisma.psicologo_EspecialidadPsicologo, 'createMany', async () => ({ count: 1 }));
  stub(prisma.psicologo_EspecialidadPsicologo, 'deleteMany', async () => ({ count: 1 }));
  stub(prisma.rol, 'findFirst', async () => ({ ID_Rol: 77, Nombre_Rol: 'Psicologo' }));
  stub(prisma.usuario_Rol, 'create', async ({ data }) => { state.roleWrites.push(data); return data; });
  stub(prisma.recibo, 'create', async ({ data, ...args }) => project({ Cod_Recibo: 30, ...data }, args));
});

after(async () => {
  restoreQueries();
  mock.restoreAll();
  server?.closeAllConnections();
  if (server) await new Promise((resolve) => server.close(resolve));
});

const tokenFor = (name, overrides = {}) => {
  const id = ids[name];
  const current = state.accounts.get(id);
  return jwt.sign({
    idUsuario: id, email: current.Email,
    roles: current.Usuario_Rol.map(({ Rol }) => Rol.Nombre_Rol),
    idPsicologo: current.Psicologo?.ID_Psicologo ?? null,
    requiereCambioPassword: current.RequiereCambioPassword, ...overrides,
  }, process.env.JWT_SECRET, { expiresIn: '5m' });
};
const request = async (method, path, principal, body, customToken) => {
  const headers = {};
  if (principal) headers.authorization = 'Bearer ' + (customToken ?? tokenFor(principal));
  if (body !== undefined) headers['content-type'] = 'application/json';
  const response = await fetch(baseUrl + path, {
    method, headers, ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const text = await response.text();
  return { status: response.status, headers: response.headers, text, data: response.headers.get('content-type')?.includes('application/json') ? JSON.parse(text) : null };
};
const newProfessional = {
  Nombre: 'Profesional', Apellido: 'Nuevo', CodigoMinsa: 'MINSA-NUEVO',
  No_Telefono: '88887777', Email: 'nuevo@example.test',
  direccion: { municipioId: 1, barrio: 'Centro' }, especialidadIds: [1],
};
const newAppointment = {
  ID_Paciente: 1, ID_Psicologo: 10, ID_TipoCita: 1, ID_Direccion: 1, ID_EstadoCita: 1,
  FechaCita: '2099-12-01', HoraCita: '09:00', MotivoConsulta: 'CLINICO-motivo-nuevo',
  Precio: 500, ID_MetodoPago: 1, ID_Divisa: 1,
};

// Las operaciones de archivos y catálogos se sustituyen sin tocar sus controles.
beforeEach(() => {
  stub(prisma, '$transaction', async (work) => typeof work === 'function' ? work(prisma) : Promise.all(work));
  for (const [model, rows] of [
    ['tipoDeCita', [{ ID_TipoCita: 1, Nombre_DeCita: 'Consulta' }]],
    ['estadoCita', [{ ID_EstadoCita: 1, NombreEstado: 'Programada' }]],
    ['metodoPago', [{ ID_Metodo_Pago: 1, Nombre_Metodo: 'Efectivo' }]],
    ['banco', []], ['divisa', [{ ID_Divisa: 1, Codigo_ISO: 'NIO', Nombre: 'Córdoba' }]],
  ]) stub(prisma[model], 'findMany', async () => rows);
  mock.method(BackupService, 'listarBackups', async () => { state.operations.push('backup.list'); return [{ archivo: 'simulado.bak' }]; });
  mock.method(BackupService, 'generarBackup', async () => { state.operations.push('backup.generate'); return { archivo: 'simulado.bak', verificado: true }; });
  mock.method(BackupService, 'obtenerBackupParaDescarga', async () => { state.operations.push('backup.download'); return { archivo: 'simulado.bak', rutaAbsoluta: 'memory:/respaldo-simulado.bak' }; });
  mock.method(BackupService, 'eliminarBackup', async () => { state.operations.push('backup.delete'); return { archivo: 'simulado.bak', eliminado: true }; });
  for (const method of ['getAll', 'create', 'update', 'delete']) {
    mock.method(ConfiguracionService, method, async () => {
      state.operations.push('config.' + method);
      return method === 'getAll' ? [{ ID_Ocupacion: 1, Nombre_DeOcupacion: 'Estudiante' }] : { ID_Ocupacion: 1 };
    });
  }
  mock.method(AuthService, 'register', async () => ({ id: 90, email: 'nuevo@example.test', rol: 'Recepcion', passwordTemporal: 'SOLO-ADMIN-PRUEBA' }));
  mock.method(AuthService, 'restablecerPasswordAdmin', async () => ({ usuario: { id: 90 }, credenciales: { email: 'nuevo@example.test', passwordTemporal: 'SOLO-ADMIN-PRUEBA' } }));
});

for (const [operation, method, path, body, success] of [
  ['listar respaldos', 'GET', '/api/backups', undefined, 200],
  ['generar respaldo', 'POST', '/api/backups/generar', { passwordRaw: 'NO-AUDITAR', Observaciones: 'NO-AUDITAR' }, 201],
  ['descargar respaldo', 'GET', '/api/backups/descargar/simulado.bak', undefined, 200],
  ['eliminar respaldo', 'DELETE', '/api/backups/simulado.bak', undefined, 200],
  ['crear profesional', 'POST', '/api/psicologos', newProfessional, 201],
  ['cambiar correo ajeno', 'PUT', '/api/psicologos/20', { Email: 'controlado@example.test' }, 200],
  ['crear catálogo', 'POST', '/api/config/ocupacion', { nombre: 'Estudiante' }, 201],
  ['editar catálogo', 'PUT', '/api/config/ocupacion/1', { nombre: 'Actualizado' }, 200],
  ['eliminar catálogo', 'DELETE', '/api/config/ocupacion/1', undefined, 200],
  ['crear cuenta con contraseña temporal', 'POST', '/api/auth/register', { email: 'nuevo@example.test', rolId: 3 }, 201],
  ['restablecer contraseña temporal', 'POST', '/api/auth/admin/reset-password/90', {}, 200],
]) {
  for (const principal of [null, 'admin', 'psicologo', 'recepcion', 'sinRoles', 'temporal']) {
    test(operation + ' — ' + (principal ?? 'anónimo'), async () => {
      const result = await request(method, path, principal, body);
      assert.equal(result.status, principal === null ? 401 : principal === 'admin' ? success : 403);
      if (principal !== 'admin') {
        assert.deepEqual(state.operations, []);
        assert.deepEqual(state.userWrites, []);
        assert.equal(result.text.includes('SOLO-ADMIN-PRUEBA'), false);
      }
    });
  }
}

test('JWT inválido no consulta persistencia ni permite operar', async () => {
  const result = await request('GET', '/api/backups', 'admin', undefined, 'token-invalido');
  assert.equal(result.status, 403);
  assert.equal(prisma.usuario.findUnique.mock.calls.length, 0);
  assert.deepEqual(state.operations, []);
});
test('la cuenta actual bloquea un JWT anterior al cambio obligatorio', async () => {
  const old = tokenFor('admin', { requiereCambioPassword: false });
  state.accounts.get(1).RequiereCambioPassword = true;
  assert.equal((await request('POST', '/api/backups/generar', 'admin', {}, old)).status, 403);
  assert.deepEqual(state.operations, []);
});
test('los roles actuales impiden conservar permisos administrativos de un JWT antiguo', async () => {
  const old = tokenFor('admin');
  state.accounts.get(1).Usuario_Rol = [{ Rol: { Nombre_Rol: 'Recepcion' } }];
  assert.equal((await request('PUT', '/api/psicologos/20', 'admin', { Email: 'ajeno@example.test' }, old)).status, 403);
  assert.deepEqual(state.userWrites, []);
});
test('cuenta desactivada o inexistente queda sin acceso', async () => {
  const old = tokenFor('admin');
  state.accounts.get(1).Activo = false;
  assert.equal((await request('GET', '/api/backups', 'admin', undefined, old)).status, 401);
  state.accounts.delete(1);
  assert.equal((await request('GET', '/api/backups', 'admin', undefined, old)).status, 401);
});
test('fallo verificando cuenta cierra el acceso', async () => {
  prisma.usuario.findUnique.mock.mockImplementation(async () => { throw new Error('DETALLE-PRIVADO'); });
  const result = await request('GET', '/api/backups', 'admin');
  assert.equal(result.status, 503);
  assert.equal(result.text.includes('DETALLE-PRIVADO'), false);
  assert.deepEqual(state.operations, []);
});
test('no existe un autoservicio implícito para cambiar el propio correo', async () => {
  assert.equal((await request('PUT', '/api/psicologos/10', 'psicologo', { Email: 'propio@example.test' })).status, 403);
  assert.deepEqual(state.userWrites, []);
});
test('cambio administrativo de correo invalida enlaces de recuperación anteriores', async () => {
  const result = await request('PUT', '/api/psicologos/20', 'admin', { Email: 'NUEVO@example.test' });
  assert.equal(result.status, 200);
  assert.equal(state.userWrites[0].data.Email, 'nuevo@example.test');
  assert.equal(state.userWrites[0].data.ResetToken, null);
  assert.equal(state.userWrites[0].data.ResetTokenExpire, null);
  assert.equal(result.text.includes('PasswordHash'), false);
});
test('solo administrador recibe contraseña temporal y no se incluye en auditoría', async () => {
  const result = await request('POST', '/api/psicologos', 'admin', newProfessional);
  assert.equal(result.status, 201);
  assert.equal(result.headers.get('cache-control'), 'no-store');
  assert.ok(result.data.credenciales.passwordTemporal.length >= 20);
  const created = state.userWrites.find(({ data }) => data.PasswordHash)?.data;
  assert.equal(await bcrypt.compare(result.data.credenciales.passwordTemporal, created.PasswordHash), true);
  assert.equal(created.RequiereCambioPassword, true);
  assert.equal(state.roleWrites[0].ID_Rol, 77); // El rol se busca por nombre, nunca por ID mágico 2.
  assert.equal(JSON.stringify(state.audit).includes(result.data.credenciales.passwordTemporal), false);
});

for (const principal of ['psicologo', 'recepcion']) {
  test('directorio mínimo conserva agenda para ' + principal, async () => {
    const result = await request('GET', '/api/psicologos', principal);
    assert.equal(result.status, 200);
    assert.equal(result.data[0].ID_Psicologo, 10);
    for (const field of ['Usuario', 'ID_Usuario', 'Email', 'PasswordHash', 'ResetToken', 'No_Telefono', 'Direccion']) {
      assert.equal(JSON.stringify(result.data).includes('"' + field + '"'), false, field);
    }
    assert.equal((await request('GET', '/api/config/ocupacion', principal)).status, 200);
    assert.equal((await request('GET', '/api/citas/catalogos', principal)).status, 200);
  });
}
for (const principal of [null, 'sinRoles', 'temporal']) {
  test('directorio y agenda rechazan ' + (principal ?? 'anónimo'), async () => {
    const expected = principal === null ? 401 : 403;
    for (const path of ['/api/psicologos', '/api/config/ocupacion', '/api/citas', '/api/citas/catalogos']) {
      assert.equal((await request('GET', path, principal)).status, expected);
    }
  });
}
const forbiddenClinical = ['MotivoConsulta', 'Observaciones', 'DiagnosticoDiferencial', 'HistorialDeEvolucion', 'Criterios_DeDiagnostico', 'Tratamiento', 'Expediente', 'Observacion'];
const assertNoClinical = (data) => {
  const json = JSON.stringify(data);
  for (const field of forbiddenClinical) assert.equal(json.includes('"' + field + '"'), false, field);
  assert.equal(json.includes('CLINICO-'), false);
  assert.equal(json.includes('HASH-NO-DEBE-SALIR'), false);
  assert.equal(json.includes('RESET-NO-DEBE-SALIR'), false);
};
test('JSON de agenda de recepción excluye información clínica en todos los niveles', async () => {
  const result = await request('GET', '/api/citas', 'recepcion');
  assert.equal(result.status, 200);
  assert.equal(result.data.length, 2);
  assertNoClinical(result.data);
  assert.equal(state.queries.length, 1); // No se consultan las notas clínicas.
  assert.equal(result.data[0].Paciente.Nombre, 'Paciente');
  assert.deepEqual(Object.keys(result.data[0].Sesion), ['ID_Sesion']);
});
test('psicólogo conserva consulta clínica exclusivamente de sus registros', async () => {
  const result = await request('GET', '/api/citas', 'psicologo');
  assert.equal(result.status, 200);
  assert.deepEqual(result.data.map((row) => row.ID_Psicologo), [10]);
  assert.equal(result.data[0].Sesion.DiagnosticoDiferencial, 'CLINICO-diagnostico');
  assert.equal(state.queries.length, 2);
});
test('administrador conserva la consulta clínica de toda la agenda', async () => {
  const result = await request('GET', '/api/citas', 'admin');
  assert.equal(result.status, 200);
  assert.equal(result.data.length, 2);
  assert.ok(result.data.every((row) => row.Sesion.Observaciones === 'CLINICO-observaciones'));
});
test('Psicólogo + Recepción ve toda la agenda pero solo sus notas clínicas', async () => {
  const result = await request('GET', '/api/citas', 'mixto');
  assert.equal(result.status, 200);
  assert.equal(result.data.length, 2);
  assert.equal(result.data.find((row) => row.ID_Psicologo === 10).Sesion.Observaciones, 'CLINICO-observaciones');
  assertNoClinical(result.data.find((row) => row.ID_Psicologo === 20));
});
for (const principal of ['admin', 'psicologo', 'recepcion']) {
  test('reservar cita legítima permanece permitido para ' + principal, async () => {
    const result = await request('POST', '/api/citas', principal, newAppointment);
    assert.equal(result.status, 201);
    assert.ok(state.operations.includes('cita.create'));
    if (principal === 'recepcion') assertNoClinical(result.data);
  });
}
test('no se permiten reservar ni modificar citas de otro profesional', async () => {
  assert.equal((await request('POST', '/api/citas', 'psicologo', { ...newAppointment, ID_Psicologo: 20 })).status, 403);
  assert.equal((await request('PUT', '/api/citas/2', 'psicologo', { HoraCita: '10:00' })).status, 403);
  assert.equal((await request('GET', '/api/citas/horarios-ocupados?psicologoId=20&fecha=2099-11-03', 'psicologo')).status, 403);
});
test('cancelar y consultar disponibilidad administrativa no revelan el motivo clínico', async () => {
  assert.equal((await request('GET', '/api/citas/horarios-ocupados?psicologoId=10&fecha=2099-11-03', 'recepcion')).status, 200);
  const result = await request('PATCH', '/api/citas/1/cancelar', 'recepcion', { ID_MotivoCancelacion: 1, NotasCancelacion: 'Reprogramación solicitada' });
  assert.equal(result.status, 200);
  assertNoClinical(result.data);
});
for (const principal of ['admin', 'psicologo', 'recepcion']) {
  test('editar horario de cita legítima permanece permitido para ' + principal, async () => {
    const result = await request('PUT', '/api/citas/1', principal, { HoraCita: '10:30' });
    assert.equal(result.status, 200);
    assert.ok(state.operations.includes('cita.update'));
  });
}
test('recepción no borra un motivo clínico oculto al editar la cita', async () => {
  const result = await request('PUT', '/api/citas/1', 'recepcion', { HoraCita: '10:30', MotivoConsulta: '' });
  assert.equal(result.status, 200);
  assert.equal(state.appointments[0].MotivoConsulta, 'CLINICO-motivo');
});
test('rol combinado no puede apropiarse de las notas reasignando una consulta histórica', async () => {
  const result = await request('PUT', '/api/citas/2', 'mixto', { ID_Psicologo: 10 });
  assert.equal(result.status, 403);
  assert.deepEqual(state.operations, []);
  const agenda = await request('GET', '/api/citas', 'mixto');
  assertNoClinical(agenda.data.find((row) => row.ID_Cita === 2));
});
test('no se permite trasladar una sesión existente a otro paciente', async () => {
  assert.equal((await request('PUT', '/api/citas/1', 'admin', { ID_Paciente: 2 })).status, 403);
  assert.deepEqual(state.operations, []);
});
test('auditoría identifica al actor de generación, descarga y eliminación sin datos sensibles', async () => {
  await request('POST', '/api/backups/generar', 'admin', { token: 'NO-AUDITAR', Observaciones: 'NO-AUDITAR' });
  await request('GET', '/api/backups/descargar/simulado.bak', 'admin');
  await request('DELETE', '/api/backups/simulado.bak', 'admin');
  const events = state.audit.filter(({ modulo }) => modulo === 'BACKUPS');
  assert.deepEqual(events.map(({ accion }) => accion), ['BACKUP_GENERADO', 'BACKUP_DESCARGADO', 'BACKUP_ELIMINADO']);
  assert.ok(events.every((event) => event.usuario.idUsuario === 1 && event.resultado === 'EXITO'));
  const json = JSON.stringify(events);
  for (const text of ['NO-AUDITAR', 'memory:/', 'Bearer', 'PasswordHash', 'CLINICO-']) assert.equal(json.includes(text), false);
});
test('una descarga fallida no se audita como éxito', async () => {
  state.failDownload = true;
  assert.equal((await request('GET', '/api/backups/descargar/simulado.bak', 'admin')).status, 500);
  assert.equal(state.audit.find(({ modulo }) => modulo === 'BACKUPS').resultado, 'FALLO');
});

test('Express resuelve exclusivamente una versión corregida de body-parser', () => {
  const require = createRequire(import.meta.url);
  const expressRequire = createRequire(require.resolve('express'));
  const version = expressRequire('body-parser/package.json').version.split('.').map(Number);
  const expressVersion = require('express/package.json').version.split('.').map(Number);
  assert.ok(expressVersion[0] === 5 && expressVersion[1] >= 3);
  assert.ok(version[0] === 2 && version[1] >= 4, version.join('.'));
});
test('JSON válido y gzip válido mantienen su contrato', async () => {
  const plain = await request('POST', '/__pruebas/json', null, { ok: true });
  assert.deepEqual(plain.data, { recibido: { ok: true } });
  const compressed = await fetch(baseUrl + '/__pruebas/json', {
    method: 'POST', headers: { 'content-type': 'application/json', 'content-encoding': 'gzip' },
    body: gzipSync(JSON.stringify({ ok: true })),
  });
  assert.equal(compressed.status, 200);
  assert.deepEqual(await compressed.json(), { recibido: { ok: true } });
});
for (const [name, body, headers, status] of [
  ['JSON malformado', '{"privado":"NO-REFLEJAR",', {}, 400],
  ['límite de tamaño', JSON.stringify({ text: 'x'.repeat(110 * 1024) }), {}, 413],
  ['codificación no soportada', '{}', { 'content-encoding': 'desconocida' }, 415],
  ['charset no soportado', '{}', { 'content-type': 'application/json; charset=iso-8859-1' }, 415],
]) test(name + ' devuelve error JSON sanitizado', async () => {
  const response = await fetch(baseUrl + '/__pruebas/json', {
    method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body,
  });
  assert.equal(response.status, status);
  assert.ok(response.headers.get('content-type').includes('application/json'));
  const text = await response.text();
  assert.equal(text.includes('NO-REFLEJAR'), false);
  assert.equal(text.includes('SyntaxError'), false);
  assert.equal((await request('GET', '/__pruebas/vivo')).status, 200);
});
test('regresión comprimida del aviso: un frame pequeño con bytes posteriores no termina la API', { timeout: 5000 }, async () => {
  const response = await fetch(baseUrl + '/__pruebas/json', {
    method: 'POST', headers: { 'content-type': 'application/json', 'content-encoding': 'gzip' },
    body: Buffer.concat([gzipSync('{"ok":true}'), Buffer.from('bytes-posteriores')]),
  });
  await response.text();
  assert.ok([200, 400].includes(response.status));
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal((await request('GET', '/__pruebas/vivo')).status, 200);
});

// Ajuste posterior al Hito 2: validación de calendario antes de datos de citas.
const { CitaService } = await import('../src/services/cita.service.ts');
const { esFechaCalendario } = await import('../src/lib/fechaCalendario.ts');
const fechasInvalidas = ['', '2026-10-', '20026-10-04', '2026-02-30', '2026-02-29', '0000-01-01', '10000-01-01', '2026-13-01', '2026-10-04T00:00:00Z'];
for (const fecha of fechasInvalidas) {
  test(`disponibilidad rechaza fecha inválida ${JSON.stringify(fecha)} antes de cita.findMany`, async () => {
    const response = await request('GET', '/api/citas/horarios-ocupados?psicologoId=10&fecha=' + encodeURIComponent(fecha), 'recepcion');
    assert.equal(response.status, 400);
    assert.equal(state.queries.length, 0);
    assert.doesNotMatch(JSON.stringify(response.data), /Prisma|findMany|[A-Z]:\\|src[\\/]/i);
  });
  test(`crear/editar cita rechaza fecha inválida ${JSON.stringify(fecha)} sin persistencia`, async () => {
    assert.equal((await request('POST', '/api/citas', 'recepcion', { ...newAppointment, FechaCita: fecha })).status, 400);
    assert.equal((await request('PUT', '/api/citas/1', 'recepcion', { FechaCita: fecha })).status, 400);
    assert.equal(state.queries.length, 0);
    assert.deepEqual(state.operations, []);
  });
}
for (const fecha of ['0001-01-01', '2000-02-29', '2028-02-29', '2099-11-03', '9999-12-31']) {
  test('disponibilidad conserva fecha de calendario válida ' + fecha, async () => {
    assert.equal(esFechaCalendario(fecha), true);
    const response = await request('GET', '/api/citas/horarios-ocupados?psicologoId=10&fecha=' + fecha, 'recepcion');
    assert.equal(response.status, 200);
    assert.equal(state.queries[0].where.FechaCita.toISOString(), fecha + 'T00:00:00.000Z');
  });
}
test('el servicio rechaza fechas inválidas incluso sin pasar por la ruta', async () => {
  const user = { idUsuario: 1, roles: ['Administrador'], esAdmin: true };
  await assert.rejects(CitaService.getHorariosOcupados(10, '20026-10-04', user), /fecha real/);
  await assert.rejects(CitaService.create({ ...newAppointment, FechaCita: '2026-02-30' }, user), /fecha real/);
  await assert.rejects(CitaService.update(1, { FechaCita: '2026-10-' }, user), /fecha real/);
  assert.equal(prisma.paciente.findUnique.mock.callCount(), 0);
  assert.equal(prisma.cita.findUnique.mock.callCount(), 0);
  assert.equal(state.queries.length, 0);
});
for (const hora of ['24:00', '08:60', '8:30', '']) test('hora inválida rechazada ' + hora, async () => {
  assert.equal((await request('POST', '/api/citas', 'recepcion', { ...newAppointment, HoraCita: hora })).status, 400);
  assert.equal(state.queries.length, 0);
});
test('fecha pasada produce un error de negocio comprensible, sin detalles internos', async () => {
  const response = await request('POST', '/api/citas', 'recepcion', { ...newAppointment, FechaCita: '2000-01-01' });
  assert.equal(response.status, 400);
  assert.match(response.data.error, /pasado.*futuras/);
  assert.doesNotMatch(JSON.stringify(response.data), /Prisma|[A-Z]:\\|src[\\/]/i);
  assert.deepEqual(state.operations, []);
});
test('errores de Prisma en disponibilidad o creación no salen en JSON ni auditoría', async () => {
  const internal = 'Invalid prisma.cita.findMany() at C:\\backend\\src\\services: SELECT consulta PRIVADO';
  mock.method(CitaService, 'getHorariosOcupados', async () => { throw Object.assign(new Error(internal), { code: 'P2009' }); });
  mock.method(CitaService, 'create', async () => { throw new Error(internal); });
  for (const response of [await request('GET', '/api/citas/horarios-ocupados?psicologoId=10&fecha=2099-11-03', 'recepcion'), await request('POST', '/api/citas', 'recepcion', newAppointment)]) {
    assert.equal(response.status, 500);
    assert.doesNotMatch(JSON.stringify(response.data), /Prisma|findMany|backend|SELECT|PRIVADO|[A-Z]:\\/i);
  }
  assert.doesNotMatch(JSON.stringify(state.audit), /SELECT|PRIVADO|C:\\/);
});
test('400 de pago indica banco/referencia faltantes antes de persistir', async () => {
  const response = await request('POST', '/api/citas', 'recepcion', { ...newAppointment, ID_MetodoPago: 2 });
  assert.equal(response.status, 400);
  assert.match(JSON.stringify(response.data), /banco|referencia/i);
  assert.deepEqual(state.operations, []);
});

test('parámetros de cita no admiten cero ni valores fuera de SQL INT', async () => {
  for (const id of ['0', '2147483648', '999999999999999999999999']) {
    assert.equal((await request('PUT', '/api/citas/' + id, 'recepcion', { FechaCita: '2099-11-03' })).status, 400);
  }
  assert.equal(prisma.cita.findUnique.mock.callCount(), 0);
  assert.deepEqual(state.operations, []);
});
