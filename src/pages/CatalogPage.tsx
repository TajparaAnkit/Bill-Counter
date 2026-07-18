import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FaIcon } from '../components/shared/FaIcon';
import { getPublicCatalog } from '../services/db';
import { Product, PublicProfile } from '../types';
import { BRAND_NAME } from '../config/brand';

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
      {/* Shop header */}
      <header className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
        <div className="max-w-5xl mx-auto px-5 py-8">
          <div className="flex items-center gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/15 text-2xl font-black backdrop-blur">
              {shopName.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight truncate">{shopName}</h1>
              {profile?.tagline ? (
                <p className="text-blue-100 text-sm mt-0.5">{profile.tagline}</p>
              ) : (
                <p className="text-blue-100 text-sm mt-0.5">
                  {products.length} product{products.length !== 1 ? 's' : ''} available
                </p>
              )}
            </div>
          </div>

          {hasWhatsApp && (
            <a
              href={whatsappLink(phone, generalMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-green-500 hover:bg-green-600 px-4 py-2.5 text-sm font-semibold shadow-sm transition-colors"
            >
              <FaIcon icon="fa-brands fa-whatsapp" size={18} />
              Chat with us on WhatsApp
            </a>
          )}
        </div>
      </header>

      {/* Search */}
      <div className="max-w-5xl mx-auto px-5 pt-6">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <FaIcon icon="fa-solid fa-magnifying-glass" size={16} className="text-slate-400" />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products…"
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-slate-200 shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <p className="text-blue-600 font-bold mt-1">₹{p.price.toFixed(2)}</p>
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
