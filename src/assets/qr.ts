// ---------------------------------------------------------------------------
// Invoice QR / barcode image.
//
// This is a SAMPLE placeholder. To use your own QR or barcode, replace the
// value of INVOICE_QR below with any of:
//   • a data URL:      export const INVOICE_QR = 'data:image/png;base64,....'
//   • a hosted image:  export const INVOICE_QR = 'https://your-cdn/qr.png'
//   • an imported file: import qr from './my-qr.png'; export const INVOICE_QR = qr;
//
// It is used by both the on-screen invoice (BillDetailModal) and the PDF
// (utils/pdf.ts), so updating this one constant changes it everywhere.
// ---------------------------------------------------------------------------

const MOD = 4; // px per QR module
const QUIET = 6; // quiet-zone margin in modules-worth of px
const COUNT = 26; // module grid size
const SIZE = QUIET * 2 + COUNT * MOD;
const INK = '#0f172a';

const px = (i: number) => QUIET + i * MOD;

// A standard QR "finder" pattern (the three big corner squares)
const finder = (c: number, r: number) =>
  `<rect x="${px(c)}" y="${px(r)}" width="${7 * MOD}" height="${7 * MOD}" fill="${INK}"/>` +
  `<rect x="${px(c + 1)}" y="${px(r + 1)}" width="${5 * MOD}" height="${5 * MOD}" fill="#fff"/>` +
  `<rect x="${px(c + 2)}" y="${px(r + 2)}" width="${3 * MOD}" height="${3 * MOD}" fill="${INK}"/>`;

// Deterministic (no Math.random) scatter of data modules that avoids the
// finder zones — purely decorative so it reads as a QR code.
let data = '';
for (let r = 0; r < COUNT; r++) {
  for (let c = 0; c < COUNT; c++) {
    const inFinder =
      (r < 7 && c < 7) || (r < 7 && c >= COUNT - 7) || (r >= COUNT - 7 && c < 7);
    if (inFinder) continue;
    if ((r * 3 + c * 7 + r * c * 2) % 7 < 3) {
      data += `<rect x="${px(c)}" y="${px(r)}" width="${MOD}" height="${MOD}" fill="${INK}"/>`;
    }
  }
}

const svg =
  `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">` +
  `<rect width="${SIZE}" height="${SIZE}" fill="#fff"/>` +
  finder(0, 0) +
  finder(COUNT - 7, 0) +
  finder(0, COUNT - 7) +
  data +
  `</svg>`;

export const INVOICE_QR = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

// Caption shown beneath the QR. Set to '' to hide.
export const INVOICE_QR_CAPTION = 'Scan to pay / verify';
