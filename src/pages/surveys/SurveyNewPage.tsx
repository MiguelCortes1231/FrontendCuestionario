/**
 * 📝 Pantalla de captura de encuesta
 *
 * Este módulo concentra el flujo operativo completo del levantamiento:
 * - 📍 toma la ubicación actual
 * - 🧍 captura datos de la persona
 * - 🪪 permite OCR del INE
 * - 🧠 guía el cuestionario por páginas
 * - 💾 persiste el registro terminado
 */
import { useEffect, useMemo, useRef, useState, type SyntheticEvent } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  MenuItem,
  Pagination,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SaveIcon from '@mui/icons-material/Save';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import SearchIcon from '@mui/icons-material/Search';
import ImageIcon from '@mui/icons-material/Image';
import BadgeIcon from '@mui/icons-material/Badge';
import { useNavigate } from 'react-router-dom';
import ReactCrop, { centerCrop, makeAspectCrop, type Crop, type PixelCrop } from 'react-image-crop';
import { v4 as uuid } from 'uuid';
import { toast } from 'react-toastify';
import 'react-image-crop/dist/ReactCrop.css';

import ReadonlyGeoMap from '../../components/map/ReadonlyGeoMap';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import OcrScannerOverlay from '../../components/ui/OcrScannerOverlay';

import { getBrowserLocation } from '../../utils/geolocation';
import type { GeoSnapshot, PersonFormData } from '../../types/person';
import type { SurveyAnswers, SurveyRecord } from '../../types/survey';
import type { SectionItem } from '../../types/section';

import { respondentsStore } from '../../store/respondents.store';
import { authStore } from '../../store/auth.store';
import { scanIneAndSplit } from '../../services/ocr.service';
import { getSecciones } from '../../services/sections.service';

const surveyPages = [
  // 📚 Definición de páginas temáticas para dividir el cuestionario.
  {
    title: 'Filtros e introducción',
    fields: ['hasValidCredential', 'sexoObservado', 'rangoEdad', 'escolaridad'],
  },
  {
    title: 'Reconocimiento',
    fields: ['conoceGino', 'conoceLatifa', 'conocePalazuelos', 'importanciaPoliticos'],
  },
  {
    title: 'Desempeño',
    fields: ['ginoDebeSeguir', 'opinionGino', 'atributoGino'],
  },
  {
    title: 'Problemáticas y cierre',
    fields: ['problemaNacional', 'problemaLocal', 'resultado', 'observaciones'],
  },
] as const;

const emptyAnswers: SurveyAnswers = {
  // 🧼 Estado base reutilizable en alta nueva y reinicios.
  hasValidCredential: '',
  sexoObservado: '',
  rangoEdad: '',
  escolaridad: '',
  conoceGino: '',
  conoceLatifa: '',
  conocePalazuelos: '',
  importanciaPoliticos: '',
  ginoDebeSeguir: '',
  opinionGino: '',
  atributoGino: '',
  problemaNacional: '',
  problemaNacionalOtro: '',
  problemaLocal: '',
  problemaLocalOtro: '',
  resultado: 'Completa',
  observaciones: '',
};

const INE_ASPECT_RATIO = 1.58;

function createCenteredIneCrop(mediaWidth: number, mediaHeight: number) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 88,
      },
      INE_ASPECT_RATIO,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

async function createCroppedImageFile(
  image: HTMLImageElement,
  crop: PixelCrop,
  fileName: string
) {
  const canvas = document.createElement('canvas');
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  canvas.width = Math.max(1, Math.floor(crop.width * scaleX));
  canvas.height = Math.max(1, Math.floor(crop.height * scaleY));

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('No se pudo inicializar el canvas para el recorte.');
  }

  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    canvas.width,
    canvas.height
  );

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((value) => resolve(value), 'image/jpeg', 0.95);
  });

  if (!blob) {
    throw new Error('No se pudo generar la imagen recortada.');
  }

  return new File([blob], fileName.replace(/\.[^.]+$/, '') + '-ine.jpg', {
    type: 'image/jpeg',
  });
}

function createEmptyPerson(mode: 'manual' | 'ocr', geo: GeoSnapshot): PersonFormData {
  // 🧍 Fábrica del estado inicial de persona con folio y geo.
  return {
    folio: `FOL-${Date.now()}`,
    nombres: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    sexo: '',
    fechaNacimiento: '',
    curp: '',
    claveElector: '',
    calle: '',
    numero: '',
    colonia: '',
    codigoPostal: '',
    municipio: '',
    estado: '',
    seccion: '',
    vigencia: '',
    tipoCredencial: '',
    fuenteCaptura: mode,
    geo,
  };
}

export default function SurveyNewPage() {
  const navigate = useNavigate();

  const [tab, setTab] = useState(0);
  const [geo, setGeo] = useState<GeoSnapshot | null>(null);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);

  const [page, setPage] = useState(1);
  const [personMode, setPersonMode] = useState<'manual' | 'ocr'>('manual');
  const [person, setPerson] = useState<PersonFormData | null>(null);
  const [answers, setAnswers] = useState<SurveyAnswers>(emptyAnswers);

  const [sections, setSections] = useState<SectionItem[]>([]);
  const [sectionsLoading, setSectionsLoading] = useState(false);

  const [ocrFile, setOcrFile] = useState<File | null>(null);
  const [ocrPreview, setOcrPreview] = useState<string>('');
  const [ocrCroppedFile, setOcrCroppedFile] = useState<File | null>(null);
  const [ocrCroppedPreview, setOcrCroppedPreview] = useState('');
  const [ocrLoading, setOcrLoading] = useState(false);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [cropApplied, setCropApplied] = useState(false);

  const ocrImageRef = useRef<HTMLImageElement | null>(null);

  const user = authStore.getUser();

  useEffect(() => {
    // 📍 Intenta capturar ubicación apenas se abre la pantalla.
    getBrowserLocation()
      .then((currentGeo) => {
        setGeo(currentGeo);
        setPerson(createEmptyPerson('manual', currentGeo));
      })
      .catch(() => {
        toast.error('No se pudo obtener la ubicación del navegador 📍');
      });
  }, []);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        // 🗂️ Carga de catálogo oficial de secciones.
        setSectionsLoading(true);
        const data = await getSecciones();
        if (!alive) return;
        setSections(data);
      } catch {
        toast.error('No se pudo cargar el catálogo de secciones ⚠️');
      } finally {
        if (!alive) return;
        setSectionsLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    // 🖼️ Crea una vista previa temporal para la imagen del OCR.
    if (!ocrFile) {
      setOcrPreview('');
      return;
    }

    const objectUrl = URL.createObjectURL(ocrFile);
    setOcrPreview(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [ocrFile]);

  useEffect(() => {
    // ✂️ Vista previa del recorte final que se usará para OCR.
    if (!ocrCroppedFile) {
      setOcrCroppedPreview('');
      return;
    }

    const objectUrl = URL.createObjectURL(ocrCroppedFile);
    setOcrCroppedPreview(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [ocrCroppedFile]);

  useEffect(() => {
    // 🔄 Garantiza que al tener geo exista también un estado inicial de persona.
    if (!geo) return;

    setPerson((prev) => {
      if (prev) return prev;
      return createEmptyPerson(personMode, geo);
    });
  }, [geo, personMode]);

  const completePerson = useMemo(() => {
    // ✅ Regla mínima para desbloquear la pestaña de encuesta.
    return !!person && !!person.nombres && !!person.apellidoPaterno && !!person.seccion;
  }, [person]);

  const selectedSection = useMemo(() => {
    // 🎯 Resuelve la sección seleccionada con su metadata completa.
    return sections.find((section) => String(section.IdSeccion) === String(person?.seccion)) ?? null;
  }, [sections, person?.seccion]);

  const handleStartNew = () => {
    // ♻️ Reinicia toda la entrevista para comenzar otra captura limpia.
    if (!geo) return;

    setTab(0);
    setPage(1);
    setPersonMode('manual');
    setPerson(createEmptyPerson('manual', geo));
    setAnswers(emptyAnswers);
    setOcrFile(null);
    setOcrPreview('');
    setOcrCroppedFile(null);
    setOcrCroppedPreview('');
    setCrop(undefined);
    setCompletedCrop(undefined);
    setCropApplied(false);
    setFinishOpen(false);
    toast.info('Encuesta reiniciada para una nueva persona 🔄');
  };

  const updatePersonField = (field: keyof PersonFormData, value: string | GeoSnapshot) => {
    // ✍️ Setter genérico para campos de persona.
    if (!geo) return;

    setPerson((prev) => ({
      ...(prev ?? createEmptyPerson(personMode, geo)),
      [field]: value,
    }));
  };

  const handleChangeMode = (mode: 'manual' | 'ocr') => {
    // 🔁 Alterna entre captura tradicional y captura asistida por OCR.
    setPersonMode(mode);

    if (!geo) return;

    setPerson((prev) => ({
      ...(prev ?? createEmptyPerson(mode, geo)),
      fuenteCaptura: mode,
      geo,
    }));
  };

  const handleSelectSection = (sectionId: string) => {
    // 🗂️ Completa municipio cuando una sección del catálogo coincide.
    const matched = sections.find((item) => String(item.IdSeccion) === String(sectionId));

    setPerson((prev) => {
      if (!prev || !geo) return prev;
      return {
        ...prev,
        seccion: sectionId,
        municipio: matched?.Municipio ?? prev.municipio,
      };
    });
  };

  const handlePickOcrFile = (file?: File | null) => {
    // 📥 Almacena la imagen seleccionada antes de procesarla.
    if (!file) return;
    setOcrFile(file);
    setOcrCroppedFile(null);
    setCrop(undefined);
    setCompletedCrop(undefined);
    setCropApplied(false);
    toast.info('Imagen cargada. Ahora pulsa "Escanear INE" para procesarla 🪪');
  };

  const handleOcrImageLoad = (event: SyntheticEvent<HTMLImageElement>) => {
    // 🪪 Al cargar la imagen se propone un recorte centrado con proporción de credencial.
    const { width, height } = event.currentTarget;
    ocrImageRef.current = event.currentTarget;
    const nextCrop = createCenteredIneCrop(width, height);
    setCrop(nextCrop);
  };

  const handleApplyCrop = async () => {
    // ✂️ Genera una nueva imagen con solo la credencial visible.
    if (!ocrFile || !ocrImageRef.current || !completedCrop?.width || !completedCrop?.height) {
      toast.warning('Ajusta primero el marco para recortar la credencial 🪪');
      return;
    }

    try {
      const croppedFile = await createCroppedImageFile(
        ocrImageRef.current,
        completedCrop,
        ocrFile.name
      );

      setOcrCroppedFile(croppedFile);
      setCropApplied(true);
      toast.success('Recorte aplicado. Ahora se verá solo la credencial ✂️');
    } catch {
      toast.error('No se pudo aplicar el recorte de la imagen ❌');
    }
  };

  const handleResetCrop = () => {
    // 🔄 Permite regresar al editor de recorte para afinar el encuadre.
    setOcrCroppedFile(null);
    setCropApplied(false);
    if (ocrImageRef.current) {
      setCrop(createCenteredIneCrop(ocrImageRef.current.width, ocrImageRef.current.height));
    }
  };

  const handleScanOcr = async () => {
    // 🪪 Ejecuta el pipeline OCR y mapea la respuesta al formulario interno.
    let fileToScan = ocrCroppedFile ?? ocrFile;

    if (!fileToScan) {
      toast.warning('Primero selecciona una imagen del INE 📷');
      return;
    }

    if (!geo) {
      toast.error('Primero debes permitir la geolocalización 📍');
      return;
    }

    try {
      setOcrLoading(true);

      // ✂️ Si todavía no existe archivo recortado, se genera automáticamente con el marco actual.
      if (!ocrCroppedFile && ocrFile && ocrImageRef.current && completedCrop?.width && completedCrop?.height) {
        fileToScan = await createCroppedImageFile(ocrImageRef.current, completedCrop, ocrFile.name);
        setOcrCroppedFile(fileToScan);
        setCropApplied(true);
      }

      const result = await scanIneAndSplit(fileToScan);

      const matchedSection = sections.find(
        (item) =>
          String(item.IdSeccion).padStart(4, '0') === String(result.mapped.seccion).padStart(4, '0') ||
          String(item.IdSeccion) === String(Number(result.mapped.seccion))
      );

      setPerson((prev) => ({
        ...(prev ?? createEmptyPerson('ocr', geo)),
        folio: prev?.folio ?? `FOL-${Date.now()}`,
        nombres: result.mapped.nombres,
        apellidoPaterno: result.mapped.apellidoPaterno,
        apellidoMaterno: result.mapped.apellidoMaterno,
        sexo: result.mapped.sexo,
        fechaNacimiento: result.mapped.fechaNacimiento,
        curp: result.mapped.curp,
        claveElector: result.mapped.claveElector,
        calle: result.mapped.calle,
        numero: result.mapped.numero,
        colonia: result.mapped.colonia,
        codigoPostal: result.mapped.codigoPostal,
        municipio: matchedSection?.Municipio ?? result.mapped.municipio,
        estado: result.mapped.estado,
        seccion: matchedSection ? String(matchedSection.IdSeccion) : String(Number(result.mapped.seccion) || ''),
        vigencia: result.mapped.vigencia,
        tipoCredencial: result.mapped.tipoCredencial,
        fuenteCaptura: 'ocr',
        geo,
      }));

      if (result.warningMessage) {
        toast.warning(result.warningMessage);
      } else {
        toast.success('INE escaneada correctamente ✅');
      }
    } catch {
      toast.error('No fue posible procesar la imagen del INE ❌');
    } finally {
      setOcrLoading(false);
    }
  };

  const handleSave = () => {
    // 💾 Construye y persiste el registro final de la encuesta.
    if (!person || !geo) return;

    const now = new Date().toISOString();

    const record: SurveyRecord = {
      id: uuid(),
      createdAt: now,
      startedAt: geo.capturedAt,
      finishedAt: now,
      interviewerName: user?.nombre ?? 'Sin nombre',
      sectionPriorityLabel: selectedSection
        ? `Sección ${selectedSection.IdSeccion} · ${selectedSection.Municipio}`
        : `Sección ${person.seccion}`,
      person,
      answers,
    };

    respondentsStore.save(record);
    setConfirmSaveOpen(false);
    setFinishOpen(true);
    toast.success('Encuesta terminada y guardada ✅');
  };

  const sectionMenuItems = sections.map((section) => (
    <MenuItem key={section.IdSeccion} value={String(section.IdSeccion)}>
      {section.IdSeccion} · {section.Municipio}
    </MenuItem>
  ));

  return (
    <>
      {/* 🪪 Overlay especializado para el proceso OCR */}
      <OcrScannerOverlay
        open={ocrLoading}
        title="Escaneando credencial..."
        subtitle="Extrayendo datos y separando nombres 🧠"
      />

      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900 }}>
            Realizar encuesta 📝
          </Typography>
          <Typography color="text.secondary">
            Alta de persona + encuesta paginada + ubicación geográfica en solo lectura.
          </Typography>
        </Box>

        {geo ? (
          <ReadonlyGeoMap geo={geo} compact />
        ) : (
          <Alert severity="warning">Permite la geolocalización para continuar.</Alert>
        )}

        {/* 🪜 Paso macro del flujo: alta y cuestionario */}
        <Card>
          <CardContent>
            <Stepper activeStep={tab} alternativeLabel>
              {['Alta de persona', 'Encuesta'].map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </CardContent>
        </Card>

        {/* 🧭 Contenedor maestro de la captura */}
        <Card>
          <CardContent>
            <Tabs value={tab} onChange={(_, value) => setTab(value)}>
              <Tab label="Alta de persona" />
              <Tab label="Encuesta" disabled={!completePerson} />
            </Tabs>

            <Divider sx={{ my: 2 }} />

            {tab === 0 && geo && (
              <Stack spacing={2.5}>
                {/* 🎛️ Barra de acciones de la etapa de persona */}
                <Stack
                  direction={{ xs: 'column', md: 'row' }}
                  spacing={1.2}
                  justifyContent="space-between"
                  alignItems={{ xs: 'stretch', md: 'center' }}
                >
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Chip
                      label={personMode === 'manual' ? 'Captura manual ✍️' : 'Captura OCR 📷'}
                      color="primary"
                    />

                    <Button
                      variant={personMode === 'manual' ? 'contained' : 'outlined'}
                      onClick={() => handleChangeMode('manual')}
                    >
                      Manual
                    </Button>

                    <Button
                      variant={personMode === 'ocr' ? 'contained' : 'outlined'}
                      onClick={() => handleChangeMode('ocr')}
                    >
                      OCR
                    </Button>
                  </Stack>

                  <Button
                    color="error"
                    variant="outlined"
                    startIcon={<RestartAltIcon />}
                    onClick={() => setCancelOpen(true)}
                    sx={{ borderRadius: 999 }}
                  >
                    Cancelar entrevista
                  </Button>
                </Stack>

                {personMode === 'ocr' && (
                  <Card
                    sx={{
                      borderRadius: 4,
                      border: '1px solid rgba(108,56,65,0.12)',
                      background:
                        'linear-gradient(135deg, rgba(108,56,65,0.03) 0%, rgba(108,56,65,0.07) 100%)',
                      boxShadow: 'none',
                    }}
                  >
                    <CardContent>
                      <Stack spacing={2.2}>
                        {/* 🪪 Panel visual del flujo OCR */}
                        <Stack direction="row" spacing={1.2} alignItems="center">
                          <CameraAltIcon sx={{ color: '#6C3841' }} />
                          <Box>
                            <Typography sx={{ fontWeight: 800, color: '#6C3841' }}>
                              Captura OCR del INE 🪪
                            </Typography>
                            <Typography color="text.secondary">
                              Primero selecciona la imagen, encuadra solo la credencial y después pulsa
                              <strong> Escanear INE</strong>.
                            </Typography>
                          </Box>
                        </Stack>

                        <Stack
                          direction={{ xs: 'column', md: 'row' }}
                          spacing={1.5}
                          alignItems={{ xs: 'stretch', md: 'center' }}
                          justifyContent="space-between"
                        >
                          {/* 📤 Selección de imagen desde el dispositivo */}
                          <Button
                            component="label"
                            variant="outlined"
                            startIcon={<UploadFileIcon />}
                            sx={{
                              borderRadius: 999,
                              fontWeight: 700,
                              alignSelf: 'flex-start',
                            }}
                          >
                            Seleccionar imagen
                            <input
                              hidden
                              type="file"
                              accept="image/*"
                              onChange={(e) => handlePickOcrFile(e.target.files?.[0])}
                            />
                          </Button>

                          {/* 🔍 Disparo manual del análisis OCR */}
                          <Button
                            color={cropApplied ? 'success' : 'primary'}
                            variant="contained"
                            startIcon={ocrLoading ? <CircularProgress size={18} color="inherit" /> : <SearchIcon />}
                            disabled={!ocrFile || ocrLoading}
                            onClick={handleScanOcr}
                            sx={{ borderRadius: 999, fontWeight: 800 }}
                          >
                            {ocrLoading ? 'Escaneando...' : 'Escanear INE'}
                          </Button>
                        </Stack>

                        {!ocrPreview && (
                          <Alert severity="info" icon={<ImageIcon fontSize="inherit" />}>
                            Aún no has cargado ninguna imagen del INE.
                          </Alert>
                        )}

                        {ocrFile && (
                          <Box
                            sx={{
                              borderRadius: 4,
                              overflow: 'hidden',
                              border: '1px solid rgba(108,56,65,0.12)',
                              bgcolor: '#fff',
                            }}
                          >
                            <Box
                              sx={{
                                px: 2,
                                py: 1.2,
                                borderBottom: '1px solid rgba(108,56,65,0.10)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 2,
                              }}
                            >
                              <Box>
                                <Typography sx={{ fontWeight: 800 }}>
                                  {cropApplied ? 'Vista final del INE ✨' : 'Ajuste del recorte del INE ✂️'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {cropApplied
                                    ? 'Se usará solo la credencial para el OCR'
                                    : 'Mueve el marco para dejar fuera mesa, fondo o bordes innecesarios'}
                                </Typography>
                              </Box>

                              <Chip
                                icon={<BadgeIcon />}
                                label={cropApplied ? 'Recorte aplicado' : 'Ajusta el recorte'}
                                color={cropApplied ? 'success' : 'primary'}
                                variant="outlined"
                              />
                            </Box>

                            <Box
                              sx={{
                                p: 2,
                                display: 'grid',
                                placeItems: 'center',
                                bgcolor: '#f7f3f4',
                              }}
                            >
                              {!cropApplied ? (
                                <Stack spacing={1.5} alignItems="center" sx={{ width: '100%' }}>
                                  <Box
                                    sx={{
                                      width: '100%',
                                      maxWidth: 620,
                                      borderRadius: 4,
                                      overflow: 'hidden',
                                      border: '1px solid rgba(108,56,65,0.10)',
                                      boxShadow: '0 12px 34px rgba(0,0,0,0.08)',
                                      bgcolor: '#fff',
                                    }}
                                  >
                                    <ReactCrop
                                      crop={crop}
                                      onChange={(nextCrop) => setCrop(nextCrop)}
                                      onComplete={(nextCrop) => setCompletedCrop(nextCrop)}
                                      aspect={INE_ASPECT_RATIO}
                                      keepSelection
                                      ruleOfThirds
                                    >
                                      <img
                                        ref={ocrImageRef}
                                        src={ocrPreview}
                                        alt="Recorte del INE"
                                        onLoad={handleOcrImageLoad}
                                        style={{
                                          display: 'block',
                                          width: '100%',
                                          maxHeight: '420px',
                                          objectFit: 'contain',
                                          background: '#fff',
                                        }}
                                      />
                                    </ReactCrop>
                                  </Box>

                                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2}>
                                    <Button
                                      variant="contained"
                                      onClick={handleApplyCrop}
                                      sx={{ borderRadius: 999, fontWeight: 800 }}
                                    >
                                      Aplicar recorte ✂️
                                    </Button>
                                  </Stack>
                                </Stack>
                              ) : (
                                <Stack spacing={1.5} alignItems="center" sx={{ width: '100%' }}>
                                  <Box
                                    component="img"
                                    src={ocrCroppedPreview}
                                    alt="Vista recortada del INE"
                                    sx={{
                                      width: '100%',
                                      maxWidth: 620,
                                      maxHeight: 340,
                                      objectFit: 'contain',
                                      borderRadius: 3,
                                      boxShadow: '0 12px 34px rgba(0,0,0,0.10)',
                                      border: '1px solid rgba(108,56,65,0.08)',
                                      bgcolor: 'white',
                                    }}
                                  />

                                  <Button
                                    variant="outlined"
                                    onClick={handleResetCrop}
                                    sx={{ borderRadius: 999, fontWeight: 700 }}
                                  >
                                    Ajustar recorte otra vez 🔁
                                  </Button>
                                </Stack>
                              )}
                            </Box>
                          </Box>
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
                )}

                <Grid container spacing={2}>
                  {/* 🧍 Formulario de datos personales */}
                  <Grid item xs={12} md={4}>
                    <TextField
                      label="Folio"
                      value={person?.folio ?? ''}
                      onChange={(e) => updatePersonField('folio', e.target.value)}
                      fullWidth
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <TextField
                      label="Nombres"
                      value={person?.nombres ?? ''}
                      onChange={(e) => updatePersonField('nombres', e.target.value)}
                      fullWidth
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <TextField
                      label="Apellido paterno"
                      value={person?.apellidoPaterno ?? ''}
                      onChange={(e) => updatePersonField('apellidoPaterno', e.target.value)}
                      fullWidth
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <TextField
                      label="Apellido materno"
                      value={person?.apellidoMaterno ?? ''}
                      onChange={(e) => updatePersonField('apellidoMaterno', e.target.value)}
                      fullWidth
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <TextField
                      select
                      label="Sexo"
                      value={person?.sexo ?? ''}
                      onChange={(e) => updatePersonField('sexo', e.target.value)}
                      fullWidth
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
                      value={person?.fechaNacimiento ?? ''}
                      onChange={(e) => updatePersonField('fechaNacimiento', e.target.value)}
                      fullWidth
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <TextField
                      label="CURP"
                      value={person?.curp ?? ''}
                      onChange={(e) => updatePersonField('curp', e.target.value.toUpperCase())}
                      fullWidth
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <TextField
                      label="Clave de elector"
                      value={person?.claveElector ?? ''}
                      onChange={(e) => updatePersonField('claveElector', e.target.value.toUpperCase())}
                      fullWidth
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <TextField
                      select
                      label="Sección"
                      value={person?.seccion ?? ''}
                      onChange={(e) => handleSelectSection(e.target.value)}
                      fullWidth
                      disabled={sectionsLoading}
                      helperText={
                        sectionsLoading
                          ? 'Cargando catálogo de secciones...'
                          : 'Selecciona una sección del catálogo oficial'
                      }
                    >
                      {sectionMenuItems}
                    </TextField>
                  </Grid>

                  <Grid item xs={12} md={8}>
                    <TextField
                      label="Calle"
                      value={person?.calle ?? ''}
                      onChange={(e) => updatePersonField('calle', e.target.value)}
                      fullWidth
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <TextField
                      label="Número"
                      value={person?.numero ?? ''}
                      onChange={(e) => updatePersonField('numero', e.target.value)}
                      fullWidth
                    />
                  </Grid>

                  <Grid item xs={12} md={8}>
                    <TextField
                      label="Colonia"
                      value={person?.colonia ?? ''}
                      onChange={(e) => updatePersonField('colonia', e.target.value)}
                      fullWidth
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <TextField
                      label="Código postal"
                      value={person?.codigoPostal ?? ''}
                      onChange={(e) => updatePersonField('codigoPostal', e.target.value)}
                      fullWidth
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Municipio"
                      value={person?.municipio ?? ''}
                      onChange={(e) => updatePersonField('municipio', e.target.value)}
                      fullWidth
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Estado"
                      value={person?.estado ?? ''}
                      onChange={(e) => updatePersonField('estado', e.target.value)}
                      fullWidth
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Vigencia"
                      value={person?.vigencia ?? ''}
                      onChange={(e) => updatePersonField('vigencia', e.target.value)}
                      fullWidth
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Tipo credencial"
                      value={person?.tipoCredencial ?? ''}
                      onChange={(e) => updatePersonField('tipoCredencial', e.target.value)}
                      fullWidth
                    />
                  </Grid>
                </Grid>

                <Stack direction="row" justifyContent="flex-end">
                  {/* ➡️ Avance a la siguiente etapa */}
                  <Button
                    variant="contained"
                    disabled={!completePerson}
                    onClick={() => setTab(1)}
                    sx={{ borderRadius: 999, fontWeight: 800 }}
                  >
                    Continuar a encuesta ➡️
                  </Button>
                </Stack>
              </Stack>
            )}

            {tab === 1 && (
              <Stack spacing={2.5}>
                {/* 🧠 Encabezado contextual del cuestionario */}
                <Stack
                  direction={{ xs: 'column', md: 'row' }}
                  justifyContent="space-between"
                  spacing={1}
                >
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                      Encuesta ciudadana
                    </Typography>
                    <Typography color="text.secondary">
                      Página {page} de {surveyPages.length}: {surveyPages[page - 1].title}
                    </Typography>
                  </Box>

                  <Button
                    color="error"
                    variant="outlined"
                    startIcon={<RestartAltIcon />}
                    onClick={() => setCancelOpen(true)}
                    sx={{ borderRadius: 999 }}
                  >
                    Cancelar entrevista
                  </Button>
                </Stack>

                {page === 1 && (
                  <>
                    {/* 1️⃣ Filtros e introducción */}
                    <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        select
                        label="1. Credencial vigente"
                        value={answers.hasValidCredential}
                        onChange={(e) =>
                          setAnswers({ ...answers, hasValidCredential: e.target.value as any })
                        }
                        fullWidth
                      >
                        {['Si', 'No'].map((v) => (
                          <MenuItem key={v} value={v}>
                            {v}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        select
                        label="2. Sexo observado"
                        value={answers.sexoObservado}
                        onChange={(e) =>
                          setAnswers({ ...answers, sexoObservado: e.target.value as any })
                        }
                        fullWidth
                      >
                        {['Hombre', 'Mujer', 'Otro'].map((v) => (
                          <MenuItem key={v} value={v}>
                            {v}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        select
                        label="3. Rango de edad"
                        value={answers.rangoEdad}
                        onChange={(e) => setAnswers({ ...answers, rangoEdad: e.target.value as any })}
                        fullWidth
                      >
                        {['18 a 29', '30 a 44', '45 a 59', '60 o más'].map((v) => (
                          <MenuItem key={v} value={v}>
                            {v}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        select
                        label="4. Escolaridad"
                        value={answers.escolaridad}
                        onChange={(e) =>
                          setAnswers({ ...answers, escolaridad: e.target.value as any })
                        }
                        fullWidth
                      >
                        {[
                          'Primaria / Secundaria',
                          'Bachillerato / Preparatoria',
                          'Universidad / Posgrado',
                          'Sin estudios oficiales',
                        ].map((v) => (
                          <MenuItem key={v} value={v}>
                            {v}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    </Grid>
                  </>
                )}

                {page === 2 && (
                  <>
                    {/* 2️⃣ Reconocimiento de figuras públicas */}
                    <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <TextField
                        select
                        label="5. ¿Conoce a Gino Segura?"
                        value={answers.conoceGino}
                        onChange={(e) => setAnswers({ ...answers, conoceGino: e.target.value as any })}
                        fullWidth
                      >
                        {['Si', 'No'].map((v) => (
                          <MenuItem key={v} value={v}>
                            {v}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <TextField
                        select
                        label="¿Conoce a Latifa Martínez?"
                        value={answers.conoceLatifa}
                        onChange={(e) =>
                          setAnswers({ ...answers, conoceLatifa: e.target.value as any })
                        }
                        fullWidth
                      >
                        {['Si', 'No'].map((v) => (
                          <MenuItem key={v} value={v}>
                            {v}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <TextField
                        select
                        label="¿Conoce a Roberto Palazuelos?"
                        value={answers.conocePalazuelos}
                        onChange={(e) =>
                          setAnswers({ ...answers, conocePalazuelos: e.target.value as any })
                        }
                        fullWidth
                      >
                        {['Si', 'No'].map((v) => (
                          <MenuItem key={v} value={v}>
                            {v}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        select
                        label="6. Importancia del contacto directo"
                        value={answers.importanciaPoliticos}
                        onChange={(e) =>
                          setAnswers({ ...answers, importanciaPoliticos: e.target.value as any })
                        }
                        fullWidth
                      >
                        {[
                          'Muy importante',
                          'Algo importante',
                          'Poco importante',
                          'Nada importante',
                          'NS/NC',
                        ].map((v) => (
                          <MenuItem key={v} value={v}>
                            {v}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    </Grid>
                  </>
                )}

                {page === 3 && (
                  <>
                    {/* 3️⃣ Desempeño y percepción */}
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        select
                        label="7. Labor de cercanía de Gino Segura"
                        value={answers.ginoDebeSeguir}
                        onChange={(e) =>
                          setAnswers({ ...answers, ginoDebeSeguir: e.target.value as any })
                        }
                        fullWidth
                      >
                        {[
                          'Debe seguir recorriendo el estado y escuchando a la gente.',
                          'Debe enfocarse solo en el trabajo de oficina.',
                          'NS/NC',
                        ].map((v) => (
                          <MenuItem key={v} value={v}>
                            {v}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        select
                        label="8. Opinión de Gino Segura"
                        value={answers.opinionGino}
                        onChange={(e) => setAnswers({ ...answers, opinionGino: e.target.value as any })}
                        fullWidth
                      >
                        {[
                          'Muy Buena',
                          'Buena',
                          'Regular',
                          'Mala',
                          'Muy Mala',
                          'No conoce / No contestó',
                        ].map((v) => (
                          <MenuItem key={v} value={v}>
                            {v}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        select
                        label="9. Principal atributo asociado"
                        value={answers.atributoGino}
                        onChange={(e) => setAnswers({ ...answers, atributoGino: e.target.value as any })}
                        fullWidth
                      >
                        {[
                          'Honestidad',
                          'Experiencia',
                          'Juventud / Renovación',
                          'Capacidad técnica',
                          'Cercanía con la gente',
                        ].map((v) => (
                          <MenuItem key={v} value={v}>
                            {v}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                  </Grid>
                  </>
                )}

                {page === 4 && (
                  <>
                    {/* 4️⃣ Problemáticas y cierre */}
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        select
                        label="10. Problemática nacional"
                        value={answers.problemaNacional}
                        onChange={(e) => setAnswers({ ...answers, problemaNacional: e.target.value })}
                        fullWidth
                      >
                        {[
                          'Inseguridad y violencia',
                          'El alto costo de la vida (Inflación)',
                          'Corrupción',
                          'Falta de oportunidades para jóvenes',
                          'Falta de medicamentos / Salud',
                          'Medio ambiente',
                          'Otro',
                        ].map((v) => (
                          <MenuItem key={v} value={v}>
                            {v}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>

                    {answers.problemaNacional === 'Otro' && (
                      <Grid item xs={12} md={6}>
                        <TextField
                          label="Otro problema nacional"
                          value={answers.problemaNacionalOtro}
                          onChange={(e) =>
                            setAnswers({ ...answers, problemaNacionalOtro: e.target.value })
                          }
                          fullWidth
                        />
                      </Grid>
                    )}

                    <Grid item xs={12} md={6}>
                      <TextField
                        select
                        label="11. Problemática local"
                        value={answers.problemaLocal}
                        onChange={(e) => setAnswers({ ...answers, problemaLocal: e.target.value })}
                        fullWidth
                      >
                        {[
                          'Alumbrado público y bacheo',
                          'Robos o asaltos en la zona',
                          'Falta de agua o drenaje',
                          'Limpieza de parques y recolección de basura',
                          'Otro',
                        ].map((v) => (
                          <MenuItem key={v} value={v}>
                            {v}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>

                    {answers.problemaLocal === 'Otro' && (
                      <Grid item xs={12} md={6}>
                        <TextField
                          label="Otro problema local"
                          value={answers.problemaLocalOtro}
                          onChange={(e) =>
                            setAnswers({ ...answers, problemaLocalOtro: e.target.value })
                          }
                          fullWidth
                        />
                      </Grid>
                    )}

                    <Grid item xs={12} md={6}>
                      <TextField
                        select
                        label="Resultado de la entrevista"
                        value={answers.resultado}
                        onChange={(e) => setAnswers({ ...answers, resultado: e.target.value as any })}
                        fullWidth
                      >
                        {['Completa', 'Rechazada a la mitad'].map((v) => (
                          <MenuItem key={v} value={v}>
                            {v}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        multiline
                        minRows={3}
                        label="Observaciones"
                        value={answers.observaciones}
                        onChange={(e) => setAnswers({ ...answers, observaciones: e.target.value })}
                        fullWidth
                      />
                    </Grid>
                  </Grid>
                  </>
                )}

                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  justifyContent="space-between"
                  spacing={1}
                  alignItems="center"
                >
                  <Pagination
                    count={surveyPages.length}
                    page={page}
                    onChange={(_, value) => setPage(value)}
                    color="primary"
                  />

                  <Stack direction="row" spacing={1}>
                    <Button
                      variant="outlined"
                      disabled={page === 1}
                      onClick={() => setPage((p) => p - 1)}
                      sx={{ borderRadius: 999 }}
                    >
                      ⬅️ Anterior
                    </Button>

                    {page < surveyPages.length ? (
                      <Button
                        variant="contained"
                        onClick={() => setPage((p) => p + 1)}
                        sx={{ borderRadius: 999 }}
                      >
                        Siguiente ➡️
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={() => setConfirmSaveOpen(true)}
                        sx={{ borderRadius: 999, fontWeight: 800 }}
                      >
                        Confirmar encuesta
                      </Button>
                    )}
                  </Stack>
                </Stack>
              </Stack>
            )}
          </CardContent>
        </Card>

        <ConfirmDialog
          open={cancelOpen}
          title="Cancelar entrevista"
          content="Se perderá la captura actual y volverás al inicio. ¿Deseas continuar?"
          confirmText="Sí, cancelar"
          onClose={() => setCancelOpen(false)}
          onConfirm={() => {
            setCancelOpen(false);
            handleStartNew();
          }}
        />

        <ConfirmDialog
          open={confirmSaveOpen}
          title="Confirmar encuesta"
          content="¿Deseas guardar esta encuesta?"
          confirmText="Guardar"
          onClose={() => setConfirmSaveOpen(false)}
          onConfirm={handleSave}
        />

        <ConfirmDialog
          open={finishOpen}
          title="Encuesta terminada"
          content="La encuesta fue guardada correctamente. ¿Deseas capturar una nueva o ir al listado?"
          confirmText="Ver listado"
          cancelText="Nueva encuesta"
          onClose={() => {
            setFinishOpen(false);
            handleStartNew();
          }}
          onConfirm={() => navigate('/respondents')}
        />
      </Stack>
    </>
  );
}
