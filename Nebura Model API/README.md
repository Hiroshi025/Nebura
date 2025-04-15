# Nebura Model API

Este proyecto es una API modular que integra múltiples servicios como Discord, WhatsApp, GitHub, Google AI, y más. A continuación, se detallan las funcionalidades, rutas, comandos y eventos disponibles en el proyecto.

---

## Funcionalidades Principales

### Discord
- **Cliente personalizado (`MyClient`)**:
  - Gestión de comandos, botones, menús, modales y addons.
  - Métodos personalizados como `getEmoji` para obtener emojis del servidor o predeterminados.
  - Configuración avanzada de caché, intents y barridos automáticos.
  - Handlers para cargar y desplegar módulos.

### WhatsApp
- **Cliente de WhatsApp (`MyApp`)**:
  - Gestión de mensajes con almacenamiento en archivos Excel.
  - Escaneo de códigos QR para autenticación.
  - Registro de mensajes con detalles como remitente, adjuntos y contenido.

### API HTTP
- **Rutas públicas y protegidas**:
  - Gestión de licencias.
  - Autenticación y registro de usuarios.
  - Bloqueo y desbloqueo de direcciones IP.
  - Estado del sistema y servicios como Discord.
  - Integración con GitHub para obtener datos de usuarios y repositorios.
  - Procesamiento de texto y archivos con Google AI.

---

## Rutas Disponibles

### Discord
- **Estado del servicio**:  
  - `GET /api/v1/public/discord/status`
- **Actualizaciones recientes**:  
  - `GET /api/v1/public/discord/updates`
- **Incidentes recientes**:  
  - `GET /api/v1/public/discord/incidents`
- **Datos combinados (estado, actualizaciones, incidentes)**:  
  - `GET /api/v1/public/discord/recent`

### WhatsApp
- **No se exponen rutas HTTP directamente, pero el cliente maneja eventos de mensajes y autenticación.**

### Licencias
- **Crear licencia**:  
  - `POST /api/v1/license/`
- **Actualizar licencia**:  
  - `PUT /api/v1/license/:id`
- **Eliminar licencia**:  
  - `DELETE /api/v1/license/:id`
- **Obtener todas las licencias**:  
  - `GET /api/v1/license/`
- **Obtener licencia por ID**:  
  - `GET /api/v1/license/:id`
- **Validar licencia**:  
  - `POST /api/v1/license/validate/:key`

### Autenticación
- **Obtener perfil de usuario**:  
  - `GET /api/v1/auth/:id`
- **Registrar usuario**:  
  - `POST /api/v1/auth/register`
- **Iniciar sesión**:  
  - `POST /api/v1/auth/login`

### Bloqueo de IP
- **Bloquear IP**:  
  - `POST /api/v1/admin/block-ip`
- **Desbloquear IP**:  
  - `DELETE /api/v1/admin/unblock-ip/:ipAddress`
- **Listar IPs bloqueadas**:  
  - `GET /api/v1/admin/blocked-ips`

### Seguridad
- **Información de IP**:  
  - `GET /api/v1/security/ip-info/:ipAddress`
- **Información de licencia**:  
  - `GET /api/v1/security/license-info/:licenseKey`

### GitHub
- **Información de usuario**:  
  - `GET /api/v1/public/github/users/:username`
- **Información completa de usuario**:  
  - `GET /api/v1/public/github/users/:username/all`
- **Repositorios de usuario**:  
  - `GET /api/v1/public/github/users/:username/repos`
- **Información de repositorio**:  
  - `GET /api/v1/public/github/repos/:owner/:repo`

### Google AI
- **Procesar texto**:  
  - `POST /api/v1/service/google/model-ai/text`
- **Procesar archivo**:  
  - `POST /api/v1/service/google/model-ai/file`
- **Procesar texto y archivo combinado**:  
  - `POST /api/v1/service/google/model-ai/advanced`

### Tareas y Recordatorios
- **Crear tarea**:  
  - `POST /api/v1/service/tasks`
- **Obtener tarea por ID**:  
  - `GET /api/v1/service/tasks/:id`
- **Obtener todas las tareas**:  
  - `GET /api/v1/service/tasks`
- **Actualizar tarea**:  
  - `PATCH /api/v1/service/tasks/:id`
- **Eliminar tarea**:  
  - `DELETE /api/v1/service/tasks/:id`
- **Obtener recordatorios próximos**:  
  - `GET /reminders`

---

## Comandos y Eventos

### Discord
- **Comandos**:
  - Gestión de comandos personalizados con categorías y alias.
- **Eventos**:
  - `ready`: Indica que el cliente está listo.
  - `messageCreate`: Manejo de mensajes entrantes.
  - `interactionCreate`: Manejo de interacciones como botones y menús.

### WhatsApp
- **Eventos**:
  - `qr`: Generación de código QR para autenticación.
  - `authenticated`: Confirmación de autenticación exitosa.
  - `message`: Manejo de mensajes entrantes.

### WebSocket
- **Eventos**:
  - `connection`: Establecimiento de conexión con clientes WebSocket.

---

## Posibles Mejoras

1. **Documentación**:
   - Generar documentación automática de las rutas usando herramientas como Swagger o Postman.
2. **Pruebas**:
   - Implementar pruebas unitarias y de integración para garantizar la estabilidad del sistema.
3. **Optimización de rendimiento**:
   - Mejorar la gestión de caché y barridos automáticos en el cliente de Discord.
4. **Seguridad**:
   - Implementar validaciones más robustas en las rutas públicas.
5. **Escalabilidad**:
   - Modularizar aún más los controladores y servicios para facilitar la adición de nuevas funcionalidades.
6. **Logs centralizados**:
   - Integrar un sistema de logging centralizado como Winston o Logstash para un mejor monitoreo.
7. **Soporte multilenguaje**:
   - Ampliar el soporte de i18n para incluir más idiomas en las respuestas de la API.
