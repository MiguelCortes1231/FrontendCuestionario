/**
 * 🧩 Componente raíz de composición
 *
 * Esta capa mantiene la app ligera:
 * - 🧭 inyecta el router principal
 * - ⏳ deja disponible el overlay global de carga
 */
import { AppRouter } from './routes/AppRouter';
import GlobalLoadingOverlay from './components/loading/GlobalLoadingOverlay';

export default function App() {
  return (
    <>
      {/* 🚦 Router con rutas públicas y privadas */}
      <AppRouter />
      {/* 🌫️ Loader transversal que reacciona a llamadas HTTP */}
      <GlobalLoadingOverlay />
    </>
  );
}
