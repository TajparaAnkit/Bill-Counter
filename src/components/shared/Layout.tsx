import { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { PlanBanner } from './PlanBanner';

interface LayoutProps {
  children: React.ReactNode;
}

const COLLAPSE_KEY = 'bc.sidebarCollapsed';
const readCollapsed = () => {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === '1';
  } catch {
    return false;
  }
};

// App shell: fixed light sidebar (collapsible to an icon rail on desktop),
// sticky top bar, and pages rendered straight on the canvas as cards.
export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(readCollapsed);

  const toggleCollapse = () =>
    setCollapsed((c) => {
      try {
        localStorage.setItem(COLLAPSE_KEY, c ? '0' : '1');
      } catch {
        // storage unavailable — keep the in-memory state only
      }
      return !c;
    });

  return (
    <div className="min-h-screen bg-canvas">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} collapsed={collapsed} onToggleCollapse={toggleCollapse} />
      <div className={`flex min-h-screen flex-col transition-[padding] duration-200 ${collapsed ? 'lg:pl-[76px]' : 'lg:pl-64'}`}>
        <Header onMenuClick={() => setMenuOpen(true)} />
        <PlanBanner />
        <main className="animate-slide-up flex-1 px-3 py-5 sm:px-6 sm:py-6 w-full max-w-[1600px] mx-auto">{children}</main>
      </div>
    </div>
  );
};
