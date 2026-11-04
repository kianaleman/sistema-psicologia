import { useEffect, useMemo, useState } from 'react';
import { esFechaCalendario } from '../utils/fechaCalendario';
type Consulta = (psicologoId: number, fecha: string) => Promise<string[]>;
type Clave = { psicologoId: number; fecha: string; revision: number };
type Resultado = { clave: Clave; horarios: string[]; error: string | null };
export function useDisponibilidadCita(psicologoId: number, fecha: string, consultar: Consulta | undefined, habilitada = true) {
  const [revision, setRevision] = useState(0);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const valida = habilitada && !!consultar && Number.isInteger(psicologoId) && psicologoId > 0
    && psicologoId <= 2147483647 && esFechaCalendario(fecha);
  const clave = useMemo(() => valida ? { psicologoId, fecha, revision } : null, [valida, psicologoId, fecha, revision]);
  useEffect(() => {
    if (!clave || !consultar) return;
    let vigente = true;
    Promise.resolve().then(() => consultar(clave.psicologoId, clave.fecha)).then(horarios => {
      if (!Array.isArray(horarios) || horarios.some(hora => typeof hora !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(hora))) {
        throw new Error('La respuesta de disponibilidad no es válida.');
      }
      if (vigente) setResultado({ clave, horarios, error: null });
    }).catch((error: unknown) => {
      if (vigente) setResultado({ clave, horarios: [], error: error instanceof Error ? error.message : 'No se pudo comprobar la disponibilidad.' });
    });
    return () => { vigente = false; };
  }, [clave, consultar]);
  const actual = resultado?.clave === clave ? resultado : null;
  return {
    estado: !clave ? 'inactiva' : !actual ? 'cargando' : actual.error ? 'error' : 'cargada',
    horarios: actual?.horarios ?? [], error: actual?.error ?? null,
    reintentar: () => setRevision(value => value + 1),
  };
}
