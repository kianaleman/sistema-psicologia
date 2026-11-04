import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import { after, afterEach, beforeEach, mock, test } from 'node:test';
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/', pretendToBeVisual: true });
for (const key of ['window', 'document', 'HTMLElement', 'HTMLInputElement', 'HTMLTextAreaElement', 'HTMLSelectElement', 'Event', 'MouseEvent', 'localStorage', 'sessionStorage'])
    globalThis[key] = dom.window[key];
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true });
globalThis.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
globalThis.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window);
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const React = await import('react');
const { act } = React;
const { createRoot } = await import('react-dom/client');
const { MemoryRouter, Routes, Route } = await import('react-router-dom');
const { default: SesionModal } = await import('../src/components/citas/SesionModal.tsx');
const { default: CancelarCitaModal } = await import('../src/components/citas/CancelarCitaModal.tsx');
const { default: HistorialModal } = await import('../src/components/citas/HistorialModal.tsx');
const { default: PacienteDetalle } = await import('../src/pages/PacienteDetalle.tsx');
const { usePacienteDetalle } = await import('../src/hooks/usePacienteDetalle.ts');
const { useCitas } = await import('../src/hooks/useCitas.ts');
const { api } = await import('../src/services/api.ts');
const { limpiarBorradoresSesion } = await import('../src/services/borradoresSesion.ts');
const { prepararPDFExpediente, prepararPDFReceta } = await import('../src/services/expedientePaciente.ts');
const { generarPDFExpediente, generarPDFReceta } = await import('../src/services/pdfGenerator.ts');
const { jsPDF } = await import('jspdf');
const guardarMuestra = (name, doc) => { if (process.env.HITO2_PDF_DIR) {
    mkdirSync(process.env.HITO2_PDF_DIR, { recursive: true });
    writeFileSync(join(process.env.HITO2_PDF_DIR, name), Buffer.from(doc.output('arraybuffer')));
} };
let container, root;
const el = React.createElement;
const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };
const FECHA_INICIO_TRATAMIENTO = '2026-11-01';
// Opcional: repetir toda la suite en un año futuro sin alterar el reloj del sistema.
const relojDePrueba = process.env.HITO2_TEST_NOW ? new Date(process.env.HITO2_TEST_NOW) : null;
if (relojDePrueba && Number.isNaN(relojDePrueba.getTime()))
    throw new Error('HITO2_TEST_NOW debe contener un instante ISO válido.');
const cita = (id = 1) => ({ ID_Cita: id, ID_Paciente: id, ID_Psicologo: 10, ID_TipoCita: 1, ID_Direccion: 1, ID_EstadoCita: 1, FechaCita: '2026-01-01', HoraCita: '1970-01-01T08:00:00Z', Paciente: { ID_Paciente: id, Nombre: 'Paciente', Apellido: id === 1 ? 'A' : 'B' } });
const catalogos = { viasAdmin: [{ ID_ViaAdministracion: 1, Nombre_De_Presentacion: 'Oral' }], tiposTerapia: [{ ID_Tipo_Terapia: 1, Nombre_De_Terapia: 'Terapia Uno' }, { ID_Tipo_Terapia: 2, Nombre_De_Terapia: 'Terapia Dos' }], exploraciones: [] };
const expediente = (id = 1, sesiones = true) => ({
    paciente: { ID_Paciente: id, Nombre: 'Paciente', Apellido: id === 1 ? 'A' : 'B', Fecha_Nacimiento: '1990-01-01', Genero: 'Femenino' },
    expediente: { ID_Expediente: id, ID_Paciente: id, No_Expediente: 'EXP-' + id, FechaIngreso: '2026-01-01' },
    citas: [{ ...cita(id), Psicologo: { ID_Psicologo: 10, Nombre: 'Profesional', Apellido: 'Prueba' }, TipoDeCita: { Nombre_DeCita: 'Consulta' } }],
    sesiones: sesiones ? [{ ID_Sesion: id, ID_Cita: id, ID_Paciente: id, ID_Psicologo: 10, ID_Expediente: id, FechaCita: '2026-01-01', HoraDeInicio: '1970-01-01T09:00:00Z', Observaciones: 'Notas ' + id, DiagnosticoDiferencial: 'Diagnostico ' + id, HistorialDeEvolucion: 'Evolucion ' + id, Criterios_DeDiagnostico: 'Criterios ' + id, Tratamiento: [
                ...[1, 2].map((n) => ({ ID_Tratamiento: n, Frecuencia: 'Semanal', FechaInicio: '2026-11-01', FechaFin: '2026-12-0' + n, Tratamiento_Terapeutico: { Objetivo: 'Objetivo ' + n, TipoDe_Terapia: { Nombre_De_Terapia: n === 1 ? 'Terapia Uno' : 'Terapia Dos' } }, Tratamiento_Farmaceutico: null })),
                { ID_Tratamiento: 3, Frecuencia: 'Cada dia', FechaInicio: '2026-11-03', FechaFin: '2026-12-03', Tratamiento_Terapeutico: null, Tratamiento_Farmaceutico: { Nombre_Medicamento: 'Sintetico', Dosis: '25 mg', ViaAdministracion: { Nombre_De_Presentacion: 'Oral' } } },
            ] }] : [],
});
const render = async (component, props = {}) => act(async () => { root.render(el(component, props)); });
const button = (text) => [...container.querySelectorAll('button')].find(b => b.textContent.includes(text));
const click = async (node) => { assert.ok(node, 'Elemento presente'); await act(async () => { node.dispatchEvent(new MouseEvent('click', { bubbles: true })); }); };
const input = async (label, value) => { const node = container.querySelector(`[aria-label="${label}"]`); assert.ok(node, label); const proto = node.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : node.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype; await act(async () => { Object.getOwnPropertyDescriptor(proto, 'value').set.call(node, value); node.dispatchEvent(new Event(node.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true })); }); };
const unmount = async () => { if (root)
    await act(async () => root.unmount()); root = null; container?.remove(); };
beforeEach(() => {
    mock.restoreAll();
    if (relojDePrueba)
        mock.timers.enable({ apis: ['Date'], now: relojDePrueba });
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('token', 'token-sintetico');
    limpiarBorradoresSesion();
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    mock.method(api.tests, 'getResultadosPaciente', async () => []);
    mock.method(api.tests, 'getResultadosSesion', async () => []);
    mock.method(api.general, 'motivosCancelacion', async () => [{ ID_MotivoCancelacion: 1, Motivo: 'Motivo sintetico' }]);
    mock.method(api.citas, 'getAll', async () => []);
    mock.method(api.general, 'catalogos', async () => ({}));
    window.confirm = () => true;
});
afterEach(async () => {
    try { await unmount(); }
    finally { mock.restoreAll(); mock.timers.reset(); }
});
after(() => dom.window.close());
const llenar = async () => { await input('Observaciones clínicas', 'Notas conservadas'); await input('Diagnóstico diferencial', 'Diagnostico conservado'); await input('Evolución clínica', 'Evolucion conservada'); };
const terapia = async (n) => { await input('Objetivo terapéutico', 'Objetivo ' + n); await input('Tipo de terapia', String(n)); await input('Frecuencia', 'Semanal'); await input('Fecha de inicio del tratamiento', FECHA_INICIO_TRATAMIENTO); await input('Fecha de fin del tratamiento', '2026-12-0' + n); await click(button('+ Agregar Indicación')); };
const formulario = props => ({ isOpen: true, onClose: () => { }, cita: cita(), catalogos, ...props });
function FormularioConApi(props) { const { acciones } = useCitas(); return el(SesionModal, { ...props, onSubmit: acciones.guardarSesion }); }
test('formulario REAL envía todos los tratamientos y omite ID_Expediente', async () => {
    const saved = [];
    await render(SesionModal, formulario({ onSubmit: async (p) => { saved.push(p); } }));
    await llenar();
    await terapia(1);
    await terapia(2);
    await input('Tipo de tratamiento', 'farmacologico');
    await input('Medicamento', 'Sintetico');
    await input('Dosis', '25 mg');
    await input('Vía de administración', '1');
    await input('Frecuencia', 'Diaria');
    await input('Fecha de inicio del tratamiento', FECHA_INICIO_TRATAMIENTO);
    await input('Fecha de fin del tratamiento', '2026-12-03');
    await click(button('+ Agregar Indicación'));
    await click(button('Finalizar Consulta'));
    assert.equal(saved.length, 1);
    assert.ok(!('ID_Expediente' in saved[0]));
    assert.equal(saved[0].Tratamientos.length, 3);
    assert.equal(saved[0].Tratamientos[2].Farmaceutico.Dosis, '25 mg');
    assert.deepEqual(saved[0].Tratamientos.map(t => t.FechaInicio), Array(3).fill(FECHA_INICIO_TRATAMIENTO));
    assert.deepEqual(saved[0].Tratamientos.map(t => t.FechaFin), ['2026-12-01', '2026-12-02', '2026-12-03']);
});
test('la validación del formulario rechaza una fecha final anterior al inicio', async () => {
    const saved = [];
    await render(SesionModal, formulario({ onSubmit: async (payload) => { saved.push(payload); } }));
    await llenar();
    await input('Objetivo terapéutico', 'Objetivo con fechas explícitas');
    await input('Tipo de terapia', '1');
    await input('Frecuencia', 'Semanal');
    await input('Fecha de inicio del tratamiento', FECHA_INICIO_TRATAMIENTO);
    await input('Fecha de fin del tratamiento', '2026-10-31');
    await click(button('+ Agregar Indicación'));
    assert.equal(container.querySelectorAll('tbody tr').length, 0);
    await click(button('Finalizar Consulta'));
    assert.equal(saved.length, 0);
    assert.equal(container.querySelector('[aria-label="Fecha de fin del tratamiento"]').value, '2026-10-31');

    await input('Fecha de fin del tratamiento', '2026-12-01');
    await click(button('+ Agregar Indicación'));
    await click(button('Finalizar Consulta'));
    assert.equal(saved.length, 1);
    assert.equal(saved[0].Tratamientos[0].FechaInicio, FECHA_INICIO_TRATAMIENTO);
    assert.equal(saved[0].Tratamientos[0].FechaFin, '2026-12-01');
});
test('error real de API conserva formulario, notas, tratamientos y hora; promesa pendiente bloquea doble clic; reintento cierra tras éxito', async () => {
    const op = deferred();
    let closed = 0;
    const create = mock.method(api.sesiones, 'create', () => op.promise);
    const props = formulario({ onClose: () => closed++ });
    await render(FormularioConApi, props);
    await llenar();
    await terapia(1);
    const inicio = container.textContent.match(/Inicio:[\s\S]*?\d{1,2}:\d{2}:\d{2}/)?.[0];
    const save = button('Finalizar Consulta');
    await act(async () => { save.click(); save.click(); });
    assert.equal(create.mock.callCount(), 1);
    assert.equal(closed, 0);
    assert.equal(save.disabled, true);
    assert.equal(container.querySelector('fieldset').disabled, true);
    await act(async () => { op.reject(new Error('Servidor no disponible')); });
    assert.equal(closed, 0);
    assert.match(container.querySelector('[role=alert]').textContent, /Servidor no disponible/);
    assert.equal(container.querySelector('[aria-label="Observaciones clínicas"]').value, 'Notas conservadas');
    assert.match(container.textContent, /Objetivo 1/);
    assert.ok(container.textContent.includes(inicio));
    create.mock.mockImplementation(async () => ({ ID_Sesion: 1 }));
    await click(button('Finalizar Consulta'));
    assert.equal(create.mock.callCount(), 2);
    assert.equal(closed, 1);
});
test('borrador en memoria al desmontar/reabrir: separado por paciente y cita, eliminado al terminar sesión autenticada', async () => {
    const props = formulario({ onSubmit: async () => { } });
    await render(SesionModal, props);
    await llenar();
    await terapia(1);
    const inicio = container.textContent.match(/Inicio:[\s\S]*?\d{1,2}:\d{2}:\d{2}/)?.[0];
    await render(SesionModal, { ...props, isOpen: false });
    await render(SesionModal, { ...props, cita: cita(2) });
    assert.equal(container.querySelector('[aria-label="Observaciones clínicas"]').value, '');
    await render(SesionModal, props);
    assert.equal(container.querySelector('[aria-label="Observaciones clínicas"]').value, 'Notas conservadas');
    assert.match(container.textContent, /Objetivo 1/);
    assert.ok(container.textContent.includes(inicio));
    assert.equal(sessionStorage.length, 0);
    await render(SesionModal, { ...props, isOpen: false });
    limpiarBorradoresSesion();
    localStorage.setItem('token', 'otra-sesion');
    await render(SesionModal, props);
    assert.equal(container.querySelector('[aria-label="Observaciones clínicas"]').value, '');
});
test('cierre voluntario exige confirmación antes de descartar', async () => {
    let closed = 0;
    const confirm = mock.fn(() => false);
    window.confirm = confirm;
    await render(SesionModal, formulario({ onSubmit: async () => { }, onClose: () => closed++ }));
    await llenar();
    await click(button('Cancelar'));
    assert.equal(confirm.mock.callCount(), 1);
    assert.equal(closed, 0);
    assert.equal(container.querySelector('[aria-label="Diagnóstico diferencial"]').value, 'Diagnostico conservado');
    window.confirm = () => true;
    await click(button('Cancelar'));
    assert.equal(closed, 1);
});
test('cancelación espera persistencia; fallo conserva motivo/notas y permite reintentar', async () => {
    const op = deferred();
    let closed = 0;
    const confirm = mock.fn(() => op.promise);
    await render(CancelarCitaModal, { isOpen: true, onClose: () => closed++, onConfirm: confirm });
    const select = container.querySelector('select');
    await act(async () => { Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(select, '1'); select.dispatchEvent(new Event('change', { bubbles: true })); });
    const notes = container.querySelector('textarea');
    await act(async () => { Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(notes, 'Conservar nota'); notes.dispatchEvent(new Event('input', { bubbles: true })); });
    const form = container.querySelector('form');
    await act(async () => { form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); });
    assert.equal(closed, 0);
    assert.equal(confirm.mock.callCount(), 1);
    await act(async () => op.reject(new Error('Fallo de cancelacion')));
    assert.equal(closed, 0);
    assert.equal(notes.value, 'Conservar nota');
    assert.equal(select.value, '1');
    assert.match(container.textContent, /Fallo de cancelacion/);
    confirm.mock.mockImplementation(async () => { });
    await act(async () => { form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); });
    assert.equal(closed, 1);
});
for (const view of ['modal', 'hook'])
    test(`cambio A → B con A tardío no mezcla datos (${view})`, async () => {
        const a = deferred(), b = deferred();
        const signals = [];
        mock.method(api.pacientes, 'getOne', (id, signal) => { signals.push(signal); return Number(id) === 1 ? a.promise : b.promise; });
        function Hook({ id }) { const state = usePacienteDetalle(String(id)); return el('pre', null, JSON.stringify(state.expediente ?? { loading: state.loading, error: state.error })); }
        const Component = view === 'modal' ? HistorialModal : Hook;
        const props = id => view === 'modal' ? { isOpen: true, cita: cita(id), onClose: () => { } } : { id };
        await render(Component, props(1));
        await render(Component, props(2));
        assert.equal(signals[0].aborted, true);
        assert.doesNotMatch(container.textContent, /Notas 1|EXP-1/);
        assert.equal(button('Imprimir receta'), undefined);
        await act(async () => b.resolve(expediente(2)));
        assert.match(container.textContent, view === 'modal' ? /Paciente B/ : /"ID_Paciente":2/);
        await act(async () => a.resolve(expediente(1)));
        assert.doesNotMatch(container.textContent, /Notas 1|EXP-1|Paciente A/);
        assert.match(container.textContent, /Notas 2/);
    });
test('historial/receta: PDF generado SOLO con paciente vigente y tratamientos completos', async () => {
    mock.method(api.pacientes, 'getOne', async () => expediente(2));
    const saved = [];
    const original = jsPDF.API.save;
    jsPDF.API.save = function (filename) { saved.push({ filename, contenido: this.output() }); return this; };
    try {
        await render(HistorialModal, { isOpen: true, cita: cita(2), onClose: () => { } });
        await click(button('Imprimir receta'));
        assert.equal(saved.length, 1);
        assert.match(saved[0].filename, /Paciente_B/);
        assert.match(saved[0].contenido, /PACIENTE B/);
        assert.match(saved[0].contenido, /1 de enero de 2026/);
        for (const value of ['EXP-2', 'Terapia Uno', 'Terapia Dos', 'Sintetico', '25 mg', 'Oral', '2026-12-03'])
            assert.ok(saved[0].contenido.includes(value), value);
    }
    finally {
        jsPDF.API.save = original;
    }
});
test('expediente PDF conserva número incluso sin sesiones y rechaza mezcla de paciente/sesión', () => {
    const data = expediente(2, false);
    const pdf = prepararPDFExpediente(data, 2);
    const contenido = generarPDFExpediente(pdf.paciente, pdf.sesiones, false).output();
    assert.match(contenido, /EXP-2/);
    assert.match(contenido, /Paciente B/);
    assert.throws(() => prepararPDFExpediente(expediente(1), 2), /paciente/);
    const mezclado = expediente(2);
    mezclado.sesiones[0].ID_Paciente = 1;
    assert.throws(() => prepararPDFExpediente(mezclado, 2), /sesiones/);
    assert.throws(() => prepararPDFReceta(expediente(2), 2, 1), /historial activo/);
});
test('expediente PDF completo contiene terapias, dosis, vía, fechas y criterios', () => {
    const pdf = prepararPDFExpediente(expediente(2), 2);
    const doc = generarPDFExpediente(pdf.paciente, pdf.sesiones, false);
    guardarMuestra('expediente-sintetico.pdf', doc);
    const receta = prepararPDFReceta(expediente(2), 2, 2);
    guardarMuestra('receta-sintetica.pdf', generarPDFReceta(receta.sesion, receta.nombrePaciente, false));
    const contenido = doc.output();
    for (const value of ['EXP-2', 'Terapia Uno', 'Terapia Dos', 'Sintetico', '25 mg', 'Oral', '2026-12-03', 'Criterios 2'])
        assert.ok(contenido.includes(value), value);
});
test('error o respuesta de otro paciente impide mostrar historial y generar PDF', async () => {
    mock.method(api.pacientes, 'getOne', async () => expediente(1));
    await render(HistorialModal, { isOpen: true, cita: cita(2), onClose: () => { } });
    assert.match(container.querySelector('[role=alert]').textContent, /paciente activo/);
    assert.equal(button('Imprimir receta'), undefined);
    assert.doesNotMatch(container.textContent, /Notas 1/);
});
test('página de detalle utiliza el mismo contrato para un expediente sin sesiones', async () => {
    mock.method(api.pacientes, 'getOne', async () => expediente(2, false));
    const saved = [];
    const original = jsPDF.API.save;
    jsPDF.API.save = function () { saved.push(this.output()); return this; };
    function Page() { return el(MemoryRouter, { initialEntries: ['/pacientes/2'] }, el(Routes, null, el(Route, { path: '/pacientes/:id', element: el(PacienteDetalle) }))); }
    try {
        await render(Page);
        assert.match(container.textContent, /Paciente/);
        await click(button('Descargar expediente'));
        assert.equal(saved.length, 1);
        assert.match(saved[0], /EXP-2/);
        assert.match(saved[0], /Paciente B/);
    }
    finally {
        jsPDF.API.save = original;
    }
});
test('receta de varias páginas conserva la última indicación', () => {
    const data = expediente(2);
    data.sesiones[0].Tratamiento = Array.from({ length: 25 }, (_, i) => ({ ...data.sesiones[0].Tratamiento[2], ID_Tratamiento: i + 1, Tratamiento_Farmaceutico: { ...data.sesiones[0].Tratamiento[2].Tratamiento_Farmaceutico, Nombre_Medicamento: 'Indicación ' + i } }));
    const pdf = prepararPDFReceta(data, 2, 2);
    const doc = generarPDFReceta(pdf.sesion, pdf.nombrePaciente, false);
    assert.ok(doc.getNumberOfPages() > 1);
    assert.match(doc.output(), /24/);
});

// Ajuste posterior: calendario, disponibilidad y campos de tratamientos.
const { default: CitaFormModal } = await import('../src/components/citas/CitaFormModal.tsx');
const { useDisponibilidadCita } = await import('../src/hooks/useDisponibilidadCita.ts');
const { esFechaCalendario } = await import('../src/utils/fechaCalendario.ts');
const { default: Dashboard } = await import('../src/pages/Dashboard.tsx');
const catalogosAgenda = {
  pacientes: [{ ...cita().Paciente, ID_Direccion: 1, Activo: true }],
  psicologos: [1, 2].map(id => ({ ID_Psicologo: id, Nombre: 'Profesional', Apellido: String(id), Activo: true })),
  tiposCita: [{ ID_TipoCita: 1, Nombre_DeCita: 'Consulta' }],
  metodosPago: [{ ID_Metodo_Pago: 1, Nombre_Metodo: 'Efectivo' }], bancos: [],
};
const agendaProps = (props = {}) => ({ isOpen: true, citaEditar: null, onClose: () => {}, onSubmit: async () => true, catalogos: catalogosAgenda, onCheckDisponibilidad: async () => [], ...props });
function AgendaConApi(props) {
  const { acciones } = useCitas();
  return el(CitaFormModal, { ...props, onCheckDisponibilidad: acciones.obtenerHorariosOcupados });
}
const llenarCita = async () => {
  await input('Paciente de la cita', '1');
  await input('Profesional de la cita', '1');
  await input('Fecha de la cita', '2099-11-03');
  await input('Tipo de cita', '1');
  await input('Precio de la cita', '250.00');
  await input('Método de pago de la cita', '1');
};
for (const fecha of ['', '2026-10-', '20026-10-04', '0000-01-01', '2026-02-30', '2026-02-29', '1900-02-29', '2026-13-01']) {
  test('calendario y formulario no consultan disponibilidad para ' + JSON.stringify(fecha), async () => {
    assert.equal(esFechaCalendario(fecha), false);
    const consultar = mock.fn(async () => []);
    await render(CitaFormModal, agendaProps({ onCheckDisponibilidad: consultar }));
    await input('Profesional de la cita', '1');
    await input('Fecha de la cita', fecha);
    assert.equal(consultar.mock.callCount(), 0);
    assert.doesNotMatch(container.textContent, /El profesional tiene disponibilidad horaria/);
  });
}
for (const fecha of ['0001-01-01', '2000-02-29', '2028-02-29', '2099-11-03', '9999-12-31']) test('disponibilidad acepta calendario válido ' + fecha, async () => {
  const consultar = mock.fn(async () => []);
  await render(CitaFormModal, agendaProps({ onCheckDisponibilidad: consultar }));
  await input('Profesional de la cita', '1'); await input('Fecha de la cita', fecha);
  assert.equal(esFechaCalendario(fecha), true);
  assert.deepEqual(consultar.mock.calls[0].arguments, [1, fecha]);
  assert.match(container.textContent, /El profesional tiene disponibilidad horaria/);
});
test('fallo de disponibilidad se propaga por useCitas, no significa libre, permite reintento', async () => {
  const consultar = mock.method(api.citas, 'getHorariosOcupados', async () => { throw new Error('Red no disponible'); });
  await render(AgendaConApi, agendaProps());
  await input('Profesional de la cita', '1'); await input('Fecha de la cita', '2099-11-03');
  assert.match(container.textContent, /No se pudo comprobar la disponibilidad.*Red no disponible/);
  assert.doesNotMatch(container.textContent, /El profesional tiene disponibilidad horaria/);
  assert.equal(container.querySelector('button[type="submit"]').disabled, true);
  consultar.mock.mockImplementation(async () => []);
  await click(button('Reintentar disponibilidad'));
  assert.equal(consultar.mock.callCount(), 2);
  assert.match(container.textContent, /El profesional tiene disponibilidad horaria/);
});
for (const cambio of ['fecha', 'profesional']) test(`disponibilidad descarta respuesta anterior al cambiar ${cambio}`, async () => {
  const a = deferred(), b = deferred();
  const consultar = mock.fn((id, fecha) => (cambio === 'fecha' ? fecha === '2099-11-03' : id === 1) ? a.promise : b.promise);
  await render(CitaFormModal, agendaProps({ onCheckDisponibilidad: consultar }));
  await input('Profesional de la cita', '1'); await input('Fecha de la cita', '2099-11-03');
  if (cambio === 'fecha') await input('Fecha de la cita', '2099-11-04');
  else await input('Profesional de la cita', '2');
  assert.ok(container.querySelector('[role="status"]'));
  await act(async () => b.resolve(['09:30']));
  await act(async () => a.resolve(['10:30']));
  assert.match(container.textContent, /09:30/); assert.doesNotMatch(container.textContent, /10:30/);
});
test('volver A -> B -> A no reutiliza disponibilidad anterior mientras consulta de nuevo', async () => {
  const tercero = deferred(); let calls = 0;
  const consultar = () => ++calls <= 2 ? Promise.resolve([]) : tercero.promise;
  function Hook({ fecha }) { const estado = useDisponibilidadCita(1, fecha, consultar); return el('pre', null, estado.estado); }
  await render(Hook, { fecha: '2099-11-03' }); assert.equal(container.textContent, 'cargada');
  await render(Hook, { fecha: '2099-11-04' }); assert.equal(container.textContent, 'cargada');
  await render(Hook, { fecha: '2099-11-03' }); assert.equal(container.textContent, 'cargando');
  await act(async () => tercero.resolve([])); assert.equal(container.textContent, 'cargada');
});
test('payload real de cita futura conserva fecha/precio, bloquea doble envío y conserva datos ante error', async () => {
  const op = deferred(); let closed = 0;
  const guardar = mock.fn(() => op.promise);
  await render(CitaFormModal, agendaProps({ onSubmit: guardar, onClose: () => closed++ }));
  await llenarCita();
  const form = container.querySelector('form');
  await act(async () => { form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); });
  assert.equal(guardar.mock.callCount(), 1); assert.equal(closed, 0);
  const payload = guardar.mock.calls[0].arguments[0];
  assert.equal(payload.FechaCita, '2099-11-03'); assert.equal(payload.HoraCita, '08:00'); assert.equal(payload.Precio, 250);
  assert.equal(payload.ID_Paciente, 1); assert.equal(payload.ID_Psicologo, 1);
  await act(async () => op.reject(new Error('No se pudo crear la cita. Vuelve a intentar.')));
  assert.equal(closed, 0); assert.match(container.textContent, /No se pudo crear la cita/);
  assert.equal(container.querySelector('[aria-label="Fecha de la cita"]').value, '2099-11-03');
  assert.equal(container.querySelector('[aria-label="Precio de la cita"]').value, '250.00');
});
test('cita incompleta no envía IDs NaN; se puede completar sin perder datos', async () => {
  const guardar = mock.fn(async () => true);
  await render(CitaFormModal, agendaProps({ onSubmit: guardar }));
  await input('Profesional de la cita', '1'); await input('Fecha de la cita', '2099-11-03');
  await act(async () => container.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
  assert.equal(guardar.mock.callCount(), 0); assert.match(container.textContent, /Selecciona paciente/);
  await llenarCita();
  await act(async () => container.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
  assert.equal(guardar.mock.callCount(), 1);
});
for (const tipo of ['terapeutico', 'farmacologico']) test('fechas del tratamiento ' + tipo + ': mismas medidas, errores por campo y fin opcional', async () => {
  const saved = [];
  await render(SesionModal, formulario({ onSubmit: async value => saved.push(value) }));
  await llenar(); await input('Tipo de tratamiento', tipo); await input('Frecuencia', 'Semanal');
  if (tipo === 'terapeutico') { await input('Objetivo terapéutico', 'Objetivo conservado'); await input('Tipo de terapia', '1'); }
  else { await input('Medicamento', 'Medicamento conservado'); await input('Dosis', '25 mg'); await input('Vía de administración', '1'); }
  const inicio = container.querySelector('[aria-label="Fecha de inicio del tratamiento"]');
  const fin = container.querySelector('[aria-label="Fecha de fin del tratamiento"]');
  assert.equal(inicio.className, fin.className);
  const grupo = inicio.closest('fieldset'); assert.match(grupo.querySelector('legend').textContent, /Fechas del tratamiento/);
  assert.match(inicio.parentElement.parentElement.className, /grid-cols-1.*md:grid-cols-2/);
  await input('Fecha de inicio del tratamiento', ''); await click(button('+ Agregar Indicación'));
  assert.equal(inicio.getAttribute('aria-invalid'), 'true'); assert.match(document.getElementById(inicio.getAttribute('aria-describedby')).textContent, /obligatoria/);
  await input('Fecha de inicio del tratamiento', '2026-11-01'); await input('Fecha de fin del tratamiento', '2026-10-31'); await click(button('+ Agregar Indicación'));
  assert.equal(fin.getAttribute('aria-invalid'), 'true'); assert.match(document.getElementById(fin.getAttribute('aria-describedby')).textContent, /anterior/);
  assert.equal(container.querySelector(tipo === 'terapeutico' ? '[aria-label="Objetivo terapéutico"]' : '[aria-label="Medicamento"]').value, tipo === 'terapeutico' ? 'Objetivo conservado' : 'Medicamento conservado');
  assert.equal(container.querySelector('[aria-label="Observaciones clínicas"]').value, 'Notas conservadas');
  await input('Fecha de fin del tratamiento', ''); await click(button('+ Agregar Indicación')); await click(button('Finalizar Consulta'));
  assert.equal(saved.length, 1); assert.equal(saved[0].Tratamientos[0].FechaFin, undefined);
});
test('API frontend presenta el detalle útil de un 400 de validación', async () => {
  mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ error: 'Datos inválidos', detalles: [{ campo: 'FechaCita', mensaje: 'Indica una fecha real en formato YYYY-MM-DD.' }] }), { status: 400, headers: { 'Content-Type': 'application/json' } }));
  await assert.rejects(api.citas.create({}), /Indica una fecha real/);
});
test('dashboard espera ancho medido, conserva alturas y reacciona a ocultar/mostrar sin avisos negativos', async () => {
  const observers = [];
  const anterior = globalThis.ResizeObserver;
  const anteriorWindow = window.ResizeObserver;
  class Observer {
    constructor(callback) { this.callback = callback; this.nodes = []; observers.push(this); }
    observe(node) { this.nodes.push(node); }
    unobserve() {}
    disconnect() { this.nodes = []; }
  }
  globalThis.ResizeObserver = window.ResizeObserver = Observer;
  const advertencias = [];
  const originalWarn = console.warn;
  mock.method(console, 'warn', (...args) => { advertencias.push(args.join(' ')); originalWarn(...args); });
  mock.method(api.general, 'stats', async () => ({ totalPacientes: 1, psicologosActivos: 1, citasHoy: 0, ingresosTotales: 250 }));
  mock.method(api.general, 'graficos', async () => ({ ingresos: [{ fecha: '2026-11-03', monto: 250 }], generos: [{ name: 'Femenino', value: 1, fill: '#10b981' }], edades: [] }));
  try {
    function Page() { return el(MemoryRouter, null, el(Dashboard)); }
    await render(Page);
    const containers = [...container.querySelectorAll('.recharts-responsive-container')];
    assert.equal(containers.length, 2); assert.equal(containers[0].style.height, '320px'); assert.equal(containers[1].style.height, '224px');
    assert.equal(container.querySelectorAll('svg.recharts-surface').length, 0);
    const medir = async (width) => act(async () => {
      for (const observer of observers) for (const node of observer.nodes) observer.callback([{ target: node, contentRect: { width, height: parseInt(node.style.height) || 224 } }]);
    });
    await medir(600); assert.ok(container.querySelectorAll('svg.recharts-surface').length >= 2);
    await medir(0); assert.equal(container.querySelectorAll('svg.recharts-surface').length, 0);
    await medir(320); assert.ok(container.querySelectorAll('svg.recharts-surface').length >= 2);
    assert.equal(advertencias.some(warning => /width\(|height\(/.test(warning)), false);
  } finally {
    await unmount(); globalThis.ResizeObserver = anterior; window.ResizeObserver = anteriorWindow;
  }
});
