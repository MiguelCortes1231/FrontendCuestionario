/**
 * 🔐 Store ligero de autenticación
 *
 * Este módulo encapsula el acceso a `localStorage` para:
 * - guardar token y usuario
 * - recuperar sesión vigente
 * - limpiar sesión al cerrar
 */
import type { AuthUser } from '../types/auth';

const TOKEN_KEY = 'contigo_qroo_token';
const USER_KEY = 'contigo_qroo_user';

export const authStore = {
  // 💾 Persiste la sesión del usuario autenticado.
  set(token: string, user: AuthUser) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  // 🔎 Recupera el token para enviarlo en requests protegidos.
  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },
  // 👤 Recupera la información serializada del usuario.
  getUser(): AuthUser | null {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  },
  // 🧹 Borra cualquier rastro local de sesión.
  clear() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};
