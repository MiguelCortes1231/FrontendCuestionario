import axios from 'axios';

export type OcrRawResponse = {
  anio_registro?: string;
  calle?: string;
  clave_elector?: string;
  codigo_postal?: string;
  colonia?: string;
  curp?: string;
  es_ine?: boolean;
  estado?: string;
  fecha_nacimiento?: string;
  nombre?: string;
  numero?: string;
  pais?: string;
  seccion?: string;
  sexo?: string;
  tipo_credencial?: string;
  vigencia?: string;
};

export type SplitNameResponse = OcrRawResponse & {
  apellido_materno?: string;
  apellido_paterno?: string;
  nombres?: string;
};

function normalizeSpaces(value?: string) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanColonia(value?: string) {
  return normalizeSpaces(value).replace(/\s+\d{5}$/, '').trim();
}

function normalizeSexo(value?: string) {
  const v = normalizeSpaces(value).toUpperCase();
  if (v === 'H' || v === 'HOMBRE') return 'Hombre';
  if (v === 'M' || v === 'MUJER') return 'Mujer';
  return 'Otro';
}

function splitFullNameFallback(fullName?: string) {
  const clean = normalizeSpaces(fullName);
  if (!clean) {
    return {
      nombres: '',
      apellido_paterno: '',
      apellido_materno: '',
    };
  }

  const parts = clean.split(' ').filter(Boolean);

  if (parts.length === 1) {
    return {
      nombres: parts[0],
      apellido_paterno: '',
      apellido_materno: '',
    };
  }

  if (parts.length === 2) {
    return {
      apellido_paterno: parts[0],
      apellido_materno: '',
      nombres: parts[1],
    };
  }

  if (parts.length === 3) {
    return {
      apellido_paterno: parts[0],
      apellido_materno: parts[1],
      nombres: parts[2],
    };
  }

  return {
    apellido_paterno: parts[0] ?? '',
    apellido_materno: parts[1] ?? '',
    nombres: parts.slice(2).join(' '),
  };
}

function deriveBirthdateFromClaveElector(clave?: string) {
  const clean = normalizeSpaces(clave).toUpperCase();
  if (clean.length < 10) return '';

  const yy = clean.slice(6, 8);
  const mm = clean.slice(8, 10);
  const dd = clean.slice(10, 12);

  if (!yy || !mm || !dd) return '';

  const yearNum = Number(yy);
  const fullYear = yearNum <= 30 ? `20${yy}` : `19${yy}`;

  if (Number(mm) < 1 || Number(mm) > 12 || Number(dd) < 1 || Number(dd) > 31) {
    return '';
  }

  return `${dd}/${mm}/${fullYear}`;
}

function deriveGenderFromClaveElector(clave?: string) {
  const clean = normalizeSpaces(clave).toUpperCase();
  const gender = clean.slice(13, 14);
  if (gender === 'H') return 'Hombre';
  if (gender === 'M') return 'Mujer';
  return 'Otro';
}

function deriveNamesFromCurp(curp?: string, fullName?: string) {
  const fallback = splitFullNameFallback(fullName);
  if (!curp) return fallback;
  return fallback;
}

export async function runOCR(file: File): Promise<OcrRawResponse> {
  const formData = new FormData();
  formData.append('imagen', file);

  const { data } = await axios.post<OcrRawResponse>(
    'https://brmstudio.com.mx/ocr/ocr',
    formData,
    {
      headers: {
        accept: 'application/json',
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return data;
}

export async function splitPersonName(payload: OcrRawResponse): Promise<SplitNameResponse> {
  const { data } = await axios.post<SplitNameResponse>(
    'https://brmstudio.com.mx/ocr/separar-nombre',
    payload,
    {
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json',
      },
    }
  );

  return data;
}

export async function scanIneAndSplit(file: File): Promise<{
  ocr: OcrRawResponse;
  split: SplitNameResponse | null;
  mapped: {
    nombres: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
    sexo: string;
    fechaNacimiento: string;
    curp: string;
    claveElector: string;
    calle: string;
    numero: string;
    colonia: string;
    codigoPostal: string;
    municipio: string;
    estado: string;
    seccion: string;
    vigencia: string;
    tipoCredencial: string;
  };
  warningMessage?: string;
}> {
  const ocr = await runOCR(file);

  let split: SplitNameResponse | null = null;
  let warningMessage = '';

  try {
    split = await splitPersonName(ocr);
  } catch {
    warningMessage =
      'No se pudo separar el nombre con el servicio externo. Se aplicó una separación local de respaldo ⚠️';
  }

  const localFallback = deriveNamesFromCurp(ocr.curp, ocr.nombre);
  const finalNames = split ?? {
    ...ocr,
    ...localFallback,
  };

  const municipioFromEstado = normalizeSpaces(ocr.estado).split(',')[0]?.trim() ?? '';

  const mapped = {
    nombres: normalizeSpaces(finalNames.nombres) || localFallback.nombres || '',
    apellidoPaterno:
      normalizeSpaces(finalNames.apellido_paterno) || localFallback.apellido_paterno || '',
    apellidoMaterno:
      normalizeSpaces(finalNames.apellido_materno) || localFallback.apellido_materno || '',
    sexo: normalizeSexo(ocr.sexo) || deriveGenderFromClaveElector(ocr.clave_elector),
    fechaNacimiento:
      normalizeSpaces(ocr.fecha_nacimiento) || deriveBirthdateFromClaveElector(ocr.clave_elector),
    curp: normalizeSpaces(ocr.curp).toUpperCase(),
    claveElector: normalizeSpaces(ocr.clave_elector).toUpperCase(),
    calle: normalizeSpaces(ocr.calle),
    numero: normalizeSpaces(ocr.numero),
    colonia: cleanColonia(ocr.colonia),
    codigoPostal: normalizeSpaces(ocr.codigo_postal),
    municipio: municipioFromEstado,
    estado: normalizeSpaces(ocr.estado),
    seccion: normalizeSpaces(ocr.seccion),
    vigencia: normalizeSpaces(ocr.vigencia),
    tipoCredencial: normalizeSpaces(ocr.tipo_credencial),
  };

  return {
    ocr,
    split,
    mapped,
    warningMessage,
  };
}