// PDF invoice generator.
//
// NOTE: We intentionally do NOT rasterize the DOM with html2canvas/html2pdf.
// This app runs Tailwind v4, whose color utilities compile to `oklch(...)`,
// and html2canvas throws on oklch color functions ("unsupported color
// function"). Instead we draw a clean, vector invoice with jsPDF + autotable:
// crisp selectable text, tiny file size, and full control over formatting.
//
// Layout mirrors InvoicePaper.tsx (myBillBook-style): logo + seller block,
// TAX INVOICE meta table, Bill To / Ship To, items, totals, amount in words,
// signature.

import { BRAND_NAME } from '../config/brand';
import { Bill, UserProfile } from '../types';
import { amountInWords } from './tax';
import { INVOICE_QR, INVOICE_QR_CAPTION } from '../assets/qr';
import { generateUpiQrDataUrl } from './upiQr';

const CDN = {
  jspdf: 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  autotable:
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js',
};

const loadScript = (src: string): Promise<void> =>
  new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(s);
  });

const ensureJsPDF = async (): Promise<any> => {
  const w = window as any;
  if (!w.jspdf?.jsPDF) await loadScript(CDN.jspdf);
  if (!w.jspdf?.jsPDF) throw new Error('jsPDF failed to load');
  const jsPDF = w.jspdf.jsPDF;
  // autotable registers itself on the jsPDF prototype
  if (typeof (jsPDF.API as any)?.autoTable !== 'function') {
    await loadScript(CDN.autotable);
  }
  return jsPDF;
};

// --- data shapes: the app's own Bill / UserProfile types (id/userId optional
// so an unsaved draft can also be exported) ---
export type PdfBill = Omit<Bill, 'id' | 'userId'> & { id?: string; userId?: string };
export type PdfProfile = Partial<UserProfile>;

const toDate = (t: any): Date => {
  if (!t) return new Date();
  if (t.toDate) return t.toDate();
  if (t.seconds) return new Date(t.seconds * 1000);
  return new Date(t);
};

const fmt = (d: Date) => d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
const formatDate = (t: any) => fmt(toDate(t));
const formatISO = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : fmt(d);
};

// jsPDF's built-in Helvetica has no rupee (₹) glyph, so we use "Rs." — this
// keeps the amount readable in every viewer instead of rendering a tofu box.
const num = (n: number | undefined) =>
  Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const money = (n: number | undefined) => 'Rs. ' + num(n);

// Rasterize any image source (SVG/PNG/JPEG data URL or hosted URL) to a PNG
// data URL via an offscreen canvas, preserving aspect ratio inside a box.
// Returns the PNG plus its rendered width/height ratio so callers can place it.
const toPng = (
  src: string,
  maxSide = 400
): Promise<{ dataUrl: string; w: number; h: number } | null> =>
  new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('canvas 2d context unavailable');
        ctx.drawImage(img, 0, 0, w, h);
        resolve({ dataUrl: canvas.toDataURL('image/png'), w, h });
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });

const toPngSquare = (src: string, size = 240): Promise<string> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('canvas 2d context unavailable');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, size, size);
        ctx.drawImage(img, 0, 0, size, size);
        resolve(canvas.toDataURL('image/png'));
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => reject(new Error('QR image failed to load'));
    img.src = src;
  });

const NAVY: [number, number, number] = [75, 62, 207]; // brand-700
const DARK: [number, number, number] = [30, 41, 59]; // slate-800
const GRAY: [number, number, number] = [100, 116, 139]; // slate-500
const LIGHT: [number, number, number] = [226, 232, 240]; // slate-200
const CHIP: [number, number, number] = [226, 232, 240]; // slate-200
const HEAD: [number, number, number] = [233, 231, 255]; // brand-100
const BAND: [number, number, number] = [241, 245, 249]; // slate-100

// Builds the invoice document and returns the jsPDF instance (not saved).
const buildInvoiceDoc = async (bill: PdfBill, profile: PdfProfile | null) => {
  const jsPDF = await ensureJsPDF();
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

  const pageW = doc.internal.pageSize.getWidth(); // 210
  const pageH = doc.internal.pageSize.getHeight(); // 297
  const M = 14; // margin
  const rightX = pageW - M;
  const contentW = pageW - 2 * M;

  // ---- Seller (from Settings, with fallbacks) ----
  const sellerName = profile?.businessName?.trim() || BRAND_NAME;
  const sellerAddress = [
    profile?.address,
    [profile?.city, profile?.state].filter(Boolean).join(', '),
    profile?.pincode,
  ]
    .filter(Boolean)
    .join(', ');
  const sellerGstin = profile?.gstRegistered === false ? '' : profile?.gstin || '';
  const sellerEmail = profile?.companyEmail || profile?.email || '';

  const setText = (size: number, style: 'normal' | 'bold' = 'normal', color: [number, number, number] = DARK) => {
    doc.setFont('helvetica', style);
    doc.setFontSize(size);
    doc.setTextColor(...color);
  };

  // ---- Header: logo + seller block (left) ----
  let y = M + 2;
  let textX = M;
  const logo = profile?.logoUrl ? await toPng(profile.logoUrl, 300) : null;
  const logoBox = 22;
  if (logo) {
    const ratio = logo.w / logo.h;
    const lw = ratio >= 1 ? logoBox : logoBox * ratio;
    const lh = ratio >= 1 ? logoBox / ratio : logoBox;
    doc.addImage(logo.dataUrl, 'PNG', M, y, lw, lh);
    textX = M + logoBox + 4;
  } else {
    // Bill Counter mark fallback
    doc.setFillColor(...NAVY);
    doc.roundedRect(M, y, 18, 18, 3, 3, 'F');
    setText(12, 'bold', [255, 255, 255]);
    doc.text('BC', M + 9, y + 11.5, { align: 'center' });
    textX = M + 22;
  }

  const sellerW = 105 - (textX - M);
  let sy = y + 4;
  setText(12, 'bold', NAVY);
  doc.text(doc.splitTextToSize(sellerName, sellerW)[0], textX, sy);
  sy += 5;
  setText(8.5, 'normal', DARK);
  const sellerLines: string[] = [];
  if (sellerAddress) sellerLines.push(...(doc.splitTextToSize(sellerAddress, sellerW) as string[]));
  if (sellerGstin) sellerLines.push(`GSTIN : ${sellerGstin}`);
  else if (profile?.pan) sellerLines.push(`PAN : ${profile.pan}`);
  if (profile?.phone) sellerLines.push(`Mobile : ${profile.phone}`);
  if (sellerEmail) sellerLines.push(`Email : ${sellerEmail}`);
  (profile?.businessDetails || []).forEach((d) => sellerLines.push(`${d.label} : ${d.value}`));
  sellerLines.forEach((l) => {
    doc.text(l, textX, sy);
    sy += 4;
  });

  // ---- Header: title + meta table (right) ----
  const metaX = rightX - 72;
  let my = y + 4;
  setText(12, 'bold', DARK);
  doc.text((bill.tax || 0) > 0 ? 'TAX INVOICE' : 'INVOICE', metaX, my);
  setText(6.5, 'bold', GRAY);
  const badge = 'ORIGINAL FOR RECIPIENT';
  const bw = doc.getTextWidth(badge) + 4;
  doc.setDrawColor(...LIGHT);
  doc.rect(rightX - bw, my - 3.8, bw, 5.2);
  doc.text(badge, rightX - bw / 2, my - 0.2, { align: 'center' });
  my += 7;

  const meta: [string, string][] = [
    ['Invoice No.', bill.billNo],
    ['Invoice Date', bill.invoiceDate ? formatISO(bill.invoiceDate) : formatDate(bill.createdAt)],
  ];
  if (bill.dueDate) meta.push(['Due Date', formatISO(bill.dueDate)]);
  if (bill.vehicleNo) meta.push(['Vehicle No.', bill.vehicleNo]);
  meta.forEach(([k, v]) => {
    setText(8.5, 'normal', GRAY);
    doc.text(k, metaX, my);
    doc.text(':', metaX + 30, my);
    setText(8.5, 'bold', DARK);
    doc.text(v, rightX, my, { align: 'right' });
    my += 4.8;
  });

  y = Math.max(sy, my, y + logoBox) + 4;

  // ---- Bill To / Ship To ----
  const billTo = bill.billTo || { name: bill.customerName, phone: bill.customerPhone };
  const shipTo = bill.shipTo && (bill.shipTo.address || bill.shipTo.name) ? bill.shipTo : null;
  const colW = shipTo ? contentW / 2 - 4 : contentW;

  const chip = (label: string, x: number, yy: number) => {
    setText(7, 'bold', DARK);
    const w = doc.getTextWidth(label) + 6;
    doc.setFillColor(...CHIP);
    doc.rect(x, yy - 3.6, w, 5, 'F');
    doc.text(label, x + 3, yy);
  };

  const partyBlock = (title: string, p: typeof billTo, x: number, y0: number, extra: string[] = []) => {
    let yy = y0;
    chip(title, x, yy);
    yy += 7;
    setText(9.5, 'bold', DARK);
    doc.text((p.name || '-').toUpperCase(), x, yy);
    yy += 4.5;
    setText(8.5, 'normal', DARK);
    if (p.address) {
      const lines = doc.splitTextToSize(p.address, colW) as string[];
      doc.text(lines, x, yy);
      yy += lines.length * 3.8;
    }
    const rows: string[] = [];
    if (p.phone) rows.push(`Mobile : ${p.phone}`);
    if (p.gstin) rows.push(`GSTIN : ${p.gstin}`);
    if (p.pan) rows.push(`PAN Number : ${p.pan}`);
    rows.push(...extra);
    rows.forEach((r) => {
      doc.text(r, x, yy);
      yy += 3.8;
    });
    return yy;
  };

  let afterParties = partyBlock('BILL TO', billTo, M, y, bill.placeOfSupply ? [`Place of Supply : ${bill.placeOfSupply}`] : []);
  if (shipTo) {
    afterParties = Math.max(afterParties, partyBlock('SHIP TO', { ...shipTo, name: shipTo.name || billTo.name }, M + colW + 8, y));
  }

  // ---- Items table ----
  const items = bill.items || [];
  const hasHsn = items.some((i) => i.hsn);
  const hasDisc = items.some((i) => (i.discount || 0) > 0);
  const hasTax = items.some((i) => (i.taxRate || 0) > 0);
  const isGst = bill.taxableAmount !== undefined || bill.cgst !== undefined || bill.igst !== undefined;

  const head = ['S.NO.', 'ITEMS'];
  if (hasHsn) head.push('HSN');
  head.push('QTY.', 'RATE');
  if (hasDisc) head.push('DISC.');
  if (hasTax) head.push('TAX');
  head.push('AMOUNT');

  const body = items.map((it, i) => {
    const row: string[] = [String(i + 1), (it.description ? `${it.productName.toUpperCase()}\n${it.description}` : it.productName.toUpperCase())];
    if (hasHsn) row.push(it.hsn || '-');
    row.push(`${it.quantity}${it.unit ? ' ' + it.unit : ''}`, num(it.price));
    if (hasDisc) row.push((it.discount || 0) > 0 ? num(it.discount) : '-');
    if (hasTax) row.push((it.taxRate || 0) > 0 ? `${num(it.taxAmount)}\n(${it.taxRate}%)` : '-');
    row.push(num(it.total));
    return row;
  });
  // keep the table a minimum height so short invoices look like the template
  for (let i = items.length; i < 4; i++) body.push(head.map(() => ''));

  const totalQty = items.reduce((s, i) => s + (i.quantity || 0), 0);
  const foot: string[] = ['', 'SUBTOTAL'];
  if (hasHsn) foot.push('');
  foot.push(String(totalQty), '');
  if (hasDisc) foot.push(money(bill.itemDiscount));
  if (hasTax) foot.push(money(bill.tax));
  foot.push(money(bill.subtotal));

  const columnStyles: Record<number, any> = { 0: { halign: 'center', cellWidth: 12 }, 1: { halign: 'left' } };
  let ci = 2;
  if (hasHsn) columnStyles[ci++] = { halign: 'left', cellWidth: 16 };
  columnStyles[ci++] = { halign: 'right', cellWidth: 20 };
  columnStyles[ci++] = { halign: 'right', cellWidth: 24 };
  if (hasDisc) columnStyles[ci++] = { halign: 'right', cellWidth: 20 };
  if (hasTax) columnStyles[ci++] = { halign: 'right', cellWidth: 24 };
  columnStyles[ci] = { halign: 'right', cellWidth: 28, fontStyle: 'bold' };

  (doc as any).autoTable({
    startY: afterParties + 4,
    head: [head],
    body,
    foot: [foot],
    theme: 'plain',
    styles: { font: 'helvetica', fontSize: 8.5, cellPadding: 2, textColor: DARK, valign: 'top' },
    headStyles: { fillColor: HEAD, textColor: DARK, fontStyle: 'bold', fontSize: 7.5 },
    footStyles: { fillColor: BAND, textColor: DARK, fontStyle: 'bold' },
    columnStyles,
    margin: { left: M, right: M },
  });

  // ---- Totals (right) ----
  const tableEnd = ((doc as any).lastAutoTable?.finalY || afterParties + 40) + 5;
  let ty = tableEnd;
  const labelX = rightX - 70;
  const line = (label: string, value: string, bold = false, size = 8.5) => {
    setText(size, bold ? 'bold' : 'normal', DARK);
    doc.text(label, labelX, ty);
    doc.text(value, rightX, ty, { align: 'right' });
    ty += bold ? 6 : 4.8;
  };
  const rate = bill.taxRate ? ` @${bill.taxRate / 2}%` : '';

  if (isGst) {
    if ((bill.itemDiscount || 0) > 0) line('Item Discount', `- ${money(bill.itemDiscount)}`);
    line('Taxable Amount', money(bill.taxableAmount));
    if ((bill.cgst || 0) > 0) line(`CGST${rate}`, money(bill.cgst));
    if ((bill.sgst || 0) > 0) line(`SGST${rate}`, money(bill.sgst));
    if ((bill.igst || 0) > 0) line(`IGST${bill.taxRate ? ` @${bill.taxRate}%` : ''}`, money(bill.igst));
    (bill.additionalCharges || []).filter((c) => c.amount > 0).forEach((c) => line(c.label || 'Additional Charge', money(c.amount)));
    if ((bill.billDiscount || 0) > 0) line('Discount', `- ${money(bill.billDiscount)}`);
    if (bill.roundOff) line('Round Off', `${bill.roundOff > 0 ? '+ ' : '- '}${money(Math.abs(bill.roundOff))}`);
  } else {
    line('Subtotal', money(bill.subtotal));
    if ((bill.discount || 0) > 0) line('Discount', `- ${money(bill.discount)}`);
    if ((bill.taxRate || 0) > 0) line(`Tax (${bill.taxRate}%)`, money(bill.tax));
  }
  doc.setDrawColor(...DARK);
  doc.setLineWidth(0.5);
  doc.line(labelX, ty - 2.5, rightX, ty - 2.5);
  ty += 1;
  line('Total Amount', money(bill.total), true, 10);
  doc.setDrawColor(...LIGHT);
  doc.setLineWidth(0.2);
  doc.line(labelX, ty - 4, rightX, ty - 4);
  line('Received Amount', money(bill.amountPaid || 0));
  const balance = Math.max(0, (bill.total || 0) - (bill.amountPaid || 0));
  if ((bill.amountPaid || 0) > 0 && balance > 0) line('Balance', money(balance), true, 8.5);

  // Amount in words (right aligned)
  ty += 3;
  setText(8.5, 'bold', DARK);
  doc.text('Total Amount (in words)', rightX, ty, { align: 'right' });
  ty += 4.2;
  setText(8.5, 'normal', DARK);
  const wordLines = doc.splitTextToSize(amountInWords(bill.total || 0), 80) as string[];
  wordLines.forEach((l) => {
    doc.text(l, rightX, ty, { align: 'right' });
    ty += 4;
  });

  // Signature
  ty += 4;
  const sig = profile?.signatureUrl ? await toPng(profile.signatureUrl, 400) : null;
  if (sig) {
    const sh = 16;
    const sw = Math.min(45, sh * (sig.w / sig.h));
    doc.addImage(sig.dataUrl, 'PNG', rightX - sw, ty, sw, sh);
    ty += sh + 2;
  } else {
    ty += 14;
  }
  setText(8.5, 'bold', DARK);
  doc.text('Authorised Signature for', rightX, ty, { align: 'right' });
  ty += 4;
  doc.text(sellerName, rightX, ty, { align: 'right' });
  const rightEnd = ty;

  // ---- Left column: notes, terms, bank, QR ----
  let ny = tableEnd;
  const leftW = labelX - M - 10;
  const section = (title: string, text: string) => {
    setText(8.5, 'bold', DARK);
    doc.text(title, M, ny);
    ny += 4.2;
    setText(8.5, 'normal', DARK);
    const lines = doc.splitTextToSize(text, leftW) as string[];
    doc.text(lines, M, ny);
    ny += lines.length * 3.8 + 3;
  };
  if (bill.notes) section('Notes', bill.notes);
  const terms = bill.termsAndConditions ?? (bill.notes ? undefined : profile?.invoiceNotes);
  if (terms) section('Terms & Conditions', terms);
  if (bill.showBankDetails && (profile?.bankAccountNo || profile?.bankName)) {
    const bank = [
      profile?.bankAccountHolder ? `Name: ${profile.bankAccountHolder}` : '',
      profile?.bankName ? `Bank: ${profile.bankName}` : '',
      profile?.bankAccountNo ? `Account No.: ${profile.bankAccountNo}` : '',
      profile?.bankIfsc ? `IFSC: ${profile.bankIfsc}` : '',
      profile?.bankBranch ? `Branch: ${profile.bankBranch}` : '',
    ]
      .filter(Boolean)
      .join('\n');
    section('Bank Details', bank);
  }

  // ---- Payment QR (optional; never block the download) ----
  try {
    if (bill.showPaymentQr === false) throw new Error('qr-hidden');
    let qrPng: string | null = null;
    let caption = INVOICE_QR_CAPTION;
    if (profile?.upiId) {
      qrPng = await generateUpiQrDataUrl({
        upiId: profile.upiId,
        payeeName: sellerName,
        amount: bill.total,
        note: bill.billNo,
      });
      caption = `Scan to pay ${money(bill.total)}`;
    }
    if (!qrPng) {
      qrPng = await toPngSquare(INVOICE_QR, 240);
      caption = INVOICE_QR_CAPTION;
    }
    if (qrPng) {
      const qrSize = 24;
      const qy = Math.min(pageH - qrSize - 18, ny + 1);
      doc.addImage(qrPng, 'PNG', M, qy, qrSize, qrSize);
      setText(8.5, 'bold', DARK);
      doc.text('Pay using UPI', M + qrSize + 3, qy + 5);
      setText(8, 'normal', GRAY);
      if (caption) doc.text(caption, M + qrSize + 3, qy + 9.5);
      if (profile?.upiId) doc.text(profile.upiId, M + qrSize + 3, qy + 14);
      ny = qy + qrSize + 4;
    }
  } catch {
    // QR is optional
  }

  // ---- Footer ----
  const footY = Math.max(rightEnd, ny) + 10;
  setText(7.5, 'normal', GRAY);
  doc.text(`Generated with ${BRAND_NAME}`, pageW / 2, Math.min(pageH - 8, Math.max(footY, pageH - 8)), { align: 'center' });

  return doc;
};

// Builds and triggers a download of the invoice PDF.
export const generateInvoicePDF = async (
  bill: PdfBill,
  profile: PdfProfile | null,
  filename: string
) => {
  const doc = await buildInvoiceDoc(bill, profile);
  doc.save(filename);
};

// Builds the invoice and returns it as a File, ready for the Web Share API
// (or an <a download>). Returns null if generation fails.
export const generateInvoicePdfFile = async (
  bill: PdfBill,
  profile: PdfProfile | null,
  filename: string
): Promise<File | null> => {
  try {
    const doc = await buildInvoiceDoc(bill, profile);
    const blob: Blob = doc.output('blob');
    return new File([blob], filename, { type: 'application/pdf' });
  } catch (err) {
    console.error('Failed to build invoice PDF file:', err);
    return null;
  }
};
