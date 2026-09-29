import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useAccount } from '../../hooks/useAccount';
import { signOut } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { SUPPORT_EMAIL, SUPPORT_PHONE } from '../../config/brand';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();
  // Waits for the plan too, so pages never flash features the client doesn't have.
  const { loading: accountLoading, isAdmin, account } = useAccount();

  if (loading || (user && accountLoading)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500"></div>
          </div>
          <p className="text-slate-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Deleted by the admin: the data is gone, so there is nothing to show but a way out.
  if (account?.status === 'deleted' && !isAdmin) {
    const contact = [SUPPORT_PHONE, SUPPORT_EMAIL].filter(Boolean).join(' · ');
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center space-y-4">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-rose-50 text-rose-600 text-xl">
            <i className="fa-regular fa-trash-can" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">This account has been deleted</h1>
          <p className="text-sm text-slate-500">All data for this account was removed and it can no longer be used.{contact ? ` If you think this is a mistake, contact ${contact}.` : ''}</p>
          <button type="button" onClick={() => signOut(auth)} className="btn-primary w-full">
            Log out
          </button>
        </div>
      </div>
    );
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
