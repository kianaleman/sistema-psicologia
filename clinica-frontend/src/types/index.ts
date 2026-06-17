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

  Municipio?: Municipio; // Relación para mostrar en UI, aunque en la BD es una tabla intermedia Paciente_Tutor
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

// Si no la tienes, agrega esta interfaz pequeña para la tabla intermedia:
export interface RelacionTutor {
  ID_Tutor: number;
  Es_Contacto_Principal?: boolean | null;
}

export interface PacienteMenorDetalle {
  ID_Paciente_Menor: number; // Es el mismo ID_Paciente
  PartidaDeNacimiento: string;
  Grado_Escolar?: string;
  ID_Tutor?: number;
  Tutor?: Tutor; // Relación para mostrar en UI, aunque en la BD es una tabla intermedia Paciente_Tutor
  Tutor_PacienteMenor?: RelacionTutor[]; // Para mostrar en UI, se construye a partir de la relación con Tutor
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
  Nacionalidad?: string; // Campo calculado para mostrar en UI, no existe en la BD
  DireccionPaciente?: DireccionPaciente; // Para mostrar en UI, no existe en la BD, se construye a partir de la relación con Direccion
}

export interface DireccionPaciente {
  ID_Direccion?: number;
  Departamento?: string;
  Ciudad?: string;
  Barrio?: string;
  Calle?: string;
}

export interface Departamento {
  ID_Departamento: number;
  Nombre_Departamento: string;
}


// Sub-interfaz para reutilizar la estructura geográfica
export interface DireccionDTO {
  municipioId: number;
  barrio: string;
  calle?: string;
}

export interface Pais {
  ID_Pais: number;
  Nombre_Pais: string;
  Nacionalidad?: string;
}

export interface Municipio {
  ID_Municipio: number;
  Nombre_Municipio: string;
  ID_Departamento?: number;

  Departamento?: Departamento; // Relación para mostrar en UI, aunque en la BD es una tabla intermedia Paciente_Tutor
}

export interface CreatePacienteDTO {
  nombre: string;
  apellido: string;
  fechaNac: string;
  genero: string;
  activo?: boolean;
  esAdulto: boolean;
  paisId: number; // Requerido por el backend
  
  // La dirección principal ahora exige el municipioId
  direccion: DireccionDTO;

  // Cambiado de PacienteAdultoDetalle a datosAdulto para coincidir con el Service
  datosAdulto?: {
    cedula: string;
    codigoTelefonoId: number; // Nuevo requerimiento
    telefono: string;
    ocupacionId: number;
    estadoCivilId: number;
  };

  // Cambiado de PacienteMenorDetalle a datosMenor para coincidir con el Service
  datosMenor?: {
    partNacimiento: string;
    grado?: string;
    modoTutor: 'existente' | 'nuevo';
    tutorId?: number;
    nuevoTutor?: {
      nombre: string;
      apellido: string;
      cedula: string;
      codigoTelefonoId: number; // Nuevo requerimiento
      telefono: string;
      ocupacionId: number;
      estadoCivilId: number;
      parentescoId: number;
      direccion?: DireccionDTO;
    };
  };
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

export interface ReciboCita {
  Cod_Recibo?: number;
  MontoTotal: number;
  Tasa_Cambio?: number | string | null;
  ID_MetodoPago: number;
  ID_Banco?: number | null;
  Numero_Referencia?: string | null;
  ID_Divisa?: number | null;
  Divisa?: Divisa | null;
}

export interface Cita {
  ID_Cita: number;
  FechaCita: string; // DateTime
  HoraCita: string;  // DateTime
  MotivoConsulta?: string;
  NumeroSesion?: number; // Para mostrar en UI, se calcula a partir de las sesiones relacionadas
  NotasCancelacion?: string;
  ID_TipoCita: number;
  ID_Direccion: number;
  ID_EstadoCita: number;
  ID_Paciente: number;
  ID_Psicologo: number;
  ID_MotivoCancelacion?: number;
  Recibo?: ReciboCita | ReciboCita[]; // Para mostrar en UI, aunque en la BD es una tabla intermedia con Cita

  // Relaciones anidadas devueltas por Prisma (include)
  Paciente?: { 
      ID_Paciente: number; 
      Nombre: string; 
      Apellido: string; 
      PacienteAdulto?: { No_Cedula: string }; 
      Paciente_Menor?: { PartidaDeNacimiento: string };
  };
  Psicologo?: { 
      ID_Psicologo: number; 
      Nombre: string; 
      Apellido: string; 
      CodigoMinsa: string;
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
  ID_EstadoCita: number;
  ID_Direccion: number; // Tomará el ID de la clínica o el del paciente
  FechaCita: string; 
  HoraCita: string;  
  MotivoConsulta?: string;

  // 👇 DATOS FINANCIEROS (NUEVOS) 👇
  Precio: number;
  ID_MetodoPago: number;
  ID_Divisa?: number;
  Tasa_Cambio?: number;
  ID_Banco?: number;
  Numero_Referencia?: string;
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

export interface Divisa {
  ID_Divisa: number;
  Codigo_ISO: string;
  Nombre: string;
}

// En la BD actual, facturas es la tabla Recibo
export interface Recibo {
  Cod_Recibo: number;
  ID_Cita?: number;
  ID_Divisa?: number | null;
  ID_MetodoPago?: number;
  FechaRecibo: string;
  FechaDePago?: string;
  HoraDePago?: string;
  MontoTotal?: number;
  Tasa_Cambio?: number | string | null;
  Observacion?: string;
  ID_Banco?: number;
  Numero_Referencia?: string;
  
  Cita?: Cita;
  MetodoPago?: MetodoPago;
  Banco?: Banco;
  Divisa?: Divisa | null;
}

// ==========================================
// SESIONES CLÍNICAS
// ==========================================
// DTO para la UI de tratamientos dentro de la sesión
// Sub-interfaz para ordenar el Tratamiento
export interface TratamientoDTO {
  id: number; // ID local para manejar la UI, no se envía al backend
  Frecuencia: string;
  Tipo: 'farmaceutico' | 'terapeutico';
  FechaInicio: string;
  FechaFin?: string;
  // Puede incluir medicina
  Farmaceutico?: {
    ID_ViaAdministracion: number;
    Nombre_Medicamento: string;
    Dosis: string;
  };
  // Puede incluir terapia
  Terapeutico?: {
    ID_Tipo_Terapia: number;
    Objetivo: string;
  };
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
  ID_Cita: number;
  ID_Expediente: number;
  HoraDeInicio: string;
  HoraFinal: string;
  Observaciones: string;
  DiagnosticoDiferencial: string;
  HistorialDeEvolucion: string;
  Criterios_DeDiagnostico: string;
  
  // Arreglo de IDs de las exploraciones seleccionadas (checkboxes)
  ExploracionesIds?: number[]; 
  
  // Objeto anidado para recetar en la misma transacción
  Tratamiento?: TratamientoDTO; 
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

// ==========================================
// TESTS PSICOLÓGICOS
// ==========================================
export type TestContexto = 'FUERA_SESION' | 'EN_SESION';
export type TestEstadoAplicacion = 'PENDIENTE' | 'COMPLETADO' | 'VENCIDO' | 'ANULADO';

export interface TestOpcion {
  ID_Opcion: number;
  ID_Pregunta: number;
  Texto: string;
  Valor: number;
  Orden: number;
}

export interface TestPregunta {
  ID_Pregunta: number;
  ID_Test: number;
  Texto: string;
  Orden: number;
  Activa: boolean;
  EsCritica: boolean;
  ValorCriticoMinimo?: number | null;
  Opciones: TestOpcion[];
}

export interface TestRangoResultado {
  ID_Rango: number;
  ID_Test: number;
  PuntajeMin: number;
  PuntajeMax: number;
  Nivel: string;
  Descripcion?: string | null;
}

export interface TestPsicologico {
  ID_Test: number;
  Nombre: string;
  Codigo: string;
  Categoria: string;
  Descripcion?: string | null;
  Instrucciones?: string | null;
  Activo: boolean;
  Version: number;
  FechaCreacion?: string;
  FechaActualizacion?: string;
  Preguntas?: TestPregunta[];
  Rangos?: TestRangoResultado[];
  _count?: {
    Preguntas?: number;
    Aplicaciones?: number;
  };
}

export interface TestAplicacionResumen {
  ID_Aplicacion: number;
  Contexto: TestContexto;
  Estado: TestEstadoAplicacion;
  ExpiraEn: string;
  CompletadoEn?: string | null;
  PuntajeTotal?: number | null;
  Nivel?: string | null;
  Interpretacion?: string | null;
  TieneAlertaCritica: boolean;
  ObservacionPsicologo?: string | null;
  FechaCreacion: string;
  Test: Pick<TestPsicologico, 'ID_Test' | 'Nombre' | 'Codigo' | 'Categoria'>;
  Paciente?: Pick<Paciente, 'ID_Paciente' | 'Nombre' | 'Apellido'>;
  Psicologo?: Pick<Psicologo, 'ID_Psicologo' | 'Nombre' | 'Apellido'> | null;
  Sesion?: Pick<Sesion, 'ID_Sesion' | 'ID_Cita'> | null;
  Respuestas?: TestRespuestaDetalle[];
}

export interface TestRespuestaDetalle {
  ID_Respuesta: number;
  Valor: number;
  TextoLibre?: string | null;
  Pregunta: Pick<TestPregunta, 'ID_Pregunta' | 'Texto' | 'Orden' | 'EsCritica' | 'ValorCriticoMinimo'>;
  Opcion?: Pick<TestOpcion, 'ID_Opcion' | 'Texto' | 'Valor'> | null;
}

export interface CrearAplicacionTestDTO {
  ID_Test: number;
  ID_Paciente: number;
  ID_Sesion?: number | null;
  Contexto: TestContexto;
  ExpiraHoras?: number;
  ObservacionPsicologo?: string | null;
}

export interface CrearAplicacionTestResponse {
  aplicacion: TestAplicacionResumen;
  token: string;
  urlPublica: string;
}

export interface TestPublicoResponse {
  ID_Aplicacion: number;
  Contexto: TestContexto;
  ExpiraEn: string;
  Test: TestPsicologico & {
    Preguntas: TestPregunta[];
    Rangos: TestRangoResultado[];
  };
  aviso: string;
}

export interface RespuestaTestPublicoDTO {
  ID_Pregunta: number;
  ID_Opcion?: number | null;
  Valor?: number | null;
  TextoLibre?: string | null;
}

export interface ResponderTestPublicoResponse {
  ID_Aplicacion: number;
  Estado: TestEstadoAplicacion;
  PuntajeTotal?: number | null;
  Nivel?: string | null;
  TieneAlertaCritica: boolean;
  CompletadoEn?: string | null;
  mensaje: string;
}
