import { api } from './http';
import type { SectionItem } from '../types/section';

export async function getSecciones() {
  const { data } = await api.get<{ success: boolean; data: SectionItem[] }>('/getSecciones');
  return data.data;
}
