/**
 * 🚀 Punto de entrada principal de la aplicación
 *
 * Aquí se monta todo el árbol React y se conectan las capas globales:
 * - 🎨 tema visual con MUI
 * - 🧭 enrutamiento con React Router
 * - 🔔 notificaciones toast
 * - 🌍 estilos globales y estilos de Leaflet
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'leaflet/dist/leaflet.css';

import App from './App';
import { theme } from './theme/theme';
import './index.css';

// 🧱 Se crea la raíz y se inyecta la app con todas sus dependencias globales.
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      {/* 🧼 Resetea estilos base para tener consistencia visual entre navegadores */}
      <CssBaseline />
      {/* 🗺️ Habilita navegación SPA basada en URL */}
      <BrowserRouter>
        <App />
        {/* 🔔 Contenedor global de mensajes rápidos de éxito, error, aviso e información */}
        <ToastContainer position="top-right" autoClose={2600} />
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>,
);
