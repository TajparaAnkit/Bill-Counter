// Generates a scannable UPI payment QR code as a PNG data URL.
//
// Unlike src/assets/qr.ts (a decorative placeholder), this produces a REAL,
// scannable QR that encodes a UPI deep link:
//   upi://pay?pa=<vpa>&pn=<payee>&am=<amount>&tn=<note>&cu=INR
// Scanning it in any UPI app (GPay, PhonePe, Paytm, ...) opens a payment
// pre-filled with the exact amount.
//
// The QR encoder (davidshimjs/qrcodejs) is loaded on demand from a CDN, so it
// adds no weight to the main bundle.

const QR_CDN =
  'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';

const loadQrLib = (): Promise<any> =>
  new Promise((resolve, reject) => {
    const w = window as any;
    if (w.QRCode) {
      resolve(w.QRCode);
      return;
    }
    if (document.querySelector(`script[src="${QR_CDN}"]`)) {
      // Another call is already loading it — poll briefly for readiness.
      const started = performance.now();
      const check = () => {
        if (w.QRCode) resolve(w.QRCode);
        else if (performance.now() - started > 8000)
          reject(new Error('QR library load timed out'));
        else requestAnimationFrame(check);
      };
      check();
      return;
    }
    const s = document.createElement('script');
    s.src = QR_CDN;
    s.async = true;
    s.onload = () => (w.QRCode ? resolve(w.QRCode) : reject(new Error('QR lib missing after load')));
    s.onerror = () => reject(new Error('Failed to load QR library'));
    document.body.appendChild(s);
  });

export interface UpiQrParams {
  upiId: string; // payee VPA, e.g. name@okhdfcbank
  payeeName: string; // business name
  amount: number;
  note?: string; // e.g. invoice number
}

export const buildUpiUri = ({ upiId, payeeName, amount, note }: UpiQrParams): string => {
  const params = new URLSearchParams({
    pa: upiId,
    pn: payeeName,
    am: amount.toFixed(2),
    cu: 'INR',
  });
  if (note) params.set('tn', note);
  return `upi://pay?${params.toString()}`;
};

// Returns a PNG data URL for the UPI QR, or null if no UPI ID is configured
// or generation fails (callers should treat QR as optional).
export const generateUpiQrDataUrl = async (
  params: UpiQrParams,
  size = 240
): Promise<string | null> => {
  if (!params.upiId?.trim()) return null;
  try {
    const QRCode = await loadQrLib();
    const uri = buildUpiUri(params);

    // qrcodejs renders into a detached container; we read the <canvas> it makes.
    const holder = document.createElement('div');
    // eslint-disable-next-line no-new
    new QRCode(holder, {
      text: uri,
      width: size,
      height: size,
      correctLevel: QRCode.CorrectLevel.M,
    });

    // Rendering is synchronous for the canvas element in qrcodejs.
    const canvas = holder.querySelector('canvas');
    if (canvas) return (canvas as HTMLCanvasElement).toDataURL('image/png');

    // Fallback: some environments render an <img> instead of a canvas.
    const img = holder.querySelector('img') as HTMLImageElement | null;
    if (img?.src) return img.src;

    return null;
  } catch (err) {
    console.error('Failed to generate UPI QR:', err);
    return null;
  }
};
