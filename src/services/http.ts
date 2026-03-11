/**
 * 🌐 Cliente HTTP central
 *
 * Este archivo concentra la configuración base de Axios:
 * - URL base
 * - inyección automática de token
 * - activación/desactivación del loader global
 */
import axios from 'axios';
import { authStore } from '../store/auth.store';
import { loadingService } from './loading.service';

export const api = axios.create({
  // 🔧 Puede venir de variables de entorno o usar un fallback productivo conocido.
  baseURL: import.meta.env.VITE_API_BASE_URL ||
  "https://servdes1.proyectoqroo.com.mx/gsv/ibeta/api",
});

api.interceptors.request.use((config) => {
  // ⏳ Cada request activa el overlay global.
  loadingService.show();
  const token = authStore.getToken();
  if (token) {
    // 🔐 Si existe token, se envía en Authorization.
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    // ✅ Al resolver correctamente, se libera una operación activa.
    loadingService.hide();
    return response;
  },
  (error) => {
    // ❌ Aun con error se debe ocultar el loader para no congelar la UI.
    loadingService.hide();
    return Promise.reject(error);
  },
);
