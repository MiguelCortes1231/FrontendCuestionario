/**
 * 🗂️ Servicio genérico de catálogos
 * ---------------------------------------------------
 * Este archivo concentra helpers de lectura para catálogos simples.
 *
 * 🧠 Aunque hoy solo expone `getSecciones`, su intención arquitectónica
 * es dejar un punto separado para catálogos reutilizables que no sean
 * necesariamente parte directa del flujo principal de captura.
 */
import { api } from './http';
import type { SectionItem } from '../types/section';

export async function getSecciones() {
  // 📡 Consulta un catálogo de secciones desde backend y devuelve la data desnuda.
  const { data } = await api.get<{ success: boolean; data: SectionItem[] }>('/getSecciones');
  return data.data;
}
