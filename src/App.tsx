// HashRouter avoids GitHub Pages 404s on refresh/deep-links (URLs use /#/...)
import { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './components/Auth/ProtectedRoute';
import { UiTestPage } from './pages/UiTestPage';
import { ConfirmProvider } from './components/ui/confirm';
import { ToastContainer } from './components/shared/ToastContainer';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProductsPage } from './pages/ProductsPage';
import { CustomersPage } from './pages/CustomersPage';
import { CustomerStatementPage } from './pages/CustomerStatementPage';
import { BillsPage } from './pages/BillsPage';
import { SettingsPage } from './pages/SettingsPage';
import { KnowledgeBasePage } from './pages/KnowledgeBasePage';
import { CatalogPage } from './pages/CatalogPage';
import { AdminPage } from './pages/AdminPage';
import { AdminClientPage } from './pages/AdminClientPage';
import { QuotationsPage } from './pages/QuotationsPage';

const LandingPage = lazy(() => import('./pages/LandingPage'));

function App() {
  return (
    <HashRouter>
      <ConfirmProvider>
      <ToastContainer />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        {/* Public shareable storefront — no auth required */}
        <Route path="/catalog/:userId" element={<CatalogPage />} />
        {/* Dev-only UI harness used by the Playwright suite (never in production builds) */}
        {import.meta.env.DEV && <Route path="/__ui-test" element={<UiTestPage />} />}

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/products"
          element={
            <ProtectedRoute>
              <ProductsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quotations"
          element={
            <ProtectedRoute>
              <QuotationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customers"
          element={
            <ProtectedRoute>
              <CustomersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customers/:id/statement"
          element={
            <ProtectedRoute>
              <CustomerStatementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bills"
          element={
            <ProtectedRoute>
              <BillsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/knowledge-base"
          element={
            <ProtectedRoute>
              <KnowledgeBasePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly>
              <AdminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/clients/:uid"
          element={
            <ProtectedRoute adminOnly>
              <AdminClientPage />
            </ProtectedRoute>
          }
        />

        {/* Public landing page (loaded on its own, so the app bundle stays small) */}
        <Route
          path="/"
          element={
            <Suspense fallback={<div className="min-h-screen bg-[#0b0720]" />}>
              <LandingPage />
            </Suspense>
          }
        />
      </Routes>
      </ConfirmProvider>
    </HashRouter>
  );
}

export default App;
