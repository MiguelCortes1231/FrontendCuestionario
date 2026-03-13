/**
 * 📚 Listado de encuestados
 *
 * Esta pantalla evolucionó de una tabla pasiva a una vista operativa de consulta:
 * - 🔎 búsqueda flexible por aproximidad
 * - 🧰 filtros por municipio, sección y resultado
 * - ↕️ ordenamiento ascendente o descendente
 * - 📄 paginación estable para revisar registros sin saturar la vista
 */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  InputAdornment,
  MenuItem,
  Pagination,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import PlaceIcon from '@mui/icons-material/Place';
import SearchIcon from '@mui/icons-material/Search';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import ClearIcon from '@mui/icons-material/Clear';
import SortIcon from '@mui/icons-material/Sort';
import type { SurveyRecord } from '../../types/survey';
import { buildWhatsAppUrl, formatPhone } from '../../utils/contact';
import { buildGoogleMapsPlaceUrl } from '../../utils/maps';
import { buildSectionMunicipalityMap, getSecciones } from '../../services/sections.service';
import { getRespondents } from '../../services/respondents.service';

const PAGE_SIZE = 15;

type SortField = 'createdAt' | 'folio' | 'nombre' | 'seccion' | 'municipio';
type SortDirection = 'asc' | 'desc';

function matchesSelectedDate(value: string, selectedDate: string) {
  if (!selectedDate) return true;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return false;

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}` === selectedDate;
}

function normalizeText(value: unknown) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function buildFullName(item: SurveyRecord) {
  return [
    item.person.nombres,
    item.person.apellidoPaterno,
    item.person.apellidoMaterno,
  ]
    .filter(Boolean)
    .join(' ')
    .trim();
}

function fuzzyIncludes(text: string, query: string) {
  // 🧠 Coincidencia flexible por subsecuencia para tolerar pequeños errores o tecleo incompleto.
  let textIndex = 0;
  let queryIndex = 0;

  while (textIndex < text.length && queryIndex < query.length) {
    if (text[textIndex] === query[queryIndex]) {
      queryIndex += 1;
    }
    textIndex += 1;
  }

  return queryIndex === query.length;
}

function matchesApproximateSearch(item: SurveyRecord, rawQuery: string) {
  const query = normalizeText(rawQuery);
  if (!query) return true;

  const fullName = buildFullName(item);
  const searchableFields = [
    item.person.folio,
    fullName,
    item.person.telefono,
    item.person.seccion,
    item.person.municipio,
    item.person.colonia,
    item.interviewerName,
    item.sectionPriorityLabel,
    item.answers.resultado,
  ].map(normalizeText);

  const searchableWords = searchableFields
    .flatMap((field) => field.split(/\s+/))
    .filter(Boolean);

  const tokens = query.split(/\s+/).filter(Boolean);

  return tokens.every((token) =>
    searchableFields.some((field) => field.includes(token)) ||
    searchableWords.some((word) => fuzzyIncludes(word, token))
  );
}

function compareValues(a: string | number, b: string | number, direction: SortDirection) {
  const factor = direction === 'asc' ? 1 : -1;

  if (typeof a === 'number' && typeof b === 'number') {
    return (a - b) * factor;
  }

  return String(a).localeCompare(String(b), 'es', { numeric: true, sensitivity: 'base' }) * factor;
}

export default function RespondentsListPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const useCardLayout = useMediaQuery(theme.breakpoints.down('lg'));

  const [page, setPage] = useState(1);

  // 🔎 Estado del panel de búsqueda y filtros.
  const [search, setSearch] = useState('');
  const [municipioFilter, setMunicipioFilter] = useState('');
  const [seccionFilter, setSeccionFilter] = useState('');
  const [resultadoFilter, setResultadoFilter] = useState('');
  const [fechaFilter, setFechaFilter] = useState('');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [items, setItems] = useState<SurveyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setLoadError(false);
        const sections = await getSecciones();
        const sectionMap = buildSectionMunicipalityMap(sections);
        const data = await getRespondents((sectionId) => sectionMap.get(sectionId) ?? '');
        if (!alive) return;
        setItems(data);
      } catch {
        if (!alive) return;
        setLoadError(true);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  // 🧾 Catálogos derivados para filtros dinámicos.
  const municipios = useMemo(
    () =>
      Array.from(new Set(items.map((item) => item.person.municipio).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b, 'es', { sensitivity: 'base' })
      ),
    [items]
  );

  const secciones = useMemo(
    () =>
      Array.from(new Set(items.map((item) => item.person.seccion).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b, 'es', { numeric: true, sensitivity: 'base' })
      ),
    [items]
  );

  const resultados = useMemo(
    () =>
      Array.from(new Set(items.map((item) => item.answers.resultado).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b, 'es', { sensitivity: 'base' })
      ),
    [items]
  );

  const filteredItems = useMemo(() => {
    // 🧠 Pipeline de experiencia de usuario:
    // 1. búsqueda flexible
    // 2. filtros exactos
    // 3. ordenamiento estable
    const result = items
      .filter((item) => matchesApproximateSearch(item, search))
      .filter((item) => matchesSelectedDate(item.createdAt, fechaFilter))
      .filter((item) => !municipioFilter || item.person.municipio === municipioFilter)
      .filter((item) => !seccionFilter || String(item.person.seccion) === seccionFilter)
      .filter((item) => !resultadoFilter || item.answers.resultado === resultadoFilter);

    return [...result].sort((left, right) => {
      switch (sortField) {
        case 'folio':
          return compareValues(left.person.folio, right.person.folio, sortDirection);
        case 'nombre':
          return compareValues(buildFullName(left), buildFullName(right), sortDirection);
        case 'seccion':
          return compareValues(left.person.seccion, right.person.seccion, sortDirection);
        case 'municipio':
          return compareValues(left.person.municipio, right.person.municipio, sortDirection);
        case 'createdAt':
        default:
          return compareValues(
            new Date(left.createdAt).getTime(),
            new Date(right.createdAt).getTime(),
            sortDirection
          );
      }
    });
  }, [fechaFilter, items, municipioFilter, resultadoFilter, search, seccionFilter, sortDirection, sortField]);

  const paged = useMemo(
    () => filteredItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredItems, page]
  );

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const activeFiltersCount = [search, municipioFilter, seccionFilter, resultadoFilter, fechaFilter].filter(Boolean).length;

  useEffect(() => {
    // 🔄 Cuando cambian búsqueda, filtros u orden, regresamos a la página 1.
    setPage(1);
  }, [search, municipioFilter, seccionFilter, resultadoFilter, fechaFilter, sortField, sortDirection]);

  const clearFilters = () => {
    // 🧹 Reseteo rápido para volver al dataset completo.
    setSearch('');
    setMunicipioFilter('');
    setSeccionFilter('');
    setResultadoFilter('');
    setFechaFilter('');
    setSortField('createdAt');
    setSortDirection('desc');
  };

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4">Listado de encuestados 📋</Typography>
        <Typography color="text.secondary">
          Búsqueda inteligente, filtros útiles y ordenamiento para revisar levantamientos con más rapidez ✨
        </Typography>
      </Box>

      {loadError && (
        <Alert severity="error">
          No se pudo cargar el listado desde la API.
        </Alert>
      )}

      <Card
        sx={{
          borderRadius: 5,
          border: '1px solid rgba(108,56,65,0.08)',
          boxShadow: '0 18px 48px rgba(108,56,65,0.08)',
        }}
      >
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Stack spacing={2.5}>
            {/* 🎛️ Cabecera del panel de filtros */}
            <Stack
              direction={{ xs: 'column', lg: 'row' }}
              spacing={1.5}
              justifyContent="space-between"
              alignItems={{ xs: 'stretch', lg: 'center' }}
            >
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <FilterAltIcon sx={{ color: '#6C3841' }} />
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  Buscar, filtrar y ordenar 🔎
                </Typography>
                <Chip
                  label={loading ? 'Cargando...' : `${filteredItems.length} resultado${filteredItems.length === 1 ? '' : 's'}`}
                  color="primary"
                  variant="outlined"
                />
                {activeFiltersCount > 0 && (
                  <Chip
                    label={`${activeFiltersCount} filtro${activeFiltersCount === 1 ? '' : 's'} activo${activeFiltersCount === 1 ? '' : 's'}`}
                    color="secondary"
                    variant="outlined"
                  />
                )}
              </Stack>

              <Button
                variant="outlined"
                color="inherit"
                startIcon={<ClearIcon />}
                onClick={clearFilters}
                disabled={!activeFiltersCount && sortField === 'createdAt' && sortDirection === 'desc'}
                sx={{ borderRadius: 999, alignSelf: { xs: 'flex-start', lg: 'auto' } }}
              >
                Limpiar filtros
              </Button>
            </Stack>

            {/* 🧰 Fila 1: búsqueda principal y acceso rápido */}
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField
                label="Buscar por folio, nombre, teléfono, municipio, sección o entrevistador 🔎"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Ej. blanca, 9831234567, cozumel, 300, fol-177..."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ flex: 2 }}
              />

              <TextField
                label="Fecha 📅"
                type="date"
                value={fechaFilter}
                onChange={(e) => setFechaFilter(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ flex: 1, minWidth: { md: 220 } }}
              />

              <TextField
                select
                label="Resultado ✅"
                value={resultadoFilter}
                onChange={(e) => setResultadoFilter(e.target.value)}
                sx={{ flex: 1, minWidth: { md: 220 } }}
              >
                <MenuItem value="">Todos</MenuItem>
                {resultados.map((resultado) => (
                  <MenuItem key={resultado} value={resultado}>
                    {resultado}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>

            {/* 🧩 Fila 2: filtros específicos y ordenamiento en grid limpio */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  md: 'repeat(2, minmax(0, 1fr))',
                  xl: 'repeat(4, minmax(0, 1fr))',
                },
                gap: 2,
              }}
            >
              <TextField
                select
                label="Municipio 🏙️"
                value={municipioFilter}
                onChange={(e) => setMunicipioFilter(e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                {municipios.map((municipio) => (
                  <MenuItem key={municipio} value={municipio}>
                    {municipio}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Sección 🗂️"
                value={seccionFilter}
                onChange={(e) => setSeccionFilter(e.target.value)}
              >
                <MenuItem value="">Todas</MenuItem>
                {secciones.map((seccion) => (
                  <MenuItem key={seccion} value={seccion}>
                    {seccion}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Ordenar por ↕️"
                value={sortField}
                onChange={(e) => setSortField(e.target.value as SortField)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SortIcon />
                    </InputAdornment>
                  ),
                }}
              >
                <MenuItem value="createdAt">Fecha</MenuItem>
                <MenuItem value="folio">Folio</MenuItem>
                <MenuItem value="nombre">Nombre</MenuItem>
                <MenuItem value="seccion">Sección</MenuItem>
                <MenuItem value="municipio">Municipio</MenuItem>
              </TextField>

              <TextField
                select
                label="Dirección 🔃"
                value={sortDirection}
                onChange={(e) => setSortDirection(e.target.value as SortDirection)}
              >
                <MenuItem value="desc">Descendente</MenuItem>
                <MenuItem value="asc">Ascendente</MenuItem>
              </TextField>
            </Box>

            <Divider />

            {/* 🧾 Tabla en escritorio / tarjetas en tablet y móvil */}
            {useCardLayout ? (
              <Stack spacing={2}>
                {paged.map((item) => {
                  const whatsappUrl = buildWhatsAppUrl(item.person.telefono);
                  const mapsUrl = buildGoogleMapsPlaceUrl(
                    item.person.geo?.latitude,
                    item.person.geo?.longitude
                  );

                  return (
                    <Card
                      key={item.id}
                      variant="outlined"
                      sx={{
                        borderRadius: 4,
                        borderColor: 'rgba(108,56,65,0.12)',
                        boxShadow: 'none',
                      }}
                    >
                      <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
                        <Stack spacing={1.6}>
                          <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            justifyContent="space-between"
                            spacing={1}
                            alignItems={{ xs: 'flex-start', sm: 'flex-start' }}
                          >
                            <Box>
                              <Typography variant="caption" color="text.secondary">
                                {item.person.folio}
                              </Typography>
                              <Typography variant="h6" sx={{ fontWeight: 900 }}>
                                {buildFullName(item) || '-'}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Encuestador: {item.interviewerName || '-'}
                              </Typography>
                            </Box>

                            <Chip
                              label={item.answers.resultado || '-'}
                              size="small"
                              color={item.answers.resultado === 'Completa' ? 'success' : 'warning'}
                              variant="outlined"
                            />
                          </Stack>

                          <Box
                            sx={{
                              display: 'grid',
                              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
                              gap: 1.4,
                            }}
                          >
                            {[
                              { label: 'Teléfono', value: formatPhone(item.person.telefono) },
                              { label: 'Sección', value: item.person.seccion || '-' },
                              { label: 'Municipio', value: item.person.municipio || '-' },
                              { label: 'Fecha', value: new Date(item.createdAt).toLocaleString() },
                            ].map((field) => (
                              <Box
                                key={field.label}
                                sx={{
                                  p: 1.4,
                                  borderRadius: 3,
                                  bgcolor: 'rgba(108,56,65,0.035)',
                                  border: '1px solid rgba(108,56,65,0.08)',
                                }}
                              >
                                <Typography variant="caption" color="text.secondary">
                                  {field.label}
                                </Typography>
                                <Typography sx={{ fontWeight: 700 }}>
                                  {field.value}
                                </Typography>
                              </Box>
                            ))}
                          </Box>

                          <Stack direction="row" spacing={0.5} justifyContent="flex-end" flexWrap="wrap" useFlexGap>
                            <Tooltip title="Ver detalle">
                              <IconButton color="primary" onClick={() => navigate(`/respondents/${item.id}`)}>
                                <VisibilityIcon />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Editar datos básicos">
                              <IconButton color="primary" onClick={() => navigate(`/respondents/${item.id}/edit`)}>
                                <EditIcon />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title={whatsappUrl ? 'Abrir WhatsApp' : 'Sin teléfono'}>
                              <span>
                                <IconButton
                                  color="success"
                                  component="a"
                                  href={whatsappUrl ?? undefined}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  disabled={!whatsappUrl}
                                >
                                  <WhatsAppIcon />
                                </IconButton>
                              </span>
                            </Tooltip>

                            <Tooltip title={mapsUrl ? 'Abrir en Google Maps' : 'Sin coordenadas'}>
                              <span>
                                <IconButton
                                  color="secondary"
                                  component="a"
                                  href={mapsUrl ?? undefined}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  disabled={!mapsUrl}
                                >
                                  <PlaceIcon />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </Stack>
                        </Stack>
                      </CardContent>
                    </Card>
                  );
                })}
              </Stack>
            ) : (
              <Box sx={{ width: '100%', overflow: 'hidden' }}>
                <Table
                  sx={{
                    width: '100%',
                    tableLayout: 'fixed',
                    '& .MuiTableCell-root': {
                      px: 1.5,
                      py: 2.2,
                      fontSize: '0.95rem',
                      verticalAlign: 'top',
                      whiteSpace: 'normal',
                      wordBreak: 'break-word',
                    },
                  }}
                >
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800, width: '13%' }}>Folio</TableCell>
                      <TableCell sx={{ fontWeight: 800, width: '19%' }}>Nombre</TableCell>
                      <TableCell sx={{ fontWeight: 800, width: '9%' }}>Teléfono</TableCell>
                      <TableCell sx={{ fontWeight: 800, width: '7%' }}>Sección</TableCell>
                      <TableCell sx={{ fontWeight: 800, width: '11%' }}>Municipio</TableCell>
                      <TableCell sx={{ fontWeight: 800, width: '10%' }}>Resultado</TableCell>
                      <TableCell sx={{ fontWeight: 800, width: '13%' }}>Fecha</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, width: '18%' }}>
                        Acciones
                      </TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {paged.map((item) => {
                      const whatsappUrl = buildWhatsAppUrl(item.person.telefono);
                      const mapsUrl = buildGoogleMapsPlaceUrl(
                        item.person.geo?.latitude,
                        item.person.geo?.longitude
                      );

                      return (
                        <TableRow
                          key={item.id}
                          hover
                          sx={{
                            '&:hover': {
                              bgcolor: 'rgba(108,56,65,0.03)',
                            },
                          }}
                        >
                          <TableCell sx={{ fontWeight: 700, fontSize: '0.92rem' }}>{item.person.folio}</TableCell>
                          <TableCell>
                            <Stack spacing={0.3}>
                              <Typography sx={{ fontWeight: 800, fontSize: '0.98rem', lineHeight: 1.35 }}>
                                {buildFullName(item) || '-'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.82rem' }}>
                                Encuestador: {item.interviewerName || '-'}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.92rem' }}>{formatPhone(item.person.telefono)}</TableCell>
                          <TableCell sx={{ fontSize: '0.92rem' }}>{item.person.seccion || '-'}</TableCell>
                          <TableCell sx={{ fontSize: '0.92rem' }}>{item.person.municipio || '-'}</TableCell>
                          <TableCell>
                            <Chip
                              label={item.answers.resultado || '-'}
                              size="small"
                              color={item.answers.resultado === 'Completa' ? 'success' : 'warning'}
                              variant="outlined"
                              sx={{ fontWeight: 800, maxWidth: '100%' }}
                            />
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.9rem', lineHeight: 1.45 }}>
                            {new Date(item.createdAt).toLocaleString()}
                          </TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={0.25} justifyContent="flex-end" flexWrap="wrap" useFlexGap>
                              <Tooltip title="Ver detalle">
                                <IconButton
                                  color="primary"
                                  size="small"
                                  onClick={() => navigate(`/respondents/${item.id}`)}
                                >
                                  <VisibilityIcon />
                                </IconButton>
                              </Tooltip>

                              <Tooltip title="Editar datos básicos">
                                <IconButton
                                  color="primary"
                                  size="small"
                                  onClick={() => navigate(`/respondents/${item.id}/edit`)}
                                >
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>

                              <Tooltip title={whatsappUrl ? 'Abrir WhatsApp' : 'Sin teléfono'}>
                                <span>
                                  <IconButton
                                    color="success"
                                    size="small"
                                    component="a"
                                    href={whatsappUrl ?? undefined}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    disabled={!whatsappUrl}
                                  >
                                    <WhatsAppIcon />
                                  </IconButton>
                                </span>
                              </Tooltip>

                              <Tooltip title={mapsUrl ? 'Abrir en Google Maps' : 'Sin coordenadas'}>
                                <span>
                                  <IconButton
                                    color="secondary"
                                    size="small"
                                    component="a"
                                    href={mapsUrl ?? undefined}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    disabled={!mapsUrl}
                                  >
                                    <PlaceIcon />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Box>
            )}

            {/* 🫥 Estado vacío inteligente */}
            {!paged.length && (
              <Box
                sx={{
                  py: 4,
                  px: 2,
                  borderRadius: 4,
                  textAlign: 'center',
                  bgcolor: 'rgba(108,56,65,0.03)',
                  border: '1px dashed rgba(108,56,65,0.20)',
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>
                  No hay coincidencias 😶‍🌫️
                </Typography>
                <Typography color="text.secondary">
                  Ajusta la búsqueda, cambia filtros o limpia el panel para volver a ver todos los registros.
                </Typography>
              </Box>
            )}

            {/* 🔢 Paginación para mantener lectura limpia */}
            {filteredItems.length > 0 && (
              <Stack mt={1} alignItems="center">
                <Pagination
                  page={page}
                  count={totalPages}
                  onChange={(_, value) => setPage(value)}
                  color="primary"
                />
              </Stack>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
