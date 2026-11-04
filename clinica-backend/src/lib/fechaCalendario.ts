import { z } from 'zod';

// Cita.FechaCita y Tratamiento.FechaInicio/Fin son SQL Server DATE.
export const esFechaCalendario = (value: unknown): value is string => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year = 0, month = 0, day = 0] = value.split('-').map(Number);
  if (year < 1 || year > 9999 || month < 1 || month > 12 || day < 1) return false;
  const bisiesto = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  return day <= [31, bisiesto ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1]!;
};

export const fechaCalendarioSchema = z.string({ message: 'Indica una fecha de calendario válida.' }).refine(esFechaCalendario, {
  message: 'Indica una fecha real en formato YYYY-MM-DD, con año entre 0001 y 9999.',
});
export const esHoraCita = (value: unknown): value is string =>
  typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
export const horaCitaSchema = z.string({ message: 'Indica una hora válida en formato HH:mm.' }).refine(esHoraCita, {
  message: 'Indica una hora válida en formato HH:mm (00:00 a 23:59).',
});
