/**
 * 🔐 Store ligero de autenticación
 *
 * Este módulo encapsula el acceso a `localStorage` para:
 * - guardar token y usuario
 * - recuperar sesión vigente
 * - limpiar sesión al cerrar
 */
import type { AuthUser, JwtPayload } from '../types/auth';

const TOKEN_KEY = 'contigo_qroo_token';
const USER_KEY = 'contigo_qroo_user';

function decodeBase64Url(value: string) {
  // 🔓 Convierte base64url a base64 estándar para poder decodificar el JWT.
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  return atob(padded);
}

function decodeJwtPayload(token: string): JwtPayload | null {
  // 🪪 Extrae solo el payload del token para leer vigencia localmente.
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;
    return JSON.parse(decodeBase64Url(payload)) as JwtPayload;
  } catch {
    return null;
  }
}

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
  // 🧾 Decodifica el payload del JWT para consultar vigencia sin exponer la firma.
  getTokenPayload(): JwtPayload | null {
    const token = this.getToken();
    return token ? decodeJwtPayload(token) : null;
  },
  // ⏰ Obtiene la fecha exacta de expiración si el token la declara.
  getExpirationDate() {
    const payload = this.getTokenPayload();
    return typeof payload?.exp === 'number' ? new Date(payload.exp * 1000) : null;
  },
  // ✅ Valida que el token exista y siga dentro de su ventana de vigencia.
  hasActiveSession() {
    const token = this.getToken();
    const payload = this.getTokenPayload();
    const nowInSeconds = Math.floor(Date.now() / 1000);

    if (!token || !payload) return false;
    if (typeof payload.nbf === 'number' && payload.nbf > nowInSeconds) return false;
    if (typeof payload.exp !== 'number') return false;

    return payload.exp > nowInSeconds;
  },
  // 👤 Recupera la información serializada del usuario.
  getUser(): AuthUser | null {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  },
  // 🧹 Borra cualquier rastro local de sesión.
  clear() {
    // 🧹 Se limpia todo porque la app asume una sesión única por navegador.
    localStorage.clear();
  },
};
