import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './data/AuthProvider';
import { StoreProvider } from './data/store';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardPage } from './pages/DashboardPage';
import { NewReceiptPage } from './pages/NewReceiptPage';
import { HistoryPage } from './pages/HistoryPage';
import { ReceiptDetailPage } from './pages/ReceiptDetailPage';
import { DebtPage } from './pages/DebtPage';
import { SuppliersPage } from './pages/SuppliersPage';
import { ProfilePage } from './pages/ProfilePage';
import { ForgotPasswordPage, LoginPage, RegisterPage } from './pages/AuthPages';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route
            element={
              <ProtectedRoute>
                <StoreProvider>
                  <Layout />
                </StoreProvider>
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="new" element={<NewReceiptPage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="receipt/:id" element={<ReceiptDetailPage />} />
            <Route path="debts" element={<DebtPage />} />
            <Route path="suppliers" element={<SuppliersPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
