import { Card, CardContent, Grid, Stack, Typography } from '@mui/material';
import { respondentsStore } from '../../store/respondents.store';
import { authStore } from '../../store/auth.store';

export default function DashboardPage() {
  const user = authStore.getUser();
  const total = respondentsStore.list().length;
  return (
    <Stack spacing={3}>
      <div>
        <Typography variant="h4">Panel principal 👋</Typography>
        <Typography color="text.secondary">Bienvenido, {user?.nombre}. Desde aquí puedes iniciar encuestas y revisar levantamientos.</Typography>
      </div>
      <Grid container spacing={2}>
        {[{ title: 'Encuestas guardadas', value: total }, { title: 'Paginado listo', value: '15 por página' }, { title: 'Modo captura', value: 'Manual + OCR' }].map((card) => (
          <Grid item xs={12} md={4} key={card.title}>
            <Card><CardContent><Typography color="text.secondary">{card.title}</Typography><Typography variant="h4">{card.value}</Typography></CardContent></Card>
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
}
