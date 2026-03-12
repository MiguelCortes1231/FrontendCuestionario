/**
 * 🧠 Tipos del dominio "encuesta"
 * ---------------------------------------------------
 * Este archivo modela dos capas:
 *
 * 1. respuestas del cuestionario
 * 2. registro final persistido de una entrevista
 *
 * 🎯 Gracias a estos tipos, la app puede separar claramente:
 * - quién es la persona
 * - qué contestó
 * - cuándo se entrevistó
 * - quién levantó la información
 */
import type { PersonFormData } from './person';

// 🧠 Catálogo tipado de respuestas del cuestionario.
export interface SurveyAnswers {
  hasValidCredential: 'Si' | 'No' | '';
  sexoObservado: 'Hombre' | 'Mujer' | 'Otro' | '';
  rangoEdad: '18 a 29' | '30 a 44' | '45 a 59' | '60 o más' | '';
  escolaridad: 'Primaria / Secundaria' | 'Bachillerato / Preparatoria' | 'Universidad / Posgrado' | 'Sin estudios oficiales' | '';
  conoceGino: 'Si' | 'No' | '';
  conoceLatifa: 'Si' | 'No' | '';
  conocePalazuelos: 'Si' | 'No' | '';
  importanciaPoliticos: 'Muy importante' | 'Algo importante' | 'Poco importante' | 'Nada importante' | 'NS/NC' | '';
  ginoDebeSeguir: 'Debe seguir recorriendo el estado y escuchando a la gente.' | 'Debe enfocarse solo en el trabajo de oficina.' | 'NS/NC' | '';
  opinionGino: 'Muy Buena' | 'Buena' | 'Regular' | 'Mala' | 'Muy Mala' | 'No conoce / No contestó' | '';
  atributoGino: 'Honestidad' | 'Experiencia' | 'Juventud / Renovación' | 'Capacidad técnica' | 'Cercanía con la gente' | '';
  problemaNacional: string;
  problemaNacionalOtro: string;
  problemaLocal: string;
  problemaLocalOtro: string;
  resultado: 'Completa' | 'Rechazada a la mitad';
  observaciones: string;
}

// 📄 Registro completo persistido al terminar una entrevista.
export interface SurveyRecord {
  id: string;
  createdAt: string;
  startedAt: string;
  finishedAt: string;
  interviewerName: string;
  sectionPriorityLabel: string;
  person: PersonFormData;
  answers: SurveyAnswers;
}
