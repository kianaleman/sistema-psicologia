export class CitaError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export const respuestaErrorCita = (error: unknown, fallback: string) => {
  if (error instanceof CitaError) return { status: error.status, message: error.message };
  const code = (error as { code?: string } | null)?.code;
  if (code === 'P2003') return { status: 400, message: 'Algún paciente, profesional o dato de catálogo seleccionado ya no está disponible. Actualiza los datos y vuelve a intentar.' };
  if (code === 'P2002' || code === 'P2034') return { status: 409, message: 'La cita cambió durante la operación. Actualiza la agenda y vuelve a intentar.' };
  return { status: 500, message: fallback };
};
