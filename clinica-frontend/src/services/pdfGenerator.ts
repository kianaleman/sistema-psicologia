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
  const doc = new jsPDF();
  doc.setFillColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.rect(0, 0, 15, 297, 'F');
  doc.setFontSize(24);
  // @ts-ignore
  doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.setFont("helvetica", "bold");
  doc.text("INDICACIONES CLÍNICAS", 180, 25, { align: "right" });
  doc.setFontSize(16);
  doc.setTextColor(COLORS.header[0], COLORS.header[1], COLORS.header[2]);
  doc.text("Clínica Psicológica Resiliencia", 25, 25);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(COLORS.secondary[0], COLORS.secondary[1], COLORS.secondary[2]);
  doc.text("Dirección: Managua, Nicaragua | Sistema Resiliencia", 25, 31);
  doc.setDrawColor(200);
  doc.line(25, 38, 190, 38);
  let yPos = 50;
  doc.setFontSize(10);
  doc.text("PACIENTE:", 25, yPos);
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.setFont("helvetica", "bold");
  doc.text(pacienteNombre, 25, yPos + 6);
  doc.setFontSize(10);
  doc.setTextColor(COLORS.secondary[0], COLORS.secondary[1], COLORS.secondary[2]);
  doc.text("FECHA:", 150, yPos);
  const fechaStr = sesion.Cita?.FechaCita
    ? new Date(sesion.Cita.FechaCita).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  doc.setTextColor(0);
  doc.text(fechaStr, 150, yPos + 6);
  yPos += 20;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(25, yPos, 165, 22, 2, 2, 'F');
  doc.setFontSize(10);
  doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.setFont("helvetica", "bold");
  doc.text("Diagnóstico / Criterios:", 30, yPos + 8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(0);
  const diag = sesion.Criterios_DeDiagnostico || sesion.DiagnosticoDiferencial || "Sin diagnóstico especificado";
  doc.text(doc.splitTextToSize(diag, 155), 30, yPos + 14);
  const pageHeight = doc.internal.pageSize.height;
  doc.setDrawColor(150);
  doc.line(130, pageHeight - 45, 170, pageHeight - 45);
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text("Firma del Especialista", 150, pageHeight - 40, { align: "center" });
  doc.save(`Receta_${pacienteNombre.replace(/\s+/g, '_')}.pdf`);
};

export const generarPDFRecibo = (recibo: any) => {
  // 🟢 CONFIGURACIÓN PARA FORMATO VOUCHER (80mm x 150mm aproximadamente)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, 160]
  });

  const divisaSymbol = recibo.Divisa?.Codigo_ISO === 'USD' ? '$' : 'C$';
  const width = 80;
  let yPos = 10;

  // Encabezado Compacto
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

  // Info del Recibo
  yPos += 6;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(`N° RECIBO: #${recibo.Cod_Recibo?.toString().padStart(6, '0')}`, 5, yPos);

  yPos += 4;
  const fechaObj = new Date(recibo.FechaRecibo);
  doc.setFont("helvetica", "normal");
  doc.text(`Fecha: ${fechaObj.toLocaleDateString('es-ES')}`, 5, yPos);

  // Datos del Cliente
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

  // Tabla de Detalle adaptada al ancho
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
      halign: 'left' // Título descripción a la izquierda
    },
    styles: { fontSize: 8, cellPadding: 1 },
    columnStyles: {
      0: { cellWidth: 45 },
      // 🟢 Cambiamos el ancho y alineamos el título "TOTAL" también a la derecha
      1: { cellWidth: 25, halign: 'right' }
    },
    // Forzamos que la cabecera del TOTAL también esté a la derecha
    didParseCell: (data) => {
      if (data.section === 'head' && data.column.index === 1) {
        data.cell.styles.halign = 'right';
      }
    }
  });

  // @ts-ignore
  yPos = doc.lastAutoTable.finalY + 8;

  // Totales y Pago
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

  // Pie de página
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
    r.MetodoPago?.Nombre_Metodo || 'No especificado', // 🟢 CORRECCIÓN
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