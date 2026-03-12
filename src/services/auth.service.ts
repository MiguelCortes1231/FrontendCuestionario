/**
 * 🔐 Servicios de autenticación
 *
 * Aísla la lógica de login/logout para que las pantallas no dependan
 * directamente de Axios ni del detalle del almacenamiento.
 */
import { api } from './http';
import type { LoginResponse } from '../types/auth';
import { authStore } from '../store/auth.store';

const LOGIN_PATH = '/login';
const EXPIRED_REASON = 'expired';

export async function login(username: string, password: string) {
  // 🚪 Solicita token al backend y, si todo sale bien, persiste la sesión.
  const { data } = await api.post<LoginResponse>('/loginjwt', { username, password });
  authStore.set(data.token, data.user);
  return data;
}

export function logout() {
  // 🧹 Cierre local inmediato de sesión.
  authStore.clear();
}

export function buildLoginUrl(reason?: string) {
  return reason ? `${LOGIN_PATH}?reason=${reason}` : LOGIN_PATH;
}

export function expireSession() {
  authStore.clear();

  if (window.location.pathname === LOGIN_PATH) {
    if (window.location.search !== `?reason=${EXPIRED_REASON}`) {
      window.history.replaceState(null, '', buildLoginUrl(EXPIRED_REASON));
    }
    return;
  }

  window.location.replace(buildLoginUrl(EXPIRED_REASON));
}
