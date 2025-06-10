# Nebura Works

**Nebura Works** is a modular API platform that integrates multiple services such as Discord, WhatsApp, GitHub, Google AI, and more. This project is designed for extensibility, real-time communication, and robust monitoring, making it suitable for modern multi-service applications.

[![GitHub Repo](https://img.shields.io/github/stars/Hiroshi025/Nebura-AI?style=social)](https://github.com/Hiroshi025/Nebura-AI)
[![Issues](https://img.shields.io/github/issues/Hiroshi025/Nebura-AI)](https://github.com/Hiroshi025/Nebura-AI/issues)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)
[![Homepage](https://img.shields.io/badge/Help%20Center-Online-brightgreen)](https://help.hiroshi-dev.me/)

---

## Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Modules](#modules)
  - [API Server](#api-server)
  - [Discord Module](#discord-module)
  - [WhatsApp Module](#whatsapp-module)
- [Configuration](#configuration)
- [Usage Examples](#usage-examples)
- [Development & Scripts](#development--scripts)
- [Contributing](#contributing)
- [Support & Links](#support--links)
- [About the Creator](#about-the-creator)
- [API Overview](#api-overview)

---

## Project Overview

Nebura Works is a TypeScript-based, modular API platform that enables seamless integration of various services. It leverages Express, Socket.IO, Prisma ORM, and other modern libraries to provide a scalable and maintainable backend for bots, automation, and real-time applications.

**Key Features:**

- Modular architecture for Discord, WhatsApp, and more.
- Real-time communication via WebSockets.
- Robust logging, metrics, and monitoring.
- Automated backups and scheduled tasks.
- Multi-language support with i18next.
- Secure session and rate limiting.
- Extensible command and event system for Discord.

---

## Architecture

The core of Nebura Works is orchestrated by the `Engine` class (`src/main.ts`), which initializes and manages all modules:

- **API Server** (`src/server/index.ts`): Express-based HTTP server with Socket.IO, Swagger docs, security, and metrics.
- **Discord Module** (`src/modules/discord/client.ts`): Advanced Discord bot client with dynamic command loading, event handling, and modularity.
- **WhatsApp Module** (`src/modules/whatsapp/index.ts`): WhatsApp Web.js client with Excel-based logging, status reporting, and scheduled backups.
- **Database**: Managed via Prisma ORM, supporting upserts and advanced queries.
- **Monitoring**: (Optional) Sentry integration for error tracking.

### High-Level Diagram

**Update:** 24/05/2025

```mermaid
graph TD

    14532["User<br>External Actor"]
    subgraph 14519["External Systems"]
        14533["Database Systems<br>SQL/NoSQL"]
        14534["Version Control APIs<br>GitHub, etc."]
        14535["AI APIs<br>Google Gemini, etc."]
        14536["Authentication APIs<br>OAuth Providers, etc."]
        14537["Discord Platform<br>Discord API"]
        14538["WhatsApp Platform<br>WhatsApp Web"]
    end
    subgraph 14520["Cliente Application<br>Node.js/TypeScript"]
        14521["Main Engine<br>TypeScript"]
        14522["API Server<br>Express.js"]
        14523["HTTP Routes<br>Express.js"]
        14524["HTTP Controllers<br>TypeScript"]
        14525["Application Logic<br>TypeScript"]
        14526["Discord Bot Module<br>discord.js"]
        14527["WhatsApp Bot Module<br>whatsapp-web.js"]
        14528["Messaging Middleware<br>TypeScript"]
        14529["Database Adapter<br>Prisma"]
        14530["External Service Adapters<br>TypeScript"]
        14531["Shared Code<br>TypeScript"]
        %% Edges at this level (grouped by source)
        14525["Application Logic<br>TypeScript"] -->|gets DB client via main| 14521["Main Engine<br>TypeScript"]
        14525["Application Logic<br>TypeScript"] -->|uses (utils, DTOs)| 14531["Shared Code<br>TypeScript"]
        14526["Discord Bot Module<br>discord.js"] -->|gets DB client via main| 14521["Main Engine<br>TypeScript"]
        14526["Discord Bot Module<br>discord.js"] -->|uses services for commands| 14525["Application Logic<br>TypeScript"]
        14526["Discord Bot Module<br>discord.js"] -->|uses (e.g., GitHub)| 14530["External Service Adapters<br>TypeScript"]
        14526["Discord Bot Module<br>discord.js"] -->|uses (config, utils, embeds)| 14531["Shared Code<br>TypeScript"]
        14527["WhatsApp Bot Module<br>whatsapp-web.js"] -->|gets DB client via main| 14521["Main Engine<br>TypeScript"]
        14527["WhatsApp Bot Module<br>whatsapp-web.js"] -->|uses services| 14525["Application Logic<br>TypeScript"]
        14527["WhatsApp Bot Module<br>whatsapp-web.js"] -->|uses (config, utils)| 14531["Shared Code<br>TypeScript"]
        14528["Messaging Middleware<br>TypeScript"] -->|gets DB client via main| 14521["Main Engine<br>TypeScript"]
        14528["Messaging Middleware<br>TypeScript"] -->|uses (config, logging)| 14531["Shared Code<br>TypeScript"]
        14521["Main Engine<br>TypeScript"] -->|initializes & starts| 14522["API Server<br>Express.js"]
        14521["Main Engine<br>TypeScript"] -->|uses services| 14525["Application Logic<br>TypeScript"]
        14521["Main Engine<br>TypeScript"] -->|initializes| 14526["Discord Bot Module<br>discord.js"]
        14521["Main Engine<br>TypeScript"] -->|initializes| 14527["WhatsApp Bot Module<br>whatsapp-web.js"]
        14521["Main Engine<br>TypeScript"] -->|uses schema from| 14529["Database Adapter<br>Prisma"]
        14521["Main Engine<br>TypeScript"] -->|uses config, logging| 14531["Shared Code<br>TypeScript"]
        14522["API Server<br>Express.js"] -->|delegates to| 14523["HTTP Routes<br>Express.js"]
        14522["API Server<br>Express.js"] -->|uses (IP Blocker, Rate Limiter)| 14528["Messaging Middleware<br>TypeScript"]
        14522["API Server<br>Express.js"] -->|uses (Passport)| 14530["External Service Adapters<br>TypeScript"]
        14522["API Server<br>Express.js"] -->|uses (config, logging, Swagger)| 14531["Shared Code<br>TypeScript"]
        14523["HTTP Routes<br>Express.js"] -->|maps to| 14524["HTTP Controllers<br>TypeScript"]
        14523["HTTP Routes<br>Express.js"] -->|uses (auth, rate limit)| 14528["Messaging Middleware<br>TypeScript"]
        14523["HTTP Routes<br>Express.js"] -->|uses (Passport)| 14530["External Service Adapters<br>TypeScript"]
        14524["HTTP Controllers<br>TypeScript"] -->|invokes| 14525["Application Logic<br>TypeScript"]
        14524["HTTP Controllers<br>TypeScript"] -->|uses (response utils)| 14531["Shared Code<br>TypeScript"]
        14531["Shared Code<br>TypeScript"] -->|uses (Swagger config)| 14530["External Service Adapters<br>TypeScript"]
    end
    %% Edges at this level (grouped by source)
    14525["Application Logic<br>TypeScript"] -->|accesses data in| 14533["Database Systems<br>SQL/NoSQL"]
    14525["Application Logic<br>TypeScript"] -->|calls| 14535["AI APIs<br>Google Gemini, etc."]
    14526["Discord Bot Module<br>discord.js"] -->|accesses data in| 14533["Database Systems<br>SQL/NoSQL"]
    14526["Discord Bot Module<br>discord.js"] -->|interacts with| 14537["Discord Platform<br>Discord API"]
    14527["WhatsApp Bot Module<br>whatsapp-web.js"] -->|accesses data in| 14533["Database Systems<br>SQL/NoSQL"]
    14527["WhatsApp Bot Module<br>whatsapp-web.js"] -->|interacts with| 14538["WhatsApp Platform<br>WhatsApp Web"]
    14528["Messaging Middleware<br>TypeScript"] -->|accesses data in| 14533["Database Systems<br>SQL/NoSQL"]
    14532["User<br>External Actor"] -->|sends HTTP requests| 14522["API Server<br>Express.js"]
    14532["User<br>External Actor"] -->|interacts via Discord| 14526["Discord Bot Module<br>discord.js"]
    14532["User<br>External Actor"] -->|interacts via WhatsApp| 14527["WhatsApp Bot Module<br>whatsapp-web.js"]
    14530["External Service Adapters<br>TypeScript"] -->|calls| 14534["Version Control APIs<br>GitHub, etc."]
    14530["External Service Adapters<br>TypeScript"] -->|integrates with| 14536["Authentication APIs<br>OAuth Providers, etc."]
```

---

## Modules

### API Server

- **File:** `src/server/index.ts`
- **Stack:** Express, Socket.IO, Swagger, Helmet, Apicache, i18next, session management.
- **Features:**
  - Middleware for security, caching, metrics, and localization.
  - Swagger UI for API documentation.
  - Real-time WebSocket support.
  - Static file serving for documentation and assets.
  - IP blocking and rate limiting.
  - Request/response tracing with unique IDs and response times.

#### Example: Starting the API Server

```typescript
import { API } from "./server";
const api = new API();
api.start();
```

### Discord Module

- **File:** `src/modules/discord/client.ts`
- **Stack:** discord.js, dynamic command/event/component loading.
- **Features:**
  - Advanced caching and sweeping strategies.
  - Dynamic loading and hot-reloading of commands, buttons, modals, and menus.
  - Alias management and recursive file discovery.
  - Emoji management (server and fallback).
  - Error handling and logging.

#### Example: Reloading a Command

```typescript
await client.reloadCommand("ping");
```

#### Example: Loading All Commands

```typescript
await client.loadCommands();
```

### WhatsApp Module

- **File:** `src/modules/whatsapp/index.ts`
- **Stack:** whatsapp-web.js, ExcelJS, qrcode-terminal.
- **Features:**
  - Logs all incoming messages to daily Excel files.
  - `/status` command for runtime statistics (uptime, unread messages, backup info).
  - Scheduled daily Excel backups with chat statistics.
  - QR code authentication and session management.
  - Robust error handling and logging.

#### Example: WhatsApp Status Command

Send `/status` from the bot's own number to receive a detailed status report.

---

## Configuration

Configuration is managed via environment variables and the `config` object.

- **Database:** Set `DATABASE_URL` in your environment.
- **Discord:** Provide `token`, `clientId`, `clientSecret`, and `owners` in the config.
- **WhatsApp:** Enable/disable via `modules.whatsapp.enabled`.
- **Backups:** Set `CRON_BACKUPS_TIME` for scheduled backups.
- **Sentry:** (Optional) Configure Sentry DSN and environment.

See [`package.json`](./package.json) for scripts and dependencies.

---

## Usage Examples

### Starting the Application

```bash
npm install
npm run build
npm start
```

### Development Mode

```bash
npm run start:dev
```

### Linting and Formatting

```bash
npm run lint
npm run lint:fix
npm run type-check
```

### Running Tests

```bash
npm test
```

---

## Development & Scripts

- **Build:** `npm run build`
- **Start:** `npm start`
- **Dev Mode:** `npm run start:dev`
- **Lint:** `npm run lint`
- **Type Check:** `npm run type-check`
- **Docs:** `npm run docs`
- **Release:** `npm run release`
- **Prepare:** `npm run prepare` (husky hooks)

See all scripts in [`package.json`](./package.json).

---

## Contributing

Contributions are welcome! Please open issues or pull requests on [GitHub](https://github.com/Hiroshi025/Nebura-AI).

- [Issue Tracker](https://github.com/Hiroshi025/Nebura-AI/issues)
- [Contributing Guide](https://github.com/Hiroshi025/Nebura-AI/blob/main/CONTRIBUTING.md)

---

## Support & Links

- **Homepage:** [https://help.hiroshi-dev.me/](https://help.hiroshi-dev.me/)
- **GitHub:** [https://github.com/Hiroshi025/Nebura-AI](https://github.com/Hiroshi025/Nebura-AI)
- **Report Bugs:** [GitHub Issues](https://github.com/Hiroshi025/Nebura-AI/issues)
- **Documentation:** [Swagger UI](http://localhost:PORT/docs) (after running the server)
- **Discord.js Docs:** [https://discord.js.org/#/docs](https://discord.js.org/#/docs)
- **WhatsApp Web.js Docs:** [https://wwebjs.dev/guide/](https://wwebjs.dev/guide/)
- **Prisma Docs:** [https://www.prisma.io/docs/](https://www.prisma.io/docs/)
- **Express Docs:** [https://expressjs.com/](https://expressjs.com/)

---

## About the Creator

**Nebura Works** is developed and maintained by [Hiroshi025](https://github.com/Hiroshi025).

> _"My mission is to build robust, scalable, and modular platforms that empower developers to integrate and automate across multiple services with ease. If you have questions, suggestions, or want to contribute, feel free to reach out via GitHub or the help center!"_

- **GitHub:** [Hiroshi025](https://github.com/Hiroshi025)
- **Sponsor:** [GitHub Sponsors](https://github.com/sponsors/tu-usuario)
- **Contact:** [Open an Issue](https://github.com/Hiroshi025/Nebura-AI/issues) or [Help Center](https://help.hiroshi-dev.me/)

---

## API Overview

La API de Nebura expone endpoints RESTful para gestión de tareas, recordatorios, licencias, bloqueo de IPs, integración con Discord, Google Gemini y más.

### Autenticación

La mayoría de los endpoints requieren autenticación mediante un token Bearer JWT. Incluye el token en el header `Authorization`:

```
Authorization: Bearer tu.jwt.token.aqui
```

Algunos endpoints públicos (por ejemplo, `/public/github/users/{username}`) no requieren autenticación.

---

## Endpoints Principales

### Tareas y Recordatorios

- `GET /service/tasks`: Lista todas las tareas, permite filtrar por estado, prioridad, creador o etiqueta.
- `POST /service/tasks`: Crea una nueva tarea.
- `GET /service/tasks/{id}`: Obtiene detalles de una tarea.
- `PATCH /service/tasks/{id}`: Actualiza campos de una tarea.
- `DELETE /service/tasks/{id}`: Elimina una tarea.
- `GET /service/reminders`: Lista los recordatorios próximos a activarse.

### Licencias

- `POST /license`: Crea una nueva licencia (requiere admin).
- `GET /license`: Lista todas las licencias.
- `GET /license/{id}`: Detalles de una licencia.
- `PUT /license/{id}`: Actualiza una licencia.
- `DELETE /license/{id}`: Elimina una licencia.
- `POST /license/validate/{key}`: Valida una licencia contra un HWID.
- `GET /license/info/{licenseKey}`: Información detallada de una licencia, IPs bloqueadas y estadísticas de uso.

### Seguridad y Administración

- `POST /admin/block-ip`: Bloquea una IP.
- `DELETE /admin/unblock-ip/{ipAddress}`: Desbloquea una IP.
- `GET /admin/blocked-ips`: Lista IPs bloqueadas.
- `GET /admin/ip-info/{ipAddress}`: Información de seguridad de una IP.
- `GET /admin/cache-performance`: Métricas de caché (solo desarrollo).
- `GET /admin/prisma-metrics`: Métricas recientes de Prisma (solo admin).

### Integraciones

#### GitHub

- `GET /public/github/users/{username}`: Info básica de usuario.
- `GET /public/github/users/{username}/all`: Info completa (repos, eventos, orgs).
- `GET /public/github/users/{username}/repos`: Repositorios públicos.
- `GET /public/github/repos/{owner}/{repo}`: Info de un repositorio.

#### Discord

- `GET /public/discord/status`: Estado actual de Discord.
- `GET /public/discord/updates`: Últimas novedades de Discord.
- `GET /public/discord/incidents`: Incidentes activos.
- `GET /publicdiscord/recent`: Estado, novedades e incidentes recientes.

#### Google Gemini

- `POST /service/google/model-ai/text`: Procesa texto con Gemini.
- `POST /service/google/model-ai/file`: Procesa archivo con Gemini.
- `POST /service/google/model-ai/combined`: Procesa texto y archivo juntos.

### Autenticación de Usuarios

- `POST /auth/register`: Registro de usuario y generación de JWT.
- `POST /auth/login`: Login y obtención de JWT.
- `GET /auth/{id}`: Datos del usuario autenticado.

---

## Ejemplo de Uso de la API

### Crear una Tarea

```bash
curl -X POST https://host.hiroshi-dev.me/api/v1/service/tasks \
  -H "Authorization: Bearer tu.jwt.token.aqui" \
  -H "Content-Type: application/json" \
  -d '{"title":"Reunión mensual","createdBy":"usuario123"}'
```

### Validar una Licencia

```bash
curl -X POST https://host.hiroshi-dev.me/api/v1/license/validate/CLAVE-LICENCIA \
  -d "hwid=HWID12345"
```

### Obtener Estado del Sistema

```bash
curl https://host.hiroshi-dev.me/api/v1/public/status
```

---

## Esquemas de Respuesta

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

---

## Documentación Interactiva

- Accede a la documentación Swagger UI en:  
  [http://localhost:PORT/docs](http://localhost:PORT/docs) (después de iniciar el servidor)

- Consulta la [documentación oficial](https://docs.hiroshi-dev.me) para guías y ejemplos detallados.

---

## License

_This project is licensed under the ISC License. See the [LICENSE](./LICENSE) file for details._
