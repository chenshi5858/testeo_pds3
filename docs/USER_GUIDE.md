# Guía de Uso del Sistema

Tutorial paso a paso para usar el sistema de presentaciones con control remoto.

## 📋 Índice

1. [Configuración Inicial](#configuración-inicial)
2. [Crear una Clase](#crear-una-clase)
3. [Iniciar una Presentación](#iniciar-una-presentación)
4. [Control Web](#control-web)
5. [Control con Telegram](#control-con-telegram)
6. [Múltiples Dispositivos](#múltiples-dispositivos)
7. [Solución de Problemas](#solución-de-problemas)

---

## Configuración Inicial

### 1. Clonar y Configurar el Proyecto

```powershell
# Clonar el repositorio
git clone <url-del-repo>
cd intento1

# Configurar variables de entorno
Copy-Item .env.example .env

# Editar .env con tus valores (opcional para empezar)
notepad .env
```

### 2. Validar Configuración (Recomendado)

```powershell
python scripts/validate_setup.py
```

Si todo está correcto, verás:
```
✓ Todas las validaciones pasaron correctamente

Próximos pasos:
  1. Ejecuta: docker compose up --build
  2. Abre: http://localhost:5173
  3. Configura tu bot de Telegram (ver README.md)
```

### 3. Iniciar Servicios

```powershell
# Primera vez o después de cambios
docker compose up --build

# Ejecuciones posteriores
docker compose up -d  # Modo background
```

Espera a ver:
```
✔ Container intento1-backend-1   Started
✔ Container intento1-frontend-1  Started
```

### 4. Verificar que Funciona

Abre tu navegador en: **http://localhost:5173**

Deberías ver el dashboard con el título "Clases Disponibles" y un botón "+ Nueva Clase".

---

## Crear una Clase

### Paso 1: Preparar tu Presentación

Formatos soportados:
- **PPTX** (PowerPoint 2007+)
- **PPT** (PowerPoint 97-2003)
- **PDF** (sin conversión)

**Límite de tamaño**: 50 MB

### Paso 2: Completar el Formulario

1. Haz clic en **"+ Nueva Clase"**
2. Completa los campos:
   - **Título**: Nombre descriptivo (ej: "Introducción a Python")
   - **Descripción**: Detalles opcionales (ej: "Conceptos básicos y sintaxis")
3. Haz clic en **"Seleccionar Archivo"**
4. Elige tu presentación (PPTX/PPT/PDF)
5. Haz clic en **"Crear Clase"**

### Paso 3: Conversión Automática

El sistema automáticamente:
1. ✓ Sube el archivo original
2. ✓ Convierte PPTX/PPT → PDF (con LibreOffice)
3. ✓ Extrae texto de las diapositivas
4. ✓ Genera metadata
5. ✓ Te redirige a la página de la clase

**Tiempo estimado**: 5-30 segundos según el tamaño del archivo.

### Resultado

Verás la página de tu clase con:
- Título y descripción
- Número de diapositivas detectadas
- Botones: **"Iniciar Clase"**, **"Descargar PDF"**
- Enlaces: **"Abrir Presentación"**, **"Abrir Control"**

---

## Iniciar una Presentación

### Opción A: Proyección en el Mismo Dispositivo

**Escenario**: Presentas desde tu laptop conectada a un proyector.

1. En la página de la clase, haz clic en **"Iniciar Clase"**
2. Haz clic en **"Abrir Presentación"** (se abre en nueva pestaña)
3. Presiona **F11** para pantalla completa
4. Controla con:
   - **Flechas del teclado** (←/→)
   - **Barra espaciadora** (siguiente)
   - **Telegram** desde tu teléfono (ver abajo)

### Opción B: Proyección Multi-Dispositivo

**Escenario**: Proyectas en TV/proyector y controlas desde tablet/teléfono.

**En el dispositivo de proyección:**
1. Abre: `http://localhost:5173/classes/{classId}/presentation`
   - (Reemplaza `{classId}` con el ID de tu clase, ej: `1705423891234`)
2. Presiona F11 para pantalla completa
3. **Deja esta ventana abierta**

**En tu dispositivo de control:**
- Opción 1: Control Web (ver sección siguiente)
- Opción 2: Bot de Telegram (ver sección siguiente)

---

## Control Web

### Acceder al Control

1. En la página de la clase, haz clic en **"Abrir Control"**
2. O navega directamente: `http://localhost:5173/classes/{classId}/control`

### Interfaz de Control

Verás:

```
┌─────────────────────────────────┐
│  Control de Presentación        │
├─────────────────────────────────┤
│  Clase: Introducción a Python   │
│  Diapositivas: 25                │
├─────────────────────────────────┤
│   [  ⬅️ Anterior  ]              │
│   [  Siguiente ➡️  ]             │
│   [  Ir a slide: ____ ] [Go]    │
└─────────────────────────────────┘
```

### Controles Disponibles

| Botón | Acción | Atajo de Teclado |
|-------|--------|------------------|
| **⬅️ Anterior** | Diapositiva anterior | ← |
| **Siguiente ➡️** | Siguiente diapositiva | → |
| **Ir a slide** | Saltar a diapositiva específica | G + número |

### Sincronización

Cuando haces clic en un botón:
1. ✓ El control envía evento WebSocket al backend
2. ✓ Backend emite el evento a la sala de la clase
3. ✓ Todas las presentaciones conectadas reciben el cambio
4. ✓ **Tiempo de latencia**: ~50-200ms

**Dispositivos sincronizados simultáneamente:**
- Presentación en proyector
- Control web en tablet
- Bot de Telegram en teléfono

---

## Control con Telegram

### Configuración Inicial (Una Vez)

#### 1. Crear Bot en Telegram

1. Abre Telegram y busca: **@BotFather**
2. Envía: `/newbot`
3. Responde las preguntas:
   ```
   BotFather: Alright, a new bot. How are we going to call it?
   Tú: Mi Presentador

   BotFather: Good. Now let's choose a username for your bot.
   Tú: MiPresentadorBot
   ```
4. **Copia el token** que te da BotFather:
   ```
   Done! Your token is: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz
   ```

#### 2. Configurar Token en el Sistema

```powershell
# Editar .env
notepad .env
```

Pega tu token:
```bash
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
```

Guarda y cierra el archivo.

#### 3. Reiniciar Backend

```powershell
# Reiniciar solo backend
docker compose restart backend

# Verificar que el bot arrancó
docker compose logs backend | Select-String "Telegram"
```

Deberías ver:
```
backend-1  | INFO: Telegram bot started successfully
```

### Uso del Bot

#### 1. Iniciar Conversación

1. Busca tu bot en Telegram (usa el nombre que le diste)
2. Envía: `/start`

Respuesta del bot:
```
¡Bienvenido! 🎓

Soy tu asistente para controlar presentaciones.

Comandos disponibles:
/list - Ver clases disponibles
/select <ID> - Seleccionar clase
/next - Siguiente slide
/prev - Slide anterior
/goto <N> - Ir al slide N
/status - Ver estado actual
```

#### 2. Listar Clases

Envía: `/list`

Respuesta:
```
📚 Clases disponibles:

1. Introducción a Python (25 slides)
2. Machine Learning Básico (40 slides)
3. Docker y Kubernetes (35 slides)

Usa /select <ID> para controlar una clase.
```

#### 3. Seleccionar Clase

Envía: `/select 1`

Respuesta:
```
✓ Clase seleccionada: Introducción a Python

Controles rápidos:
[⬅️ Anterior] [Siguiente ➡️]
[📍 Estado]

O usa comandos:
/next - Siguiente
/prev - Anterior
/goto <N> - Ir al slide N
```

#### 4. Controlar la Presentación

**Con botones inline** (recomendado):
- Toca **[Siguiente ➡️]** para avanzar
- Toca **[⬅️ Anterior]** para retroceder
- Toca **[📍 Estado]** para ver diapositiva actual

**Con comandos**:
```
/next          → Siguiente diapositiva
/prev          → Diapositiva anterior
/goto 10       → Ir a la diapositiva 10
/status        → Ver estado (slide actual, total)
```

#### 5. Ver Estado

Envía: `/status`

Respuesta:
```
📊 Estado actual:

Clase: Introducción a Python
Diapositivas: 25 total
Sesión: Activa ✓
```

---

## Múltiples Dispositivos

### Escenario de Uso Real

**Situación**: Presentas en un salón de conferencias.

**Configuración:**

1. **Proyector** (conectado a laptop):
   - Abre: `http://localhost:5173/classes/123/presentation`
   - Pantalla completa (F11)
   - 🔒 Deja la ventana abierta y no toques el laptop

2. **Tablet** (en el podium):
   - Abre: `http://192.168.1.100:5173/classes/123/control`
   - Usa botones web para control

3. **Teléfono** (en tu bolsillo):
   - Abre Telegram
   - Envía: `/select 123`
   - Control con botones inline

### ¿Cómo Funciona la Sincronización?

```
Teléfono (Telegram)  ────┐
                          ▼
Tablet (Web Control) ────► Backend (WebSocket) ───► Proyector (Presentación)
                          ▲
Laptop (Teclado)     ────┘
```

**Latencia típica**: 50-200ms

**Qué se sincroniza**:
- ✓ Cambios de diapositiva (next/prev/goto)
- ✓ Estado actual (slide number)
- ✓ Todos los dispositivos conectados reciben actualizaciones

**Qué NO se sincroniza**:
- ❌ Zoom de la presentación (local a cada dispositivo)
- ❌ Notas del presentador (no implementado aún)

### Acceso desde Red Local

Para controlar desde otro dispositivo en la misma red:

1. **Obtén la IP de tu computadora**:
   ```powershell
   ipconfig | Select-String "IPv4"
   ```
   
   Ejemplo de salida:
   ```
   IPv4 Address: 192.168.1.100
   ```

2. **Accede desde otro dispositivo**:
   ```
   http://192.168.1.100:5173/classes/123/control
   ```

**⚠️ Requisitos:**
- Ambos dispositivos en la misma red WiFi
- Firewall de Windows puede bloquear conexiones (permitir puerto 5173)

---

## Solución de Problemas

### La Presentación No Carga

**Síntomas**: Página en blanco o "Loading..." infinito.

**Soluciones**:

1. **Verifica que la clase está iniciada**:
   - Ve a la página de la clase
   - Haz clic en "Iniciar Clase" si está detenida

2. **Verifica que el PDF existe**:
   ```powershell
   # Listar conversiones
   Get-ChildItem backend/storage/conversions
   ```
   
   Debería mostrar archivos como `{classId}.pdf`.

3. **Revisa logs del backend**:
   ```powershell
   docker compose logs backend --tail=50
   ```
   
   Busca errores de conversión.

4. **Recarga con caché limpio**:
   - Presiona **Ctrl + Shift + R** (Chrome/Edge)
   - O **Ctrl + F5** (Firefox)

### El Control No Sincroniza

**Síntomas**: Haces clic en "Siguiente" pero la presentación no cambia.

**Soluciones**:

1. **Verifica conexión WebSocket**:
   - Abre DevTools (F12)
   - Ve a la pestaña **Console**
   - Deberías ver: `socket connected`

2. **Verifica que estás en la sala correcta**:
   - Console debería mostrar: `joined class {classId}`

3. **Reinicia servicios**:
   ```powershell
   docker compose restart backend
   ```

4. **Verifica la URL del WebSocket**:
   ```powershell
   # En el frontend, verifica .env
   Get-Content .env | Select-String "VITE_SOCKET_URL"
   ```
   
   Debe ser: `VITE_SOCKET_URL=http://localhost:5000`

### El Bot de Telegram No Responde

**Síntomas**: Envías comandos pero el bot no contesta.

**Soluciones**:

1. **Verifica que el token está configurado**:
   ```powershell
   docker exec -it intento1-backend-1 printenv TELEGRAM_BOT_TOKEN
   ```
   
   Debe mostrar tu token (no vacío).

2. **Verifica que el backend arrancó el bot**:
   ```powershell
   docker compose logs backend | Select-String "Telegram"
   ```
   
   Debe mostrar: `INFO: Telegram bot started successfully`

3. **Prueba el token manualmente**:
   ```powershell
   # Reemplaza <TOKEN> con tu token real
   curl https://api.telegram.org/bot<TOKEN>/getMe
   ```
   
   Debe retornar JSON con info del bot.

4. **Reinicia el backend**:
   ```powershell
   docker compose restart backend
   ```

### Error 404 al Crear Clase

**Síntomas**: Al subir un archivo, recibes "404 Not Found".

**Soluciones**:

1. **Verifica que el backend está corriendo**:
   ```powershell
   docker compose ps
   ```
   
   Ambos servicios deben mostrar "Up".

2. **Verifica la URL del backend**:
   - Abre DevTools (F12) → Network
   - Intenta crear una clase
   - Verifica que la request va a: `http://localhost:5000/api/classes`

3. **Reconstruye sin caché**:
   ```powershell
   docker compose down
   docker compose build --no-cache
   docker compose up -d
   ```

### Conversión PPTX Falla

**Síntomas**: La clase se crea pero no tiene PDF o dice "0 slides".

**Soluciones**:

1. **Verifica que LibreOffice está instalado** (en el contenedor):
   ```powershell
   docker exec -it intento1-backend-1 which soffice
   ```
   
   Debe mostrar: `/usr/bin/soffice`

2. **Prueba conversión manual**:
   ```powershell
   docker exec -it intento1-backend-1 bash
   cd storage/uploads
   soffice --headless --convert-to pdf archivo.pptx
   ls *.pdf
   exit
   ```

3. **Revisa logs de LibreOffice**:
   ```powershell
   docker compose logs backend | Select-String "soffice"
   ```

4. **Intenta con un archivo diferente**:
   - Algunos PPTX complejos pueden fallar
   - Prueba con un PPTX simple (3-5 slides)
   - O convierte manualmente a PDF antes de subir

---

## Tips y Mejores Prácticas

### 1. Preparación Pre-Presentación

✓ **DO**:
- Sube tu presentación con anticipación
- Prueba el control desde todos tus dispositivos
- Verifica que la sincronización funciona
- Ten un plan B (PDF descargado localmente)

❌ **DON'T**:
- No esperes hasta minutos antes
- No asumas que "funcionará en el momento"
- No dependas solo de un método de control

### 2. Durante la Presentación

✓ **DO**:
- Usa F11 para pantalla completa
- Ten el bot de Telegram como backup
- Mantén el control web abierto en tablet
- Cierra notificaciones en el dispositivo de proyección

❌ **DON'T**:
- No cierres accidentalmente la presentación
- No cambies de red WiFi durante la presentación
- No pongas el dispositivo de proyección en suspensión

### 3. Red y Conectividad

✓ **DO**:
- Usa red WiFi confiable (no WiFi público)
- Considera usar hotspot de tu teléfono como backup
- Ten los dispositivos completamente cargados

❌ **DON'T**:
- No dependas de WiFi de hotel/conferencia
- No uses datos móviles si tienes red inestable

---

## Recursos Adicionales

- **[Arquitectura del Sistema](ARCHITECTURE.md)** - Diagramas técnicos y flujos
- **[Variables de Entorno](ENVIRONMENT_VARIABLES.md)** - Configuración avanzada
- **[README Principal](../README.md)** - Instalación y ejecución

---

**¿Necesitas ayuda?** Abre un issue en el repositorio con:
1. Descripción del problema
2. Logs del backend (`docker compose logs backend`)
3. Captura de pantalla de la consola del navegador (F12)
