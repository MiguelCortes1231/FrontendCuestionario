/**
 * 🧠 Servicio central del dominio "encuestados / cuestionarios"
 * ---------------------------------------------------
 * Este archivo conecta toda la parte operativa del frontend con el backend real.
 *
 * Sus responsabilidades son:
 * - 🌐 consumir endpoints de alta, listado, detalle, edición y guardado
 * - 🔁 traducir entre textos del frontend y enteros `Pregunta1..Pregunta13`
 * - 🧩 adaptar respuestas crudas del backend a un `SurveyRecord` uniforme
 * - ⚠️ resolver validaciones operativas del frontend, como duplicados por clave de elector
 *
 * Si un programador nuevo quiere entender cómo fluye la información del proyecto,
 * este archivo es uno de los mejores puntos de entrada 🚀
 */
import { api } from './http';
import type { PersonFormData } from '../types/person';
import type { SurveyAnswers, SurveyRecord } from '../types/survey';
import { authStore } from '../store/auth.store';

// 📦 Envelope estándar de respuesta usado por varios endpoints del backend.
type ApiResponseEnvelope<T> = {
  success: boolean;
  message?: string;
  data: T;
};

// 📥 Modelo remoto "tal cual llega" desde los endpoints de cuestionarios.
type ApiCuestionario = {
  IdCuestionario: number;
  Folio: string;
  Consecutivo?: number | null;
  Latitud: number | string | null;
  Longitud: number | string | null;
  ClaveElector: string | null;
  CURP: string | null;
  Nombre: string | null;
  PrimerApellido: string | null;
  SegundoApellido: string | null;
  Telefono: string | null;
  Sexo: string | null;
  FechaNacimiento: string | null;
  IdSeccion: number | string | null;
  Domicilio: string | null;
  Colonia: string | null;
  Numero: string | null;
  CodigoPostal: number | string | null;
  Estado: string | null;
  Vigencia: number | string | null;
  TipoCredencial: string | null;
  Pregunta1: number | null;
  Pregunta2: number | null;
  Pregunta3: number | null;
  Pregunta4: number | null;
  Pregunta5: number | null;
  Pregunta6: number | null;
  Pregunta7: number | null;
  Pregunta8: number | null;
  Pregunta9: number | null;
  Pregunta10: number | null;
  Pregunta11: number | null;
  Pregunta12: number | null;
  Pregunta13: number | null;
  Observaciones: string | null;
  IdEstatus: number | null;
  IdUser?: number | null;
  created_at: string | null;
  updated_at: string | null;
};

// 🔎 Resumen mínimo que usa la UI para advertir posibles duplicados.
export type DuplicateRespondentMatch = {
  questionnaireId: number;
  folio: string;
  claveElector: string;
  fullName: string;
  createdAt: string;
};

// 🧍 Payload exacto que backend espera al crear o editar persona.
type StorePersonaPayload = {
  Latitud: number;
  Longitud: number;
  ClaveElector: string;
  CURP: string;
  PrimerApellido: string;
  SegundoApellido: string;
  Nombre: string;
  IdSeccion: number;
  Sexo: string;
  FechaNacimiento: string;
  Domicilio: string;
  Colonia: string;
  Numero: string;
  Estado: string;
  CodigoPostal: string;
  Telefono: string;
  Vigencia: number;
  TipoCredencial: string;
};

// ✅ Respuesta del alta: aquí backend confirma y asigna el folio oficial.
type StorePersonaResponse = {
  success: boolean;
  message: string;
  IdCuestionario: number;
  folio: string;
};

// 🧠 Estructura que backend espera para guardar respuestas cerradas.
type StorePreguntasPayload = {
  Pregunta1: number | null;
  Pregunta2: number | null;
  Pregunta3: number | null;
  Pregunta4: number | null;
  Pregunta5: number | null;
  Pregunta6: number | null;
  Pregunta7: number | null;
  Pregunta8: number | null;
  Pregunta9: number | null;
  Pregunta10: number | null;
  Pregunta11: number | null;
  Pregunta12: number | null;
  Pregunta13: number | null;
  Observaciones: string;
  IdEstatus: number;
};

// ✏️ Respuesta corta del backend al editar información básica.
type EditCuestionarioResponse = {
  success: boolean;
  message: string;
  data: {
    id: number;
    Folio: string;
    CURP: string;
    Nombre: string;
    PrimerApellido: string;
    updated_at: string;
  };
};

const YES_NO_OPTIONS = ['Si', 'No'] as const;
const OBSERVED_SEX_OPTIONS = ['Hombre', 'Mujer', 'Otro'] as const;
const AGE_RANGE_OPTIONS = ['18 a 29', '30 a 44', '45 a 59', '60 o mas'] as const;
const EDUCATION_OPTIONS = [
  'Primaria / Secundaria',
  'Bachillerato / Preparatoria',
  'Universidad / Posgrado',
  'Sin estudios oficiales',
] as const;
const IMPORTANCE_OPTIONS = [
  'Muy importante',
  'Algo importante',
  'Poco importante',
  'Nada importante',
  'NS/NC',
] as const;
const GINO_PROXIMITY_OPTIONS = [
  'Debe seguir recorriendo el estado y escuchando a la gente.',
  'Debe enfocarse solo en el trabajo de oficina.',
  'NS/NC',
] as const;
const GINO_OPINION_OPTIONS = [
  'Muy Buena',
  'Buena',
  'Regular',
  'Mala',
  'Muy Mala',
  'No conoce / No contesto',
] as const;
const GINO_ATTRIBUTE_OPTIONS = [
  'Honestidad',
  'Experiencia',
  'Juventud / Renovacion',
  'Capacidad tecnica',
  'Cercania con la gente',
] as const;
const NATIONAL_ISSUE_OPTIONS = [
  'Inseguridad y violencia',
  'El alto costo de la vida (Inflacion)',
  'Corrupcion',
  'Falta de oportunidades para jovenes',
  'Falta de medicamentos / Salud',
  'Medio ambiente',
  'Otro',
] as const;
const LOCAL_ISSUE_OPTIONS = [
  'Alumbrado publico y bacheo',
  'Robos o asaltos en la zona',
  'Falta de agua o drenaje',
  'Limpieza de parques y recoleccion de basura',
  'Otro',
] as const;

const STATUS_TO_RESULT = {
  1: 'Completa',
  2: 'Rechazada a la mitad',
} as const;

const RESULT_TO_STATUS: Record<SurveyAnswers['resultado'], number> = {
  Completa: 1,
  'Rechazada a la mitad': 2,
};

function normalizeOptionValue(value: unknown) {
  // 🧼 Permite comparar textos sin sufrir por acentos, mayúsculas o espacios de más.
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function encodeOption<T extends string>(options: readonly T[], value: string) {
  // 🔢 Convierte el texto visible de la UI en un índice 1-based compatible con backend.
  const normalizedValue = normalizeOptionValue(value);
  const index = options.findIndex((option) => normalizeOptionValue(option) === normalizedValue);
  return index >= 0 ? index + 1 : null;
}

function decodeOption<T extends string>(options: readonly T[], value: number | null | undefined) {
  // 🔁 Hace la traducción inversa: entero remoto -> texto que entiende la interfaz.
  if (!value || value < 1 || value > options.length) {
    return '';
  }

  return options[value - 1];
}

function decodeResult(statusId: number | null | undefined): SurveyAnswers['resultado'] {
  // 🎯 Traducción del estatus remoto a la etiqueta funcional del frontend.
  return STATUS_TO_RESULT[statusId as keyof typeof STATUS_TO_RESULT] ?? 'Completa';
}

function encodeSexoToApi(value: string) {
  // 🚻 El formulario trabaja con etiquetas; el backend con abreviaturas.
  const normalized = normalizeOptionValue(value);
  if (normalized === 'mujer' || normalized === 'f') return 'F';
  if (normalized === 'hombre' || normalized === 'm') return 'M';
  if (normalized === 'otro' || normalized === 'o') return 'O';
  return value;
}

function decodeSexoFromApi(value: string | null | undefined) {
  // 🚻 Devuelve el sexo en el formato legible que usa la UI.
  const normalized = normalizeOptionValue(value);
  if (normalized === 'f' || normalized === 'mujer') return 'Mujer';
  if (normalized === 'm' || normalized === 'hombre') return 'Hombre';
  if (normalized === 'o' || normalized === 'otro') return 'Otro';
  return String(value ?? '');
}

function toNumber(value: string) {
  // 🔢 Pequeño guardrail para no propagar `NaN` a los payloads remotos.
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatDateForApi(value: string) {
  // 📅 Normaliza fechas antes de enviarlas a API. Acepta formatos flexibles de captura.
  const raw = String(value ?? '').trim();
  if (!raw) return '';

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }

  const slashMatch = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (slashMatch) {
    const [, day, month, year] = slashMatch;
    return `${year}-${month}-${day}`;
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return raw;
  }

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function buildPersonPayload(person: PersonFormData): StorePersonaPayload {
  // 🧍 Toma el modelo del formulario y lo transforma al contrato oficial de backend.
  return {
    Latitud: person.geo.latitude,
    Longitud: person.geo.longitude,
    ClaveElector: person.claveElector.trim(),
    CURP: person.curp.trim(),
    PrimerApellido: person.apellidoPaterno.trim(),
    SegundoApellido: person.apellidoMaterno.trim(),
    Nombre: person.nombres.trim(),
    IdSeccion: toNumber(person.seccion),
    Sexo: encodeSexoToApi(person.sexo),
    FechaNacimiento: formatDateForApi(person.fechaNacimiento),
    Domicilio: person.calle.trim(),
    Colonia: person.colonia.trim(),
    Numero: person.numero.trim(),
    Estado: person.estado.trim(),
    CodigoPostal: person.codigoPostal.trim(),
    Telefono: person.telefono.trim(),
    Vigencia: toNumber(person.vigencia),
    TipoCredencial: person.tipoCredencial.trim(),
  };
}

export function buildPersonFingerprint(person: PersonFormData) {
  // 🧬 Huella útil para detectar si los datos básicos cambiaron realmente.
  return JSON.stringify(buildPersonPayload(person));
}

export function mapApiCuestionarioToSurveyRecord(
  cuestionario: ApiCuestionario,
  resolveMunicipality?: (sectionId: string) => string
): SurveyRecord {
  // 🪄 Adaptador principal backend -> frontend.
  // Gracias a este mapeo, las pantallas no dependen del shape remoto crudo.
  const sectionId = String(cuestionario.IdSeccion ?? '').trim();
  const municipality = resolveMunicipality?.(sectionId) ?? '';
  const createdAt = cuestionario.created_at ?? new Date().toISOString();
  const updatedAt = cuestionario.updated_at ?? createdAt;
  const currentUser = authStore.getUser();
  const interviewerName =
    currentUser && currentUser.id === cuestionario.IdUser
      ? currentUser.nombre
      : '';

  return {
    id: String(cuestionario.IdCuestionario),
    questionnaireId: cuestionario.IdCuestionario,
    createdAt,
    updatedAt,
    startedAt: createdAt,
    finishedAt: updatedAt,
    interviewerName,
    sectionPriorityLabel: municipality
      ? `Seccion ${sectionId} · ${municipality}`
      : `Seccion ${sectionId}`,
    apiStatusId: cuestionario.IdEstatus ?? RESULT_TO_STATUS.Completa,
    person: {
      folio: cuestionario.Folio ?? '',
      nombres: String(cuestionario.Nombre ?? ''),
      apellidoPaterno: String(cuestionario.PrimerApellido ?? ''),
      apellidoMaterno: String(cuestionario.SegundoApellido ?? ''),
      telefono: String(cuestionario.Telefono ?? ''),
      sexo: decodeSexoFromApi(cuestionario.Sexo),
      fechaNacimiento: String(cuestionario.FechaNacimiento ?? ''),
      curp: String(cuestionario.CURP ?? ''),
      claveElector: String(cuestionario.ClaveElector ?? ''),
      calle: String(cuestionario.Domicilio ?? ''),
      numero: String(cuestionario.Numero ?? ''),
      colonia: String(cuestionario.Colonia ?? ''),
      codigoPostal: String(cuestionario.CodigoPostal ?? ''),
      municipio: municipality,
      estado: String(cuestionario.Estado ?? ''),
      seccion: sectionId,
      vigencia: String(cuestionario.Vigencia ?? ''),
      tipoCredencial: String(cuestionario.TipoCredencial ?? ''),
      fuenteCaptura: 'manual',
      geo: {
        latitude: Number(cuestionario.Latitud ?? 0),
        longitude: Number(cuestionario.Longitud ?? 0),
        capturedAt: createdAt,
      },
    },
    answers: {
      hasValidCredential: decodeOption(YES_NO_OPTIONS, cuestionario.Pregunta1) as SurveyAnswers['hasValidCredential'],
      sexoObservado: decodeOption(OBSERVED_SEX_OPTIONS, cuestionario.Pregunta2) as SurveyAnswers['sexoObservado'],
      rangoEdad: decodeOption(AGE_RANGE_OPTIONS, cuestionario.Pregunta3)
        .replace('60 o mas', '60 o más') as SurveyAnswers['rangoEdad'],
      escolaridad: decodeOption(EDUCATION_OPTIONS, cuestionario.Pregunta4) as SurveyAnswers['escolaridad'],
      conoceGino: decodeOption(YES_NO_OPTIONS, cuestionario.Pregunta5) as SurveyAnswers['conoceGino'],
      conoceLatifa: decodeOption(YES_NO_OPTIONS, cuestionario.Pregunta6) as SurveyAnswers['conoceLatifa'],
      conocePalazuelos: decodeOption(YES_NO_OPTIONS, cuestionario.Pregunta7) as SurveyAnswers['conocePalazuelos'],
      importanciaPoliticos: decodeOption(IMPORTANCE_OPTIONS, cuestionario.Pregunta8) as SurveyAnswers['importanciaPoliticos'],
      ginoDebeSeguir: decodeOption(GINO_PROXIMITY_OPTIONS, cuestionario.Pregunta9) as SurveyAnswers['ginoDebeSeguir'],
      opinionGino: decodeOption(GINO_OPINION_OPTIONS, cuestionario.Pregunta10)
        .replace('No conoce / No contesto', 'No conoce / No contestó') as SurveyAnswers['opinionGino'],
      atributoGino: decodeOption(GINO_ATTRIBUTE_OPTIONS, cuestionario.Pregunta11)
        .replace('Juventud / Renovacion', 'Juventud / Renovación')
        .replace('Capacidad tecnica', 'Capacidad técnica')
        .replace('Cercania con la gente', 'Cercanía con la gente') as SurveyAnswers['atributoGino'],
      problemaNacional: decodeOption(NATIONAL_ISSUE_OPTIONS, cuestionario.Pregunta12)
        .replace('El alto costo de la vida (Inflacion)', 'El alto costo de la vida (Inflación)')
        .replace('Corrupcion', 'Corrupción')
        .replace('Falta de oportunidades para jovenes', 'Falta de oportunidades para jóvenes'),
      problemaNacionalOtro: '',
      problemaLocal: decodeOption(LOCAL_ISSUE_OPTIONS, cuestionario.Pregunta13)
        .replace('Alumbrado publico y bacheo', 'Alumbrado público y bacheo'),
      problemaLocalOtro: '',
      resultado: decodeResult(cuestionario.IdEstatus),
      observaciones: String(cuestionario.Observaciones ?? ''),
    },
  };
}

function buildPreguntasPayload(answers: SurveyAnswers): StorePreguntasPayload {
  // 🧠 Adaptador frontend -> backend para las respuestas del cuestionario.
  return {
    Pregunta1: encodeOption(YES_NO_OPTIONS, answers.hasValidCredential),
    Pregunta2: encodeOption(OBSERVED_SEX_OPTIONS, answers.sexoObservado),
    Pregunta3: encodeOption(AGE_RANGE_OPTIONS, answers.rangoEdad),
    Pregunta4: encodeOption(EDUCATION_OPTIONS, answers.escolaridad),
    Pregunta5: encodeOption(YES_NO_OPTIONS, answers.conoceGino),
    Pregunta6: encodeOption(YES_NO_OPTIONS, answers.conoceLatifa),
    Pregunta7: encodeOption(YES_NO_OPTIONS, answers.conocePalazuelos),
    Pregunta8: encodeOption(IMPORTANCE_OPTIONS, answers.importanciaPoliticos),
    Pregunta9: encodeOption(GINO_PROXIMITY_OPTIONS, answers.ginoDebeSeguir),
    Pregunta10: encodeOption(GINO_OPINION_OPTIONS, answers.opinionGino),
    Pregunta11: encodeOption(GINO_ATTRIBUTE_OPTIONS, answers.atributoGino),
    Pregunta12: encodeOption(NATIONAL_ISSUE_OPTIONS, answers.problemaNacional),
    Pregunta13: encodeOption(LOCAL_ISSUE_OPTIONS, answers.problemaLocal),
    Observaciones: answers.observaciones.trim(),
    IdEstatus: RESULT_TO_STATUS[answers.resultado],
  };
}

export async function createRespondentPerson(person: PersonFormData) {
  // ➕ Alta remota de persona.
  const { data } = await api.post<StorePersonaResponse>('/storePersona', buildPersonPayload(person));
  return data;
}

export async function updateRespondentPerson(questionnaireId: string | number, person: PersonFormData) {
  // ✏️ Edición remota de datos básicos sin tocar respuestas.
  const { data } = await api.put<EditCuestionarioResponse>(
    `/editCuestionario/${questionnaireId}`,
    buildPersonPayload(person)
  );
  return data;
}

export async function saveSurveyAnswers(questionnaireId: string | number, answers: SurveyAnswers) {
  // 💾 Persistencia remota del bloque de preguntas.
  const { data } = await api.post<ApiResponseEnvelope<unknown>>(
    `/storePreguntas/${questionnaireId}`,
    buildPreguntasPayload(answers)
  );
  return data;
}

export async function getRespondents(resolveMunicipality?: (sectionId: string) => string) {
  // 📚 Descarga el listado remoto y ya lo devuelve adaptado para la app.
  const { data } = await api.get<ApiResponseEnvelope<ApiCuestionario[]>>('/getCuestionarios');
  return data.data.map((item) => mapApiCuestionarioToSurveyRecord(item, resolveMunicipality));
}

export async function findRespondentDuplicateByClaveElector(claveElector: string) {
  // ⚠️ Como backend aún no valida duplicados por clave de elector,
  // el frontend consulta y compara antes del alta.
  const normalizedClave = normalizeOptionValue(claveElector).toUpperCase();
  if (!normalizedClave) return null;

  const { data } = await api.get<ApiResponseEnvelope<ApiCuestionario[]>>('/getCuestionarios');
  const match = data.data.find(
    (item) => normalizeOptionValue(item.ClaveElector).toUpperCase() === normalizedClave
  );

  if (!match) return null;

  return {
    questionnaireId: match.IdCuestionario,
    folio: String(match.Folio ?? ''),
    claveElector: String(match.ClaveElector ?? ''),
    fullName: [
      String(match.Nombre ?? ''),
      String(match.PrimerApellido ?? ''),
      String(match.SegundoApellido ?? ''),
    ]
      .filter(Boolean)
      .join(' ')
      .trim(),
    createdAt: String(match.created_at ?? ''),
  } satisfies DuplicateRespondentMatch;
}

export async function getRespondentById(
  questionnaireId: string | number,
  resolveMunicipality?: (sectionId: string) => string
) {
  // 👁️ Carga puntual de un cuestionario para preview o edición.
  const { data } = await api.get<ApiResponseEnvelope<ApiCuestionario>>(`/getCuestionario/${questionnaireId}`);
  return mapApiCuestionarioToSurveyRecord(data.data, resolveMunicipality);
}
