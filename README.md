# 🗳️🌴 Contigo QROO Encuestas

> MVP operativo para levantamiento de encuestas ciudadanas en Quintana Roo 🧠📍🪪📊

## ✨ Panorama general

**Contigo QROO Encuestas** es una aplicación frontend construida para brigadas de campo, capturistas y operación territorial que necesitan registrar personas, contestar cuestionarios, consultar resultados y visualizar métricas del proyecto de forma clara, rápida y profesional 🚀

Hoy el sistema ya trabaja con **APIs reales** para los flujos principales de negocio 🌐✅:

- 🔐 autenticación con JWT
- 🧍 alta de persona
- 📚 listado de cuestionarios
- 👁️ detalle de cuestionario
- ✏️ actualización de datos básicos
- 🧠 guardado de respuestas
- 📊 lectura estadística desde información remota

La app combina captura operativa, validaciones de frontend, OCR de credencial, geolocalización, dashboard ejecutivo y herramientas de consulta para hacer útil el proyecto desde una primera versión fuerte de MVP 💪📈

---

## 🎯 Objetivo del proyecto

Este proyecto existe para facilitar el levantamiento de encuestas de opinión pública en campo dentro de Quintana Roo 🌴

La idea es que el equipo pueda:

- 🪪 capturar rápido la información de una persona
- 📍 registrar ubicación geográfica real desde navegador
- 🧠 responder el cuestionario en un flujo cómodo y paginado
- ⚠️ detectar duplicados por clave de elector antes de dar de alta
- 📚 consultar registros levantados
- ✏️ corregir datos básicos sin romper el cuestionario
- 📄 revisar la vista previa del levantamiento
- 📊 analizar avance operativo y distribución territorial

---

## 🧩 ¿Qué hace hoy la aplicación?

### 🔐 Login y sesión

- Login con backend real vía token JWT 🔐
- Persistencia local de sesión
- Validación de expiración del token por `exp` y `nbf`
- Protección de rutas privadas
- Cierre automático de sesión cuando expira

### 🧍 Alta de persona

- Captura manual de datos básicos ✍️
- Captura por OCR de credencial 🪪
- Validación estricta de campos obligatorios:
  - nombre
  - primer apellido
  - clave de elector
  - sección
  - dirección
  - teléfono
- Validación visual con campos en rojo y mensaje `Es requerido` 🚨
- El `folio` ya no se captura manualmente: lo genera el backend ✅
- Normalización automática de fecha de nacimiento al formato `YYYY-MM-DD` 📅
- Detección de duplicado por `ClaveElector` usando `getCuestionarios`
- Modal central de advertencia si la persona ya existe ⚠️

### 🪪 OCR del INE

- Carga de imagen desde dispositivo 📷
- Recorte visual para dejar solo la credencial ✂️
- Envío al servicio OCR externo
- Separación de nombres y apellidos
- Mapeo automático al formulario
- Conserva ubicación y contexto de captura

### 🧠 Cuestionario

- Flujo dividido por páginas temáticas 🧭
- Las preguntas cerradas se mapean desde el frontend a `Pregunta1..Pregunta13`
- `Observaciones` se maneja como texto libre 📝
- `IdEstatus` se usa para representar el resultado de la entrevista
- Guardado remoto por API real

### 📚 Listado de encuestados

- Consulta remota vía `getCuestionarios` 🌐
- Búsqueda por folio, nombre, teléfono, municipio, sección y más 🔎
- Filtros por municipio, sección, resultado y fecha 📅
- Ordenamiento configurable ↕️
- Vista escritorio y responsive 📱💻
- Acciones rápidas:
  - 👁️ ver detalle
  - ✏️ editar
  - 💬 abrir WhatsApp
  - 📍 abrir Google Maps

### 👁️ Vista previa y edición

- Detalle completo del cuestionario
- Datos básicos de la persona
- Respuestas organizadas por bloques
- Mapa en solo lectura
- Exportación a PDF 📄
- Edición de datos básicos con `PUT editCuestionario/{id}`

### 📊 Dashboard

- Datos leídos desde APIs reales 📡
- Tendencia mensual y acumulado anual 📈
- Ranking municipal de los 11 municipios de Quintana Roo 🏝️
- Conteo de municipios activos
- Secciones activas contra el catálogo real de secciones 🗂️
- Conteo de altas pendientes de cuestionario ⏳
- Distribución por estatus
- Mapa con geolocalización de entrevistas 🛰️
- Resumen ejecutivo de operación

---

## 🌐 APIs integradas

La aplicación ya conversa con estos endpoints reales:

### 🔐 Autenticación

- `POST /loginjwt`

### 🧍 Personas / cuestionarios

- `POST /storePersona`
- `GET /getCuestionarios`
- `GET /getCuestionario/{IdCuestionario}`
- `PUT /editCuestionario/{IdCuestionario}`
- `POST /storePreguntas/{IdCuestionario}`

### 🗂️ Catálogos

- `GET getSecciones`

El catálogo de secciones es clave para:

- relacionar sección → municipio 🧭
- alimentar autocompletado de captura
- calcular el total real de secciones del proyecto
- construir estadísticas territoriales sin hardcodear el universo electoral ✅

---

## 🧠 Decisiones importantes del frontend

Hay varias decisiones intencionales dentro del MVP que vale la pena documentar:

### 1. Las opciones del cuestionario viven en frontend 🎛️

El backend almacena enteros `Pregunta1..Pregunta13`, pero el catálogo visible de opciones se controla en el frontend.

Ejemplo:

- `1` = primera opción
- `2` = segunda opción
- `3` = tercera opción

Esto permite que el usuario vea textos amigables mientras el backend guarda valores compactos.

### 2. El folio lo genera backend 🧾

En alta ya no se captura el folio manualmente. El backend responde el folio oficial después del `storePersona`.

### 3. La validación de duplicados la hace frontend ⚠️

Como backend aún no bloquea personas repetidas por `ClaveElector`, el frontend consulta `getCuestionarios`, detecta coincidencias y muestra un modal de advertencia antes de continuar.

### 4. El municipio se deriva desde la sección 🏙️

La API de cuestionarios no siempre expone municipio como dato operativo principal, así que el frontend usa el catálogo de secciones para resolverlo de forma consistente.

### 5. La fecha se normaliza antes de enviarse 📅

Si la captura viene como `dd/mm/yyyy`, el frontend la transforma a `yyyy-mm-dd` para cumplir el contrato esperado por backend.

---

## 🧱 Stack tecnológico

- ⚛️ React 19
- 🔷 TypeScript
- ⚡ Vite
- 🎨 MUI + Emotion
- 🌐 Axios
- 🧭 React Router DOM
- 🗺️ Leaflet + React Leaflet
- 🪪 React Image Crop
- 🔔 React Toastify
- 📄 html2canvas + jsPDF

---

## 🗂️ Estructura principal

```bash
src/
├── components/
│   ├── common/
│   ├── loading/
│   ├── map/
│   └── ui/
├── layouts/
├── pages/
│   ├── auth/
│   ├── dashboard/
│   ├── respondents/
│   └── surveys/
├── routes/
├── services/
├── store/
├── theme/
├── types/
└── utils/
```

---

## 🧭 Rutas principales

| Ruta | Pantalla | Acceso |
|------|----------|--------|
| `/login` | Inicio de sesión 🔐 | Público |
| `/dashboard` | Dashboard ejecutivo 📊 | Privado |
| `/surveys/new` | Alta + encuesta nueva 📝 | Privado |
| `/respondents` | Listado de encuestados 📚 | Privado |
| `/respondents/:id` | Vista previa 👁️ | Privado |
| `/respondents/:id/edit` | Edición básica ✏️ | Privado |

---

## 🚀 Cómo ejecutar el proyecto

### 1. Instalar dependencias 📦

```bash
npm install
```

### 2. Levantar modo desarrollo 💻

```bash
npm run dev
```

### 3. Compilar producción 🏗️

```bash
npm run build
```

### 4. Previsualizar build 👀

```bash
npm run preview
```

---

## 🧪 Estado actual del MVP

El sistema ya es un MVP fuerte y funcional ✅

### Ya resuelto

- 🌐 integración con endpoints principales reales
- 🧍 alta de persona remota
- 🧠 guardado remoto del cuestionario
- 📚 listado remoto
- 👁️ detalle remoto
- ✏️ edición remota
- 📊 dashboard con datos reales
- ⚠️ validaciones importantes en frontend
- 🪪 flujo OCR operativo

### Pendientes naturales de evolución

- mejorar segmentaciones analíticas por filtros globales
- agregar más métricas ejecutivas si operación lo requiere
- robustecer validaciones también del lado backend
- optimizar chunking del build de frontend

---

## 📘 Documentación adicional

Existe documentación extendida en:

[📚 Ver documentación completa](./docs/PROJECT_DOCUMENTATION.md)

---

## 🙌 Autor

Desarrollado para operación de levantamiento y análisis de encuestas por:

**Ricardo Orlando Castillo Olivera** ✨🚀
