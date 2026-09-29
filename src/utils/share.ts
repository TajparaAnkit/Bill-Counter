// WhatsApp sharing helpers shared by invoices, statements and row actions.

// Normalises an Indian mobile number to wa.me format (digits + country code).
export const waPhone = (raw?: string) => {
  let phone = (raw || '').replace(/\D/g, '');
  if (phone.startsWith('0')) phone = phone.replace(/^0+/, '');
  if (phone.length === 10) phone = `91${phone}`;
  return phone;
};

export const whatsappUrl = (phone?: string, text?: string) => {
  const p = waPhone(phone);
  const q = text ? `?text=${encodeURIComponent(text)}` : '';
  return `https://wa.me/${p}${q}`;
};

export type ShareResult = 'shared' | 'cancelled' | 'downloaded';

// Shares a PDF through the native share sheet when the device supports files
// (mobile). Otherwise downloads the PDF and opens the WhatsApp chat so it can
// be attached by hand.
export const sharePdfOnWhatsApp = async (file: File | null, phone?: string): Promise<ShareResult> => {
  const nav = navigator as any;
  if (file && nav.canShare && nav.canShare({ files: [file] })) {
    try {
      await nav.share({ files: [file] });
      return 'shared';
    } catch (err: any) {
      if (err?.name === 'AbortError') return 'cancelled';
      // fall through to the download fallback
    }
  }
  if (file) {
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  }
  window.open(whatsappUrl(phone), '_blank', 'noopener');
  return 'downloaded';
};
