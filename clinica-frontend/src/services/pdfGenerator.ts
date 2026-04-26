import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- CONFIGURACIÓN DE ESTILOS CON TIPADO ESTRICTO ---
const COLORS = {
  primary: [37, 99, 235],
  secondary: [100, 116, 139],
  header: [30, 41, 59],
  accent: [16, 185, 129],
  light: [241, 245, 249],
  text: [0, 0, 0]
} as const;

// ==========================================
// 1. RECETA MÉDICA (INDICACIONES CLÍNICAS)
// ==========================================
export const generarPDFReceta = (sesion: any, pacienteNombre: string) => {
  const doc = new jsPDF();

  // Barra lateral decorativa
  doc.setFillColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.rect(0, 0, 15, 297, 'F'); 

  // Títulos
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

  // Datos Paciente y Fecha
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

  // Diagnóstico (Sincronizado con el nuevo Schema)
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

  // Firma
  const pageHeight = doc.internal.pageSize.height;
  doc.setDrawColor(150);
  doc.line(130, pageHeight - 45, 170, pageHeight - 45);
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text("Firma del Especialista", 150, pageHeight - 40, { align: "center" });
  
  doc.save(`Receta_${pacienteNombre.replace(/\s+/g, '_')}.pdf`);
};

// ==========================================
// 2. RECIBO INDIVIDUAL (BIMONEDA)
// ==========================================
export const generarPDFRecibo = (recibo: any) => {
  const doc = new jsPDF();
  const divisaSymbol = recibo.Divisa?.Codigo_ISO === 'USD' ? '$' : 'C$';

  doc.setFillColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.rect(0, 0, 210, 10, 'F');

  doc.setFontSize(20);
  doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.setFont("helvetica", "bold");
  doc.text("Clínica Psicológica Resiliencia", 14, 30);

  doc.setFontSize(26);
  doc.setTextColor(220, 220, 220); 
  doc.text("RECIBO", 196, 35, { align: "right" });

  doc.setFontSize(10);
  doc.setTextColor(COLORS.header[0], COLORS.header[1], COLORS.header[2]);
  doc.text("N° RECIBO", 196, 45, { align: "right" });
  doc.setFontSize(12);
  doc.text(`#${recibo.Cod_Recibo?.toString().padStart(6, '0')}`, 196, 50, { align: "right" });

  const fechaObj = new Date(recibo.FechaRecibo);
  doc.text(fechaObj.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }), 196, 58, { align: "right" });

  doc.setDrawColor(220);
  doc.line(14, 65, 196, 65);

  // Datos Cliente (Lógica de Paciente Adulto/Menor)
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 70, 182, 35, 2, 2, 'F'); 
  doc.setFontSize(9);
  doc.setTextColor(150);
  doc.text("FACTURADO A:", 18, 78);

  const p = recibo.Cita?.Paciente;
  doc.setFontSize(11);
  doc.setTextColor(0);
  doc.setFont("helvetica", "bold");
  doc.text(`${p?.Nombre} ${p?.Apellido}`, 18, 84);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  if (p?.PacienteAdulto) {
    doc.text(`Identificación: ${p.PacienteAdulto.No_Cedula}`, 18, 92);
  } else if (p?.Paciente_Menor) {
    doc.text(`Partida Nac: ${p.Paciente_Menor.PartidaDeNacimiento}`, 18, 92);
  }

  // Tabla Detalles
  autoTable(doc, {
    startY: 115,
    head: [['DESCRIPCIÓN', 'MÉTODO', 'CAMBIO', 'IMPORTE']],
    body: [[
      `Consulta Psicológica (${recibo.Cita?.TipoDeCita?.Nombre_DeCita || 'General'})`,
      recibo.MetodoPago?.NombreMetodo || 'N/A',
      recibo.Tasa_Cambio > 1 ? `x ${recibo.Tasa_Cambio.toFixed(2)}` : 'N/A',
      `${divisaSymbol} ${Number(recibo.MontoTotal).toFixed(2)}`
    ]],
    theme: 'grid',
    headStyles: { 
      fillColor: COLORS.primary as [number, number, number], 
      textColor: 255, 
      fontStyle: 'bold' 
    },
    styles: { cellPadding: 5, fontSize: 10, textColor: COLORS.header[0] },
    alternateRowStyles: { fillColor: COLORS.light as [number, number, number] }
  });

  // @ts-ignore
  const finalY = doc.lastAutoTable.finalY + 15;
  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text("TOTAL PAGADO:", 110, finalY + 8);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(`${divisaSymbol} ${Number(recibo.MontoTotal).toFixed(2)}`, 196, finalY + 8, { align: "right" });

  doc.save(`Recibo_${recibo.Cod_Recibo}.pdf`);
};

// ==========================================
// 3. REPORTE FINANCIERO (ADAPTADO A BIMONEDA)
// ==========================================
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
    r.MetodoPago?.NombreMetodo || 'N/A',
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