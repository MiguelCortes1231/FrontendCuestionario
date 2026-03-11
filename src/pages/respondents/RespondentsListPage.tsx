import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Card, CardContent, Pagination, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { respondentsStore } from '../../store/respondents.store';

const PAGE_SIZE = 15;

export default function RespondentsListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const items = respondentsStore.list();
  const paged = useMemo(() => items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [items, page]);
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4">Listado de encuestados 📋</Typography>
        <Typography color="text.secondary">Paginado de 15 registros por página con acceso a vista previa y PDF.</Typography>
      </Box>
      <Card>
        <CardContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Folio</TableCell>
                <TableCell>Nombre</TableCell>
                <TableCell>Sección</TableCell>
                <TableCell>Municipio</TableCell>
                <TableCell>Fecha</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paged.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>{item.person.folio}</TableCell>
                  <TableCell>{`${item.person.nombres} ${item.person.apellidoPaterno} ${item.person.apellidoMaterno}`}</TableCell>
                  <TableCell>{item.person.seccion}</TableCell>
                  <TableCell>{item.person.municipio}</TableCell>
                  <TableCell>{new Date(item.createdAt).toLocaleString()}</TableCell>
                  <TableCell align="right"><Button variant="outlined" startIcon={<VisibilityIcon />} onClick={() => navigate(`/respondents/${item.id}`)}>Ver</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {!paged.length && <Typography color="text.secondary">Aún no hay encuestas guardadas.</Typography>}
          <Stack mt={2} alignItems="center"><Pagination page={page} count={totalPages} onChange={(_, value) => setPage(value)} color="primary" /></Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
