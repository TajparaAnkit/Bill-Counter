import { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
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
    if (!businessName.trim()) newErrors.businessName = 'Business name is required';
    if (!email) newErrors.email = 'Email is required';
    else if (!validateEmail(email)) newErrors.email = 'Please enter a valid email';
    const pw = validatePassword(password);
    if (!password) newErrors.password = 'Password is required';
    else if (!pw.valid) newErrors.password = pw.message;
    if (!confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    else if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: businessName });
      await setDoc(doc(db, 'users', cred.user.uid), {
        email,
        businessName,
        createdAt: new Date(),
        uid: cred.user.uid,
      });
      toast.success('Account created successfully! Redirecting...');
      setTimeout(() => navigate('/dashboard'), 500);
    } catch (err: any) {
      toast.error(parseFirebaseError(err));
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  const clear = (k: keyof typeof errors) => {
    if (errors[k]) setErrors({ ...errors, [k]: undefined });
  };

  const inputBase =
    'w-full pl-10 pr-4 py-2.5 rounded-xl border bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 transition-all duration-200';
  const okRing = 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/10';
  const errRing = 'border-rose-400 focus:border-rose-400 focus:ring-rose-500/10';

  const Field = ({
    icon,
    children,
    error,
  }: {
    icon: string;
    children: React.ReactNode;
    error?: string;
  }) => (
    <div>
      <div className="relative">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <FaIcon icon={icon} size={16} />
        </span>
        {children}
      </div>
      {error && (
        <p className="flex items-center gap-1.5 mt-1.5 text-rose-500 text-xs font-medium">
          <FaIcon icon="fa-solid fa-circle-exclamation" size={13} />
          {error}
        </p>
      )}
    </div>
  );

  return (
    <form onSubmit={handleRegister} className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Business / Brand name</label>
        <Field icon="fa-solid fa-store" error={errors.businessName}>
          <input
            type="text"
            value={businessName}
            onChange={(e) => {
              setBusinessName(e.target.value);
              clear('businessName');
            }}
            disabled={loading}
            className={`${inputBase} ${errors.businessName ? errRing : okRing}`}
            placeholder="e.g. Bill Counter"
          />
        </Field>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email address</label>
        <Field icon="fa-solid fa-envelope" error={errors.email}>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              clear('email');
            }}
            disabled={loading}
            className={`${inputBase} ${errors.email ? errRing : okRing}`}
            placeholder="name@business.com"
          />
        </Field>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
        <Field icon="fa-solid fa-lock" error={errors.password}>
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              clear('password');
            }}
            disabled={loading}
            className={`${inputBase} pr-10 ${errors.password ? errRing : okRing}`}
            placeholder="Min 6 chars, 1 uppercase, 1 number"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            <FaIcon icon={showPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'} size={16} />
          </button>
        </Field>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Confirm password</label>
        <Field icon="fa-solid fa-lock" error={errors.confirmPassword}>
          <input
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              clear('confirmPassword');
            }}
            disabled={loading}
            className={`${inputBase} ${errors.confirmPassword ? errRing : okRing}`}
            placeholder="Re-enter password"
          />
        </Field>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-blue-800 hover:bg-blue-900 text-white font-semibold rounded-xl shadow-md shadow-blue-800/20 hover:shadow-lg active:translate-y-0.5 transition-all duration-200 disabled:opacity-60 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer mt-1"
      >
        {loading ? (
          <>
            <FaIcon icon="fa-solid fa-spinner" size={16} className="animate-spin" />
            <span>Creating account...</span>
          </>
        ) : (
          'Create account'
        )}
      </button>
    </form>
  );
};
