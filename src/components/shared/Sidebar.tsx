import { Link, useLocation } from 'react-router-dom';
import { FaIcon } from './FaIcon';

export const Sidebar: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: 'fa-solid fa-gauge-high' },
    { label: 'Products', path: '/products', icon: 'fa-solid fa-box' },
    { label: 'Bills', path: '/bills', icon: 'fa-solid fa-file-invoice' },
    { label: 'Settings', path: '/settings', icon: 'fa-solid fa-gear' },
  ];

  return (
    <aside className="hidden md:block w-64 bg-white border-r border-slate-100 min-h-[calc(100vh-4rem)] shadow-2xs">
      <nav className="p-4 space-y-1.5">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-emerald-50 text-emerald-600 font-semibold shadow-2xs'
                  : 'text-slate-650 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <FaIcon icon={item.icon} size={20} className={isActive ? 'text-emerald-600' : 'text-slate-400'} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

