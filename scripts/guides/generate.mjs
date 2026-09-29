// Builds shareable feature-guide images (English + Hindi) from real app screenshots.
//
//   npm run guides                  # all guides, both languages
//   npm run guides -- --only=stock  # one guide (comma-separate for several)
//
// Starts the demo app (`vite --mode demo`, in-memory sample data) unless one is already
// running on the port, screenshots each feature with Playwright, and renders a 1080×1350
// card per guide and language into guides/<lang>/, plus one PDF per language.

import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { GUIDES, LABELS } from './content.mjs';
import { BRAND, FONT_FACE, FONT_STACK, ROOT, SUPPORT, capture, esc, startServer, stopServer } from './shared.mjs';

const OUT = join(ROOT, 'guides');
const LANGS = ['en', 'hi'];
const W = 1080;
const H = 1350;

const only = (process.argv.find((a) => a.startsWith('--only=')) || '').slice(7).split(',').filter(Boolean);
const guides = only.length ? GUIDES.filter((g) => only.includes(g.id)) : GUIDES;

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------
const CSS = `
${FONT_FACE}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:${FONT_STACK};color:#1e1b4b}
.card{width:${W}px;height:${H}px;overflow:hidden;position:relative;padding:56px 64px 48px;display:flex;flex-direction:column;
  background:radial-gradient(900px 500px at 100% 0%,#e8e8ff 0%,rgba(232,232,255,0) 60%),linear-gradient(180deg,#f7f7ff 0%,#ffffff 60%)}
.top{display:flex;align-items:center;justify-content:space-between}
.brand{display:flex;align-items:center;gap:14px;font-weight:800;font-size:28px;color:#472aaa}
.logo{width:52px;height:52px;border-radius:14px;background:linear-gradient(135deg,#7a5aff,#2563eb);display:grid;place-items:center;box-shadow:0 8px 20px rgba(109,69,249,.3)}
.pill{font-size:20px;font-weight:700;color:#5b32d6;background:#fff;border:2px solid #e8e8ff;padding:10px 20px;border-radius:999px;letter-spacing:.02em}
h1{margin-top:36px;font-size:54px;line-height:1.12;font-weight:800;letter-spacing:-.02em;color:#1e1b4b}
.sub{margin-top:14px;font-size:27px;line-height:1.4;color:#5b5b76}
.shot{margin-top:30px;border-radius:22px;background:#fff;border:2px solid #e7e7ee;box-shadow:0 24px 50px rgba(30,27,75,.14);overflow:hidden;flex-shrink:0}
.bar{height:34px;background:#f3f4f8;border-bottom:1px solid #e7e7ee;display:flex;align-items:center;gap:9px;padding:0 16px}
.bar i{width:13px;height:13px;border-radius:50%;display:block}
.shot img{display:block;width:100%}
.phonewrap{margin-top:30px;height:632px;border-radius:22px;background:linear-gradient(135deg,#6d45f9,#2563eb);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.phone{height:590px;border-radius:44px;border:12px solid #111827;overflow:hidden;box-shadow:0 24px 50px rgba(0,0,0,.35);background:#fff}
.phone img{height:100%;display:block}
.label{margin-top:30px;font-size:19px;font-weight:800;text-transform:uppercase;letter-spacing:.12em;color:#7a5aff}
[lang="hi"] .label{letter-spacing:0;font-size:22px}
.steps{margin-top:14px;display:grid;grid-template-columns:1fr 1fr;gap:18px 30px}
.step{display:flex;gap:16px;align-items:flex-start;font-size:23px;line-height:1.38;color:#2a2940}
.num{flex-shrink:0;width:42px;height:42px;border-radius:50%;background:#6d45f9;color:#fff;font-weight:800;font-size:21px;display:grid;place-items:center;margin-top:-3px}
.foot{margin-top:auto;display:flex;align-items:center;justify-content:space-between;gap:20px;padding-top:24px}
.where{display:flex;align-items:center;gap:12px;background:#6d45f9;color:#fff;border-radius:16px;padding:14px 22px;font-size:22px;font-weight:600;max-width:72%}
.where b{font-weight:800;opacity:.85;white-space:nowrap}
.help{font-size:19px;color:#70707e;text-align:right;line-height:1.35}
.help strong{display:block;color:#1e1b4b;font-size:20px}
`;

const LOGO = `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2z"/><path d="M9 8h6M9 12h6M9 16h3"/></svg>`;
const PIN = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>`;

const cardHtml = (g, lang, shot, index, total) => {
  const t = g[lang];
  const L = LABELS[lang];
  const pic = shot.phone
    ? `<div class="phonewrap"><div class="phone"><img src="data:image/png;base64,${shot.data}"></div></div>`
    : `<div class="shot"><div class="bar"><i style="background:#ff5f57"></i><i style="background:#febc2e"></i><i style="background:#28c840"></i></div><img src="data:image/png;base64,${shot.data}"></div>`;
  return `<section class="card" lang="${lang}">
  <div class="top">
    <div class="brand"><span class="logo">${LOGO}</span>${esc(BRAND)}</div>
    <span class="pill">${esc(L.guide)} · ${String(index).padStart(2, '0')} / ${String(total).padStart(2, '0')}</span>
  </div>
  <h1>${esc(t.title)}</h1>
  <p class="sub">${esc(t.subtitle)}</p>
  ${pic}
  <p class="label">${esc(L.steps)}</p>
  <div class="steps">${t.steps.map((s, i) => `<div class="step"><span class="num">${i + 1}</span><span>${esc(s)}</span></div>`).join('')}</div>
  <div class="foot">
    <div class="where">${PIN}<span><b>${esc(L.where)}:</b> ${esc(t.where)}</span></div>
    <div class="help"><strong>${esc(L.help)}</strong>${esc(SUPPORT || L.helpHint)}</div>
  </div>
</section>`;
};

const doc = (body) => `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}
@page{size:${W}px ${H}px;margin:0} .card{page-break-after:always}</style></head><body>${body}</body></html>`;

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------
const server = await startServer();
const browser = await chromium.launch();
try {
  const shots = {};
  for (const g of guides) {
    process.stdout.write(`screenshot ${g.id}… `);
    shots[g.shot] ??= await capture(browser, g.shot);
    console.log('ok');
  }

  const cardPage = await browser.newPage({ viewport: { width: W, height: H } });
  for (const lang of LANGS) {
    const dir = join(OUT, lang);
    mkdirSync(dir, { recursive: true });
    const cards = [];
    for (const g of guides) {
      const pos = GUIDES.indexOf(g) + 1;
      const html = cardHtml(g, lang, shots[g.shot], pos, GUIDES.length);
      cards.push(html);
      await cardPage.setContent(doc(html), { waitUntil: 'load' });
      await cardPage.evaluate(() => document.fonts.ready);
      // Text must fit the card: warn if anything is pushed past the bottom edge.
      const overflow = await cardPage.evaluate(() => {
        const c = document.querySelector('.card');
        return c.scrollHeight - c.clientHeight;
      });
      if (overflow > 0) console.warn(`  ! ${lang}/${g.id}: content is ${overflow}px too tall`);
      const file = join(dir, `${String(pos).padStart(2, '0')}-${g.id}.png`);
      await cardPage.locator('.card').screenshot({ path: file });
      console.log(`wrote guides/${lang}/${String(pos).padStart(2, '0')}-${g.id}.png`);
    }
    if (!only.length) {
      await cardPage.setContent(doc(cards.join('\n')), { waitUntil: 'load' });
      await cardPage.evaluate(() => document.fonts.ready);
      const pdf = join(OUT, `${BRAND.replace(/\s+/g, '-')}-User-Guide-${lang.toUpperCase()}.pdf`);
      await cardPage.pdf({ path: pdf, width: `${W}px`, height: `${H}px`, printBackground: true });
      console.log(`wrote guides/${pdf.split(/[\\/]/).pop()}`);
    }
  }
  writeFileSync(
    join(OUT, 'README.txt'),
    `Feature guide images generated by \`npm run guides\` on ${new Date().toISOString().slice(0, 10)}.\n` +
      `en/ = English, hi/ = Hindi. One PNG (1080x1350) per feature, plus one PDF per language with all of them.\n` +
      `Screenshots come from the demo data, not a real client's data. Re-run after changing the app.\n`
  );
} finally {
  await browser.close();
  stopServer(server);
}
