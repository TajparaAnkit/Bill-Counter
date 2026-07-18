// HashRouter avoids GitHub Pages 404s on refresh/deep-links (URLs use /#/...)
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/Auth/ProtectedRoute';
import { ConfirmProvider } from './components/ui/confirm';
import { ToastContainer } from './components/shared/ToastContainer';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProductsPage } from './pages/ProductsPage';
import { CustomersPage } from './pages/CustomersPage';
import { BillsPage } from './pages/BillsPage';
import { SettingsPage } from './pages/SettingsPage';
import { KnowledgeBasePage } from './pages/KnowledgeBasePage';

function App() {
  return (
    <HashRouter>
      <ConfirmProvider>
      <ToastContainer />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

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
          path="/customers"
          element={
            <ProtectedRoute>
              <CustomersPage />
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

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      </ConfirmProvider>
    </HashRouter>
  );
}

export default App;
