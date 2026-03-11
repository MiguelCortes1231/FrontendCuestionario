import type { SurveyRecord } from '../types/survey';

const KEY = 'contigo_qroo_respondents';

export const respondentsStore = {
  list(): SurveyRecord[] {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SurveyRecord[]) : [];
  },
  save(record: SurveyRecord) {
    const data = this.list();
    localStorage.setItem(KEY, JSON.stringify([record, ...data]));
  },
  findById(id: string) {
    return this.list().find((item) => item.id === id) ?? null;
  },
};
