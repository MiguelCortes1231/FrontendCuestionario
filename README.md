# 🗳️🌴 Contigo QROO Encuestas

> Plataforma web para levantamiento de encuestas ciudadanas en campo, con autenticación 🔐, captura manual ✍️, OCR de credencial 🪪, geolocalización 📍, dashboard analítico 📊, listado operativo 📚 y exportación a PDF 📄.

## 👨‍💻 Autor

**Ricardo Orlando Castillo Olivera** ✨

---

## 🎯 ¿Qué es este proyecto?

**Contigo QROO Encuestas** es una aplicación frontend construida para brigadas, encuestadores y personal operativo que necesita capturar información de ciudadanos de manera rápida, visual y estructurada.

El sistema permite:

- 🔐 iniciar sesión con JWT
- 🧍 dar de alta a una persona
- 🪪 capturar datos manualmente o por OCR
- 📍 registrar dónde se hizo la entrevista
- 🧠 responder la encuesta por páginas
- 💾 guardar localmente mientras llegan APIs faltantes
- 📚 consultar registros levantados
- ✏️ editar solo datos básicos del ciudadano
- 💬 abrir WhatsApp del contacto
- 🗺️ abrir Google Maps con el punto entrevistado
- 📄 generar un PDF elegante del registro

---

## ✨ Funcionalidades principales

### 🔐 Seguridad y sesión

- Login con backend real vía `POST /loginjwt`
- Persistencia de token JWT en `localStorage`
- Validación de expiración por `exp` y `nbf`
- Guard de rutas privadas
- Cierre automático de sesión cuando el token expira
- Limpieza completa de `localStorage` al cerrar sesión

### 🧍 Alta de persona

- Captura manual de datos básicos
- Campo de teléfono ☎️
- Sección electoral mediante `Autocomplete`
- Relación automática de sección → municipio
- Confirmación si intentan continuar sin teléfono

### 🪪 OCR de credencial

- Subida de imagen
- Recorte visual del INE
- Envío a servicio OCR
- Mapeo de datos al formulario
- Conserva geolocalización y flujo de encuesta

### 🧠 Encuesta paginada

- Flujo dividido por secciones temáticas
- Navegación por páginas
- Confirmación antes de guardar
- No permite editar respuestas desde pantalla de edición posterior

### 📊 Dashboard

- KPIs visuales
- estadísticas por año y por mes
- cobertura por municipios de Quintana Roo
- cobertura por secciones
- resumen territorial con puntos geolocalizados

### 📚 Listado operativo

- Búsqueda inteligente
- filtros por municipio, sección y resultado
- ordenamiento
- vista de escritorio y vista responsive para tablet/móvil
- acciones rápidas:
  - 👁️ ver
  - ✏️ editar
  - 💬 WhatsApp
  - 📍 Google Maps

### 👁️ Vista previa y PDF

- Resumen administrativo
- Datos de persona
- Mapa de ubicación
- Respuestas agrupadas por bloques
- Exportación a PDF

---

## 🧱 Stack tecnológico

- ⚛️ React 19
- 🔷 TypeScript
- ⚡ Vite
- 🎨 MUI + Emotion
- 🧭 React Router DOM
- 🌐 Axios
- 📍 Leaflet + React Leaflet
- 🪪 React Image Crop
- 🔔 React Toastify
- 🆔 UUID
- 📄 html2canvas + jsPDF

---

## 🗂️ Estructura del proyecto

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

| Ruta | Descripción | Acceso |
|------|-------------|--------|
| `/login` | Inicio de sesión | Público 🔓 |
| `/dashboard` | Dashboard principal | Privado 🔒 |
| `/surveys/new` | Alta + encuesta nueva | Privado 🔒 |
| `/respondents` | Listado de encuestados | Privado 🔒 |
| `/respondents/:id` | Vista previa | Privado 🔒 |
| `/respondents/:id/edit` | Edición básica | Privado 🔒 |

---

## 🚀 Cómo levantar el proyecto

### 1. Instalar dependencias 📦

```bash
npm install
```

### 2. Ejecutar en desarrollo 💻

```bash
npm run dev
```

### 3. Compilar para producción 🏗️

```bash
npm run build
```

### 4. Previsualizar build 👀

```bash
npm run preview
```

---

## 🧪 Estado actual del proyecto

El proyecto ya tiene una base funcional sólida ✅, pero todavía trabaja con una mezcla de:

- 🌐 APIs reales
- 🧪 flujo temporal/mock
- 💾 persistencia local en `localStorage`

Esto significa que varias partes ya están listas visual y funcionalmente, mientras algunas integraciones futuras todavía dependerán de endpoints pendientes.

---

## 📘 Documentación extendida

La documentación detallada del sistema, con explicación funcional, técnica, flujo por flujo y baby steps, está aquí:

[📚 Ver documentación completa](./docs/PROJECT_DOCUMENTATION.md)

---

## 🏁 Resumen ejecutivo

Este proyecto ya permite operar una encuesta ciudadana de principio a fin desde frontend:

1. 🔐 el usuario entra con sesión protegida
2. 📍 se captura ubicación
3. 🧍 se registra a la persona
4. 🪪 opcionalmente se usa OCR
5. 🧠 se responde la encuesta
6. 💾 se guarda el registro
7. 📚 se consulta en listado
8. 👁️ se revisa el detalle
9. 📄 se exporta a PDF

---

## 🙌 Créditos

Desarrollado y documentado para operación profesional de encuestas por:

**Ricardo Orlando Castillo Olivera** 🌟
