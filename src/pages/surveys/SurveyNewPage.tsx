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
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
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
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import { useNavigate } from 'react-router-dom';
import ReactCrop, { centerCrop, makeAspectCrop, type Crop, type PixelCrop } from 'react-image-crop';
import { toast } from 'react-toastify';
import 'react-image-crop/dist/ReactCrop.css';

import ReadonlyGeoMap from '../../components/map/ReadonlyGeoMap';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import OcrScannerOverlay from '../../components/ui/OcrScannerOverlay';

import { getBrowserLocation } from '../../utils/geolocation';
import type { GeoSnapshot, PersonFormData } from '../../types/person';
import type { SurveyAnswers } from '../../types/survey';
import type { SectionItem } from '../../types/section';

import { scanIneAndSplit } from '../../services/ocr.service';
import { getSecciones } from '../../services/sections.service';
import {
  buildPersonFingerprint,
  createRespondentPerson,
  findRespondentDuplicateByClaveElector,
  saveSurveyAnswers,
  updateRespondentPerson,
  type DuplicateRespondentMatch,
} from '../../services/respondents.service';

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
const surveyStepCardSx = {
  borderRadius: 4,
  border: '1px solid rgba(108,56,65,0.12)',
  background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,243,244,0.92) 100%)',
  boxShadow: '0 12px 30px rgba(108,56,65,0.06)',
} as const;

const surveyStepCardContentSx = {
  p: { xs: 2, md: 3.5 },
  pr: { xs: 2, md: 4.5 },
} as const;

const surveyGridSx = {
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
  '& .MuiInputLabel-root': {
    fontWeight: 600,
  },
} as const;

const personGridSx = {
  width: '100%',
  margin: 0,
  pr: { xs: 1.5, md: 4, lg: 5.5 },
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

type MissingAnswerItem = {
  field: keyof SurveyAnswers;
  page: number;
  questionNumber: string;
  label: string;
};

const surveyQuestionMeta: Array<MissingAnswerItem> = [
  { field: 'hasValidCredential', page: 1, questionNumber: '1', label: 'Credencial vigente' },
  { field: 'sexoObservado', page: 1, questionNumber: '2', label: 'Sexo observado' },
  { field: 'rangoEdad', page: 1, questionNumber: '3', label: 'Rango de edad' },
  { field: 'escolaridad', page: 1, questionNumber: '4', label: 'Escolaridad' },
  { field: 'conoceGino', page: 2, questionNumber: '5', label: '¿Conoce a Gino Segura?' },
  { field: 'conoceLatifa', page: 2, questionNumber: '5', label: '¿Conoce a Latifa Martínez?' },
  { field: 'conocePalazuelos', page: 2, questionNumber: '5', label: '¿Conoce a Roberto Palazuelos?' },
  { field: 'importanciaPoliticos', page: 2, questionNumber: '6', label: 'Importancia del contacto directo' },
  { field: 'ginoDebeSeguir', page: 3, questionNumber: '7', label: 'Labor de cercanía de Gino Segura' },
  { field: 'opinionGino', page: 3, questionNumber: '8', label: 'Opinión de Gino Segura' },
  { field: 'atributoGino', page: 3, questionNumber: '9', label: 'Principal atributo asociado' },
  { field: 'problemaNacional', page: 4, questionNumber: '10', label: 'Problemática nacional' },
  { field: 'problemaLocal', page: 4, questionNumber: '11', label: 'Problemática local' },
];

function findMissingSurveyAnswers(answers: SurveyAnswers) {
  return surveyQuestionMeta.filter((item) => {
    const value = answers[item.field];
    return String(value ?? '').trim() === '';
  });
}

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
    telefono: '',
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

type PersonErrorMap = Partial<Record<'nombres' | 'apellidoPaterno' | 'claveElector' | 'seccion' | 'calle' | 'telefono', string>>;

function validateRequiredPersonFields(person: PersonFormData | null): PersonErrorMap {
  if (!person) {
    return {
      nombres: 'Es requerido',
      apellidoPaterno: 'Es requerido',
      claveElector: 'Es requerido',
      seccion: 'Es requerido',
      calle: 'Es requerido',
      telefono: 'Es requerido',
    };
  }

  return {
    nombres: person.nombres.trim() ? '' : 'Es requerido',
    apellidoPaterno: person.apellidoPaterno.trim() ? '' : 'Es requerido',
    claveElector: person.claveElector.trim() ? '' : 'Es requerido',
    seccion: person.seccion.trim() ? '' : 'Es requerido',
    calle: person.calle.trim() ? '' : 'Es requerido',
    telefono: person.telefono.trim() ? '' : 'Es requerido',
  };
}

export default function SurveyNewPage() {
  const navigate = useNavigate();

  const [tab, setTab] = useState(0);
  const [geo, setGeo] = useState<GeoSnapshot | null>(null);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);
  const [showPersonErrors, setShowPersonErrors] = useState(false);
  const [missingAnswersDialogOpen, setMissingAnswersDialogOpen] = useState(false);
  const [missingAnswers, setMissingAnswers] = useState<MissingAnswerItem[]>([]);

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
  const [questionnaireId, setQuestionnaireId] = useState<number | null>(null);
  const [persistedPersonFingerprint, setPersistedPersonFingerprint] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [duplicateMatch, setDuplicateMatch] = useState<DuplicateRespondentMatch | null>(null);

  const ocrImageRef = useRef<HTMLImageElement | null>(null);
  const answerFieldRefs = useRef<Partial<Record<keyof SurveyAnswers, HTMLInputElement | HTMLTextAreaElement | null>>>({});
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
    const errors = validateRequiredPersonFields(person);
    return Object.values(errors).every((value) => !value);
  }, [person]);

  const personErrors = useMemo(() => validateRequiredPersonFields(person), [person]);

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
    setShowPersonErrors(false);
    setMissingAnswersDialogOpen(false);
    setMissingAnswers([]);
    setQuestionnaireId(null);
    setPersistedPersonFingerprint(null);
    setSubmitting(false);
    setDuplicateDialogOpen(false);
    setDuplicateMatch(null);
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
        telefono: prev?.telefono ?? '',
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

  const handleContinueToSurvey = async () => {
    const errors = validateRequiredPersonFields(person);
    setShowPersonErrors(true);

    if (Object.values(errors).some(Boolean)) {
      toast.warning('Completa los campos obligatorios marcados en rojo ⚠️');
      return;
    }

    try {
      setSubmitting(true);
      if (!questionnaireId) {
        const duplicate = await findRespondentDuplicateByClaveElector(person?.claveElector ?? '');
        if (duplicate) {
          setDuplicateMatch(duplicate);
          setDuplicateDialogOpen(true);
          return;
        }
      }

      const id = await persistPerson();
      if (!id) return;
      setTab(1);
    } catch {
      toast.error('No se pudo guardar el alta de la persona ❌');
    } finally {
      setSubmitting(false);
    }
  };

  const handleContinueAfterDuplicateWarning = async () => {
    try {
      setDuplicateDialogOpen(false);
      setSubmitting(true);
      const id = await persistPerson();
      if (!id) return;
      setTab(1);
    } catch {
      toast.error('No se pudo guardar el alta de la persona ❌');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSave = () => {
    void (async () => {
      // 💾 Asegura primero la persistencia de persona y después almacena respuestas.
      if (!person || !geo) return;

      try {
        setSubmitting(true);
        const id = await persistPerson();
        if (!id) return;

        await saveSurveyAnswers(id, answers);
        setConfirmSaveOpen(false);
        setFinishOpen(true);
        toast.success('Encuesta terminada y guardada ✅');
      } catch {
        toast.error('No se pudo guardar la encuesta en el servidor ❌');
      } finally {
        setSubmitting(false);
      }
    })();
  };

  const handleValidateSurveyBeforeSave = () => {
    const missing = findMissingSurveyAnswers(answers);
    if (!missing.length) {
      setConfirmSaveOpen(true);
      return;
    }

    setMissingAnswers(missing);
    setMissingAnswersDialogOpen(true);
  };

  const handleGoToFirstMissingAnswer = () => {
    const firstMissing = missingAnswers[0];
    if (!firstMissing) {
      setMissingAnswersDialogOpen(false);
      return;
    }

    setMissingAnswersDialogOpen(false);
    setPage(firstMissing.page);

    window.setTimeout(() => {
      answerFieldRefs.current[firstMissing.field]?.focus();
    }, 80);
  };

  const persistPerson = async () => {
    if (!person) return null;

    const fingerprint = buildPersonFingerprint(person);

    if (questionnaireId && fingerprint === persistedPersonFingerprint) {
      return questionnaireId;
    }

    if (questionnaireId) {
      const response = await updateRespondentPerson(questionnaireId, person);
      setPersistedPersonFingerprint(fingerprint);
      setPerson((prev) =>
        prev
          ? {
              ...prev,
              folio: response.data.Folio || prev.folio,
            }
          : prev
      );
      return questionnaireId;
    }

    const response = await createRespondentPerson(person);
    setQuestionnaireId(response.IdCuestionario);
    setPersistedPersonFingerprint(fingerprint);
    setPerson((prev) =>
      prev
        ? {
            ...prev,
            folio: response.folio || prev.folio,
          }
        : prev
    );
    return response.IdCuestionario;
  };

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

                <Box sx={{ px: { xs: 0.5, md: 1.5 }, pr: { xs: 1.5, md: 3.5, lg: 5 } }}>
                  <Grid
                    container
                    rowSpacing={{ xs: 2.5, md: 3 }}
                    columnSpacing={{ xs: 0, md: 3.5, lg: 4 }}
                    sx={personGridSx}
                  >
                  {/* 🧍 Formulario de datos personales */}
                  <Grid item xs={12} md={4}>
                    <TextField
                      label="Nombres"
                      value={person?.nombres ?? ''}
                      onChange={(e) => updatePersonField('nombres', e.target.value)}
                      error={showPersonErrors && !!personErrors.nombres}
                      helperText={showPersonErrors && personErrors.nombres ? personErrors.nombres : ' '}
                      fullWidth
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <TextField
                      label="Apellido paterno"
                      value={person?.apellidoPaterno ?? ''}
                      onChange={(e) => updatePersonField('apellidoPaterno', e.target.value)}
                      error={showPersonErrors && !!personErrors.apellidoPaterno}
                      helperText={
                        showPersonErrors && personErrors.apellidoPaterno ? personErrors.apellidoPaterno : ' '
                      }
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
                      label="Teléfono"
                      value={person?.telefono ?? ''}
                      onChange={(e) =>
                        updatePersonField('telefono', e.target.value.replace(/[^\d+()\-\s]/g, ''))
                      }
                      error={showPersonErrors && !!personErrors.telefono}
                      helperText={showPersonErrors && personErrors.telefono ? personErrors.telefono : ' '}
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
                      error={showPersonErrors && !!personErrors.claveElector}
                      helperText={
                        showPersonErrors && personErrors.claveElector ? personErrors.claveElector : ' '
                      }
                      fullWidth
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Autocomplete
                      options={sections}
                      value={selectedSection}
                      onChange={(_, value) => handleSelectSection(value ? String(value.IdSeccion) : '')}
                      getOptionLabel={(option) => `${option.IdSeccion} · ${option.Municipio}`}
                      isOptionEqualToValue={(option, value) => option.IdSeccion === value.IdSeccion}
                      disabled={sectionsLoading}
                      noOptionsText={sectionsLoading ? 'Cargando catálogo...' : 'No se encontraron secciones'}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Sección"
                          helperText={
                            showPersonErrors && personErrors.seccion
                              ? personErrors.seccion
                              : sectionsLoading
                              ? 'Cargando catálogo de secciones...'
                              : 'Selecciona o busca una sección del catálogo oficial'
                          }
                          error={showPersonErrors && !!personErrors.seccion}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} md={8}>
                    <TextField
                      label="Calle"
                      value={person?.calle ?? ''}
                      onChange={(e) => updatePersonField('calle', e.target.value)}
                      error={showPersonErrors && !!personErrors.calle}
                      helperText={showPersonErrors && personErrors.calle ? personErrors.calle : ' '}
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
                </Box>

                <Stack direction="row" justifyContent="flex-end">
                  {/* ➡️ Avance a la siguiente etapa */}
                  <Button
                    variant="contained"
                    disabled={submitting}
                    onClick={() => void handleContinueToSurvey()}
                    sx={{ borderRadius: 999, fontWeight: 800 }}
                  >
                    Continuar a encuesta ➡️
                  </Button>
                </Stack>
              </Stack>
            )}

            {tab === 1 && (
              <Stack spacing={3}>
                {/* 🧠 Encabezado contextual del cuestionario */}
                <Stack
                  direction={{ xs: 'column', md: 'row' }}
                  justifyContent="space-between"
                  spacing={1.5}
                  alignItems={{ xs: 'stretch', md: 'flex-start' }}
                  sx={{ px: { xs: 0.5, md: 1.5 }, pt: 0.5 }}
                >
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 900 }}>
                      Encuesta ciudadana
                    </Typography>
                    <Typography color="text.secondary" sx={{ fontSize: { xs: '1rem', md: '1.15rem' } }}>
                      Página {page} de {surveyPages.length}: {surveyPages[page - 1].title}
                    </Typography>
                  </Box>

                  <Button
                    color="error"
                    variant="outlined"
                    startIcon={<RestartAltIcon />}
                    onClick={() => setCancelOpen(true)}
                    sx={{ borderRadius: 999, alignSelf: { xs: 'flex-start', md: 'auto' } }}
                  >
                    Cancelar entrevista
                  </Button>
                </Stack>

                {page === 1 && (
                  <Box sx={{ px: { xs: 0.5, md: 1.5 } }}>
                    <Card sx={surveyStepCardSx}>
                      <CardContent sx={surveyStepCardContentSx}>
                        <Stack spacing={2.2}>
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#6C3841' }}>
                              Filtros e introducción
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Esta primera página valida datos básicos del entrevistado. Dejamos más aire entre preguntas para facilitar captura rápida en campo.
                            </Typography>
                          </Box>
                    {/* 1️⃣ Filtros e introducción */}
                    <Grid container rowSpacing={{ xs: 2.5, md: 3 }} columnSpacing={0} sx={surveyGridSx}>
                    <Grid item xs={12}>
                      <TextField
                        select
                        label="1. Credencial vigente"
                        value={answers.hasValidCredential}
                        onChange={(e) =>
                          setAnswers({ ...answers, hasValidCredential: e.target.value as any })
                        }
                        inputRef={(node) => {
                          answerFieldRefs.current.hasValidCredential = node;
                        }}
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
                        label="2. Sexo observado"
                        value={answers.sexoObservado}
                        onChange={(e) =>
                          setAnswers({ ...answers, sexoObservado: e.target.value as any })
                        }
                        inputRef={(node) => {
                          answerFieldRefs.current.sexoObservado = node;
                        }}
                        fullWidth
                      >
                        {['Hombre', 'Mujer', 'Otro'].map((v) => (
                          <MenuItem key={v} value={v}>
                            {v}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        select
                        label="3. Rango de edad"
                        value={answers.rangoEdad}
                        onChange={(e) => setAnswers({ ...answers, rangoEdad: e.target.value as any })}
                        inputRef={(node) => {
                          answerFieldRefs.current.rangoEdad = node;
                        }}
                        fullWidth
                      >
                        {['18 a 29', '30 a 44', '45 a 59', '60 o más'].map((v) => (
                          <MenuItem key={v} value={v}>
                            {v}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        select
                        label="4. Escolaridad"
                        value={answers.escolaridad}
                        onChange={(e) =>
                          setAnswers({ ...answers, escolaridad: e.target.value as any })
                        }
                        inputRef={(node) => {
                          answerFieldRefs.current.escolaridad = node;
                        }}
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
                        </Stack>
                      </CardContent>
                    </Card>
                  </Box>
                )}

                {page === 2 && (
                  <Box sx={{ px: { xs: 0.5, md: 1.5 } }}>
                    <Card sx={surveyStepCardSx}>
                      <CardContent sx={surveyStepCardContentSx}>
                        <Stack spacing={2.2}>
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#6C3841' }}>
                              Reconocimiento de figuras
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Aquí agrupamos conocimiento de personajes públicos con un acomodo más claro y menos saturado.
                            </Typography>
                          </Box>
                    {/* 2️⃣ Reconocimiento de figuras públicas */}
                    <Grid container rowSpacing={{ xs: 2.5, md: 3 }} columnSpacing={0} sx={surveyGridSx}>
                    <Grid item xs={12}>
                      <TextField
                        select
                        label="5. ¿Conoce a Gino Segura?"
                        value={answers.conoceGino}
                        onChange={(e) => setAnswers({ ...answers, conoceGino: e.target.value as any })}
                        inputRef={(node) => {
                          answerFieldRefs.current.conoceGino = node;
                        }}
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
                        label="¿Conoce a Latifa Martínez?"
                        value={answers.conoceLatifa}
                        onChange={(e) =>
                          setAnswers({ ...answers, conoceLatifa: e.target.value as any })
                        }
                        inputRef={(node) => {
                          answerFieldRefs.current.conoceLatifa = node;
                        }}
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
                        label="¿Conoce a Roberto Palazuelos?"
                        value={answers.conocePalazuelos}
                        onChange={(e) =>
                          setAnswers({ ...answers, conocePalazuelos: e.target.value as any })
                        }
                        inputRef={(node) => {
                          answerFieldRefs.current.conocePalazuelos = node;
                        }}
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
                        inputRef={(node) => {
                          answerFieldRefs.current.importanciaPoliticos = node;
                        }}
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
                        </Stack>
                      </CardContent>
                    </Card>
                  </Box>
                )}

                {page === 3 && (
                  <Box sx={{ px: { xs: 0.5, md: 1.5 } }}>
                    <Card sx={surveyStepCardSx}>
                      <CardContent sx={surveyStepCardContentSx}>
                        <Stack spacing={2.2}>
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#6C3841' }}>
                              Desempeño y percepción
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Las preguntas largas ahora tienen un contenedor más ancho y respirado para que no se sientan apretadas.
                            </Typography>
                          </Box>
                    {/* 3️⃣ Desempeño y percepción */}
                  <Grid container rowSpacing={{ xs: 2.5, md: 3 }} columnSpacing={0} sx={surveyGridSx}>
                    <Grid item xs={12}>
                      <TextField
                        select
                        label="7. Labor de cercanía de Gino Segura"
                        value={answers.ginoDebeSeguir}
                        onChange={(e) =>
                          setAnswers({ ...answers, ginoDebeSeguir: e.target.value as any })
                        }
                        inputRef={(node) => {
                          answerFieldRefs.current.ginoDebeSeguir = node;
                        }}
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

                    <Grid item xs={12}>
                      <TextField
                        select
                        label="8. Opinión de Gino Segura"
                        value={answers.opinionGino}
                        onChange={(e) => setAnswers({ ...answers, opinionGino: e.target.value as any })}
                        inputRef={(node) => {
                          answerFieldRefs.current.opinionGino = node;
                        }}
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

                    <Grid item xs={12}>
                      <TextField
                        select
                        label="9. Principal atributo asociado"
                        value={answers.atributoGino}
                        onChange={(e) => setAnswers({ ...answers, atributoGino: e.target.value as any })}
                        inputRef={(node) => {
                          answerFieldRefs.current.atributoGino = node;
                        }}
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
                        </Stack>
                      </CardContent>
                    </Card>
                  </Box>
                )}

                {page === 4 && (
                  <Box sx={{ px: { xs: 0.5, md: 1.5 } }}>
                    <Card sx={surveyStepCardSx}>
                      <CardContent sx={surveyStepCardContentSx}>
                        <Stack spacing={2.2}>
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#6C3841' }}>
                              Problemáticas y cierre
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              La última página conserva el paginado normal, pero con mejor separación lateral y más orden visual entre campos.
                            </Typography>
                          </Box>
                    {/* 4️⃣ Problemáticas y cierre */}
                  <Grid container rowSpacing={{ xs: 2.5, md: 3 }} columnSpacing={0} sx={surveyGridSx}>
                    <Grid item xs={12}>
                      <TextField
                        select
                        label="10. Problemática nacional"
                        value={answers.problemaNacional}
                        onChange={(e) => setAnswers({ ...answers, problemaNacional: e.target.value })}
                        inputRef={(node) => {
                          answerFieldRefs.current.problemaNacional = node;
                        }}
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
                      <Grid item xs={12}>
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

                    <Grid item xs={12}>
                      <TextField
                        select
                        label="11. Problemática local"
                        value={answers.problemaLocal}
                        onChange={(e) => setAnswers({ ...answers, problemaLocal: e.target.value })}
                        inputRef={(node) => {
                          answerFieldRefs.current.problemaLocal = node;
                        }}
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
                      <Grid item xs={12}>
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

                    <Grid item xs={12}>
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
                        </Stack>
                      </CardContent>
                    </Card>
                  </Box>
                )}

                <Box sx={{ px: { xs: 0.5, md: 1.5 } }}>
                  <Card
                    sx={{
                      borderRadius: 4,
                      border: '1px solid rgba(108,56,65,0.10)',
                      boxShadow: 'none',
                      bgcolor: 'rgba(255,255,255,0.92)',
                    }}
                  >
                    <CardContent sx={{ px: { xs: 2, md: 3 }, py: 2 }}>
                      <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        justifyContent="space-between"
                        spacing={1.5}
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
                              onClick={handleValidateSurveyBeforeSave}
                              disabled={submitting}
                              sx={{ borderRadius: 999, fontWeight: 800 }}
                            >
                              Confirmar encuesta
                            </Button>
                          )}
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                </Box>
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
          confirmDisabled={submitting}
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

        <Dialog
          open={duplicateDialogOpen}
          onClose={() => {
            setDuplicateDialogOpen(false);
            setDuplicateMatch(null);
          }}
          maxWidth="xs"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 5,
              overflow: 'hidden',
            },
          }}
        >
          <DialogContent sx={{ px: 3, pt: 4, pb: 2 }}>
            <Stack spacing={2.2} alignItems="center" textAlign="center">
              <Box
                sx={{
                  width: 96,
                  height: 96,
                  borderRadius: '50%',
                  display: 'grid',
                  placeItems: 'center',
                  background: 'linear-gradient(135deg, rgba(245,124,0,0.16) 0%, rgba(255,183,77,0.28) 100%)',
                  boxShadow: '0 18px 34px rgba(245,124,0,0.18)',
                }}
              >
                <WarningAmberRoundedIcon sx={{ fontSize: 56, color: '#E07A12' }} />
              </Box>

              <Box>
                <Typography variant="h5" sx={{ fontWeight: 900, color: '#6C3841' }}>
                  Registro duplicado detectado
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 1 }}>
                  Ya existe un registro con esta clave de elector. ¿Deseas continuar de todos modos?
                </Typography>
              </Box>

              {duplicateMatch ? (
                <Box
                  sx={{
                    width: '100%',
                    p: 2,
                    borderRadius: 3,
                    textAlign: 'left',
                    bgcolor: 'rgba(108,56,65,0.04)',
                    border: '1px solid rgba(108,56,65,0.10)',
                  }}
                >
                  <Typography sx={{ fontWeight: 800 }}>
                    {duplicateMatch.fullName || 'Registro existente'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Folio: {duplicateMatch.folio || '-'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Clave de elector: {duplicateMatch.claveElector || '-'}
                  </Typography>
                </Box>
              ) : null}
            </Stack>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 3, justifyContent: 'center', gap: 1 }}>
            <Button
              variant="outlined"
              onClick={() => {
                setDuplicateDialogOpen(false);
                setDuplicateMatch(null);
              }}
              sx={{ borderRadius: 999, minWidth: 140 }}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              onClick={() => void handleContinueAfterDuplicateWarning()}
              disabled={submitting}
              sx={{ borderRadius: 999, minWidth: 140, fontWeight: 800 }}
            >
              Continuar
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={missingAnswersDialogOpen}
          onClose={() => setMissingAnswersDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 5,
              overflow: 'hidden',
            },
          }}
        >
          <DialogContent sx={{ px: 3, pt: 4, pb: 2 }}>
            <Stack spacing={2.2} alignItems="center" textAlign="center">
              <Box
                sx={{
                  width: 96,
                  height: 96,
                  borderRadius: '50%',
                  display: 'grid',
                  placeItems: 'center',
                  background: 'linear-gradient(135deg, rgba(245,124,0,0.16) 0%, rgba(255,183,77,0.28) 100%)',
                  boxShadow: '0 18px 34px rgba(245,124,0,0.18)',
                }}
              >
                <WarningAmberRoundedIcon sx={{ fontSize: 56, color: '#E07A12' }} />
              </Box>

              <Box>
                <Typography variant="h5" sx={{ fontWeight: 900, color: '#6C3841' }}>
                  Hay preguntas sin responder
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 1 }}>
                  La encuesta puede completarse aun con respuestas faltantes. Revisa si deseas continuar o regresar a la primera pregunta pendiente.
                </Typography>
              </Box>

              <Box
                sx={{
                  width: '100%',
                  maxHeight: 260,
                  overflowY: 'auto',
                  p: 2,
                  borderRadius: 3,
                  textAlign: 'left',
                  bgcolor: 'rgba(108,56,65,0.04)',
                  border: '1px solid rgba(108,56,65,0.10)',
                }}
              >
                <Stack spacing={1}>
                  {missingAnswers.map((item) => (
                    <Typography key={item.field} variant="body2">
                      Pagina {item.page} · Pregunta {item.questionNumber}: {item.label}
                    </Typography>
                  ))}
                </Stack>
              </Box>
            </Stack>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 3, justifyContent: 'center', gap: 1 }}>
            <Button
              variant="outlined"
              onClick={handleGoToFirstMissingAnswer}
              sx={{ borderRadius: 999, minWidth: 170 }}
            >
              Revisar preguntas
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                setMissingAnswersDialogOpen(false);
                setConfirmSaveOpen(true);
              }}
              sx={{ borderRadius: 999, minWidth: 170, fontWeight: 800 }}
            >
              Completar encuesta
            </Button>
          </DialogActions>
        </Dialog>
      </Stack>
    </>
  );
}
