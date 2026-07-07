import { Link } from 'react-router-dom';
import { LoginForm } from '../components/Auth/LoginForm';
import { Sparkles, Package, FileText, CheckCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col lg:flex-row text-slate-100 font-sans">
      {/* Visual Section - Left Side */}
      <div className="lg:w-1/2 relative hidden lg:flex flex-col justify-between p-12 overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-emerald-950 border-r border-slate-800">
        {/* Glow Effects */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -translate-x-12 -translate-y-12"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none translate-x-12 translate-y-12"></div>
        
        {/* Brand/Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg shadow-emerald-500/20">
            <span className="text-white text-base font-bold tracking-tight">NC</span>
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-white font-display">Naitu Crochet</span>
            <span className="text-[10px] block text-emerald-400 font-semibold tracking-wider uppercase -mt-0.5">Portal</span>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="relative z-10 my-auto max-w-md space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <Sparkles size={12} />
              <span>Smart Inventory & Invoicing</span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white leading-tight font-display">
              Manage your craft business with precision.
            </h1>
            <p className="text-slate-400 leading-relaxed text-sm">
              Keep track of materials, streamline invoice creation, and focus on what you do best: crafting beautiful handmade products.
            </p>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-800/80">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <Package size={16} />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Inventory Management</h4>
                <p className="text-xs text-slate-400 mt-0.5">Real-time stock tracking for finished items and yarn stock.</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <FileText size={16} />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Instant Invoicing</h4>
                <p className="text-xs text-slate-400 mt-0.5">Generate beautiful, downloadable invoices for your customers.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer/Testimonial in Left Panel */}
        <div className="relative z-10 text-xs text-slate-500 flex justify-between items-center">
          <span>&copy; {new Date().getFullYear()} Naitu Crochet.</span>
          <span className="flex items-center gap-1"><CheckCircle size={12} className="text-emerald-500" /> Secure Cloud Platform</span>
        </div>
      </div>

      {/* Form Section - Right Side */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-16 xl:px-24 bg-slate-950 relative">
        {/* Mobile Logo Header */}
        <div className="lg:hidden flex items-center gap-3 mb-12 max-w-md mx-auto w-full">
          <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg shadow-emerald-500/20">
            <span className="text-white text-base font-bold tracking-tight">NC</span>
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-white font-display">Naitu Crochet</span>
            <span className="text-[10px] block text-emerald-400 font-semibold tracking-wider uppercase -mt-0.5">Portal</span>
          </div>
        </div>

        <div className="w-full max-w-md mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold tracking-tight text-white font-display">Welcome Back</h2>
            <p className="text-sm text-slate-400 mt-2">
              Sign in to your account to manage your workspace.
            </p>
          </div>

          <LoginForm />

          <p className="mt-8 text-center text-sm text-slate-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-emerald-400 hover:text-emerald-300 font-bold transition-colors">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
