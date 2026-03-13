/**
 * 📍 Utilidad de geolocalización
 *
 * Envuelve la Geolocation API del navegador para entregar un objeto homogéneo
 * con coordenadas, precisión y marca temporal.
 */
import type { GeoSnapshot } from '../types/person';

export function getBrowserLocation(): Promise<GeoSnapshot> {
  // 🌍 Se expone como promesa para mantener un contrato limpio con las pantallas.
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      // 🚫 Algunos navegadores o contextos inseguros pueden no soportarla.
      reject(new Error('Geolocalización no soportada'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        // ✅ Se normaliza la respuesta nativa al tipo del dominio.
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          capturedAt: new Date().toISOString(),
        });
      },
      (error) => reject(error),
      // 🎯 Se busca alta precisión y datos frescos para el levantamiento.
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    );
  });
}
