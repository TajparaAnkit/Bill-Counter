// Generates a branded, Instagram-square (1080×1080) marketing image for a
// product: the product photo (cover-cropped) with a gradient overlay, the shop
// name, product name, and a price badge. Returns a PNG data URL + Blob so the
// caller can preview, download, or share it via the Web Share API.
//
// Resilient by design: if the product image can't be loaded/drawn (e.g. CORS),
// it still produces a clean branded card on a gradient background.

interface PromoImageOptions {
  name: string;
  price: number;
  imageUrl?: string;
  shopName: string;
}

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // needed so the canvas isn't tainted (Cloudinary allows this)
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

// Draw up to `maxLines` lines of wrapped text; the last line is ellipsized.
const drawWrappedText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  yStart: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 2
) => {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
      if (lines.length === maxLines) break;
    } else {
      line = test;
    }
  }
  if (lines.length < maxLines && line) lines.push(line);

  // Ellipsize the last line if content overflowed.
  if (lines.length === maxLines) {
    let last = lines[maxLines - 1];
    while (ctx.measureText(`${last}…`).width > maxWidth && last.length > 1) {
      last = last.slice(0, -1);
    }
    lines[maxLines - 1] = last === lines[maxLines - 1] ? last : `${last}…`;
  }

  lines.forEach((ln, i) => ctx.fillText(ln, x, yStart + i * lineHeight));
};

export interface PromoImageResult {
  dataUrl: string;
  blob: Blob | null;
}

export const generatePromoImage = async ({
  name,
  price,
  imageUrl,
  shopName,
}: PromoImageOptions): Promise<PromoImageResult> => {
  const S = 1080;
  const canvas = document.createElement('canvas');
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext('2d')!;

  // Base gradient background (shown if there's no photo, and behind transparent PNGs).
  const bg = ctx.createLinearGradient(0, 0, S, S);
  bg.addColorStop(0, '#4f46e5');
  bg.addColorStop(1, '#2563eb');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, S, S);

  // Product photo, cover-cropped to fill the square.
  if (imageUrl) {
    try {
      const img = await loadImage(imageUrl);
      const scale = Math.max(S / img.width, S / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, (S - w) / 2, (S - h) / 2, w, h);
    } catch {
      // Keep the gradient background if the image fails to load.
    }
  }

  // Bottom darkening overlay for text legibility.
  const overlay = ctx.createLinearGradient(0, S * 0.45, 0, S);
  overlay.addColorStop(0, 'rgba(0,0,0,0)');
  overlay.addColorStop(1, 'rgba(0,0,0,0.85)');
  ctx.fillStyle = overlay;
  ctx.fillRect(0, S * 0.45, S, S * 0.55);

  // Price badge (top-right).
  ctx.font = '800 46px Inter, Arial, sans-serif';
  const priceText = `₹${price.toFixed(price % 1 === 0 ? 0 : 2)}`;
  const padX = 30;
  const badgeW = ctx.measureText(priceText).width + padX * 2;
  const badgeH = 88;
  roundRect(ctx, S - 56 - badgeW, 56, badgeW, badgeH, badgeH / 2);
  ctx.fillStyle = '#22c55e';
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'middle';
  ctx.fillText(priceText, S - 56 - badgeW + padX, 56 + badgeH / 2 + 2);

  // Shop name (small, above product name).
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = '600 38px Inter, Arial, sans-serif';
  ctx.fillText((shopName || 'My Shop').toUpperCase(), 64, S - 210);

  // Product name (bold, up to 2 lines).
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 64px Inter, Arial, sans-serif';
  drawWrappedText(ctx, name, 64, S - 130, S - 128, 72, 2);

  const dataUrl = canvas.toDataURL('image/png');
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), 'image/png')
  );

  return { dataUrl, blob };
};

// Builds a ready-to-post caption + hashtags from the product details.
export const buildPromoCaption = (name: string, price: number, shopName: string): string => {
  const priceText = `₹${price.toFixed(price % 1 === 0 ? 0 : 2)}`;
  const nameWords = name
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 2);
  const baseTags = ['handmade', 'handmadewithlove', 'supportsmallbusiness', 'madeinindia', 'smallbusiness', 'shopsmall'];
  const tags = Array.from(new Set([...nameWords, ...baseTags]))
    .slice(0, 12)
    .map((t) => `#${t}`)
    .join(' ');

  const shop = shopName ? `\n\n— ${shopName}` : '';
  return `✨ ${name} — just ${priceText}!\n\nHandmade with love 🧶 DM to order.${shop}\n\n${tags}`;
};
