// ==========================================
// CATÁLOGOS GENERALES
// ==========================================
export interface Ocupacion {
  ID_Ocupacion: number;
  Nombre_DeOcupacion: string;
}

export interface EstadoCivil {
  ID_EstadoCivil: number;
  Nombre_EstadoCivil: string;
}

export interface Parentesco {
  ID_Parentesco: number;
  Nombre_De_Parentesco: string;
}

export interface Direccion {
  ID_Direccion: number;
  Pais: string;
  Barrio: string;
  Calle?: string;
  ID_Municipio: number;
}

export interface Pais {
  ID_Pais: number;
  Nombre_Pais: string;
  Nacionalidad: string;
}

// ==========================================
// CATÁLOGOS CLÍNICOS
// ==========================================
export interface ViaAdministracion {
  ID_ViaAdministracion: number;
  Nombre_De_Presentacion: string;
}

export interface TipoDeTerapia {
  ID_Tipo_Terapia: number;
  Nombre_De_Terapia: string;
}

export interface ExploracionPsicologica {
  ID_ExploracionPsicologica: number;
  Nombre_De_ExploracionPsicologica: string;
}

// ==========================================
// PSICÓLOGOS
// ==========================================
export interface Psicologo {
  ID_Psicologo: number;
  CodigoMinsa: string;
  Nombre: string;
  Apellido: string;
  No_Telefono: string;
  ID_Direccion: number;
  ID_Usuario?: number;
  ID_CodigoTelefono?: number;
  Activo: boolean;
  Direccion?: Direccion;
}

// ==========================================
// PACIENTES Y TUTORES
// ==========================================
export interface Tutor {
  ID_Tutor: number;
  No_Cedula?: string;
  Nombre: string;
  Apellido: string;
  No_Telefono: string;
  Ocupacion: number; // ID
  EstadoCivil: number; // ID
  ID_CodigoTelefono?: number;
  Ocupacion_Tutor?: Ocupacion; // Relaciones para mostrar en UI
  EstadoCivil_Tutor?: EstadoCivil;
}

export interface PacienteAdultoDetalle {
  ID_PacienteAdulto: number; // Es el mismo ID_Paciente
  No_Cedula: string;
  No_Telefono: string;
  ID_Ocupacion: number;
  ID_EstadoCivil: number;
  ID_CodigoTelefono?: number;
  Ocupacion?: Ocupacion;
  EstadoCivil?: EstadoCivil;
}

export interface PacienteMenorDetalle {
  ID_Paciente_Menor: number; // Es el mismo ID_Paciente
  PartidaDeNacimiento: string;
  Grado_Escolar?: string;
}

export interface Paciente {
  ID_Paciente: number;
  Nombre: string;
  Apellido: string;
  Fecha_Nacimiento: string;
  Genero: string;
  ID_Direccion: number;
  ID_Pais?: number;
  Activo: boolean;
  Direccion?: Direccion;
  Pais?: Pais;
  PacienteAdulto?: PacienteAdultoDetalle | null;
  Paciente_Menor?: PacienteMenorDetalle | null;
}

// DTO estricto mapeado con Zod para el PacienteFormModal
export interface CreatePacienteDTO {
  Nombre: string;
  Apellido: string;
  Fecha_Nacimiento: string; // Formato YYYY-MM-DD esperado
  Genero: string;
  ID_Direccion: number;
  ID_Pais?: number;
  Activo?: boolean;
}

// ==========================================
// CITAS
// ==========================================
export interface TipoCitaCatalogo {
  ID_TipoCita: number;
  Nombre_DeCita: string;
}

export interface MotivoCancelacion {
  ID_MotivoCancelacion: number;
  Motivo: string;
}

export interface EstadoCitaCatalogo {
  ID_EstadoCita: number;
  NombreEstado: string;
}

export interface Cita {
  ID_Cita: number;
  FechaCita: string; // DateTime
  HoraCita: string;  // DateTime
  MotivoConsulta?: string;
  NotasCancelacion?: string;
  ID_TipoCita: number;
  ID_Direccion: number;
  ID_EstadoCita: number;
  ID_Paciente: number;
  ID_Psicologo: number;
  ID_MotivoCancelacion?: number;

  // Relaciones anidadas devueltas por Prisma (include)
  Paciente?: { 
      ID_Paciente: number; 
      Nombre: string; 
      Apellido: string; 
      PacienteAdulto?: { No_Cedula: string }; 
  };
  Psicologo?: { 
      ID_Psicologo: number; 
      Nombre: string; 
      Apellido: string; 
  };
  TipoDeCita?: { Nombre_DeCita: string };
  EstadoCita?: { NombreEstado: string };
  Direccion?: Direccion;
  MotivoCancelacion?: MotivoCancelacion;
}

// DTO estricto mapeado con Zod para el CitaFormModal
export interface CreateCitaDTO {
  ID_Paciente: number;
  ID_Psicologo: number;
  ID_TipoCita: number;
  ID_Direccion: number;
  ID_EstadoCita: number;
  FechaCita: string;
  HoraCita: string;
  MotivoConsulta?: string;
}

// ==========================================
// FACTURACIÓN (RECIBOS)
// ==========================================
export interface MetodoPago {
  ID_Metodo_Pago: number;
  Nombre_Metodo: string;
}

export interface Banco {
  ID_Banco: number;
  Nombre_Banco: string;
  Activo: boolean;
}

// En la BD actual, facturas es la tabla Recibo
export interface Recibo {
  Cod_Recibo: number;
  ID_Cita?: number;
  ID_Divisa?: number;
  ID_MetodoPago?: number;
  FechaRecibo: string;
  FechaDePago?: string;
  HoraDePago?: string;
  MontoTotal?: number;
  Tasa_Cambio?: number;
  Observacion?: string;
  ID_Banco?: number;
  Numero_Referencia?: string;
  
  Cita?: Cita;
  MetodoPago?: MetodoPago;
  Banco?: Banco;
}

// ==========================================
// SESIONES CLÍNICAS
// ==========================================
// DTO para la UI de tratamientos dentro de la sesión
export interface TratamientoUI {
  idTemporal: string | number;
  tipo: 'farmaceutico' | 'terapeutico';
  frecuencia: string;
  
  // Farmacéutico
  Nombre_Medicamento?: string;
  Dosis?: string;
  ID_ViaAdministracion?: number;
  
  // Terapéutico
  Objetivo?: string;
  ID_Tipo_Terapia?: number;
}

export interface Sesion {
  ID_Sesion: number;
  ID_Cita?: number;
  HoraDeInicio?: string;
  HoraFinal?: string;
  Observaciones: string;
  DiagnosticoDiferencial: string;
  HistorialDeEvolucion: string;
  Criterios_DeDiagnostico: string;
  ID_Expediente?: number;
  
  Cita?: Cita;
  Expediente?: { No_Expediente: string };
}

// DTO estricto mapeado con Zod para registrar nueva sesión
export interface CreateSesionDTO {
  ID_Cita?: number;
  ID_Expediente?: number;
  HoraDeInicio?: string;
  HoraFinal?: string;
  Observaciones: string;
  DiagnosticoDiferencial: string;
  HistorialDeEvolucion: string;
  Criterios_DeDiagnostico: string;
}

// ==========================================
// DASHBOARD / GENERAL
// ==========================================
export interface Stats {
  totalPacientes: number;
  psicologosActivos: number;
  citasHoy: number;
  ingresosTotales: number;
}