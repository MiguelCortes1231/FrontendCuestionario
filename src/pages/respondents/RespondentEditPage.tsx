/**
 * ✏️ Edición básica del encuestado
 * ---------------------------------------------------
 * Esta pantalla existe para corregir datos de alta de la persona
 * sin alterar las respuestas de la encuesta.
 *
 * ✅ Se puede ajustar información básica del ciudadano
 * ❌ No se modifican respuestas ni trazabilidad de levantamiento
 *
 * Esto ayuda a mantener integridad operativa mientras se corrigen
 * errores de captura como nombre, teléfono o domicilio.
 */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import { toast } from 'react-toastify';
import type { PersonFormData } from '../../types/person';
import { validateRequiredPersonFields } from '../../domain/person/personForm';
import { buildSectionMunicipalityMap, getSecciones } from '../../services/sections.service';
import { getRespondentById, updateRespondentPerson } from '../../services/respondents.service';

const formGridSx = {
  width: '100%',
  margin: 0,
  '& .MuiGrid-item': {
    display: 'flex',
  },
  '& .MuiFormControl-root': {
    width: '100%',
  },
  '& .MuiOutlinedInput-root': {
    borderRadius: 3,
    backgroundColor: '#fff',
    minHeight: 62,
  },
} as const;

export default function RespondentEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [person, setPerson] = useState<PersonFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    let alive = true;

    if (!id) {
      setLoadError(true);
      setLoading(false);
      return () => {
        alive = false;
      };
    }

    (async () => {
      try {
        setLoading(true);
        setLoadError(false);
        const sections = await getSecciones();
        const sectionMap = buildSectionMunicipalityMap(sections);
        const record = await getRespondentById(id, (sectionId) => sectionMap.get(sectionId) ?? '');
        if (!alive) return;
        setPerson(record.person);
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
  }, [id]);

  const personErrors = useMemo(() => validateRequiredPersonFields(person), [person]);

  if (loading) {
    return <Alert severity="info">Cargando datos del encuestado...</Alert>;
  }

  if (loadError || !id || !person) {
    return <Alert severity="warning">No se encontró el encuestado que deseas editar.</Alert>;
  }

  const updateField = (field: keyof PersonFormData, value: string) => {
    // ✍️ Setter simple y controlado para no duplicar lógica de edición en cada input.
    setPerson((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleSave = () => {
    void (async () => {
      setShowErrors(true);
      if (Object.values(personErrors).some(Boolean)) {
        toast.warning('Completa los campos obligatorios marcados en rojo ⚠️');
        return;
      }

      try {
        setSaving(true);
        await updateRespondentPerson(id, person);
        toast.success('Datos básicos actualizados correctamente ✅');
        navigate(`/respondents/${id}`);
      } catch {
        toast.error('No se pudo actualizar la información de la persona ❌');
      } finally {
        setSaving(false);
      }
    })();
  };

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1.5}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900 }}>
            Editar datos básicos ✏️
          </Typography>
          <Typography color="text.secondary">
            Aquí solo se actualiza la información de alta de la persona. Las respuestas de la encuesta permanecen intactas.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(`/respondents/${id}`)}
            sx={{ borderRadius: 999 }}
          >
            Volver
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={saving}
            sx={{ borderRadius: 999, fontWeight: 800 }}
          >
            Guardar cambios
          </Button>
        </Stack>
      </Stack>

      <Card
        sx={{
          borderRadius: 4,
          border: '1px solid rgba(108,56,65,0.10)',
          boxShadow: '0 18px 40px rgba(108,56,65,0.08)',
        }}
      >
        <CardContent sx={{ p: { xs: 2, md: 3.5 } }}>
          <Grid
            container
            rowSpacing={{ xs: 2.5, md: 3 }}
            columnSpacing={{ xs: 0, md: 3.5, lg: 4 }}
            sx={formGridSx}
          >
            <Grid item xs={12} md={4}>
              <TextField
                label="Folio"
                value={person.folio}
                onChange={(e) => updateField('folio', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Nombres"
                value={person.nombres}
                onChange={(e) => updateField('nombres', e.target.value)}
                error={showErrors && !!personErrors.nombres}
                helperText={showErrors && personErrors.nombres ? personErrors.nombres : ' '}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Apellido paterno"
                value={person.apellidoPaterno}
                onChange={(e) => updateField('apellidoPaterno', e.target.value)}
                error={showErrors && !!personErrors.apellidoPaterno}
                helperText={showErrors && personErrors.apellidoPaterno ? personErrors.apellidoPaterno : ' '}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Apellido materno"
                value={person.apellidoMaterno}
                onChange={(e) => updateField('apellidoMaterno', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Teléfono"
                value={person.telefono ?? ''}
                onChange={(e) => updateField('telefono', e.target.value.replace(/[^\d+()\-\s]/g, ''))}
                error={showErrors && !!personErrors.telefono}
                helperText={showErrors && personErrors.telefono ? personErrors.telefono : ' '}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                select
                label="Sexo"
                value={person.sexo}
                onChange={(e) => updateField('sexo', e.target.value)}
              >
                {['Hombre', 'Mujer', 'Otro'].map((value) => (
                  <MenuItem key={value} value={value}>
                    {value}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Fecha nacimiento"
                value={person.fechaNacimiento}
                onChange={(e) => updateField('fechaNacimiento', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="CURP"
                value={person.curp}
                onChange={(e) => updateField('curp', e.target.value.toUpperCase())}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Clave de elector"
                value={person.claveElector}
                onChange={(e) => updateField('claveElector', e.target.value.toUpperCase())}
                error={showErrors && !!personErrors.claveElector}
                helperText={showErrors && personErrors.claveElector ? personErrors.claveElector : ' '}
              />
            </Grid>
            <Grid item xs={12} md={8}>
              <TextField
                label="Calle"
                value={person.calle}
                onChange={(e) => updateField('calle', e.target.value)}
                error={showErrors && !!personErrors.calle}
                helperText={showErrors && personErrors.calle ? personErrors.calle : ' '}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Número"
                value={person.numero}
                onChange={(e) => updateField('numero', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={8}>
              <TextField
                label="Colonia"
                value={person.colonia}
                onChange={(e) => updateField('colonia', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Código postal"
                value={person.codigoPostal}
                onChange={(e) => updateField('codigoPostal', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Municipio"
                value={person.municipio}
                onChange={(e) => updateField('municipio', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Estado"
                value={person.estado}
                onChange={(e) => updateField('estado', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Sección"
                value={person.seccion}
                onChange={(e) => updateField('seccion', e.target.value)}
                error={showErrors && !!personErrors.seccion}
                helperText={showErrors && personErrors.seccion ? personErrors.seccion : ' '}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Vigencia"
                value={person.vigencia}
                onChange={(e) => updateField('vigencia', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Tipo credencial"
                value={person.tipoCredencial}
                onChange={(e) => updateField('tipoCredencial', e.target.value)}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Stack>
  );
}
