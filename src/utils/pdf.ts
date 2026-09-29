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
import { docLabels, isQuotation } from './docs';
import { generateUpiQrDataUrl } from './upiQr';
import type { TemplateChoice } from '../config/invoiceTemplates';

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

export const ensureJsPDF = async (): Promise<any> => {
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
export const toPng = (
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

const NAVY: [number, number, number] = [91, 50, 214]; // brand-700 #5b32d6
const DARK: [number, number, number] = [37, 37, 49]; // slate-800 #252531
const GRAY: [number, number, number] = [112, 112, 126]; // slate-500 #70707e
const LIGHT: [number, number, number] = [231, 231, 238]; // slate-200 #e7e7ee
const CHIP: [number, number, number] = [232, 232, 255]; // brand-100 #e8e8ff
const HEAD: [number, number, number] = [232, 232, 255]; // brand-100 #e8e8ff
const BAND: [number, number, number] = [243, 243, 249]; // slate-100 #f3f3f9

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
    // myBillCounter mark fallback
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
  const labels = docLabels(bill);
  const quote = isQuotation(bill);
  doc.text(labels.title.toUpperCase(), metaX, my);
  const badge = bill.cancelled ? 'CANCELLED' : quote ? '' : 'ORIGINAL FOR RECIPIENT';
  if (badge) {
    const badgeColor: [number, number, number] = bill.cancelled ? [225, 29, 72] : GRAY;
    setText(6.5, 'bold', badgeColor);
    const bw = doc.getTextWidth(badge) + 4;
    doc.setDrawColor(...(bill.cancelled ? badgeColor : LIGHT));
    doc.rect(rightX - bw, my - 3.8, bw, 5.2);
    doc.text(badge, rightX - bw / 2, my - 0.2, { align: 'center' });
  }
  my += 7;

  const meta: [string, string][] = [
    [labels.no, bill.billNo],
    [labels.date, bill.invoiceDate ? formatISO(bill.invoiceDate) : formatDate(bill.createdAt)],
  ];
  if (bill.dueDate) meta.push([labels.due, formatISO(bill.dueDate)]);
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
  if (!quote) {
    line('Received Amount', money(bill.amountPaid || 0));
    const balance = Math.max(0, (bill.total || 0) - (bill.amountPaid || 0));
    if ((bill.amountPaid || 0) > 0 && balance > 0) line('Balance', money(balance), true, 8.5);
  }

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

// Classic (no template, or 'classic') is the original layout above, unchanged.
// Other designs live in pdfTemplates.ts and are only loaded when used.
const buildDoc = async (bill: PdfBill, profile: PdfProfile | null, template?: TemplateChoice) =>
  template && template.id !== 'classic'
    ? (await import('./pdfTemplates')).buildTemplateDoc(bill, profile, template)
    : buildInvoiceDoc(bill, profile);

// Builds and triggers a download of the invoice PDF.
export const generateInvoicePDF = async (
  bill: PdfBill,
  profile: PdfProfile | null,
  filename: string,
  template?: TemplateChoice
) => {
  const doc = await buildDoc(bill, profile, template);
  doc.save(filename);
};

// Builds the invoice and returns it as a File, ready for the Web Share API
// (or an <a download>). Returns null if generation fails.
export const generateInvoicePdfFile = async (
  bill: PdfBill,
  profile: PdfProfile | null,
  filename: string,
  template?: TemplateChoice
): Promise<File | null> => {
  try {
    const doc = await buildDoc(bill, profile, template);
    const blob: Blob = doc.output('blob');
    return new File([blob], filename, { type: 'application/pdf' });
  } catch (err) {
    console.error('Failed to build invoice PDF file:', err);
    return null;
  }
};

// ==========================================
// PARTY STATEMENT (LEDGER)
// ==========================================
// Layout follows myBillBook's Party Ledger: business header, "To" party block,
// period + receivable box, then Date / Voucher / Sr No / Credit / Debit /
// Balance table and a closing-balance footer.

export interface PdfStatementParty {
  name: string;
  phone?: string;
  address?: string;
  gstin?: string;
}

export interface PdfStatement {
  party: PdfStatementParty;
  periodLabel: string; // e.g. "01 Apr 2026 - 28 Sep 2026"
  entries: { date: Date; voucher: string; srNo: string; debit: number; credit: number; balance: number }[];
  totalDebit: number;
  totalCredit: number;
  closingBalance: number;
}

const drCr = (n: number) => (Math.abs(n) < 0.005 ? num(0) : `${num(Math.abs(n))} ${n > 0 ? 'Dr' : 'Cr'}`);
const shortDate = (d: Date) => d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

const buildStatementDoc = async (st: PdfStatement, profile: PdfProfile | null) => {
  const jsPDF = await ensureJsPDF();
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const M = 14;
  const rightX = pageW - M;

  const setText = (size: number, style: 'normal' | 'bold' = 'normal', color: [number, number, number] = DARK) => {
    doc.setFont('helvetica', style);
    doc.setFontSize(size);
    doc.setTextColor(...color);
  };

  // ---- Business header ----
  const sellerName = profile?.businessName?.trim() || BRAND_NAME;
  let y = M + 2;
  let textX = M;
  const logo = profile?.logoUrl ? await toPng(profile.logoUrl, 300) : null;
  if (logo) {
    const box = 16;
    const ratio = logo.w / logo.h;
    doc.addImage(logo.dataUrl, 'PNG', M, y, ratio >= 1 ? box : box * ratio, ratio >= 1 ? box / ratio : box);
    textX = M + box + 4;
  }
  setText(13, 'bold', NAVY);
  doc.text(sellerName, textX, y + 5);
  setText(8.5, 'normal', GRAY);
  const sellerBits = [
    profile?.phone ? `Mobile: ${profile.phone}` : '',
    profile?.gstRegistered !== false && profile?.gstin ? `GSTIN: ${profile.gstin}` : '',
  ].filter(Boolean);
  if (sellerBits.length) doc.text(sellerBits.join('   |   '), textX, y + 10);

  setText(12, 'bold', DARK);
  doc.text('PARTY LEDGER', rightX, y + 5, { align: 'right' });
  setText(8.5, 'normal', GRAY);
  doc.text(st.periodLabel, rightX, y + 10, { align: 'right' });

  y += 20;
  doc.setDrawColor(...LIGHT);
  doc.setLineWidth(0.3);
  doc.line(M, y, rightX, y);
  y += 7;

  // ---- "To" party block (left) + receivable box (right) ----
  setText(8, 'bold', GRAY);
  doc.text('To,', M, y);
  setText(10.5, 'bold', DARK);
  doc.text(st.party.name.toUpperCase(), M, y + 5);
  setText(8.5, 'normal', DARK);
  let py = y + 10;
  if (st.party.address) {
    const lines = doc.splitTextToSize(st.party.address, 100) as string[];
    doc.text(lines, M, py);
    py += lines.length * 3.8;
  }
  if (st.party.phone) {
    doc.text(`Mobile: ${st.party.phone}`, M, py);
    py += 3.8;
  }
  if (st.party.gstin) {
    doc.text(`GSTIN: ${st.party.gstin}`, M, py);
    py += 3.8;
  }

  const boxW = 70;
  const boxX = rightX - boxW;
  const receivable = st.closingBalance >= 0;
  doc.setFillColor(...HEAD);
  doc.setDrawColor(...HEAD);
  doc.roundedRect(boxX, y - 4, boxW, 18, 2, 2, 'F');
  setText(8, 'bold', GRAY);
  doc.text(receivable ? 'Total Receivable' : 'Total Payable', boxX + 4, y + 1.5);
  setText(13, 'bold', receivable ? DARK : NAVY);
  doc.text(money(Math.abs(st.closingBalance)), boxX + 4, y + 9.5);

  y = Math.max(py, y + 16) + 5;

  // ---- Ledger table ----
  const body = st.entries.map((e) => [
    shortDate(e.date),
    e.voucher,
    e.srNo || '-',
    e.credit ? num(e.credit) : '-',
    e.debit ? num(e.debit) : '-',
    drCr(e.balance),
  ]);

  (doc as any).autoTable({
    startY: y,
    head: [['DATE', 'VOUCHER', 'SR NO', 'CREDIT', 'DEBIT', 'BALANCE']],
    body,
    foot: [['', 'TOTAL', '', num(st.totalCredit), num(st.totalDebit), drCr(st.closingBalance)]],
    theme: 'plain',
    styles: { font: 'helvetica', fontSize: 8.5, cellPadding: 2.2, textColor: DARK, lineColor: LIGHT, lineWidth: { bottom: 0.2 } },
    headStyles: { fillColor: HEAD, textColor: DARK, fontStyle: 'bold', fontSize: 7.5, lineWidth: 0 },
    footStyles: { fillColor: BAND, textColor: DARK, fontStyle: 'bold', lineWidth: 0 },
    columnStyles: {
      0: { cellWidth: 26 },
      1: { cellWidth: 36 },
      2: { cellWidth: 28 },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right', fontStyle: 'bold' },
    },
    didParseCell: (data: any) => {
      if (data.section !== 'head' && data.section !== 'foot') return;
      if (data.column.index >= 3) data.cell.styles.halign = 'right';
    },
    margin: { left: M, right: M },
  });

  // ---- Closing balance ----
  let ty = ((doc as any).lastAutoTable?.finalY || y + 30) + 8;
  if (ty > pageH - 30) {
    doc.addPage();
    ty = M + 6;
  }
  setText(9.5, 'bold', DARK);
  doc.text('Closing Balance', rightX - 70, ty);
  doc.text(drCr(st.closingBalance), rightX, ty, { align: 'right' });
  setText(8, 'normal', GRAY);
  doc.text(
    receivable ? 'Amount to be collected from the party' : 'Amount to be paid to the party',
    rightX,
    ty + 4.5,
    { align: 'right' }
  );

  // ---- Footer on every page ----
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    setText(7.5, 'normal', GRAY);
    doc.text(`Generated with ${BRAND_NAME}`, M, pageH - 8);
    doc.text(`Page ${i} of ${pages}`, rightX, pageH - 8, { align: 'right' });
  }

  return doc;
};

export const generateStatementPDF = async (st: PdfStatement, profile: PdfProfile | null, filename: string) => {
  const doc = await buildStatementDoc(st, profile);
  doc.save(filename);
};

export const generateStatementPdfFile = async (
  st: PdfStatement,
  profile: PdfProfile | null,
  filename: string
): Promise<File | null> => {
  try {
    const doc = await buildStatementDoc(st, profile);
    const blob: Blob = doc.output('blob');
    return new File([blob], filename, { type: 'application/pdf' });
  } catch (err) {
    console.error('Failed to build statement PDF file:', err);
    return null;
  }
};

// Opens the statement in a new tab with the browser print dialog.
export const printStatementPDF = async (st: PdfStatement, profile: PdfProfile | null) => {
  const doc = await buildStatementDoc(st, profile);
  doc.autoPrint();
  window.open(doc.output('bloburl'), '_blank');
};
