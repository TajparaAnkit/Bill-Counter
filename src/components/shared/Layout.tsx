import { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f5f6fa]">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="lg:pl-60 flex min-h-screen flex-col">
        <Header onMenuClick={() => setMenuOpen(true)} />
        <div className="flex-1 px-3 sm:px-5 py-4">
          <main className="animate-slide-up bg-white rounded-lg border border-slate-200 p-4 sm:p-5 min-h-[calc(100vh-6.5rem)]">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};
