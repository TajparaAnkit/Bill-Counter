import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
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

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    }

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
      const errorMessage = parseFirebaseError(err);
      toast.error(errorMessage);
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-6">
      {/* Email Input */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
          Email Address
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
            <FaIcon icon="fa-solid fa-envelope" size={18} />
          </div>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors({ ...errors, email: undefined });
            }}
            disabled={loading}
            className={`w-full pl-10 pr-4 py-3 bg-slate-900/60 border ${
              errors.email ? 'border-rose-500/85 focus:ring-rose-500/20' : 'border-slate-800 focus:border-emerald-500 focus:ring-emerald-500/10'
            } rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-4 transition-all duration-200`}
            placeholder="name@business.com"
          />
        </div>
        {errors.email && (
          <div className="flex items-center gap-1.5 mt-2 text-rose-400 text-xs font-medium">
            <FaIcon icon="fa-solid fa-circle-exclamation" size={14} />
            <span>{errors.email}</span>
          </div>
        )}
      </div>

      {/* Password Input */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
            Password
          </label>
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
            <FaIcon icon="fa-solid fa-lock" size={18} />
          </div>
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors({ ...errors, password: undefined });
            }}
            disabled={loading}
            className={`w-full pl-10 pr-10 py-3 bg-slate-900/60 border ${
              errors.password ? 'border-rose-500/85 focus:ring-rose-500/20' : 'border-slate-800 focus:border-emerald-500 focus:ring-emerald-500/10'
            } rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-4 transition-all duration-200`}
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-350 transition-colors focus:outline-none"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <FaIcon icon="fa-solid fa-eye-slash" size={18} /> : <FaIcon icon="fa-solid fa-eye" size={18} />}
          </button>
        </div>
        {errors.password && (
          <div className="flex items-center gap-1.5 mt-2 text-rose-400 text-xs font-medium">
            <FaIcon icon="fa-solid fa-circle-exclamation" size={14} />
            <span>{errors.password}</span>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-teal-600 shadow-md shadow-emerald-500/10 hover:shadow-lg hover:shadow-emerald-500/20 active:translate-y-0.5 active:shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-950 transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer mt-2"
      >
        {loading ? (
          <>
            <FaIcon icon="fa-solid fa-spinner" size={18} className="animate-spin" />
            <span>Verifying Account...</span>
          </>
        ) : (
          'Sign In'
        )}
      </button>
    </form>
  );
};
