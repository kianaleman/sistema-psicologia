// src/types/index.ts

// --- PERSONAS ---
export interface Direccion {
  Departamento: string;
  Ciudad: string;
  Barrio: string;
  Calle: string;
}

export interface Tutor {
  ID_Tutor: number;
  Nombre: string;
  Apellido: string;
  No_Cedula: string;
  No_Telefono?: string;
  Parentesco?: { NombreDeParentesco: string };
  // Importante: Definir la estructura de PacienteMenor aquí si es necesaria
  PacienteMenor?: { Paciente: { Nombre: string, Apellido: string }, PartNacimiento: string }[]; 
}

export interface Paciente {
  ID_Paciente: number;
  Nombre: string;
  Apellido: string;
  Fecha_Nac: string;
  Genero: string;
  Nacionalidad: string;
  DireccionPaciente?: Direccion;
  PacienteAdulto?: {
    No_Cedula: string;
    No_Telefono: string;
    ID_Ocupacion: number;
    ID_EstadoCivil: number;
    Ocupacion?: { NombreDeOcupacion: string };
  };
  PacienteMenor?: {
    PartNacimiento: string;
    GradoEscolar: string;
    ID_Tutor: number;
    Tutor?: Tutor;
  };
  EstadoDeActividad?: { NombreEstadoActividad: string; ID_EstadoDeActividad: number };
}

export interface Psicologo {
  ID_Psicologo: number;
  Nombre: string;
  Apellido: string;
  CodigoDeMinsa: string;
  No_Telefono: string;
  Email: string;
  EstadoDeActividad?: { NombreEstadoActividad: string };
}

// --- CITAS ---
export interface Cita {
  ID_Cita: number;
  FechaCita: string;
  HoraCita: string;
  MotivoConsulta: string;
  ID_EstadoCita: number;
  Paciente: { ID_Paciente: number; Nombre: string; Apellido: string };
  Psicologo: { ID_Psicologo: number; Nombre: string; Apellido: string };
  TipoDeCita: { NombreDeCita: string };
  EstadoCita: { NombreEstado: string };
}

// --- SESIONES ---
export interface Sesion {
  ID_Sesion: number;
  HoraDeInicio: string;
  HoraFinal: string;
  Observaciones: string;
  DiagnosticoDiferencial: string;
  HistorialDevolucion: string;
  CriteriosDeDiagnostico: string;
  FechaReal?: string; 
  Expediente?: { No_Expediente: string };
  Psicologo?: { Nombre: string; Apellido: string };
}

// --- GENERAL ---
export interface Stats {
  totalPacientes: number;
  psicologosActivos: number;
  citasHoy: number;
  ingresosTotales: number;
}