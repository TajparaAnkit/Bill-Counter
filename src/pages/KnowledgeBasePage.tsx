import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Layout } from '../components/shared/Layout';
import { FaIcon } from '../components/shared/FaIcon';
import { ARTICLES, CATEGORIES, KbArticle, START_HERE } from '../components/KnowledgeBase/articles';
import { useAccount } from '../hooks/useAccount';
import { hasFeature } from '../config/features';
import { BRAND_NAME } from '../config/brand';

// Help Center. Home = search + "Start here" checklist + category cards.
// `?a=<article-id>` opens an article (deep-linkable from anywhere in the app),
// `?q=<text>` runs a search.

const byId = new Map(ARTICLES.map((a) => [a.id, a]));
const catOf = (a: KbArticle) => CATEGORIES.find((c) => c.id === a.category)!;

const matches = (a: KbArticle, q: string) => {
  const hay = `${a.title} ${a.summary} ${a.keywords} ${catOf(a).label}`.toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((w) => hay.includes(w));
};

const ArticleCard: React.FC<{ a: KbArticle; onOpen: (id: string) => void; showCategory?: boolean }> = ({ a, onOpen, showCategory }) => {
  const c = catOf(a);
  return (
    <button
      onClick={() => onOpen(a.id)}
      className="group w-full text-left flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-4 hover:border-brand-300 hover:shadow-sm transition cursor-pointer"
    >
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${c.tint}`}>
        <FaIcon icon={a.icon} size={16} />
      </span>
      <span className="flex-1 min-w-0">
        {showCategory && <span className="block text-[11px] font-semibold text-slate-400 mb-0.5">{c.label}</span>}
        <span className="block font-semibold text-slate-800 group-hover:text-brand-700">{a.title}</span>
        <span className="block text-sm text-slate-500 mt-0.5 line-clamp-2">{a.summary}</span>
        <span className="block text-[11px] text-slate-400 mt-1.5">
          <FaIcon icon="fa-regular fa-clock" size={10} /> {a.minutes} min read
        </span>
      </span>
      <FaIcon icon="fa-solid fa-chevron-right" size={12} className="text-slate-300 group-hover:text-brand-500 mt-1" />
    </button>
  );
};

// "On this page" — built from the article's <Step> headings after render.
const useToc = (articleId: string | null, ref: React.RefObject<HTMLDivElement | null>) => {
  const [toc, setToc] = useState<{ id: string; title: string }[]>([]);
  useEffect(() => {
    if (!ref.current) return setToc([]);
    const els = Array.from(ref.current.querySelectorAll<HTMLElement>('[data-kb-step]'));
    setToc(els.map((el) => ({ id: el.id, title: el.dataset.kbStep || '' })));
  }, [articleId, ref]);
  return toc;
};

export const KnowledgeBasePage: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const articleId = params.get('a');
  // Articles for features outside the client's plan are hidden.
  const { account } = useAccount();
  const articles = useMemo(() => ARTICLES.filter((x) => !x.feature || hasFeature(account, x.feature)), [account]);
  const found = articleId ? byId.get(articleId) : undefined;
  const article = found && articles.includes(found) ? found : null;
  const [search, setSearch] = useState(params.get('q') || '');
  const bodyRef = useRef<HTMLDivElement>(null);
  const toc = useToc(article?.id || null, bodyRef);

  const open = (id: string) => {
    setParams({ a: id });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const goHome = () => {
    setSearch('');
    setParams({});
  };

  useEffect(() => {
    if (article) document.title = `${article.title} · Help`;
    return () => {
      document.title = BRAND_NAME;
    };
  }, [article]);

  const results = useMemo(() => (search.trim() ? articles.filter((a) => matches(a, search.trim())) : []), [search, articles]);
  const idx = article ? articles.indexOf(article) : -1;
  const prev = idx > 0 ? articles[idx - 1] : null;
  const next = idx >= 0 && idx < articles.length - 1 ? articles[idx + 1] : null;

  const SearchBox = (
    <div className="relative">
      <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <FaIcon icon="fa-solid fa-magnifying-glass" size={15} className="text-brand-400" />
      </span>
      <input
        type="search"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          if (article) setParams({});
        }}
        placeholder="Search help — e.g. partial payment, GST, WhatsApp, import"
        aria-label="Search help articles"
        className="w-full pl-11 pr-4 py-3 rounded-lg bg-white text-slate-800 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-white/60"
      />
    </div>
  );

  // ---------------- Article view ----------------
  if (article) {
    const c = catOf(article);
    const related = (article.related || []).map((id) => byId.get(id)).filter((x): x is KbArticle => !!x && articles.includes(x));
    return (
      <Layout>
        <div className="animate-slide-up">
          <div className="grid grid-cols-1 lg:grid-cols-[210px_minmax(0,1fr)] gap-6">
            {/* Left: all articles */}
            <aside className="hidden lg:block">
              <div className="sticky top-4 space-y-4 max-h-[calc(100vh-2rem)] overflow-y-auto pr-1">
                <button onClick={goHome} className="flex items-center gap-2 text-sm font-semibold text-brand-700 hover:underline cursor-pointer">
                  <FaIcon icon="fa-solid fa-arrow-left" size={12} /> Help Center
                </button>
                {CATEGORIES.map((cat) => (
                  <div key={cat.id}>
                    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      <FaIcon icon={cat.icon} size={10} /> {cat.label}
                    </div>
                    <div className="space-y-0.5">
                      {articles.filter((a) => a.category === cat.id).map((a) => (
                        <button
                          key={a.id}
                          onClick={() => open(a.id)}
                          className={`block w-full text-left text-[13px] px-2.5 py-1.5 rounded-md cursor-pointer ${
                            a.id === article.id ? 'bg-brand-50 text-brand-700 font-semibold' : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {a.title}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </aside>

            {/* Main */}
            <article className="min-w-0">
              <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-3" aria-label="Breadcrumb">
                <button onClick={goHome} className="hover:text-brand-700 cursor-pointer">
                  Help Center
                </button>
                <FaIcon icon="fa-solid fa-chevron-right" size={8} />
                <span>{c.label}</span>
              </nav>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <header className="px-5 sm:px-8 pt-6 pb-5 border-b border-slate-100 bg-linear-to-br from-brand-50/70 to-white">
                  <div className="flex items-start gap-4">
                    <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${c.tint}`}>
                      <FaIcon icon={article.icon} size={20} />
                    </span>
                    <div>
                      <h1 className="text-xl sm:text-2xl font-bold text-slate-800">{article.title}</h1>
                      <p className="text-sm text-slate-500 mt-1">{article.summary}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-slate-400">
                        <span>
                          <FaIcon icon="fa-regular fa-clock" size={10} /> {article.minutes} min read
                        </span>
                        {toc.length > 0 && (
                          <span>
                            <FaIcon icon="fa-solid fa-list-ol" size={10} /> {toc.length} steps
                          </span>
                        )}
                        {article.where && (
                          <span>
                            <FaIcon icon="fa-solid fa-location-dot" size={10} /> {article.where}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </header>
                {toc.length > 1 && (
                  <nav className="px-5 sm:px-8 py-3 border-b border-slate-100 bg-slate-50/60" aria-label="On this page">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">On this page</div>
                    <ol className="flex flex-wrap gap-x-4 gap-y-1">
                      {toc.map((t, i) => (
                        <li key={t.id}>
                          <a
                            href={`#${t.id}`}
                            onClick={(e) => {
                              e.preventDefault();
                              document.getElementById(t.id)?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="text-[12px] font-semibold text-brand-700 hover:underline"
                          >
                            {i + 1}. {t.title}
                          </a>
                        </li>
                      ))}
                    </ol>
                  </nav>
                )}
                <div ref={bodyRef} className="kb-article px-5 sm:px-8 py-6 text-sm text-slate-700 leading-relaxed">
                  <article.Body />
                </div>
              </div>

              {related.length > 0 && (
                <div className="mt-6">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Related guides</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {related.map((r) => (
                      <ArticleCard key={r.id} a={r} onOpen={open} showCategory />
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 grid grid-cols-2 gap-3">
                {prev ? (
                  <button onClick={() => open(prev.id)} className="text-left rounded-lg border border-slate-200 bg-white p-3 hover:border-brand-300 cursor-pointer">
                    <span className="block text-[11px] text-slate-400">
                      <FaIcon icon="fa-solid fa-arrow-left" size={9} /> Previous
                    </span>
                    <span className="block text-sm font-semibold text-slate-700 truncate">{prev.title}</span>
                  </button>
                ) : (
                  <span />
                )}
                {next && (
                  <button onClick={() => open(next.id)} className="text-right rounded-lg border border-slate-200 bg-white p-3 hover:border-brand-300 cursor-pointer">
                    <span className="block text-[11px] text-slate-400">
                      Next <FaIcon icon="fa-solid fa-arrow-right" size={9} />
                    </span>
                    <span className="block text-sm font-semibold text-slate-700 truncate">{next.title}</span>
                  </button>
                )}
              </div>
            </article>

          </div>
        </div>
      </Layout>
    );
  }

  // ---------------- Home / search ----------------
  return (
    <Layout>
      <div className="space-y-6 animate-slide-up">
        <div className="relative overflow-hidden rounded-xl bg-brand-600 px-6 py-8 sm:px-10 text-white">
          <div aria-hidden="true" className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10" />
          <div aria-hidden="true" className="absolute right-24 -bottom-16 h-40 w-40 rounded-full bg-white/5" />
          <div className="relative max-w-2xl">
            <div className="flex items-center gap-3">
              <FaIcon icon="fa-solid fa-book-open" size={22} />
              <h1 className="text-2xl font-bold">Help Center</h1>
            </div>
            <p className="mt-2 text-brand-100 text-sm">Step-by-step guides with screen examples for every feature: invoices, payments, customers, products, dashboard and settings.</p>
            <div className="mt-5">{SearchBox}</div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="text-brand-200">Popular:</span>
              {['bills-create', 'payments', 'party-statement', 'products-bulk-import', 'invoice-share'].map((id) => {
                const a = byId.get(id);
                return a ? (
                  <button key={id} onClick={() => open(id)} className="rounded-full bg-white/15 hover:bg-white/25 px-2.5 py-1 font-semibold cursor-pointer">
                    {a.title}
                  </button>
                ) : null;
              })}
            </div>
          </div>
        </div>

        {search.trim() ? (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-700">
                {results.length} result{results.length === 1 ? '' : 's'} for “{search.trim()}”
              </h2>
              <button onClick={goHome} className="text-xs font-semibold text-brand-700 hover:underline cursor-pointer">
                Clear search
              </button>
            </div>
            {results.length ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {results.map((a) => (
                  <ArticleCard key={a.id} a={a} onOpen={open} showCategory />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-10 text-center text-slate-500 text-sm">
                No guides match “{search.trim()}”. Try a simpler word like <em>invoice</em>, <em>payment</em> or <em>customer</em>.
              </div>
            )}
          </section>
        ) : (
          <>
            {/* Start here */}
            <section className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-1">
                <FaIcon icon="fa-solid fa-flag-checkered" size={14} className="text-brand-600" />
                <h2 className="text-base font-bold text-slate-800">New here? Start with these 5 steps</h2>
              </div>
              <p className="text-sm text-slate-500 mb-4">About 10 minutes from sign-up to your first invoice sent on WhatsApp.</p>
              <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {START_HERE.map((s, i) => (
                  <li key={s.id}>
                    <button onClick={() => open(s.id)} className="group h-full w-full text-left rounded-lg border border-slate-200 p-3 hover:border-brand-300 hover:bg-brand-50/40 cursor-pointer">
                      <span className="grid place-items-center w-7 h-7 rounded-full bg-brand-600 text-white text-xs font-bold">{i + 1}</span>
                      <span className="block mt-2 text-sm font-semibold text-slate-800 group-hover:text-brand-700">{s.label}</span>
                      <span className="block text-xs text-slate-500 mt-0.5">{s.hint}</span>
                    </button>
                  </li>
                ))}
              </ol>
            </section>

            {/* Categories */}
            <section>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 px-1">Browse by topic</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {CATEGORIES.map((cat) => {
                  const list = articles.filter((a) => a.category === cat.id);
                  return (
                    <div key={cat.id} className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col">
                      <div className="flex items-center gap-3">
                        <span className={`grid h-10 w-10 place-items-center rounded-lg ${cat.tint}`}>
                          <FaIcon icon={cat.icon} size={16} />
                        </span>
                        <div>
                          <h3 className="font-bold text-slate-800">{cat.label}</h3>
                          <p className="text-xs text-slate-400">
                            {list.length} guide{list.length === 1 ? '' : 's'}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-slate-500 mt-3">{cat.description}</p>
                      <div className="mt-3 space-y-0.5 flex-1">
                        {list.map((a) => (
                          <button key={a.id} onClick={() => open(a.id)} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 -mx-2 text-left text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-700 cursor-pointer">
                            <FaIcon icon="fa-regular fa-file-lines" size={12} className="text-slate-400" />
                            <span className="flex-1 truncate">{a.title}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">
              Can&apos;t find what you need? Check the <button onClick={() => open('faq')} className="font-semibold text-brand-700 hover:underline cursor-pointer">FAQ &amp; troubleshooting</button> guide, or go back to the{' '}
              <Link to="/dashboard" className="font-semibold text-brand-700 hover:underline">
                Dashboard
              </Link>
              .
            </section>
          </>
        )}
      </div>
    </Layout>
  );
};
