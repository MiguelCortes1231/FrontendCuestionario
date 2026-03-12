/**
 * 🔐 Pantalla de inicio de sesión
 *
 * Recibe credenciales, llama al servicio de autenticación y, en caso exitoso,
 * abre la experiencia principal del sistema.
 */
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
  Divider,
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import { login } from '../../services/auth.service';
import { authStore } from '../../store/auth.store';
import { toast } from 'react-toastify';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const expiredReason = useMemo(
    () => new URLSearchParams(location.search).get('reason') === 'expired',
    [location.search]
  );

  useEffect(() => {
    if (!expiredReason) return;

    authStore.clear();
    setError('Tu sesión expiró. Ingresa nuevamente para continuar.');
    toast.warning('La sesión expiró. Vuelve a iniciar sesión.');
  }, [expiredReason]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 🧼 Validación local mínima para evitar requests innecesarios.
    if (!username.trim() || !password.trim()) {
      setError('Debes capturar usuario y contraseña.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      // 🚀 Si el backend valida, el servicio persiste la sesión.
      await login(username.trim(), password);
      toast.success('Sesión iniciada correctamente ✅');
      navigate('/dashboard', { replace: true });
    } catch {
      setError('No fue posible iniciar sesión. Verifica credenciales o conectividad.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        // 🌄 Fondo contextual de acceso
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        p: 2,
        background:
          'radial-gradient(circle at top, rgba(108,56,65,0.08), transparent 35%), linear-gradient(135deg, #faf7f7 0%, #f3ebec 100%)',
      }}
    >
      <Card
        sx={{
          width: '100%',
          maxWidth: 480,
          borderRadius: 5,
          boxShadow: '0 24px 60px rgba(108,56,65,0.14)',
          border: '1px solid rgba(108,56,65,0.10)',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            px: 4,
            py: 3,
            color: 'white',
            background: 'linear-gradient(135deg, #6C3841 0%, #824651 100%)',
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <HowToVoteIcon sx={{ fontSize: 34 }} />
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 900, lineHeight: 1.1 }}>
                Contigo QROO
              </Typography>
              <Typography sx={{ opacity: 0.92 }}>
                Plataforma de encuestas ciudadanas 🗳️
              </Typography>
            </Box>
          </Stack>
        </Box>

        <CardContent sx={{ p: 4 }}>
          <Stack component="form" spacing={2.4} onSubmit={handleSubmit}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#6C3841' }}>
                Iniciar sesión 🔐
              </Typography>
              <Typography color="text.secondary">
                Acceso para encuestadores y personal autorizado.
              </Typography>
            </Box>

            <Divider />

            {error && <Alert severity={expiredReason ? 'warning' : 'error'}>{error}</Alert>}

            {/* 👤 Campo de usuario */}
            <TextField
              label="Usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              fullWidth
            />

            {/* 🔒 Campo de contraseña */}
            <TextField
              label="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              fullWidth
            />

            {/* ✅ Acción principal de autenticación */}
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={submitting}
              startIcon={<LockOutlinedIcon />}
              sx={{
                py: 1.4,
                fontWeight: 800,
                borderRadius: 999,
              }}
            >
              {submitting ? 'Entrando...' : 'Entrar'}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
