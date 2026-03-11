/**
 * 🌫️ Overlay global de carga
 *
 * Escucha el estado del `loadingService` y muestra una capa visual superior
 * mientras hay operaciones en curso, sobre todo llamadas HTTP.
 */
import { useEffect, useState } from 'react';
import { Backdrop, Box, Fade, Typography } from '@mui/material';
import { keyframes } from '@mui/system';
import { loadingService } from '../../services/loading.service';

const pulse = keyframes`
  0% { transform: scale(0.9); opacity: .5; }
  50% { transform: scale(1); opacity: 1; }
  100% { transform: scale(0.9); opacity: .5; }
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

export default function GlobalLoadingOverlay() {
  const [open, setOpen] = useState(false);

  // 📡 Suscripción única al servicio global de carga.
  useEffect(() => {
    const unsubscribe = loadingService.subscribe(setOpen);
    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <Backdrop open={open} sx={{ zIndex: (t) => t.zIndex.modal + 2000, bgcolor: 'rgba(20, 10, 12, 0.35)', backdropFilter: 'blur(5px)' }}>
      <Fade in={open}>
        <Box sx={{ minWidth: 260, px: 4, py: 3.5, borderRadius: 4, bgcolor: 'rgba(255,255,255,.95)', boxShadow: '0 30px 70px rgba(0,0,0,.22)', textAlign: 'center' }}>
          {/* 🌀 Núcleo animado del indicador */}
          <Box sx={{ position: 'relative', width: 88, height: 88, mx: 'auto', mb: 2 }}>
            <Box sx={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '5px solid rgba(108,56,65,0.15)', borderTopColor: '#6C3841', animation: `${spin} 1s linear infinite` }} />
            <Box sx={{ width: 28, height: 28, bgcolor: '#6C3841', borderRadius: '50%', position: 'absolute', inset: 0, m: 'auto', animation: `${pulse} 1.2s ease-in-out infinite` }} />
          </Box>
          <Typography sx={{ fontWeight: 900, color: 'primary.main' }}>Cargando información...</Typography>
          <Typography variant="body2" color="text.secondary">Espera un momento ⏳</Typography>
        </Box>
      </Fade>
    </Backdrop>
  );
}
