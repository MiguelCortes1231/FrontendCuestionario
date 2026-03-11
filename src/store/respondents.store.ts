/**
 * 📚 Store local de encuestas
 *
 * Por ahora la persistencia de entrevistas vive en `localStorage`, lo cual
 * permite seguir operando mientras el backend de guardado/listado evoluciona.
 */
import type { SurveyRecord } from '../types/survey';

const KEY = 'contigo_qroo_respondents';

export const respondentsStore = {
  // 📋 Devuelve todas las encuestas guardadas, con las más recientes primero si así fueron insertadas.
  list(): SurveyRecord[] {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SurveyRecord[]) : [];
  },
  // 💾 Inserta un nuevo registro al inicio para facilitar consulta inmediata.
  save(record: SurveyRecord) {
    const data = this.list();
    localStorage.setItem(KEY, JSON.stringify([record, ...data]));
  },
  // 🔍 Busca una encuesta específica para abrir su vista previa o PDF.
  findById(id: string) {
    return this.list().find((item) => item.id === id) ?? null;
  },
};
