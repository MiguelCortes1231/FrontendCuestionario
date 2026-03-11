/**
 * 🗂️ Servicio de catálogo de secciones
 *
 * Se usa durante la captura para asociar la persona a una sección electoral y
 * recuperar información complementaria como municipio.
 */
import { api } from './http';
import type { SectionItem } from '../types/section';

export async function getSecciones() {
  const { data } = await api.get<{ success: boolean; data: SectionItem[] }>('/getSecciones');
  return data.data ?? [];
}
