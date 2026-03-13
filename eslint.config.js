/**
 * 🧹 Configuración de ESLint
 * ---------------------------------------------------
 * Define el piso de calidad estática del proyecto.
 *
 * Mezcla reglas de:
 * - JavaScript
 * - TypeScript
 * - React Hooks
 * - React Refresh para Vite
 *
 * 🎯 Su objetivo es detectar errores comunes temprano y mantener consistencia.
 */
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // 🚫 La build generada no forma parte del código fuente a lintar.
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
])
