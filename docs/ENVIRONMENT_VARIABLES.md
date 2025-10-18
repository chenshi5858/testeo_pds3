# Guía de Variables de Entorno y Tokens

Esta guía explica cómo configurar tokens, API keys y variables de entorno para el proyecto.

## 📋 Índice

1. [Variables disponibles](#variables-disponibles)
2. [Configuración local (sin Docker)](#configuración-local-sin-docker)
3. [Configuración con Docker](#configuración-con-docker)
4. [Backend: Lectura de variables](#backend-lectura-de-variables)
5. [Frontend: Lectura de variables](#frontend-lectura-de-variables)
6. [Buenas prácticas de seguridad](#buenas-prácticas-de-seguridad)

---

## Variables disponibles

### Backend (Flask)

| Variable | Descripción | Requerido | Ejemplo |
|----------|-------------|-----------|---------|
| `TELEGRAM_BOT_TOKEN` | Token del bot de Telegram | No | `8457888537:AAG...` |
| `OPENAI_API_KEY` | API Key de OpenAI (GPT) | No | `sk-proj-...` |
| `FLASK_ENV` | Entorno de Flask | Sí | `development` o `production` |

### Frontend (Vite/React)

| Variable | Descripción | Requerido | Ejemplo |
|----------|-------------|-----------|---------|
| `VITE_API_BASE_URL` | URL del backend | Sí | `http://localhost:5000` |
| `VITE_SOCKET_URL` | URL del servidor WebSocket | Sí | `http://localhost:5000` |

**⚠️ Importante:** En Vite, las variables **deben tener el prefijo `VITE_`** para ser expuestas al cliente.

---

## Configuración local (sin Docker)

### 1. Crear archivo `.env`

Copia el archivo de ejemplo:

```powershell
# PowerShell
Copy-Item .env.example .env
```

```bash
# Bash (Linux/Mac)
cp .env.example .env
```

### 2. Editar `.env`

Abre `.env` con tu editor favorito y completa los valores:

```bash
# Backend
TELEGRAM_BOT_TOKEN=tu_token_de_telegram_aqui
OPENAI_API_KEY=tu_api_key_de_openai_aqui

# Flask
FLASK_ENV=development

# Frontend (Vite)
VITE_API_BASE_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

### 3. Ejecutar servicios localmente

#### Backend (Python)

```powershell
# Instalar dependencias
cd backend
pip install -r requirements.txt

# Cargar variables y ejecutar
python app.py
```

Las variables se cargan automáticamente con `python-dotenv` (línea `load_dotenv()` en `app.py`).

#### Frontend (Node.js)

```powershell
# Instalar dependencias
cd frontend
npm install

# Ejecutar en modo desarrollo
npm run dev

# O construir para producción
npm run build
npm run preview
```

Vite carga las variables `VITE_*` automáticamente desde `.env`.

---

## Configuración con Docker

### Método 1: Variables en `docker-compose.yml`

Edita `docker-compose.yml` y agrega tus variables:

```yaml
services:
  backend:
    environment:
      - TELEGRAM_BOT_TOKEN=tu_token_aqui
      - OPENAI_API_KEY=tu_api_key_aqui
      - FLASK_ENV=development
```

### Método 2: Archivo `env_file` (recomendado)

Ya está configurado en `docker-compose.yml`:

```yaml
services:
  backend:
    env_file:
      - .env.example  # Cambia esto a .env si tienes valores secretos
```

Solo asegúrate de que `.env.example` (o `.env`) contenga tus valores.

### Método 3: Variables de entorno del host

```powershell
# PowerShell
$env:TELEGRAM_BOT_TOKEN="tu_token"
$env:OPENAI_API_KEY="tu_api_key"
docker compose up
```

### Reconstruir contenedores

Después de cambiar variables que afectan el **build** (como `VITE_*`), reconstruye:

```powershell
docker compose down
docker compose build --no-cache
docker compose up -d
```

---

## Backend: Lectura de variables

### En Python (Flask)

El archivo `backend/app.py` usa `python-dotenv` para cargar variables:

```python
from dotenv import load_dotenv
import os

# Cargar variables desde .env
load_dotenv()

# Leer variables
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Con valor por defecto
FLASK_ENV = os.getenv("FLASK_ENV", "production")

# Verificar si existe
if not TELEGRAM_BOT_TOKEN:
    print("TELEGRAM_BOT_TOKEN no configurado")
```

### Variables requeridas vs opcionales

```python
# Opcional: advertir si no está configurada
if not TELEGRAM_BOT_TOKEN:
    app.logger.warning("Telegram bot deshabilitado (TELEGRAM_BOT_TOKEN no configurado)")

# Requerida: lanzar error si no está
REQUIRED_VAR = os.getenv("REQUIRED_VAR")
if not REQUIRED_VAR:
    raise RuntimeError("REQUIRED_VAR es obligatoria")
```

---

## Frontend: Lectura de variables

### En Vite (React/TypeScript)

Las variables con prefijo `VITE_` se exponen automáticamente:

```typescript
// Acceder a variables
const API_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:5000';

// Verificar si existe
if (!import.meta.env.VITE_API_BASE_URL) {
  console.warn('VITE_API_BASE_URL no configurada, usando default');
}
```

### Tipos de TypeScript para variables

En `frontend/src/vite-env.d.ts`:

```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_SOCKET_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

### ⚠️ Importante sobre seguridad

**NUNCA** expongas secretos en variables `VITE_*`. Vite incluye estas variables en el bundle JavaScript que se envía al navegador, por lo que **cualquiera puede verlas**.

❌ **NO HAGAS ESTO:**
```bash
# Esto expondrá tu API key en el navegador
VITE_OPENAI_API_KEY=sk-proj-...
```

✅ **HAZ ESTO:**
```bash
# Secretos solo en backend
OPENAI_API_KEY=sk-proj-...

# Frontend solo recibe URLs públicas
VITE_API_BASE_URL=http://localhost:5000
```

---

## Buenas prácticas de seguridad

### 1. Nunca commitear archivos `.env`

Asegúrate de que `.env` esté en `.gitignore`:

```gitignore
# .gitignore
.env
.env.local
.env.*.local
```

### 2. Usar `.env.example` como plantilla

Commitea un archivo `.env.example` con valores de ejemplo (sin secretos):

```bash
# .env.example
TELEGRAM_BOT_TOKEN=obtener_de_botfather
OPENAI_API_KEY=obtener_de_openai
FLASK_ENV=development
```

### 3. Separar entornos

Usa archivos diferentes para cada entorno:

```
.env.development   # Desarrollo local
.env.staging       # Servidor de staging
.env.production    # Producción
```

Carga el correcto según el entorno:

```python
# Python
from dotenv import load_dotenv
import os

env = os.getenv('FLASK_ENV', 'development')
load_dotenv(f'.env.{env}')
```

### 4. Docker Secrets (producción)

Para producción, usa Docker Secrets en lugar de variables de entorno:

```yaml
# docker-compose.prod.yml
services:
  backend:
    secrets:
      - telegram_bot_token
      - openai_api_key

secrets:
  telegram_bot_token:
    file: ./secrets/telegram_bot_token.txt
  openai_api_key:
    file: ./secrets/openai_api_key.txt
```

```python
# Leer secrets en Python
def get_secret(name):
    try:
        with open(f'/run/secrets/{name}', 'r') as f:
            return f.read().strip()
    except FileNotFoundError:
        return os.getenv(name.upper())

TELEGRAM_BOT_TOKEN = get_secret('telegram_bot_token')
```

### 5. Rotar secretos regularmente

- Cambia tokens y API keys periódicamente
- Revoca tokens viejos inmediatamente
- Usa gestores de secretos (AWS Secrets Manager, Azure Key Vault, HashiCorp Vault)

### 6. Validar variables al inicio

```python
# backend/app.py
REQUIRED_VARS = ['FLASK_ENV']
OPTIONAL_VARS = ['TELEGRAM_BOT_TOKEN', 'OPENAI_API_KEY']

# Validar requeridas
missing = [var for var in REQUIRED_VARS if not os.getenv(var)]
if missing:
    raise RuntimeError(f"Variables requeridas no configuradas: {missing}")

# Advertir opcionales
for var in OPTIONAL_VARS:
    if not os.getenv(var):
        app.logger.warning(f"{var} no configurada, funcionalidad limitada")
```

---

## Solución de problemas

### Variables no se cargan en Docker

1. Verifica que `env_file` apunte al archivo correcto en `docker-compose.yml`
2. Reconstruye los contenedores: `docker compose build --no-cache`
3. Verifica las variables dentro del contenedor:
   ```powershell
   docker exec -it intento1-backend-1 env | grep TELEGRAM
   ```

### Variables `VITE_*` no funcionan

1. Asegúrate de que tengan el prefijo `VITE_`
2. Reconstruye el frontend (las variables se embeben en build time):
   ```powershell
   docker compose build --no-cache frontend
   ```
3. Verifica en el navegador (F12 → Console):
   ```javascript
   console.log(import.meta.env.VITE_API_BASE_URL);
   ```

### Bot de Telegram no arranca

1. Verifica el token:
   ```powershell
   docker exec -it intento1-backend-1 env | grep TELEGRAM_BOT_TOKEN
   ```
2. Revisa los logs del backend:
   ```powershell
   docker compose logs backend
   ```
3. Prueba el token manualmente con `curl`:
   ```powershell
   curl https://api.telegram.org/bot<TU_TOKEN>/getMe
   ```

---

## Ejemplos completos

### Ejemplo 1: Desarrollo local sin Docker

```powershell
# 1. Clonar y configurar
git clone <repo>
cd intento1
Copy-Item .env.example .env

# 2. Editar .env con tus valores
notepad .env

# 3. Backend
cd backend
pip install -r requirements.txt
python app.py

# 4. Frontend (nueva terminal)
cd frontend
npm install
npm run dev
```

### Ejemplo 2: Producción con Docker

```powershell
# 1. Configurar variables de producción
Copy-Item .env.example .env.production

# 2. Editar docker-compose.yml
# Cambiar env_file: .env.example → .env.production

# 3. Construir y ejecutar
docker compose build
docker compose up -d

# 4. Verificar
docker compose ps
docker compose logs -f
```

---

## Recursos adicionales

- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [python-dotenv Documentation](https://github.com/theskumar/python-dotenv)
- [Docker Compose Environment Variables](https://docs.docker.com/compose/environment-variables/)
- [Docker Secrets](https://docs.docker.com/engine/swarm/secrets/)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [OpenAI API Keys](https://platform.openai.com/api-keys)
