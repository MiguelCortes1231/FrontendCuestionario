/**
 * ⚡ Configuración de Vite
 * ---------------------------------------------------
 * La app usa una configuración mínima a propósito:
 * - 🚀 arranque rápido
 * - 🧩 menos complejidad para mover el proyecto
 * - ✅ React cubierto con el plugin oficial
 */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ⚙️ Pipeline base de frontend con soporte React.
export default defineConfig({
  plugins: [react()],
})
