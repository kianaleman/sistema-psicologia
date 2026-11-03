import assert from 'node:assert/strict';
import { after, before, beforeEach, mock, test } from 'node:test';
import { once } from 'node:events';
import jwt from 'jsonwebtoken';
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'hito2-jwt-solo-pruebas';
process.env.DATABASE_URL = 'sqlserver://127.0.0.1:1;database=Ficticia;user=nadie;password=nadie;trustServerCertificate=true';
const { createApp } = await import('../src/app.ts');
const { prisma } = await import('../src/lib/prisma.ts');
const { SesionService } = await import('../src/services/sesion.service.ts');
const { AuditoriaService } = await import('../src/services/auditoria.service.ts');
const { protegerCuentaVigente } = await import('../src/middlewares/auth.middleware.ts');
const { crearPayloadSesion } = await import('../../clinica-frontend/src/services/borradoresSesion.ts');
const cita = { ID_Cita: 40, ID_Paciente: 205, ID_Psicologo: 10 };
const borrador = {
    horaInicioSistema: '2026-11-01T15:00:00.000Z',
    datosSesion: { observaciones: ' Notas ', diagnostico: ' Diagnostico ', historial: ' Evolucion ', criterios: ' DSM-5 ' },
    selectedExploraciones: new Set([1, 2]), listaTratamientos: [
        { tipo: 'terapeutico', frecuencia: 'Semanal', fechaInicio: '2026-11-01', fechaFin: '2026-12-01', tipoTerapiaId: '1', objetivo: 'Objetivo uno' },
        { tipo: 'terapeutico', frecuencia: 'Diaria', fechaInicio: '2026-11-01', fechaFin: '2026-12-02', tipoTerapiaId: '2', objetivo: 'Objetivo dos' },
        { tipo: 'farmacologico', frecuencia: 'Diaria', fechaInicio: '2026-11-01', fechaFin: '2026-12-03', viaAdminId: '1', medicamento: 'Sintetico', dosis: 'Dosis prueba' },
    ],
};
let server, base, calls, account;
const originalAccount = prisma.usuario.findUnique;
before(async () => {
    const app = createApp();
    app.get('/__cuenta', ...protegerCuentaVigente, (req, res) => res.json({ iguales: req.user === req.usuario, user: req.user }));
    server = app.listen(0, '127.0.0.1');
    await once(server, 'listening');
    base = `http://127.0.0.1:${server.address().port}`;
});
beforeEach(() => {
    mock.restoreAll();
    calls = [];
    account = { ID_Usuario: 1, Email: 'test@example.test', Activo: true, RequiereCambioPassword: false,
        Psicologo: { ID_Psicologo: 10 }, Usuario_Rol: [{ Rol: { Nombre_Rol: 'Psicologo' } }] };
    prisma.usuario.findUnique = async () => account;
    mock.method(AuditoriaService, 'registrarDesdeRequest', async () => { });
    mock.method(SesionService, 'create', async (data, user) => { calls.push({ data, user }); return { sesion: { ID_Sesion: 8 }, creada: true }; });
});
after(async () => { mock.restoreAll(); prisma.usuario.findUnique = originalAccount; await new Promise(resolve => server.close(resolve)); });
const request = (payload, token = true) => fetch(base + '/api/sesiones', {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + jwt.sign({ idUsuario: 1, roles: ['Administrador'], esAdmin: true, idPsicologo: 99 }, process.env.JWT_SECRET) } : {}) },
    body: JSON.stringify(payload),
});
for (const [rol, status] of [['Administrador', 201], ['Psicologo', 201], ['Recepcion', 403], ['', 403]])
    test(`crear sesión con cuenta vigente ${rol || 'sin roles'}`, async () => {
        account.Usuario_Rol = rol ? [{ Rol: { Nombre_Rol: rol } }] : [];
        const response = await request(crearPayloadSesion(cita, borrador));
        assert.equal(response.status, status);
        assert.equal(calls.length, status === 201 ? 1 : 0);
    });
test('payload REAL del constructor del formulario recorre el endpoint y sus transformaciones', async () => {
    const payload = crearPayloadSesion(cita, borrador);
    assert.ok(!('ID_Expediente' in payload));
    assert.equal(payload.Tratamientos.length, 3);
    payload.ID_Cita = '40';
    payload.ExploracionesIds = [1, '1', 2];
    payload.DiagnosticoDiferencial = ' Diagnostico ';
    const response = await request(payload);
    assert.equal(response.status, 201);
    assert.equal(calls[0].data.ID_Cita, 40);
    assert.deepEqual(calls[0].data.ExploracionesIds, [1, 2]);
    assert.equal(calls[0].data.DiagnosticoDiferencial, 'Diagnostico');
    assert.equal(calls[0].data.Tratamientos[2].FechaFin, '2026-12-03');
    assert.equal(calls[0].user.esAdmin, false);
    assert.equal(calls[0].user.idPsicologo, 10);
});
test('sin autenticación no se invoca persistencia', async () => { assert.equal((await request(crearPayloadSesion(cita, borrador), false)).status, 401); assert.equal(calls.length, 0); });
for (const kind of ['temporal', 'inactiva', 'eliminada'])
    test(`cuenta ${kind} rechazada`, async () => {
        if (kind === 'temporal')
            account.RequiereCambioPassword = true;
        if (kind === 'inactiva')
            account.Activo = false;
        if (kind === 'eliminada')
            account = null;
        assert.equal((await request(crearPayloadSesion(cita, borrador))).status, kind === 'temporal' ? 403 : 401);
        assert.equal(calls.length, 0);
    });
for (const [name, change] of [
    ['expediente cero', p => p.ID_Expediente = 0], ['subtipo incompleto', p => delete p.Tratamientos[2].Farmaceutico.Dosis],
    ['fecha final anterior', p => p.Tratamientos[0].FechaFin = '2025-01-01'], ['paciente ausente', p => delete p.ID_Paciente],
    ['tratamiento singular obsoleto', p => p.Tratamiento = p.Tratamientos[0]], ['hora inválida', p => p.HoraDeInicio = '09:00'],
])
    test(`rechaza ${name} sin guardar parcialmente`, async () => {
        const payload = crearPayloadSesion(cita, borrador);
        change(payload);
        assert.equal((await request(payload)).status, 400);
        assert.equal(calls.length, 0);
    });
test('req.user y req.usuario contienen la misma cuenta recalculada', async () => {
    account.Usuario_Rol = [{ Rol: { Nombre_Rol: 'Recepcion' } }];
    account.Psicologo = null;
    const r = await fetch(base + '/__cuenta', { headers: { Authorization: 'Bearer ' + jwt.sign({ idUsuario: 1, roles: ['Administrador'], esAdmin: true }, process.env.JWT_SECRET) } });
    const data = await r.json();
    assert.equal(data.iguales, true);
    assert.equal(data.user.esAdmin, false);
    assert.equal(data.user.esRecepcion, true);
    assert.equal(data.user.idPsicologo, null);
});
