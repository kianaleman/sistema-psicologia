import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const COLORS = {
  primary: [37, 99, 235],
  secondary: [100, 116, 139],
  header: [30, 41, 59],
  accent: [16, 185, 129],
  light: [241, 245, 249],
  text: [0, 0, 0],
} as const;

type RGBColor = [number, number, number];

type JsPDFWithAutoTable = jsPDF & {
  lastAutoTable?: {
    finalY: number;
  };
};

interface ViaAdministracionPDF {
  NombreDePresentacion?: string;
  Nombre_De_Presentacion?: string;
}

interface TipoDeTerapiaPDF {
  NombreDeTerapia?: string;
  Nombre_De_Terapia?: string;
}

interface TratamientoFarmaceuticoPDF {
  NombreMedicamento?: string;
  Nombre_Medicamento?: string;
  Dosis?: string;
  ViaAdministracion?: ViaAdministracionPDF | null;
}

interface TratamientoTerapeuticoPDF {
  Objetivo?: string;
  TipoDeTerapia?: TipoDeTerapiaPDF | null;
  TipoDe_Terapia?: TipoDeTerapiaPDF | null;
}

interface TratamientoPDF {
  Frecuencia?: string;
  TratamientoFarmaceutico?: TratamientoFarmaceuticoPDF | null;
  Tratamiento_Farmaceutico?: TratamientoFarmaceuticoPDF | null;
  TratamientoTerapeutico?: TratamientoTerapeuticoPDF | null;
  Tratamiento_Terapeutico?: TratamientoTerapeuticoPDF | null;
}

interface PsicologoPDF {
  Nombre?: string;
  Apellido?: string;
  CodigoMinsa?: string;
}

interface TipoDeCitaPDF {
  NombreDeCita?: string;
  Nombre_DeCita?: string;
}

interface CitaSesionPDF {
  FechaCita?: string;
  Psicologo?: PsicologoPDF | null;
  TipoDeCita?: TipoDeCitaPDF | null;
  MotivoConsulta?: string | null;
}

interface SesionPDF {
  ID_Sesion?: number;
  Cita?: CitaSesionPDF | null;
  FechaReal?: string;
  Fecha_Sesion?: string;
  HoraDeInicio?: string;
  DiagnosticoDiferencial?: string;
  Observaciones?: string;
  HistorialDeEvolucion?: string;
  Criterios_DeDiagnostico?: string;
  Tratamiento?: TratamientoPDF[];
}

interface PacienteAdultoPDF {
  No_Cedula?: string;
  No_Telefono?: string;
  Ocupacion?: {
    Nombre_DeOcupacion?: string;
  } | null;
  EstadoCivil?: {
    Nombre_EstadoCivil?: string;
  } | null;
}

interface TutorPDF {
  Nombre?: string;
  Apellido?: string;
  No_Cedula?: string | null;
}

interface TutorPacienteMenorPDF {
  ID_Tutor?: number;
  ID_Paciente_Menor?: number;
  ID_Parentesco?: number;
  Es_Contacto_Principal?: boolean | null;
  Tutor?: TutorPDF | null;
}

interface PacienteMenorPDF {
  PartNacimiento?: string;
  PartidaDeNacimiento?: string;
  Tutor?: TutorPDF | null;
  Tutor_PacienteMenor?: TutorPacienteMenorPDF[];
}

interface DireccionPDF {
  Ciudad?: string;
  Barrio?: string;
  Calle?: string | null;
  Municipio?: {
    Nombre_Municipio?: string;
    Departamento?: {
      Nombre_Departamento?: string;
    };
  };
}

interface ExpedientePacientePDF {
  No_Expediente?: string;
}

interface PacientePDF {
  Nombre?: string;
  Apellido?: string;
  Fecha_Nacimiento?: string;
  Genero?: string;
  PacienteAdulto?: PacienteAdultoPDF | null;
  Paciente_Menor?: PacienteMenorPDF | null;
  PacienteMenor?: PacienteMenorPDF | null;
  Direccion?: DireccionPDF | null;
  Expediente?: ExpedientePacientePDF | null;
}

interface MetodoPagoPDF {
  NombreMetodo?: string;
  Nombre_Metodo?: string;
}

interface BancoPDF {
  Nombre_Banco?: string;
}

interface DivisaPDF {
  ID_Divisa?: number;
  Codigo_ISO?: string;
  Nombre?: string;
}

interface CitaReciboPDF {
  Paciente?: PacientePDF | null;
  Psicologo?: PsicologoPDF | null;
  TipoDeCita?: TipoDeCitaPDF | null;
  MotivoConsulta?: string | null;
}

export interface ReciboPDF {
  Cod_Recibo?: number | string;
  Cod_Factura?: number | string;
  FechaRecibo?: string | null;
  FechaDePago?: string | null;
  FechaFactura?: string | null;
  HoraDePago?: string | null;
  MontoTotal?: number | string | null;
  Tasa_Cambio?: number | string | null;
  ID_Divisa?: number | null;
  Numero_Referencia?: string | null;
  MetodoPago?: MetodoPagoPDF | null;
  Banco?: BancoPDF | null;
  Divisa?: DivisaPDF | null;
  Cita?: CitaReciboPDF | null;
}

const getLastAutoTableY = (doc: JsPDFWithAutoTable, fallback: number) => {
  return doc.lastAutoTable?.finalY ?? fallback;
};

const getNumeroRecibo = (recibo: ReciboPDF) => {
  return String(recibo.Cod_Recibo ?? recibo.Cod_Factura ?? 0);
};

const getFechaRecibo = (recibo: ReciboPDF) => {
  return recibo.FechaDePago || recibo.FechaRecibo || recibo.FechaFactura || new Date().toISOString();
};

const getFechaSesion = (sesion: SesionPDF) => {
  return sesion.Cita?.FechaCita || sesion.FechaReal || sesion.Fecha_Sesion || sesion.HoraDeInicio || new Date().toISOString();
};

const getNombrePaciente = (paciente?: PacientePDF | null) => {
  return `${paciente?.Nombre || ''} ${paciente?.Apellido || ''}`.trim() || 'No especificado';
};

const getNombrePacienteRecibo = (recibo: ReciboPDF) => {
  return getNombrePaciente(recibo.Cita?.Paciente);
};

const getNombrePsicologo = (psicologo?: PsicologoPDF | null) => {
  const nombre = `${psicologo?.Nombre || ''} ${psicologo?.Apellido || ''}`.trim();

  return nombre || 'Especialista';
};

const getTipoCita = (tipo?: TipoDeCitaPDF | null) => {
  return tipo?.Nombre_DeCita || tipo?.NombreDeCita || 'Consulta General';
};

const getMetodoPago = (recibo: ReciboPDF) => {
  return recibo.MetodoPago?.Nombre_Metodo || recibo.MetodoPago?.NombreMetodo || 'Efectivo';
};

const getPacienteMenor = (paciente?: PacientePDF | null) => {
  return paciente?.Paciente_Menor || paciente?.PacienteMenor || null;
};

const getPartidaNacimiento = (pacienteMenor?: PacienteMenorPDF | null) => {
  return pacienteMenor?.PartidaDeNacimiento || pacienteMenor?.PartNacimiento || 'N/A';
};

const getTutorMenor = (pacienteMenor?: PacienteMenorPDF | null) => {
  return pacienteMenor?.Tutor || pacienteMenor?.Tutor_PacienteMenor?.[0]?.Tutor || null;
};

const getDivisaCodigo = (recibo: ReciboPDF) => {
  return recibo.Divisa?.Codigo_ISO || (recibo.ID_Divisa === 2 ? 'USD' : 'NIO');
};

const getDivisaSymbol = (recibo: ReciboPDF) => {
  return getDivisaCodigo(recibo) === 'USD' ? '$' : 'C$';
};

const formatearMonto = (monto?: number | string | null, simbolo = 'C$') => {
  return `${simbolo} ${Number(monto || 0).toFixed(2)}`;
};

const formatearFecha = (fecha?: string | null, opciones?: Intl.DateTimeFormatOptions) => {
  if (!fecha) return 'N/A';

  const fechaObj = new Date(fecha);

  if (Number.isNaN(fechaObj.getTime())) return 'N/A';

  return fechaObj.toLocaleDateString('es-ES', opciones);
};

const getTratamientoFarmaceutico = (tratamiento: TratamientoPDF) => {
  return tratamiento.Tratamiento_Farmaceutico || tratamiento.TratamientoFarmaceutico || null;
};

const getTratamientoTerapeutico = (tratamiento: TratamientoPDF) => {
  return tratamiento.Tratamiento_Terapeutico || tratamiento.TratamientoTerapeutico || null;
};

// ==========================================
// 1. RECETA MÉDICA - FORMATO A5
// ==========================================
export const generarPDFReceta = (sesion: SesionPDF, pacienteNombre: string) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5',
  }) as JsPDFWithAutoTable;

  const width = doc.internal.pageSize.width;
  const height = doc.internal.pageSize.height;

  doc.setFillColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.rect(0, 0, 10, height, 'F');

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.header[0], COLORS.header[1], COLORS.header[2]);
  doc.text('Clínica Psicológica Resiliencia', 15, 15);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.secondary[0], COLORS.secondary[1], COLORS.secondary[2]);
  doc.text('Dirección: Managua, Nicaragua | Sistema Resiliencia', 15, 20);

  doc.setFontSize(14);
  doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.setFont('helvetica', 'bold');
  doc.text('RECETA MÉDICA', width - 15, 15, { align: 'right' });

  doc.setDrawColor(200);
  doc.line(15, 25, width - 15, 25);

  let yPos = 35;

  doc.setFontSize(9);
  doc.setTextColor(COLORS.secondary[0], COLORS.secondary[1], COLORS.secondary[2]);
  doc.text('PACIENTE:', 15, yPos);
  doc.text('FECHA:', width - 50, yPos);

  yPos += 5;

  doc.setFontSize(11);
  doc.setTextColor(0);
  doc.setFont('helvetica', 'bold');
  doc.text(pacienteNombre.toUpperCase(), 15, yPos);

  const fechaStr = formatearFecha(getFechaSesion(sesion), {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  doc.text(fechaStr, width - 50, yPos);

  yPos += 15;

  const cuerpoTratamiento = sesion.Tratamiento?.map((tratamiento) => {
    const farmaco = getTratamientoFarmaceutico(tratamiento);
    const terapia = getTratamientoTerapeutico(tratamiento);
    const esFarmaco = Boolean(farmaco);

    const nombre = esFarmaco
      ? farmaco?.Nombre_Medicamento || farmaco?.NombreMedicamento || 'Medicamento'
      : terapia?.TipoDe_Terapia?.Nombre_De_Terapia ||
        terapia?.TipoDeTerapia?.NombreDeTerapia ||
        'Terapia';

    const detalle = esFarmaco
      ? `Dosis: ${farmaco?.Dosis || 'N/A'}`
      : `Objetivo: ${terapia?.Objetivo || 'Mejora clínica'}`;

    return [nombre, detalle, tratamiento.Frecuencia || 'N/A'];
  }) || [['-', 'No se registraron indicaciones', '-']];

  autoTable(doc, {
    startY: yPos,
    margin: { left: 15, right: 15 },
    head: [['Indicación', 'Detalle / Dosis', 'Frecuencia']],
    body: cuerpoTratamiento,
    theme: 'striped',
    headStyles: {
      fillColor: COLORS.header as RGBColor,
      fontSize: 8,
      halign: 'left',
    },
    styles: { fontSize: 8, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 40 },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 30, halign: 'center' },
    },
  });

  const pageHeight = doc.internal.pageSize.height;
  const firmaX = width - 65;

  doc.setDrawColor(150);
  doc.line(firmaX, pageHeight - 30, width - 15, pageHeight - 30);
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text('Firma del Especialista', width - 40, pageHeight - 25, { align: 'center' });
  doc.setFontSize(7);
  doc.text(`Dr. ${sesion.Cita?.Psicologo?.Apellido || 'Especialista'}`, width - 40, pageHeight - 21, { align: 'center' });
  doc.text(`Cod: ${sesion.Cita?.Psicologo?.CodigoMinsa || 'S/E'}`, width - 40, pageHeight - 17, { align: 'center' });

  doc.save(`Receta_${pacienteNombre.replace(/\s+/g, '_')}.pdf`);
};

// ==========================================
// 2. RECIBO INDIVIDUAL - FORMATO TICKET
// ==========================================
export const generarPDFRecibo = (recibo: ReciboPDF) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, 160],
  }) as JsPDFWithAutoTable;

  const divisaSymbol = getDivisaSymbol(recibo);
  const width = 80;
  let yPos = 10;

  doc.setFontSize(12);
  doc.setTextColor(COLORS.header[0], COLORS.header[1], COLORS.header[2]);
  doc.setFont('helvetica', 'bold');
  doc.text('CLÍNICA RESILIENCIA', width / 2, yPos, { align: 'center' });

  yPos += 5;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('Atención Psicológica Integral', width / 2, yPos, { align: 'center' });

  yPos += 4;
  doc.text('Managua, Nicaragua', width / 2, yPos, { align: 'center' });

  yPos += 5;
  doc.setDrawColor(200);
  doc.line(5, yPos, 75, yPos);

  yPos += 6;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(`N° RECIBO: #${getNumeroRecibo(recibo).padStart(6, '0')}`, 5, yPos);

  yPos += 4;
  doc.setFont('helvetica', 'normal');
  doc.text(`Fecha: ${formatearFecha(getFechaRecibo(recibo))}`, 5, yPos);

  yPos += 6;
  doc.setFont('helvetica', 'bold');
  doc.text('FACTURADO A:', 5, yPos);

  yPos += 4;
  doc.setFont('helvetica', 'normal');

  const paciente = recibo.Cita?.Paciente;
  const pacienteMenor = getPacienteMenor(paciente);
  const tutor = getTutorMenor(pacienteMenor);

  doc.text(getNombrePacienteRecibo(recibo), 5, yPos);

  if (paciente?.PacienteAdulto) {
    yPos += 4;
    doc.text(`Cédula: ${paciente.PacienteAdulto.No_Cedula || 'N/A'}`, 5, yPos);
  } else if (pacienteMenor) {
    yPos += 4;
    doc.text(`Partida: ${getPartidaNacimiento(pacienteMenor)}`, 5, yPos);

    if (tutor) {
      yPos += 4;
      const nombreTutor = `${tutor.Nombre || ''} ${tutor.Apellido || ''}`.trim() || 'N/A';
      doc.text(`Tutor: ${nombreTutor}`, 5, yPos);
    }
  }

  yPos += 6;

  autoTable(doc, {
    startY: yPos,
    margin: { left: 5, right: 5 },
    head: [['DESCRIPCIÓN', 'TOTAL']],
    body: [[
      `Consulta (${getTipoCita(recibo.Cita?.TipoDeCita)})`,
      `${divisaSymbol}${Number(recibo.MontoTotal || 0).toFixed(2)}`,
    ]],
    theme: 'plain',
    headStyles: {
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left',
    },
    styles: { fontSize: 8, cellPadding: 1 },
    columnStyles: {
      0: { cellWidth: 45 },
      1: { cellWidth: 25, halign: 'right' },
    },
    didParseCell: (data) => {
      if (data.section === 'head' && data.column.index === 1) {
        data.cell.styles.halign = 'right';
      }
    },
  });

  yPos = getLastAutoTableY(doc, yPos) + 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL PAGADO:', 5, yPos);
  doc.text(`${divisaSymbol} ${Number(recibo.MontoTotal || 0).toFixed(2)}`, 75, yPos, { align: 'right' });

  yPos += 6;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.text(`Método: ${getMetodoPago(recibo)}`, 5, yPos);

  if (recibo.Banco?.Nombre_Banco) {
    yPos += 3;
    doc.text(`Banco: ${recibo.Banco.Nombre_Banco}`, 5, yPos);
  }

  if (recibo.Numero_Referencia) {
    yPos += 3;
    doc.text(`Ref: ${recibo.Numero_Referencia}`, 5, yPos);
  }

  const tasaCambio = Number(recibo.Tasa_Cambio || 0);
  if (tasaCambio > 1) {
    yPos += 3;
    doc.text(`T. Cambio: ${tasaCambio.toFixed(2)}`, 5, yPos);
  }

  yPos += 12;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('¡GRACIAS POR SU CONFIANZA!', width / 2, yPos, { align: 'center' });

  doc.save(`Recibo_${getNumeroRecibo(recibo)}.pdf`);
};

// Compatibilidad con Facturacion.tsx actual
export const generarPDFFactura = generarPDFRecibo;

// ==========================================
// 3. REPORTE FINANCIERO GENERAL
// ==========================================
export const generarPDFReporteFinanciero = (
  recibos: ReciboPDF[],
  fechaInicio: string,
  fechaFin: string
) => {
  const doc = new jsPDF() as JsPDFWithAutoTable;
  const hoy = new Date().toLocaleDateString('es-ES');

  doc.setFillColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.rect(0, 0, 210, 35, 'F');

  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('REPORTE FINANCIERO', 14, 20);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generado: ${hoy} | Periodo: ${fechaInicio || 'Inicio'} - ${fechaFin || 'Hoy'}`, 14, 28);

  const totalNIO = recibos
    .filter((recibo) => getDivisaCodigo(recibo) !== 'USD')
    .reduce((acc, curr) => acc + Number(curr.MontoTotal || 0), 0);

  const totalUSD = recibos
    .filter((recibo) => getDivisaCodigo(recibo) === 'USD')
    .reduce((acc, curr) => acc + Number(curr.MontoTotal || 0), 0);

  const filas = recibos.map((recibo) => [
    `#${getNumeroRecibo(recibo)}`,
    formatearFecha(getFechaRecibo(recibo)),
    getNombrePacienteRecibo(recibo),
    getMetodoPago(recibo),
    getDivisaCodigo(recibo),
    `${getDivisaSymbol(recibo)} ${Number(recibo.MontoTotal || 0).toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: 50,
    head: [['N°', 'FECHA', 'PACIENTE', 'MÉTODO', 'MONEDA', 'MONTO']],
    body: filas,
    headStyles: { fillColor: COLORS.header as RGBColor },
    styles: { fontSize: 8 },
    columnStyles: {
      5: { halign: 'right', fontStyle: 'bold' },
    },
  });

  const finalY = getLastAutoTableY(doc, 50) + 15;

  doc.setFontSize(11);
  doc.setTextColor(COLORS.header[0], COLORS.header[1], COLORS.header[2]);
  doc.text(`Total Córdobas (NIO): C$ ${totalNIO.toFixed(2)}`, 14, finalY);

  doc.setTextColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
  doc.text(`Total Dólares (USD): $ ${totalUSD.toFixed(2)}`, 14, finalY + 7);

  doc.save('Reporte_Financiero_Resiliencia.pdf');
};

// ==========================================
// 4. EXPEDIENTE CLÍNICO
// ==========================================
export const generarPDFExpediente = (paciente: PacientePDF, historial: SesionPDF[]) => {
  const doc = new jsPDF() as JsPDFWithAutoTable;
  const width = doc.internal.pageSize.width;

  doc.setFillColor(COLORS.header[0], COLORS.header[1], COLORS.header[2]);
  doc.rect(0, 0, width, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('EXPEDIENTE CLÍNICO PSICOLÓGICO', 20, 20);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('CLÍNICA PSICOLÓGICA RESILIENCIA', 20, 28);
  doc.text('Dirección: Managua, Nicaragua | Sistema de Gestión Salud', 20, 33);

  const noExp = paciente.Expediente?.No_Expediente || 'S/E';

  doc.setFillColor(255, 255, 255);
  doc.roundedRect(width - 60, 12, 45, 15, 2, 2, 'F');
  doc.setTextColor(COLORS.header[0], COLORS.header[1], COLORS.header[2]);
  doc.setFontSize(8);
  doc.text('N° EXPEDIENTE', width - 57, 18);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(noExp.toString(), width - 57, 24);

  let yPos = 50;

  doc.setFillColor(240, 240, 240);
  doc.rect(15, yPos - 5, width - 30, 8, 'F');
  doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('I. INFORMACIÓN GENERAL DEL PACIENTE', 20, yPos);

  yPos += 8;

  const nombreComp = getNombrePaciente(paciente);
  const pacienteMenor = getPacienteMenor(paciente);
  const idDoc = paciente.PacienteAdulto?.No_Cedula || getPartidaNacimiento(pacienteMenor);
  const telPac = paciente.PacienteAdulto?.No_Telefono || 'N/A';
  const ocupacion = paciente.PacienteAdulto?.Ocupacion?.Nombre_DeOcupacion || 'N/A';
  const estadoCivil = paciente.PacienteAdulto?.EstadoCivil?.Nombre_EstadoCivil || 'N/A';
  const direccion = paciente.Direccion
    ? `${paciente.Direccion.Municipio?.Nombre_Municipio || paciente.Direccion.Ciudad || 'N/A'}, B° ${paciente.Direccion.Barrio || 'N/A'}, ${paciente.Direccion.Calle || 'N/A'}`
    : 'N/A';

  autoTable(doc, {
    startY: yPos,
    body: [
      ['Nombre Completo:', nombreComp, 'Identificación:', idDoc],
      [
        'Fecha Nacimiento:',
        paciente.Fecha_Nacimiento
          ? formatearFecha(paciente.Fecha_Nacimiento, {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              timeZone: 'UTC',
            }).replace(/ de (\d{4})$/, ' del $1')
          : 'N/A',
        'Sexo:',
        paciente.Genero || 'N/A',
      ],
      ['Ocupación:', ocupacion, 'Estado Civil:', estadoCivil],
      ['Teléfono:', telPac, 'Dirección:', direccion],
    ],
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 3, textColor: [0, 0, 0] },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 35 },
      1: { cellWidth: 60 },
      2: { fontStyle: 'bold', cellWidth: 35 },
      3: { cellWidth: 60 },
    },
  });

  yPos = getLastAutoTableY(doc, yPos) + 15;

  doc.setFillColor(240, 240, 240);
  doc.rect(15, yPos - 5, width - 30, 8, 'F');
  doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('II. REGISTRO CRONOLÓGICO DE INTERVENCIONES', 20, yPos);

  yPos += 8;

  if (!historial || historial.length === 0) {
    doc.setTextColor(COLORS.secondary[0], COLORS.secondary[1], COLORS.secondary[2]);
    doc.text('No se registran sesiones clínicas procesadas en el sistema.', 20, yPos + 10);
  } else {
    const historialOrdenado = [...historial].sort((a, b) => {
      const fechaA = new Date(getFechaSesion(a)).getTime();
      const fechaB = new Date(getFechaSesion(b)).getTime();

      return fechaA - fechaB;
    });

    historialOrdenado.forEach((sesion, index) => {
      if (yPos > 220) {
        doc.addPage();
        yPos = 20;
      }

      const fecha = getFechaSesion(sesion);
      const doctor = sesion.Cita?.Psicologo?.Apellido || 'Especialista';
      const tipoCita = getTipoCita(sesion.Cita?.TipoDeCita);
      const motivo = sesion.Cita?.MotivoConsulta || 'No especificado';
      const tratamientos = sesion.Tratamiento?.map((tratamiento) => {
        const farmaco = getTratamientoFarmaceutico(tratamiento);
        const terapia = getTratamientoTerapeutico(tratamiento);

        return farmaco
          ? farmaco.Nombre_Medicamento || farmaco.NombreMedicamento || 'Medicamento'
          : terapia?.TipoDe_Terapia?.Nombre_De_Terapia ||
              terapia?.TipoDeTerapia?.NombreDeTerapia ||
              'Terapia';
      }).join(', ') || 'N/A';

      autoTable(doc, {
        startY: yPos,
        head: [[`SESIÓN N° ${index + 1} - FECHA: ${formatearFecha(fecha, { timeZone: 'UTC' })} - DR. ${doctor.toUpperCase()}`]],
        body: [
          [{ content: `TIPO DE SERVICIO: ${tipoCita}`, styles: { fontStyle: 'bold', fillColor: [235, 235, 235] } }],
          [{ content: `MOTIVO DE CONSULTA: ${motivo}`, styles: { fontStyle: 'bold' } }],
          [{ content: `DIAGNÓSTICO DIFERENCIAL: ${sesion.DiagnosticoDiferencial || 'N/A'}`, styles: { fillColor: [240, 248, 255] } }],
          [`OBSERVACIONES CLÍNICAS: \n${sesion.Observaciones || 'Sin observaciones.'}`],
          [`EVOLUCIÓN DEL PACIENTE: \n${sesion.HistorialDeEvolucion || 'Sin registro.'}`],
          [`TRATAMIENTOS Y RECOMENDACIONES: ${tratamientos}`],
        ],
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 4, textColor: [20, 20, 20] },
        headStyles: { fillColor: COLORS.header as RGBColor, textColor: 255, fontSize: 10 },
      });

      yPos = getLastAutoTableY(doc, yPos) + 8;
    });
  }

  const totalPages = doc.getNumberOfPages();

  for (let i = 1; i <= totalPages; i += 1) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(`Documento generado por Sistema Resiliencia el ${new Date().toLocaleString()}`, 15, 285);
    doc.text(`Página ${i} de ${totalPages}`, width - 35, 285);
  }

  doc.save(`Expediente_${paciente.Nombre || 'Paciente'}_${paciente.Apellido || ''}.pdf`);
};
