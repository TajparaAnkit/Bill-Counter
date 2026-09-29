import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FaIcon } from './FaIcon';
import { useAuth } from '../../hooks/useAuth';
import { useAccount } from '../../hooks/useAccount';
import { getBusinessProfile } from '../../services/db';
import { signOut } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { useToast } from '../../hooks/useToast';
import { BRAND_NAME } from '../../config/brand';
import { ADMIN_NAV_GROUP, NAV_GROUPS } from '../../config/nav';
import { hasFeature } from '../../config/features';

interface SidebarProps {
  open: boolean; // mobile drawer state
  onClose: () => void;
  collapsed: boolean; // desktop icon-only mode
  onToggleCollapse: () => void;
}

// Small module-level cache so the sidebar doesn't refetch the profile on every route change.
let cachedBusiness: { uid: string; name: string; phone: string; logoUrl: string } | null = null;

export const Sidebar: React.FC<SidebarProps> = ({ open, onClose, collapsed, onToggleCollapse }) => {
  const { user } = useAuth();
  const { isAdmin, account } = useAccount();
  const groups = (isAdmin ? [...NAV_GROUPS, ADMIN_NAV_GROUP] : NAV_GROUPS).map((g) => ({
    ...g,
    items: g.items.filter((it) => !it.feature || hasFeature(account, it.feature)),
  }));
  const navigate = useNavigate();
  const toast = useToast();
  const [closedGroups, setClosedGroups] = useState<Record<string, boolean>>({});
  const [business, setBusiness] = useState(cachedBusiness && cachedBusiness.uid === user?.uid ? cachedBusiness : null);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      cachedBusiness = null;
      toast.success('Logged out successfully');
      navigate('/login');
    } catch {
      toast.error('Failed to logout. Please try again.');
    }
  };

  useEffect(() => {
    if (!user) return;
    if (cachedBusiness && cachedBusiness.uid === user.uid) {
      setBusiness(cachedBusiness);
      return;
    }
    let cancelled = false;
    getBusinessProfile(user.uid).then((p) => {
      if (cancelled) return;
      const b = { uid: user.uid, name: p?.businessName?.trim() || BRAND_NAME, phone: p?.phone || '', logoUrl: p?.logoUrl || '' };
      cachedBusiness = b;
      setBusiness(b);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const name = business?.name || BRAND_NAME;

  // `mini` = desktop collapsed rail (icons only). The mobile drawer is always full width.
  const content = (mini: boolean) => (
    <div className="flex h-full flex-col bg-[#fbfbff] border-r border-slate-200">
      {/* Brand */}
      <div className={`flex items-center h-16 shrink-0 border-b border-slate-200 ${mini ? 'justify-center px-2' : 'gap-3 px-5'}`}>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-linear-to-br from-brand-500 to-blue-600 text-white shadow-sm shadow-brand-600/30">
          <FaIcon icon="fa-solid fa-receipt" size={15} />
        </span>
        {!mini && (
          <div className="min-w-0 leading-tight">
            <p className="text-[15px] font-bold text-brand-700 tracking-tight">{BRAND_NAME}</p>
            <p className="text-[10px] font-semibold tracking-[0.14em] text-slate-400 uppercase">Invoicing</p>
          </div>
        )}
        {!mini && (
          <button type="button" onClick={onClose} className="ml-auto p-1.5 text-slate-400 hover:text-slate-700 lg:hidden" aria-label="Close menu">
            <FaIcon icon="fa-solid fa-xmark" size={16} />
          </button>
        )}
      </div>

      {/* Groups */}
      <nav className={`flex-1 overflow-y-auto py-4 ${mini ? 'px-2' : 'px-3'}`} aria-label="Main">
        {groups.map((g) => {
          const shut = !mini && closedGroups[g.title];
          return (
            <div key={g.title} className="mb-5 last:mb-0">
              {mini ? (
                <div className="mx-auto mb-2 h-px w-6 bg-slate-200" aria-hidden="true" />
              ) : (
                <button
                  type="button"
                  onClick={() => setClosedGroups((c) => ({ ...c, [g.title]: !c[g.title] }))}
                  aria-expanded={!shut}
                  className="w-full flex items-center justify-between px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {g.title}
                  <FaIcon icon="fa-solid fa-chevron-down" size={9} className={`transition-transform ${shut ? '-rotate-90' : ''}`} />
                </button>
              )}
              {!shut && (
                <ul className="space-y-0.5">
                  {g.items.map((it) => (
                    <li key={it.to}>
                      <NavLink
                        to={it.to}
                        onClick={onClose}
                        title={mini ? it.label : undefined}
                        className={({ isActive }) =>
                          `relative flex items-center rounded-xl text-[14px] transition-colors ${mini ? 'justify-center h-10' : 'gap-3 px-3 py-2.5'} ${
                            isActive ? 'bg-brand-50 text-brand-700 font-semibold' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                          }`
                        }
                      >
                        {({ isActive }) => (
                          <>
                            {isActive && <span className={`absolute top-1.5 bottom-1.5 w-[3px] rounded-full bg-brand-600 ${mini ? '-left-2' : '-left-3'}`} aria-hidden="true" />}
                            <FaIcon icon={it.icon} size={15} className={`w-5 text-center ${isActive ? 'text-brand-600' : 'text-slate-400'}`} />
                            {!mini && <span>{it.label}</span>}
                          </>
                        )}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </nav>

      {/* Business card + logout */}
      <div className={`border-t border-slate-200 ${mini ? 'p-2 space-y-2' : 'p-3'}`}>
        <div className={`flex items-center ${mini ? 'flex-col gap-2' : 'gap-3 rounded-xl px-2 py-2'}`}>
          {business?.logoUrl ? (
            <img src={business.logoUrl} alt="" className="h-9 w-9 shrink-0 rounded-full bg-white border border-slate-200 object-contain p-0.5" title={mini ? name : undefined} />
          ) : (
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-linear-to-br from-brand-500 to-blue-600 text-sm font-bold text-white" title={mini ? name : undefined}>
              {name.charAt(0).toUpperCase()}
            </span>
          )}
          {!mini && (
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-sm font-semibold text-slate-800">{name}</p>
              <p className="truncate text-xs text-slate-400">{business?.phone || user?.email || ''}</p>
            </div>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
            title="Logout"
            aria-label="Logout"
          >
            <FaIcon icon="fa-solid fa-arrow-right-from-bracket" size={14} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className={`hidden lg:block fixed inset-y-0 left-0 z-30 transition-[width] duration-200 ${collapsed ? 'w-[76px]' : 'w-64'}`}>
        {content(collapsed)}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="absolute top-[76px] -right-3 grid h-6 w-6 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-xs hover:text-brand-700 cursor-pointer"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <FaIcon icon={collapsed ? 'fa-solid fa-chevron-right' : 'fa-solid fa-chevron-left'} size={9} />
        </button>
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-72 max-w-[85vw] h-full shadow-xl animate-in slide-in-from-left duration-200">{content(false)}</div>
          <button type="button" aria-label="Close menu" onClick={onClose} className="flex-1 bg-slate-900/30 backdrop-blur-[1px]" />
        </div>
      )}
    </>
  );
};
