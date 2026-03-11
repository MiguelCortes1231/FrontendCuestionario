export interface GeoSnapshot {
  latitude: number;
  longitude: number;
  accuracy?: number;
  capturedAt: string;
}

export interface OCRPersonPayload {
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
  apellido_paterno?: string;
  apellido_materno?: string;
  nombres?: string;
}

export type PersonFormData = {
  folio: string;
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
  fuenteCaptura: 'manual' | 'ocr';
  geo: GeoSnapshot;
};