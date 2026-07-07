import { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { auth, db } from '../../services/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../hooks/useToast';
import { validateEmail, validatePassword, parseFirebaseError } from '../../utils/validators';
import { FaIcon } from '../shared/FaIcon';

export const RegisterForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
    businessName?: string;
  }>({});
  const navigate = useNavigate();
  const toast = useToast();

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!businessName.trim()) {
      newErrors.businessName = 'Business name is required';
    }

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    const passwordValidation = validatePassword(password);
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (!passwordValidation.valid) {
      newErrors.password = passwordValidation.message;
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      // Create user account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Update profile with business name
      await updateProfile(userCredential.user, {
        displayName: businessName,
      });

      // Create user document in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email,
        businessName,
        createdAt: new Date(),
        uid: userCredential.user.uid,
      });

      toast.success('Account created successfully! Redirecting...');
      setTimeout(() => navigate('/dashboard'), 500);
    } catch (err: any) {
      const errorMessage = parseFirebaseError(err);
      toast.error(errorMessage);
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleRegister} className="space-y-4">
      {/* Business Name Input */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
          Business / Brand Name
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
            <FaIcon icon="fa-solid fa-store" size={18} />
          </div>
          <input
            type="text"
            value={businessName}
            onChange={(e) => {
              setBusinessName(e.target.value);
              if (errors.businessName) setErrors({ ...errors, businessName: undefined });
            }}
            disabled={loading}
            className={`w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border ${
              errors.businessName ? 'border-rose-500/80 focus:ring-rose-500/20' : 'border-slate-800 focus:border-emerald-500 focus:ring-emerald-500/10'
            } rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-4 transition-all duration-200`}
            placeholder="e.g. Naitu Crochet"
          />
        </div>
        {errors.businessName && (
          <div className="flex items-center gap-1.5 mt-1.5 text-rose-400 text-xs font-medium">
            <FaIcon icon="fa-solid fa-circle-exclamation" size={14} />
            <span>{errors.businessName}</span>
          </div>
        )}
      </div>

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
            className={`w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border ${
              errors.email ? 'border-rose-500/80 focus:ring-rose-500/20' : 'border-slate-800 focus:border-emerald-500 focus:ring-emerald-500/10'
            } rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-4 transition-all duration-200`}
            placeholder="name@business.com"
          />
        </div>
        {errors.email && (
          <div className="flex items-center gap-1.5 mt-1.5 text-rose-400 text-xs font-medium">
            <FaIcon icon="fa-solid fa-circle-exclamation" size={14} />
            <span>{errors.email}</span>
          </div>
        )}
      </div>

      {/* Password Input */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
          Password
        </label>
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
            className={`w-full pl-10 pr-10 py-2.5 bg-slate-900/60 border ${
              errors.password ? 'border-rose-500/80 focus:ring-rose-500/20' : 'border-slate-800 focus:border-emerald-500 focus:ring-emerald-500/10'
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
        {errors.password ? (
          <div className="flex items-start gap-1.5 mt-1.5 text-rose-400 text-xs font-medium">
            <FaIcon icon="fa-solid fa-circle-exclamation" size={14} className="mt-0.5 flex-shrink-0" />
            <span>{errors.password}</span>
          </div>
        ) : (
          <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-1.5 pl-1">
            Min 6 chars, 1 uppercase, 1 number
          </p>
        )}
      </div>

      {/* Confirm Password Input */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
          Confirm Password
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
            <FaIcon icon="fa-solid fa-lock" size={18} />
          </div>
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined });
            }}
            disabled={loading}
            className={`w-full pl-10 pr-10 py-2.5 bg-slate-900/60 border ${
              errors.confirmPassword ? 'border-rose-500/80 focus:ring-rose-500/20' : 'border-slate-800 focus:border-emerald-500 focus:ring-emerald-500/10'
            } rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-4 transition-all duration-200`}
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-350 transition-colors focus:outline-none"
            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
          >
            {showConfirmPassword ? <FaIcon icon="fa-solid fa-eye-slash" size={18} /> : <FaIcon icon="fa-solid fa-eye" size={18} />}
          </button>
        </div>
        {errors.confirmPassword && (
          <div className="flex items-center gap-1.5 mt-1.5 text-rose-400 text-xs font-medium">
            <FaIcon icon="fa-solid fa-circle-exclamation" size={14} />
            <span>{errors.confirmPassword}</span>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-teal-600 shadow-md shadow-emerald-500/10 hover:shadow-lg hover:shadow-emerald-500/20 active:translate-y-0.5 active:shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-950 transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer mt-4"
      >
        {loading ? (
          <>
            <FaIcon icon="fa-solid fa-spinner" size={18} className="animate-spin" />
            <span>Creating workspace...</span>
          </>
        ) : (
          'Get Started'
        )}
      </button>
    </form>
  );
};
