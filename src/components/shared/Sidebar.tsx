import { NavLink, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { useToast } from '../../hooks/useToast';
import { FaIcon } from './FaIcon';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const navItems = [
  { label: 'Dashboard', icon: 'fa-solid fa-gauge-high', to: '/dashboard' },
  { label: 'Product Manager', icon: 'fa-solid fa-box', to: '/products' },
  { label: 'Customers', icon: 'fa-solid fa-users', to: '/customers' },
  { label: 'Bills & Invoices', icon: 'fa-solid fa-file-invoice', to: '/bills' },
  { label: 'Settings', icon: 'fa-solid fa-gear', to: '/settings' },
];

export const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const toast = useToast();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Failed to logout. Please try again.');
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white border-r border-slate-100 shadow-xs transition-transform duration-200 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand */}
        <div
          className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 cursor-pointer"
          onClick={() => {
            navigate('/dashboard');
            onClose();
          }}
        >
          <div className="w-10 h-10 shrink-0 bg-gradient-to-r from-blue-800 to-blue-600 rounded-lg flex items-center justify-center shadow-md shadow-blue-500/20">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H9v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="currentColor" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-extrabold text-blue-800 tracking-tight">BILL COUNTER</h1>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-0.5">TRADING DASHBOARD</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <p className="px-3 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Menu</p>
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-800 to-blue-600 text-white shadow-md shadow-blue-500/20'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <FaIcon
                        icon={item.icon}
                        size={15}
                        className={`w-4 ${isActive ? 'text-white' : 'text-slate-400'}`}
                      />
                      <span>{item.label}</span>
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
          >
            <FaIcon icon="fa-solid fa-right-from-bracket" size={15} className="w-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};
