import { useState } from 'react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../hooks/useToast';
import { parseFirebaseError } from '../../utils/validators';
import { FaIcon } from '../shared/FaIcon';

const GoogleG = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22 22-9.8 22-22c0-1.5-.2-2.6-.4-3.5z" />
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 4.1 29.6 2 24 2 15.6 2 8.3 6.9 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 46c5.5 0 10.4-2.1 14.1-5.5l-6.5-5.5c-2 1.5-4.7 2.5-7.6 2.5-5.2 0-9.6-3.3-11.2-8l-6.6 5.1C8.2 41 15.5 46 24 46z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l6.5 5.5c-.5.4 6.3-4.6 6.3-15 0-1.5-.2-2.6-.4-3.5z" />
  </svg>
);

interface GoogleButtonProps {
  label?: string;
}

export const GoogleButton: React.FC<GoogleButtonProps> = ({ label = 'Continue with Google' }) => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const handleGoogle = async () => {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      const { user } = await signInWithPopup(auth, provider);

      // Ensure a business profile document exists (first-time Google users).
      const ref = doc(db, 'users', user.uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, {
          uid: user.uid,
          email: user.email || '',
          businessName: user.displayName || (user.email || '').split('@')[0] || 'My Business',
          createdAt: serverTimestamp(),
        });
      }

      toast.success('Signed in successfully! Redirecting...');
      setTimeout(() => navigate('/dashboard'), 400);
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        return; // user closed the popup — no error toast
      }
      toast.error(parseFirebaseError(err));
      console.error('Google sign-in error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogle}
      disabled={loading}
      className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-50 hover:border-slate-300 shadow-xs transition-all disabled:opacity-60 cursor-pointer"
    >
      {loading ? (
        <FaIcon icon="fa-solid fa-spinner" size={16} className="animate-spin text-slate-400" />
      ) : (
        <GoogleG />
      )}
      <span>{label}</span>
    </button>
  );
};
