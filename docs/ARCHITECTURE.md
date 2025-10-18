# Arquitectura del Sistema

Sistema de presentaciones con control remoto multi-dispositivo usando React, Flask y Telegram.

## 🎯 Visión General

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USUARIOS                                        │
├────────────────┬────────────────────┬────────────────────────────────────────┤
│  Navegador Web │  Navegador Web     │      Telegram                          │
│  (Presentador) │  (Control)         │      Bot                               │
└────────┬───────┴──────┬─────────────┴──────────┬─────────────────────────────┘
         │              │                        │
         │  HTTP/WS     │  HTTP/WS               │  Telegram API
         │              │                        │
┌────────▼──────────────▼────────────────────────▼─────────────────────────────┐
│                         FRONTEND (React + Vite)                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                      │
│  │  Dashboard   │  │ Presentation │  │   Control    │                      │
│  │   (CRUD)     │  │   (Viewer)   │  │   (Remote)   │                      │
│  └──────────────┘  └──────────────┘  └──────────────┘                      │
│                                                                               │
│  Libraries: Reveal.js, PDF.js, Socket.IO Client                             │
└───────────────────────────────┬───────────────────────────────────────────────┘
                                │
                                │  REST API + WebSocket (Socket.IO)
                                │
┌───────────────────────────────▼───────────────────────────────────────────────┐
│                          BACKEND (Flask + Python)                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  REST API Endpoints                                                   │   │
│  │  - POST /api/classes (Upload)                                        │   │
│  │  - GET  /api/classes/:id                                             │   │
│  │  - GET  /api/classes/:id/pdf                                         │   │
│  │  - POST /api/classes/:id/start                                       │   │
│  │  - POST /api/classes/:id/stop                                        │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  WebSocket Handlers (Flask-SocketIO)                                 │   │
│  │  - connect / disconnect                                              │   │
│  │  - join_class / leave_class                                          │   │
│  │  - control_action (next, prev, goto)                                 │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  Telegram Bot (python-telegram-bot)                                  │   │
│  │  - Background asyncio thread                                         │   │
│  │  - Commands: /start, /list, /select, /next, /prev, /goto           │   │
│  │  - Emits Socket.IO events to classId rooms                           │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  Services                                                             │   │
│  │  - LibreOffice Headless (PPTX → PDF conversion)                     │   │
│  │  - python-pptx (slide text extraction)                               │   │
│  │  - ClassStore (JSON persistence)                                     │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────────────────────┘
                                │
                                │  File System
                                │
┌───────────────────────────────▼───────────────────────────────────────────────┐
│                              STORAGE                                          │
│  backend/storage/                                                            │
│  ├── uploads/         (Original PPTX/PPT/PDF files)                         │
│  ├── conversions/     (Generated PDFs)                                       │
│  └── data/                                                                    │
│      └── classes.json (Metadata database)                                    │
└───────────────────────────────────────────────────────────────────────────────┘
```

## 🔄 Flujos de Datos

### 1. Creación de Clase

```
Usuario → Frontend Dashboard → Backend API
                                    ↓
                           Upload PPTX/PPT/PDF
                                    ↓
                         ┌──────────┴──────────┐
                         │                     │
                    [Si es PPTX]          [Si es PDF]
                         │                     │
                    LibreOffice               Skip
                    Conversion
                         │                     │
                         └──────────┬──────────┘
                                    ↓
                            Save to storage/
                                    ↓
                         python-pptx extract text
                                    ↓
                            Store in classes.json
                                    ↓
                           Return class metadata
```

### 2. Sincronización en Tiempo Real

```
Control Interface (Web/Telegram)
        │
        │ Acción: Next/Prev/Goto
        │
        ▼
    Backend Socket.IO Handler
        │
        │ Emit to room: classId
        │
        ├───────────────┬───────────────┐
        │               │               │
        ▼               ▼               ▼
   Viewer 1        Viewer 2      Control Interface
   (Projector)     (Laptop)      (Tablet)
```

**Eventos WebSocket:**
- `join_class` → Cliente se une a sala de clase
- `control_action` → Cambio de diapositiva emitido
- `slide_changed` → Broadcast a todos los clientes en la sala

### 3. Control con Telegram Bot

```
Usuario → Telegram App → Telegram Server → Backend Bot
                                                 │
                                /start           │
                                                 ▼
                                     TelegramBot.start_command()
                                                 │
                                /select 123      │
                                                 ▼
                                    Store selected_class
                                                 │
                                /next            │
                                                 ▼
                                  socketio.emit('control_action',
                                    {'action': 'next'},
                                    room=classId)
                                                 │
                                                 ▼
                                    Broadcast to all viewers
```

## 🏗️ Arquitectura de Componentes

### Frontend (React + TypeScript + Vite)

```
src/
├── pages/
│   ├── Dashboard.tsx         # CRUD de clases
│   ├── ClassPage.tsx         # Vista individual de clase
│   ├── PresentationPage.tsx  # Viewer (Reveal.js + PDF.js)
│   └── ControlPage.tsx       # Control remoto web
├── components/
│   ├── ClassForm.tsx         # Formulario de creación
│   ├── PresentationDeck.tsx  # Renderizado de diapositivas
│   └── ControlPanel.tsx      # Botones de control
├── hooks/
│   └── useSocket.ts          # WebSocket connection
├── services/
│   └── api.ts                # HTTP requests (axios)
└── types/
    └── index.ts              # TypeScript interfaces
```

**Librerías clave:**
- **Vite**: Build tool con HMR
- **React Router**: Navegación SPA
- **Socket.IO Client**: WebSocket bidireccional
- **Reveal.js**: Framework de presentaciones HTML
- **PDF.js**: Renderizado de PDFs en canvas

### Backend (Flask + Python)

```
backend/
├── app.py                    # Main Flask app + SocketIO
├── telegram_bot.py           # Telegram bot implementation
├── requirements.txt          # Python dependencies
└── storage/
    ├── uploads/              # Original files
    ├── conversions/          # Generated PDFs
    └── data/
        └── classes.json      # Metadata DB
```

**Componentes principales:**

1. **Flask App** (`app.py`):
   - REST API con decoradores `@app.route()`
   - WebSocket handlers con `@socketio.on()`
   - ClassStore para persistencia en JSON
   - CORS habilitado para desarrollo

2. **Telegram Bot** (`telegram_bot.py`):
   - Clase `TelegramBot` con handlers
   - Integración con Socket.IO para emitir eventos
   - Asyncio event loop en background thread
   - Inline keyboards para UX mejorada

3. **LibreOffice Service**:
   - Conversión headless de PPTX/PPT → PDF
   - Comando: `soffice --headless --convert-to pdf`

## 🔌 API Specification

### REST Endpoints

| Method | Endpoint | Description | Body | Response |
|--------|----------|-------------|------|----------|
| `POST` | `/api/classes` | Crear clase | FormData (file, title, description) | Class metadata |
| `GET` | `/api/classes` | Listar clases | - | Array of classes |
| `GET` | `/api/classes/:id` | Obtener clase | - | Class metadata |
| `GET` | `/api/classes/:id/pdf` | Descargar PDF | - | PDF file |
| `POST` | `/api/classes/:id/start` | Iniciar sesión | - | {success: true} |
| `POST` | `/api/classes/:id/stop` | Terminar sesión | - | {success: true} |
| `GET` | `/api/sessions/active` | Sesiones activas | - | Array of sessions |

### WebSocket Events

**Cliente → Servidor:**

| Event | Data | Description |
|-------|------|-------------|
| `join_class` | `{classId: string}` | Unirse a sala de clase |
| `leave_class` | `{classId: string}` | Salir de sala |
| `control_action` | `{classId, action, slideIndex?}` | Control de presentación |

**Servidor → Cliente:**

| Event | Data | Description |
|-------|------|-------------|
| `slide_changed` | `{action, slideIndex}` | Notificación de cambio |
| `connected` | `{socketId}` | Confirmación de conexión |

## 🔐 Seguridad

### Autenticación

**Estado actual**: Sin autenticación implementada (MVP).

**Para producción**, implementar:
- JWT tokens para API REST
- Session-based auth para WebSocket
- Telegram user ID validation

### Autorización

```python
# Ejemplo futuro
@socketio.on('control_action')
def handle_control(data):
    classId = data.get('classId')
    user = get_current_user()  # Desde JWT/session
    
    if not user.can_control(classId):
        return {'error': 'Unauthorized'}, 403
    
    # Process action...
```

### CORS

Actualmente habilitado para desarrollo:
```python
CORS(app, resources={r"/api/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*")
```

**Para producción**, especificar origins:
```python
CORS(app, resources={
    r"/api/*": {"origins": ["https://tu-dominio.com"]}
})
```

### Validación de Archivos

```python
ALLOWED_EXTENSIONS = {'pptx', 'ppt', 'pdf'}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
```

## 📦 Deployment

### Docker Compose (Desarrollo)

```yaml
services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    volumes:
      - ./backend/storage:/app/storage
    env_file:
      - .env.example
    
  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    environment:
      - VITE_API_BASE_URL=http://localhost:5000
```

### Producción (Ejemplo con Docker)

**Backend**: Usar Gunicorn + Eventlet

```dockerfile
# Dockerfile.prod
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install gunicorn eventlet
RUN pip install -r requirements.txt
COPY . .
CMD ["gunicorn", "-k", "eventlet", "-w", "1", "-b", "0.0.0.0:5000", "app:app"]
```

**Frontend**: Build estático + Nginx

```dockerfile
# Dockerfile.prod
FROM node:18 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
```

### Variables de Entorno en Producción

**NO usar `.env` files en producción**. Preferir:
- Docker secrets
- Kubernetes secrets
- Cloud provider secrets (AWS Secrets Manager, Azure Key Vault)

```yaml
# docker-compose.prod.yml
services:
  backend:
    secrets:
      - telegram_bot_token
      - openai_api_key

secrets:
  telegram_bot_token:
    external: true
  openai_api_key:
    external: true
```

## 🧪 Testing Strategy

### Backend Tests

```python
# tests/test_api.py
def test_create_class(client):
    response = client.post('/api/classes', data={
        'title': 'Test',
        'file': (io.BytesIO(b'content'), 'test.pdf')
    })
    assert response.status_code == 201
    
def test_websocket_sync(socketio_client):
    socketio_client.emit('join_class', {'classId': '123'})
    socketio_client.emit('control_action', {
        'classId': '123',
        'action': 'next'
    })
    received = socketio_client.get_received()
    assert received[0]['name'] == 'slide_changed'
```

### Frontend Tests

```typescript
// tests/PresentationPage.test.tsx
describe('PresentationPage', () => {
  it('syncs slide changes', () => {
    const { container } = render(<PresentationPage />);
    socket.emit('slide_changed', { action: 'next' });
    expect(Reveal.next).toHaveBeenCalled();
  });
});
```

## 🚀 Performance Optimization

### Backend

- **Async I/O**: Socket.IO con eventlet para manejo concurrente
- **File caching**: PDFs generados se cachean en `storage/conversions/`
- **Lazy loading**: Clases se cargan bajo demanda

### Frontend

- **Code splitting**: React.lazy() para componentes pesados
- **PDF streaming**: PDF.js renderiza páginas por demanda
- **WebSocket connection pooling**: Una conexión por cliente

### Escalabilidad

Para múltiples instancias del backend:

1. **Redis adapter** para Socket.IO:
   ```python
   from socketio import RedisManager
   socketio = SocketIO(app, message_queue='redis://localhost:6379')
   ```

2. **Shared storage**: S3, Azure Blob Storage, o NFS
3. **Load balancer** con sticky sessions

## 📚 Referencias Técnicas

- [Flask Documentation](https://flask.palletsprojects.com/)
- [Flask-SocketIO Documentation](https://flask-socketio.readthedocs.io/)
- [python-telegram-bot Documentation](https://docs.python-telegram-bot.org/)
- [Reveal.js Documentation](https://revealjs.com/)
- [PDF.js Documentation](https://mozilla.github.io/pdf.js/)
- [Vite Documentation](https://vitejs.dev/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)

---

**Versión**: 1.0  
**Última actualización**: 2024
