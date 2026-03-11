# 🗳️ Contigo QROO Encuestas Web

Proyecto React + Vite para levantamiento de encuestas ciudadanas en campo.

## ✨ Incluye

- 🔐 Login real con JWT
- 🍔 MainLayout responsivo con menú tipo torta
- 🧍 Alta de persona manual y por OCR
- 📍 Captura de geolocalización del navegador en mapa solo lectura
- 🧾 Encuesta paginada para evitar scroll pesado
- 🛑 Cancelación de entrevista con reseteo completo
- ✅ Confirmación para guardar encuesta
- 📋 Listado de encuestados con paginado de 15 por página
- 👁️ Vista previa bonita
- 📄 Descarga de PDF
- 🌌 Loader global estilo ngx-spinner
- 🎨 Tema institucional con color `#6C3841`

## 📁 Estructura

```bash
src/
  components/
    common/
    loading/
    map/
  layouts/
  pages/
    auth/
    dashboard/
    surveys/
    respondents/
  routes/
  services/
  store/
  theme/
  types/
  utils/
```

## 🚀 Comandos

```bash
cd /Users/ricardoorlandocastilloolivera/proyectHome
npm create vite@latest contigo-qroo-encuestas -- --template react-ts
cd contigo-qroo-encuestas
# reemplaza package.json y src con el contenido de este proyecto
npm install
npm run dev
npm run build
npm run preview
```

## 🔌 APIs reales integradas

- `POST /loginjwt`
- `GET /getSecciones`
- OCR de INE
- Separación de nombres

## 🧪 Nota sobre mocks

La persistencia de encuestas quedó simulada con `localStorage` para que puedas avanzar mientras llegan APIs reales de guardado, listado y detalle.
