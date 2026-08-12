import { useAuth } from '../../hooks/useAuth';
import { signOut } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../hooks/useToast';
import { FaIcon } from './FaIcon';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuSeparator,
} from '../ui/dropdown-menu';

export const UserMenu: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const email = user?.email || '';
  const displayName = user?.displayName || email.split('@')[0] || 'User';

  const initials = displayName
    .split(/[\s.@_-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('') || 'U';

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Failed to logout. Please try again.');
    }
  };

  const menuItems = [
    { label: 'Dashboard', icon: 'fa-solid fa-gauge-high', to: '/dashboard' },
    { label: 'Product Manager', icon: 'fa-solid fa-box', to: '/products' },
    { label: 'Customers', icon: 'fa-solid fa-users', to: '/customers' },
    { label: 'Bills & Invoices', icon: 'fa-solid fa-file-invoice', to: '/bills' },
    { label: 'Knowledge Base', icon: 'fa-solid fa-book-open', to: '/knowledge-base' },
    { label: 'Settings', icon: 'fa-solid fa-gear', to: '/settings' },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-2 rounded-full p-0.5 pr-2 transition-colors hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
          aria-label="Open user menu"
        >
          <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-blue-700 to-blue-500 text-xs font-bold text-white shadow-sm">
            {initials}
          </span>
          <span className="hidden max-w-40 truncate text-sm font-semibold text-slate-700 sm:block">
            {displayName}
          </span>
          <FaIcon icon="fa-solid fa-chevron-down" size={11} className="hidden text-slate-400 sm:block" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="min-w-[16rem]">
        {/* User header */}
        <DropdownMenuLabel>
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-blue-700 to-blue-500 text-sm font-bold text-white shadow-sm">
              {initials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-800">{displayName}</p>
              <p className="truncate text-xs text-slate-400">{email}</p>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* Moved navigation items */}
        <DropdownMenuGroup>
          {menuItems.map((item) => (
            <DropdownMenuItem key={item.to} onSelect={() => navigate(item.to)}>
              <FaIcon icon={item.icon} size={15} className="w-4 text-slate-400" />
              <span>{item.label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem variant="destructive" onSelect={handleLogout}>
          <FaIcon icon="fa-solid fa-right-from-bracket" size={15} className="w-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
