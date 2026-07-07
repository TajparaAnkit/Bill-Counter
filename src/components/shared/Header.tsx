import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Menu, X, LayoutDashboard, Package, FileText } from 'lucide-react';
import { UserMenu } from './UserMenu';

export const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [syncTime, setSyncTime] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Product Manager', path: '/products', icon: Package },
    { label: 'New Invoice', path: '/bills', icon: FileText },
  ];

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setSyncTime(now.toLocaleTimeString('en-US', { hour12: true }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-slate-100 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-3 items-center gap-4 py-2">
          {/* Left: Logo */}
          <div className="flex items-center col-span-1 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-sky-500 rounded-lg flex items-center justify-center shadow-md shadow-emerald-500/10 mr-3">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H9v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="currentColor"/>
              </svg>
            </div>
            <div>
              <h1 className="text-base font-extrabold text-emerald-600 tracking-tight">NAITU CROCHET</h1>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-0.5">TRADING DASHBOARD</p>
            </div>
          </div>

          {/* Center: Last update */}
          <div className="flex justify-center items-center">
            <div className="text-center">
              <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">LAST UPDATE</div>
              <div className="flex items-center justify-center gap-2 mt-1">
                <span className="text-xs font-medium text-slate-600 font-mono">{syncTime}</span>
                <span className="w-2 h-2 bg-emerald-500 rounded-full shadow-sm"></span>
              </div>
            </div>
          </div>

          {/* Right: Live + User */}
          <div className="flex items-center justify-end col-span-1 space-x-4">
            <div className="hidden md:flex items-center bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-bold border border-emerald-100 shadow-3xs">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
              Live Dashboard
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <UserMenu />
            <button
              className="md:hidden p-2 hover:bg-slate-50 rounded-lg transition-colors text-slate-500"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-2 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path ||
              (item.path === '/bills' && location.pathname.startsWith('/bills'));

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-2 rounded-full px-3 py-1 text-sm font-semibold transition-all duration-300 ${isActive
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Icon size={14} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-100 py-4 space-y-4">
            <div className="flex justify-between items-center px-2">
              <div className="text-left font-medium">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Last Sync</span>
                <span className="text-xs font-bold text-slate-600 font-mono mt-0.5 block">{syncTime}</span>
              </div>
              <div className="flex items-center bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-bold border border-emerald-100">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
                Live
              </div>
            </div>
            <div className="space-y-3 px-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path ||
                  (item.path === '/bills' && location.pathname.startsWith('/bills'));

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300 ${isActive
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
            <div className="border-t border-slate-100 pt-3 px-2">
              <UserMenu />
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
