function isValidCoord(value?: number) {
  return typeof value === 'number' && Number.isFinite(value);
}

/**
 * 📍 URL simple y confiable con marcador
 * ---------------------------------------------------
 * Ejemplo:
 * https://www.google.com/maps?q=18.5001,-88.2961
 */
export function buildGoogleMapsUrl(lat?: number, lng?: number): string | null {
  if (!isValidCoord(lat) || !isValidCoord(lng)) return null;
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

/**
 * 📍 URL estilo place + @lat,lng
 * ---------------------------------------------------
 * Genera una liga más parecida a la experiencia nativa de Google Maps.
 */
export function buildGoogleMapsPlaceUrl(lat?: number, lng?: number): string | null {
  if (!isValidCoord(lat) || !isValidCoord(lng)) return null;
  return `https://www.google.com/maps/place/${lat},${lng}/@${lat},${lng},17z`;
}
