import { useAuth } from '../../hooks/useAuth';

// Signed-in user badge for the top bar. Navigation and Logout live in the sidebar.
export const UserMenu: React.FC = () => {
  const { user } = useAuth();

  const email = user?.email || '';
  const displayName = user?.displayName || email.split('@')[0] || 'User';

  const initials =
    displayName
      .split(/[\s.@_-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join('') || 'U';

  return (
    <div className="flex items-center gap-2.5" title={email}>
      <div className="hidden sm:block text-right leading-tight">
        <p className="text-sm font-semibold text-slate-800 max-w-48 truncate">{displayName}</p>
        {email && <p className="text-xs text-slate-500 max-w-56 truncate">{email}</p>}
      </div>
      {user?.photoURL ? (
        <img src={user.photoURL} alt="" className="h-9 w-9 rounded-full object-cover" referrerPolicy="no-referrer" />
      ) : (
        <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-600 text-xs font-bold text-white">{initials}</span>
      )}
    </div>
  );
};
