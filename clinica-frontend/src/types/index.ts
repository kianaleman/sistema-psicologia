// ==========================================
// CATALOGOS GENERALES
// ==========================================
export interface Ocupacion {
  ID_Ocupacion: number;
  NombreDeOcupacion: string;
}

export interface EstadoCivil {
  ID_EstadoCivil: number;
  NombreEstadoCivil: string;
}

export interface Parentesco {
  ID_Parentesco: number;
  NombreDeParentesco: string;
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
// CATÁLOGOS CLÍNICOS (Faltaban estos)
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
  CodigoDeMinsa: string;
  No_Telefono: string;
  Email: string;
  ID_DireccionPsicologo?: number;
  ID_EstadoDeActividad?: number;
  EstadoDeActividad?: EstadoActividad;
}

// ==========================================
// PACIENTES Y TUTORES
// ==========================================
export interface Tutor {
  ID_Tutor: number;
  Nombre: string;
  Apellido: string;
  No_Cedula: string;
  No_Telefono?: string;
  Parentesco?: Parentesco;
  Ocupacion?: Ocupacion;
  EstadoCivil?: EstadoCivil;
  DireccionTutor?: Direccion; 
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
  ID_PacienteMenor: number;
  PartNacimiento: string;
  GradoEscolar: string;
  ID_Tutor: number;
  Tutor?: Tutor;
}

export interface Paciente {
  ID_Paciente: number;
  Nombre: string;
  Apellido: string;
  Fecha_Nac: string;
  Genero: string;
  Nacionalidad: string;
  ID_DireccionPaciente: number;
  ID_EstadoDeActividad: number;
  DireccionPaciente?: Direccion;
  EstadoDeActividad?: EstadoActividad;
  PacienteAdulto?: PacienteAdultoDetalle | null;
  PacienteMenor?: PacienteMenorDetalle | null;
}

// DTO para crear/editar paciente
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
    ocupacionId: string | number;
    estadoCivilId: string | number;
  };
  datosMenor?: {
    partNacimiento: string;
    grado: string;
    modoTutor: 'existente' | 'nuevo';
    tutorId?: string | number;
    nuevoTutor?: any;
  };
}

// ==========================================
// CITAS
// ==========================================

// Catálogos específicos de Citas (Para evitar 'any')
export interface TipoCitaCatalogo {
  ID_TipoCita: number;
  NombreDeCita: string;
}

export interface EstadoCitaCatalogo {
  ID_EstadoCita: number;
  NombreEstado: string;
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
  
  // CORRECCIÓN IMPORTANTE:
  // Prisma devuelve el objeto completo cuando usamos 'include'.
  // Necesitamos los IDs aquí para que SesionModal pueda leerlos.
  Paciente?: { 
      ID_Paciente: number; 
      Nombre: string; 
      Apellido: string; 
      PacienteAdulto?: { No_Cedula: string }; // Opcional, útil para visualización
  };
  Psicologo?: { 
      ID_Psicologo: number; 
      Nombre: string; 
      Apellido: string; 
  };
  
  TipoDeCita?: { NombreDeCita: string };
  EstadoCita?: { NombreEstado: string };
  
  NumeroSesion?: number;
  Factura?: { MontoTotal: number }[];

  DireccionCita?: {
    ID_DireccionCita: number;
    Pais: string;
    Departamento: string;
    Ciudad: string;
    Barrio: string;
    Calle: string;
  };
}

// DTO para crear Cita (Faltaba esto)
export interface CreateCitaDTO {
  fecha: string;
  hora: string;
  motivo: string;
  tipoCitaId: number;
  pacienteId: number;
  psicologoId: number;
  precio: number;
  metodoPagoId: number;
  // --- NUEVO CAMPO ---
  direccion: {
    pais?: string;
    departamento: string;
    ciudad: string;
    barrio: string;
    calle: string;
  };
}

// ==========================================
// FACTURACIÓN
// ==========================================
export interface MetodoPago {
  ID_MetodoPago: number;
  NombreMetodo: string;
}

export interface DetalleFactura {
  ID_DetalleFactura: number;
  PrecioDeCita: number;
  FechaDePago: string;
  HoraDePago: string;
  Observacion: string | null;
  MetodoPago: MetodoPago;
}

export interface Factura {
  Cod_Factura: number;
  FechaFactura: string;
  MontoTotal: number;
  ID_Cita: number;
  Cita?: Cita;
  DetalleFactura?: DetalleFactura[];
}

// ==========================================
// SESIONES (ACTUALIZADO)
// ==========================================

// ESTA ES LA INTERFAZ QUE FALTABA para el Modal de Sesiones
export interface TratamientoLocal {
  id: number; // ID temporal para la lista visual (timestamp)
  tipo: 'farmacologico' | 'terapeutico';
  frecuencia: string;
  // Farmacológico
  medicamento?: string;
  dosis?: string;
  viaAdminId?: string | number;
  // Terapéutico
  objetivo?: string;
  tipoTerapiaId?: string | number;
}

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
// ==========================================
// DASHBOARD / GENERAL
// ==========================================
export interface Stats {
  totalPacientes: number;
  psicologosActivos: number;
  citasHoy: number;
  ingresosTotales: number;
}