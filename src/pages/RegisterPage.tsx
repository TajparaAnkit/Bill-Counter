import { Link } from 'react-router-dom';
import { RegisterForm } from '../components/Auth/RegisterForm';
import { GoogleButton } from '../components/Auth/GoogleButton';
import { AuthArt } from '../components/Auth/AuthArt';

export const RegisterPage: React.FC = () => {
  return (
    <div className="min-h-screen flex bg-white text-slate-800">
      {/* Left: form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 xl:px-24">
        <div className="w-full max-w-md mx-auto">
          {/* Brand */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-800 to-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20">
              <span className="text-white font-extrabold text-sm">BC</span>
            </div>
            <div>
              <span className="block text-lg font-extrabold tracking-tight text-slate-800 font-display leading-none">
                Bill Counter
              </span>
              <span className="block text-[10px] font-semibold uppercase tracking-widest text-slate-400 mt-1">
                Invoicing Suite
              </span>
            </div>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 font-display">Create your account</h1>
          <p className="mt-2 text-sm text-slate-500">Set up your business workspace in a minute.</p>

          <div className="mt-6 space-y-5">
            <GoogleButton label="Sign up with Google" />

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-xs font-medium text-slate-400">or sign up with email</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <RegisterForm />
          </div>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-blue-700 hover:text-blue-800 hover:underline">
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
