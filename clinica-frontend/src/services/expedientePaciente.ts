import type { ExpedienteCompleto } from '../hooks/usePacienteDetalle';
// Se usa antes de publicar una respuesta y antes de cada exportación.
export function validarExpedientePaciente(data: ExpedienteCompleto, pacienteId: number) {
    if (!data || data.paciente?.ID_Paciente !== pacienteId || !Array.isArray(data.citas) || !Array.isArray(data.sesiones)
        || (data.expediente && data.expediente.ID_Paciente !== pacienteId))
        throw new Error('El expediente recibido no corresponde al paciente activo.');
    const citas = new Map(data.citas.map(cita => [cita.ID_Cita, cita]));
    if (data.citas.some(cita => cita.ID_Paciente !== pacienteId) || data.sesiones.some(sesion => {
        const cita = citas.get(sesion.ID_Cita!);
        return sesion.ID_Paciente !== pacienteId || !cita || cita.ID_Psicologo !== sesion.ID_Psicologo
            || sesion.ID_Expediente !== data.expediente?.ID_Expediente;
    }))
        throw new Error('Las sesiones no corresponden al paciente y expediente activos.');
}
export function prepararPDFExpediente(data: ExpedienteCompleto, pacienteId: number) {
    validarExpedientePaciente(data, pacienteId);
    const citas = new Map(data.citas.map(cita => [cita.ID_Cita, cita]));
    return {
        paciente: { ...data.paciente, Expediente: data.expediente },
        sesiones: data.sesiones.map(sesion => ({ ...sesion, Expediente: data.expediente, Cita: citas.get(sesion.ID_Cita!)! })),
    };
}
export function prepararPDFReceta(data: ExpedienteCompleto, pacienteId: number, sesionId: number) {
    const documento = prepararPDFExpediente(data, pacienteId);
    const sesion = documento.sesiones.find(s => s.ID_Sesion === sesionId);
    if (!sesion)
        throw new Error('La sesión no pertenece al historial activo.');
    return { sesion, nombrePaciente: `${documento.paciente.Nombre} ${documento.paciente.Apellido}` };
}
