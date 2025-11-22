import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- CONFIGURACIÓN DE ESTILOS GLOBALES ---
const COLORS = {
  primary: [37, 99, 235],    // Azul Corporativo (Blue-600)
  secondary: [100, 116, 139], // Gris Texto (Slate-500)
  header: [30, 41, 59],      // Oscuro (Slate-800)
  accent: [16, 185, 129],    // Verde Dinero (Emerald-500)
  light: [241, 245, 249],    // Fondo Claro (Slate-100)
  text: [0, 0, 0]            // Negro puro para totales
};

// ==========================================
// 1. RECETA MÉDICA
// ==========================================
export const generarPDFReceta = (sesion: any, pacienteNombre: string) => {
  const doc = new jsPDF();

  // Barra lateral decorativa
  doc.setFillColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.rect(0, 0, 15, 297, 'F'); 

  // Títulos
  doc.setFontSize(24);
  doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.setFont("helvetica", "bold");
  doc.text("RECETA MÉDICA", 180, 25, { align: "right" });

  doc.setFontSize(16);
  doc.setTextColor(COLORS.header[0], COLORS.header[1], COLORS.header[2]);
  doc.text("Clínica Psicológica Resiliencia", 25, 25);
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(COLORS.secondary[0], COLORS.secondary[1], COLORS.secondary[2]);
  doc.text("Dirección: Managua, Nicaragua | Tel: 2222-0000", 25, 31);

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
  doc.setFont("helvetica", "normal");
  doc.text("FECHA:", 150, yPos);
  
  const fechaStr = sesion.FechaReal 
    ? new Date(sesion.FechaReal).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) 
    : 'N/A';
  
  doc.setTextColor(0);
  doc.text(fechaStr, 150, yPos + 6);

  // Diagnóstico
  yPos += 20;
  doc.setFillColor(240, 248, 255); 
  doc.roundedRect(25, yPos, 165, 18, 2, 2, 'F');
  
  doc.setFontSize(10);
  doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.setFont("helvetica", "bold");
  doc.text("Diagnóstico:", 30, yPos + 6);
  
  doc.setFont("helvetica", "italic");
  doc.setTextColor(0);
  doc.text(sesion.DiagnosticoDiferencial || "Sin diagnóstico especificado", 30, yPos + 12);

  // Tabla Medicamentos
  const filasFarmacos = sesion.Tratamiento
    ?.filter((t: any) => t.TratamientoFarmaceutico !== null)
    .map((t: any) => [
      t.TratamientoFarmaceutico.NombreMedicamento,
      t.TratamientoFarmaceutico.Dosis,
      t.Frecuencia,
      t.TratamientoFarmaceutico.ViaAdministracion?.NombreDePresentacion || 'N/A'
    ]) || [];

  if (filasFarmacos.length > 0) {
    autoTable(doc, {
      startY: yPos + 25,
      margin: { left: 25 },
      head: [['MEDICAMENTO', 'DOSIS', 'FRECUENCIA', 'VÍA']],
      body: filasFarmacos,
      theme: 'grid',
      headStyles: { fillColor: COLORS.primary, textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 10, cellPadding: 4 }
    });
  } else {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text("(No se recetaron medicamentos)", 25, yPos + 35);
  }

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
// 2. FACTURA INDIVIDUAL (CORREGIDA)
// ==========================================
export const generarPDFFactura = (factura: any) => {
  const doc = new jsPDF();

  // Barra Superior
  doc.setFillColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.rect(0, 0, 210, 10, 'F');

  // Encabezado
  doc.setFontSize(20);
  doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.setFont("helvetica", "bold");
  doc.text("Clínica Psicológica Resiliencia", 14, 30);

  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.setFont("helvetica", "normal");
  doc.text("Dirección: Managua, Nicaragua", 14, 36);
  doc.text("Teléfono: 2222-0000 | RUC: J031000000000", 14, 41);

  // Datos Factura (Derecha)
  doc.setFontSize(26);
  doc.setTextColor(220); 
  doc.setFont("helvetica", "bold");
  doc.text("FACTURA", 196, 35, { align: "right" });

  doc.setFontSize(10);
  doc.setTextColor(COLORS.header[0], COLORS.header[1], COLORS.header[2]);
  doc.text("N° DE FACTURA", 196, 45, { align: "right" });
  doc.setFontSize(12);
  doc.text(`#${factura.Cod_Factura.toString().padStart(6, '0')}`, 196, 50, { align: "right" });

  // Fecha
  const fechaRaw = factura.FechaFactura.split('T')[0];
  const partes = fechaRaw.split('-');
  const fechaObj = new Date(parseInt(partes[0]), parseInt(partes[1]) - 1, parseInt(partes[2]));
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(fechaObj.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }), 196, 58, { align: "right" });

  doc.setDrawColor(220);
  doc.line(14, 65, 196, 65);

  // Datos Cliente
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 70, 120, 35, 2, 2, 'F'); 

  doc.setFontSize(9);
  doc.setTextColor(150);
  doc.text("FACTURADO A:", 18, 78);

  doc.setFontSize(11);
  doc.setTextColor(0);
  doc.setFont("helvetica", "bold");
  const p = factura.Cita.Paciente;
  doc.text(`${p.Nombre} ${p.Apellido}`, 18, 84);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  let posY = 90;

  if (p.PacienteAdulto) {
    doc.text(`Cédula: ${p.PacienteAdulto.No_Cedula}`, 18, posY);
    doc.text(`Tel: ${p.PacienteAdulto.No_Telefono}`, 70, posY);
  } else if (p.PacienteMenor) {
    doc.text(`Partida Nac: ${p.PacienteMenor.PartNacimiento}`, 18, posY);
    
    if (p.PacienteMenor.Tutor) {
      const t = p.PacienteMenor.Tutor;
      doc.setFontSize(9);
      doc.setTextColor(COLORS.secondary[0], COLORS.secondary[1], COLORS.secondary[2]);
      doc.text("TUTOR:", 70, 78); 
      doc.setTextColor(0);
      doc.setFontSize(10);
      doc.text(`${t.Nombre} ${t.Apellido}`, 70, 84);
      doc.text(`Céd: ${t.No_Cedula}`, 70, 90);
    }
  }

  // Tabla Detalles
  const detalles = factura.DetalleFactura.map((d: any) => [
    `Consulta Psicológica (${factura.Cita.TipoDeCita?.NombreDeCita || 'General'})`,
    d.MetodoPago?.NombreMetodo || 'Efectivo',
    `C$ ${Number(d.PrecioDeCita).toFixed(2)}`
  ]);

  autoTable(doc, {
    startY: 115,
    head: [['DESCRIPCIÓN DEL SERVICIO', 'MÉTODO DE PAGO', 'IMPORTE']],
    body: detalles,
    theme: 'grid',
    headStyles: { fillColor: COLORS.primary, textColor: 255, fontStyle: 'bold', halign: 'left' },
    columnStyles: { 
        0: { cellWidth: 'auto' }, 
        1: { halign: 'center', cellWidth: 40 }, 
        2: { halign: 'right', fontStyle: 'bold', cellWidth: 40 } 
    },
    styles: { cellPadding: 5, fontSize: 10, textColor: COLORS.header },
    alternateRowStyles: { fillColor: COLORS.light }
  });

  // --- TOTALES (CORREGIDO: ESPACIO Y COLOR NEGRO) ---
  // @ts-ignore
  const finalY = doc.lastAutoTable.finalY + 15;
  
  doc.setDrawColor(COLORS.secondary[0], COLORS.secondary[1], COLORS.secondary[2]);
  doc.line(130, finalY, 196, finalY); // Línea sobre el total

  doc.setFontSize(12);
  doc.setTextColor(100);
  // Moví la etiqueta más a la izquierda (x=135) para que no choque
  doc.text("TOTAL A PAGAR:", 110, finalY + 8);
  
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0); // Color NEGRO puro
  // El número alineado a la derecha al borde (x=196)
  doc.text(`C$ ${Number(factura.MontoTotal).toFixed(2)}`, 196, finalY + 8, { align: "right" });

  // Pie
  const pageHeight = doc.internal.pageSize.height;
  doc.setFillColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.rect(0, pageHeight - 5, 210, 5, 'F');

  doc.save(`Factura_${factura.Cod_Factura}.pdf`);
};


// ==========================================
// 3. REPORTE FINANCIERO GENERAL (CORREGIDO)
// ==========================================
export const generarPDFReporteFinanciero = (facturas: any[], fechaInicio: string, fechaFin: string) => {
  const doc = new jsPDF();
  const hoy = new Date().toLocaleDateString();

  // Encabezado
  doc.setFillColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.rect(0, 0, 210, 35, 'F'); 

  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text("REPORTE FINANCIERO", 14, 20);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Generado el: ${hoy}`, 14, 28);
  doc.text("Clínica Psicológica Resiliencia", 196, 20, { align: "right" });

  // KPIs
  const totalIngresos = facturas.reduce((acc, curr) => acc + Number(curr.MontoTotal), 0);
  const totalTransacciones = facturas.length;
  const ticketPromedio = totalTransacciones > 0 ? totalIngresos / totalTransacciones : 0;

  let yStats = 50;
  
  doc.setTextColor(COLORS.header[0], COLORS.header[1], COLORS.header[2]);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  let periodoTexto = "Histórico Completo";
  if (fechaInicio || fechaFin) periodoTexto = `Periodo: ${fechaInicio || 'Inicio'} al ${fechaFin || 'Hoy'}`;
  doc.text(periodoTexto, 14, yStats);

  yStats += 10;
  const cardWidth = 60;
  const cardHeight = 25;
  const gap = 5;

  // Cards
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(14, yStats, cardWidth, cardHeight, 2, 2, 'FD');
  doc.setFontSize(9);
  doc.setTextColor(COLORS.secondary[0], COLORS.secondary[1], COLORS.secondary[2]);
  doc.text("INGRESOS TOTALES", 19, yStats + 8);
  doc.setFontSize(14);
  doc.setTextColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]); 
  doc.setFont("helvetica", "bold");
  doc.text(`C$ ${totalIngresos.toFixed(2)}`, 19, yStats + 18);

  doc.setFillColor(248, 250, 252); 
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14 + cardWidth + gap, yStats, cardWidth, cardHeight, 2, 2, 'FD');
  doc.setFontSize(9);
  doc.setTextColor(COLORS.secondary[0], COLORS.secondary[1], COLORS.secondary[2]);
  doc.setFont("helvetica", "normal");
  doc.text("TRANSACCIONES", 19 + cardWidth + gap, yStats + 8);
  doc.setFontSize(14);
  doc.setTextColor(COLORS.header[0], COLORS.header[1], COLORS.header[2]);
  doc.setFont("helvetica", "bold");
  doc.text(`${totalTransacciones}`, 19 + cardWidth + gap, yStats + 18);

  doc.setFillColor(239, 246, 255); 
  doc.setDrawColor(191, 219, 254);
  doc.roundedRect(14 + (cardWidth + gap) * 2, yStats, cardWidth, cardHeight, 2, 2, 'FD');
  doc.setFontSize(9);
  doc.setTextColor(COLORS.secondary[0], COLORS.secondary[1], COLORS.secondary[2]);
  doc.setFont("helvetica", "normal");
  doc.text("TICKET PROMEDIO", 19 + (cardWidth + gap) * 2, yStats + 8);
  doc.setFontSize(14);
  doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]); 
  doc.setFont("helvetica", "bold");
  doc.text(`C$ ${ticketPromedio.toFixed(2)}`, 19 + (cardWidth + gap) * 2, yStats + 18);

  // Tabla Detallada
  const filas = facturas.map((f: any) => {
    const fRaw = f.FechaFactura.split('T')[0];
    const fObj = new Date(parseInt(fRaw.split('-')[0]), parseInt(fRaw.split('-')[1]) - 1, parseInt(fRaw.split('-')[2]));
    const fecha = fObj.toLocaleDateString('es-ES');
    
    return [
      `#${f.Cod_Factura}`,
      fecha,
      `${f.Cita.Paciente.Nombre} ${f.Cita.Paciente.Apellido}`,
      `Dr. ${f.Cita.Psicologo.Nombre} ${f.Cita.Psicologo.Apellido}`, // <--- AQUI SE AGREGÓ NOMBRE COMPLETO DEL DR
      f.DetalleFactura[0]?.MetodoPago?.NombreMetodo || 'N/A',
      `C$ ${Number(f.MontoTotal).toFixed(2)}`
    ];
  });

  autoTable(doc, {
    startY: yStats + 35,
    head: [['N°', 'FECHA', 'PACIENTE', 'DOCTOR', 'MÉTODO', 'MONTO']],
    body: filas,
    theme: 'striped',
    headStyles: { fillColor: COLORS.header, fontSize: 9 },
    columnStyles: {
      5: { halign: 'right', fontStyle: 'bold', textColor: COLORS.header }
    },
    styles: { fontSize: 9, cellPadding: 3 }
  });

  doc.save(`Reporte_Financiero_${hoy.replace(/\//g, '-')}.pdf`);
};