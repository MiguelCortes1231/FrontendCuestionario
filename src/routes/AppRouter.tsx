/**
 * 🗺️ Router principal de la aplicación
 *
 * Separa dos mundos:
 * - 🔓 rutas públicas, como el login
 * - 🔒 rutas privadas, accesibles solo si existe token
 */
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import type { ReactElement } from 'react';
import MainLayout from '../layouts/MainLayout';
import LoginPage from '../pages/auth/LoginPage';
import DashboardPage from '../pages/dashboard/DashboardPage';
import SurveyNewPage from '../pages/surveys/SurveyNewPage';
import RespondentsListPage from '../pages/respondents/RespondentsListPage';
import RespondentPreviewPage from '../pages/respondents/RespondentPreviewPage';
import { authStore } from '../store/auth.store';
import { buildLoginUrl } from '../services/auth.service';

// 🛡️ Guardia simple de autenticación basada en presencia de token.
function PrivateRoute({ children }: { children: ReactElement }) {
  const location = useLocation();
  const token = authStore.getToken();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!authStore.hasActiveSession()) {
    return <Navigate to={buildLoginUrl('expired')} replace state={{ from: location }} />;
  }

  return children;
}

export function AppRouter() {
  return (
    <Routes>
      {/* 🔓 Acceso público */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* 🔒 Áreas internas bajo el layout principal */}
      <Route path="/" element={<PrivateRoute><MainLayout /></PrivateRoute>}>
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="surveys/new" element={<SurveyNewPage />} />
        <Route path="respondents" element={<RespondentsListPage />} />
        <Route path="respondents/:id" element={<RespondentPreviewPage />} />
      </Route>
    </Routes>
  );
}
