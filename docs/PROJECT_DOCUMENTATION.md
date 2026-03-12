# 📚🛠️ Documentación Completa del Proyecto

# 🌴 Contigo QROO Encuestas

> Manual funcional + técnico + operativo + onboarding, explicado paso a paso, con estilo de documentación larga tipo guía de proyecto y pensado para que cualquier persona nueva pueda entender el sistema desde cero 💡

## 👨‍💻 Responsable del proyecto

**Ricardo Orlando Castillo Olivera** ✨

---

## 1. 🌟 Visión general

Este sistema existe para resolver un problema muy concreto:

👉 levantar encuestas ciudadanas en campo de manera rápida, visual, profesional y con trazabilidad.

No es solo un formulario bonito.

Es una herramienta operativa que busca cubrir todo el ciclo:

1. 🔐 acceso controlado
2. 📍 ubicación del levantamiento
3. 🧍 captura de datos de la persona
4. 🪪 OCR opcional de credencial
5. 🧠 respuesta de encuesta paginada
6. 💾 guardado local del registro
7. 📚 consulta posterior
8. ✏️ edición de datos básicos
9. 💬 contacto por WhatsApp
10. 🗺️ revisión territorial por Maps
11. 📄 exportación PDF
12. 📊 lectura analítica vía dashboard

---

## 2. 🎯 Objetivos de negocio

### 🎯 Objetivo principal

Tener una plataforma que permita a brigadas y encuestadores capturar entrevistas en campo con orden, rapidez y evidencia.

### 🎯 Objetivos secundarios

- 🧾 digitalizar la operación de encuestas
- 🪪 reducir tiempos de captura con OCR
- 📍 asociar cada entrevista a una ubicación real
- 🧠 dividir la encuesta para que no sea pesada
- 📚 consultar y corregir datos básicos del ciudadano
- 📊 ver avance operativo de forma visual
- 📄 producir evidencia exportable

---

## 3. 🧱 Stack tecnológico explicado

### ⚛️ React 19

Se usa para construir toda la interfaz de usuario por componentes.

### 🔷 TypeScript

Se usa para tipar datos, evitar errores y mantener orden estructural.

### ⚡ Vite

Se usa como bundler y servidor de desarrollo rápido.

### 🎨 MUI

Se usa como sistema de componentes visuales:

- botones
- tarjetas
- diálogos
- inputs
- tablas
- chips
- tabs
- stepper

### 🌐 Axios

Se usa para consumir endpoints del backend.

### 🗺️ Leaflet + React Leaflet

Se usan para mostrar los mapas de geolocalización.

### 🪪 React Image Crop

Se usa para recortar la credencial antes de enviarla al OCR.

### 📄 html2canvas + jsPDF

Se usan para generar el PDF desde una vista HTML.

### 🔔 React Toastify

Se usa para mostrar feedback visual rápido:

- éxito ✅
- error ❌
- advertencia ⚠️
- información ℹ️

---

## 4. 🗂️ Estructura del proyecto, carpeta por carpeta

```bash
src/
├── components/
├── layouts/
├── pages/
├── routes/
├── services/
├── store/
├── theme/
├── types/
└── utils/
```

### `src/components` 🧩

Aquí viven componentes reutilizables.

#### `common/`

- `ConfirmDialog.tsx`
  diálogo de confirmación reutilizable.

#### `loading/`

- `GlobalLoadingOverlay.tsx`
  overlay global de carga.

#### `map/`

- `ReadonlyGeoMap.tsx`
  mapa visual de solo lectura.

#### `ui/`

- `OcrScannerOverlay.tsx`
  overlay visual del proceso OCR.

---

### `src/layouts` 🏗️

Aquí vive la estructura principal autenticada.

- `MainLayout.tsx`
  contiene sidebar, appbar y salida principal de rutas.

---

### `src/pages` 📄

Aquí viven las pantallas principales.

#### `auth/`

- `LoginPage.tsx`

#### `dashboard/`

- `DashboardPage.tsx`

#### `respondents/`

- `RespondentsListPage.tsx`
- `RespondentPreviewPage.tsx`
- `RespondentEditPage.tsx`

#### `surveys/`

- `SurveyNewPage.tsx`

---

### `src/routes` 🧭

- `AppRouter.tsx`
  define rutas públicas, privadas y guard de sesión.

---

### `src/services` 🌐

Aquí está la lógica de comunicación con backend o servicios.

- `auth.service.ts`
- `http.ts`
- `loading.service.ts`
- `ocr.service.ts`
- `sections.service.ts`
- `catalogs.service.ts`

---

### `src/store` 💾

Persistencia local simple.

- `auth.store.ts`
- `respondents.store.ts`

---

### `src/theme` 🎨

Define identidad visual institucional.

- `tokens.ts`
- `theme.ts`

---

### `src/types` 🧠

Modelos tipados del dominio.

- `auth.ts`
- `person.ts`
- `section.ts`
- `survey.ts`

---

### `src/utils` 🛠️

Utilidades generales.

- `geolocation.ts`
- `pdf.ts`
- `maps.ts`
- `contact.ts`

---

## 5. 🔐 Autenticación y sesión

## 5.1 ¿Cómo funciona el login? 👶

### Baby step 1

El usuario entra a `/login`.

### Baby step 2

Captura:

- usuario
- contraseña

### Baby step 3

La app llama a:

`POST /loginjwt`

### Baby step 4

Si el backend responde bien, guarda:

- token JWT
- usuario autenticado

### Baby step 5

La app redirige a `/dashboard`.

---

## 5.2 ¿Dónde se guarda la sesión? 💾

En `localStorage`, usando el store:

- `contigo_qroo_token`
- `contigo_qroo_user`

Archivo principal:

[auth.store.ts](/Users/ricardoorlandocastilloolivera/proyectHome/contigo-qroo-encuestas/src/store/auth.store.ts)

---

## 5.3 ¿Cómo se protege la sesión? 🛡️

La app ya valida:

- que exista token
- que el JWT tenga payload válido
- que `nbf` no sea futuro
- que `exp` no haya vencido

Cuando el token expira:

- 🧹 se limpia `localStorage`
- 🔁 se redirige a `/login?reason=expired`
- ⚠️ se informa al usuario que la sesión expiró

---

## 5.4 Guard de rutas 🔒

`AppRouter.tsx` usa `PrivateRoute`.

Si no hay sesión válida:

- no deja entrar a pantallas internas
- redirige a login

---

## 6. 📍 Geolocalización

## 6.1 ¿Qué guarda?

La app obtiene:

- latitud
- longitud
- precisión
- fecha de captura

Modelo:

```ts
GeoSnapshot {
  latitude: number;
  longitude: number;
  accuracy?: number;
  capturedAt: string;
}
```

---

## 6.2 ¿Para qué sirve? 🧭

- mostrar el mapa de la entrevista
- abrir Google Maps
- alimentar el dashboard territorial
- dejar trazabilidad operativa

---

## 7. 🧍 Alta de persona

La pantalla de alta vive en:

[SurveyNewPage.tsx](/Users/ricardoorlandocastilloolivera/proyectHome/contigo-qroo-encuestas/src/pages/surveys/SurveyNewPage.tsx)

## 7.1 Datos básicos que captura

- folio
- nombres
- apellido paterno
- apellido materno
- teléfono ☎️
- sexo
- fecha de nacimiento
- CURP
- clave de elector
- calle
- número
- colonia
- código postal
- municipio
- estado
- sección
- vigencia
- tipo de credencial

---

## 7.2 Validación especial de teléfono 📱

Cuando el usuario pulsa `Continuar a encuesta`:

### Si hay teléfono

👉 avanza normal.

### Si no hay teléfono

👉 abre un modal de advertencia con dos opciones:

- `Poner número de contacto`
- `Continuar`

La opción enfocada por defecto es:

`Poner número de contacto`

Y si la eligen:

👉 el cursor vuelve al input del teléfono.

---

## 7.3 Sección electoral con autocomplete 🔎

La sección ya no es un select tradicional.

Ahora usa `Autocomplete` para:

- buscar por número
- ver `IdSeccion · Municipio`
- seleccionar más rápido
- autocompletar municipio al elegir una sección

---

## 8. 🪪 OCR de credencial

## 8.1 ¿Qué problema resuelve?

Evita capturar manualmente toda la credencial cuando ya existe una imagen.

## 8.2 Flujo baby steps 👶

1. el usuario cambia a modo `OCR`
2. sube una imagen
3. recorta la credencial
4. la app manda el archivo al OCR
5. la respuesta se transforma al modelo interno
6. el formulario se llena automáticamente

---

## 8.3 Qué hace bien este diseño ✅

- no obliga a usar OCR
- deja modo manual
- conserva geolocalización
- mantiene control visual del recorte

---

## 9. 🧠 Encuesta paginada

La encuesta está dividida para que no se vea enorme ni cansada.

## 9.1 Secciones actuales

1. 🧩 Filtros e introducción
2. 👀 Reconocimiento
3. 📈 Desempeño
4. 🏘️ Problemáticas y cierre

## 9.2 ¿Por qué paginar?

- mejora foco
- reduce saturación visual
- facilita captura en campo
- disminuye errores

---

## 10. 💾 Guardado local y estado mock

## 10.1 Situación actual

Como todavía faltan algunas APIs, parte del flujo trabaja con almacenamiento local.

Esto significa:

- la autenticación sí consume backend
- el catálogo de secciones sí consume backend
- varias operaciones de registros viven aún en `localStorage`

---

## 10.2 ¿Dónde se guarda la encuesta?

Archivo:

[respondents.store.ts](/Users/ricardoorlandocastilloolivera/proyectHome/contigo-qroo-encuestas/src/store/respondents.store.ts)

Llave:

`contigo_qroo_respondents`

---

## 10.3 ¿Qué sí se puede hacer aunque falten APIs? 🧪

- guardar entrevistas
- listarlas
- verlas
- exportarlas a PDF
- editar datos básicos
- abrir WhatsApp
- abrir Google Maps

---

## 11. 📚 Listado de encuestados

Pantalla:

[RespondentsListPage.tsx](/Users/ricardoorlandocastilloolivera/proyectHome/contigo-qroo-encuestas/src/pages/respondents/RespondentsListPage.tsx)

## 11.1 ¿Qué permite?

- buscar
- filtrar
- ordenar
- paginar
- abrir detalle
- editar datos básicos
- abrir WhatsApp
- abrir Maps

---

## 11.2 Responsividad 📱💻

La pantalla tiene dos comportamientos:

### En escritorio 🖥️

Usa tabla compacta.

### En tablet y smartphone 📱

Usa tarjetas responsive.

Esto evita que la experiencia se rompa cuando no cabe una tabla completa.

---

## 11.3 WhatsApp 💬

Se genera una URL:

```ts
https://wa.me/NUMERO
```

Si detecta 10 dígitos, asume número de México y antepone `52`.

---

## 11.4 Google Maps 📍

Se genera una URL:

```ts
https://www.google.com/maps/place/lat,lng/@lat,lng,17z
```

Así abre ubicación con marcador.

---

## 12. ✏️ Edición básica del encuestado

Pantalla:

[RespondentEditPage.tsx](/Users/ricardoorlandocastilloolivera/proyectHome/contigo-qroo-encuestas/src/pages/respondents/RespondentEditPage.tsx)

## 12.1 Regla de negocio importante

✅ Se pueden editar datos básicos de la persona.

❌ No se pueden editar respuestas de la encuesta.

Esto protege la integridad del levantamiento.

---

## 13. 👁️ Vista previa de encuesta

Pantalla:

[RespondentPreviewPage.tsx](/Users/ricardoorlandocastilloolivera/proyectHome/contigo-qroo-encuestas/src/pages/respondents/RespondentPreviewPage.tsx)

## 13.1 ¿Qué muestra?

- datos administrativos
- datos de la persona
- teléfono
- domicilio
- mapa de levantamiento
- respuestas agrupadas

## 13.2 Acciones

- volver
- editar
- descargar PDF
- abrir Maps

---

## 14. 📄 Exportación PDF

El PDF se genera desde la vista previa.

### ¿Qué incluye?

- resultado
- folio
- datos administrativos
- datos personales
- mapa
- respuestas

### ¿Por qué es útil?

- evidencia
- archivo
- envío
- impresión

---

## 15. 📊 Dashboard

Pantalla:

[DashboardPage.tsx](/Users/ricardoorlandocastilloolivera/proyectHome/contigo-qroo-encuestas/src/pages/dashboard/DashboardPage.tsx)

## 15.1 ¿Qué muestra?

- encuestas totales
- año actual
- municipios activos
- cobertura de secciones
- tasa de entrevistas completas
- puntos geolocalizados
- tendencia mensual
- acumulado por año
- ranking municipal
- top de secciones
- mapa territorial

---

## 15.2 Lógica territorial 🌴

El dashboard ya contempla los 11 municipios de Quintana Roo:

- Othón P. Blanco
- Benito Juárez
- Solidaridad
- Tulum
- Cozumel
- Isla Mujeres
- Lázaro Cárdenas
- Felipe Carrillo Puerto
- José María Morelos
- Bacalar
- Puerto Morelos

---

## 16. 🎨 Identidad visual

La aplicación trabaja sobre un lenguaje visual institucional cercano a Morena:

- vino / morena oscuro
- dorado suave
- grises cálidos
- fondos claros

Archivos clave:

- [tokens.ts](/Users/ricardoorlandocastilloolivera/proyectHome/contigo-qroo-encuestas/src/theme/tokens.ts)
- [theme.ts](/Users/ricardoorlandocastilloolivera/proyectHome/contigo-qroo-encuestas/src/theme/theme.ts)

---

## 17. 🧠 Modelos principales

## 17.1 `PersonFormData`

Representa a la persona entrevistada.

## 17.2 `SurveyAnswers`

Representa todas las respuestas del cuestionario.

## 17.3 `SurveyRecord`

Representa el registro completo final.

Incluye:

- metadata
- persona
- respuestas
- tiempos
- geolocalización

---

## 18. 🌐 Servicios principales

## `http.ts`

Cliente Axios central.

Hace:

- base URL
- inyección de token
- control de loader
- detección de `401`

## `auth.service.ts`

Hace:

- login
- logout
- expiración forzada de sesión

## `ocr.service.ts`

Hace:

- escaneo OCR
- transformación de respuesta
- mapeo al modelo interno

## `sections.service.ts`

Hace:

- consulta del catálogo de secciones

---

## 19. 👶 Baby steps para una persona nueva en el proyecto

Si hoy entra una persona nueva al equipo, este sería el camino ideal:

### Paso 1

Leer el [README.md](/Users/ricardoorlandocastilloolivera/proyectHome/contigo-qroo-encuestas/README.md) 🧭

### Paso 2

Leer esta documentación completa 📚

### Paso 3

Levantar el proyecto:

```bash
npm install
npm run dev
```

### Paso 4

Entrar al login 🔐

### Paso 5

Probar el flujo completo:

1. dashboard
2. nueva encuesta
3. alta de persona
4. encuesta
5. guardar
6. listado
7. detalle
8. PDF

### Paso 6

Leer estos archivos primero:

- [AppRouter.tsx](/Users/ricardoorlandocastilloolivera/proyectHome/contigo-qroo-encuestas/src/routes/AppRouter.tsx)
- [MainLayout.tsx](/Users/ricardoorlandocastilloolivera/proyectHome/contigo-qroo-encuestas/src/layouts/MainLayout.tsx)
- [SurveyNewPage.tsx](/Users/ricardoorlandocastilloolivera/proyectHome/contigo-qroo-encuestas/src/pages/surveys/SurveyNewPage.tsx)
- [RespondentsListPage.tsx](/Users/ricardoorlandocastilloolivera/proyectHome/contigo-qroo-encuestas/src/pages/respondents/RespondentsListPage.tsx)
- [DashboardPage.tsx](/Users/ricardoorlandocastilloolivera/proyectHome/contigo-qroo-encuestas/src/pages/dashboard/DashboardPage.tsx)

---

## 20. 🚧 Áreas pendientes o evolucionables

Estas son áreas naturales de evolución:

- 🌐 reemplazar persistencia local por APIs reales de registros
- 🧪 unificar mocks temporales con contratos definitivos
- 🗃️ sincronización remota de entrevistas
- 📈 más filtros analíticos en dashboard
- 🧠 validaciones más estrictas
- 🔍 búsqueda avanzada
- 🧾 catálogos remotos adicionales
- 📦 code splitting para bajar tamaño del bundle

---

## 21. 🛡️ Consideraciones importantes

- No se deben modificar respuestas desde edición básica.
- La geolocalización es parte crítica de trazabilidad.
- El token expira y la sesión se limpia automáticamente.
- El proyecto aún convive con flujos mock mientras llegan APIs faltantes.

---

## 22. ✅ Conclusión

Este proyecto ya tiene una base muy sólida, muy operativa y bastante profesional. No es un demo simple: ya contiene autenticación, seguridad de sesión, captura en campo, OCR, geolocalización, analítica, edición controlada y exportación.

La documentación fue preparada para que cualquier persona pueda:

- entender qué hace el sistema
- entender cómo está estructurado
- entender qué ya está real
- entender qué todavía es temporal/mock
- empezar a trabajar sin perderse

---

## 🙌 Créditos finales

Proyecto documentado para uso profesional por:

**Ricardo Orlando Castillo Olivera** 🌟📋🗳️
