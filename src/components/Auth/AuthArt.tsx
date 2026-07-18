// Decorative right-hand panel for the auth screens — a colorful geometric
// mosaic in the brand palette (navy / blue / amber + accents), inspired by
// modern split-screen login designs. Pure CSS/SVG, no images.

type Shape = 'square' | 'circle' | 'arc' | 'triangle' | 'ring' | 'dots' | 'quarter' | 'empty';

interface Tile {
  shape: Shape;
  color: string; // tailwind bg-* for solids / text-* handled inline
}

const NAVY = '#1e3a8a';
const BLUE = '#2563eb';
const SKY = '#0ea5e9';
const AMBER = '#f59e0b';
const ROSE = '#f43f5e';
const EMER = '#10b981';
const VIOLET = '#8b5cf6';

// 4-column mosaic (reads left→right, top→bottom)
const tiles: Tile[] = [
  { shape: 'arc', color: BLUE },
  { shape: 'empty', color: '' },
  { shape: 'circle', color: AMBER },
  { shape: 'square', color: NAVY },

  { shape: 'dots', color: AMBER },
  { shape: 'triangle', color: EMER },
  { shape: 'empty', color: '' },
  { shape: 'arc', color: SKY },

  { shape: 'ring', color: VIOLET },
  { shape: 'square', color: BLUE },
  { shape: 'quarter', color: ROSE },
  { shape: 'empty', color: '' },

  { shape: 'empty', color: '' },
  { shape: 'circle', color: NAVY },
  { shape: 'arc', color: AMBER },
  { shape: 'triangle', color: BLUE },
];

const TileView = ({ t }: { t: Tile }) => {
  if (t.shape === 'empty') return <div className="aspect-square" />;

  const base = 'aspect-square rounded-2xl flex items-center justify-center overflow-hidden';

  switch (t.shape) {
    case 'square':
      return <div className={base} style={{ background: t.color }} />;
    case 'circle':
      return (
        <div className={`${base} bg-white/70`}>
          <div className="w-2/3 h-2/3 rounded-full" style={{ background: t.color }} />
        </div>
      );
    case 'ring':
      return (
        <div className={`${base} bg-white/70`}>
          <div
            className="w-2/3 h-2/3 rounded-full border-[10px]"
            style={{ borderColor: t.color }}
          />
        </div>
      );
    case 'arc':
      return (
        <div className={`${base}`} style={{ background: t.color }}>
          <div className="w-2/3 h-1/3 bg-white/85 rounded-t-full mt-auto mb-3" />
        </div>
      );
    case 'quarter':
      return (
        <div className={base} style={{ background: t.color }}>
          <div className="w-full h-full bg-white/85" style={{ borderTopLeftRadius: '100%' }} />
        </div>
      );
    case 'triangle':
      return (
        <div className={`${base} bg-white/70`}>
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: '22px solid transparent',
              borderRight: '22px solid transparent',
              borderBottom: `38px solid ${t.color}`,
            }}
          />
        </div>
      );
    case 'dots':
      return (
        <div className={`${base} bg-white/70`}>
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-3 h-3 rounded-full" style={{ background: t.color }} />
            ))}
          </div>
        </div>
      );
    default:
      return <div className={base} />;
  }
};

export const AuthArt: React.FC = () => {
  return (
    <div className="relative hidden lg:flex lg:w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/40 to-white p-12">
      {/* soft glows */}
      <div className="pointer-events-none absolute -top-16 -right-16 w-80 h-80 rounded-full bg-blue-200/30 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 -left-20 w-80 h-80 rounded-full bg-amber-200/30 blur-3xl" />

      {/* Mosaic */}
      <div className="relative z-10 mx-auto w-full max-w-md">
        <div className="grid grid-cols-4 gap-3">
          {tiles.map((t, i) => (
            <TileView key={i} t={t} />
          ))}
        </div>
      </div>

      {/* Headline */}
      <div className="relative z-10 max-w-md">
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-800 leading-tight font-display">
          Bill smarter.<br />Get paid faster.
        </h2>
        <p className="mt-3 text-sm text-slate-500 leading-relaxed">
          Create professional invoices, track payments and dues, and grow your
          business — all in one simple workspace.
        </p>
      </div>
    </div>
  );
};
