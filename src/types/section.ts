/**
 * 🗂️ Tipos del dominio "secciones"
 * ---------------------------------------------------
 * El backend devuelve catálogos de secciones electorales con esta forma.
 *
 * Este tipo permite que el frontend:
 * - busque por sección
 * - relacione sección ↔ municipio
 * - use autocomplete y filtros sin perder tipado
 */
// 🗂️ Registro unitario del catálogo de secciones devuelto por backend.
export type SectionItem = {
  IdSeccion: number;
  IdMunicipio: number;
  IdDistritoLocal: number;
  IdDistritoFederal: number;
  Municipio: string;
};
