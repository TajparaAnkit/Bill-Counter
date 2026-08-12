// PDF invoice generator.
//
// NOTE: We intentionally do NOT rasterize the DOM with html2canvas/html2pdf.
// This app runs Tailwind v4, whose color utilities compile to `oklch(...)`,
// and html2canvas throws on oklch color functions ("unsupported color
// function"). Instead we draw a clean, vector invoice with jsPDF + autotable:
// crisp selectable text, tiny file size, and full control over formatting.

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

// --- data shapes (kept loose so we don't couple to the app's exact types) ---
export interface PdfBill {
  billNo: string;
  customerName: string;
  createdAt?: any;
  items: { productName: string; quantity: number; price: number; total: number }[];
  subtotal: number;
  discount?: number;
  taxRate?: number;
  tax?: number;
  total: number;
  notes?: string;
}

export interface PdfProfile {
  businessName?: string;
  address?: string;
  phone?: string;
  invoiceNotes?: string;
  upiId?: string;
  gstin?: string;
}

const toDate = (t: any): Date => {
  if (!t) return new Date();
  if (t.toDate) return t.toDate();
  if (t.seconds) return new Date(t.seconds * 1000);
  return new Date(t);
};

const formatDate = (t: any) =>
  toDate(t).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

// jsPDF's built-in Helvetica has no rupee (₹) glyph, so we use "Rs." — this
// keeps the amount readable in every viewer instead of rendering a tofu box.
import { INVOICE_QR, INVOICE_QR_CAPTION } from '../assets/qr';
import { generateUpiQrDataUrl } from './upiQr';

const money = (n: number) =>
  'Rs. ' +
  Number(n || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

// jsPDF's addImage cannot consume an SVG data URL directly, so rasterize any
// image source (SVG/PNG/JPEG data URL, or a hosted URL) to a PNG data URL via
// an offscreen canvas first. Works uniformly for the sample QR and a
// user-supplied replacement.
const toPngDataUrl = (src: string, size = 240): Promise<string> =>
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

const TEAL: [number, number, number] = [30, 58, 138]; // navy (blue-900) — corporate accent
const DARK: [number, number, number] = [30, 41, 59]; // slate-800
const GRAY: [number, number, number] = [100, 116, 139]; // slate-500
const LIGHT: [number, number, number] = [226, 232, 240]; // slate-200

// Builds the invoice document and returns the jsPDF instance (not saved).
const buildInvoiceDoc = async (bill: PdfBill, profile: PdfProfile | null) => {
  const jsPDF = await ensureJsPDF();
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

  const pageW = doc.internal.pageSize.getWidth(); // 210
  const pageH = doc.internal.pageSize.getHeight(); // 297
  const M = 15; // margin
  const rightX = pageW - M;
  const business = profile?.businessName || 'Bill Counter';

  // ---- Header: INVOICE title (left) + business block (right) ----
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(30);
  doc.setTextColor(...TEAL);
  doc.text('INVOICE', M, 25);

  doc.setFontSize(14);
  doc.setTextColor(...DARK);
  doc.text(business, rightX, 20, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  let by = 26;
  if (profile?.address) {
    const lines = doc.splitTextToSize(profile.address, 75) as string[];
    doc.text(lines, rightX, by, { align: 'right' });
    by += lines.length * 4;
  }
  if (profile?.phone) {
    doc.text(`Phone: ${profile.phone}`, rightX, by, { align: 'right' });
    by += 4;
  }
  if (profile?.gstin) {
    doc.text(`GSTIN: ${profile.gstin}`, rightX, by, { align: 'right' });
  }

  // Invoice meta under the title
  doc.setFontSize(10);
  doc.setTextColor(...GRAY);
  doc.text('Invoice No:', M, 33);
  doc.text('Date:', M, 39);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...DARK);
  doc.text(bill.billNo, M + 22, 33);
  doc.text(formatDate(bill.createdAt), M + 22, 39);

  // Divider
  doc.setDrawColor(...LIGHT);
  doc.setLineWidth(0.3);
  doc.line(M, 45, rightX, 45);

  // ---- Billed To ----
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text('BILLED TO', M, 53);
  doc.setFontSize(12);
  doc.setTextColor(...DARK);
  doc.text(bill.customerName || '-', M, 59);

  // ---- Items table ----
  (doc as any).autoTable({
    startY: 65,
    head: [['Item', 'Qty', 'Price', 'Total']],
    body: bill.items.map((it) => [
      it.productName,
      String(it.quantity),
      money(it.price),
      money(it.total),
    ]),
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 10,
      cellPadding: 3,
      textColor: DARK,
      lineColor: LIGHT,
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: TEAL,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'left',
    },
    columnStyles: {
      0: { halign: 'left' },
      1: { halign: 'center', cellWidth: 22 },
      2: { halign: 'right', cellWidth: 35 },
      3: { halign: 'right', cellWidth: 35, fontStyle: 'bold' },
    },
    margin: { left: M, right: M },
  });

  // ---- Totals block (right aligned, below the table) ----
  let y = ((doc as any).lastAutoTable?.finalY || 65) + 12;
  const labelX = rightX - 60;
  const line = (label: string, value: string, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(bold ? 12 : 10);
    doc.setTextColor(...(bold ? DARK : GRAY));
    doc.text(label, labelX, y);
    doc.text(value, rightX, y, { align: 'right' });
    y += bold ? 8 : 6;
  };
  line('Subtotal', money(bill.subtotal));
  if ((bill.discount || 0) > 0) line('Discount', `- ${money(bill.discount || 0)}`);
  if ((bill.taxRate || 0) > 0) line(`Tax (${bill.taxRate}%)`, money(bill.tax || 0));
  doc.setDrawColor(...LIGHT);
  doc.line(labelX, y - 3, rightX, y - 3);
  line('Total Due', money(bill.total), true);

  // ---- Notes / terms (left, aligned with totals top) ----
  const noteText = bill.notes || profile?.invoiceNotes;
  if (noteText) {
    let ny = ((doc as any).lastAutoTable?.finalY || 65) + 12;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.text('NOTES / TERMS', M, ny);
    ny += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...DARK);
    const lines = doc.splitTextToSize(noteText, 100) as string[];
    doc.text(lines, M, ny);
  }

  // ---- Payment QR (real UPI scan-to-pay if a UPI ID is set, else the
  //      decorative sample). QR is optional — never block the download. ----
  try {
    let qrPng: string | null = null;
    let caption = INVOICE_QR_CAPTION;

    if (profile?.upiId) {
      qrPng = await generateUpiQrDataUrl({
        upiId: profile.upiId,
        payeeName: business,
        amount: bill.total,
        note: bill.billNo,
      });
      caption = `Scan to pay ${money(bill.total)}`;
    }
    if (!qrPng) {
      qrPng = await toPngDataUrl(INVOICE_QR, 240);
      caption = INVOICE_QR_CAPTION;
    }

    if (qrPng) {
      const qrSize = 28; // mm
      const qy = pageH - qrSize - 22;
      doc.addImage(qrPng, 'PNG', M, qy, qrSize, qrSize);
      if (caption) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...GRAY);
        doc.text(caption, M, qy + qrSize + 5);
      }
    }
  } catch {
    // QR is optional — never block the invoice download if it fails to render.
  }

  // ---- Footer ----
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.text(`Thank you for supporting ${business}!`, pageW / 2, pageH - 15, {
    align: 'center',
  });

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
