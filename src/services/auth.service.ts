/**
 * 🔐 Servicios de autenticación
 *
 * Aísla la lógica de login/logout para que las pantallas no dependan
 * directamente de Axios ni del detalle del almacenamiento.
 */
import { api } from './http';
import type { LoginResponse } from '../types/auth';
import { authStore } from '../store/auth.store';

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
