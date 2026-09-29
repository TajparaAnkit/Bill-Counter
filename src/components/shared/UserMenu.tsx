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
    <div className="flex items-center" title={[displayName, email].filter(Boolean).join(' · ')}>
      {user?.photoURL ? (
        <img src={user.photoURL} alt="" className="h-9 w-9 rounded-full object-cover ring-2 ring-white shadow-sm" referrerPolicy="no-referrer" />
      ) : (
        <span className="grid h-9 w-9 place-items-center rounded-full bg-linear-to-br from-brand-500 to-blue-600 text-xs font-bold text-white ring-2 ring-white shadow-sm">{initials}</span>
      )}
    </div>
  );
};
