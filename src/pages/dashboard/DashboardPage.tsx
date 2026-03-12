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
  Grid,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FmdGoodIcon from '@mui/icons-material/FmdGood';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import MapIcon from '@mui/icons-material/Map';
import PlaceIcon from '@mui/icons-material/Place';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import TimelineIcon from '@mui/icons-material/Timeline';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';
import { CircleMarker, MapContainer, TileLayer, useMap } from 'react-leaflet';
import type { SurveyRecord } from '../../types/survey';
import type { SectionItem } from '../../types/section';
import { respondentsStore } from '../../store/respondents.store';
import { authStore } from '../../store/auth.store';
import { getSecciones } from '../../services/sections.service';

type MunicipalityMeta = {
  name: string;
  capital: string;
  emoji: string;
};

type MunicipalityStat = MunicipalityMeta & {
  interviews: number;
  uniqueSections: number;
  officialSections: number;
  coverageRate: number;
};

type GeoPoint = {
  id: string;
  latitude: number;
  longitude: number;
  municipio: string;
  folio: string;
  accuracy?: number;
};

const OFFICIAL_MUNICIPALITIES: MunicipalityMeta[] = [
  { name: 'Othón P. Blanco', capital: 'Chetumal', emoji: '🏛️' },
  { name: 'Benito Juárez', capital: 'Cancún', emoji: '🌴' },
  { name: 'Solidaridad', capital: 'Playa del Carmen', emoji: '🏖️' },
  { name: 'Tulum', capital: 'Tulum', emoji: '🗿' },
  { name: 'Cozumel', capital: 'Cozumel', emoji: '🚢' },
  { name: 'Isla Mujeres', capital: 'Isla Mujeres', emoji: '⛵' },
  { name: 'Lázaro Cárdenas', capital: 'Kantunilkín', emoji: '🌿' },
  { name: 'Felipe Carrillo Puerto', capital: 'Felipe Carrillo Puerto', emoji: '🌺' },
  { name: 'José María Morelos', capital: 'José María Morelos', emoji: '🌽' },
  { name: 'Bacalar', capital: 'Bacalar', emoji: '💧' },
  { name: 'Puerto Morelos', capital: 'Puerto Morelos', emoji: '🐚' },
];

const MONTH_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const QUINTANA_ROO_CENTER: [number, number] = [19.1637, -88.7320];

function normalizeText(value: unknown) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\./g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function normalizeMunicipalityName(value: string) {
  const normalized = normalizeText(value);

  if (!normalized) return '';
  if (normalized.includes('othon')) return 'Othón P. Blanco';
  if (normalized.includes('benito juarez')) return 'Benito Juárez';
  if (normalized.includes('solidaridad')) return 'Solidaridad';
  if (normalized.includes('tulum')) return 'Tulum';
  if (normalized.includes('cozumel')) return 'Cozumel';
  if (normalized.includes('isla mujeres')) return 'Isla Mujeres';
  if (normalized.includes('lazaro cardenas')) return 'Lázaro Cárdenas';
  if (normalized.includes('felipe carrillo puerto')) return 'Felipe Carrillo Puerto';
  if (normalized.includes('jose maria morelos')) return 'José María Morelos';
  if (normalized.includes('bacalar')) return 'Bacalar';
  if (normalized.includes('puerto morelos')) return 'Puerto Morelos';

  return value.trim();
}

function safeDate(value?: string) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatCompactDate(value?: string) {
  const parsed = safeDate(value);
  return parsed
    ? parsed.toLocaleString('es-MX', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : '-';
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('es-MX').format(value);
}

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

function getSectionKey(rawSection: string) {
  const clean = String(rawSection ?? '').trim();
  if (!clean) return '';

  const numeric = Number(clean);
  return Number.isFinite(numeric) && numeric > 0 ? String(numeric) : clean;
}

function resolveMunicipality(record: SurveyRecord, sectionMap: Map<string, string>) {
  const direct = normalizeMunicipalityName(record.person.municipio);
  if (direct) return direct;

  const fallbackBySection = normalizeMunicipalityName(sectionMap.get(getSectionKey(record.person.seccion)) ?? '');
  return fallbackBySection || 'Sin municipio';
}

function getGeoPoint(record: SurveyRecord, municipio: string): GeoPoint | null {
  const latitude = record.person.geo?.latitude;
  const longitude = record.person.geo?.longitude;

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return {
    id: record.id,
    latitude,
    longitude,
    municipio,
    folio: record.person.folio,
    accuracy: record.person.geo?.accuracy,
  };
}

function MapAutoBounds({ points }: { points: GeoPoint[] }) {
  const map = useMap();

  useEffect(() => {
    if (!points.length) {
      map.setView(QUINTANA_ROO_CENTER, 7);
      return;
    }

    if (points.length === 1) {
      map.setView([points[0].latitude, points[0].longitude], 13);
      return;
    }

    const bounds = points.map((point) => [point.latitude, point.longitude] as [number, number]);
    map.fitBounds(bounds, { padding: [32, 32] });
  }, [map, points]);

  return null;
}

function DashboardCoverageMap({ points }: { points: GeoPoint[] }) {
  return (
    <Box sx={{ height: 340, borderRadius: 4, overflow: 'hidden', border: '1px solid rgba(108,56,65,0.12)' }}>
      <MapContainer center={QUINTANA_ROO_CENTER} zoom={7} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapAutoBounds points={points} />
        {points.map((point) => (
          <CircleMarker
            key={point.id}
            center={[point.latitude, point.longitude]}
            radius={6}
            pathOptions={{
              color: '#6C3841',
              fillColor: '#A98C62',
              fillOpacity: 0.82,
              weight: 2,
            }}
          />
        ))}
      </MapContainer>
    </Box>
  );
}

function StatCard({
  icon,
  title,
  value,
  subtitle,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle: string;
  accent: string;
}) {
  return (
    <Card
      sx={{
        height: '100%',
        background: `linear-gradient(160deg, ${alpha(accent, 0.16)} 0%, rgba(255,255,255,0.98) 48%, rgba(255,255,255,1) 100%)`,
        border: `1px solid ${alpha(accent, 0.18)}`,
        boxShadow: `0 18px 40px ${alpha(accent, 0.12)}`,
      }}
    >
      <CardContent>
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Box>
              <Typography variant="body2" color="text.secondary">
                {title}
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 900, mt: 0.5 }}>
                {value}
              </Typography>
            </Box>
            <Box
              sx={{
                width: 46,
                height: 46,
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                color: accent,
                backgroundColor: alpha(accent, 0.12),
              }}
            >
              {icon}
            </Box>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}

function BarsByMonth({
  items,
  title,
  subtitle,
  color,
}: {
  items: Array<{ label: string; value: number }>;
  title: string;
  subtitle: string;
  color: string;
}) {
  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Stack spacing={2.5}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          </Box>

          <Stack direction="row" alignItems="flex-end" spacing={1} sx={{ minHeight: 230 }}>
            {items.map((item) => (
              <Stack key={item.label} spacing={1} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: item.value ? 'text.primary' : 'text.disabled' }}>
                  {item.value}
                </Typography>
                <Box
                  sx={{
                    width: '100%',
                    height: `${Math.max((item.value / max) * 150, item.value ? 16 : 8)}px`,
                    borderRadius: '18px 18px 10px 10px',
                    background: `linear-gradient(180deg, ${alpha(color, 0.9)} 0%, ${alpha(color, 0.42)} 100%)`,
                    boxShadow: `0 10px 18px ${alpha(color, 0.18)}`,
                    transition: 'height .25s ease',
                  }}
                />
                <Typography variant="caption" color="text.secondary">
                  {item.label}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

function HorizontalBars({
  items,
  title,
  subtitle,
  color,
  suffix,
}: {
  items: Array<{ label: string; helper?: string; value: number }>;
  title: string;
  subtitle: string;
  color: string;
  suffix?: string;
}) {
  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Stack spacing={2.25}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          </Box>

          <Stack spacing={1.5}>
            {items.map((item) => (
              <Box key={item.label}>
                <Stack direction="row" justifyContent="space-between" alignItems="baseline" spacing={1}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 800 }}>
                      {item.label}
                    </Typography>
                    {item.helper ? (
                      <Typography variant="caption" color="text.secondary">
                        {item.helper}
                      </Typography>
                    ) : null}
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 900 }}>
                    {formatNumber(item.value)}
                    {suffix ? ` ${suffix}` : ''}
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={(item.value / max) * 100}
                  sx={{
                    mt: 0.8,
                    height: 12,
                    borderRadius: 999,
                    backgroundColor: alpha(color, 0.12),
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 999,
                      background: `linear-gradient(90deg, ${color} 0%, ${alpha(color, 0.58)} 100%)`,
                    },
                  }}
                />
              </Box>
            ))}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

function DonutSummary({
  items,
  title,
  subtitle,
}: {
  items: Array<{ label: string; value: number; color: string }>;
  title: string;
  subtitle: string;
}) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const segments = items.map((item) => ({
    ...item,
    length: total ? (item.value / total) * circumference : 0,
  }));
  const offsets = segments.map((_, index) =>
    segments.slice(0, index).reduce((sum, current) => sum + current.length, 0)
  );

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Stack spacing={2.5}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          </Box>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.5} alignItems="center">
            <Box sx={{ position: 'relative', width: 160, height: 160 }}>
              <svg width="160" height="160" viewBox="0 0 160 160">
                <circle cx="80" cy="80" r={radius} fill="none" stroke="rgba(108,56,65,0.08)" strokeWidth="16" />
                {segments.map((item, index) => (
                    <circle
                      key={item.label}
                      cx="80"
                      cy="80"
                      r={radius}
                      fill="none"
                      stroke={item.color}
                      strokeWidth="16"
                      strokeDasharray={`${item.length} ${circumference - item.length}`}
                      strokeDashoffset={-offsets[index]}
                      strokeLinecap="round"
                      transform="rotate(-90 80 80)"
                    />
                  ))}
              </svg>
              <Stack
                sx={{
                  position: 'absolute',
                  inset: 0,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography variant="h4" sx={{ fontWeight: 900 }}>
                  {formatNumber(total)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  entrevistas
                </Typography>
              </Stack>
            </Box>

            <Stack spacing={1.2} sx={{ width: '100%' }}>
              {items.map((item) => (
                <Stack key={item.label} direction="row" justifyContent="space-between" alignItems="center">
                  <Stack direction="row" spacing={1.1} alignItems="center">
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: item.color }} />
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {item.label}
                    </Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {formatNumber(item.value)} ({total ? formatPercent((item.value / total) * 100) : '0%'})
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const user = authStore.getUser();
  const records = respondentsStore.list();

  const [sectionsCatalog, setSectionsCatalog] = useState<SectionItem[]>([]);
  const [catalogError, setCatalogError] = useState(false);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const data = await getSecciones();
        if (!alive) return;
        setSectionsCatalog(data);
      } catch {
        if (!alive) return;
        setCatalogError(true);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const sectionMunicipalityMap = useMemo(
    () =>
      new Map(
        sectionsCatalog.map((section) => [String(section.IdSeccion), normalizeMunicipalityName(section.Municipio)])
      ),
    [sectionsCatalog]
  );

  const dashboard = useMemo(() => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    const officialSectionIds = new Set(sectionsCatalog.map((section) => String(section.IdSeccion)));
    const officialSectionsByMunicipality = new Map<string, Set<string>>();

    OFFICIAL_MUNICIPALITIES.forEach((municipality) => {
      officialSectionsByMunicipality.set(municipality.name, new Set());
    });

    sectionsCatalog.forEach((section) => {
      const municipality = normalizeMunicipalityName(section.Municipio);
      if (officialSectionsByMunicipality.has(municipality)) {
        officialSectionsByMunicipality.get(municipality)?.add(String(section.IdSeccion));
      }
    });

    const monthlyCurrentYear = Array.from({ length: 12 }, (_, index) => ({
      label: MONTH_LABELS[index],
      value: 0,
    }));
    const yearCounts = new Map<number, number>();
    const resultCounts = new Map<string, number>();
    const sectionCounts = new Map<string, number>();
    const interviewedSections = new Set<string>();
    const interviewedMunicipalities = new Set<string>();
    const municipalityInterviewCounts = new Map<string, number>();
    const municipalityInterviewedSections = new Map<string, Set<string>>();
    const geoPoints: GeoPoint[] = [];
    const accuracies: number[] = [];

    OFFICIAL_MUNICIPALITIES.forEach((municipality) => {
      municipalityInterviewCounts.set(municipality.name, 0);
      municipalityInterviewedSections.set(municipality.name, new Set());
    });

    records.forEach((record) => {
      const municipality = resolveMunicipality(record, sectionMunicipalityMap);
      const createdAt = safeDate(record.createdAt);
      const section = getSectionKey(record.person.seccion);
      const result = record.answers.resultado || 'Sin clasificar';
      const geoPoint = getGeoPoint(record, municipality);

      resultCounts.set(result, (resultCounts.get(result) ?? 0) + 1);
      sectionCounts.set(section || 'Sin sección', (sectionCounts.get(section || 'Sin sección') ?? 0) + 1);

      if (section) {
        interviewedSections.add(section);
      }

      if (OFFICIAL_MUNICIPALITIES.some((item) => item.name === municipality)) {
        interviewedMunicipalities.add(municipality);
        municipalityInterviewCounts.set(
          municipality,
          (municipalityInterviewCounts.get(municipality) ?? 0) + 1
        );
        if (section) {
          municipalityInterviewedSections.get(municipality)?.add(section);
        }
      }

      if (createdAt) {
        yearCounts.set(createdAt.getFullYear(), (yearCounts.get(createdAt.getFullYear()) ?? 0) + 1);

        if (createdAt.getFullYear() === currentYear) {
          monthlyCurrentYear[createdAt.getMonth()].value += 1;
        }
      }

      if (geoPoint) {
        geoPoints.push(geoPoint);
      }

      if (typeof record.person.geo?.accuracy === 'number' && record.person.geo.accuracy > 0) {
        accuracies.push(record.person.geo.accuracy);
      }
    });

    const currentYearTotal = monthlyCurrentYear.reduce((sum, item) => sum + item.value, 0);
    const currentMonthTotal = monthlyCurrentYear[currentMonth]?.value ?? 0;
    const totalOfficialSections = officialSectionIds.size;
    const coveredSections = interviewedSections.size;
    const sectionCoverageRate = totalOfficialSections ? (coveredSections / totalOfficialSections) * 100 : 0;
    const avgMonthlyCurrentYear = currentDate.getMonth() >= 0 ? currentYearTotal / (currentMonth + 1) : 0;
    const topSections = [...sectionCounts.entries()]
      .filter(([section]) => section !== 'Sin sección')
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0], 'es', { numeric: true }))
      .slice(0, 10)
      .map(([section, count]) => ({ label: `Sección ${section}`, value: count }));
    const sectionsWithSingleInterview = [...sectionCounts.entries()].filter(
      ([section, count]) => section !== 'Sin sección' && count === 1
    ).length;
    const municipalityStats: MunicipalityStat[] = OFFICIAL_MUNICIPALITIES.map((municipality) => {
      const officialSections = officialSectionsByMunicipality.get(municipality.name)?.size ?? 0;
      const uniqueSections = municipalityInterviewedSections.get(municipality.name)?.size ?? 0;
      const interviews = municipalityInterviewCounts.get(municipality.name) ?? 0;

      return {
        ...municipality,
        interviews,
        uniqueSections,
        officialSections,
        coverageRate: officialSections ? (uniqueSections / officialSections) * 100 : 0,
      };
    }).sort((left, right) => right.interviews - left.interviews || left.name.localeCompare(right.name, 'es'));

    const yearlySeries = [...yearCounts.entries()]
      .sort((left, right) => left[0] - right[0])
      .map(([year, value]) => ({ label: String(year), value }));
    const latestRecord = records[0] ?? null;
    const completedCount = resultCounts.get('Completa') ?? 0;
    const rejectedCount = resultCounts.get('Rechazada a la mitad') ?? 0;
    const otherResults = [...resultCounts.entries()]
      .filter(([key]) => key !== 'Completa' && key !== 'Rechazada a la mitad')
      .reduce((sum, [, count]) => sum + count, 0);
    const averageAccuracy =
      accuracies.length > 0 ? accuracies.reduce((sum, value) => sum + value, 0) / accuracies.length : 0;

    return {
      currentYear,
      currentMonthLabel: MONTH_LABELS[currentMonth],
      totalRecords: records.length,
      currentYearTotal,
      currentMonthTotal,
      avgMonthlyCurrentYear,
      municipalityCoverageCount: interviewedMunicipalities.size,
      coveredSections,
      totalOfficialSections,
      sectionCoverageRate,
      completedCount,
      rejectedCount,
      otherResults,
      latestRecord,
      monthlyCurrentYear,
      yearlySeries,
      municipalityStats,
      topSections,
      sectionsWithSingleInterview,
      geoPoints,
      averageAccuracy,
    };
  }, [records, sectionMunicipalityMap, sectionsCatalog]);

  const completionRate = dashboard.totalRecords
    ? (dashboard.completedCount / dashboard.totalRecords) * 100
    : 0;

  return (
    <Stack spacing={3.2}>
      <Card
        sx={{
          overflow: 'hidden',
          border: '1px solid rgba(108,56,65,0.08)',
          background:
            'linear-gradient(120deg, #6C3841 0%, #7B414A 38%, #8B5B63 62%, #EDE5E3 100%)',
        }}
      >
        <CardContent sx={{ p: { xs: 2.5, md: 3.5 }, pr: { xs: 2.5, md: 4.5, lg: 5.5 } }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} lg={8}>
              <Stack spacing={2.2}>
                <Box>
                  <Typography variant="h4" sx={{ color: '#fff', fontWeight: 900 }}>
                    Dashboard estratégico de campo 📊✨
                  </Typography>
                  <Typography
                    sx={{
                      color: 'rgba(255,255,255,0.96)',
                      maxWidth: 760,
                      fontSize: { xs: '1.05rem', md: '1.18rem' },
                      lineHeight: 1.55,
                      textShadow: '0 1px 2px rgba(0,0,0,0.16)',
                    }}
                  >
                    Bienvenido, {user?.nombre}. Aquí ya no solo vemos cuántas encuestas hay: ahora tienes visión por año, por mes, por municipio, por secciones y por cobertura geográfica en Quintana Roo. 🗺️
                  </Typography>
                </Box>

                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip
                    label={`${formatNumber(dashboard.totalRecords)} levantamientos`}
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.16)',
                      color: '#fff',
                      fontWeight: 900,
                      border: '1px solid rgba(255,255,255,0.24)',
                      backdropFilter: 'blur(4px)',
                      textShadow: '0 1px 1px rgba(0,0,0,0.12)',
                    }}
                  />
                  <Chip
                    label={`${dashboard.currentYear}: ${formatNumber(dashboard.currentYearTotal)} registros`}
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.16)',
                      color: '#fff',
                      fontWeight: 900,
                      border: '1px solid rgba(255,255,255,0.24)',
                      backdropFilter: 'blur(4px)',
                      textShadow: '0 1px 1px rgba(0,0,0,0.12)',
                    }}
                  />
                  <Chip
                    label={`${formatPercent(dashboard.sectionCoverageRate)} de cobertura seccional`}
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.16)',
                      color: '#fff',
                      fontWeight: 900,
                      border: '1px solid rgba(255,255,255,0.24)',
                      backdropFilter: 'blur(4px)',
                      textShadow: '0 1px 1px rgba(0,0,0,0.12)',
                    }}
                  />
                  <Chip
                    label={`${dashboard.municipalityCoverageCount}/11 municipios activos`}
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.16)',
                      color: '#fff',
                      fontWeight: 900,
                      border: '1px solid rgba(255,255,255,0.24)',
                      backdropFilter: 'blur(4px)',
                      textShadow: '0 1px 1px rgba(0,0,0,0.12)',
                    }}
                  />
                </Stack>
              </Stack>
            </Grid>

            <Grid item xs={12} lg={4}>
              <Card
                sx={{
                  bgcolor: 'rgba(255,250,249,0.96)',
                  border: '1px solid rgba(108,56,65,0.10)',
                  boxShadow: 'none',
                }}
              >
                <CardContent>
                  <Stack spacing={1.25}>
                    <Typography variant="overline" sx={{ letterSpacing: 1.2, color: 'text.secondary' }}>
                      Pulso operativo ⚡
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 900 }}>
                      {dashboard.latestRecord ? formatCompactDate(dashboard.latestRecord.createdAt) : 'Sin registros todavía'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Última captura registrada en plataforma.
                    </Typography>
                    <Divider />
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        Tasa de entrevistas completas
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 900 }}>
                        {formatPercent(completionRate)}
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={completionRate}
                      sx={{
                        height: 12,
                        borderRadius: 999,
                        bgcolor: alpha(theme.palette.success.main, 0.16),
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 999,
                          background: `linear-gradient(90deg, ${theme.palette.success.main} 0%, ${alpha(theme.palette.success.main, 0.55)} 100%)`,
                        },
                      }}
                    />
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {catalogError ? (
        <Alert severity="warning">
          No se pudo cargar el catálogo oficial de secciones. Las métricas de cobertura se muestran con lo disponible en las encuestas guardadas.
        </Alert>
      ) : null}

      {!records.length ? (
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Stack spacing={2} alignItems="flex-start">
              <Typography variant="h5" sx={{ fontWeight: 900 }}>
                Aún no hay encuestas para graficar 🧾
              </Typography>
              <Typography color="text.secondary">
                En cuanto captures entrevistas, este panel mostrará tendencia mensual, municipios de Quintana Roo, secciones cubiertas y mapa de geolocalización.
              </Typography>
              <Button variant="contained" onClick={() => navigate('/surveys/new')}>
                Levantar primera encuesta
              </Button>
            </Stack>
          </CardContent>
        </Card>
      ) : (
        <>
          <Box sx={{ px: { xs: 0, md: 0.5 }, pr: { xs: 0, md: 1.5, lg: 2.5 } }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6} xl={4}>
              <StatCard
                icon={<QueryStatsIcon />}
                title="Encuestas totales 🧮"
                value={formatNumber(dashboard.totalRecords)}
                subtitle="Base acumulada de levantamientos almacenados en el dispositivo."
                accent={theme.palette.primary.main}
              />
            </Grid>
            <Grid item xs={12} md={6} xl={4}>
              <StatCard
                icon={<CalendarMonthIcon />}
                title={`Año ${dashboard.currentYear} 📆`}
                value={formatNumber(dashboard.currentYearTotal)}
                subtitle={`En ${dashboard.currentMonthLabel} van ${formatNumber(dashboard.currentMonthTotal)} entrevistas; promedio mensual ${dashboard.avgMonthlyCurrentYear.toFixed(1)}.`}
                accent={theme.palette.secondary.main}
              />
            </Grid>
            <Grid item xs={12} md={6} xl={4}>
              <StatCard
                icon={<LocationCityIcon />}
                title="Municipios activos 🏙️"
                value={`${dashboard.municipalityCoverageCount}/11`}
                subtitle="Municipios oficiales de Quintana Roo con al menos una encuesta levantada."
                accent={theme.palette.info.main}
              />
            </Grid>
            <Grid item xs={12} md={6} xl={4}>
              <StatCard
                icon={<MapIcon />}
                title="Cobertura de secciones 🗂️"
                value={`${formatNumber(dashboard.coveredSections)}${dashboard.totalOfficialSections ? ` / ${formatNumber(dashboard.totalOfficialSections)}` : ''}`}
                subtitle={`Cobertura acumulada ${formatPercent(dashboard.sectionCoverageRate)} sobre el catálogo oficial cargado.`}
                accent={theme.palette.warning.main}
              />
            </Grid>
            <Grid item xs={12} md={6} xl={4}>
              <StatCard
                icon={<CheckCircleIcon />}
                title="Entrevistas completas ✅"
                value={formatPercent(completionRate)}
                subtitle={`${formatNumber(dashboard.completedCount)} completas frente a ${formatNumber(dashboard.rejectedCount)} rechazadas a la mitad.`}
                accent={theme.palette.success.main}
              />
            </Grid>
            <Grid item xs={12} md={6} xl={4}>
              <StatCard
                icon={<FmdGoodIcon />}
                title="Puntos geolocalizados 📍"
                value={formatNumber(dashboard.geoPoints.length)}
                subtitle={`Precisión promedio ${dashboard.averageAccuracy ? `${Math.round(dashboard.averageAccuracy)} m` : 'sin dato'} en coordenadas capturadas.`}
                accent={theme.palette.error.main}
              />
            </Grid>
          </Grid>
          </Box>

          <Box sx={{ px: { xs: 0, md: 0.5 }, pr: { xs: 0, md: 1.5, lg: 2.5 } }}>
          <Grid container spacing={2}>
            <Grid item xs={12} xl={7}>
              <BarsByMonth
                items={dashboard.monthlyCurrentYear}
                title={`Tendencia mensual ${dashboard.currentYear} 📈`}
                subtitle="Lectura rápida del ritmo operativo del año actual para detectar picos, meses flojos y continuidad de brigada."
                color={theme.palette.primary.main}
              />
            </Grid>
            <Grid item xs={12} xl={5}>
              <HorizontalBars
                items={dashboard.yearlySeries.length ? dashboard.yearlySeries : [{ label: String(dashboard.currentYear), value: dashboard.totalRecords }]}
                title="Acumulado por año 🧭"
                subtitle="Comparativo histórico según la fecha de creación de cada encuesta."
                color={theme.palette.secondary.main}
              />
            </Grid>
          </Grid>
          </Box>

          <Box sx={{ px: { xs: 0, md: 0.5 }, pr: { xs: 0, md: 1.5, lg: 2.5 } }}>
          <Grid container spacing={2}>
            <Grid item xs={12} lg={7}>
              <HorizontalBars
                items={dashboard.municipalityStats.map((item) => ({
                  label: `${item.emoji} ${item.name}`,
                  helper: `${item.capital} · ${item.uniqueSections}/${item.officialSections || 0} secciones`,
                  value: item.interviews,
                }))}
                title="Ranking municipal de Quintana Roo 🏝️"
                subtitle="Conteo total por municipio, manteniendo visibles los 11 municipios aunque aún estén en cero."
                color={theme.palette.primary.main}
                suffix="enc."
              />
            </Grid>
            <Grid item xs={12} lg={5}>
              <DonutSummary
                title="Estatus de entrevistas 🎯"
                subtitle="Balance entre entrevistas completas, rechazadas y otros estados capturados."
                items={[
                  { label: 'Completas', value: dashboard.completedCount, color: theme.palette.success.main },
                  { label: 'Rechazadas a la mitad', value: dashboard.rejectedCount, color: theme.palette.error.main },
                  { label: 'Otros estados', value: dashboard.otherResults, color: theme.palette.warning.main },
                ]}
              />
            </Grid>
          </Grid>
          </Box>

          <Box sx={{ px: { xs: 0, md: 0.5 }, pr: { xs: 0, md: 1.5, lg: 2.5 } }}>
          <Grid container spacing={2}>
            <Grid item xs={12} lg={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Stack spacing={2.5}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 900 }}>
                        Secciones electorales: profundidad y dispersión 🧩
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Como el universo supera las 400 secciones, aquí conviene resumir cobertura, concentración y cola larga para que el usuario entienda el territorio sin saturarse.
                      </Typography>
                    </Box>

                    <Grid container spacing={1.5}>
                      <Grid item xs={6}>
                        <Card sx={{ bgcolor: alpha(theme.palette.warning.main, 0.08), boxShadow: 'none' }}>
                          <CardContent>
                            <Typography variant="body2" color="text.secondary">
                              Secciones cubiertas
                            </Typography>
                            <Typography variant="h5" sx={{ fontWeight: 900 }}>
                              {formatNumber(dashboard.coveredSections)}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={6}>
                        <Card sx={{ bgcolor: alpha(theme.palette.info.main, 0.08), boxShadow: 'none' }}>
                          <CardContent>
                            <Typography variant="body2" color="text.secondary">
                              Cobertura oficial
                            </Typography>
                            <Typography variant="h5" sx={{ fontWeight: 900 }}>
                              {formatPercent(dashboard.sectionCoverageRate)}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={6}>
                        <Card sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.08), boxShadow: 'none' }}>
                          <CardContent>
                            <Typography variant="body2" color="text.secondary">
                              Secciones de una sola entrevista
                            </Typography>
                            <Typography variant="h5" sx={{ fontWeight: 900 }}>
                              {formatNumber(dashboard.sectionsWithSingleInterview)}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={6}>
                        <Card sx={{ bgcolor: alpha(theme.palette.success.main, 0.08), boxShadow: 'none' }}>
                          <CardContent>
                            <Typography variant="body2" color="text.secondary">
                              Promedio por sección cubierta
                            </Typography>
                            <Typography variant="h5" sx={{ fontWeight: 900 }}>
                              {dashboard.coveredSections ? (dashboard.totalRecords / dashboard.coveredSections).toFixed(1) : '0.0'}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>

                    <Divider />

                    <Stack spacing={1.4}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>
                        Top secciones más trabajadas 🔥
                      </Typography>
                      {dashboard.topSections.length ? (
                        dashboard.topSections.map((item, index) => (
                          <Box key={item.label}>
                            <Stack direction="row" justifyContent="space-between" spacing={1}>
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                {index + 1}. {item.label}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {formatNumber(item.value)} entrevistas
                              </Typography>
                            </Stack>
                            <LinearProgress
                              variant="determinate"
                              value={(item.value / dashboard.topSections[0].value) * 100}
                              sx={{
                                mt: 0.7,
                                height: 10,
                                borderRadius: 999,
                                bgcolor: alpha(theme.palette.primary.main, 0.12),
                                '& .MuiLinearProgress-bar': {
                                  borderRadius: 999,
                                  background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${alpha(theme.palette.primary.main, 0.52)} 100%)`,
                                },
                              }}
                            />
                          </Box>
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Todavía no hay suficientes datos para comparar secciones.
                        </Typography>
                      )}
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} lg={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Stack spacing={2.5}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 900 }}>
                        Cobertura territorial y geolocalización 🛰️
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Cada punto representa una entrevista con latitud y longitud capturadas desde navegador. Esto ayuda a detectar zonas realmente visitadas y a validar operación en campo.
                      </Typography>
                    </Box>

                    <DashboardCoverageMap points={dashboard.geoPoints} />

                    <Grid container spacing={1.5}>
                      <Grid item xs={6}>
                        <Card sx={{ bgcolor: alpha(theme.palette.error.main, 0.07), boxShadow: 'none' }}>
                          <CardContent>
                            <Typography variant="body2" color="text.secondary">
                              Coordenadas válidas
                            </Typography>
                            <Typography variant="h5" sx={{ fontWeight: 900 }}>
                              {formatNumber(dashboard.geoPoints.length)}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={6}>
                        <Card sx={{ bgcolor: alpha(theme.palette.info.main, 0.07), boxShadow: 'none' }}>
                          <CardContent>
                            <Typography variant="body2" color="text.secondary">
                              Precisión promedio
                            </Typography>
                            <Typography variant="h5" sx={{ fontWeight: 900 }}>
                              {dashboard.averageAccuracy ? `${Math.round(dashboard.averageAccuracy)} m` : '-'}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          </Box>

          <Box sx={{ px: { xs: 0, md: 0.5 }, pr: { xs: 0, md: 1.5, lg: 2.5 } }}>
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1.5}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 900 }}>
                      Lectura ejecutiva recomendada para este dashboard 🎨
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Esta estructura ya deja el tablero profesional y visual. Si después quieres subirlo todavía más, estas son las siguientes capas de valor.
                    </Typography>
                  </Box>
                  <Button variant="outlined" startIcon={<TravelExploreIcon />} onClick={() => navigate('/respondents')}>
                    Revisar encuestados
                  </Button>
                </Stack>

                <Grid container spacing={1.5}>
                  {[
                    {
                      icon: <TimelineIcon fontSize="small" />,
                      title: 'Filtro por año y municipio',
                      text: 'Agregar selectores arriba para que el usuario compare 2025 vs 2026, o solo Cancún, Chetumal, Playa del Carmen, etc.',
                    },
                    {
                      icon: <AutoGraphIcon fontSize="small" />,
                      title: 'Mapa por color municipal',
                      text: 'Asignar color distinto por municipio para distinguir mejor la operación territorial en la capa geográfica.',
                    },
                    {
                      icon: <PlaceIcon fontSize="small" />,
                      title: 'Mapa con densidad o clusters',
                      text: 'Si el volumen crece mucho, conviene usar clusters o heatmap. Para eso sí valdría la pena instalar una librería especializada.',
                    },
                  ].map((item) => (
                    <Grid item xs={12} md={4} key={item.title}>
                      <Card sx={{ height: '100%', bgcolor: alpha(theme.palette.primary.main, 0.035), boxShadow: 'none' }}>
                        <CardContent>
                          <Stack spacing={1.1}>
                            <Box sx={{ color: 'primary.main' }}>{item.icon}</Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>
                              {item.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {item.text}
                            </Typography>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Stack>
            </CardContent>
          </Card>
          </Box>
        </>
      )}
    </Stack>
  );
}
