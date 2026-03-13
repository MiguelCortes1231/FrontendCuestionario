/**
 * 🧠 Dominio compartido del cuestionario
 * ---------------------------------------------------
 * Este archivo concentra metadata estructural del cuestionario que el frontend
 * necesita conocer para experiencias de validación, navegación y mensajes.
 *
 * Aquí no definimos el render visual, sino conocimiento del dominio:
 * - 📄 en qué página vive cada pregunta
 * - 🔢 cuál es su número lógico dentro del instrumento
 * - 🏷️ qué etiqueta conviene mostrar al usuario
 *
 * Esto ayuda a mantener el flujo de encuesta más limpio y más cercano a SOLID:
 * la página renderiza; este módulo describe el cuestionario ✅
 */
import type { SurveyAnswers } from '../../types/survey';

export type MissingAnswerItem = {
  field: keyof SurveyAnswers;
  page: number;
  questionNumber: string;
  label: string;
};

export const SURVEY_QUESTION_META: Array<MissingAnswerItem> = [
  { field: 'hasValidCredential', page: 1, questionNumber: '1', label: 'Credencial vigente' },
  { field: 'sexoObservado', page: 1, questionNumber: '2', label: 'Sexo observado' },
  { field: 'rangoEdad', page: 1, questionNumber: '3', label: 'Rango de edad' },
  { field: 'escolaridad', page: 1, questionNumber: '4', label: 'Escolaridad' },
  { field: 'conoceGino', page: 2, questionNumber: '5', label: '¿Conoce a Gino Segura?' },
  { field: 'conoceLatifa', page: 2, questionNumber: '5', label: '¿Conoce a Latifa Martínez?' },
  { field: 'conocePalazuelos', page: 2, questionNumber: '5', label: '¿Conoce a Roberto Palazuelos?' },
  { field: 'importanciaPoliticos', page: 2, questionNumber: '6', label: 'Importancia del contacto directo' },
  { field: 'ginoDebeSeguir', page: 3, questionNumber: '7', label: 'Labor de cercanía de Gino Segura' },
  { field: 'opinionGino', page: 3, questionNumber: '8', label: 'Opinión de Gino Segura' },
  { field: 'atributoGino', page: 3, questionNumber: '9', label: 'Principal atributo asociado' },
  { field: 'problemaNacional', page: 4, questionNumber: '10', label: 'Problemática nacional' },
  { field: 'problemaLocal', page: 4, questionNumber: '11', label: 'Problemática local' },
];

export function findMissingSurveyAnswers(answers: SurveyAnswers) {
  // ⚠️ Observaciones queda fuera a propósito:
  // puede viajar vacío sin bloquear el cierre del levantamiento.
  return SURVEY_QUESTION_META.filter((item) => {
    const value = answers[item.field];
    return String(value ?? '').trim() === '';
  });
}
