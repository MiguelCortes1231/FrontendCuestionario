/**
 * 💬 Utilidades de contacto
 * ---------------------------------------------------
 * Este módulo encapsula transformaciones pequeñas pero muy útiles
 * alrededor del teléfono del ciudadano.
 *
 * ¿Qué resuelve?
 * - limpiar dígitos
 * - formatear para mostrar bonito
 * - construir enlaces directos a WhatsApp
 */
function normalizePhoneDigits(phone?: string) {
  // 🧼 Elimina espacios, guiones y cualquier carácter no numérico.
  return String(phone ?? '').replace(/\D/g, '');
}

export function buildWhatsAppUrl(phone?: string): string | null {
  // 💬 Construye una URL directa para abrir chat en WhatsApp si el número es usable.
  const digits = normalizePhoneDigits(phone);
  if (!digits) return null;

  // 🇲🇽 Si capturan 10 dígitos, asumimos número nacional de México para abrir WhatsApp.
  const normalized = digits.length === 10 ? `52${digits}` : digits;
  return `https://wa.me/${normalized}`;
}

export function formatPhone(phone?: string) {
  // ☎️ Devuelve una versión más legible para tabla, vista previa y tarjetas.
  const digits = normalizePhoneDigits(phone);
  if (!digits) return '-';

  if (digits.length === 10) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }

  return phone?.trim() || digits;
}
