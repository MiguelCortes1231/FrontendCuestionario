/**
 * 🧍 Dominio compartido del formulario de persona
 * ---------------------------------------------------
 * Este módulo concentra reglas reutilizables del alta/edición de persona.
 *
 * ¿Por qué existe?
 * - ♻️ evita duplicar validaciones entre alta y edición
 * - 🧠 deja explícitas las reglas obligatorias del negocio
 * - 🧩 hace que las pantallas se enfoquen en UI y no en reglas repetidas
 *
 * Cuando cambie qué campos son obligatorios, idealmente se ajusta aquí
 * y no en múltiples pantallas a la vez 🚀
 */
import type { PersonFormData } from '../../types/person';

export const PERSON_REQUIRED_FIELDS = [
  'nombres',
  'apellidoPaterno',
  'claveElector',
  'seccion',
  'calle',
  'telefono',
] as const;

export type PersonRequiredField = (typeof PERSON_REQUIRED_FIELDS)[number];

export type PersonErrorMap = Partial<Record<PersonRequiredField, string>>;

export function validateRequiredPersonFields(person: PersonFormData | null): PersonErrorMap {
  // ✅ Regla operativa actual del proyecto:
  // estos campos son estrictamente necesarios para poder avanzar o guardar.
  if (!person) {
    return {
      nombres: 'Es requerido',
      apellidoPaterno: 'Es requerido',
      claveElector: 'Es requerido',
      seccion: 'Es requerido',
      calle: 'Es requerido',
      telefono: 'Es requerido',
    };
  }

  return {
    nombres: person.nombres.trim() ? '' : 'Es requerido',
    apellidoPaterno: person.apellidoPaterno.trim() ? '' : 'Es requerido',
    claveElector: person.claveElector.trim() ? '' : 'Es requerido',
    seccion: person.seccion.trim() ? '' : 'Es requerido',
    calle: person.calle.trim() ? '' : 'Es requerido',
    telefono: person.telefono.trim() ? '' : 'Es requerido',
  };
}

export function hasMissingRequiredPersonFields(person: PersonFormData | null) {
  // 🚨 Helper booleano para simplificar botones, guards y validaciones rápidas.
  return Object.values(validateRequiredPersonFields(person)).some(Boolean);
}
