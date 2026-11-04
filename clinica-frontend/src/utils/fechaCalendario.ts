export const FECHA_MINIMA_SQL = '0001-01-01';
export const FECHA_MAXIMA_SQL = '9999-12-31';
export const esFechaCalendario = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  if (year < 1 || year > 9999 || month < 1 || month > 12 || day < 1) return false;
  const bisiesto = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  return day <= [31, bisiesto ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
};
export const errorFechaCalendario = (value: string, etiqueta = 'La fecha', obligatoria = true) => {
  if (!value) return obligatoria ? `${etiqueta} es obligatoria.` : '';
  return esFechaCalendario(value) ? '' : `${etiqueta} debe ser una fecha real con año de cuatro dígitos (0001 a 9999).`;
};
export const erroresFechasTratamiento = (inicio: string, fin: string) => ({
  inicio: errorFechaCalendario(inicio, 'La fecha de inicio'),
  fin: errorFechaCalendario(fin, 'La fecha de fin', false)
    || (esFechaCalendario(inicio) && fin && fin < inicio ? 'La fecha de fin no puede ser anterior a la fecha de inicio.' : ''),
});
