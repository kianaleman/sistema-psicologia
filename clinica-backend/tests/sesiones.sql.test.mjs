import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { once } from 'node:events';
import jwt from 'jsonwebtoken';
// Protección ANTES de importar Prisma o dotenv. Nunca caer a DATABASE_URL real.
const url = process.env.HITO2_TEST_DATABASE_URL;
if (!url) {
    test('SQL Server aislado: configurar HITO2_TEST_DATABASE_URL', { skip: true }, () => { });
}
else {
    const nombre = /(?:^|;)database=(Hito2Test_[A-Za-z0-9_]+)(?:;|$)/i.exec(url)?.[1];
    assert.ok(nombre && /^sqlserver:\/\/(?:127\.0\.0\.1|localhost)(?=[:;\\])/i.test(url), 'Solo se permite una base Hito2Test_* en SQL Server local');
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'hito2-sql-jwt-sintetico';
    process.env.DATABASE_URL = url;
    const { prisma } = await import('../src/lib/prisma.ts');
    const { createApp } = await import('../src/app.ts');
    let server, base, fixture;
    const prefijo = 'HITO2_' + Date.now();
    const request = async (path, user, body, method = body ? 'POST' : 'GET') => {
        const response = await fetch(base + '/api' + path, { method, headers: { 'Content-Type': 'application/json', ...(user ? { Authorization: 'Bearer ' + jwt.sign({ idUsuario: user, roles: ['Administrador'], esAdmin: true }, process.env.JWT_SECRET) } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
        return { status: response.status, body: await response.json() };
    };
    before(async () => {
        const actual = await prisma.$queryRaw `SELECT DB_NAME() AS nombre`;
        assert.equal(actual[0].nombre, nombre);
        const estados = ['Pendiente', 'Realizada', 'Cancelada', 'No procesada'];
        if (await prisma.estadoCita.count() === 0)
            for (const name of estados)
                await prisma.estadoCita.create({ data: { NombreEstado: name } });
        for (let i = 1; i <= 4; i++)
            assert.ok(await prisma.estadoCita.findUnique({ where: { ID_EstadoCita: i } }));
        const dep = await prisma.departamento.create({ data: { Nombre_Departamento: prefijo } });
        const mun = await prisma.municipio.create({ data: { Nombre_Municipio: prefijo, ID_Departamento: dep.ID_Departamento } });
        const dir = await prisma.direccion.create({ data: { Pais: 'Sintetico', Barrio: prefijo, ID_Municipio: mun.ID_Municipio } });
        const tipo = await prisma.tipoDeCita.create({ data: { Nombre_DeCita: 'Consulta sintetica' } });
        const via = await prisma.viaAdministracion.create({ data: { Nombre_De_Presentacion: 'Oral sintetica' } });
        const terapia1 = await prisma.tipoDe_Terapia.create({ data: { Nombre_De_Terapia: 'Terapia Uno' } });
        const terapia2 = await prisma.tipoDe_Terapia.create({ data: { Nombre_De_Terapia: 'Terapia Dos' } });
        const exploracion = await prisma.exploracionPsicologica.create({ data: { Nombre_De_ExploracionPsicologica: 'Exploracion sintetica' } });
        const users = {};
        for (const [key, rol] of Object.entries({ admin: 'Administrador', psicologo: 'Psicologo', otro: 'Psicologo', recepcion: 'Recepcion', sinRoles: null, temporal: 'Administrador' })) {
            const user = await prisma.usuario.create({ data: { Email: `${prefijo}_${key}@example.test`, PasswordHash: 'hash-sintetico-no-login', Activo: true, RequiereCambioPassword: key === 'temporal' } });
            users[key] = user.ID_Usuario;
            if (rol) {
                let r = await prisma.rol.findFirst({ where: { Nombre_Rol: rol } });
                r ??= await prisma.rol.create({ data: { Nombre_Rol: rol } });
                await prisma.usuario_Rol.create({ data: { ID_Usuario: user.ID_Usuario, ID_Rol: r.ID_Rol } });
            }
        }
        const profesionales = [];
        for (const key of ['psicologo', 'otro'])
            profesionales.push(await prisma.psicologo.create({ data: { ID_Usuario: users[key], CodigoMinsa: prefijo + key, Nombre: 'Profesional', Apellido: key, No_Telefono: '88887777', ID_Direccion: dir.ID_Direccion, Activo: true } }));
        fixture = { dir, tipo, via, terapia1, terapia2, exploracion, users, profesionales };
        server = createApp().listen(0, '127.0.0.1');
        await once(server, 'listening');
        base = `http://127.0.0.1:${server.address().port}`;
        // Fallo real del motor DESPUÉS de escribir expediente, sesión y terapias.
        await prisma.$executeRawUnsafe(`EXEC(N'CREATE OR ALTER TRIGGER dbo.Hito2_FalloTratamiento ON dbo.Tratamiento_Farmaceutico AFTER INSERT AS BEGIN IF EXISTS (SELECT 1 FROM inserted WHERE Nombre_Medicamento = ''FALLAR_HITO2'') THROW 51000, ''Fallo sintetico de persistencia Hito2'', 1; END')`);
    });
    after(async () => { if (server)
        await new Promise(resolve => server.close(resolve)); await prisma.$disconnect(); });
    const preparar = async (estado = 1) => {
        const paciente = await prisma.paciente.create({ data: { Nombre: 'Paciente', Apellido: prefijo + Math.random().toString(16).slice(2, 10), Fecha_Nacimiento: new Date('1990-01-01'), Genero: 'Femenino', ID_Direccion: fixture.dir.ID_Direccion, Activo: true } });
        const cita = await prisma.cita.create({ data: { ID_Paciente: paciente.ID_Paciente, ID_Psicologo: fixture.profesionales[0].ID_Psicologo, ID_Direccion: fixture.dir.ID_Direccion, ID_TipoCita: fixture.tipo.ID_TipoCita, ID_EstadoCita: estado, FechaCita: new Date('2099-11-03'), HoraCita: new Date('1970-01-01T08:00:00Z'), MotivoConsulta: 'MOTIVO_CLINICO' } });
        return { paciente, cita, payload: {
                ID_Cita: cita.ID_Cita, ID_Paciente: paciente.ID_Paciente, ID_Psicologo: cita.ID_Psicologo, HoraDeInicio: '2026-11-01T15:00:00.000Z',
                Observaciones: 'OBSERVACION_CLINICA', DiagnosticoDiferencial: 'DIAGNOSTICO_CLINICO', HistorialDeEvolucion: 'EVOLUCION_CLINICA', Criterios_DeDiagnostico: 'CRITERIOS_CLINICOS',
                ExploracionesIds: [fixture.exploracion.ID_ExploracionPsicologica], Tratamientos: [
                    { Tipo: 'terapeutico', Frecuencia: 'Semanal', FechaInicio: '2026-11-01', FechaFin: '2026-12-01', Terapeutico: { ID_Tipo_Terapia: fixture.terapia1.ID_Tipo_Terapia, Objetivo: 'Objetivo uno' } },
                    { Tipo: 'terapeutico', Frecuencia: 'Diaria', FechaInicio: '2026-11-02', FechaFin: '2026-12-02', Terapeutico: { ID_Tipo_Terapia: fixture.terapia2.ID_Tipo_Terapia, Objetivo: 'Objetivo dos' } },
                    { Tipo: 'farmaceutico', Frecuencia: 'Cada dia', FechaInicio: '2026-11-03', FechaFin: '2026-12-03', Farmaceutico: { ID_ViaAdministracion: fixture.via.ID_ViaAdministracion, Nombre_Medicamento: 'Farmaco sintetico', Dosis: 'Dosis sintetica' } },
                ],
            } };
    };
    test('SQL: guarda dos terapias y un fármaco completos, expediente, exploración y cita; historial coherente', async () => {
        const { paciente, cita, payload } = await preparar();
        const r = await request('/sesiones', fixture.users.psicologo, payload);
        assert.equal(r.status, 201, JSON.stringify(r.body));
        assert.equal(r.body.Tratamiento.length, 3);
        assert.equal(r.body.Expediente.ID_Paciente, paciente.ID_Paciente);
        assert.equal(r.body.HoraDeInicio, '1970-01-01T09:00:00.000Z');
        assert.equal(r.body.Tratamiento[0].Tratamiento_Terapeutico.TipoDe_Terapia.Nombre_De_Terapia, 'Terapia Uno');
        assert.equal(r.body.Tratamiento[1].Tratamiento_Terapeutico.Objetivo, 'Objetivo dos');
        assert.equal(r.body.Tratamiento[2].Tratamiento_Farmaceutico.Dosis, 'Dosis sintetica');
        for (let i = 0; i < 3; i++) {
            assert.equal(r.body.Tratamiento[i].FechaFin.slice(0, 10), payload.Tratamientos[i].FechaFin);
            assert.equal(r.body.Tratamiento[i].ID_Psicologo_Firma, cita.ID_Psicologo);
        }
        assert.equal(await prisma.sesion.count({ where: { ID_Cita: cita.ID_Cita } }), 1);
        assert.equal((await prisma.cita.findUnique({ where: { ID_Cita: cita.ID_Cita } })).ID_EstadoCita, 2);
        for (const endpoint of ['expediente', 'historial']) {
            const h = await request(`/pacientes/${paciente.ID_Paciente}/${endpoint}`, fixture.users.psicologo);
            assert.equal(h.status, 200);
            assert.equal(h.body.paciente.ID_Paciente, paciente.ID_Paciente);
            assert.equal(h.body.sesiones[0].ID_Paciente, paciente.ID_Paciente);
            assert.equal(h.body.sesiones[0].Tratamiento.length, 3);
            assert.equal(h.body.expediente.No_Expediente, r.body.Expediente.No_Expediente);
        }
        const s = await request(`/sesiones?pacienteId=${paciente.ID_Paciente}&psicologoId=${cita.ID_Psicologo}`, fixture.users.psicologo);
        assert.equal(s.status, 200);
        assert.equal(s.body.Tratamiento.length, 3);
    });
    test('SQL: trigger provoca error y revierte TODO; reintento posterior guarda una sola consulta', async () => {
        const { cita, paciente, payload } = await preparar();
        const antes = await Promise.all([prisma.sesion.count(), prisma.expediente.count(), prisma.tratamiento.count(), prisma.tratamiento_Terapeutico.count(), prisma.tratamiento_Farmaceutico.count(), prisma.sesion_ExploracionPsicologica.count()]);
        payload.Tratamientos[2].Farmaceutico.Nombre_Medicamento = 'FALLAR_HITO2';
        const r = await request('/sesiones', fixture.users.psicologo, payload);
        assert.equal(r.status, 500);
        assert.doesNotMatch(JSON.stringify(r.body), /51000|Prisma|INSERT|FALLAR_HITO2/);
        assert.equal(await prisma.sesion.count({ where: { ID_Cita: cita.ID_Cita } }), 0);
        assert.equal(await prisma.expediente.count({ where: { ID_Paciente: paciente.ID_Paciente } }), 0);
        assert.equal((await prisma.cita.findUnique({ where: { ID_Cita: cita.ID_Cita } })).ID_EstadoCita, 1);
        assert.deepEqual(await Promise.all([prisma.sesion.count(), prisma.expediente.count(), prisma.tratamiento.count(), prisma.tratamiento_Terapeutico.count(), prisma.tratamiento_Farmaceutico.count(), prisma.sesion_ExploracionPsicologica.count()]), antes);
        // Las terapias anteriores al fallo tampoco deben quedar huérfanas.
        assert.equal(await prisma.tratamiento.count({ where: { Sesion: { ID_Cita: cita.ID_Cita } } }), 0);
        payload.Tratamientos[2].Farmaceutico.Nombre_Medicamento = 'Farmaco sintetico';
        assert.equal((await request('/sesiones', fixture.users.psicologo, payload)).status, 201);
        assert.equal((await request('/sesiones', fixture.users.psicologo, payload)).status, 200);
        assert.equal(await prisma.tratamiento.count({ where: { Sesion: { ID_Cita: cita.ID_Cita } } }), 3);
    });
    test('SQL: doble envío concurrente y respuesta perdida/reintento no duplican sesión ni tratamientos', async () => {
        const { cita, payload } = await preparar();
        const resultados = await Promise.all([request('/sesiones', fixture.users.psicologo, payload), request('/sesiones', fixture.users.psicologo, payload)]);
        assert.deepEqual(resultados.map(r => r.status).sort(), [200, 201]);
        assert.equal(resultados[0].body.ID_Sesion, resultados[1].body.ID_Sesion);
        assert.equal((await request('/sesiones', fixture.users.psicologo, payload)).status, 200);
        assert.equal(await prisma.sesion.count({ where: { ID_Cita: cita.ID_Cita } }), 1);
        assert.equal(await prisma.tratamiento.count({ where: { Sesion: { ID_Cita: cita.ID_Cita } } }), 3);
        payload.DiagnosticoDiferencial = 'Otro contenido';
        assert.equal((await request('/sesiones', fixture.users.psicologo, payload)).status, 409);
    });
    for (const rol of ['recepcion', 'sinRoles', 'temporal', 'otro'])
        test(`SQL: acceso clínico no autorizado (${rol})`, async () => {
            const { cita, payload } = await preparar();
            assert.equal((await request('/sesiones', fixture.users[rol], payload)).status, 403);
            assert.equal((await request(`/sesiones?pacienteId=${payload.ID_Paciente}&psicologoId=${cita.ID_Psicologo}`, fixture.users[rol])).status, 403);
            assert.equal(await prisma.sesion.count({ where: { ID_Cita: cita.ID_Cita } }), 0);
        });
    for (const error of ['paciente', 'profesional', 'expediente', 'terapia', 'via', 'exploracion', 'cancelada', 'noProcesada', 'realizadaSinSesion', 'inactivo'])
        test(`SQL: rechaza relación/estado incompatible ${error}`, async () => {
            const { paciente, cita, payload } = await preparar(error === 'cancelada' ? 3 : error === 'noProcesada' ? 4 : error === 'realizadaSinSesion' ? 2 : 1);
            if (error === 'paciente')
                payload.ID_Paciente += 100000;
            if (error === 'profesional')
                payload.ID_Psicologo = fixture.profesionales[1].ID_Psicologo;
            if (error === 'expediente') {
                const otra = await preparar();
                const exp = await prisma.expediente.create({ data: { ID_Paciente: otra.paciente.ID_Paciente, No_Expediente: prefijo + otra.paciente.ID_Paciente } });
                payload.ID_Expediente = exp.ID_Expediente;
            }
            if (error === 'terapia')
                payload.Tratamientos[0].Terapeutico.ID_Tipo_Terapia = 2147483000;
            if (error === 'via')
                payload.Tratamientos[2].Farmaceutico.ID_ViaAdministracion = 2147483000;
            if (error === 'exploracion')
                payload.ExploracionesIds = [2147483000];
            if (error === 'inactivo')
                await prisma.paciente.update({ where: { ID_Paciente: paciente.ID_Paciente }, data: { Activo: false } });
            const r = await request('/sesiones', fixture.users.admin, payload);
            assert.equal(r.status, ['terapia', 'via', 'exploracion'].includes(error) ? 400 : 409, JSON.stringify(r.body));
            assert.equal(await prisma.sesion.count({ where: { ID_Cita: cita.ID_Cita } }), 0);
        });
    test('SQL: recepción conserva administración sin notas anidadas; otro profesional no recibe sesiones ajenas', async () => {
        const { paciente, payload } = await preparar();
        await request('/sesiones', fixture.users.admin, payload);
        for (const user of [fixture.users.recepcion, fixture.users.otro]) {
            const r = await request(`/pacientes/${paciente.ID_Paciente}/expediente`, user);
            assert.equal(r.status, 200);
            assert.deepEqual(r.body.sesiones, []);
            assert.doesNotMatch(JSON.stringify(r.body), /CLINIC|Objetivo uno|Farmaco sintetico/);
        }
        const agenda = await request('/citas', fixture.users.recepcion);
        assert.equal(agenda.status, 200);
        assert.doesNotMatch(JSON.stringify(agenda.body), /CLINIC|Objetivo uno|Farmaco sintetico/);
    });
    test('SQL: número de expediente sin sesiones y GET no crea otro expediente', async () => {
        const { paciente } = await preparar();
        const exp = await prisma.expediente.create({ data: { ID_Paciente: paciente.ID_Paciente, No_Expediente: prefijo + 'SINSESIONES' } });
        const r = await request(`/pacientes/${paciente.ID_Paciente}/expediente`, fixture.users.admin);
        assert.equal(r.status, 200);
        assert.equal(r.body.expediente.No_Expediente, exp.No_Expediente);
        assert.deepEqual(r.body.sesiones, []);
        assert.equal(await prisma.expediente.count({ where: { ID_Paciente: paciente.ID_Paciente } }), 1);
    });
    test('SQL: conservar protección de reasignación y cancelación de una cita atendida', async () => {
        const { cita, payload } = await preparar();
        await request('/sesiones', fixture.users.admin, payload);
        const r = await request(`/citas/${cita.ID_Cita}`, fixture.users.admin, { ID_Paciente: payload.ID_Paciente + 1 }, 'PUT');
        assert.equal(r.status, 403);
        const cancel = await request(`/citas/${cita.ID_Cita}/cancelar`, fixture.users.recepcion, { ID_MotivoCancelacion: 1, NotasCancelacion: 'Sintetico' }, 'PATCH');
        assert.equal(cancel.status, 409);
        assert.equal((await prisma.cita.findUnique({ where: { ID_Cita: cita.ID_Cita } })).ID_EstadoCita, 2);
    });
    for (const [rol, status] of [['admin', 200], ['psicologo', 200], ['recepcion', 200], ['sinRoles', 403], ['temporal', 403], [null, 401]])
        test(`SQL: cuenta vigente en expediente/historial (${rol || 'anonimo'})`, async () => {
            const { paciente } = await preparar();
            for (const recurso of ['expediente', 'historial'])
                assert.equal((await request(`/pacientes/${paciente.ID_Paciente}/${recurso}`, rol ? fixture.users[rol] : null)).status, status);
        });
    test('SQL: dos consultas del mismo paciente en paralelo comparten un único expediente', async () => {
        const { cita, payload } = await preparar();
        const otra = await prisma.cita.create({ data: { ID_Paciente: payload.ID_Paciente, ID_Psicologo: payload.ID_Psicologo, ID_TipoCita: fixture.tipo.ID_TipoCita, ID_Direccion: fixture.dir.ID_Direccion, ID_EstadoCita: 1, FechaCita: new Date('2099-11-04'), HoraCita: new Date('1970-01-01T08:00:00Z') } });
        const resultados = await Promise.all([request('/sesiones', fixture.users.admin, payload), request('/sesiones', fixture.users.admin, { ...payload, ID_Cita: otra.ID_Cita })]);
        for (const r of resultados)
            assert.equal(r.status, 201, JSON.stringify(r.body));
        assert.equal(resultados[0].body.ID_Expediente, resultados[1].body.ID_Expediente);
        assert.equal(await prisma.expediente.count({ where: { ID_Paciente: payload.ID_Paciente } }), 1);
        assert.equal(await prisma.sesion.count({ where: { ID_Cita: { in: [cita.ID_Cita, otra.ID_Cita] } } }), 2);
    });
    test('SQL: paciente legado sin expediente ni sesiones se consulta sin escrituras implícitas', async () => {
        const { paciente } = await preparar();
        const r = await request(`/pacientes/${paciente.ID_Paciente}/expediente`, fixture.users.admin);
        assert.equal(r.status, 200);
        assert.equal(r.body.expediente, null);
        assert.deepEqual(r.body.sesiones, []);
        assert.equal(await prisma.expediente.count({ where: { ID_Paciente: paciente.ID_Paciente } }), 0);
    });
    test('SQL: historial rechaza una sesión legada con expediente de otro paciente', async () => {
        const actual = await preparar();
        const otro = await preparar();
        const expedienteAjeno = await prisma.expediente.create({ data: { ID_Paciente: otro.paciente.ID_Paciente, No_Expediente: prefijo + 'AJENO' + otro.paciente.ID_Paciente } });
        await prisma.cita.update({ where: { ID_Cita: actual.cita.ID_Cita }, data: { ID_EstadoCita: 2 } });
        await prisma.sesion.create({ data: { ID_Cita: actual.cita.ID_Cita, ID_Expediente: expedienteAjeno.ID_Expediente, Observaciones: 'SECRETO_AJENO', DiagnosticoDiferencial: 'SECRETO_AJENO', HistorialDeEvolucion: '', Criterios_DeDiagnostico: 'DSM-5' } });
        for (const recurso of ['expediente', 'historial']) {
            const response = await request(`/pacientes/${actual.paciente.ID_Paciente}/${recurso}`, fixture.users.admin);
            assert.equal(response.status, 409);
            assert.doesNotMatch(JSON.stringify(response.body), /SECRETO_AJENO/);
        }
    });

    for (const fecha of ['0001-01-01', '2028-02-29', '9999-12-31']) test('SQL: disponibilidad admite rango DATE real ' + fecha, async () => {
        const r = await request(`/citas/horarios-ocupados?psicologoId=${fixture.profesionales[0].ID_Psicologo}&fecha=${fecha}`, fixture.users.admin);
        assert.equal(r.status, 200, JSON.stringify(r.body));
        assert.ok(Array.isArray(r.body));
    });
    test('SQL: payload de cita futura crea recibo y edición conserva día y hora de calendario', async () => {
        if (!await prisma.metodoPago.findUnique({ where: { ID_Metodo_Pago: 1 } })) {
            const metodo = await prisma.metodoPago.create({ data: { Nombre_Metodo: 'Efectivo sintetico' } });
            assert.equal(metodo.ID_Metodo_Pago, 1);
        }
        if (!await prisma.divisa.findUnique({ where: { ID_Divisa: 1 } })) {
            const moneda = await prisma.divisa.create({ data: { Codigo_ISO: 'NIO', Nombre: 'Cordoba sintetica' } });
            assert.equal(moneda.ID_Divisa, 1);
        }
        const datos = await preparar();
        const r = await request('/citas', fixture.users.recepcion, {
            ID_Paciente: datos.paciente.ID_Paciente, ID_Psicologo: datos.cita.ID_Psicologo,
            ID_Direccion: fixture.dir.ID_Direccion, ID_TipoCita: fixture.tipo.ID_TipoCita,
            FechaCita: '2099-12-01', HoraCita: '09:30', Precio: 250, ID_MetodoPago: 1,
        });
        assert.equal(r.status, 201, JSON.stringify(r.body));
        assert.equal(r.body.cita.FechaCita, '2099-12-01T00:00:00.000Z');
        assert.equal(r.body.cita.HoraCita, '1970-01-01T09:30:00.000Z');
        assert.equal(Number(r.body.recibo.MontoTotal), 250);
        const editada = await request(`/citas/${r.body.cita.ID_Cita}`, fixture.users.recepcion, { FechaCita: '2099-12-02' }, 'PUT');
        assert.equal(editada.status, 200, JSON.stringify(editada.body));
        const persistida = await prisma.cita.findUnique({ where: { ID_Cita: r.body.cita.ID_Cita } });
        assert.equal(persistida.FechaCita.toISOString(), '2099-12-02T00:00:00.000Z');
        assert.equal(persistida.HoraCita.toISOString(), '1970-01-01T09:30:00.000Z');
    });

}
