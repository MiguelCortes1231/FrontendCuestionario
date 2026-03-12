/**
 * 🧍 Tipos del dominio "persona"
 * ---------------------------------------------------
 * Aquí vive el modelo más importante del alta del ciudadano.
 *
 * Este archivo define:
 * - 📍 snapshot de geolocalización
 * - 🪪 payload OCR crudo/intermedio
 * - 👤 formulario tipado de persona ya listo para encuesta
 *
 * Es una de las piezas que más conecta con el mundo real:
 * identidad, domicilio, sección y ubicación.
 */
// 📍 Snapshot de ubicación capturada desde el navegador.
export interface GeoSnapshot {
  latitude: number;
  longitude: number;
  accuracy?: number;
  capturedAt: string;
}

// 🪪 Estructura cruda/extendida para interoperar con servicios OCR.
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

// 🧍 Modelo principal de persona utilizado durante la captura de encuesta.
export type PersonFormData = {
  folio: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  telefono: string;
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
