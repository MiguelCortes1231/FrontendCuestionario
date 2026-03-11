/**
 * 🎛️ Configuración del tema MUI
 *
 * Aquí se traduce la identidad visual del proyecto a un tema consumible por toda
 * la interfaz. Esto permite que botones, tarjetas, tipografía y colores tengan
 * un comportamiento consistente en todas las pantallas 🧠✨
 */
import { createTheme } from '@mui/material/styles';
import { tokens } from './tokens';

export const theme = createTheme({
  palette: {
    // 🌞 La aplicación trabaja en modo claro con tonos institucionales
    mode: 'light',
    primary: tokens.primary,
    secondary: tokens.secondary,
    background: {
      default: tokens.background.default,
      paper: tokens.background.paper,
    },
    success: { main: tokens.success },
    warning: { main: tokens.warning },
    error: { main: tokens.error },
    info: { main: tokens.info },
    text: {
      primary: tokens.grey[800],
      secondary: tokens.grey[600],
    },
  },
  typography: {
    // 🔤 Tipografía con pesos fuertes para una UI más clara en operación
    fontFamily: 'Inter, Roboto, Helvetica, Arial, sans-serif',
    h4: { fontWeight: 900 },
    h5: { fontWeight: 800 },
    h6: { fontWeight: 800 },
    button: { textTransform: 'none', fontWeight: 700 },
  },
  shape: { borderRadius: 16 },
  components: {
    // 🧱 Ajustes visuales por componente para evitar repetir estilos
    MuiCard: {
      styleOverrides: { root: { boxShadow: tokens.shadowSoft, borderRadius: 24 } },
    },
    MuiButton: {
      styleOverrides: { root: { borderRadius: 14, paddingInline: 18 } },
    },
    MuiTextField: {
      defaultProps: { fullWidth: true, size: 'small' },
    },
    MuiChip: {
      styleOverrides: { root: { fontWeight: 700 } },
    },
  },
});
