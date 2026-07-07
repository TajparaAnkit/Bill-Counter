import { Header } from './Header';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#eff3f8]">
      <Header />
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mx-auto w-full max-w-5xl">
          <main className="animate-slide-up">{children}</main>
        </div>
      </div>
    </div>
  );
};
