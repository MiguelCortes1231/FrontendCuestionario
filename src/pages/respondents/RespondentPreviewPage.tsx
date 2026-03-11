import { useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import PersonIcon from '@mui/icons-material/Person';
import PlaceIcon from '@mui/icons-material/Place';
import QuizIcon from '@mui/icons-material/Quiz';
import BadgeIcon from '@mui/icons-material/Badge';
import ReadonlyGeoMap from '../../components/map/ReadonlyGeoMap';
import { respondentsStore } from '../../store/respondents.store';
import { exportNodeToPdf } from '../../utils/pdf';
import type { SurveyAnswers } from '../../types/survey';

type PreviewAnswerItem = {
  key: keyof SurveyAnswers | string;
  question: string;
  answer: string;
  section: string;
};

function formatDateTime(value?: string) {
  if (!value) return '-';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function safeValue(value: unknown) {
  const text = String(value ?? '').trim();
  return text || '-';
}

function buildAnswerItems(answers: SurveyAnswers): PreviewAnswerItem[] {
  const items: PreviewAnswerItem[] = [
    {
      key: 'hasValidCredential',
      question: '1. ¿Cuenta usted con credencial para votar vigente en este municipio o estado?',
      answer: safeValue(answers.hasValidCredential),
      section: 'I. Introducción y filtros',
    },
    {
      key: 'sexoObservado',
      question: '2. Sexo (anotar por observación)',
      answer: safeValue(answers.sexoObservado),
      section: 'I. Introducción y filtros',
    },
    {
      key: 'rangoEdad',
      question: '3. Rango de edad',
      answer: safeValue(answers.rangoEdad),
      section: 'I. Introducción y filtros',
    },
    {
      key: 'escolaridad',
      question: '4. Escolaridad: ¿Cuál fue el último grado de estudios que usted completó?',
      answer: safeValue(answers.escolaridad),
      section: 'I. Introducción y filtros',
    },
    {
      key: 'conoceGino',
      question: '5. ¿Conoce a Gino Segura?',
      answer: safeValue(answers.conoceGino),
      section: 'II. Evaluación de figuras públicas',
    },
    {
      key: 'conoceLatifa',
      question: '5. ¿Conoce a Latifa Martínez?',
      answer: safeValue(answers.conoceLatifa),
      section: 'II. Evaluación de figuras públicas',
    },
    {
      key: 'conocePalazuelos',
      question: '5. ¿Conoce a Roberto Palazuelos?',
      answer: safeValue(answers.conocePalazuelos),
      section: 'II. Evaluación de figuras públicas',
    },
    {
      key: 'importanciaPoliticos',
      question:
        '6. ¿Qué tan importante considera usted que es para el bienestar de Quintana Roo que los políticos salgan de sus oficinas para caminar las colonias y escuchar directamente a la gente?',
      answer: safeValue(answers.importanciaPoliticos),
      section: 'II. Evaluación de figuras públicas',
    },
    {
      key: 'ginoDebeSeguir',
      question:
        '7. Actualmente, el Senador por Quintana Roo, Gino Segura, se encuentra recorriendo los 11 municipios del estado para escuchar las demandas de la gente en sus colonias. ¿Considera usted que debe seguir realizando esta labor de cercanía, o debería enfocarse en otras actividades?',
      answer: safeValue(answers.ginoDebeSeguir),
      section: 'III. Desempeño',
    },
    {
      key: 'opinionGino',
      question:
        '8. Opinión (Sentimiento): En general, ¿tiene usted una opinión muy buena, buena, mala o muy mala de Gino Segura?',
      answer: safeValue(answers.opinionGino),
      section: 'III. Desempeño',
    },
    {
      key: 'atributoGino',
      question:
        '9. Atributos: De las siguientes palabras, ¿cuál es la que usted más asocia con Gino Segura?',
      answer: safeValue(answers.atributoGino),
      section: 'III. Desempeño',
    },
    {
      key: 'problemaNacional',
      question:
        '10. Problemática Nacional: De la siguiente lista, ¿cuál considera usted que es el problema que MÁS le preocupa en este momento?',
      answer:
        answers.problemaNacional === 'Otro'
          ? `Otro: ${safeValue(answers.problemaNacionalOtro)}`
          : safeValue(answers.problemaNacional),
      section: 'IV. Problemáticas y cierre',
    },
    {
      key: 'problemaLocal',
      question:
        '11. Problemática Local: Y pensando específicamente en su COLONIA, ¿cuál considera que es el problema más urgente a resolver?',
      answer:
        answers.problemaLocal === 'Otro'
          ? `Otro: ${safeValue(answers.problemaLocalOtro)}`
          : safeValue(answers.problemaLocal),
      section: 'IV. Problemáticas y cierre',
    },
    {
      key: 'resultado',
      question: 'Resultado de la entrevista',
      answer: safeValue(answers.resultado),
      section: 'IV. Problemáticas y cierre',
    },
    {
      key: 'observaciones',
      question: 'Observaciones',
      answer: safeValue(answers.observaciones),
      section: 'IV. Problemáticas y cierre',
    },
  ];

  return items;
}

export default function RespondentPreviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const record = id ? respondentsStore.findById(id) : null;
  const previewRef = useRef<HTMLDivElement>(null);

  const answerGroups = useMemo(() => {
    if (!record) return [];

    const items = buildAnswerItems(record.answers);

    const sectionOrder = [
      'I. Introducción y filtros',
      'II. Evaluación de figuras públicas',
      'III. Desempeño',
      'IV. Problemáticas y cierre',
    ];

    return sectionOrder.map((section) => ({
      title: section,
      items: items.filter((item) => item.section === section),
    }));
  }, [record]);

  if (!record) {
    return <Alert severity="warning">No se encontró la encuesta solicitada.</Alert>;
  }

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        spacing={1}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900 }}>
            Vista previa de encuesta 👁️
          </Typography>
          <Typography color="text.secondary">
            Resumen elegante con ubicación, datos de persona y respuestas completas.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/respondents')}
            sx={{ borderRadius: 999 }}
          >
            Volver
          </Button>

          <Button
            variant="contained"
            startIcon={<PictureAsPdfIcon />}
            onClick={() =>
              previewRef.current &&
              exportNodeToPdf(previewRef.current, `${record.person.folio}.pdf`)
            }
            sx={{ borderRadius: 999, fontWeight: 800 }}
          >
            Descargar PDF
          </Button>
        </Stack>
      </Stack>

      <div ref={previewRef}>
        <Card
          sx={{
            borderRadius: 4,
            overflow: 'hidden',
            border: '1px solid rgba(108,56,65,0.10)',
            boxShadow: '0 18px 48px rgba(108,56,65,0.12)',
          }}
        >
          <CardContent sx={{ p: { xs: 2, md: 4 } }}>
            <Stack spacing={3}>
              <Box
               data-pdf-block
                sx={{
                  p: 3,
                  borderRadius: 4,
                  color: 'white',
                  background: 'linear-gradient(135deg, #6C3841 0%, #8a4a55 100%)',
                }}
              >
                <Typography variant="h4" sx={{ fontWeight: 900 }}>
                  ESTUDIO DE OPINIÓN PÚBLICA
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.95, fontWeight: 700 }}>
                  "CONTIGO QUINTANA ROO"
                </Typography>

                <Stack
                  direction={{ xs: 'column', md: 'row' }}
                  spacing={1}
                  mt={2}
                  flexWrap="wrap"
                >
                  <Chip
                    icon={<AssignmentTurnedInIcon />}
                    label={`Resultado: ${safeValue(record.answers.resultado)}`}
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.16)',
                      color: 'white',
                      '& .MuiChip-icon': { color: 'white' },
                    }}
                  />
                  <Chip
                    icon={<BadgeIcon />}
                    label={`Folio: ${safeValue(record.person.folio)}`}
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.16)',
                      color: 'white',
                      '& .MuiChip-icon': { color: 'white' },
                    }}
                  />
                </Stack>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Card
                    variant="outlined"
                    data-pdf-block
                    sx={{ borderRadius: 4, height: '100%', borderColor: 'rgba(108,56,65,0.14)' }}
                  >
                    <CardContent>
                      <Stack spacing={1.5}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <PersonIcon sx={{ color: '#6C3841' }} />
                          <Typography variant="h6" sx={{ fontWeight: 800 }}>
                            Datos administrativos
                          </Typography>
                        </Stack>

                        <Divider />

                        <Grid container spacing={1.5}>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">
                              Encuestador
                            </Typography>
                            <Typography sx={{ fontWeight: 700 }}>
                              {safeValue(record.interviewerName)}
                            </Typography>
                          </Grid>

                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">
                              Sección
                            </Typography>
                            <Typography sx={{ fontWeight: 700 }}>
                              {safeValue(record.sectionPriorityLabel || record.person.seccion)}
                            </Typography>
                          </Grid>

                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">
                              Inicio
                            </Typography>
                            <Typography sx={{ fontWeight: 700 }}>
                              {formatDateTime(record.startedAt)}
                            </Typography>
                          </Grid>

                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">
                              Fin
                            </Typography>
                            <Typography sx={{ fontWeight: 700 }}>
                              {formatDateTime(record.finishedAt)}
                            </Typography>
                          </Grid>
                        </Grid>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card
                    variant="outlined"
                    data-pdf-block
                    sx={{ borderRadius: 4, height: '100%', borderColor: 'rgba(108,56,65,0.14)' }}
                  >
                    <CardContent>
                      <Stack spacing={1.5}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <PersonIcon sx={{ color: '#6C3841' }} />
                          <Typography variant="h6" sx={{ fontWeight: 800 }}>
                            Datos de la persona
                          </Typography>
                        </Stack>

                        <Divider />

                        <Grid container spacing={1.5}>
                          <Grid item xs={12}>
                            <Typography variant="body2" color="text.secondary">
                              Nombre completo
                            </Typography>
                            <Typography sx={{ fontWeight: 700 }}>
                              {[
                                record.person.nombres,
                                record.person.apellidoPaterno,
                                record.person.apellidoMaterno,
                              ]
                                .filter(Boolean)
                                .join(' ')}
                            </Typography>
                          </Grid>

                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">
                              Sexo
                            </Typography>
                            <Typography sx={{ fontWeight: 700 }}>
                              {safeValue(record.person.sexo)}
                            </Typography>
                          </Grid>

                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">
                              Fecha de nacimiento
                            </Typography>
                            <Typography sx={{ fontWeight: 700 }}>
                              {safeValue(record.person.fechaNacimiento)}
                            </Typography>
                          </Grid>

                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">
                              CURP
                            </Typography>
                            <Typography sx={{ fontWeight: 700 }}>
                              {safeValue(record.person.curp)}
                            </Typography>
                          </Grid>

                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">
                              Clave de elector
                            </Typography>
                            <Typography sx={{ fontWeight: 700 }}>
                              {safeValue(record.person.claveElector)}
                            </Typography>
                          </Grid>

                          <Grid item xs={12}>
                            <Typography variant="body2" color="text.secondary">
                              Domicilio
                            </Typography>
                            <Typography sx={{ fontWeight: 700 }}>
                              {[
                                `${record.person.calle ?? ''} ${record.person.numero ?? ''}`.trim(),
                                record.person.colonia,
                                record.person.municipio,
                                record.person.estado,
                                record.person.codigoPostal
                                  ? `CP ${record.person.codigoPostal}`
                                  : '',
                              ]
                                .filter(Boolean)
                                .join(', ') || '-'}
                            </Typography>
                          </Grid>
                        </Grid>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Card
                variant="outlined"
                data-pdf-block
                sx={{ borderRadius: 4, borderColor: 'rgba(108,56,65,0.14)' }}
              >
                <CardContent>
                  <Stack spacing={1.5}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <PlaceIcon sx={{ color: '#6C3841' }} />
                      <Typography variant="h6" sx={{ fontWeight: 800 }}>
                        Ubicación de levantamiento
                      </Typography>
                    </Stack>

                    <Divider />

                    <ReadonlyGeoMap geo={record.person.geo} />
                  </Stack>
                </CardContent>
              </Card>

              <Card
                variant="outlined"
                sx={{ borderRadius: 4, borderColor: 'rgba(108,56,65,0.14)' }}
              >
                <CardContent>
                  <Stack spacing={2.5}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <QuizIcon sx={{ color: '#6C3841' }} />
                      <Typography variant="h6" sx={{ fontWeight: 800 }}>
                        Respuestas de la encuesta
                      </Typography>
                    </Stack>

                    <Divider />

                    {answerGroups.map((group) => (
                      <Stack key={group.title} spacing={2} data-pdf-block>
                        <Box
                          sx={{
                            px: 1.8,
                            py: 1,
                            borderRadius: 3,
                            bgcolor: 'rgba(108,56,65,0.06)',
                            border: '1px solid rgba(108,56,65,0.10)',
                          }}
                        >
                          <Typography sx={{ fontWeight: 800, color: '#6C3841' }}>
                            {group.title}
                          </Typography>
                        </Box>

                        <Stack spacing={2}>
                          {group.items.map((item, index) => (
                            <Box
                              key={`${group.title}-${item.key}-${index}`}
                              data-pdf-block
                            >
                              <Box
                                sx={{
                                  p: 2,
                                  borderRadius: 3,
                                  border: '1px solid rgba(108,56,65,0.10)',
                                  bgcolor: '#fff',
                                }}
                              >
                                <Typography
                                  sx={{
                                    fontWeight: 700,
                                    color: '#3f3f46',
                                    mb: 0.8,
                                  }}
                                >
                                  {item.question}
                                </Typography>

                                <Typography
                                  sx={{
                                    color: '#6C3841',
                                    fontWeight: 800,
                                    whiteSpace: 'pre-wrap',
                                  }}
                                >
                                  {item.answer}
                                </Typography>
                              </Box>
                            </Box>
                          ))}
                        </Stack>
                      </Stack>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          </CardContent>
        </Card>
      </div>
    </Stack>
  );
}
