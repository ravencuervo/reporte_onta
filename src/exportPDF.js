import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Render a temporary hidden div, capture it, return canvas dataURL
async function captureElement(el) {
  const canvas = await html2canvas(el, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
    allowTaint: true,
  });
  return canvas;
}

function mm2pt(mm) { return mm * 2.8346; }

export async function exportFullPDF(csvData, onProgress) {
  const { usuarios, pagos, resumenes } = csvData;

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210; // A4 width mm
  const H = 297; // A4 height mm
  const margin = 14;
  const contentW = W - margin * 2;

  // ─── Paleta ────────────────────────────────────────────────────────────────
  const RED = [220, 38, 38];
  const DARK = [30, 41, 59];
  const GRAY = [100, 116, 139];
  const LIGHT = [241, 245, 249];
  const GOLD = [217, 119, 6];

  // ─── HELPERS ────────────────────────────────────────────────────────────────
  const setFont = (style = 'normal', size = 10, color = DARK) => {
    pdf.setFont('helvetica', style);
    pdf.setFontSize(size);
    pdf.setTextColor(...color);
  };

  const drawRect = (x, y, w, h, color, radius = 3) => {
    pdf.setFillColor(...color);
    pdf.roundedRect(x, y, w, h, radius, radius, 'F');
  };

  const addPage = () => {
    pdf.addPage();
    // subtle header line
    pdf.setDrawColor(...RED);
    pdf.setLineWidth(0.5);
    pdf.line(margin, 8, W - margin, 8);
    setFont('normal', 7, GRAY);
    pdf.text('ONTA Perú 2026 — Reporte Ejecutivo Confidencial', margin, 6);
    pdf.text(`Página ${pdf.internal.getCurrentPageInfo().pageNumber}`, W - margin, 6, { align: 'right' });
  };

  // ─── PAGE 1: PORTADA ────────────────────────────────────────────────────────
  onProgress?.(5);

  // Background gradient simulation
  drawRect(0, 0, W, 80, [127, 29, 29]);
  drawRect(0, 75, W, 10, [153, 27, 27]);

  // Logo text
  setFont('bold', 32, [255, 255, 255]);
  pdf.text('ONTA PERÚ 2026', W / 2, 32, { align: 'center' });
  setFont('normal', 14, [254, 202, 202]);
  pdf.text('56ª Reunión Anual de Nematología', W / 2, 44, { align: 'center' });
  setFont('normal', 11, [253, 230, 138]);
  pdf.text('Puno, Perú · 9 al 13 de Noviembre de 2026', W / 2, 54, { align: 'center' });

  // Title box
  drawRect(margin, 88, contentW, 22, [254, 242, 242], 5);
  setFont('bold', 16, RED);
  pdf.text('REPORTE EJECUTIVO DEL CONGRESO', W / 2, 101, { align: 'center' });
  setFont('normal', 10, GRAY);
  pdf.text(`Generado el ${new Date().toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })}`, W / 2, 108, { align: 'center' });

  // KPI boxes
  const kpis = [
    { label: 'Inscritos', value: usuarios.length, color: RED },
    { label: 'Ingresos USD', value: `$${pagos.reduce((s, p) => s + (parseFloat(p['Monto ($)']) || 0), 0).toLocaleString('en-US')}`, color: [180, 83, 9] },
    { label: 'Resúmenes', value: resumenes.length, color: [37, 99, 235] },
    { label: 'Tasa de Pago', value: `${((pagos.length / usuarios.length) * 100).toFixed(1)}%`, color: [22, 163, 74] },
  ];

  const boxW = (contentW - 9) / 4;
  kpis.forEach((k, i) => {
    const x = margin + i * (boxW + 3);
    drawRect(x, 118, boxW, 28, LIGHT, 4);
    pdf.setDrawColor(...k.color);
    pdf.setLineWidth(1);
    pdf.line(x, 118, x, 146);
    setFont('bold', 16, k.color);
    pdf.text(String(k.value), x + boxW / 2, 132, { align: 'center' });
    setFont('normal', 7, GRAY);
    pdf.text(k.label.toUpperCase(), x + boxW / 2, 140, { align: 'center' });
  });

  // Index / Table of contents
  setFont('bold', 12, DARK);
  pdf.text('Contenido del Reporte', margin, 158);
  pdf.setDrawColor(...RED);
  pdf.setLineWidth(0.3);
  pdf.line(margin, 160, margin + 60, 160);

  const sections = [
    '1. Análisis de Usuarios Registrados',
    '2. Reporte de Pagos y Recaudación',
    '3. Catálogo de Resúmenes Científicos',
    '4. Estado de Confirmación (Pagados vs Pendientes)',
  ];
  sections.forEach((s, i) => {
    setFont('normal', 10, DARK);
    pdf.text(s, margin + 4, 170 + i * 10);
    setFont('normal', 9, GRAY);
    pdf.text(`pág. ${i + 2}`, W - margin, 170 + i * 10, { align: 'right' });
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.2);
    pdf.line(margin + 4, 172 + i * 10, W - margin - 12, 172 + i * 10);
  });

  // Footer portada
  drawRect(0, H - 18, W, 18, [30, 41, 59]);
  setFont('normal', 8, [148, 163, 184]);
  pdf.text('Organización de Nematólogos del Trópico Americano · www.ontaperu.pe', W / 2, H - 7, { align: 'center' });

  onProgress?.(15);

  // ─── PAGE 2: USUARIOS ───────────────────────────────────────────────────────
  addPage();
  const nacionales = usuarios.filter(u => u['NACIONALIDAD'] === 'NACIONAL').length;
  const extranjeros = usuarios.filter(u => u['NACIONALIDAD'] === 'EXTRANJERO').length;
  const miembros = usuarios.filter(u => (u['Categoría'] || '').includes('MIEMBRO_ONTA')).length;

  // Section header
  drawRect(margin, 12, contentW, 12, [254, 242, 242], 4);
  pdf.setDrawColor(...RED);
  pdf.setLineWidth(1.5);
  pdf.line(margin, 12, margin, 24);
  setFont('bold', 14, RED);
  pdf.text('1. Análisis de Usuarios Registrados', margin + 5, 21);

  // Stats
  const statItems = [
    { l: 'Total Inscritos', v: usuarios.length, c: RED },
    { l: 'Nacionales 🇵🇪', v: nacionales, c: [37, 99, 235] },
    { l: 'Extranjeros ✈️', v: extranjeros, c: [217, 119, 6] },
    { l: 'Miembros ONTA', v: miembros, c: [22, 163, 74] },
  ];
  statItems.forEach((s, i) => {
    const x = margin + i * (boxW + 3);
    drawRect(x, 28, boxW, 22, LIGHT, 3);
    setFont('bold', 14, s.c);
    pdf.text(String(s.v), x + boxW / 2, 39, { align: 'center' });
    setFont('normal', 7, GRAY);
    pdf.text(s.l, x + boxW / 2, 46, { align: 'center' });
  });

  // Nationality bar chart
  setFont('bold', 10, DARK);
  pdf.text('Distribución Nacional vs Extranjero', margin, 60);
  const barMaxW = contentW * 0.7;
  [
    { label: `Nacionales (${nacionales})`, count: nacionales, color: RED },
    { label: `Extranjeros (${extranjeros})`, count: extranjeros, color: [217, 119, 6] },
  ].forEach((b, i) => {
    const bw = (b.count / usuarios.length) * barMaxW;
    drawRect(margin, 64 + i * 10, bw, 7, b.color, 2);
    setFont('normal', 8, DARK);
    pdf.text(b.label, margin + bw + 3, 70 + i * 10);
  });

  // Users table
  setFont('bold', 10, DARK);
  pdf.text('Listado completo de usuarios registrados', margin, 92);

  const headers = ['Nombre', 'Institución', 'Categoría', 'País', 'Fecha'];
  const colW = [58, 58, 30, 20, 16];
  let y = 97;

  // Header row
  drawRect(margin, y, contentW, 7, RED, 2);
  let cx = margin + 2;
  headers.forEach((h, i) => {
    setFont('bold', 7.5, [255, 255, 255]);
    pdf.text(h, cx, y + 5);
    cx += colW[i];
  });
  y += 7;

  usuarios.forEach((u, idx) => {
    if (y > H - 22) { addPage(); y = 18; }
    const bg = idx % 2 === 0 ? [255, 255, 255] : [249, 250, 251];
    drawRect(margin, y, contentW, 7, bg, 0);

    const row = [
      (u['Nombre'] || '').slice(0, 28),
      (u['Institución'] || '').slice(0, 28),
      (u['Categoría'] || '').replace('_', ' ').slice(0, 18),
      u['NACIONALIDAD'] === 'NACIONAL' ? 'PER 🇵🇪' : 'EXT ✈️',
      (u['Fecha Registro'] || '').split(' ')[0].slice(0, 10),
    ];
    cx = margin + 2;
    row.forEach((cell, i) => {
      setFont('normal', 7, DARK);
      pdf.text(String(cell), cx, y + 5);
      cx += colW[i];
    });
    y += 7;
  });

  onProgress?.(40);

  // ─── PAGE 3: PAGOS ──────────────────────────────────────────────────────────
  addPage();
  const totalIngresos = pagos.reduce((s, p) => s + (parseFloat(p['Monto ($)']) || 0), 0);
  const culqi = pagos.filter(p => p['Método Pago'] === 'CULQI').length;
  const bcp = pagos.filter(p => p['Método Pago'] === 'BCP').length;

  drawRect(margin, 12, contentW, 12, [254, 242, 242], 4);
  pdf.setDrawColor(...RED);
  pdf.setLineWidth(1.5);
  pdf.line(margin, 12, margin, 24);
  setFont('bold', 14, RED);
  pdf.text('2. Reporte de Pagos y Recaudación', margin + 5, 21);

  const pagoStats = [
    { l: 'Ingresos USD', v: `$${totalIngresos.toLocaleString()}`, c: [180, 83, 9] },
    { l: 'Transacciones', v: pagos.length, c: RED },
    { l: 'Via CULQI', v: culqi, c: [37, 99, 235] },
    { l: 'Via BCP', v: bcp, c: [22, 163, 74] },
  ];
  pagoStats.forEach((s, i) => {
    const x = margin + i * (boxW + 3);
    drawRect(x, 28, boxW, 22, LIGHT, 3);
    setFont('bold', 13, s.c);
    pdf.text(String(s.v), x + boxW / 2, 39, { align: 'center' });
    setFont('normal', 7, GRAY);
    pdf.text(s.l, x + boxW / 2, 46, { align: 'center' });
  });

  setFont('bold', 10, DARK);
  pdf.text('Detalle de todas las transacciones', margin, 60);

  const pagoHeaders = ['Fecha', 'Participante', 'Institución', 'Método', 'Monto (USD)'];
  const pagoColW = [22, 58, 62, 18, 22];
  y = 65;
  drawRect(margin, y, contentW, 7, RED, 2);
  cx = margin + 2;
  pagoHeaders.forEach((h, i) => {
    setFont('bold', 7.5, [255, 255, 255]);
    pdf.text(h, cx, y + 5);
    cx += pagoColW[i];
  });
  y += 7;

  pagos.forEach((p, idx) => {
    if (y > H - 22) { addPage(); y = 18; }
    const bg = idx % 2 === 0 ? [255, 255, 255] : [249, 250, 251];
    drawRect(margin, y, contentW, 7, bg, 0);
    const row = [
      (p['Fecha Registro'] || '').split(' ')[0],
      (p['Nombre Completo'] || '').slice(0, 26),
      (p['Institución'] || '').slice(0, 30),
      p['Método Pago'] || '',
      `$${parseFloat(p['Monto ($)'] || 0).toLocaleString()}`,
    ];
    cx = margin + 2;
    row.forEach((cell, i) => {
      setFont(i === 4 ? 'bold' : 'normal', 7, i === 4 ? [22, 163, 74] : DARK);
      pdf.text(String(cell), cx, y + 5);
      cx += pagoColW[i];
    });
    y += 7;
  });

  onProgress?.(65);

  // ─── PAGE 4+: RESÚMENES ─────────────────────────────────────────────────────
  addPage();
  const orales = resumenes.filter(r => r['MODALIDAD'] === 'ORAL').length;
  const posters = resumenes.filter(r => r['MODALIDAD'] === 'POSTER').length;

  drawRect(margin, 12, contentW, 12, [254, 242, 242], 4);
  pdf.setDrawColor(...RED);
  pdf.setLineWidth(1.5);
  pdf.line(margin, 12, margin, 24);
  setFont('bold', 14, RED);
  pdf.text('3. Catálogo de Resúmenes Científicos', margin + 5, 21);

  const resStats = [
    { l: 'Total Resúmenes', v: resumenes.length, c: RED },
    { l: 'Presentaciones Orales', v: orales, c: [37, 99, 235] },
    { l: 'Pósters', v: posters, c: GOLD },
    { l: 'Áreas Temáticas', v: new Set(resumenes.map(r => r['Línea'])).size, c: [22, 163, 74] },
  ];
  resStats.forEach((s, i) => {
    const x = margin + i * (boxW + 3);
    drawRect(x, 28, boxW, 22, LIGHT, 3);
    setFont('bold', 14, s.c);
    pdf.text(String(s.v), x + boxW / 2, 39, { align: 'center' });
    setFont('normal', 7, GRAY);
    pdf.text(s.l, x + boxW / 2, 46, { align: 'center' });
  });

  y = 56;
  resumenes.forEach((r, idx) => {
    const titleLines = pdf.splitTextToSize(r['Título'] || '', contentW - 22);
    const rowH = Math.max(14, titleLines.length * 4 + 8);
    if (y + rowH > H - 20) { addPage(); y = 18; }

    const bg = idx % 2 === 0 ? [255, 255, 255] : [249, 250, 251];
    drawRect(margin, y, contentW, rowH, bg, 2);

    // Modalidad badge
    const badgeColor = r['MODALIDAD'] === 'ORAL' ? RED : [37, 99, 235];
    drawRect(margin + 1, y + 2, 10, 5, badgeColor, 1.5);
    setFont('bold', 6, [255, 255, 255]);
    pdf.text(r['MODALIDAD'] === 'ORAL' ? 'ORAL' : 'POST', margin + 3, y + 6);

    // Title
    setFont('bold', 7.5, DARK);
    pdf.text(titleLines, margin + 13, y + 6);

    // Area badge
    const linea = (r['Línea'] || '').slice(0, 30);
    setFont('normal', 6.5, GOLD);
    pdf.text(`📌 ${linea}`, margin + 13, y + rowH - 4);

    // Date
    setFont('normal', 6.5, GRAY);
    pdf.text((r['Fecha Envío'] || '').split(' ')[0], W - margin - 2, y + 6, { align: 'right' });

    y += rowH + 2;
  });

  onProgress?.(85);

  // ─── LAST PAGE: CONFIRMADOS ─────────────────────────────────────────────────
  addPage();
  drawRect(margin, 12, contentW, 12, [254, 242, 242], 4);
  pdf.setDrawColor(...RED);
  pdf.setLineWidth(1.5);
  pdf.line(margin, 12, margin, 24);
  setFont('bold', 14, RED);
  pdf.text('4. Estado de Confirmación', margin + 5, 21);

  // Build confirmados list
  const pagosMap = {};
  pagos.forEach(p => {
    const key = (p['Nombre Completo'] || '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    pagosMap[key] = p;
  });

  const confirmados = usuarios.map(u => {
    const key = (u['Nombre'] || '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    let pago = pagosMap[key];
    if (!pago) {
      const found = Object.keys(pagosMap).find(k =>
        k.includes(key.split(' ')[0]) && k.includes(key.split(' ').slice(-1)[0])
      );
      if (found) pago = pagosMap[found];
    }
    return { ...u, pago };
  });
  const pagados = confirmados.filter(c => c.pago);
  const pendientes = confirmados.filter(c => !c.pago);

  // Progress bar
  const barTotal = contentW;
  const barFill = (pagados.length / usuarios.length) * barTotal;
  drawRect(margin, 28, barTotal, 8, [220, 252, 231], 4);
  drawRect(margin, 28, barFill, 8, [22, 163, 74], 4);
  setFont('bold', 8, [22, 163, 74]);
  pdf.text(`✓ ${pagados.length} pagados (${((pagados.length / usuarios.length) * 100).toFixed(1)}%)`, margin + 3, 34);
  setFont('bold', 8, [217, 119, 6]);
  pdf.text(`⏳ ${pendientes.length} pendientes`, W - margin - 2, 34, { align: 'right' });

  // Pagados
  y = 42;
  setFont('bold', 10, [22, 163, 74]);
  pdf.text(`✅ Pagados (${pagados.length})`, margin, y);
  y += 6;
  drawRect(margin, y, contentW, 7, [22, 163, 74], 2);
  ['Nombre', 'Institución', 'Método', 'Monto', 'Fecha Pago'].forEach((h, i) => {
    setFont('bold', 7.5, [255, 255, 255]);
    pdf.text(h, margin + 2 + [0, 54, 110, 130, 148][i], y + 5);
  });
  y += 7;
  pagados.forEach((c, idx) => {
    if (y > H - 22) { addPage(); y = 18; }
    drawRect(margin, y, contentW, 6, idx % 2 === 0 ? [240, 253, 244] : [255, 255, 255], 0);
    const cols = [
      (c['Nombre'] || '').slice(0, 25),
      (c['Institución'] || '').slice(0, 25),
      c.pago?.['Método Pago'] || '',
      `$${parseFloat(c.pago?.['Monto ($)'] || 0)}`,
      (c.pago?.['Fecha Registro'] || '').split(' ')[0],
    ];
    cols.forEach((val, i) => {
      setFont('normal', 7, i === 3 ? [22, 163, 74] : DARK);
      pdf.text(val, margin + 2 + [0, 54, 110, 130, 148][i], y + 4.5);
    });
    y += 6;
  });

  // Pendientes
  y += 8;
  if (y > H - 40) { addPage(); y = 18; }
  setFont('bold', 10, [217, 119, 6]);
  pdf.text(`⏳ Pendientes de Pago (${pendientes.length})`, margin, y);
  y += 6;
  drawRect(margin, y, contentW, 7, [217, 119, 6], 2);
  setFont('bold', 7.5, [255, 255, 255]);
  pdf.text('Nombre', margin + 2, y + 5);
  pdf.text('Institución', margin + 56, y + 5);
  pdf.text('Categoría', margin + 120, y + 5);
  pdf.text('Fecha Registro', margin + 158, y + 5);
  y += 7;
  pendientes.forEach((c, idx) => {
    if (y > H - 22) { addPage(); y = 18; }
    drawRect(margin, y, contentW, 6, idx % 2 === 0 ? [255, 251, 235] : [255, 255, 255], 0);
    setFont('normal', 7, DARK);
    pdf.text((c['Nombre'] || '').slice(0, 26), margin + 2, y + 4.5);
    pdf.text((c['Institución'] || '').slice(0, 28), margin + 56, y + 4.5);
    pdf.text((c['Categoría'] || '').replace('_', ' ').slice(0, 18), margin + 120, y + 4.5);
    pdf.text((c['Fecha Registro'] || '').split(' ')[0], margin + 158, y + 4.5);
    y += 6;
  });

  onProgress?.(100);

  // Footer all pages
  const totalPages = pdf.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    drawRect(0, H - 10, W, 10, DARK);
    setFont('normal', 7, [148, 163, 184]);
    pdf.text('ONTA Perú 2026 — Reporte Ejecutivo', margin, H - 4);
    pdf.text(`${i} / ${totalPages}`, W - margin, H - 4, { align: 'right' });
  }

  pdf.save(`ONTA_Peru_2026_Reporte_${new Date().toISOString().slice(0, 10)}.pdf`);
}
