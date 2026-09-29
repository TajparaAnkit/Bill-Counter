import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserMenu } from './UserMenu';
import { FaIcon } from './FaIcon';
import { CREATE_ACTIONS, NAV_GROUPS, NavItem } from '../../config/nav';
import { hasFeature } from '../../config/features';
import { useAccount } from '../../hooks/useAccount';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { BRAND_NAME } from '../../config/brand';

interface HeaderProps {
  onMenuClick?: () => void;
}

type Result = { key: string; label: string; hint?: string; icon: string; to: string };

const PAGES: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

// Pages / actions whose feature is on for this client.
const useAllowed = () => {
  const { account } = useAccount();
  const ok = (n: NavItem) => !n.feature || hasFeature(account, n.feature);
  return { pages: PAGES.filter(ok), actions: CREATE_ACTIONS.filter(ok) };
};
const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

// Top-bar search: jump to a page or action, or search invoices / customers /
// products for the typed text (those pages read `?q=`). Ctrl/⌘+K focuses it.
const GlobalSearch: React.FC = () => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const allowed = useAllowed();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const results = useMemo<Result[]>(() => {
    const term = q.trim().toLowerCase();
    const match = (n: NavItem) => !term || `${n.label} ${n.keywords || ''}`.toLowerCase().includes(term);
    const out: Result[] = [
      ...allowed.pages.filter(match).map((p) => ({ key: p.to, label: p.label, hint: 'Page', icon: p.icon, to: p.to })),
      ...allowed.actions.filter(match).map((a) => ({ key: a.to, label: a.label, hint: 'Action', icon: a.icon, to: a.to })),
    ];
    if (term) {
      const enc = encodeURIComponent(q.trim());
      out.unshift(
        { key: 's-bills', label: `Invoices matching “${q.trim()}”`, hint: 'Search', icon: 'fa-regular fa-file-lines', to: `/bills?q=${enc}` },
        { key: 's-cust', label: `Customers matching “${q.trim()}”`, hint: 'Search', icon: 'fa-solid fa-user-group', to: `/customers?q=${enc}` },
        { key: 's-prod', label: `Products matching “${q.trim()}”`, hint: 'Search', icon: 'fa-solid fa-cube', to: `/products?q=${enc}` }
      );
    }
    return out.slice(0, 9);
  }, [q, allowed]);

  useEffect(() => setHi(0), [q]);

  const go = (r?: Result) => {
    if (!r) return;
    navigate(r.to);
    setQ('');
    setOpen(false);
    inputRef.current?.blur();
  };

  return (
    <div className="relative w-full max-w-sm">
      <FaIcon icon="fa-solid fa-magnifying-glass" size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      <input
        ref={inputRef}
        type="search"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHi((h) => Math.min(results.length - 1, h + 1));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHi((h) => Math.max(0, h - 1));
          } else if (e.key === 'Enter') {
            e.preventDefault();
            go(results[hi]);
          } else if (e.key === 'Escape') {
            setOpen(false);
            inputRef.current?.blur();
          }
        }}
        placeholder="Search invoices, customers, pages…"
        aria-label="Search"
        className="w-full h-10 pl-10 pr-14 rounded-xl border border-slate-200 bg-slate-50/70 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 transition"
      />
      <kbd className={`${q ? 'hidden' : 'hidden sm:inline-flex'} absolute right-3 top-1/2 -translate-y-1/2 items-center rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 pointer-events-none`}>
        {isMac ? '⌘K' : 'Ctrl K'}
      </kbd>
      {open && results.length > 0 && (
        <div className="absolute left-0 right-0 top-12 z-50 rounded-xl border border-slate-200 bg-white p-1.5 shadow-[0_12px_32px_-8px_rgba(21,21,31,0.18)]" role="listbox">
          {results.map((r, i) => (
            <button
              key={r.key}
              type="button"
              role="option"
              aria-selected={i === hi}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setHi(i)}
              onClick={() => go(r)}
              className={`w-full flex items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm cursor-pointer ${i === hi ? 'bg-brand-50 text-brand-800' : 'text-slate-700'}`}
            >
              <FaIcon icon={r.icon} size={13} className={`w-4 text-center ${i === hi ? 'text-brand-600' : 'text-slate-400'}`} />
              <span className="flex-1 truncate">{r.label}</span>
              {r.hint && <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{r.hint}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const allowedActions = useAllowed().actions;
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 h-16 bg-white/85 backdrop-blur border-b border-slate-200">
      <div className="flex h-full items-center gap-3 px-3 sm:px-6">
        <button type="button" onClick={onMenuClick} className="lg:hidden p-2 -ml-1 rounded-lg text-slate-600 hover:bg-slate-100" aria-label="Open menu">
          <FaIcon icon="fa-solid fa-bars" size={16} />
        </button>

        <div className="hidden sm:block flex-1">
          <GlobalSearch />
        </div>
        <div className="flex-1 sm:hidden flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-linear-to-br from-brand-500 to-blue-600 text-white">
            <FaIcon icon="fa-solid fa-receipt" size={13} />
          </span>
          <span className="text-[15px] font-bold text-brand-700 tracking-tight">{BRAND_NAME}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* New invoice split button */}
          <div className="flex rounded-xl shadow-sm shadow-brand-600/25">
            <button
              type="button"
              onClick={() => navigate('/bills?new=1')}
              className="flex items-center gap-2 h-9 pl-3.5 pr-3 rounded-l-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold cursor-pointer"
            >
              <FaIcon icon="fa-solid fa-plus" size={12} />
              <span className="hidden sm:inline">New Invoice</span>
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" aria-label="More create options" className="h-9 px-2.5 rounded-r-xl bg-brand-600 hover:bg-brand-700 text-white border-l border-white/20 cursor-pointer">
                  <FaIcon icon="fa-solid fa-chevron-down" size={10} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={8} className="w-52">
                {allowedActions.map((a) => (
                  <DropdownMenuItem key={a.to} onSelect={() => navigate(a.to)}>
                    <FaIcon icon={a.icon} size={13} className="w-4 text-slate-400" />
                    <span>{a.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <span className="hidden sm:block mx-1 h-6 w-px bg-slate-200" aria-hidden="true" />
          <Link to="/knowledge-base" className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800" title="Help Center" aria-label="Help Center">
            <FaIcon icon="fa-regular fa-circle-question" size={16} />
          </Link>
          <UserMenu />
        </div>
      </div>
    </header>
  );
};
