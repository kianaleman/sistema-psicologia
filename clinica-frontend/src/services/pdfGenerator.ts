import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const COLORS = {
  primary: [37, 99, 235],
  secondary: [100, 116, 139],
  header: [30, 41, 59],
  accent: [16, 185, 129],
  light: [241, 245, 249],
  text: [0, 0, 0]
} as const;

export const generarPDFReceta = (sesion: any, pacienteNombre: string) => {
  // 🟢 CONFIGURACIÓN PARA FORMATO A5 (148mm x 210mm) - Estándar de Receta Médica
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5'
  });

  const width = doc.internal.pageSize.width;
  const height = doc.internal.pageSize.height;

  // Barra lateral decorativa
  doc.setFillColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.rect(0, 0, 10, height, 'F');

  // Encabezado
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.header[0], COLORS.header[1], COLORS.header[2]);
  doc.text("Clínica Psicológica Resiliencia", 15, 15);
  
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(COLORS.secondary[0], COLORS.secondary[1], COLORS.secondary[2]);
  doc.text("Dirección: Managua, Nicaragua | Sistema Resiliencia", 15, 20);

  doc.setFontSize(14);
  doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.setFont("helvetica", "bold");
  doc.text("RECETA MÉDICA", width - 15, 15, { align: "right" });

  doc.setDrawColor(200);
  doc.line(15, 25, width - 15, 25);

  // Info Paciente y Fecha
  let yPos = 35;
  doc.setFontSize(9);
  doc.setTextColor(COLORS.secondary[0], COLORS.secondary[1], COLORS.secondary[2]);
  doc.text("PACIENTE:", 15, yPos);
  doc.text("FECHA:", width - 50, yPos);

  yPos += 5;
  doc.setFontSize(11);
  doc.setTextColor(0);
  doc.setFont("helvetica", "bold");
  doc.text(pacienteNombre.toUpperCase(), 15, yPos);

  const fechaStr = sesion.Cita?.FechaCita
    ? new Date(sesion.Cita.FechaCita).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('es-ES');
  doc.text(fechaStr, width - 50, yPos);

  // --- SECCIÓN DE DIAGNÓSTICO ELIMINADA ---
  yPos += 15;

  // --- TABLA DE TRATAMIENTO DETALLADO ---
  const cuerpoTratamiento = sesion.Tratamiento?.map((t: any) => {
    const esFarmaco = !!t.Tratamiento_Farmaceutico;
    const nombre = esFarmaco 
      ? t.Tratamiento_Farmaceutico.Nombre_Medicamento 
      : (t.Tratamiento_Terapeutico?.TipoDe_Terapia?.Nombre_De_Terapia || 'Terapia');
    
    const detalle = esFarmaco 
      ? `Dosis: ${t.Tratamiento_Farmaceutico.Dosis}` 
      : `Objetivo: ${t.Tratamiento_Terapeutico?.Objetivo || 'Mejora clínica'}`;

    return [nombre, detalle, t.Frecuencia || 'N/A'];
  }) || [['-', 'No se registraron indicaciones', '-']];

  autoTable(doc, {
    startY: yPos,
    margin: { left: 15, right: 15 },
    head: [['Indicación', 'Detalle / Dosis', 'Frecuencia']],
    body: cuerpoTratamiento,
    theme: 'striped',
    headStyles: { 
      fillColor: COLORS.header as [number, number, number], 
      fontSize: 8,
      halign: 'left'
    },
    styles: { fontSize: 8, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 40 },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 30, halign: 'center' }
    }
  });

  // Pie de página y firma (Movido a la derecha)
  const pageHeight = doc.internal.pageSize.height;
  const firmaX = width - 65; // Ajustado a la derecha
  doc.setDrawColor(150);
  doc.line(firmaX, pageHeight - 30, width - 15, pageHeight - 30);
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text("Firma del Especialista", width - 40, pageHeight - 25, { align: "center" });
  doc.setFontSize(7);
  doc.text(`Dr. ${sesion.Cita?.Psicologo?.Apellido || 'Especialista'}`, width - 40, pageHeight - 21, { align: "center" });
  doc.text(`Cod: ${sesion.Cita?.Psicologo?.CodigoMinsa || 'S/E'}`, width - 40, pageHeight - 17, { align: "center" });

  doc.save(`Receta_${pacienteNombre.replace(/\s+/g, '_')}.pdf`);
};

export const generarPDFRecibo = (recibo: any) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, 160]
  });

  const divisaSymbol = recibo.Divisa?.Codigo_ISO === 'USD' ? '$' : 'C$';
  const width = 80;
  let yPos = 10;

  doc.setFontSize(12);
  doc.setTextColor(COLORS.header[0], COLORS.header[1], COLORS.header[2]);
  doc.setFont("helvetica", "bold");
  doc.text("CLÍNICA RESILIENCIA", width / 2, yPos, { align: "center" });

  yPos += 5;
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("Atención Psicológica Integral", width / 2, yPos, { align: "center" });
  yPos += 4;
  doc.text("Managua, Nicaragua", width / 2, yPos, { align: "center" });

  yPos += 5;
  doc.setDrawColor(200);
  doc.line(5, yPos, 75, yPos);

  yPos += 6;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(`N° RECIBO: #${recibo.Cod_Recibo?.toString().padStart(6, '0')}`, 5, yPos);

  yPos += 4;
  const fechaObj = new Date(recibo.FechaRecibo);
  doc.setFont("helvetica", "normal");
  doc.text(`Fecha: ${fechaObj.toLocaleDateString('es-ES')}`, 5, yPos);

  yPos += 6;
  doc.setFont("helvetica", "bold");
  doc.text("FACTURADO A:", 5, yPos);
  yPos += 4;
  doc.setFont("helvetica", "normal");
  const p = recibo.Cita?.Paciente;
  doc.text(`${p?.Nombre} ${p?.Apellido}`, 5, yPos);

  if (p?.PacienteAdulto) {
    yPos += 4;
    doc.text(`Cédula: ${p.PacienteAdulto.No_Cedula}`, 5, yPos);
  }

  yPos += 6;
  autoTable(doc, {
    startY: yPos,
    margin: { left: 5, right: 5 },
    head: [['DESCRIPCIÓN', 'TOTAL']],
    body: [[
      `Consulta (${recibo.Cita?.TipoDeCita?.Nombre_DeCita || 'Gral'})`,
      `${divisaSymbol}${Number(recibo.MontoTotal).toFixed(2)}`
    ]],
    theme: 'plain',
    headStyles: {
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left'
    },
    styles: { fontSize: 8, cellPadding: 1 },
    columnStyles: {
      0: { cellWidth: 45 },
      1: { cellWidth: 25, halign: 'right' }
    },
    didParseCell: (data) => {
      if (data.section === 'head' && data.column.index === 1) {
        data.cell.styles.halign = 'right';
      }
    }
  });

  // @ts-ignore
  yPos = doc.lastAutoTable.finalY + 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL PAGADO:", 5, yPos);
  doc.text(`${divisaSymbol} ${Number(recibo.MontoTotal).toFixed(2)}`, 75, yPos, { align: "right" });

  yPos += 6;
  doc.setFontSize(7);
  doc.setFont("helvetica", "italic");
  doc.text(`Método: ${recibo.MetodoPago?.Nombre_Metodo || 'Efectivo'}`, 5, yPos);
  if (recibo.Tasa_Cambio > 1) {
    yPos += 3;
    doc.text(`T. Cambio: ${recibo.Tasa_Cambio.toFixed(2)}`, 5, yPos);
  }

  yPos += 12;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("¡GRACIAS POR SU CONFIANZA!", width / 2, yPos, { align: "center" });

  doc.save(`Recibo_${recibo.Cod_Recibo}.pdf`);
};

export const generarPDFReporteFinanciero = (recibos: any[], fechaInicio: string, fechaFin: string) => {
  const doc = new jsPDF();
  const hoy = new Date().toLocaleDateString();
  doc.setFillColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.rect(0, 0, 210, 35, 'F');
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text("REPORTE FINANCIERO", 14, 20);
  doc.setFontSize(10);
  doc.text(`Generado: ${hoy} | Periodo: ${fechaInicio || 'Inicio'} - ${fechaFin || 'Hoy'}`, 14, 28);
  const totalNIO = recibos.filter(r => r.ID_Divisa === 1).reduce((acc, curr) => acc + Number(curr.MontoTotal), 0);
  const totalUSD = recibos.filter(r => r.ID_Divisa === 2).reduce((acc, curr) => acc + Number(curr.MontoTotal), 0);
  const filas = recibos.map((r: any) => [
    `#${r.Cod_Recibo}`,
    new Date(r.FechaRecibo).toLocaleDateString(),
    `${r.Cita?.Paciente?.Nombre} ${r.Cita?.Paciente?.Apellido}`,
    r.MetodoPago?.Nombre_Metodo || 'No especificado',
    r.ID_Divisa === 2 ? 'USD' : 'NIO',
    `${r.ID_Divisa === 2 ? '$' : 'C$'} ${Number(r.MontoTotal).toFixed(2)}`
  ]);
  autoTable(doc, {
    startY: 50,
    head: [['N°', 'FECHA', 'PACIENTE', 'MÉTODO', 'MONEDA', 'MONTO']],
    body: filas,
    headStyles: { fillColor: COLORS.header as [number, number, number] },
    styles: { fontSize: 8 }
  });
  // @ts-ignore
  const finalY = doc.lastAutoTable.finalY + 15;
  doc.setFontSize(11);
  doc.setTextColor(COLORS.header[0]);
  doc.text(`Total Córdobas (NIO): C$ ${totalNIO.toFixed(2)}`, 14, finalY);
  doc.setTextColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
  doc.text(`Total Dólares (USD): $ ${totalUSD.toFixed(2)}`, 14, finalY + 7);
  doc.save(`Reporte_Financiero_Resiliencia.pdf`);
};

export const generarPDFExpediente = (paciente: any, historial: any[]) => {
  const doc = new jsPDF();
  const width = doc.internal.pageSize.width;

  doc.setFillColor(COLORS.header[0], COLORS.header[1], COLORS.header[2]);
  doc.rect(0, 0, width, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("EXPEDIENTE CLÍNICO PSICOLÓGICO", 20, 20);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("CLÍNICA PSICOLÓGICA RESILIENCIA", 20, 28);
  doc.text(`Dirección: Managua, Nicaragua | Sistema de Gestión Salud`, 20, 33);

  const noExp = paciente.Expediente?.No_Expediente || "S/E";
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(width - 60, 12, 45, 15, 2, 2, 'F');
  doc.setTextColor(COLORS.header[0]);
  doc.setFontSize(8);
  doc.text("N° EXPEDIENTE", width - 57, 18);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(noExp.toString(), width - 57, 24);

  let yPos = 50;

  doc.setFillColor(240, 240, 240);
  doc.rect(15, yPos - 5, width - 30, 8, 'F');
  doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("I. INFORMACIÓN GENERAL DEL PACIENTE", 20, yPos);

  yPos += 8;

  const infoPac = paciente?.PacienteAdulto ? paciente : (historial[0]?.Cita?.Paciente || paciente);
  const nombreComp = `${infoPac?.Nombre || ''} ${infoPac?.Apellido || ''}`.trim() || 'No especificado';
  const idDoc = infoPac?.PacienteAdulto?.No_Cedula || infoPac?.Paciente_Menor?.PartidaDeNacimiento || 'N/A';
  const telPac = infoPac?.PacienteAdulto?.No_Telefono || 'N/A';
  const ocupacion = infoPac?.PacienteAdulto?.Ocupacion?.Nombre_DeOcupacion || 'N/A';
  const estadoCivil = infoPac?.PacienteAdulto?.EstadoCivil?.Nombre_EstadoCivil || 'N/A';
  
  // 🟢 DIRECCIÓN COMPLETA
  const direccion = infoPac?.Direccion 
    ? `${infoPac.Direccion.Ciudad}, B° ${infoPac.Direccion.Barrio}, ${infoPac.Direccion.Calle}` 
    : 'N/A';

  autoTable(doc, {
    startY: yPos,
    body: [
      ['Nombre Completo:', nombreComp, 'Identificación:', idDoc],
      [
        'Fecha Nacimiento:', 
        infoPac?.Fecha_Nacimiento 
          ? new Date(infoPac.Fecha_Nacimiento).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).replace(/ de (\d{4})$/, ' del $1') 
          : 'N/A', 
        'Sexo:', 
        infoPac?.Genero || 'N/A'
      ],
      ['Ocupación:', ocupacion, 'Estado Civil:', estadoCivil],
      ['Teléfono:', telPac, 'Dirección:', direccion]
    ],
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 3, textColor: [0, 0, 0] },
    columnStyles: { 
        0: { fontStyle: 'bold', cellWidth: 35 }, 
        1: { cellWidth: 60 },
        2: { fontStyle: 'bold', cellWidth: 35 },
        3: { cellWidth: 60 }
    }
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  doc.setFillColor(240, 240, 240);
  doc.rect(15, yPos - 5, width - 30, 8, 'F');
  doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("II. REGISTRO CRONOLÓGICO DE INTERVENCIONES", 20, yPos);

  yPos += 8;

  if (!historial || historial.length === 0) {
    doc.setTextColor(COLORS.secondary[0], COLORS.secondary[1], COLORS.secondary[2]);
    doc.text("No se registran sesiones clínicas procesadas en el sistema.", 20, yPos + 10);
  } else {
    const historialOrdenado = [...historial].sort((a, b) => {
      const fechaA = new Date(a.Cita?.FechaCita || a.Fecha_Sesion || a.HoraDeInicio).getTime();
      const fechaB = new Date(b.Cita?.FechaCita || b.Fecha_Sesion || b.HoraDeInicio).getTime();
      return fechaA - fechaB;
    });

    historialOrdenado.forEach((sesion, index) => {
      if (yPos > 220) { doc.addPage(); yPos = 20; }

      const fecha = sesion.Cita?.FechaCita || sesion.Fecha_Sesion || sesion.HoraDeInicio;
      const doctor = sesion.Cita?.Psicologo?.Apellido || "Especialista";
      const tipoCita = sesion.Cita?.TipoDeCita?.Nombre_DeCita || "Consulta General";
      const motivo = sesion.MotivoConsulta || sesion.Cita?.MotivoConsulta || "No especificado";

      autoTable(doc, {
        startY: yPos,
        head: [[`SESIÓN N° ${index + 1} - FECHA: ${new Date(fecha).toLocaleDateString('es-ES', { timeZone: 'UTC' })} - DR. ${doctor.toUpperCase()}`]],
        body: [
          [{ content: `TIPO DE SERVICIO: ${tipoCita}`, styles: { fontStyle: 'bold', fillColor: [235, 235, 235] } }],
          [{ content: `MOTIVO DE CONSULTA: ${motivo}`, styles: { fontStyle: 'bold' } }],
          [{ content: `DIAGNÓSTICO DIFERENCIAL: ${sesion.DiagnosticoDiferencial || 'N/A'}`, styles: { fillColor: [240, 248, 255] } }],
          [`OBSERVACIONES CLÍNICAS: \n${sesion.Observaciones || 'Sin observaciones.'}`],
          [`EVOLUCIÓN DEL PACIENTE: \n${sesion.HistorialDeEvolucion || 'Sin registro.'}`],
          [`TRATAMIENTOS Y RECOMENDACIONES: ${sesion.Tratamiento?.map((t: any) => 
            t.Tratamiento_Farmaceutico ? t.Tratamiento_Farmaceutico.Nombre_Medicamento : (t.Tratamiento_Terapeutico?.TipoDe_Terapia?.Nombre_De_Terapia || 'Terapia')
          ).join(', ') || 'N/A'}`]
        ],
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 4, textColor: [20, 20, 20] },
        headStyles: { fillColor: COLORS.header as [number, number, number], textColor: 255, fontSize: 10 },
      });

      yPos = (doc as any).lastAutoTable.finalY + 8;
    });
  }

  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(`Documento generado por Sistema Resiliencia el ${new Date().toLocaleString()}`, 15, 285);
    doc.text(`Página ${i} de ${totalPages}`, width - 35, 285);
  }

  doc.save(`Expediente_${paciente.Nombre || 'Paciente'}_${paciente.Apellido || ''}.pdf`);
};