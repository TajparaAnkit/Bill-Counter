// Marketing images (English + Hindi) built from real app screenshots.
//
//   npm run marketing                   # everything
//   npm run marketing -- --only=hero    # some designs (comma-separated ids)
//
// Output: guides/marketing/<lang>/<id>.png in three shapes:
//   square 1080×1080 (Instagram / WhatsApp), story 1080×1920 (Status / Reels), wide 1200×628 (Facebook / LinkedIn).

import { chromium } from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { BRAND, FONT_FACE, FONT_STACK, ROOT, SUPPORT, capture, esc, startServer, stopServer } from './shared.mjs';

const OUT = join(ROOT, 'guides', 'marketing');
const LANGS = ['en', 'hi'];
const only = (process.argv.find((a) => a.startsWith('--only=')) || '').slice(7).split(',').filter(Boolean);

// ---------------------------------------------------------------------------
// Copy
// ---------------------------------------------------------------------------
const T = {
  cta: { en: 'Start your 14-day free trial', hi: '14 दिन का फ़्री ट्रायल शुरू करें' },
  ctaShort: { en: 'Try free for 14 days', hi: '14 दिन फ़्री आज़माएँ' },
  noCard: { en: 'No card needed', hi: 'कार्ड की ज़रूरत नहीं' },
};

const DESIGNS = [
  {
    id: 'hero',
    size: 'square',
    en: { eyebrow: 'GST billing app', h1: ['Billing that gets you', '*paid faster.*'], sub: 'GST invoices, WhatsApp sharing, UPI payments, stock and reports in one simple app.' },
    hi: { eyebrow: 'GST बिलिंग ऐप', h1: ['बिलिंग जो दिलाए', '*पेमेंट जल्दी।*'], sub: 'GST Invoice, WhatsApp शेयरिंग, UPI पेमेंट, स्टॉक और रिपोर्ट, सब एक आसान ऐप में।' },
  },
  {
    id: 'hero-story',
    size: 'story',
    en: { eyebrow: 'GST billing app', h1: ['Billing that', 'gets you', '*paid faster.*'], sub: 'Create GST invoices in seconds, share them on WhatsApp and collect by UPI.' },
    hi: { eyebrow: 'GST बिलिंग ऐप', h1: ['बिलिंग जो', 'दिलाए', '*पेमेंट जल्दी।*'], sub: 'सेकंडों में GST Invoice बनाएँ, WhatsApp पर भेजें और UPI से पेमेंट लें।' },
  },
  {
    id: 'hero-wide',
    size: 'wide',
    en: { eyebrow: 'GST billing app', h1: ['Billing that gets', 'you *paid faster.*'], sub: 'GST invoices · WhatsApp · UPI · Stock · Reports' },
    hi: { eyebrow: 'GST बिलिंग ऐप', h1: ['बिलिंग जो दिलाए', '*पेमेंट जल्दी।*'], sub: 'GST Invoice · WhatsApp · UPI · स्टॉक · रिपोर्ट' },
  },
  {
    id: 'whatsapp-invoice',
    size: 'square',
    en: { eyebrow: 'Share in 1 tap', h1: ['GST invoices on', '*WhatsApp.*'], sub: 'A professional PDF with your logo and a scan-to-pay UPI QR.' },
    hi: { eyebrow: '1 टैप में शेयर', h1: ['GST Invoice सीधे', '*WhatsApp पर।*'], sub: 'आपके लोगो और UPI QR के साथ प्रोफ़ेशनल PDF।' },
  },
  {
    id: 'reminders',
    size: 'square',
    en: { eyebrow: 'Collect dues faster', h1: ['Reminders that', '*actually get paid.*'], sub: 'One tap sends a polite WhatsApp reminder with the amount and your UPI ID.' },
    hi: { eyebrow: 'बकाया जल्दी वसूलें', h1: ['रिमाइंडर भेजें,', '*पेमेंट पाएँ।*'], sub: 'एक टैप में रकम और UPI ID के साथ विनम्र WhatsApp रिमाइंडर।' },
  },
  {
    id: 'stock',
    size: 'square',
    en: { eyebrow: 'Stock tracking', h1: ['Never run out of', '*stock again.*'], sub: 'Every invoice updates your stock. Low-stock alerts tell you what to reorder.' },
    hi: { eyebrow: 'स्टॉक ट्रैकिंग', h1: ['माल कभी', '*खत्म नहीं होगा।*'], sub: 'हर Invoice से स्टॉक अपडेट। लो-स्टॉक अलर्ट बताता है क्या मँगाना है।' },
  },
  {
    id: 'quotations',
    size: 'square',
    en: { eyebrow: 'Quotations', h1: ['Quote today.', '*Invoice in 1 click.*'], sub: 'Send a quotation, and convert it to a GST invoice when the customer agrees.' },
    hi: { eyebrow: 'कोटेशन', h1: ['आज कोटेशन,', '*1 क्लिक में Invoice।*'], sub: 'कोटेशन भेजें, कस्टमर माने तो तुरंत GST Invoice में बदलें।' },
  },
  {
    id: 'export',
    size: 'square',
    en: { eyebrow: 'Reports for your CA', h1: ['Month-end in', '*one click.*'], sub: 'Export every invoice with GSTIN, CGST, SGST and IGST to Excel.' },
    hi: { eyebrow: 'CA के लिए रिपोर्ट', h1: ['महीने का हिसाब', '*एक क्लिक में।*'], sub: 'हर Invoice का GSTIN, CGST, SGST, IGST के साथ Excel Export।' },
  },
  {
    id: 'catalog',
    size: 'square',
    en: { eyebrow: 'Online catalog', h1: ['Your shop,', '*online in 1 minute.*'], sub: 'Share one link. Customers browse your products and order on WhatsApp.' },
    hi: { eyebrow: 'ऑनलाइन कैटलॉग', h1: ['आपकी दुकान,', '*1 मिनट में ऑनलाइन।*'], sub: 'एक लिंक शेयर करें। कस्टमर Products देखें और WhatsApp पर ऑर्डर करें।' },
  },
  {
    id: 'templates',
    size: 'square',
    en: { eyebrow: 'Invoice designs', h1: ['Invoices that look', '*like your brand.*'], sub: 'Modern, Minimal and Classic A4, plus 2" and 3" thermal receipts for your shop printer.' },
    hi: { eyebrow: 'Invoice डिज़ाइन', h1: ['Invoice जो दिखे', '*आपके ब्रांड जैसा।*'], sub: 'Modern, Minimal और Classic A4, साथ में दुकान के प्रिंटर के लिए 2" और 3" थर्मल रसीद।' },
  },
  {
    id: 'features',
    size: 'square',
    en: { eyebrow: 'All in one app', h1: ['Everything your', '*business needs.*'], sub: '' },
    hi: { eyebrow: 'सब कुछ एक ऐप में', h1: ['बिज़नेस की हर', '*ज़रूरत एक जगह।*'], sub: '' },
  },
  {
    id: 'free-trial',
    size: 'square',
    en: { eyebrow: 'Limited time', h1: ['14 days', '*free.*'], sub: 'Every feature. No card needed. Cancel any time.' },
    hi: { eyebrow: 'सीमित समय', h1: ['14 दिन', '*बिल्कुल फ़्री।*'], sub: 'सभी फ़ीचर। कार्ड की ज़रूरत नहीं। कभी भी बंद करें।' },
  },
];

const FEATURE_TILES = [
  ['fa-solid fa-file-invoice', { en: 'GST invoices', hi: 'GST Invoice' }],
  ['fa-brands fa-whatsapp', { en: 'WhatsApp sharing', hi: 'WhatsApp शेयरिंग' }],
  ['fa-solid fa-qrcode', { en: 'UPI payment QR', hi: 'UPI पेमेंट QR' }],
  ['fa-regular fa-bell', { en: 'Payment reminders', hi: 'पेमेंट रिमाइंडर' }],
  ['fa-solid fa-boxes-stacked', { en: 'Stock & alerts', hi: 'स्टॉक और अलर्ट' }],
  ['fa-solid fa-file-signature', { en: 'Quotations', hi: 'कोटेशन' }],
  ['fa-solid fa-file-excel', { en: 'Excel reports', hi: 'Excel रिपोर्ट' }],
  ['fa-solid fa-book', { en: 'Party ledger', hi: 'पार्टी लेजर' }],
  ['fa-solid fa-store', { en: 'Online catalog', hi: 'ऑनलाइन कैटलॉग' }],
];
// (9 tiles fill the 3×3 grid; invoice designs have their own image, 'templates'.)

// ---------------------------------------------------------------------------
// Design system
// ---------------------------------------------------------------------------
const SIZES = { square: [1080, 1080], story: [1080, 1920], wide: [1200, 628] };

// FontAwesome (already a dependency) inlined so icons render offline.
const faDir = join(ROOT, 'node_modules/@fortawesome/fontawesome-free');
const FA = readFileSync(join(faDir, 'css/all.min.css'), 'utf8').replace(/url\(\.\.\/webfonts\/([^)]+?)\)/g, (m, f) => {
  const file = f.split(/[?#]/)[0];
  if (!file.endsWith('.woff2')) return 'url(data:,)';
  return `url(data:font/woff2;base64,${readFileSync(join(faDir, 'webfonts', file)).toString('base64')})`;
});

const CSS = `
${FONT_FACE}
${FA}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:${FONT_STACK};background:#fff}
.art{position:relative;overflow:hidden;color:#0f172a;background:#fff}
.bg{position:absolute;inset:0;background:
  radial-gradient(62% 48% at 8% -4%,rgba(37,99,235,.16),transparent 70%),
  radial-gradient(48% 44% at 104% 26%,rgba(14,165,233,.14),transparent 70%),
  radial-gradient(58% 42% at 62% 112%,rgba(59,130,246,.16),transparent 70%),
  linear-gradient(180deg,#f3f7ff 0%,#ffffff 55%,#f4f8ff 100%)}
.grid{position:absolute;inset:0;background-image:linear-gradient(rgba(30,64,175,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(30,64,175,.06) 1px,transparent 1px);background-size:54px 54px;
  -webkit-mask-image:radial-gradient(ellipse 80% 60% at 40% 25%,#000 20%,transparent 75%)}
.orb{position:absolute;border-radius:50%;filter:blur(70px);opacity:.22}
.layer{position:absolute}
.brand{display:flex;align-items:center;gap:14px;font-weight:800;font-size:30px;letter-spacing:-.01em}
.logo{width:56px;height:56px;border-radius:17px;background:linear-gradient(135deg,#2563eb,#0ea5e9);color:#fff;display:grid;place-items:center;box-shadow:0 10px 26px rgba(37,99,235,.35),inset 0 1px 0 rgba(255,255,255,.35);font-size:24px}
.eyebrow{display:inline-flex;align-items:center;gap:10px;padding:10px 20px;border-radius:999px;background:#eff5ff;border:1px solid #c7d8fb;font-weight:700;font-size:20px;letter-spacing:.1em;text-transform:uppercase;color:#1d4ed8}
.eyebrow .dot{width:9px;height:9px;border-radius:50%;background:#2563eb;box-shadow:0 0 10px #60a5fa}
h1{color:#0f172a;font-weight:850;letter-spacing:-.04em;line-height:1.02;text-wrap:balance}
h1 .g{background:linear-gradient(92deg,#1e40af 0%,#2563eb 45%,#0ea5e9 100%);-webkit-background-clip:text;background-clip:text;color:transparent;padding-right:.04em}
[lang="hi"] h1{letter-spacing:-.01em;line-height:1.18}
[lang="hi"] .eyebrow{letter-spacing:.02em}
.sub{color:#475569;line-height:1.4}
.cta{display:inline-flex;align-items:center;gap:14px;padding:22px 34px;border-radius:999px;background:linear-gradient(135deg,#2563eb,#1d4ed8);font-weight:800;font-size:27px;color:#fff;box-shadow:0 18px 40px rgba(29,78,216,.38),inset 0 1px 0 rgba(255,255,255,.25);white-space:nowrap}
.cta i{font-size:22px}
.note{font-size:20px;color:#64748b;display:flex;align-items:center;gap:10px}
.window{border-radius:22px;overflow:hidden;background:#fff;box-shadow:0 40px 80px rgba(15,23,42,.22),0 0 0 1px #dbe3f0}
.window .bar{height:30px;background:#e9eef6;display:flex;align-items:center;gap:8px;padding:0 14px}
.window .bar i{width:11px;height:11px;border-radius:50%;display:block}
.window img{display:block;width:100%}
.phone{border-radius:60px;padding:14px;background:linear-gradient(145deg,#2b2f3a,#0c0f16);box-shadow:0 40px 80px rgba(15,23,42,.3),inset 0 0 0 2px rgba(255,255,255,.08)}
.phone .screen{position:relative;border-radius:46px;overflow:hidden;background:#fff;height:100%}
.phone .screen img{display:block;width:100%}
.phone .notch{position:absolute;top:12px;left:50%;transform:translateX(-50%);width:120px;height:32px;border-radius:20px;background:#0c0c12;z-index:2}
.tiltL{transform:perspective(2400px) rotateY(16deg) rotateX(6deg) rotateZ(-2deg)}
.tiltR{transform:perspective(2400px) rotateY(-18deg) rotateX(7deg) rotateZ(2deg)}
.toast{display:flex;align-items:center;gap:16px;padding:16px 22px 16px 16px;border-radius:22px;background:#fff;color:#0f172a;border:1px solid #e3e9f4;box-shadow:0 22px 44px rgba(15,23,42,.16);white-space:nowrap}
.toast .ic{width:52px;height:52px;border-radius:16px;display:grid;place-items:center;color:#fff;font-size:24px;flex-shrink:0}
.toast b{display:block;font-size:22px;font-weight:800;letter-spacing:-.01em}
.toast span{display:block;font-size:17px;color:#64748b;margin-top:2px}
.chips{display:flex;flex-wrap:wrap;gap:12px}
.chip{display:inline-flex;align-items:center;gap:10px;padding:11px 18px;border-radius:14px;background:#fff;border:1px solid #dbe4f3;font-size:20px;font-weight:600;color:#1e293b;box-shadow:0 6px 16px rgba(15,23,42,.06)}
.chip i{color:#2563eb}
.foot{position:absolute;left:64px;right:64px;display:flex;align-items:center;justify-content:space-between;gap:20px}
.contact{font-size:20px;color:#64748b;text-align:right}
.contact b{display:block;color:#0f172a;font-size:22px}
/* WhatsApp chat mock */
.wa{border-radius:28px;overflow:hidden;background:#efe7de;box-shadow:0 36px 72px rgba(15,23,42,.24),0 0 0 1px #e3e9f4}
.wa .head{background:#075e54;color:#fff;display:flex;align-items:center;gap:14px;padding:18px 20px}
.wa .av{width:46px;height:46px;border-radius:50%;background:#25d366;display:grid;place-items:center;font-weight:800;font-size:18px}
.wa .head b{font-size:21px;display:block}.wa .head span{font-size:15px;opacity:.8}
.wa .body{padding:20px;display:flex;flex-direction:column;gap:14px;background-image:radial-gradient(rgba(0,0,0,.035) 1px,transparent 1px);background-size:16px 16px}
.bub{max-width:86%;padding:14px 16px 10px;border-radius:14px;font-size:19px;line-height:1.4;color:#111b21;box-shadow:0 1px 1px rgba(0,0,0,.12);position:relative}
.bub.out{align-self:flex-end;background:#d9fdd3;border-top-right-radius:4px}
.bub.in{align-self:flex-start;background:#fff;border-top-left-radius:4px}
.bub small{display:block;text-align:right;font-size:13px;color:#667781;margin-top:4px}
.bub small i{color:#53bdeb;margin-left:4px}
.doc{display:flex;align-items:center;gap:12px;background:rgba(0,0,0,.05);border-radius:10px;padding:12px;margin-bottom:8px}
.doc .pdf{width:44px;height:52px;border-radius:6px;background:#e53935;color:#fff;display:grid;place-items:center;font-weight:800;font-size:13px}
.doc b{font-size:17px;display:block}.doc span{font-size:14px;color:#667781}
/* Excel mock */
.xl{border-radius:20px;overflow:hidden;background:#fff;box-shadow:0 40px 80px rgba(15,23,42,.22),0 0 0 1px #dbe3f0;color:#1f2937}
.xl .top{background:#107c41;color:#fff;display:flex;align-items:center;gap:12px;padding:14px 18px;font-weight:700;font-size:19px}
.xl table{border-collapse:collapse;width:100%;font-size:16px}
.xl th{background:#f3f4f6;color:#374151;font-weight:700;text-align:left;padding:10px 12px;border:1px solid #e5e7eb;white-space:nowrap}
.xl td{padding:10px 12px;border:1px solid #eef0f3;white-space:nowrap}
.xl td.n{text-align:right;font-variant-numeric:tabular-nums}
.xl tr.t td{font-weight:800;background:#ecfdf3;color:#065f46}
.xl .tabs{display:flex;gap:4px;padding:8px 12px;background:#f3f4f6;border-top:1px solid #e5e7eb;font-size:15px}
.xl .tabs span{padding:6px 14px;border-radius:6px;background:#fff;border:1px solid #e5e7eb}
.xl .tabs span.on{border-bottom:3px solid #107c41;font-weight:700;color:#107c41}
/* Feature tiles */
.tiles{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
.tile{padding:24px 24px 26px;border-radius:26px;background:#fff;border:1px solid #e3e9f4;box-shadow:0 14px 32px rgba(15,23,42,.07)}
.tile .ic{width:60px;height:60px;border-radius:19px;display:grid;place-items:center;font-size:27px;color:#fff;margin-bottom:16px}
.tile b{color:#0f172a;font-size:26px;font-weight:750;letter-spacing:-.01em;line-height:1.2}
.check{display:flex;align-items:center;gap:14px;font-size:26px;font-weight:600;color:#1e293b}
.check i{width:40px;height:40px;border-radius:50%;background:#dbeafe;color:#1d4ed8;display:grid;place-items:center;font-size:18px}
.big{font-size:210px;font-weight:900;letter-spacing:-.06em;line-height:.9}
`;

const TILE_TINTS = ['#2563eb', '#16a34a', '#0ea5e9', '#f59e0b', '#ef4444', '#1d4ed8', '#0d9488', '#3b82f6', '#0284c7'];

// ---------------------------------------------------------------------------
// Pieces
// ---------------------------------------------------------------------------
const h1Html = (lines) =>
  lines.map((l) => esc(l).replace(/\*(.+?)\*/g, '<span class="g">$1</span>')).join('<br>');
const logo = () => `<div class="brand"><span class="logo"><i class="fa-solid fa-receipt"></i></span>${esc(BRAND)}</div>`;
const eyebrow = (t) => `<span class="eyebrow"><span class="dot"></span>${esc(t)}</span>`;
const img = (shot) => `data:image/png;base64,${shot.data}`;
const browser = (shot, w, cls = '', style = '') =>
  `<div class="window ${cls}" style="width:${w}px;${style}"><div class="bar"><i style="background:#ff5f57"></i><i style="background:#febc2e"></i><i style="background:#28c840"></i></div><img src="${img(shot)}"></div>`;
const phone = (shot, w, h, cls = '', style = '') =>
  `<div class="phone ${cls}" style="width:${w}px;height:${h}px;${style}"><div class="screen"><div class="notch"></div><img src="${img(shot)}"></div></div>`;
const toast = (icon, color, title, sub, style) =>
  `<div class="toast layer" style="${style}"><span class="ic" style="background:${color}"><i class="${icon}"></i></span><div><b>${esc(title)}</b>${sub ? `<span>${esc(sub)}</span>` : ''}</div></div>`;
const cta = (lang, short = false) => `<span class="cta">${esc((short ? T.ctaShort : T.cta)[lang])}<i class="fa-solid fa-arrow-right"></i></span>`;
const contact = (lang) =>
  SUPPORT
    ? `<div class="contact"><b>${lang === 'hi' ? 'अभी संपर्क करें' : 'Get started'}</b>${esc(SUPPORT)}</div>`
    : `<div class="contact"><b>${esc(BRAND)}</b>${lang === 'hi' ? 'GST बिलिंग, आसान' : 'GST billing, made simple'}</div>`;
const bg = () => `<div class="bg"></div><div class="grid"></div>`;

const TOASTS = {
  sent: { en: ['Invoice sent on WhatsApp', 'INV-0049 · Ramesh Traders'], hi: ['Invoice WhatsApp पर भेजा', 'INV-0049 · Ramesh Traders'] },
  paid: { en: ['₹3,422 received', 'Paid via UPI · just now'], hi: ['₹3,422 मिल गए', 'UPI से पेमेंट · अभी'] },
  low: { en: ['Low stock: Cotton Saree', 'Only 3 left, reorder now'], hi: ['लो स्टॉक: Cotton Saree', 'सिर्फ़ 3 बचे, अभी मँगाएँ'] },
  gst: { en: ['GST auto-calculated', 'CGST + SGST or IGST'], hi: ['GST अपने-आप', 'CGST + SGST या IGST'] },
  qr: { en: ['UPI QR on every invoice', 'Customers scan & pay'], hi: ['हर Invoice पर UPI QR', 'कस्टमर स्कैन करके पे करें'] },
  reminder: { en: ['Reminder sent', '₹9,727 due · Ramesh Traders'], hi: ['रिमाइंडर भेजा', '₹9,727 बाकी · Ramesh Traders'] },
  converted: { en: ['QT-0002 → INV-0049', 'Converted in 1 click'], hi: ['QT-0002 → INV-0049', '1 क्लिक में बदला'] },
  exported: { en: ['48 invoices exported', 'Sales_Invoices_All_Time.xlsx'], hi: ['48 Invoice Export', 'Sales_Invoices_All_Time.xlsx'] },
  order: { en: ['New order on WhatsApp', '“2 × Cotton Saree please”'], hi: ['WhatsApp पर नया ऑर्डर', '“2 × Cotton Saree चाहिए”'] },
  updated: { en: ['Stock updated', 'Invoice INV-0049 · −4 bottles'], hi: ['स्टॉक अपडेट', 'Invoice INV-0049 · −4 बोतल'] },
};
const t2 = (key, lang) => TOASTS[key][lang];

// WhatsApp chat mock for reminders / invoice sharing.
const waChat = (lang, kind, w, style) => {
  const reminder =
    lang === 'hi'
      ? 'नमस्ते Ramesh Traders,<br>Invoice INV-0015 के ₹4,863 बाकी हैं (due 11 Oct)।<br>UPI से पे करें: dwarkadhish@okhdfcbank<br>धन्यवाद 🙏'
      : 'Dear Ramesh Traders,<br>This is a friendly reminder that ₹4,863 is pending on invoice INV-0015 (due 11 Oct).<br>Pay via UPI: dwarkadhish@okhdfcbank<br>Thank you 🙏';
  const reply = lang === 'hi' ? 'अभी पेमेंट कर दिया ✅' : 'Paid just now ✅ Thanks!';
  const shareMsg = lang === 'hi' ? 'आपका Invoice, UPI QR से पेमेंट करें 🙏' : 'Here is your invoice. Scan the QR to pay by UPI 🙏';
  const body =
    kind === 'reminder'
      ? `<div class="bub out">${reminder}<small>10:42 <i class="fa-solid fa-check-double"></i></small></div>
         <div class="bub in">${esc(reply)}<small>10:47</small></div>`
      : `<div class="bub out"><div class="doc"><span class="pdf">PDF</span><div><b>Invoice_INV-0049.pdf</b><span>1 page · 84 kB</span></div></div>${esc(shareMsg)}<small>10:31 <i class="fa-solid fa-check-double"></i></small></div>
         <div class="bub in">${lang === 'hi' ? 'मिल गया, धन्यवाद! 👍' : 'Got it, thank you! 👍'}<small>10:33</small></div>`;
  return `<div class="wa layer" style="width:${w}px;${style}"><div class="head"><i class="fa-solid fa-arrow-left"></i><span class="av">RT</span><div><b>Ramesh Traders</b><span>online</span></div></div><div class="body">${body}</div></div>`;
};

const excel = (lang, w, style) => {
  const rows = [
    ['INV-0049', 'Ramesh Traders', '24AAYFG2879D1ZZ', '2,900.00', '261.00', '261.00', '3,422.00'],
    ['INV-0048', 'Shree Krishna Mart', '', '7,740.00', '696.60', '696.60', '9,133.00'],
    ['INV-0047', 'Om Electricals', '27AAACO4567E1Z2', '1,450.00', '', '261.00', '1,711.00'],
    ['INV-0046', 'Sita Stores', '', '600.00', '54.00', '54.00', '708.00'],
    ['INV-0045', 'Patel Hardware', '24AABCP1234C1Z5', '8,243.00', '741.87', '741.87', '9,727.00'],
  ];
  return `<div class="xl layer" style="width:${w}px;${style}">
    <div class="top"><i class="fa-solid fa-file-excel"></i> Sales_Invoices_Last_30_Days.xlsx</div>
    <table><tr><th>Invoice No.</th><th>Customer</th><th>GSTIN</th><th>Taxable</th><th>CGST</th><th>SGST</th><th>Total</th></tr>
    ${rows.map((r) => `<tr>${r.map((c, i) => `<td class="${i > 2 ? 'n' : ''}">${esc(c)}</td>`).join('')}</tr>`).join('')}
    <tr class="t"><td>${lang === 'hi' ? 'कुल (48)' : 'TOTAL (48)'}</td><td></td><td></td><td class="n">1,69,422.00</td><td class="n">15,248.00</td><td class="n">15,248.00</td><td class="n">1,99,918.00</td></tr></table>
    <div class="tabs"><span class="on">Invoices</span><span>Items</span></div></div>`;
};

// ---------------------------------------------------------------------------
// Layouts
// ---------------------------------------------------------------------------
// Logo row + a flowing text block (headline, then subtitle), so any line count stacks cleanly.
const head = (c, lang, { top = 64, h1 = 86, sub = 30, width = 952 } = {}) => `
  <div class="layer" style="left:64px;top:${top}px;right:64px;display:flex;align-items:center;justify-content:space-between">${logo()}${eyebrow(c.eyebrow)}</div>
  <div class="copy layer" style="left:64px;top:${top + 110}px;width:${width}px">
    <h1 style="font-size:${lang === 'hi' ? Math.round(h1 * 0.9) : h1}px">${h1Html(c.h1)}</h1>
    ${c.sub ? `<p class="sub" style="margin-top:24px;max-width:900px;font-size:${sub}px">${esc(c.sub)}</p>` : ''}
  </div>`;

const squareFoot = (lang) => `<div class="foot" style="bottom:56px">${cta(lang, true)}${contact(lang)}</div>`;

const RENDER = {
  hero: (c, lang, s) => `${bg()}
    <div class="orb" style="width:420px;height:420px;background:#3b82f6;right:-80px;top:380px"></div>
    ${head(c, lang, { h1: 84 })}
    <div class="chips layer" style="left:64px;top:500px;width:520px">
      ${['fa-solid fa-file-invoice|GST', 'fa-brands fa-whatsapp|WhatsApp', 'fa-solid fa-qrcode|UPI QR', 'fa-solid fa-boxes-stacked|' + (lang === 'hi' ? 'स्टॉक' : 'Stock')]
        .map((x) => `<span class="chip"><i class="${x.split('|')[0]}"></i>${esc(x.split('|')[1])}</span>`)
        .join('')}
    </div>
    ${browser(s.dashboard, 700, 'layer tiltR', 'left:420px;top:560px')}
    ${phone(s.invoiceMobile, 250, 500, 'layer tiltL', 'left:96px;top:620px')}
    ${toast('fa-brands fa-whatsapp', '#22c55e', ...t2('sent', lang), 'left:300px;top:640px')}
    ${toast('fa-solid fa-indian-rupee-sign', '#2563eb', ...t2('paid', lang), 'right:48px;top:470px')}
    <div class="foot" style="bottom:48px;left:auto;right:64px">${cta(lang, true)}</div>`,

  'hero-story': (c, lang, s) => `${bg()}
    <div class="orb" style="width:600px;height:600px;background:#2563eb;right:-200px;top:900px"></div>
    ${head(c, lang, { top: 110, h1: 118, sub: 34 })}
    ${browser(s.dashboard, 880, 'layer tiltR', 'left:150px;top:860px')}
    ${phone(s.invoiceMobile, 330, 660, 'layer tiltL', 'left:70px;top:1010px')}
    ${toast('fa-brands fa-whatsapp', '#22c55e', ...t2('sent', lang), 'left:340px;top:980px')}
    ${toast('fa-solid fa-indian-rupee-sign', '#2563eb', ...t2('paid', lang), 'right:56px;top:1390px')}
    ${toast('fa-solid fa-percent', '#f59e0b', ...t2('gst', lang), 'left:420px;top:1560px')}
    <div class="layer" style="left:64px;right:64px;bottom:110px;display:flex;flex-direction:column;align-items:center;gap:20px">
      ${cta(lang)}<span class="note"><i class="fa-solid fa-circle-check" style="color:#16a34a"></i>${esc(T.noCard[lang])}</span>
    </div>`,

  'hero-wide': (c, lang, s) => `${bg()}
    <div class="layer" style="left:56px;top:48px">${logo()}</div>
    <div class="layer" style="left:56px;top:140px">${eyebrow(c.eyebrow)}</div>
    <h1 class="layer" style="left:56px;top:210px;width:600px;font-size:${lang === 'hi' ? 58 : 64}px">${h1Html(c.h1)}</h1>
    <p class="sub layer" style="left:56px;top:${lang === 'hi' ? 380 : 370}px;width:560px;font-size:23px">${esc(c.sub)}</p>
    <div class="layer" style="left:56px;bottom:46px">${cta(lang, true)}</div>
    ${browser(s.dashboard, 600, 'layer tiltR', 'left:640px;top:120px')}
    ${toast('fa-solid fa-indian-rupee-sign', '#2563eb', ...t2('paid', lang), 'left:600px;top:440px')}`,

  'whatsapp-invoice': (c, lang, s) => `${bg()}
    ${head(c, lang)}
    ${phone(s.invoiceMobile, 320, 600, 'layer tiltL', 'left:90px;top:470px')}
    ${waChat(lang, 'share', 470, 'right:64px;top:500px')}
    ${toast('fa-solid fa-qrcode', '#0ea5e9', ...t2('qr', lang), 'left:64px;top:955px')}
    <div class="foot" style="bottom:40px;left:auto;right:64px">${cta(lang, true)}</div>`,

  reminders: (c, lang, s) => `${bg()}
    ${head(c, lang)}
    ${browser(s.reminder, 620, 'layer tiltR', 'left:40px;top:500px;opacity:.9')}
    ${waChat(lang, 'reminder', 470, 'right:64px;top:470px')}
    ${toast('fa-regular fa-bell', '#f59e0b', ...t2('reminder', lang), 'left:90px;top:840px')}
    <div class="foot" style="bottom:40px;left:auto;right:64px">${cta(lang, true)}</div>`,

  stock: (c, lang, s) => `${bg()}
    ${head(c, lang)}
    ${browser(s.stock, 860, 'layer tiltR', 'left:130px;top:470px')}
    ${toast('fa-solid fa-triangle-exclamation', '#ef4444', ...t2('low', lang), 'left:64px;top:640px')}
    ${toast('fa-solid fa-boxes-stacked', '#22c55e', ...t2('updated', lang), 'right:60px;top:800px')}
    ${squareFoot(lang)}`,

  quotations: (c, lang, s) => `${bg()}
    ${head(c, lang)}
    <div class="layer tiltL" style="left:90px;top:480px;width:430px;border-radius:18px;overflow:hidden;box-shadow:0 36px 72px rgba(15,23,42,.24),0 0 0 1px #dbe3f0;opacity:.92"><img src="${img(s.quotationPaper)}" style="width:100%;display:block"></div>
    <div class="layer" style="left:500px;top:640px;width:90px;height:90px;border-radius:50%;background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#fff;display:grid;place-items:center;font-size:38px;box-shadow:0 18px 40px rgba(29,78,216,.4);z-index:3"><i class="fa-solid fa-arrow-right"></i></div>
    <div class="layer tiltR" style="right:70px;top:470px;width:430px;border-radius:18px;overflow:hidden;box-shadow:0 36px 72px rgba(15,23,42,.24),0 0 0 1px #dbe3f0"><img src="${img(s.invoicePaper)}" style="width:100%;display:block"></div>
    ${toast('fa-solid fa-wand-magic-sparkles', '#1d4ed8', ...t2('converted', lang), 'left:320px;top:850px')}
    <div class="foot" style="bottom:40px;left:auto;right:64px">${cta(lang, true)}</div>`,

  export: (c, lang) => `${bg()}
    ${head(c, lang)}
    ${excel(lang, 900, 'left:90px;top:500px;transform:perspective(2400px) rotateX(10deg) rotateZ(-2deg)')}
    ${toast('fa-solid fa-file-excel', '#107c41', ...t2('exported', lang), 'right:64px;top:450px')}
    ${squareFoot(lang)}`,

  catalog: (c, lang, s) => `${bg()}
    <div class="orb" style="width:460px;height:460px;background:#0ea5e9;left:520px;top:520px;opacity:.22"></div>
    ${head(c, lang)}
    ${phone(s.catalog, 310, 600, 'layer tiltR', 'left:390px;top:490px')}
    ${toast('fa-brands fa-whatsapp', '#22c55e', ...t2('order', lang), 'left:64px;top:620px')}
    ${toast('fa-solid fa-link', '#2563eb', lang === 'hi' ? 'एक लिंक शेयर करें' : 'Share one link', lang === 'hi' ? 'कोई ऐप या लॉगिन नहीं' : 'No app or login for customers', 'right:56px;top:840px')}
    ${squareFoot(lang)}`,

  templates: (c, lang, s) => `${bg()}
    <div class="orb" style="width:440px;height:440px;background:#60a5fa;left:80px;top:520px;opacity:.25"></div>
    ${head(c, lang)}
    <div class="layer tiltL" style="left:70px;top:500px;width:560px;border-radius:18px;overflow:hidden;box-shadow:0 36px 72px rgba(15,23,42,.24),0 0 0 1px #dbe3f0"><img src="${img(s.modernPaper)}" style="width:100%;display:block"></div>
    <div class="layer tiltR" style="right:80px;top:470px;width:300px;border-radius:10px;overflow:hidden;box-shadow:0 36px 72px rgba(15,23,42,.28),0 0 0 1px #dbe3f0"><img src="${img(s.thermalPaper)}" style="width:100%;display:block"></div>
    ${toast('fa-solid fa-palette', '#0d9488', lang === 'hi' ? '5 डिज़ाइन, 8 रंग' : '5 designs, 8 colours', lang === 'hi' ? 'A4 और थर्मल 58/80 mm' : 'A4 and thermal 58 / 80 mm', 'left:64px;top:955px')}
    <div class="foot" style="bottom:40px;left:auto;right:64px">${cta(lang, true)}</div>`,

  features: (c, lang) => `${bg()}
    ${head(c, lang, { h1: 80 })}
    <div class="tiles layer" style="left:64px;right:64px;top:${lang === 'hi' ? 400 : 375}px">
      ${FEATURE_TILES.map(([icon, label], i) => `<div class="tile"><span class="ic" style="background:${TILE_TINTS[i]};box-shadow:0 12px 30px ${TILE_TINTS[i]}66"><i class="${icon}"></i></span><b>${esc(label[lang])}</b></div>`).join('')}
    </div>
    <div class="foot" style="bottom:48px">${cta(lang, true)}${contact(lang)}</div>`,

  'free-trial': (c, lang, s) => `${bg()}
    <div class="orb" style="width:520px;height:520px;background:#3b82f6;left:-120px;top:420px;opacity:.25"></div>
    <div class="layer" style="left:64px;top:64px;right:64px;display:flex;align-items:center;justify-content:space-between">${logo()}${eyebrow(c.eyebrow)}</div>
    <h1 class="layer" style="left:64px;top:190px;font-size:${lang === 'hi' ? 150 : 190}px;letter-spacing:-.05em;line-height:.95">${h1Html(c.h1)}</h1>
    <p class="sub layer" style="left:64px;top:${lang === 'hi' ? 560 : 590}px;width:520px;font-size:30px">${esc(c.sub)}</p>
    <div class="layer" style="left:64px;top:${lang === 'hi' ? 700 : 720}px;display:flex;flex-direction:column;gap:18px">
      ${FEATURE_TILES.slice(0, 5).map(([, l]) => `<span class="check"><i class="fa-solid fa-check"></i>${esc(l[lang])}</span>`).join('')}
    </div>
    ${browser(s.dashboard, 560, 'layer tiltR', 'left:600px;top:560px')}
    <div class="foot" style="bottom:52px;left:auto;right:64px">${cta(lang)}</div>`,
};

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------
const designs = only.length ? DESIGNS.filter((d) => only.includes(d.id)) : DESIGNS;
const NEEDED = ['dashboard', 'invoiceMobile', 'invoicePaper', 'quotationPaper', 'reminder', 'stock', 'catalog', 'modernPaper', 'thermalPaper'];

const server = await startServer();
const chrome = await chromium.launch();
try {
  const shots = {};
  for (const key of NEEDED) {
    process.stdout.write(`screenshot ${key}… `);
    shots[key] = await capture(chrome, key, { highlight: false });
    console.log('ok');
  }
  const page = await chrome.newPage();
  for (const lang of LANGS) {
    mkdirSync(join(OUT, lang), { recursive: true });
    for (const d of designs) {
      const [w, h] = SIZES[d.size];
      await page.setViewportSize({ width: w, height: h });
      await page.setContent(
        `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body><div class="art" lang="${lang}" style="width:${w}px;height:${h}px">${RENDER[d.id](d[lang], lang, shots)}</div></body></html>`,
        { waitUntil: 'load' }
      );
      await page.evaluate(() => document.fonts.ready);
      // Flag text that runs off the canvas so a wording change can't silently break a design.
      const off = await page.evaluate(() => {
        const art = document.querySelector('.art').getBoundingClientRect();
        return [...document.querySelectorAll('h1, .sub, .cta, .eyebrow, .brand, .contact, .tile b, .check')]
          .filter((el) => {
            const r = el.getBoundingClientRect();
            return r.right > art.right + 1 || r.bottom > art.bottom + 1 || r.left < art.left - 1;
          })
          .map((el) => el.className || el.tagName);
      });
      if (off.length) console.warn(`  ! ${lang}/${d.id}: off canvas: ${off.join(', ')}`);
      // The headline/subtitle block must end above the first mockup under it.
      const clash = await page.evaluate(() => {
        const copy = document.querySelector('.copy')?.getBoundingClientRect();
        if (!copy) return 0;
        const tops = [...document.querySelectorAll('.window, .phone, .wa, .xl, .tiles, .chips')]
          .map((el) => el.getBoundingClientRect())
          .filter((r) => r.left < copy.right && r.right > copy.left)
          .map((r) => r.top);
        return tops.length ? Math.round(copy.bottom - Math.min(...tops)) : 0;
      });
      if (clash > 0) console.warn(`  ! ${lang}/${d.id}: text overlaps the visual by ${clash}px`);
      await page.locator('.art').screenshot({ path: join(OUT, lang, `${d.id}.png`) });
      console.log(`wrote guides/marketing/${lang}/${d.id}.png (${w}×${h})`);
    }
  }
  writeFileSync(
    join(OUT, 'README.txt'),
    `Marketing images generated by \`npm run marketing\` on ${new Date().toISOString().slice(0, 10)}.\n` +
      `en/ = English, hi/ = Hindi.\n` +
      `Square 1080x1080 (Instagram / WhatsApp): ${DESIGNS.filter((d) => d.size === 'square').map((d) => d.id).join(', ')}\n` +
      `Story 1080x1920 (WhatsApp Status / Reels): ${DESIGNS.filter((d) => d.size === 'story').map((d) => d.id).join(', ')}\n` +
      `Wide 1200x628 (Facebook / LinkedIn / website): ${DESIGNS.filter((d) => d.size === 'wide').map((d) => d.id).join(', ')}\n` +
      `Screenshots use demo data. Set SUPPORT_PHONE / SUPPORT_EMAIL in src/config/brand.ts to show your contact, then re-run.\n`
  );
} finally {
  await chrome.close();
  stopServer(server);
}
