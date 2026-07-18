import { useState } from 'react';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../hooks/useToast';
import { validateEmail, parseFirebaseError } from '../../utils/validators';
import { FaIcon } from '../shared/FaIcon';

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const navigate = useNavigate();
  const toast = useToast();

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};
    if (!email) newErrors.email = 'Email is required';
    else if (!validateEmail(email)) newErrors.email = 'Please enter a valid email';
    if (!password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Login successful! Redirecting...');
      setTimeout(() => navigate('/dashboard'), 500);
    } catch (err: any) {
      toast.error(parseFirebaseError(err));
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email || !validateEmail(email)) {
      toast.error('Enter your email above, then click “Forgot password?”');
      setErrors((p) => ({ ...p, email: 'Enter your email to reset the password' }));
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('Password reset link sent — check your email.');
    } catch (err: any) {
      toast.error(parseFirebaseError(err));
    }
  };

  const inputBase =
    'w-full pl-10 pr-4 py-2.5 rounded-xl border bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 transition-all duration-200';
  const okRing = 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/10';
  const errRing = 'border-rose-400 focus:border-rose-400 focus:ring-rose-500/10';

  return (
    <form onSubmit={handleLogin} className="space-y-5">
      {/* Email */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email address</label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <FaIcon icon="fa-solid fa-envelope" size={16} />
          </span>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors({ ...errors, email: undefined });
            }}
            disabled={loading}
            className={`${inputBase} ${errors.email ? errRing : okRing}`}
            placeholder="name@business.com"
          />
        </div>
        {errors.email && (
          <p className="flex items-center gap-1.5 mt-1.5 text-rose-500 text-xs font-medium">
            <FaIcon icon="fa-solid fa-circle-exclamation" size={13} />
            {errors.email}
          </p>
        )}
      </div>

      {/* Password */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <label className="block text-sm font-semibold text-slate-700">Password</label>
          <button
            type="button"
            onClick={handleForgotPassword}
            className="text-xs font-semibold text-blue-700 hover:text-blue-800 hover:underline"
          >
            Forgot password?
          </button>
        </div>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <FaIcon icon="fa-solid fa-lock" size={16} />
          </span>
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors({ ...errors, password: undefined });
            }}
            disabled={loading}
            className={`${inputBase} pr-10 ${errors.password ? errRing : okRing}`}
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            <FaIcon icon={showPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'} size={16} />
          </button>
        </div>
        {errors.password && (
          <p className="flex items-center gap-1.5 mt-1.5 text-rose-500 text-xs font-medium">
            <FaIcon icon="fa-solid fa-circle-exclamation" size={13} />
            {errors.password}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-blue-800 hover:bg-blue-900 text-white font-semibold rounded-xl shadow-md shadow-blue-800/20 hover:shadow-lg active:translate-y-0.5 transition-all duration-200 disabled:opacity-60 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer"
      >
        {loading ? (
          <>
            <FaIcon icon="fa-solid fa-spinner" size={16} className="animate-spin" />
            <span>Signing in...</span>
          </>
        ) : (
          'Log in'
        )}
      </button>
    </form>
  );
};
