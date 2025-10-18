# Asistente de Clase IA – Entrega Parcial 2

Este repositorio contiene la implementación de la entrega parcial 2 del sistema de asistencia en la clase basado en IA. La solución cumple con los requisitos solicitados:

- Backend en **Flask** con soporte para carga de presentaciones, conversión a PDF mediante **LibreOffice**, extracción de texto con **python-pptx** y sincronización en tiempo real mediante **WebSockets** (Flask-SocketIO).
- Frontend en **React + Vite**, visualización de la presentación con **Reveal.js** y **PDF.js**, además de vistas para crear e iniciar clases, controlar la presentación y proyectarla.
- Orquestación de servicios con **Docker Compose** para facilitar la ejecución del sistema completo.
- **Bot de Telegram** para control remoto desde cualquier dispositivo móvil.

## 📚 Documentación

> 📑 **[Índice Completo de Documentación](docs/INDEX.md)** - Encuentra rápidamente lo que buscas

### Documentos Principales

- 🚀 **[Guía de Uso](docs/USER_GUIDE.md)** - Tutorial paso a paso para crear clases, controlar presentaciones y usar el bot de Telegram
- 🏗️ **[Arquitectura del Sistema](docs/ARCHITECTURE.md)** - Diagramas, flujos de datos, componentes y API specification
- 🔧 **[Variables de Entorno](docs/ENVIRONMENT_VARIABLES.md)** - Guía completa de configuración de tokens y API keys
- 📊 **[Resumen del Proyecto](docs/PROJECT_SUMMARY.md)** - Visión ejecutiva, métricas y roadmap
- 📖 **[README Principal](#)** - Esta página (inicio rápido)

## Arquitectura

```
┌─────────────┐      REST / Socket.IO      ┌──────────────┐
│  Frontend   │◀──────────────────────────▶│   Backend    │
│ React + Vite│                             │ Flask        │
│ Reveal + PDF│                             │ LibreOffice  │
└─────────────┘                             │ python-pptx  │
       ▲                                     └─────▲────────┘
       │                                           │
       └─────────────── Docker Compose ────────────┘
```

- **Creación de clase** (Plataforma Web): carga de archivos PPT/PPTX/PDF, conversión a PDF y almacenamiento de metadatos.
- **Iniciar clase** (Plataforma Web): habilita la sesión y sincroniza el estado inicial.
- **Sincronización** (Control ↔ Plataforma): uso de Socket.IO para cambios de diapositiva en tiempo real.
- **Control de presentación** (Control): interfaz para avanzar, retroceder e ir a una diapositiva específica.

## 🚀 Inicio Rápido

### Validar Configuración (Opcional)

Antes de iniciar, puedes validar que todo está correctamente configurado:

```powershell
python scripts/validate_setup.py
```

Este script verificará:
- ✓ Variables de entorno
- ✓ Estructura de directorios
- ✓ Archivos requeridos
- ✓ Docker instalado
- ✓ Dependencias (si desarrollo local)

### Ejecutar con Docker

```powershell
# Desde la raíz del proyecto
docker compose up --build
```

Servicios expuestos:

- Frontend: <http://localhost:5173>
- Backend: <http://localhost:5000>

Los archivos subidos y PDF generados se guardan en `backend/storage`, mapeado como volumen para persistencia.

## Flujo principal

1. **Crear clase** desde la web: completar formulario y subir la presentación.
2. **Administrar clase**: iniciar/terminar sesión y ver datos en `/:classId`.
3. **Control**: usar `/classes/:classId/control` para avanzar, retroceder o saltar a diapositivas. Los cambios se envían por WebSocket.
4. **Presentación**: proyectar en `/classes/:classId/presentation`. Reveal.js renderiza cada página del PDF convertido para mantener el estilo original.

## 🤖 Control con Bot de Telegram

El sistema incluye un bot de Telegram para controlar las presentaciones remotamente desde tu teléfono o cualquier dispositivo con Telegram.

### Configuración del Bot

1. **Obtener token del bot**:
   - Habla con [@BotFather](https://t.me/botfather) en Telegram
   - Crea un nuevo bot con `/newbot`
   - Copia el token que te proporciona

2. **Configurar el token**:
   - Edita el archivo `.env.example` en la raíz del proyecto
   - Pega tu token en la variable `TELEGRAM_BOT_TOKEN`
   ```bash
   TELEGRAM_BOT_TOKEN=tu_token_aqui
   ```

3. **Reiniciar el backend**:
   ```powershell
   docker compose restart backend
   ```

### Uso del Bot

1. Busca tu bot en Telegram (usa el nombre que le diste al crearlo)
2. Inicia conversación con `/start`
3. Comandos disponibles:
   - `/list` - Ver todas las clases disponibles
   - `/select <ID>` - Seleccionar una clase para controlar
   - `/next` - Siguiente diapositiva
   - `/prev` - Diapositiva anterior
   - `/goto <N>` - Ir a la diapositiva N
   - `/status` - Ver estado actual

El bot también incluye **botones inline** para un control más rápido después de seleccionar una clase.

## 📱 Visualización de Diapositivas

### Proyección web

1. Crea una clase desde el dashboard (http://localhost:5173)
2. Sube tu presentación (PPT, PPTX o PDF)
3. Ve a la página de la clase y haz clic en "Iniciar Clase"
4. Abre la **Presentación** en: `http://localhost:5173/classes/{classId}/presentation`
5. Esta vista muestra las diapositivas con Reveal.js + PDF.js
6. Se sincroniza automáticamente con el control (web o Telegram)

### Control web

Abre `http://localhost:5173/classes/{classId}/control` para usar la interfaz web de control con botones Next/Prev/Goto.

### Múltiples dispositivos

- Puedes tener la **presentación** en un proyector/TV
- El **control** en tu laptop o tablet
- Y el **bot de Telegram** en tu teléfono

¡Todos se sincronizan en tiempo real vía WebSockets!

## 🔧 Variables de entorno

Para configurar tokens y API keys, consulta la **[Guía completa de variables de entorno](docs/ENVIRONMENT_VARIABLES.md)**.

### Configuración rápida

1. Copia el archivo de ejemplo:
   ```powershell
   Copy-Item .env.example .env
   ```

2. Edita `.env` y completa tus valores:
   ```bash
   TELEGRAM_BOT_TOKEN=tu_token_aqui
   OPENAI_API_KEY=tu_api_key_aqui
   ```

3. Variables disponibles:

| Variable | Descripción | Requerido |
|----------|-------------|-----------|
| `TELEGRAM_BOT_TOKEN` | Token del bot de Telegram | No |
| `OPENAI_API_KEY` | API key de OpenAI | No |
| `VITE_API_BASE_URL` | URL del backend | Sí |
| `VITE_SOCKET_URL` | URL de WebSocket | Sí |

**📖 Ver guía completa**: [docs/ENVIRONMENT_VARIABLES.md](docs/ENVIRONMENT_VARIABLES.md)

## Desarrollo local sin Docker

1. **Backend**
   ```powershell
   cd backend
   python -m venv .venv
   .\.venv\Scripts\activate
   pip install -r requirements.txt
   python app.py
   ```

2. **Frontend**
   ```powershell
   cd frontend
   npm install
   npm run dev -- --host
   ```

Asegúrate de tener LibreOffice instalado si ejecutas el backend fuera de Docker.

## Pruebas manuales sugeridas

- Crear clase con un PPTX y verificar que el PDF se genere (`backend/storage/conversions`).
- Abrir simultáneamente la vista de presentación y el control para validar la sincronización de diapositivas.
- Probar acciones `Anterior`, `Siguiente` e `Ir a` desde el control con diferentes espectadores conectados.

---

Entrega preparada según requisitos de la **Entrega Parcial 2**.
