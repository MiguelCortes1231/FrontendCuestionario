import { api } from './http';
import type { LoginResponse } from '../types/auth';
import { authStore } from '../store/auth.store';

export async function login(username: string, password: string) {
  const { data } = await api.post<LoginResponse>('/loginjwt', { username, password });
  authStore.set(data.token, data.user);
  return data;
}

export function logout() {
  authStore.clear();
}
