import { useNavigate } from 'react-router-dom';
import { UserMenu } from './UserMenu';
import { FaIcon } from './FaIcon';

interface HeaderProps {
  onMenuClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const navigate = useNavigate();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="px-3 sm:px-5">
        <div className="flex items-center justify-between gap-3 h-12">
          <div className="flex items-center gap-2">
            {/* Hamburger (mobile only — the sidebar is fixed on desktop) */}
            <button
              type="button"
              onClick={onMenuClick}
              className="lg:hidden p-2 -ml-1 rounded-md text-slate-600 hover:bg-slate-100"
              aria-label="Open menu"
            >
              <FaIcon icon="fa-solid fa-bars" size={16} />
            </button>
            <button
              type="button"
              className="flex items-center gap-2 lg:hidden"
              onClick={() => navigate('/dashboard')}
              aria-label="Go to dashboard"
            >
              <span className="text-base font-bold tracking-tight">
                <span className="text-brand-600">Bill</span>
                <span className="text-slate-800"> Counter</span>
              </span>
            </button>
          </div>

          <UserMenu />
        </div>
      </div>
    </header>
  );
};
