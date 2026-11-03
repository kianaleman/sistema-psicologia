import type { Prisma } from '@prisma/client';
import type { AuthUserPayload } from '../middlewares/auth.middleware.js';
import { ROLES } from '../security/roles.js';

export const puedeVerClinicaCita = (usuario: AuthUserPayload | undefined, idPsicologo: number) =>
  Boolean(usuario && (usuario.roles.includes(ROLES.ADMINISTRADOR)
    || (usuario.roles.includes(ROLES.PSICOLOGO) && usuario.idPsicologo === idPsicologo)));

export const citaResumenSelect = {
  ID_Cita: true,
  FechaCita: true,
  HoraCita: true,
  NotasCancelacion: true,
  ID_TipoCita: true,
  ID_Direccion: true,
  ID_EstadoCita: true,
  ID_Paciente: true,
  ID_Psicologo: true,
  ID_MotivoCancelacion: true,
} satisfies Prisma.CitaSelect;

// Lista positiva: ninguna relación puede incorporar por accidente un expediente,
// tratamientos, cuentas de usuario o texto clínico al resumen administrativo.
export const citaAgendaSelect = {
  ...citaResumenSelect,
  Paciente: { select: { ID_Paciente: true, Nombre: true, Apellido: true } },
  Psicologo: { select: { ID_Psicologo: true, Nombre: true, Apellido: true, CodigoMinsa: true } },
  TipoDeCita: { select: { ID_TipoCita: true, Nombre_DeCita: true } },
  EstadoCita: { select: { ID_EstadoCita: true, NombreEstado: true } },
  MotivoCancelacion: { select: { ID_MotivoCancelacion: true, Motivo: true } },
  Sesion: { select: { ID_Sesion: true } },
  Recibo: { select: {
    Cod_Recibo: true, ID_Cita: true, ID_Divisa: true, ID_MetodoPago: true,
    FechaRecibo: true, FechaDePago: true, HoraDePago: true, MontoTotal: true,
    Tasa_Cambio: true, ID_Banco: true, Numero_Referencia: true,
    MetodoPago: { select: { ID_Metodo_Pago: true, Nombre_Metodo: true } },
    Divisa: { select: { ID_Divisa: true, Codigo_ISO: true, Nombre: true } },
    Banco: { select: { ID_Banco: true, Nombre_Banco: true } },
  } },
  Direccion: { select: {
    ID_Direccion: true, Pais: true, Barrio: true, Calle: true, ID_Municipio: true,
    Municipio: { select: {
      ID_Municipio: true, Nombre_Municipio: true, ID_Departamento: true,
      Departamento: { select: { ID_Departamento: true, Nombre_Departamento: true } },
    } },
  } },
} satisfies Prisma.CitaSelect;

export const citaClinicaSelect = {
  ID_Cita: true,
  ID_Psicologo: true,
  MotivoConsulta: true,
  Sesion: { select: {
    ID_Sesion: true, ID_Cita: true, ID_Expediente: true,
    HoraDeInicio: true, HoraFinal: true, Observaciones: true,
    DiagnosticoDiferencial: true, HistorialDeEvolucion: true, Criterios_DeDiagnostico: true,
  } },
} satisfies Prisma.CitaSelect;
