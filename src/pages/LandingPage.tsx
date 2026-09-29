import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { BRAND_NAME, SUPPORT_EMAIL, SUPPORT_PHONE } from '../config/brand';
import { FEATURES, PLANS, TRIAL_DAYS } from '../config/features';
import { COPY, Lang } from './landing/content';

// Public landing page at the site root (#/), light theme. Copy lives in landing/content.ts;
// screenshots in public/landing/ (refresh with `npm run landing-shots`). Login / Register go to
// the app pages; signed-in visitors get "Open Dashboard" instead.

const img = (file: string) => `${import.meta.env.BASE_URL}landing/${file}`;
const LANG_KEY = 'bc.landingLang';
const readLang = (): Lang => {
  try {
    return localStorage.getItem(LANG_KEY) === 'hi' ? 'hi' : 'en';
  } catch {
    return 'en';
  }
};
const WHY_MS = 6000; // how long each "Why" item stays before moving on

const CSS = `
.lp{background:#fff;color:#0f172a}
/* soft blue tinted sections with faint grid lines (like a product site's feature bands) */
.lp-tint{position:relative;background:
  radial-gradient(60% 90% at 0% 40%,rgba(37,99,235,.09),transparent 70%),
  radial-gradient(50% 80% at 100% 60%,rgba(14,165,233,.08),transparent 70%),
  linear-gradient(180deg,#f4f7fe 0%,#f8faff 100%)}
.lp-tint::before{content:'';position:absolute;inset:0;pointer-events:none;
  background-image:linear-gradient(rgba(30,64,175,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(30,64,175,.05) 1px,transparent 1px);background-size:120px 120px}
.lp-tint>*{position:relative}
.lp-laptop{position:relative}
.lp-laptop .base{height:14px;margin:0 -7%;border-radius:0 0 14px 14px;background:linear-gradient(180deg,#d7dce5,#aab2c0);box-shadow:0 18px 40px -10px rgba(15,23,42,.45)}
.lp-laptop .base::before{content:'';display:block;width:16%;height:5px;margin:0 auto;border-radius:0 0 6px 6px;background:#9aa3b2}
.lp-hero-bg{background:
  radial-gradient(55% 60% at 0% 0%,rgba(37,99,235,.14),transparent 70%),
  radial-gradient(45% 55% at 100% 10%,rgba(14,165,233,.12),transparent 70%),
  radial-gradient(40% 40% at 70% 100%,rgba(59,130,246,.10),transparent 70%),
  linear-gradient(180deg,#f3f7ff 0%,#fff 100%)}
.lp-grid{background-image:linear-gradient(rgba(30,64,175,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(30,64,175,.07) 1px,transparent 1px);background-size:56px 56px;
  -webkit-mask-image:radial-gradient(ellipse 70% 60% at 50% 20%,#000 15%,transparent 70%);mask-image:radial-gradient(ellipse 70% 60% at 50% 20%,#000 15%,transparent 70%)}
.lp-grad{background:linear-gradient(92deg,#1e40af 0%,#2563eb 45%,#0ea5e9 100%);-webkit-background-clip:text;background-clip:text;color:transparent}
.lp-card{background:#fff;border:1px solid #e3e9f4;box-shadow:0 1px 2px rgba(30,27,75,.04),0 10px 30px -12px rgba(30,27,75,.12)}
.lp-cta{background:linear-gradient(135deg,#2563eb,#1d4ed8);box-shadow:0 12px 28px -10px rgba(29,78,216,.6),inset 0 1px 0 rgba(255,255,255,.25);color:#fff}
.lp-cta:hover{filter:brightness(1.05)}
.lp-window{border-radius:16px;overflow:hidden;background:#fff;box-shadow:0 30px 70px -20px rgba(30,27,75,.35),0 0 0 1px rgba(30,27,75,.08)}
.lp-phone{border-radius:46px;padding:11px;background:linear-gradient(145deg,#3a3a46,#111118);box-shadow:0 40px 80px -24px rgba(30,27,75,.5),inset 0 0 0 2px rgba(255,255,255,.08)}
.lp-phone .scr{position:relative;border-radius:36px;overflow:hidden;background:#fff}
.lp-toast{background:#fff;color:#0f172a;border:1px solid #e3e9f4;box-shadow:0 18px 40px -12px rgba(30,27,75,.3)}
@media (min-width:1024px){.lp-tiltR{transform:perspective(2200px) rotateY(-10deg) rotateX(4deg)}.lp-tiltL{transform:perspective(2200px) rotateY(10deg) rotateX(4deg)}}
.lp-reveal{animation:lp-up .7s ease both}
@keyframes lp-up{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
.lp-fade{animation:lp-fade .45s ease both}
@keyframes lp-fade{from{opacity:0;transform:translateY(8px) scale(.985)}to{opacity:1;transform:none}}
.lp-bar{animation:lp-bar linear forwards}
@keyframes lp-bar{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@media (prefers-reduced-motion:reduce){.lp-reveal,.lp-fade{animation:none}.lp-bar{animation:none;transform:scaleX(1)}}
[lang="hi"] .lp-h{letter-spacing:0;line-height:1.22}
`;

const Browser: React.FC<{ src: string; alt: string; className?: string }> = ({ src, alt, className = '' }) => (
  <div className={`lp-window ${className}`}>
    <div className="flex h-7 items-center gap-1.5 bg-slate-100 px-3 border-b border-slate-200">
      <i className="block h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
      <i className="block h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
      <i className="block h-2.5 w-2.5 rounded-full bg-[#28c840]" />
    </div>
    <img src={src} alt={alt} loading="lazy" width={2560} height={1600} className="block w-full h-auto" />
  </div>
);

// Screenshot sizes are fixed by `npm run landing-shots` (desktop 1280×800 @2x, phone 390×780 @2x);
// width/height reserve the space so lazy loading never shifts the page (or a scroll target).
const Phone: React.FC<{ src: string; alt: string; className?: string; statusBar?: boolean; eager?: boolean }> = ({ src, alt, className = '', statusBar, eager }) => (
  <div className={`lp-phone ${className}`}>
    <div className="scr">
      {statusBar && (
        <div className="flex items-center justify-between bg-white px-6 pt-2.5 pb-1 text-[11px] font-semibold text-slate-900">
          <span>11:49</span>
          <span className="absolute left-1/2 top-2 h-5 w-20 -translate-x-1/2 rounded-full bg-slate-900" />
          <span className="flex items-center gap-1">
            <i className="fa-solid fa-signal text-[9px]" />
            4G
            <i className="fa-solid fa-battery-three-quarters" />
          </span>
        </div>
      )}
      <img src={src} alt={alt} loading={eager ? 'eager' : 'lazy'} width={780} height={1560} className="block w-full h-auto" />
    </div>
  </div>
);

const Toast: React.FC<{ icon: string; color: string; title: string; sub: string; className?: string }> = ({ icon, color, title, sub, className = '' }) => (
  <div className={`lp-toast absolute flex items-center gap-3 rounded-2xl py-2.5 pl-2.5 pr-4 ${className}`}>
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white" style={{ background: color }}>
      <i className={icon} />
    </span>
    <span className="leading-tight">
      <b className="block text-sm font-extrabold whitespace-nowrap">{title}</b>
      <span className="block text-xs text-slate-500 whitespace-nowrap">{sub}</span>
    </span>
  </div>
);

const Eyebrow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-blue-700 shadow-sm">
    <span className="h-2 w-2 rounded-full bg-sky-500 shadow-[0_0_8px_#0ea5e9]" />
    {children}
  </span>
);

// Section titles mark their key words with *asterisks* in content.ts; each section styles them
// differently (like a product site's varied headings) so the page doesn't feel repetitive.
type Mark = 'grad' | 'blue' | 'swoosh' | 'marker' | 'pill';
const plain = (text: string) => text.replace(/\*/g, '');
const Title: React.FC<{ text: string; mark: Mark }> = ({ text, mark }) => (
  <>
    {text.split(/(\*[^*]+\*)/).map((part, i) => {
      if (!part.startsWith('*')) return <React.Fragment key={i}>{part}</React.Fragment>;
      const w = part.slice(1, -1);
      if (mark === 'grad') return <span key={i} className="lp-grad">{w}</span>;
      if (mark === 'blue') return <span key={i} className="text-blue-700">{w}</span>;
      if (mark === 'pill')
        return (
          <span key={i} className="mx-1 inline-block rounded-2xl bg-blue-600 px-3 py-0.5 text-white shadow-md shadow-blue-600/30">
            {w}
          </span>
        );
      if (mark === 'marker')
        return (
          <span key={i} className="bg-[linear-gradient(transparent_58%,#bfdbfe_58%,#bfdbfe_92%,transparent_92%)] px-1">
            {w}
          </span>
        );
      return (
        <span key={i} className="relative inline-block whitespace-nowrap">
          {w}
          <svg className="absolute -bottom-2 left-0 h-3 w-full text-blue-500" viewBox="0 0 200 12" preserveAspectRatio="none" aria-hidden="true">
            <path d="M2 9 C 50 2, 110 2, 198 7" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          </svg>
        </span>
      );
    })}
  </>
);

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-sm font-bold uppercase tracking-[0.14em] text-blue-600">{children}</p>
);

export const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const [lang, setLang] = useState<Lang>(readLang);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [why, setWhy] = useState(0);
  const [paused, setPaused] = useState(false);
  const whyRef = useRef<HTMLDivElement>(null);
  const [whyVisible, setWhyVisible] = useState(false);
  const t = COPY[lang];
  const signedIn = !!user;
  const contactHref = SUPPORT_EMAIL ? `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`${BRAND_NAME} plans`)}` : undefined;
  const items = t.why.items;
  const active = items[why];

  useEffect(() => {
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch {
      // storage unavailable: keep the choice for this visit only
    }
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    const prev = document.title;
    document.title = `${BRAND_NAME}: GST Billing, Invoicing & Stock App`;
    return () => {
      document.title = prev;
    };
  }, []);

  // The "Why" items advance on their own only while the section is on screen and not hovered.
  useEffect(() => {
    const el = whyRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => setWhyVisible(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const reduceMotion = typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const autoplay = whyVisible && !paused && !reduceMotion;
  useEffect(() => {
    if (!autoplay) return;
    const id = window.setTimeout(() => setWhy((i) => (i + 1) % items.length), WHY_MS);
    return () => window.clearTimeout(id);
  }, [autoplay, why, items.length]);

  // HashRouter owns the URL hash, so in-page links scroll instead of changing it.
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const Primary: React.FC<{ className?: string; big?: boolean }> = ({ className = '', big }) => (
    <Link
      to={signedIn ? '/dashboard' : '/register'}
      className={`lp-cta inline-flex items-center justify-center gap-2 rounded-full font-bold whitespace-nowrap ${big ? 'px-7 py-4 text-base' : 'px-5 py-2.5 text-sm'} ${className}`}
    >
      {signedIn ? t.dashboard : t.trial}
      <i className="fa-solid fa-arrow-right text-xs" />
    </Link>
  );

  const planFeatureLabels = (id: string) => (PLANS.find((p) => p.id === id)?.features || []).map((k) => FEATURES.find((f) => f.key === k)?.label).filter(Boolean) as string[];
  const navItems = [
    ['features', t.nav.features],
    ['designs', t.nav.designs],
    ['plans', t.nav.plans],
    ['faq', t.nav.faq],
  ] as const;

  return (
    <div className="lp min-h-screen overflow-x-hidden font-sans" lang={lang}>
      <style>{CSS}</style>

      {/* ===== Header ===== */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-2.5 cursor-pointer" aria-label={`${BRAND_NAME} home`}>
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-sky-500 text-white shadow-lg shadow-blue-600/30">
              <i className="fa-solid fa-receipt text-sm" />
            </span>
            <span className="text-lg font-extrabold tracking-tight text-slate-900">{BRAND_NAME}</span>
          </button>
          <nav className="hidden items-center gap-7 text-sm font-semibold text-slate-600 lg:flex" aria-label="Sections">
            {navItems.map(([id, label]) => (
              <button key={id} type="button" onClick={() => scrollTo(id)} className="hover:text-blue-700 cursor-pointer">
                {label}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex rounded-full border border-slate-200 bg-slate-50 p-0.5 text-xs font-bold" role="group" aria-label="Language">
              {(['en', 'hi'] as Lang[]).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLang(l)}
                  aria-pressed={lang === l}
                  className={`rounded-full px-2.5 py-1 cursor-pointer ${lang === l ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  {l === 'en' ? 'EN' : 'हिं'}
                </button>
              ))}
            </div>
            {signedIn ? (
              <Primary />
            ) : (
              <>
                <Link to="/login" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:border-blue-400 hover:text-blue-700">
                  {t.login}
                </Link>
                <span className="hidden sm:block">
                  <Primary />
                </span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ===== Hero ===== */}
      <section className="relative">
        <div className="lp-hero-bg absolute inset-0" aria-hidden="true" />
        <div className="lp-grid absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pb-20 pt-14 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pb-28 lg:pt-20">
          <div className="lp-reveal">
            <Eyebrow>{t.hero.eyebrow}</Eyebrow>
            <h1 className="lp-h mt-6 text-[2.75rem] font-black leading-[1.04] tracking-[-0.035em] text-slate-900 [text-wrap:balance] sm:text-6xl xl:text-7xl">
              {t.hero.title[0]} <span className="lp-grad">{t.hero.title[1]}</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">{t.hero.text}</p>
            <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <Primary big />
              {!signedIn && (
                <p className="text-sm text-slate-600">
                  {t.haveAccount}{' '}
                  <Link to="/login" className="font-semibold text-blue-700 underline decoration-blue-300 underline-offset-4 hover:decoration-blue-700">
                    {t.login}
                  </Link>
                </p>
              )}
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-slate-600">
              {t.hero.checks.map((c) => (
                <li key={c} className="flex items-center gap-2">
                  <i className="fa-solid fa-circle-check text-emerald-500" />
                  {c}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative lp-reveal" style={{ animationDelay: '.15s' }}>
            <Browser src={img('dashboard.jpg')} alt="Dashboard" className="lp-tiltR relative ml-auto w-full max-w-[640px]" />
            <Phone src={img('invoice-phone.jpg')} alt="Invoice on a phone" eager className="lp-tiltL absolute -bottom-10 -left-2 w-[150px] sm:w-[190px] lg:-left-10" />
            <Toast icon="fa-brands fa-whatsapp" color="#22c55e" title={t.hero.toastSent[0]} sub={t.hero.toastSent[1]} className="left-[30%] -bottom-6 hidden sm:flex" />
            <Toast icon="fa-solid fa-indian-rupee-sign" color="#2563eb" title={t.hero.toastPaid[0]} sub={t.hero.toastPaid[1]} className="-top-6 right-2 hidden sm:flex" />
          </div>
        </div>
      </section>

      {/* ===== Trust strip ===== */}
      <section className="border-y border-slate-200 bg-slate-50">
        <ul className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-4 py-6 text-sm font-semibold text-slate-700 sm:px-6">
          {t.strip.map((s, i) => (
            <li key={s} className="flex items-center gap-2">
              <i className={['fa-solid fa-file-invoice', 'fa-brands fa-whatsapp', 'fa-solid fa-qrcode', 'fa-solid fa-boxes-stacked', 'fa-solid fa-file-excel'][i] + ' text-blue-600'} />
              {s}
            </li>
          ))}
        </ul>
      </section>

      {/* ===== Problems ===== */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <h2 className="lp-h text-center text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          <Title text={t.problems.title} mark="swoosh" />
        </h2>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {t.problems.items.map((p) => (
            <div key={p.problem} className="lp-card rounded-3xl p-6">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-rose-50 text-rose-500">
                <i className={p.icon} />
              </span>
              <p className="mt-4 text-lg font-semibold text-slate-800">{p.problem}</p>
              <p className="mt-4 flex items-start gap-2 border-t border-slate-100 pt-4 text-slate-600">
                <i className="fa-solid fa-arrow-right mt-1 text-emerald-500" />
                {p.fix}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== Why myBillCounter: numbered items + phone ===== */}
      <section id="features" className="scroll-mt-20 lp-tint">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-white shadow-md shadow-blue-600/30">
              <i className="fa-solid fa-award" />
              {t.why.eyebrow}
            </span>
            <h2 className="lp-h mt-5 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-[2.6rem] sm:leading-tight [text-wrap:balance]">
              <Title text={t.why.title} mark="blue" />
            </h2>
            <p className="mt-4 text-lg text-slate-600">{t.why.text}</p>
          </div>

          <div
            ref={whyRef}
            className="mt-14 grid items-center gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
          >
            <div role="tablist" aria-label={plain(t.why.title)} aria-orientation="vertical" className="order-2 lg:order-1">
              {items.map((it, i) => {
                const on = i === why;
                return (
                  <div key={it.id} className={`relative border-b border-slate-200 transition-[padding] ${on ? 'lg:pl-6' : ''}`}>
                    {on && <span className="absolute left-0 top-5 bottom-5 hidden w-1 rounded-full lg:block" style={{ background: it.color }} aria-hidden="true" />}
                    <button
                      type="button"
                      role="tab"
                      id={`why-tab-${it.id}`}
                      aria-selected={on}
                      aria-controls="why-panel"
                      onClick={() => setWhy(i)}
                      className="flex w-full items-start gap-4 py-5 text-left cursor-pointer"
                    >
                      <span className={`w-12 shrink-0 text-3xl font-black tabular-nums ${on ? 'text-slate-900' : 'text-slate-300'}`}>{String(i + 1).padStart(2, '0')}</span>
                      <span className="min-w-0">
                        <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-bold uppercase tracking-wide" style={{ color: it.color, background: `${it.color}14` }}>
                          <i className={it.icon} />
                          {it.chip}
                        </span>
                        <span className={`mt-2 block text-lg font-bold ${on ? 'text-slate-900' : 'text-slate-500'}`}>{it.title}</span>
                        {on && <span className="lp-fade mt-2 block text-[15px] leading-relaxed text-slate-600">{it.text}</span>}
                      </span>
                    </button>
                    {on && (
                      <span className="absolute -bottom-px left-0 h-[3px] w-full overflow-hidden rounded-full" aria-hidden="true">
                        <span
                          key={`${why}-${autoplay}`}
                          className={`block h-full origin-left ${autoplay ? 'lp-bar' : ''}`}
                          style={{ background: it.color, animationDuration: `${WHY_MS}ms`, transform: autoplay ? undefined : 'scaleX(1)' }}
                        />
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <div id="why-panel" role="tabpanel" aria-labelledby={`why-tab-${active.id}`} className="order-1 lg:order-2">
              <div className="relative mx-auto w-[250px] sm:w-[290px]">
                <div className="absolute -inset-10 rounded-full blur-3xl opacity-30" style={{ background: active.color }} aria-hidden="true" />
                <Phone key={active.id} src={img(active.image)} alt={active.title} statusBar className="lp-fade relative" />
                <Toast
                  key={`t-${active.id}`}
                  icon={active.icon}
                  color={active.color}
                  title={active.toast[0]}
                  sub={active.toast[1]}
                  className="lp-fade top-[58%] left-[62%] hidden sm:flex"
                />
              </div>
              <div className="mt-8 flex justify-center gap-2" aria-hidden="true">
                {items.map((it, i) => (
                  <span key={it.id} className="h-1.5 rounded-full transition-all" style={{ width: i === why ? 28 : 8, background: i === why ? active.color : '#cbd5e1' }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== And much more: compact grid of every feature ===== */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <h2 className="lp-h text-center text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          <Title text={t.moreTitle} mark="marker" />
        </h2>
        <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
          {t.grid.map(([icon, title, sub], i) => {
            const c = ['#6d45f9', '#16a34a', '#0284c7', '#d97706', '#7c3aed', '#db2777', '#4f46e5', '#dc2626', '#059669', '#2563eb', '#15803d', '#9333ea', '#be185d', '#ea580c', '#0d9488', '#475569'][i % 16];
            return (
              <div key={title} className="lp-card rounded-2xl p-4 sm:p-5 transition hover:-translate-y-0.5">
                <span className="grid h-10 w-10 place-items-center rounded-xl" style={{ color: c, background: `${c}14` }}>
                  <i className={icon} />
                </span>
                <p className="mt-3 font-bold text-slate-900">{title}</p>
                <p className="mt-1 text-sm text-slate-500">{sub}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ===== Invoice designs ===== */}
      <section id="designs" className="scroll-mt-20 bg-gradient-to-br from-sky-50 via-white to-blue-50">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-24 sm:px-6 lg:grid-cols-2">
          <div>
            <SectionLabel>{t.designs.eyebrow}</SectionLabel>
            <h2 className="lp-h mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              <Title text={t.designs.title} mark="blue" />
            </h2>
            <p className="mt-4 text-lg text-slate-600">{t.designs.text}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {t.designs.chips.map((c) => (
                <span key={c} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
                  {c}
                </span>
              ))}
            </div>
          </div>
          <div className="relative flex items-center justify-center gap-4 sm:gap-6">
            <div className="lp-window lp-tiltL w-[62%]">
              <img src={img('design-modern.jpg')} alt="Modern invoice design" loading="lazy" width={1480} height={910} className="block w-full h-auto" />
            </div>
            <div className="lp-window lp-tiltR w-[32%]">
              <img src={img('design-thermal.jpg')} alt="Thermal receipt design" loading="lazy" width={620} height={910} className="block w-full h-auto" />
            </div>
          </div>
        </div>
      </section>

      {/* ===== Run your business from anywhere ===== */}
      <section className="lp-tint">
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 py-24 sm:px-6 lg:grid-cols-2">
          <div>
            <h2 className="lp-h text-4xl font-black leading-[1.05] tracking-tight text-slate-900 sm:text-[3.4rem] [text-wrap:balance]">
              <Title text={t.anywhere.title} mark="blue" />
            </h2>
            <p className="mt-5 max-w-xl text-lg text-slate-600">{t.anywhere.text}</p>
            <ul className="mt-8 space-y-4">
              {t.anywhere.points.map(([icon, text]) => (
                <li key={text} className="flex items-center gap-4 text-[17px] font-medium text-slate-800">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-blue-700 shadow-sm ring-1 ring-blue-100">
                    <i className={icon} />
                  </span>
                  {text}
                </li>
              ))}
            </ul>
            <div className="mt-9">
              <Link to={signedIn ? '/dashboard' : '/register'} className="lp-cta inline-flex items-center gap-2 rounded-full px-6 py-3 font-bold">
                {signedIn ? t.dashboard : t.anywhere.cta}
                <i className="fa-solid fa-arrow-right text-xs" />
              </Link>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-[600px] pb-6">
            <div className="lp-laptop mr-[14%]">
              <div className="rounded-t-[18px] border-[10px] border-b-[14px] border-slate-900 bg-slate-900 shadow-2xl">
                <img src={img('dashboard.jpg')} alt="myBillCounter on a laptop" loading="lazy" width={2560} height={1600} className="block w-full h-auto rounded-[4px]" />
              </div>
              <div className="base" aria-hidden="true" />
            </div>
            <Phone src={img('phone-dashboard.jpg')} alt="myBillCounter on a phone" className="absolute bottom-0 right-0 w-[26%] min-w-[110px]" />
          </div>
        </div>
      </section>

      {/* ===== How it works + who it's for ===== */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <h2 className="lp-h text-center text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          <Title text={t.how.title} mark="pill" />
        </h2>
        <ol className="mt-14 grid gap-8 md:grid-cols-3 md:gap-5">
          {t.how.steps.map(([title, text], i) => (
            <li key={title} className="lp-card relative rounded-3xl p-6 pt-9">
              <span className="lp-cta absolute -top-5 left-6 grid h-10 w-10 place-items-center rounded-full text-lg font-black">{i + 1}</span>
              <p className="text-lg font-bold text-slate-900">{title}</p>
              <p className="mt-2 text-slate-600">{text}</p>
            </li>
          ))}
        </ol>
        <h3 className="lp-h mt-24 text-center text-2xl font-extrabold tracking-tight text-slate-900">
          <Title text={t.who.title} mark="marker" />
        </h3>
        <div className="mx-auto mt-8 flex max-w-4xl flex-wrap justify-center gap-3">
          {t.who.items.map((w) => (
            <span key={w} className="rounded-full border border-slate-200 bg-slate-50 px-5 py-2.5 text-sm font-semibold text-slate-700">
              {w}
            </span>
          ))}
        </div>
      </section>

      {/* ===== Plans ===== */}
      <section id="plans" className="scroll-mt-20 lp-tint">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <SectionLabel>{t.plans.eyebrow}</SectionLabel>
            <h2 className="lp-h mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              <Title text={t.plans.title} mark="grad" />
            </h2>
            <p className="mt-4 text-lg text-slate-600">{t.plans.text}</p>
          </div>
          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {(['trial', 'basic', 'pro'] as const).map((id) => {
              const pro = id === 'pro';
              const labels = planFeatureLabels(id);
              return (
                <div key={id} className={`relative flex flex-col rounded-3xl p-7 ${pro ? 'border-2 border-blue-500 bg-white shadow-xl shadow-blue-200/60' : 'lp-card'}`}>
                  {pro && <span className="lp-cta absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-xs font-bold">{t.plans.popular}</span>}
                  <p className="text-xl font-extrabold text-slate-900">{t.plans.names[id]}</p>
                  <p className="mt-1 text-sm text-slate-500">{t.plans.desc[id]}</p>
                  <p className="mt-6 text-3xl font-black text-slate-900">{id === 'trial' ? `₹0` : t.plans.contact}</p>
                  <p className="mt-1 text-sm text-slate-500">{id === 'trial' ? t.plans.trialNote.replace('14', String(TRIAL_DAYS)) : ' '}</p>
                  <ul className="mt-6 flex-1 space-y-3 text-sm">
                    {[t.plans.core, ...labels].map((l) => (
                      <li key={l} className="flex items-start gap-2.5">
                        <i className="fa-solid fa-check mt-0.5 text-emerald-500" />
                        <span className="text-slate-700">{l}</span>
                      </li>
                    ))}
                  </ul>
                  {id === 'trial' || !contactHref ? (
                    <Link to={signedIn ? '/dashboard' : '/register'} className="lp-cta mt-8 rounded-full py-3 text-center font-bold">
                      {signedIn ? t.dashboard : t.plans.ctaTrial}
                    </Link>
                  ) : (
                    <a
                      href={contactHref}
                      className={`mt-8 rounded-full py-3 text-center font-bold ${pro ? 'bg-blue-600 text-white hover:bg-blue-700' : 'border border-slate-300 text-slate-800 hover:border-blue-400 hover:text-blue-700'}`}
                    >
                      {t.plans.ctaContact}
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section id="faq" className="scroll-mt-20 mx-auto grid max-w-7xl gap-10 px-4 py-24 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <SectionLabel>{t.nav.faq}</SectionLabel>
          <h2 className="lp-h mt-3 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
            <Title text={t.faq.title} mark="swoosh" />
          </h2>
          <p className="mt-6 text-lg text-slate-600">{t.faq.text}</p>
          {SUPPORT_EMAIL && (
            <a href={`mailto:${SUPPORT_EMAIL}`} className="mt-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-5 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100">
              <i className="fa-regular fa-envelope" />
              {SUPPORT_EMAIL}
            </a>
          )}
        </div>
        <div className="space-y-3">
          {t.faq.items.map(([q, a], i) => {
            const open = openFaq === i;
            return (
              <div key={q} className={`rounded-2xl border ${open ? 'border-blue-200 bg-blue-50/40' : 'border-slate-200 bg-white'}`}>
                <button
                  type="button"
                  onClick={() => setOpenFaq(open ? null : i)}
                  aria-expanded={open}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-semibold text-slate-900 cursor-pointer"
                >
                  {q}
                  <i className={`fa-solid fa-chevron-down text-xs text-blue-600 transition-transform ${open ? 'rotate-180' : ''}`} />
                </button>
                {open && <p className="px-5 pb-5 text-slate-600">{a}</p>}
              </div>
            );
          })}
        </div>
      </section>

      {/* ===== Final CTA ===== */}
      <section className="px-4 pb-24 sm:px-6">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-700 via-blue-600 to-sky-600 px-6 py-16 text-center text-white shadow-2xl shadow-blue-300/60">
          <div
            className="absolute inset-0 opacity-30"
            style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.15) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.15) 1px,transparent 1px)', backgroundSize: '48px 48px' }}
            aria-hidden="true"
          />
          <div className="relative">
            <h2 className="lp-h text-3xl font-black tracking-tight sm:text-5xl">{t.final.title}</h2>
            <p className="mt-4 text-lg text-white/85">{t.final.text}</p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Primary big />
              {!signedIn && (
                <Link to="/login" className="rounded-full border border-white/50 px-7 py-4 font-bold hover:bg-white/10">
                  {t.login}
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ===== Footer: dark, multi-column ===== */}
      <footer className="bg-[#1f2530] text-slate-300">
        <div className="mx-auto max-w-7xl px-4 pt-16 pb-8 sm:px-6">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-sky-500 text-white">
                  <i className="fa-solid fa-receipt" />
                </span>
                <span className="text-xl font-extrabold text-white">{BRAND_NAME}</span>
              </div>
              <p className="mt-3 max-w-xs text-sm text-slate-400">{t.footer.tagline}</p>
              {(SUPPORT_EMAIL || SUPPORT_PHONE) && (
                <>
                  <p className="mt-8 text-sm font-bold text-white">{t.footer.touch}</p>
                  <ul className="mt-4 space-y-4 text-sm">
                    {SUPPORT_PHONE && (
                      <li className="flex items-start gap-3">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blue-100 text-blue-700">
                          <i className="fa-solid fa-phone" />
                        </span>
                        <span>
                          <b className="block text-white">Phone / WhatsApp</b>
                          {SUPPORT_PHONE}
                        </span>
                      </li>
                    )}
                    {SUPPORT_EMAIL && (
                      <li className="flex items-start gap-3">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blue-100 text-blue-700">
                          <i className="fa-solid fa-envelope" />
                        </span>
                        <span className="min-w-0">
                          <b className="block text-white">{t.footer.email}</b>
                          <a href={`mailto:${SUPPORT_EMAIL}`} className="break-all hover:text-white">
                            {SUPPORT_EMAIL}
                          </a>
                        </span>
                      </li>
                    )}
                  </ul>
                </>
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-white">{t.footer.product}</p>
              <ul className="mt-4 space-y-3 text-sm">
                {navItems.map(([id, label]) => (
                  <li key={id}>
                    <button type="button" onClick={() => scrollTo(id)} className="hover:text-white cursor-pointer">
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-sm font-bold text-white">{t.footer.account}</p>
              <ul className="mt-4 space-y-3 text-sm">
                {signedIn ? (
                  <li>
                    <Link to="/dashboard" className="hover:text-white">
                      {t.dashboard}
                    </Link>
                  </li>
                ) : (
                  <>
                    <li>
                      <Link to="/login" className="hover:text-white">
                        {t.login}
                      </Link>
                    </li>
                    <li>
                      <Link to="/register" className="hover:text-white">
                        {t.trial}
                      </Link>
                    </li>
                  </>
                )}
              </ul>
            </div>
            <div>
              <p className="text-sm font-bold text-white">{t.footer.resources}</p>
              <ul className="mt-4 space-y-3 text-sm">
                <li>
                  <button
                    type="button"
                    onClick={() => import('../utils/sampleProducts').then((m) => m.downloadSampleProducts())}
                    className="text-left hover:text-white cursor-pointer"
                  >
                    <i className="fa-solid fa-file-excel mr-1.5 text-emerald-400" />
                    {t.footer.sample}
                  </button>
                </li>
                {t.designs.chips.slice(0, 3).map((c) => (
                  <li key={c}>
                    <button type="button" onClick={() => scrollTo('designs')} className="hover:text-white cursor-pointer">
                      {c}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-12 flex flex-wrap gap-3 border-t border-white/10 pt-8">
            {t.strip.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => scrollTo('features')}
                className="rounded-full border border-white/20 px-4 py-1.5 text-xs font-semibold text-slate-200 hover:border-white/50 hover:text-white cursor-pointer"
              >
                {c}
              </button>
            ))}
          </div>
          <div className="mt-8 flex flex-col gap-2 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {new Date().getFullYear()} {BRAND_NAME}. {t.footer.rights}
            </p>
            <p>{t.footer.madeIn}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
