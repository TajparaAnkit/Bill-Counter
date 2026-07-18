import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { UserMenu } from './UserMenu';

export const Header: React.FC = () => {
  const [syncTime, setSyncTime] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setSyncTime(now.toLocaleTimeString('en-US', { hour12: true }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-slate-100 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 items-center gap-4 py-3">
          {/* Left: Logo */}
          <div className="flex items-center col-span-1 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <div className="w-10 h-10 bg-gradient-to-r from-blue-800 to-blue-600 rounded-lg flex items-center justify-center shadow-md shadow-blue-500/20 mr-3">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H9v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="currentColor" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-extrabold text-blue-800 tracking-tight">BILL COUNTER</h1>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-0.5">TRADING DASHBOARD</p>
            </div>
          </div>

          {/* Right: User menu (holds all navigation) */}
          <div className="flex items-center justify-end col-span-1 gap-2">
            <div className="text-center">
              <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">LAST UPDATE</div>
              <div className="flex items-center justify-center gap-2 mt-1">
                <span className="text-xs font-medium text-slate-600 font-mono">{syncTime}</span>
                <span className="w-2 h-2 bg-blue-600 rounded-full shadow-sm"></span>
              </div>
            </div>
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
};
