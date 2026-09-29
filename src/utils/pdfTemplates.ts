// PDFs for the non-Classic invoice designs (Modern, Minimal, Thermal 80/58 mm).
// Classic stays in pdf.ts. Data comes from invoiceView(), same as the on-screen designs.

import type { TemplateChoice } from '../config/invoiceTemplates';
import { BRAND_NAME } from '../config/brand';
import { PdfBill, PdfProfile, ensureJsPDF, toPng } from './pdf';
import { InvoiceViewData, invoiceView, num } from './invoiceView';
import { generateUpiQrDataUrl } from './upiQr';

type RGB = [number, number, number];
const hexToRgb = (hex: string): RGB => {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};
const DARK: RGB = [30, 30, 40];
const GRAY: RGB = [110, 110, 125];
const LIGHT: RGB = [228, 228, 236];
const WHITE: RGB = [255, 255, 255];
const PAPER: RGB = [247, 247, 250];

// jsPDF's built-in fonts have no ₹ glyph, same as Classic.
const rs = (n: number) => 'Rs. ' + num(n);
const signed = (l: InvoiceViewData['lines'][number]) => `${l.sign ? `${l.sign} ` : ''}${rs(l.value)}`;

const upiQr = async (v: InvoiceViewData) =>
  v.showQr && v.seller.upiId
    ? generateUpiQrDataUrl({ upiId: v.seller.upiId, payeeName: v.seller.name, amount: v.total, note: v.no }).catch(() => null)
    : null;

export const buildTemplateDoc = async (bill: PdfBill, profile: PdfProfile | null, t: TemplateChoice) => {
  const v = invoiceView(bill, profile);
  if (t.id === 'thermal80' || t.id === 'thermal58') return buildThermal(v, t.id === 'thermal58' ? 58 : 80);
  return buildA4(v, t.id === 'minimal' ? 'minimal' : 'modern', hexToRgb(t.color));
};

// ---------------------------------------------------------------------------
// A4: Modern + Minimal share the structure, differ in styling
// ---------------------------------------------------------------------------
const buildA4 = async (v: InvoiceViewData, style: 'modern' | 'minimal', accent: RGB) => {
  const jsPDF = await ensureJsPDF();
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const M = 14;
  const rightX = pageW - M;
  const contentW = pageW - 2 * M;
  const modern = style === 'modern';
  const ink: RGB = modern ? accent : DARK;

  const text = (size: number, weight: 'normal' | 'bold' | 'italic' = 'normal', color: RGB = DARK) => {
    doc.setFont('helvetica', weight);
    doc.setFontSize(size);
    doc.setTextColor(...color);
  };
  const sellerLines = [
    ...(v.seller.address ? (doc.splitTextToSize(v.seller.address, 105) as string[]) : []),
    v.seller.gstin ? `GSTIN: ${v.seller.gstin}` : v.seller.pan ? `PAN: ${v.seller.pan}` : '',
    [v.seller.phone, v.seller.email].filter(Boolean).join('  ·  '),
    ...v.seller.details.map((d) => `${d.label}: ${d.value}`),
  ].filter(Boolean);
  const logo = v.seller.logoUrl ? await toPng(v.seller.logoUrl, 300) : null;

  // ---- Header ----
  let y: number;
  if (modern) {
    const bandH = Math.max(40, 22 + sellerLines.length * 4.2);
    doc.setFillColor(...accent);
    doc.rect(0, 0, pageW, bandH, 'F');
    let tx = M;
    if (logo) {
      doc.setFillColor(...WHITE);
      doc.roundedRect(M, 10, 20, 20, 2.5, 2.5, 'F');
      const r = logo.w / logo.h;
      const lw = r >= 1 ? 17 : 17 * r;
      const lh = r >= 1 ? 17 / r : 17;
      doc.addImage(logo.dataUrl, 'PNG', M + 10 - lw / 2, 20 - lh / 2, lw, lh);
      tx = M + 25;
    }
    text(14, 'bold', WHITE);
    doc.text(v.seller.name, tx, 16);
    text(8.5, 'normal', WHITE);
    sellerLines.forEach((l, i) => doc.text(l, tx, 21.5 + i * 4.2));
    text(18, 'bold', WHITE);
    doc.text(v.labels.title.toUpperCase(), rightX, 17, { align: 'right' });
    text(10, 'bold', WHITE);
    doc.text(v.no, rightX, 24, { align: 'right' });
    if (v.cancelled) {
      doc.setFillColor(...WHITE);
      doc.roundedRect(rightX - 26, 28, 26, 6, 1, 1, 'F');
      text(7.5, 'bold', [225, 29, 72]);
      doc.text('CANCELLED', rightX - 13, 32.2, { align: 'center' });
    }
    y = bandH + 8;
  } else {
    text(22, 'normal', DARK);
    doc.setCharSpace(1.6);
    doc.text(v.labels.title.toUpperCase(), M, 24);
    doc.setCharSpace(0);
    text(8.5, 'normal', GRAY);
    const meta = [`${v.labels.no} ${v.no}`, `${v.labels.date} ${v.date}${v.due ? `   ·   ${v.labels.due} ${v.due}` : ''}`];
    meta.forEach((m, i) => doc.text(m, M, 31 + i * 4.5));
    if (v.cancelled) {
      doc.setDrawColor(225, 29, 72);
      doc.rect(M, 38.5, 24, 5.5);
      text(7, 'bold', [225, 29, 72]);
      doc.text('CANCELLED', M + 12, 42.2, { align: 'center' });
    }
    let sy = 18;
    if (logo) {
      const r = logo.w / logo.h;
      const lh = 12;
      const lw = Math.min(36, lh * r);
      doc.addImage(logo.dataUrl, 'PNG', rightX - lw, 10, lw, lw / r);
      sy = 10 + lw / r + 5;
    }
    text(11, 'bold', DARK);
    doc.text(v.seller.name, rightX, sy, { align: 'right' });
    text(8, 'normal', GRAY);
    sellerLines.forEach((l, i) => doc.text(l, rightX, sy + 4.6 + i * 3.9, { align: 'right' }));
    y = Math.max(48, sy + 6 + sellerLines.length * 3.9);
    doc.setDrawColor(...accent);
    doc.setLineWidth(0.8);
    doc.line(M, y, rightX, y);
    doc.setLineWidth(0.2);
    y += 8;
  }

  // ---- Meta row (Modern) ----
  if (modern) {
    const cells = [
      [v.labels.date, v.date],
      [v.labels.due, v.due],
      ['Place of Supply', v.placeOfSupply],
      ['Vehicle No.', v.vehicleNo],
    ].filter(([, val]) => val);
    const cw = (contentW - (cells.length - 1) * 3) / Math.max(1, cells.length);
    cells.forEach(([k, val], i) => {
      const x = M + i * (cw + 3);
      doc.setFillColor(...PAPER);
      doc.roundedRect(x, y, cw, 12, 1.5, 1.5, 'F');
      text(6.5, 'bold', GRAY);
      doc.text(k.toUpperCase(), x + 3, y + 4.5);
      text(9, 'bold', DARK);
      doc.text(val, x + 3, y + 9.5);
    });
    y += 18;
  }

  // ---- Parties ----
  const colW = v.shipTo ? contentW / 2 - 4 : contentW;
  const party = (title: string, p: InvoiceViewData['billTo'], x: number, extra: string[] = []) => {
    const rows = [
      ...(p.address ? (doc.splitTextToSize(p.address, colW - 8) as string[]) : []),
      p.phone ? `Mobile: ${p.phone}` : '',
      p.gstin ? `GSTIN: ${p.gstin}` : '',
      p.pan ? `PAN: ${p.pan}` : '',
      ...extra,
    ].filter(Boolean);
    const h = 13 + rows.length * 3.9;
    if (modern) {
      doc.setDrawColor(...LIGHT);
      doc.roundedRect(x, y, colW, h, 2, 2);
    }
    const ix = modern ? x + 4 : x;
    text(6.8, 'bold', modern ? accent : GRAY);
    doc.text(title.toUpperCase(), ix, y + 5);
    text(10, 'bold', DARK);
    doc.text(p.name || '-', ix, y + 10);
    text(8.3, 'normal', GRAY);
    rows.forEach((r, i) => doc.text(r, ix, y + 14.5 + i * 3.9));
    return h;
  };
  const pos = v.placeOfSupply && !modern ? [`Place of Supply: ${v.placeOfSupply}`] : [];
  let ph = party(modern ? 'Bill To' : 'Billed To', v.billTo, M, pos);
  if (v.shipTo) ph = Math.max(ph, party(modern ? 'Ship To' : 'Shipped To', { ...v.shipTo, name: v.shipTo.name || v.billTo.name }, M + colW + 8));
  y += ph + 6;

  // ---- Items ----
  const head = ['#', 'Item'];
  if (v.hasHsn) head.push('HSN');
  head.push('Qty', 'Rate');
  if (v.hasLineDiscount) head.push('Disc.');
  if (v.hasLineTax) head.push('Tax');
  head.push('Amount');
  const body = v.items.map((it, i) => {
    const row = [String(i + 1), it.description ? `${it.productName}\n${it.description}` : it.productName];
    if (v.hasHsn) row.push(it.hsn || '-');
    row.push(`${it.quantity}${it.unit ? ' ' + it.unit : ''}`, num(it.price));
    if (v.hasLineDiscount) row.push((it.discount || 0) > 0 ? num(it.discount) : '-');
    if (v.hasLineTax) row.push((it.taxRate || 0) > 0 ? `${num(it.taxAmount)}\n(${it.taxRate}%)` : '-');
    row.push(num(it.total));
    return row;
  });
  const colStyles: Record<number, any> = { 0: { cellWidth: 10, halign: 'center' } };
  let ci = 2;
  if (v.hasHsn) colStyles[ci++] = { cellWidth: 16 };
  colStyles[ci++] = { cellWidth: 20, halign: 'right' };
  colStyles[ci++] = { cellWidth: 24, halign: 'right' };
  if (v.hasLineDiscount) colStyles[ci++] = { cellWidth: 20, halign: 'right' };
  if (v.hasLineTax) colStyles[ci++] = { cellWidth: 24, halign: 'right' };
  colStyles[ci] = { cellWidth: 28, halign: 'right', fontStyle: 'bold' };

  (doc as any).autoTable({
    startY: y,
    head: [head],
    body,
    theme: 'plain',
    margin: { left: M, right: M },
    styles: { font: 'helvetica', fontSize: 8.5, textColor: DARK, cellPadding: { top: 2.4, bottom: 2.4, left: 2, right: 2 }, lineColor: LIGHT, lineWidth: { bottom: 0.2 } },
    headStyles: modern
      ? { fillColor: accent, textColor: WHITE, fontStyle: 'bold', fontSize: 8 }
      : { textColor: DARK, fontStyle: 'bold', fontSize: 8, lineColor: DARK, lineWidth: { top: 0.4, bottom: 0.4 } },
    alternateRowStyles: modern ? { fillColor: PAPER } : {},
    columnStyles: colStyles,
    didParseCell: (d: any) => {
      if (d.section === 'head' && d.column.index > 1 + (v.hasHsn ? 1 : 0)) d.cell.styles.halign = 'right';
    },
  });
  y = (doc as any).lastAutoTable.finalY + 6;

  // ---- Totals (right) ----
  const labelX = pageW / 2 + 12;
  let ty = y + 3;
  const line = (l: string, val: string, bold = false) => {
    text(8.8, bold ? 'bold' : 'normal', bold ? DARK : GRAY);
    doc.text(l, labelX, ty);
    text(8.8, bold ? 'bold' : 'normal', DARK);
    doc.text(val, rightX, ty, { align: 'right' });
    ty += 5;
  };
  v.lines.forEach((l) => line(l.label, signed(l)));
  ty += 1;
  if (modern) {
    doc.setFillColor(...accent);
    doc.roundedRect(labelX - 3, ty - 4.8, rightX - labelX + 3, 9, 1.5, 1.5, 'F');
    text(10.5, 'bold', WHITE);
    doc.text('Total Amount', labelX, ty + 1);
    doc.text(rs(v.total), rightX - 2, ty + 1, { align: 'right' });
    ty += 10;
  } else {
    doc.setDrawColor(...DARK);
    doc.setLineWidth(0.4);
    doc.line(labelX, ty - 3.5, rightX, ty - 3.5);
    doc.setLineWidth(0.2);
    text(10.5, 'bold', DARK);
    doc.text('Total Amount', labelX, ty + 1.5);
    doc.text(rs(v.total), rightX, ty + 1.5, { align: 'right' });
    ty += 8;
  }
  if (!v.quote) {
    line('Received Amount', rs(v.received));
    if (v.received > 0 && v.balance > 0) line('Balance', rs(v.balance), true);
  }
  text(8, modern ? 'normal' : 'italic', GRAY);
  (doc.splitTextToSize(v.words, rightX - labelX) as string[]).forEach((l) => {
    doc.text(l, rightX, ty + 1, { align: 'right' });
    ty += 4;
  });

  // Signature
  ty += 4;
  const sig = v.seller.signatureUrl ? await toPng(v.seller.signatureUrl, 400) : null;
  if (sig) {
    const sh = 15;
    const sw = Math.min(45, sh * (sig.w / sig.h));
    doc.addImage(sig.dataUrl, 'PNG', rightX - sw, ty, sw, sh);
    ty += sh + 2;
  } else ty += 13;
  text(8.5, 'bold', DARK);
  doc.text('Authorised Signature', rightX, ty, { align: 'right' });
  doc.text(v.seller.name, rightX, ty + 4, { align: 'right' });

  // ---- Left: notes, terms, bank, QR ----
  let ny = y + 3;
  const leftW = labelX - M - 10;
  const section = (title: string, body: string) => {
    text(8.5, 'bold', ink);
    doc.text(title, M, ny);
    ny += 4.2;
    text(8.2, 'normal', GRAY);
    const lines = doc.splitTextToSize(body, leftW) as string[];
    doc.text(lines, M, ny);
    ny += lines.length * 3.8 + 3;
  };
  if (v.notes) section('Notes', v.notes);
  if (v.terms) section('Terms & Conditions', v.terms);
  if (v.bank.length) section('Bank Details', v.bank.map(([k, val]) => `${k}: ${val}`).join('\n'));
  const qr = await upiQr(v);
  if (qr) {
    const s = 24;
    const qy = Math.min(pageH - s - 16, ny + 1);
    doc.addImage(qr, 'PNG', M, qy, s, s);
    text(8.5, 'bold', DARK);
    doc.text('Pay using UPI', M + s + 3, qy + 6);
    text(8, 'normal', GRAY);
    doc.text(`Scan to pay ${rs(v.total)}`, M + s + 3, qy + 10.5);
    doc.text(v.seller.upiId, M + s + 3, qy + 15);
  }

  text(7.5, 'normal', GRAY);
  doc.text(`Generated with ${BRAND_NAME}`, pageW / 2, pageH - 8, { align: 'center' });
  return doc;
};

// ---------------------------------------------------------------------------
// Thermal receipt: page as tall as the content (two passes: measure, then draw)
// ---------------------------------------------------------------------------
const buildThermal = async (v: InvoiceViewData, width: 80 | 58) => {
  const jsPDF = await ensureJsPDF();
  const qr = await upiQr(v);
  const narrow = width === 58;
  const M = 3;
  const W = width - 2 * M;
  const fs = narrow ? 7 : 8;
  const lh = fs * 0.46;

  const draw = (doc: any) => {
    let y = M + 3;
    const f = (size = fs, bold = false) => {
      doc.setFont('courier', bold ? 'bold' : 'normal');
      doc.setFontSize(size);
      doc.setTextColor(0, 0, 0);
    };
    const center = (s: string, size = fs, bold = false) => {
      f(size, bold);
      (doc.splitTextToSize(s, W) as string[]).forEach((l) => {
        doc.text(l, width / 2, y, { align: 'center' });
        y += size * 0.46;
      });
    };
    const row = (l: string, r: string, bold = false) => {
      f(fs, bold);
      const rw = doc.getTextWidth(r);
      const left = doc.splitTextToSize(l, Math.max(10, W - rw - 2)) as string[];
      left.forEach((ll, i) => {
        doc.text(ll, M, y);
        if (i === 0) doc.text(r, width - M, y, { align: 'right' });
        y += lh;
      });
    };
    const rule = () => {
      doc.setLineDashPattern([0.8, 0.8], 0);
      doc.setDrawColor(90, 90, 90);
      doc.line(M, y - lh / 2 + 0.6, width - M, y - lh / 2 + 0.6);
      doc.setLineDashPattern([], 0);
      y += lh * 0.8;
    };

    center(v.seller.name, fs + 2, true);
    if (v.seller.address) center(v.seller.address);
    if (v.seller.phone) center(`Ph: ${v.seller.phone}`);
    if (v.seller.gstin) center(`GSTIN: ${v.seller.gstin}`);
    y += 1;
    center(v.labels.title.toUpperCase(), fs + 1, true);
    if (v.cancelled) center('*** CANCELLED ***', fs, true);
    rule();
    row(v.labels.no.replace('.', ''), v.no);
    row('Date', v.date);
    if (v.billTo.name) row('To', v.billTo.name);
    if (v.billTo.gstin) row('GSTIN', v.billTo.gstin);
    rule();
    v.items.forEach((it) => {
      f(fs, true);
      (doc.splitTextToSize(it.productName, W) as string[]).forEach((l) => {
        doc.text(l, M, y);
        y += lh;
      });
      row(`${it.quantity} ${it.unit || ''} x ${num(it.price)}${(it.taxRate || 0) > 0 ? ` +${it.taxRate}%` : ''}`, num(it.total));
    });
    rule();
    v.lines.forEach((l) => row(l.label, `${l.sign === '-' ? '-' : ''}${num(l.value)}`));
    rule();
    row('TOTAL', `Rs. ${num(v.total)}`, true);
    if (!v.quote && v.received > 0) row('Received', num(v.received));
    if (!v.quote && v.received > 0 && v.balance > 0) row('Balance', num(v.balance), true);
    if (qr) {
      const s = narrow ? 26 : 32;
      y += 2;
      doc.addImage(qr, 'PNG', width / 2 - s / 2, y, s, s);
      y += s + 3;
      center('Scan to pay by UPI');
    }
    rule();
    center('Thank you! Visit again.');
    return y + M;
  };

  // Pass 1 on a tall scratch page just to measure, pass 2 on a page of the right height.
  const height = Math.ceil(draw(new jsPDF({ unit: 'mm', format: [width, 1000] })));
  const doc = new jsPDF({ unit: 'mm', format: [width, Math.max(height, 60)] });
  draw(doc);
  return doc;
};
