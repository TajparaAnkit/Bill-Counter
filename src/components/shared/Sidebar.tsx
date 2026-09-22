import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { FaIcon } from './FaIcon';
import { useAuth } from '../../hooks/useAuth';
import { getBusinessProfile } from '../../services/db';
import { signOut } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { useToast } from '../../hooks/useToast';
import { BRAND_NAME } from '../../config/brand';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuSeparator,
} from '../ui/dropdown-menu';

interface SidebarProps {
  open: boolean; // mobile drawer state
  onClose: () => void;
}

interface NavLeaf {
  label: string;
  to: string;
  icon?: string;
}
interface NavItem {
  label: string;
  icon: string;
  to?: string; // direct link (no children)
  children?: NavLeaf[]; // collapsible
}
interface NavGroup {
  title: string;
  items: NavItem[];
}

const GROUPS: NavGroup[] = [
  {
    title: 'General',
    items: [
      { label: 'Dashboard', icon: 'fa-solid fa-gauge-high', to: '/dashboard' },
      {
        label: 'Customers',
        icon: 'fa-solid fa-users',
        children: [
          { label: 'All Customers', to: '/customers' },
          { label: 'Add Customer', to: '/customers?new=1' },
        ],
      },
      {
        label: 'Products',
        icon: 'fa-solid fa-box',
        children: [
          { label: 'All Products', to: '/products' },
          { label: 'Add Product', to: '/products?new=1' },
        ],
      },
      {
        label: 'Sales',
        icon: 'fa-solid fa-tag',
        children: [
          { label: 'Sales Invoices', to: '/bills' },
          { label: 'Create Sales Invoice', to: '/bills?new=1' },
        ],
      },
    ],
  },
  {
    title: 'Business',
    items: [
      {
        label: 'Settings',
        icon: 'fa-solid fa-gear',
        children: [
          { label: 'Business Settings', to: '/settings' },
          { label: 'Knowledge Base', to: '/knowledge-base' },
        ],
      },
    ],
  },
];

const pathOf = (to: string) => to.split('?')[0];

// Small module-level cache so the sidebar doesn't refetch the profile on every route change.
let cachedBusiness: { uid: string; name: string; phone: string; logoUrl: string } | null = null;

export const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
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
  const isChildActive = (item: NavItem) => !!item.children?.some((c) => location.pathname === pathOf(c.to));
  const [openItems, setOpenItems] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    GROUPS.forEach((g) => g.items.forEach((it) => (init[it.label] = isChildActive(it))));
    return init;
  });
  // Auto-expand the group that owns the current route.
  useEffect(() => {
    setOpenItems((prev) => {
      const next = { ...prev };
      GROUPS.forEach((g) => g.items.forEach((it) => isChildActive(it) && (next[it.label] = true)));
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);
  const toggle = (label: string) => setOpenItems((o) => ({ ...o, [label]: !o[label] }));
  const [business, setBusiness] = useState(cachedBusiness && cachedBusiness.uid === user?.uid ? cachedBusiness : null);

  useEffect(() => {
    if (!user) return;
    if (cachedBusiness && cachedBusiness.uid === user.uid) {
      setBusiness(cachedBusiness);
      return;
    }
    let cancelled = false;
    getBusinessProfile(user.uid).then((p) => {
      if (cancelled) return;
      const b = {
        uid: user.uid,
        name: p?.businessName?.trim() || BRAND_NAME,
        phone: p?.phone || '',
        logoUrl: p?.logoUrl || '',
      };
      cachedBusiness = b;
      setBusiness(b);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const name = business?.name || BRAND_NAME;

  const itemCls = (active: boolean) =>
    `w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[15px] transition-colors ${
      active ? 'bg-[#2a3a63] text-white font-semibold' : 'text-slate-300 hover:bg-white/5 hover:text-white'
    }`;
  const subCls = (active: boolean) =>
    `flex items-center gap-3 pl-12 pr-3.5 py-2 rounded-lg text-sm transition-colors ${
      active ? 'bg-[#2a3a63] text-white font-semibold' : 'text-slate-300 hover:bg-white/5 hover:text-white'
    }`;
  const isLeafActive = (to: string) => location.pathname === pathOf(to) && (to.includes('?new=1') ? location.search.includes('new=1') : true);

  const content = (
    <div className="flex h-full flex-col bg-[#0f1e3d] text-slate-200">
      {/* Business block */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-3">
          {business?.logoUrl ? (
            <img src={business.logoUrl} alt="" className="h-9 w-9 rounded-full bg-white object-contain p-0.5" />
          ) : (
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-600 text-sm font-bold text-white">
              {name.charAt(0).toUpperCase()}
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-white">{name}</p>
            <p className="truncate text-xs text-slate-400">{business?.phone || user?.email || ''}</p>
          </div>
          <button type="button" onClick={onClose} className="ml-auto p-1.5 text-slate-400 hover:text-white lg:hidden" aria-label="Close menu">
            <FaIcon icon="fa-solid fa-xmark" size={16} />
          </button>
        </div>

        {/* Split button: main action + "create" menu */}
        <div className="mt-4 flex rounded-md overflow-hidden bg-brand-100 text-brand-800">
          <button
            type="button"
            onClick={() => {
              navigate('/bills?new=1');
              onClose();
            }}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold hover:bg-white transition-colors"
          >
            <FaIcon icon="fa-solid fa-plus" size={12} />
            Create Sales Invoice
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="More create options"
                className="px-2.5 border-l border-brand-200/70 hover:bg-white transition-colors"
              >
                <FaIcon icon="fa-solid fa-chevron-down" size={12} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" sideOffset={6} className="w-56">
              <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-wider text-slate-400">General</DropdownMenuLabel>
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onSelect={() => {
                    navigate('/customers?new=1');
                    onClose();
                  }}
                >
                  <FaIcon icon="fa-solid fa-user-plus" size={14} className="w-4 text-slate-400" />
                  <span>Add Customer</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    navigate('/products?new=1');
                    onClose();
                  }}
                >
                  <FaIcon icon="fa-solid fa-box-open" size={14} className="w-4 text-slate-400" />
                  <span>Add Product</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Sales Transactions</DropdownMenuLabel>
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onSelect={() => {
                    navigate('/bills?new=1');
                    onClose();
                  }}
                >
                  <FaIcon icon="fa-solid fa-file-invoice" size={14} className="w-4 text-slate-400" />
                  <span>Sales Invoice</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Groups */}
      <nav className="flex-1 overflow-y-auto px-3 pb-3">
        {GROUPS.map((g) => (
          <div key={g.title} className="mt-4">
            <p className="px-3.5 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">{g.title}</p>
            <ul className="space-y-1">
              {g.items.map((it) => {
                if (!it.children) {
                  return (
                    <li key={it.label}>
                      <NavLink to={it.to!} className={({ isActive }) => itemCls(isActive)} onClick={onClose}>
                        <FaIcon icon={it.icon} size={15} className="w-5 text-center" />
                        <span>{it.label}</span>
                      </NavLink>
                    </li>
                  );
                }
                const open = !!openItems[it.label];
                const childActive = isChildActive(it);
                return (
                  <li key={it.label}>
                    <button
                      type="button"
                      onClick={() => toggle(it.label)}
                      aria-expanded={open}
                      className={itemCls(childActive && !open)}
                    >
                      <FaIcon icon={it.icon} size={15} className="w-5 text-center" />
                      <span className="flex-1 text-left">{it.label}</span>
                      <FaIcon
                        icon="fa-solid fa-chevron-right"
                        size={11}
                        className={`text-slate-400 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
                      />
                    </button>
                    {open && (
                      <ul className="mt-1 space-y-0.5">
                        {it.children.map((c) => (
                          <li key={c.to}>
                            <NavLink to={c.to} className={() => subCls(isLeafActive(c.to))} onClick={onClose}>
                              <span>{c.label}</span>
                            </NavLink>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Logout pinned at the bottom */}
      <div className="border-t border-white/10 px-3 py-3 bg-[#0c1a35]">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[15px] text-slate-300 hover:bg-rose-500/15 hover:text-rose-200 transition-colors"
        >
          <FaIcon icon="fa-solid fa-right-from-bracket" size={15} className="w-5 text-center" />
          <span>Logout</span>
        </button>
        <p className="mt-2 px-3.5 text-[10px] text-slate-500">{BRAND_NAME}</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-60 z-30">{content}</aside>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-64 max-w-[85vw] h-full shadow-xl animate-in slide-in-from-left duration-200">{content}</div>
          <button type="button" aria-label="Close menu" onClick={onClose} className="flex-1 bg-black/40" />
        </div>
      )}
    </>
  );
};
