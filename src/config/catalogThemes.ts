// Catalog storefront theme. The public catalog uses a fixed default theme
// (see getCatalogTheme() with no argument). Extra themes are kept here so the
// default can be changed in one place, or a picker re-introduced later.
//
// NOTE: all class strings are written as complete literals so Tailwind's scanner
// includes them in the build (do NOT build these class names dynamically).

export interface CatalogTheme {
  id: string;
  label: string;
  header: string;     // header background
  glow: string;       // decorative blurred glow accent
  headerText: string; // main heading text color on the header
  subText: string;    // tagline / secondary text color on the header
  chip: string;       // trust-badge pill classes (bg + text + ring)
  avatar: string;     // avatar circle classes (bg + text + ring)
  priceText: string;  // product price color
  focusRing: string;  // search input focus ring
  swatch: string;     // small gradient used in the theme picker card
}

// Shared styles for the dark-gradient themes (white text on color).
const DARK = {
  headerText: 'text-white',
  subText: 'text-white/80',
  chip: 'bg-white/15 text-white ring-1 ring-white/15',
  avatar: 'bg-white/15 text-white ring-1 ring-white/30',
};

export const CATALOG_THEMES: CatalogTheme[] = [
  {
    id: 'ocean',
    label: 'Ocean',
    header: 'bg-gradient-to-br from-indigo-600 via-blue-600 to-blue-700',
    glow: 'bg-fuchsia-400/20',
    priceText: 'text-blue-600',
    focusRing: 'focus:ring-blue-500',
    swatch: 'bg-gradient-to-br from-indigo-600 via-blue-600 to-blue-700',
    ...DARK,
  },
  {
    id: 'sunset',
    label: 'Sunset',
    header: 'bg-gradient-to-br from-rose-500 via-orange-500 to-amber-500',
    glow: 'bg-rose-300/30',
    priceText: 'text-rose-600',
    focusRing: 'focus:ring-rose-400',
    swatch: 'bg-gradient-to-br from-rose-500 via-orange-500 to-amber-500',
    ...DARK,
  },
  {
    id: 'forest',
    label: 'Forest',
    header: 'bg-gradient-to-br from-emerald-600 via-teal-600 to-green-700',
    glow: 'bg-lime-300/25',
    priceText: 'text-emerald-600',
    focusRing: 'focus:ring-emerald-500',
    swatch: 'bg-gradient-to-br from-emerald-600 via-teal-600 to-green-700',
    ...DARK,
  },
  {
    id: 'berry',
    label: 'Berry',
    header: 'bg-gradient-to-br from-fuchsia-600 via-purple-600 to-violet-700',
    glow: 'bg-pink-300/25',
    priceText: 'text-purple-600',
    focusRing: 'focus:ring-purple-500',
    swatch: 'bg-gradient-to-br from-fuchsia-600 via-purple-600 to-violet-700',
    ...DARK,
  },
  {
    id: 'minimal',
    label: 'Minimal',
    header: 'bg-gradient-to-br from-slate-50 to-slate-100',
    glow: 'bg-slate-300/30',
    headerText: 'text-slate-900',
    subText: 'text-slate-500',
    chip: 'bg-white text-slate-700 ring-1 ring-slate-200',
    avatar: 'bg-slate-900 text-white ring-1 ring-slate-200',
    priceText: 'text-slate-900',
    focusRing: 'focus:ring-slate-400',
    swatch: 'bg-gradient-to-br from-slate-100 to-slate-300',
  },
];

export const DEFAULT_CATALOG_THEME_ID = 'ocean';

export const getCatalogTheme = (id?: string): CatalogTheme =>
  CATALOG_THEMES.find((t) => t.id === id) || CATALOG_THEMES[0];
