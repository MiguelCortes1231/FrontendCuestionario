import { AppRouter } from './routes/AppRouter';
import GlobalLoadingOverlay from './components/loading/GlobalLoadingOverlay';

export default function App() {
  return (
    <>
      <AppRouter />
      <GlobalLoadingOverlay />
    </>
  );
}
