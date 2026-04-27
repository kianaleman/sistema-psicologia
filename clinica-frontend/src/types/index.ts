// ==========================================
// CATALOGOS GENERALES
// ==========================================
export interface Ocupacion {
  ID_Ocupacion: number;
  Nombre_DeOcupacion: string; // Reflejando Snake_Case del nuevo Backend
}

// En src/types/index.ts
export interface Especialidad { 
  ID_Especialidad: number; 
  NombreEspecialidad: string; 
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
  ID_Direccion?: number;
  Pais?: string;
  Departamento: string;
  Ciudad: string;
  Barrio: string;
  Calle: string;
}

export interface EstadoActividad {
  ID_EstadoDeActividad: number;
  NombreEstadoActividad: string;
}

// ==========================================
// CATÁLOGOS CLÍNICOS
// ==========================================
export interface ViaAdministracion {
  ID_ViaAdministracion: number;
  NombreDePresentacion: string;
}

export interface TipoDeTerapia {
  ID_TipoTerapia: number;
  NombreDeTerapia: string;
}

export interface Exploracion {
  ID_ExploracionPsicologica: number;
  NombreDeExploracionPsicologica: string;
}

// ==========================================
// PSICÓLOGOS
// ==========================================
export interface Psicologo {
  ID_Psicologo: number;
  Nombre: string;
  Apellido: string;
  CodigoMinsa: string; // Sincronizado: CódigoMinsa
  No_Telefono: string;
  Email?: string;
  ID_Direccion?: number;
  ID_EstadoDeActividad?: number;
  Activo: boolean; 
  Direccion?: Direccion;
}

// ==========================================
// PACIENTES Y TUTORES (Actualizado N:M)
// ==========================================
export interface Tutor {
  ID_Tutor: number;
  Nombre: string;
  Apellido: string;
  No_Cedula: string;
  No_Telefono?: string;
  Ocupacion_Tutor?: Ocupacion;
  EstadoCivil_Tutor?: EstadoCivil;
}

export interface TutorRelacion {
  ID_Tutor: number;
  ID_Paciente_Menor: number;
  ID_Parentesco: number;
  Es_Contacto_Principal: boolean;
  Tutor: Tutor;
  Parentesco: Parentesco;
}

export interface PacienteAdultoDetalle {
  ID_PacienteAdulto: number;
  No_Cedula: string;
  No_Telefono: string;
  ID_Ocupacion: number;
  ID_EstadoCivil: number;
  Ocupacion?: Ocupacion;
  EstadoCivil?: EstadoCivil;
}

export interface PacienteMenorDetalle {
  ID_Paciente_Menor: number;
  PartidaDeNacimiento: string; // Sincronizado
  Grado_Escolar: string;
  Tutor_PacienteMenor?: TutorRelacion[]; // Relación N:M actualizada
}

export interface Paciente {
  ID_Paciente: number;
  Nombre: string;
  Apellido: string;
  Fecha_Nacimiento: string; // Sincronizado
  Genero: string;
  Nacionalidad: string;
  ID_Direccion: number;
  Activo: boolean;
  Direccion?: Direccion;
  PacienteAdulto?: PacienteAdultoDetalle | null;
  Paciente_Menor?: PacienteMenorDetalle | null; // Sincronizado: Paciente_Menor

  // 🟢 AGREGADO: Relación con Expediente para solucionar Error 2339
  Expediente?: {
    ID_Expediente: number;
    No_Expediente: string;
    FechaIngreso?: string;
    Observaciones_Generales?: string;
  } | null;
}

export interface CreatePacienteDTO {
  nombre: string;
  apellido: string;
  fechaNac: string;
  genero: string;
  nacionalidad: string;
  direccion: {
    pais?: string;
    departamento: string;
    ciudad: string;
    barrio: string;
    calle: string;
  };
  esAdulto: boolean;
  datosAdulto?: {
    cedula: string;
    telefono: string;
    ocupacionId: number;
    estadoCivilId: number;
  };
  datosMenor?: {
    partNacimiento: string;
    grado: string;
    modoTutor: 'existente' | 'nuevo';
    tutorId?: number;
    parentescoId: number;
    nuevoTutor?: any;
  };
}

// ==========================================
// CITAS Y RECIBOS (REEMPLAZA FACTURACIÓN)
// ==========================================

// --- AGREGAR ESTA INTERFAZ QUE FALTABA ---
export interface MotivoCancelacion {
  ID_MotivoCancelacion: number;
  Motivo: string;
}

export interface Divisa {
  ID_Divisa: number;
  Codigo_ISO: string; 
  Nombre: string;
}

export interface MetodoPago {
  ID_MetodoPago: number;
  Nombre_Metodo: string;
}

export interface Stats {
  totalPacientes: number;
  psicologosActivos: number;
  citasHoy: number;
  ingresosTotalesNIO: number;
  ingresosTotalesUSD: number;
}

export interface Recibo {
  Cod_Recibo: number;
  ID_Cita: number;
  ID_Divisa: number;
  ID_MetodoPago: number;
  MontoTotal: number;
  Tasa_Cambio: number;
  FechaRecibo: string;
  Observacion?: string;
  MetodoPago?: MetodoPago;
  Divisa?: Divisa;
  // --- AGREGAR ESTO ---
  Cita?: Cita; 
}

export interface Cita {
  ID_Cita: number;
  FechaCita: string;
  HoraCita: string;
  MotivoConsulta: string;
  ID_EstadoCita: number;
  ID_Paciente: number;
  ID_Psicologo: number;
  ID_TipoCita: number;
  ID_Direccion: number;
  ID_MotivoCancelacion?: number;
  NotasCancelacion?: string;

  Paciente?: Paciente;
  Psicologo?: Psicologo;
  Recibo?: Recibo; 
  Direccion?: Direccion;
  EstadoCita?: { NombreEstado: string };
  TipoDeCita?: { Nombre_DeCita: string };
  // Aquí usamos la interfaz que acabamos de exportar arriba
  MotivoCancelacion?: MotivoCancelacion; 
  
  NumeroSesion?: number | null;
}

// --- ESTA ES LA INTERFAZ QUE FALTABA EXPORTAR ---
export interface CreateCitaDTO {
  fecha: string;
  hora: string;
  motivo: string;
  tipoCitaId: number;
  pacienteId: number;
  psicologoId: number;
  precio: number;
  metodoPagoId: number;
  idDivisa: number;
  tasaCambio: number;
  idDireccion: number;
}

// ==========================================
// SESIONES
// ==========================================
export interface Sesion {
  ID_Sesion: number;
  ID_Cita: number;
  ID_Expediente: number;
  HoraDeInicio: string;
  HoraFinal: string;
  Observaciones: string;
  DiagnosticoDiferencial: string;
  HistorialDeEvolucion: string; // Sincronizado
  Criterios_DeDiagnostico: string; // Sincronizado
  Cita?: Cita;
  Expediente?: { 
    No_Expediente: string;
    ID_Expediente: number;
  };
}

export interface TratamientoLocal {
  id: number;
  tipo: 'farmacologico' | 'terapeutico';
  frecuencia: string;
  medicamento?: string;
  dosis?: string;
  viaAdminId?: number;
  objetivo?: string;
  tipoTerapiaId?: number;
}

// ==========================================
// DASHBOARD / GENERAL
// ==========================================
export interface Stats {
  totalPacientes: number;
  psicologosActivos: number;
  citasHoy: number;
  ingresosTotalesNIO: number;
  ingresosTotalesUSD: number;
}