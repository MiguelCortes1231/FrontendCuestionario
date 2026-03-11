import axios from 'axios';
import { authStore } from '../store/auth.store';
import { loadingService } from './loading.service';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ||
  "https://servdes1.proyectoqroo.com.mx/gsv/ibeta/api",
});

api.interceptors.request.use((config) => {
  loadingService.show();
  const token = authStore.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    loadingService.hide();
    return response;
  },
  (error) => {
    loadingService.hide();
    return Promise.reject(error);
  },
);
