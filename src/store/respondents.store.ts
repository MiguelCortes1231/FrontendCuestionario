/**
 * 📚 Store local de encuestas
 *
 * Por ahora la persistencia de entrevistas vive en `localStorage`, lo cual
 * permite seguir operando mientras el backend de guardado/listado evoluciona.
 */
import type { SurveyRecord } from '../types/survey';
import type { PersonFormData } from '../types/person';

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
  // ✏️ Actualiza solo los datos básicos de la persona sin alterar respuestas ni metadata.
  updatePerson(id: string, person: PersonFormData) {
    const nextData = this.list().map((item) =>
      item.id === id
        ? {
            ...item,
            person,
          }
        : item
    );

    localStorage.setItem(KEY, JSON.stringify(nextData));
  },
};
