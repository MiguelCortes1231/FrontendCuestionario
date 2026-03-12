/**
 * 🧩 Componente raíz de composición
 *
 * Esta capa mantiene la app ligera:
 * - 🧭 inyecta el router principal
 * - ⏳ deja disponible el overlay global de carga
 */
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AppRouter } from './routes/AppRouter';
import GlobalLoadingOverlay from './components/loading/GlobalLoadingOverlay';
import { authStore } from './store/auth.store';
import { expireSession } from './services/auth.service';

function SessionWatcher() {
  const location = useLocation();

  useEffect(() => {
    const token = authStore.getToken();
    const expiresAt = authStore.getExpirationDate();

    if (!token || !expiresAt) return;

    const remainingMs = expiresAt.getTime() - Date.now();

    if (remainingMs <= 0) {
      expireSession();
      return;
    }

    const timeoutId = window.setTimeout(() => {
      expireSession();
    }, remainingMs);

    return () => window.clearTimeout(timeoutId);
  }, [location.pathname, location.search]);

  return null;
}

export default function App() {
  return (
    <>
      <SessionWatcher />
      {/* 🚦 Router con rutas públicas y privadas */}
      <AppRouter />
      {/* 🌫️ Loader transversal que reacciona a llamadas HTTP */}
      <GlobalLoadingOverlay />
    </>
  );
}
