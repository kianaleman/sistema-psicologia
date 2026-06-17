import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useTestsPsicologicos } from '../../hooks/useTestsPsicologicos';
import type { CrearAplicacionTestResponse, TestAplicacionResumen, TestContexto } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  idPaciente: number;
  idSesion?: number | null;
  contexto: TestContexto;
  onCreado?: (result: CrearAplicacionTestResponse) => void;
}

export default function TestAplicarModal({
  isOpen,
  onClose,
  idPaciente,
  idSesion = null,
  contexto,
  onCreado,
}: Props) {
  const { tests, loadingTests, saving, cargarTests, crearAplicacion } = useTestsPsicologicos({ autoLoad: false });
  const [idTest, setIdTest] = useState('');
  const [expiraHoras, setExpiraHoras] = useState('24');
  const [observacion, setObservacion] = useState('');
  const [resultado, setResultado] = useState<CrearAplicacionTestResponse | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    setResultado(null);
    setIdTest('');
    setExpiraHoras('24');
    setObservacion('');
    void cargarTests();
  }, [isOpen, cargarTests]);

  const testsActivos = useMemo(() => tests.filter((test) => test.Activo), [tests]);
  const testSeleccionado = testsActivos.find((test) => test.ID_Test === Number(idTest));

  if (!isOpen) return null;

  const abrirEnNuevaPestana = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const copiarLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Enlace copiado al portapapeles.');
    } catch {
      toast.error('No se pudo copiar el enlace.');
    }
  };

  const handleSubmit = async () => {
    const idTestNumber = Number(idTest);
    const expiraHorasNumber = Number(expiraHoras);

    if (!idTestNumber) {
      toast.error('Selecciona un test psicológico.');
      return;
    }

    if (!Number.isInteger(expiraHorasNumber) || expiraHorasNumber < 1 || expiraHorasNumber > 168) {
      toast.error('La expiración debe estar entre 1 y 168 horas.');
      return;
    }

    const result = await crearAplicacion({
      ID_Test: idTestNumber,
      ID_Paciente: idPaciente,
      ID_Sesion: contexto === 'EN_SESION' ? idSesion : null,
      Contexto: contexto,
      ExpiraHoras: expiraHorasNumber,
      ObservacionPsicologo: observacion.trim() || null,
    });

    if (!result) return;

    setResultado(result);
    onCreado?.(result);
    abrirEnNuevaPestana(result.urlPublica);
  };

  const aplicacion: TestAplicacionResumen | null = resultado?.aplicacion || null;

  return (
    <dialog className="modal modal-open bg-black/50 backdrop-blur-sm">
      <div className="modal-box w-11/12 max-w-2xl rounded-[2rem] bg-white p-0 text-slate-800 shadow-2xl">
        <div className="border-b border-slate-100 px-6 py-5">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-600">Tests psicológicos</p>
          <h3 className="mt-1 text-2xl font-black text-slate-950">Aplicar test al paciente</h3>
          <p className="mt-2 text-sm text-slate-500">
            Se generará un enlace público de un solo uso para que el paciente responda únicamente el test seleccionado.
          </p>
        </div>

        <div className="space-y-5 p-6">
          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-900">
            Resultado orientativo. No constituye diagnóstico automático. Debe ser interpretado por el psicólogo tratante.
          </div>

          {resultado ? (
            <div className="space-y-4 rounded-[1.5rem] border border-emerald-100 bg-emerald-50 p-5">
              <div>
                <p className="text-sm font-black text-emerald-900">Enlace generado correctamente</p>
                <p className="mt-1 text-xs text-emerald-700">
                  Estado: {aplicacion?.Estado || 'PENDIENTE'} · Expira: {aplicacion?.ExpiraEn ? new Date(aplicacion.ExpiraEn).toLocaleString('es-NI') : 'N/A'}
                </p>
              </div>

              <div className="break-all rounded-2xl border border-emerald-100 bg-white p-3 font-mono text-xs text-slate-700">
                {resultado.urlPublica}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <button type="button" className="btn btn-sm bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => abrirEnNuevaPestana(resultado.urlPublica)}>
                  Abrir test
                </button>
                <button type="button" className="btn btn-sm border-slate-200 bg-white text-slate-700" onClick={() => copiarLink(resultado.urlPublica)}>
                  Copiar enlace
                </button>
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="label text-xs font-bold uppercase tracking-wide text-slate-500">Test psicológico</label>
                <select
                  className="select select-bordered w-full bg-white"
                  value={idTest}
                  onChange={(event) => setIdTest(event.target.value)}
                  disabled={loadingTests || saving}
                >
                  <option value="">Seleccionar test...</option>
                  {testsActivos.map((test) => (
                    <option key={test.ID_Test} value={test.ID_Test}>
                      {test.Nombre} · {test.Categoria}
                    </option>
                  ))}
                </select>
                {loadingTests && <p className="mt-2 text-xs text-slate-400">Cargando tests disponibles...</p>}
                {!loadingTests && testsActivos.length === 0 && (
                  <p className="mt-2 text-xs text-rose-500">No hay tests activos configurados.</p>
                )}
              </div>

              {testSeleccionado && (
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-sm font-black text-slate-800">{testSeleccionado.Nombre}</p>
                  <p className="mt-1 text-xs text-slate-500">{testSeleccionado.Descripcion || 'Sin descripción registrada.'}</p>
                  <p className="mt-2 text-xs font-bold text-slate-400">
                    Preguntas: {testSeleccionado._count?.Preguntas || testSeleccionado.Preguntas?.length || 0}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="label text-xs font-bold uppercase tracking-wide text-slate-500">Vigencia del enlace</label>
                  <input
                    type="number"
                    min={1}
                    max={168}
                    className="input input-bordered w-full bg-white"
                    value={expiraHoras}
                    onChange={(event) => setExpiraHoras(event.target.value)}
                    disabled={saving}
                  />
                  <p className="mt-1 text-[11px] text-slate-400">Entre 1 y 168 horas.</p>
                </div>

                <div>
                  <label className="label text-xs font-bold uppercase tracking-wide text-slate-500">Contexto</label>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">
                    {contexto === 'EN_SESION' ? 'Dentro de sesión' : 'Fuera de sesión'}
                  </div>
                </div>
              </div>

              <div>
                <label className="label text-xs font-bold uppercase tracking-wide text-slate-500">Observación interna</label>
                <textarea
                  className="textarea textarea-bordered min-h-[90px] w-full bg-white"
                  placeholder="Motivo de aplicación o nota para revisión clínica."
                  value={observacion}
                  onChange={(event) => setObservacion(event.target.value)}
                  disabled={saving}
                />
              </div>
            </>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
          <button type="button" className="btn border-slate-200 bg-white text-slate-700" onClick={onClose} disabled={saving}>
            Cerrar
          </button>
          {!resultado && (
            <button type="button" className="btn bg-slate-950 text-white hover:bg-slate-800" onClick={handleSubmit} disabled={saving || loadingTests}>
              {saving ? <span className="loading loading-spinner loading-sm" /> : 'Generar y abrir test'}
            </button>
          )}
        </div>
      </div>
    </dialog>
  );
}
