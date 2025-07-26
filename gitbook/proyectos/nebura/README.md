---
cover: ../../.gitbook/assets/marca.png
coverY: 0
---

# Nebura

## Nebura

**Nebura** es una plataforma API modular que integra múltiples servicios como Discord, WhatsApp, GitHub, Google AI y más. Este proyecto está diseñado para ser extensible, soportar comunicación en tiempo real y ofrecer monitoreo robusto, haciéndolo ideal para aplicaciones modernas multi-servicio.

[![GitHub Repo](https://img.shields.io/github/stars/Hiroshi025/Nebura-AI?style=social)](https://github.com/Hiroshi025/Nebura-AI) [![Issues](https://img.shields.io/github/issues/Hiroshi025/Nebura-AI)](https://github.com/Hiroshi025/Nebura-AI/issues) ![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg) [![Homepage](https://img.shields.io/badge/Help%20Center-Online-brightgreen)](https://help.hiroshi-dev.me/)

***

### Tabla de Contenidos

* Descripción del Proyecto
* Arquitectura
* Módulos
  * Servidor API
  * Módulo Discord
  * Módulo WhatsApp
* Configuración
* Ejemplos de Uso
* Desarrollo y Scripts
* Contribuir
* Soporte y Enlaces
* Sobre el Creador
* Resumen de la API
* Estructura de Carpetas

***

### Descripción del Proyecto

Nebura es una plataforma API modular basada en TypeScript que permite la integración fluida de diversos servicios. Utiliza Express, Socket.IO, Prisma ORM y otras librerías modernas para proporcionar un backend escalable y mantenible para bots, automatización y aplicaciones en tiempo real.

**Características principales:**

* Arquitectura modular para Discord, WhatsApp y más.
* Comunicación en tiempo real mediante WebSockets.
* Registro, métricas y monitoreo robustos.
* Respaldos automáticos y tareas programadas.
* Soporte multilenguaje con i18next.
* Gestión segura de sesiones y limitación de peticiones.
* Sistema extensible de comandos y eventos para Discord.

***

### Arquitectura

El núcleo de Nebura es orquestado por la clase `Engine` (`src/main.ts`), que inicializa y gestiona todos los módulos:

* **Servidor API** (`src/server/index.ts`): Servidor HTTP basado en Express con Socket.IO, documentación Swagger, seguridad y métricas.
* **Módulo Discord** (`src/modules/discord/client.ts`): Cliente avanzado de bot de Discord con carga dinámica de comandos, manejo de eventos y modularidad.
* **Módulo WhatsApp** (`src/modules/whatsapp/index.ts`): Cliente WhatsApp Web.js con registro en Excel, reportes de estado y respaldos programados.
* **Base de datos**: Gestionada mediante Prisma ORM, soportando upserts y consultas avanzadas.
* **Monitoreo**: (Opcional) Integración con Sentry para seguimiento de errores.

### Módulos

#### Servidor API

* **Archivo:** `src/server/index.ts`
* **Stack:** Express, Socket.IO, Swagger, Helmet, Apicache, i18next, gestión de sesiones.
* **Características:**
  * Middleware para seguridad, caché, métricas y localización.
  * Swagger UI para documentación de la API.
  * Soporte WebSocket en tiempo real.
  * Servidor de archivos estáticos para documentación y recursos.
  * Bloqueo de IPs y limitación de peticiones.
  * Trazado de peticiones/respuestas con IDs únicos y tiempos de respuesta.

**Ejemplo: Iniciar el Servidor API**

```typescript
import { API } from "./server";
const api = new API();
api.start();
```

#### Módulo Discord

* **Archivo:** `src/modules/discord/client.ts`
* **Stack:** discord.js, carga dinámica de comandos/eventos/componentes.
* **Características:**
  * Estrategias avanzadas de caché y limpieza.
  * Carga y recarga dinámica de comandos, botones, modales y menús.
  * Gestión de alias y descubrimiento recursivo de archivos.
  * Gestión de emojis (servidor y fallback).
  * Manejo de errores y registro.

**Ejemplo: Recargar un Comando**

```typescript
await client.reloadCommand("ping");
```

**Ejemplo: Cargar Todos los Comandos**

```typescript
await client.loadCommands();
```

#### Módulo WhatsApp

* **Archivo:** `src/modules/whatsapp/index.ts`
* **Stack:** whatsapp-web.js, ExcelJS, qrcode-terminal.
* **Características:**
  * Registra todos los mensajes entrantes en archivos Excel diarios.
  * Comando `/status` para estadísticas en tiempo real (uptime, mensajes no leídos, info de respaldos).
  * Respaldos diarios programados en Excel con estadísticas de chats.
  * Autenticación por código QR y gestión de sesiones.
  * Manejo robusto de errores y registro.

**Ejemplo: Comando de Estado en WhatsApp**

Envía `/status` desde el número propio del bot para recibir un reporte detallado de estado.

***

### Configuración

La configuración se gestiona mediante variables de entorno y el objeto `config`.

* **Base de datos:** Define `DATABASE_URL` en tu entorno.
* **Discord:** Proporciona `token`, `clientId`, `clientSecret` y `owners` en la configuración.
* **WhatsApp:** Habilita/deshabilita con `modules.whatsapp.enabled`.
* **Respaldos:** Define `CRON_BACKUPS_TIME` para los respaldos programados.
* **Sentry:** (Opcional) Configura Sentry DSN y entorno.

Consulta `package.json` para scripts y dependencias.

***

### Ejemplos de Uso

#### Iniciar la Aplicación

```bash
npm install
npm run build
npm start
```

#### Modo Desarrollo

```bash
npm run start:dev
```

#### Lint y Formateo

```bash
npm run lint
npm run lint:fix
npm run type-check
```

#### Ejecutar Pruebas

```bash
npm test
```

***

### Desarrollo y Scripts

* **Build:** `npm run build`
* **Start:** `npm start`
* **Modo Dev:** `npm run start:dev`
* **Lint:** `npm run lint`
* **Type Check:** `npm run type-check`
* **Docs:** `npm run docs`
* **Release:** `npm run release`
* **Prepare:** `npm run prepare` (husky hooks)

Consulta todos los scripts en `package.json`.

***

### Contribuir

¡Las contribuciones son bienvenidas! Por favor abre issues o pull requests en [GitHub](https://github.com/Hiroshi025/Nebura-AI).

* [Seguimiento de Issues](https://github.com/Hiroshi025/Nebura-AI/issues)
* [Guía de Contribución](../../../CONTRIBUTING.md)

***

### Soporte y Enlaces

* **Sitio web:** [https://help.hiroshi-dev.me/](https://help.hiroshi-dev.me/)
* **GitHub:** [https://github.com/Hiroshi025/Nebura-AI](https://github.com/Hiroshi025/Nebura-AI)
* **Reportar Bugs:** [GitHub Issues](https://github.com/Hiroshi025/Nebura-AI/issues)
* **Documentación:** Swagger UI (tras iniciar el servidor)
* **Docs Discord.js:** [https://discord.js.org/#/docs](https://discord.js.org/#/docs)
* **Docs WhatsApp Web.js:** [https://wwebjs.dev/guide/](https://wwebjs.dev/guide/)
* **Docs Prisma:** [https://www.prisma.io/docs/](https://www.prisma.io/docs/)
* **Docs Express:** [https://expressjs.com/](https://expressjs.com/)

***

### Sobre el Creador

**Nebura** es desarrollado y mantenido por [Hiroshi025](https://github.com/Hiroshi025).

> _"Mi misión es construir plataformas robustas, escalables y modulares que permitan a los desarrolladores integrar y automatizar múltiples servicios con facilidad. Si tienes preguntas, sugerencias o quieres contribuir, no dudes en contactarme por GitHub o el centro de ayuda."_

* **GitHub:** [Hiroshi025](https://github.com/Hiroshi025)
* **Sponsor:** [GitHub Sponsors](https://github.com/sponsors/tu-usuario)
* **Contacto:** [Abrir un Issue](https://github.com/Hiroshi025/Nebura-AI/issues) o [Centro de Ayuda](https://help.hiroshi-dev.me/)

***

### Resumen de la API

La API de Nebura expone endpoints RESTful para gestión de tareas, recordatorios, licencias, bloqueo de IPs, integración con Discord, Google Gemini y más.

#### Autenticación

La mayoría de los endpoints requieren autenticación mediante un token Bearer JWT. Incluye el token en el header `Authorization`:

```
Authorization: Bearer tu.jwt.token.aqui
```

Algunos endpoints públicos (por ejemplo, `/public/github/users/{username}`) no requieren autenticación.

***

### Endpoints Principales

#### Tareas y Recordatorios

* `GET /service/tasks`: Lista todas las tareas, permite filtrar por estado, prioridad, creador o etiqueta.
* `POST /service/tasks`: Crea una nueva tarea.
* `GET /service/tasks/{id}`: Obtiene detalles de una tarea.
* `PATCH /service/tasks/{id}`: Actualiza campos de una tarea.
* `DELETE /service/tasks/{id}`: Elimina una tarea.
* `GET /service/reminders`: Lista los recordatorios próximos a activarse.

#### Licencias

* `POST /license`: Crea una nueva licencia (requiere admin).
* `GET /license`: Lista todas las licencias.
* `GET /license/{id}`: Detalles de una licencia.
* `PUT /license/{id}`: Actualiza una licencia.
* `DELETE /license/{id}`: Elimina una licencia.
* `POST /license/validate/{key}`: Valida una licencia contra un HWID.
* `GET /license/info/{licenseKey}`: Información detallada de una licencia, IPs bloqueadas y estadísticas de uso.

#### Seguridad y Administración

* `POST /admin/block-ip`: Bloquea una IP.
* `DELETE /admin/unblock-ip/{ipAddress}`: Desbloquea una IP.
* `GET /admin/blocked-ips`: Lista IPs bloqueadas.
* `GET /admin/ip-info/{ipAddress}`: Información de seguridad de una IP.
* `GET /admin/cache-performance`: Métricas de caché (solo desarrollo).
* `GET /admin/prisma-metrics`: Métricas recientes de Prisma (solo admin).

#### Integraciones

**GitHub**

* `GET /public/github/users/{username}`: Info básica de usuario.
* `GET /public/github/users/{username}/all`: Info completa (repos, eventos, orgs).
* `GET /public/github/users/{username}/repos`: Repositorios públicos.
* `GET /public/github/repos/{owner}/{repo}`: Info de un repositorio.

**Discord**

* `GET /public/discord/status`: Estado actual de Discord.
* `GET /public/discord/updates`: Últimas novedades de Discord.
* `GET /public/discord/incidents`: Incidentes activos.
* `GET /publicdiscord/recent`: Estado, novedades e incidentes recientes.

**Google Gemini**

* `POST /service/google/model-ai/text`: Procesa texto con Gemini.
* `POST /service/google/model-ai/file`: Procesa archivo con Gemini.
* `POST /service/google/model-ai/combined`: Procesa texto y archivo juntos.

#### Autenticación de Usuarios

* `POST /auth/register`: Registro de usuario y generación de JWT.
* `POST /auth/login`: Login y obtención de JWT.
* `GET /auth/{id}`: Datos del usuario autenticado.

***

### Ejemplo de Uso de la API

#### Crear una Tarea

```bash
curl -X POST https://host.hiroshi-dev.me/api/v1/service/tasks \
  -H "Authorization: Bearer tu.jwt.token.aqui" \
  -H "Content-Type: application/json" \
  -d '{"title":"Reunión mensual","createdBy":"usuario123"}'
```

#### Validar una Licencia

```bash
curl -X POST https://host.hiroshi-dev.me/api/v1/license/validate/CLAVE-LICENCIA \
  -d "hwid=HWID12345"
```

#### Obtener Estado del Sistema

```bash
curl https://host.hiroshi-dev.me/api/v1/public/status
```

***

### Esquemas de Respuesta

Las respuestas siguen los esquemas definidos en la documentación Swagger. Por ejemplo, una tarea (`TaskResponse`) incluye:

```json
{
  "id": "507f1f77bcf86cd799439011",
  "title": "Reunión mensual",
  "description": "Discutir presupuesto",
  "createdBy": "usuario123",
  "createdAt": "2024-01-20T10:00:00Z",
  "status": "pending",
  "priority": "high",
  "tags": ["trabajo", "finanzas"],
  "reminder": { "enabled": true, "timeBefore": "30 minutes", "notified": false },
  "recurrence": { "type": "monthly", "interval": 1 },
  "autoDelete": "2024-12-31T23:59:59Z"
}
```

***

### Documentación Interactiva

* Accede a la documentación Swagger UI en:\
  http://localhost:PORT/docs (después de iniciar el servidor)
* Consulta la [documentación oficial](https://docs.hiroshi-dev.me) para guías y ejemplos detallados.

***

### Licencia

_Este proyecto está licenciado bajo la Licencia ISC. Consulta el archivo LICENSE para más detalles._

***

### Estructura de Carpetas

La siguiente estructura muestra la organización principal del proyecto. Cada carpeta tiene una responsabilidad clara para facilitar el mantenimiento y la escalabilidad.

```
src/
├── adapters/           # Adaptadores para base de datos, servicios externos y validadores
│   ├── database/       # Prisma ORM y archivos de sesión
│   ├── external/       # Integraciones externas (GitHub, Passport, Swagger)
│   └── validators/     # Validadores de datos (licencia, tareas, usuario)
├── application/        # Lógica de negocio, DTOs, entidades y servicios
│   ├── dto/            # Objetos de transferencia de datos (DTOs)
│   ├── entities/       # Entidades de dominio
│   └── services/       # Servicios de aplicación (auth, licencia, utilidades)
├── gateaway/           # Repositorios para acceso a datos (auth, licencia, tareas)
├── interfaces/         # Interfaces HTTP: controladores, middlewares, rutas y vistas
│   ├── http/
│   │   ├── controllers/    # Controladores organizados por dominio
│   │   ├── middlewares/    # Middlewares de autenticación, tokens, web
│   │   ├── routes/         # Definición de rutas API/web
│   │   └── views/          # Vistas EJS, CSS, imágenes y scripts públicos
│   └── messaging/      # Mensajería y módulos para Discord, WhatsApp, etc.
├── locales/            # Archivos de localización (i18n) por idioma
├── shared/             # Código compartido: clases utilitarias, funciones, constantes
├── typings/            # Definiciones TypeScript personalizadas
├── index.ts            # Punto de entrada principal
├── main.ts             # Inicialización del motor principal
```

**Descripción de carpetas principales:**

* **adapters/**: Contiene adaptadores para la base de datos (Prisma), integraciones externas (como GitHub o Passport) y validadores de datos.
* **application/**: Incluye la lógica de negocio, entidades, DTOs y servicios principales de la aplicación.
* **gateaway/**: Repositorios que gestionan el acceso y persistencia de datos para dominios como autenticación, licencias y tareas.
* **interfaces/**: Define las interfaces HTTP (controladores, middlewares, rutas, vistas) y módulos de mensajería (bots de Discord, WhatsApp, etc.).
* **locales/**: Archivos de internacionalización y localización para soportar múltiples idiomas.
* **shared/**: Código y utilidades compartidas entre distintos módulos del proyecto.
* **typings/**: Definiciones de tipos TypeScript personalizadas para el proyecto.
* **index.ts / main.ts**: Archivos de entrada y bootstrap del motor principal de la plataforma.

**Notas:**

* Los módulos de bots (Discord, WhatsApp) están bajo `src/interfaces/messaging/modules/`.
* Las vistas y recursos estáticos se encuentran en `src/interfaces/http/views/public/`.
* Los servicios de negocio y utilidades están en `src/application/services/` y `src/shared/`.

## Ejemplo de Configuracion

Estos son unos ejemplos de como configurar al minimo las propiedades de el proyecto para el funcionamiento

{% file src="../../.gitbook/assets/config.yml" %}

{% file src="../../.gitbook/assets/.env (2)" %}

ya configurados, deberas de ejecutar el archivo ./src/main.js y se debera mostrar algo similar a lo siguiente:

<figure><img src="../../.gitbook/assets/image (2).png" alt=""><figcaption></figcaption></figure>
