/**
 * 📍 Mapa de solo lectura
 *
 * Su responsabilidad es mostrar la ubicación capturada sin permitir edición,
 * conservando así la trazabilidad del levantamiento realizado.
 */
import { Box, Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import type { GeoSnapshot } from '../../types/person';

interface Props {
  geo: GeoSnapshot;
  compact?: boolean;
}

export default function ReadonlyGeoMap({ geo, compact = false }: Props) {
  return (
    <Card>
      <CardContent>
        <Stack spacing={1.5}>
          {/* 🧭 Encabezado contextual */}
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Ubicación de levantamiento 📍</Typography>
            <Chip label="Solo lectura" color="secondary" size="small" />
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Coordenadas del navegador. No se pueden modificar manualmente.
          </Typography>
          <Box sx={{ height: compact ? 180 : 260, borderRadius: 3, overflow: 'hidden' }}>
            {/* 🗺️ Mapa inmóvil para consulta rápida */}
            <MapContainer center={[geo.latitude, geo.longitude]} zoom={16} scrollWheelZoom={false} dragging={false} touchZoom={false} doubleClickZoom={false} boxZoom={false} keyboard={false} zoomControl={false} attributionControl>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={[geo.latitude, geo.longitude]} />
            </MapContainer>
          </Box>
          <Typography variant="caption" color="text.secondary">
            Lat: {geo.latitude.toFixed(6)} · Lng: {geo.longitude.toFixed(6)} · Precisión: {Math.round(geo.accuracy ?? 0)} m
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}
