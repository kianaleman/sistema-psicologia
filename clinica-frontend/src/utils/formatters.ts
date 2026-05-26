// src/utils/formatters.ts

/**
 * Formatea una fecha o string a la hora local (Ej: 02:30 PM)
 */
export const formatearHora = (fecha: string | Date): string => {
  return new Date(fecha).toLocaleTimeString('es-NI', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Formatea una fecha al estándar local (Ej: 25 de mayo de 2026)
 */
export const formatearFecha = (fecha: string | Date): string => {
  return new Date(fecha).toLocaleDateString('es-NI', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};