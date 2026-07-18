import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FaIcon } from '../components/shared/FaIcon';
import { getPublicCatalog } from '../services/db';
import { Product, PublicProfile } from '../types';
import { BRAND_NAME } from '../config/brand';
import { getCatalogTheme } from '../config/catalogThemes';

// Build a wa.me link. Indian 10-digit numbers get the 91 country code.
const whatsappLink = (phone: string, text: string): string => {
  const digits = (phone || '').replace(/\D/g, '');
  const withCc = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${withCc}?text=${encodeURIComponent(text)}`;
};

export const CatalogPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!userId) return;
      try {
        setLoading(true);
        const { profile, products } = await getPublicCatalog(userId);
        setProfile(profile);
        setProducts(products);
      } catch (err) {
        console.error('Failed to load catalog:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  const shopName = profile?.businessName || 'Our Shop';
  const phone = profile?.phone || '';
  const hasWhatsApp = phone.replace(/\D/g, '').length >= 10;
  const theme = getCatalogTheme(); // fixed default theme (not user-configurable)

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.trim().toLowerCase())
  );

  const orderMessage = (p: Product) =>
    `Hi ${shopName}! I'm interested in "${p.name}" (₹${p.price.toFixed(2)}). Is it available?`;

  const generalMessage = `Hi ${shopName}! I'd like to know more about your products.`;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
        <FaIcon icon="fa-solid fa-spinner" className="animate-spin text-blue-500" size={36} />
        <p className="text-slate-500 font-medium">Loading catalog…</p>
      </div>
    );
  }

  // No profile AND no products → invalid / empty catalog link.
  if (!profile && products.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-3 px-6 text-center">
        <FaIcon icon="fa-solid fa-store-slash" className="text-slate-300" size={48} />
        <h1 className="text-xl font-bold text-slate-700">Catalog not found</h1>
        <p className="text-slate-500 max-w-sm">
          This store link may be incorrect, or the seller hasn't published their catalog yet.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Shop header — boutique-style hero */}
      <header className={`relative overflow-hidden ${theme.header} ${theme.headerText}`}>
        {/* Decorative glows */}
        <div className="pointer-events-none absolute -top-24 -left-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className={`pointer-events-none absolute -bottom-28 -right-12 h-72 w-72 rounded-full ${theme.glow} blur-3xl`} />

        <div className="relative max-w-5xl mx-auto px-5 pt-12 pb-16 text-center">
          {/* Avatar */}
          <span className={`mx-auto grid h-20 w-20 place-items-center rounded-3xl ${theme.avatar} backdrop-blur text-3xl font-black shadow-lg`}>
            {shopName.charAt(0).toUpperCase()}
          </span>

          <h1 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight font-display">
            {shopName}
          </h1>
          <p className={`mt-2 ${theme.subText} text-sm sm:text-base`}>
            {profile?.tagline || '✨ Handmade with love'}
          </p>

          {/* Trust badges */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
            <span className={`inline-flex items-center gap-1.5 rounded-full ${theme.chip} px-3.5 py-1.5 text-xs font-semibold backdrop-blur`}>
              <FaIcon icon="fa-solid fa-box-open" size={12} /> {products.length} Products
            </span>
            <span className={`inline-flex items-center gap-1.5 rounded-full ${theme.chip} px-3.5 py-1.5 text-xs font-semibold backdrop-blur`}>
              <FaIcon icon="fa-solid fa-hand-holding-heart" size={12} /> Handmade
            </span>
            {hasWhatsApp && (
              <span className={`inline-flex items-center gap-1.5 rounded-full ${theme.chip} px-3.5 py-1.5 text-xs font-semibold backdrop-blur`}>
                <FaIcon icon="fa-solid fa-bolt" size={12} /> Quick Replies
              </span>
            )}
          </div>

          {hasWhatsApp && (
            <a
              href={whatsappLink(phone, generalMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-green-500 hover:bg-green-600 px-6 py-3 text-sm font-bold shadow-lg shadow-green-900/20 transition-all hover:-translate-y-0.5"
            >
              <FaIcon icon="fa-brands fa-whatsapp" size={18} />
              Chat with us on WhatsApp
            </a>
          )}
        </div>

        {/* Curved bottom that flows into the page */}
        <div className="relative h-8 bg-slate-50 rounded-t-[2.5rem]" />
      </header>

      {/* Search — floats up onto the curve */}
      <div className="max-w-5xl mx-auto px-5 -mt-2 relative z-10">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <FaIcon icon="fa-solid fa-magnifying-glass" size={16} className="text-slate-400" />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products…"
            className={`w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-slate-200 shadow-xs focus:outline-none focus:ring-2 ${theme.focusRing}`}
          />
        </div>
      </div>

      {/* Product grid */}
      <main className="max-w-5xl mx-auto px-5 py-6">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-150 p-12 text-center text-slate-500">
            {search ? `No products match “${search}”.` : 'No products available yet.'}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-slate-150 shadow-xs overflow-hidden flex flex-col"
              >
                <div className="aspect-square bg-slate-50 overflow-hidden">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">🧶</div>
                  )}
                </div>
                <div className="p-3 flex flex-col flex-1">
                  <h3 className="font-semibold text-slate-800 text-sm leading-snug line-clamp-2">{p.name}</h3>
                  <p className={`${theme.priceText} font-bold mt-1`}>₹{p.price.toFixed(2)}</p>
                  {hasWhatsApp && (
                    <a
                      href={whatsappLink(phone, orderMessage(p))}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center justify-center gap-2 rounded-lg bg-green-500 hover:bg-green-600 text-white text-xs font-semibold py-2 transition-colors"
                    >
                      <FaIcon icon="fa-brands fa-whatsapp" size={15} />
                      Order on WhatsApp
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-5 py-8 text-center">
        <p className="text-xs text-slate-400">
          Powered by <span className="font-semibold text-slate-500">{BRAND_NAME}</span>
        </p>
      </footer>
    </div>
  );
};
