import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { RegisterForm } from '../components/Auth/RegisterForm';
import { AuthArt } from '../components/Auth/AuthArt';
import { BRAND_NAME } from '../config/brand';

export const RegisterPage: React.FC = () => {
  // Already logged in when arriving here (e.g. from the landing page): go to the dashboard.
  // Decided once, so signing in / signing up on this page finishes its own flow first.
  const { user, loading } = useAuth();
  const [alreadyIn, setAlreadyIn] = useState<boolean | null>(null);
  useEffect(() => {
    if (!loading && alreadyIn === null) setAlreadyIn(!!user);
  }, [loading, user, alreadyIn]);
  if (alreadyIn) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen flex bg-white text-slate-800">
      {/* Left: form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 xl:px-24">
        <div className="w-full max-w-md mx-auto">
          {/* Brand */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-lg bg-brand-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">BC</span>
            </div>
            <div>
              <span className="block text-lg font-bold text-slate-800 leading-none">
                {BRAND_NAME}
              </span>
              <span className="block text-[10px] font-semibold uppercase tracking-widest text-slate-400 mt-1">
                Invoicing Suite
              </span>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-slate-800">Create your account</h1>
          <p className="mt-2 text-sm text-slate-500">Set up your business workspace in a minute.</p>

          <div className="mt-6 space-y-5">
            <RegisterForm />
          </div>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-brand-700 hover:text-brand-800 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Right: decorative panel */}
      <AuthArt />
    </div>
  );
};
