# 📊 Resumen del Proyecto - Asistente de Clase IA

**Sistema de Presentaciones con Control Remoto Multi-Dispositivo**

---

## 🎯 Descripción General

Sistema web moderno para gestionar y presentar diapositivas con control remoto desde múltiples dispositivos (web, Telegram). Ideal para profesores, presentadores y conferencistas que necesitan libertad de movimiento durante sus presentaciones.

### Características Principales

✅ **Gestión de Presentaciones**
- Carga de archivos PPTX, PPT y PDF
- Conversión automática a PDF con LibreOffice
- Extracción de texto de diapositivas
- Almacenamiento persistente

✅ **Visualización Profesional**
- Renderizado con Reveal.js + PDF.js
- Modo pantalla completa
- Navegación fluida entre slides
- Compatible con proyectores

✅ **Control Multi-Dispositivo**
- Control web desde navegador
- Bot de Telegram para control móvil
- Sincronización en tiempo real vía WebSocket
- Soporte para múltiples controladores simultáneos

✅ **Infraestructura Moderna**
- Frontend: React + TypeScript + Vite
- Backend: Flask + Python
- Tiempo real: Socket.IO (WebSockets)
- Containerización: Docker + Docker Compose

---

## 🏗️ Arquitectura Técnica

### Stack Tecnológico

**Frontend**
```
React 18 + TypeScript
Vite (build tool)
Reveal.js (presentaciones)
PDF.js (renderizado PDF)
Socket.IO Client (WebSocket)
React Router (SPA)
```

**Backend**
```
Flask 3.0 (framework web)
Flask-SocketIO (WebSocket)
python-telegram-bot (bot)
python-pptx (extracción texto)
LibreOffice Headless (conversión)
Eventlet (async)
```

**Infrastructure**
```
Docker + Docker Compose
Volúmenes persistentes
Red bridge interna
Variables de entorno
```

### Flujo de Datos

```
Usuario → Frontend (React) → Backend (Flask) → LibreOffice → PDF
                ↓                  ↓
           WebSocket          Telegram API
                ↓                  ↓
        Sincronización ←──────────┘
```

### API REST

| Endpoint | Método | Función |
|----------|--------|---------|
| `/api/classes` | POST | Crear clase |
| `/api/classes` | GET | Listar clases |
| `/api/classes/:id` | GET | Obtener clase |
| `/api/classes/:id/pdf` | GET | Descargar PDF |
| `/api/classes/:id/start` | POST | Iniciar sesión |
| `/api/classes/:id/stop` | POST | Terminar sesión |

### WebSocket Events

**Cliente → Servidor:**
- `join_class` - Unirse a sala de clase
- `control_action` - Control de presentación (next/prev/goto)

**Servidor → Cliente:**
- `slide_changed` - Notificación de cambio de slide

---

## 📁 Estructura del Proyecto

```
intento1/
├── backend/                    # Backend Flask
│   ├── app.py                 # Main app + API + WebSocket
│   ├── telegram_bot.py        # Telegram bot integration
│   ├── requirements.txt       # Python dependencies
│   └── storage/
│       ├── uploads/           # Original files (PPTX/PPT/PDF)
│       ├── conversions/       # Generated PDFs
│       └── data/
│           └── classes.json   # Metadata database
│
├── frontend/                   # Frontend React
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx        # CRUD de clases
│   │   │   ├── ClassPage.tsx        # Vista de clase
│   │   │   ├── PresentationPage.tsx # Viewer (Reveal.js)
│   │   │   └── ControlPage.tsx      # Control remoto
│   │   ├── components/
│   │   │   ├── ClassForm.tsx        # Form de creación
│   │   │   ├── PresentationDeck.tsx # Render slides
│   │   │   └── ControlPanel.tsx     # Botones control
│   │   ├── hooks/
│   │   │   └── useSocket.ts         # WebSocket hook
│   │   ├── services/
│   │   │   └── api.ts               # HTTP client
│   │   └── types/
│   │       └── index.ts             # TypeScript types
│   ├── package.json
│   └── vite.config.ts
│
├── docs/                       # Documentación
│   ├── USER_GUIDE.md          # Tutorial paso a paso
│   ├── ARCHITECTURE.md        # Arquitectura técnica
│   └── ENVIRONMENT_VARIABLES.md # Config de variables
│
├── scripts/                    # Utilidades
│   └── validate_setup.py      # Validación de config
│
├── docker-compose.yml         # Orquestación
├── .env.example               # Template de variables
├── .gitignore                 # Exclusiones git
└── README.md                  # Documentación principal
```

---

## 🚀 Instalación y Ejecución

### Requisitos Previos

- **Docker Desktop** (incluye Docker Compose)
  - Windows: [Descargar](https://www.docker.com/products/docker-desktop)
  - Mac: [Descargar](https://www.docker.com/products/docker-desktop)
  - Linux: `sudo apt install docker.io docker-compose`

### Instalación Rápida

```powershell
# 1. Clonar repositorio
git clone <url-del-repo>
cd intento1

# 2. Configurar variables (opcional)
Copy-Item .env.example .env
# Editar .env si necesitas Telegram bot u OpenAI

# 3. Validar configuración (opcional)
python scripts/validate_setup.py

# 4. Iniciar servicios
docker compose up --build

# 5. Acceder
# Frontend: http://localhost:5173
# Backend: http://localhost:5000
```

### Primera Ejecución

1. Abre http://localhost:5173
2. Haz clic en "+ Nueva Clase"
3. Completa título, descripción y sube un PPTX/PDF
4. Espera la conversión (5-30 segundos)
5. Haz clic en "Iniciar Clase"
6. Haz clic en "Abrir Presentación"

¡Listo! Tu presentación está corriendo.

---

## 🤖 Configuración del Bot de Telegram

### Paso 1: Crear Bot

1. Abre Telegram y busca: **@BotFather**
2. Envía: `/newbot`
3. Responde con el nombre y username de tu bot
4. **Copia el token** que te proporciona

### Paso 2: Configurar Token

```powershell
# Editar .env
notepad .env
```

Agrega tu token:
```bash
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
```

### Paso 3: Reiniciar Backend

```powershell
docker compose restart backend
```

### Paso 4: Usar el Bot

1. Busca tu bot en Telegram
2. Envía `/start`
3. Usa `/list` para ver clases
4. Usa `/select <ID>` para controlar una clase
5. Usa `/next`, `/prev`, `/goto` para navegar

**Comandos disponibles:**
- `/start` - Iniciar
- `/list` - Listar clases
- `/select <ID>` - Seleccionar clase
- `/next` - Siguiente slide
- `/prev` - Slide anterior
- `/goto <N>` - Ir al slide N
- `/status` - Ver estado

---

## 📱 Casos de Uso

### Caso 1: Profesor en Aula

**Situación**: Clase presencial con proyector.

**Configuración**:
1. Laptop conectado al proyector (presentación en pantalla completa)
2. Tablet en el escritorio (control web)
3. Teléfono en mano (bot de Telegram)

**Ventajas**:
- Libertad para moverse por el aula
- Control desde cualquier dispositivo
- Backup instantáneo si un dispositivo falla

### Caso 2: Presentación en Conferencia

**Situación**: Auditorio grande, equipo técnico manejando proyector.

**Configuración**:
1. Equipo técnico opera proyector (presentación)
2. Presentador usa teléfono (Telegram)
3. Moderador tiene tablet (control web backup)

**Ventajas**:
- No necesitas acceso físico al equipo de proyección
- Control desde escenario/podium
- Múltiples personas pueden controlar

### Caso 3: Webinar Online

**Situación**: Presentación virtual por videoconferencia.

**Configuración**:
1. Pantalla 1: Zoom/Teams compartiendo ventana de presentación
2. Pantalla 2: Control web
3. Teléfono: Telegram bot (si necesitas moverte)

**Ventajas**:
- Presentación profesional
- Control independiente de Zoom/Teams
- No depende de controles de la plataforma

---

## 🔧 Configuración Avanzada

### Variables de Entorno

| Variable | Descripción | Requerido |
|----------|-------------|-----------|
| `TELEGRAM_BOT_TOKEN` | Token del bot de Telegram | No |
| `OPENAI_API_KEY` | API key de OpenAI (futuro) | No |
| `FLASK_ENV` | Entorno Flask (development/production) | Sí |
| `VITE_API_BASE_URL` | URL del backend | Sí |
| `VITE_SOCKET_URL` | URL WebSocket | Sí |

**Ver guía completa**: [docs/ENVIRONMENT_VARIABLES.md](docs/ENVIRONMENT_VARIABLES.md)

### Red Local

Para acceder desde otros dispositivos en la misma red:

```powershell
# Obtener tu IP
ipconfig | Select-String "IPv4"
```

Accede desde otro dispositivo:
```
http://192.168.1.XXX:5173/classes/{classId}/control
```

### Desarrollo Local (sin Docker)

**Backend:**
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

**Frontend:**
```powershell
cd frontend
npm install
npm run dev
```

---

## 🧪 Testing

### Testing Manual

```powershell
# 1. Validar configuración
python scripts/validate_setup.py

# 2. Crear clase de prueba
# Frontend → + Nueva Clase → Subir PDF simple

# 3. Iniciar clase
# Página de clase → Iniciar Clase

# 4. Probar sincronización
# Abrir presentación en ventana 1
# Abrir control en ventana 2
# Hacer clic en "Siguiente" en control
# Verificar que presentación avanza

# 5. Probar bot de Telegram
# Telegram → /start
# /list
# /select 1
# /next (verificar que presentación avanza)
```

### Logs de Diagnóstico

```powershell
# Ver todos los logs
docker compose logs -f

# Solo backend
docker compose logs -f backend

# Solo frontend
docker compose logs -f frontend

# Últimas 50 líneas
docker compose logs --tail=50 backend
```

---

## 📊 Métricas del Proyecto

### Líneas de Código

| Componente | Archivos | LOC (aprox) |
|------------|----------|-------------|
| Backend | 2 | 500 |
| Frontend | 15+ | 1500 |
| Documentación | 4 | 2000 |
| Scripts | 1 | 250 |
| **Total** | **22+** | **~4250** |

### Dependencias

**Python**: 10 paquetes
- flask, flask-socketio, flask-cors
- python-pptx, python-dotenv
- python-telegram-bot
- eventlet

**Node.js**: 15+ paquetes
- react, react-router-dom
- socket.io-client
- reveal.js, pdfjs-dist
- axios, typescript

### Tamaño del Proyecto

```
Backend Docker image:  ~800 MB (incluye LibreOffice)
Frontend Docker image: ~200 MB
Total workspace:       ~1.2 GB (con node_modules y .venv)
```

---

## 🛡️ Seguridad

### Estado Actual (MVP)

⚠️ **No implementado en esta versión**:
- Autenticación de usuarios
- Autorización basada en roles
- Validación de tokens JWT
- Rate limiting
- HTTPS/SSL

### Recomendaciones para Producción

1. **Implementar autenticación**:
   - JWT tokens para API REST
   - Session-based auth para WebSocket
   
2. **Configurar CORS correctamente**:
   ```python
   CORS(app, resources={
       r"/api/*": {"origins": ["https://tu-dominio.com"]}
   })
   ```

3. **Usar HTTPS**:
   - Certificado SSL (Let's Encrypt)
   - Forzar redirección HTTP → HTTPS

4. **Secrets management**:
   - Docker secrets en lugar de .env
   - Cloud provider secrets (AWS/Azure)

5. **Validación de inputs**:
   - Sanitizar nombres de archivo
   - Validar tamaño y tipo de archivo
   - Rate limiting en uploads

**Ver más**: [docs/ARCHITECTURE.md#seguridad](docs/ARCHITECTURE.md#seguridad)

---

## 🚀 Roadmap Futuro

### Corto Plazo (v2.0)

- [ ] Autenticación y autorización
- [ ] Notas del presentador
- [ ] Temporizador de presentación
- [ ] Estadísticas de uso
- [ ] Export de analytics

### Mediano Plazo (v3.0)

- [ ] Integración con OpenAI (resúmenes, Q&A)
- [ ] Control por voz
- [ ] Anotaciones en tiempo real
- [ ] Grabación de sesiones
- [ ] Multi-idioma

### Largo Plazo (v4.0)

- [ ] IA para generación de contenido
- [ ] Realidad aumentada
- [ ] Integración con LMS (Moodle, Canvas)
- [ ] App móvil nativa
- [ ] Colaboración multi-usuario

---

## 📞 Soporte y Contribución

### Reportar Problemas

Si encuentras un bug:

1. Abre un issue en GitHub
2. Incluye:
   - Descripción del problema
   - Pasos para reproducir
   - Logs (`docker compose logs`)
   - Screenshots (si aplica)

### Contribuir

1. Fork el repositorio
2. Crea una rama: `git checkout -b feature/nueva-funcionalidad`
3. Commit cambios: `git commit -m "Agrega nueva funcionalidad"`
4. Push: `git push origin feature/nueva-funcionalidad`
5. Abre un Pull Request

### Contacto

- **Documentación**: Ver carpeta `docs/`
- **Issues**: GitHub Issues
- **Email**: [Tu email de contacto]

---

## 📄 Licencia

[Especificar licencia - ej: MIT, Apache 2.0, etc.]

---

## 🙏 Agradecimientos

- **LibreOffice** - Conversión de documentos
- **Reveal.js** - Framework de presentaciones
- **PDF.js** - Renderizado de PDFs
- **Flask** y **React** communities

---

**Última actualización**: 2024  
**Versión**: 1.0.0  
**Estado**: Producción (MVP)

---

🎓 **Proyecto creado para**: Entrega Parcial 2 - Asistente de Clase IA
