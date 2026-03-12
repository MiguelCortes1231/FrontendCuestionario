function normalizePhoneDigits(phone?: string) {
  return String(phone ?? '').replace(/\D/g, '');
}

export function buildWhatsAppUrl(phone?: string): string | null {
  const digits = normalizePhoneDigits(phone);
  if (!digits) return null;

  // 🇲🇽 Si capturan 10 dígitos, asumimos número nacional de México para abrir WhatsApp.
  const normalized = digits.length === 10 ? `52${digits}` : digits;
  return `https://wa.me/${normalized}`;
}

export function formatPhone(phone?: string) {
  const digits = normalizePhoneDigits(phone);
  if (!digits) return '-';

  if (digits.length === 10) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }

  return phone?.trim() || digits;
}
