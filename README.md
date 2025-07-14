# Nebura Works

**Nebura Works** is a modular API platform that integrates multiple services such as Discord, WhatsApp, GitHub, Google Gemini AI, and more. This project is designed for extensibility, real-time communication, and robust monitoring, making it suitable for modern multi-service applications.

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
  - [Telegram Module](#telegram-module)
- [Configuration](#configuration)
- [Usage Examples](#usage-examples)
- [Development & Scripts](#development--scripts)
- [Contributing](#contributing)
- [Support & Links](#support--links)
- [About the Creator](#about-the-creator)
- [API Overview](#api-overview)
- [Folder Structure](#folder-structure)

---

## Project Overview

Nebura Works is a TypeScript-based, modular API platform that enables seamless integration of various services. It leverages Express, Socket.IO, Prisma ORM, and other modern libraries to provide a scalable and maintainable backend for bots, automation, and real-time applications.

**Key Features:**

- Modular architecture for Discord, WhatsApp, Telegram, and more.
- Real-time communication via WebSockets.
- Robust logging, metrics, and monitoring.
- Automated backups and scheduled tasks.
- Multi-language support with i18next.
- Secure session and rate limiting.
- Extensible command and event system for Discord.
- OpenAPI/Swagger documentation.

---

## Architecture

The core of Nebura Works is orchestrated by the `Engine` class (`src/main.ts`), which initializes and manages all modules:

- **API Server** (`src/index.ts`): Express-based HTTP server with Socket.IO, Swagger docs, security, and metrics.
- **Discord Module** (`src/interfaces/messaging/modules/discord/client.ts`): Advanced Discord bot client with dynamic command loading, event handling, and modularity.
- **WhatsApp Module** (`src/interfaces/messaging/modules/whatsapp/client.ts`): WhatsApp Web.js client with Excel-based logging, status reporting, and scheduled backups.
- **Telegram Module** (`src/interfaces/messaging/modules/telegram/client.ts`): Telegram bot client using Telegraf.
- **Database**: Managed via Prisma ORM, supporting upserts and advanced queries.
- **Monitoring**: (Optional) Sentry integration for error tracking.

---

## Modules

### API Server

- **File:** `src/index.ts`
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

- **File:** `src/interfaces/messaging/modules/discord/client.ts`
- **Stack:** discord.js, dynamic command/event/component loading.
- **Features:**
  - Advanced caching and sweeping strategies.
  - Dynamic loading and hot-reloading of commands, buttons, modals, and menus.
  - Alias management and recursive file discovery.
  - Emoji management (server and fallback).
  - Error handling and logging.

### WhatsApp Module

- **File:** `src/interfaces/messaging/modules/whatsapp/client.ts`
- **Stack:** whatsapp-web.js, ExcelJS, qrcode-terminal.
- **Features:**
  - Logs all incoming messages to daily Excel files.
  - `/status` command for runtime statistics (uptime, unread messages, backup info).
  - Scheduled daily Excel backups with chat statistics.
  - QR code authentication and session management.
  - Robust error handling and logging.

### Telegram Module

- **File:** `src/interfaces/messaging/modules/telegram/client.ts`
- **Stack:** Telegraf.
- **Features:**
  - Telegram bot client with environment-based activation.
  - Error handling and logging.
  - Easy integration with the rest of the platform.

---

## Configuration

Configuration is managed via environment variables (`.env`) and the `config` object (`config/config.yml`).

- **Database:** Set `DATABASE_URL` in your environment.
- **Discord:** Provide `TOKEN_DISCORD`, `clientId`, `clientSecret`, and `owners` in the config.
- **WhatsApp:** Enable/disable via `modules.whatsapp.enabled` in config.
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

Nebura exposes RESTful endpoints for task management, reminders, licenses, IP blocking, Discord integration, Google Gemini, and more.

### Authentication

Most endpoints require authentication via a Bearer JWT token. Include the token in the `Authorization` header:

```
Authorization: Bearer your.jwt.token.here
```

Some public endpoints (e.g., `/public/github/users/{username}`) do not require authentication.

---

## Main Endpoints

### Tasks and Reminders

- `GET /service/tasks`: List all tasks, filter by status, priority, creator, or tag.
- `POST /service/tasks`: Create a new task.
- `GET /service/tasks/{id}`: Get task details.
- `PATCH /service/tasks/{id}`: Update task fields.
- `DELETE /service/tasks/{id}`: Delete a task.
- `GET /service/reminders`: List upcoming reminders.

### Licenses

- `POST /license`: Create a new license (admin required).
- `GET /license`: List all licenses.
- `GET /license/{id}`: License details.
- `PUT /license/{id}`: Update a license.
- `DELETE /license/{id}`: Delete a license.
- `POST /license/validate/{key}`: Validate a license against a HWID.
- `GET /license/info/{licenseKey}`: Detailed license info, blocked IPs, and usage stats.

### Security and Administration

- `POST /admin/block-ip`: Block an IP address.
- `DELETE /admin/unblock-ip/{ipAddress}`: Unblock an IP address.
- `GET /admin/blocked-ips`: List blocked IPs.
- `GET /admin/ip-info/{ipAddress}`: Security info for an IP.
- `GET /admin/cache-performance`: Cache metrics (development only).
- `GET /admin/prisma-metrics`: Recent Prisma metrics (admin only).

### Integrations

#### GitHub

- `GET /public/github/users/{username}`: Basic user info.
- `GET /public/github/users/{username}/all`: Complete info (repos, events, orgs).
- `GET /public/github/users/{username}/repos`: Public repositories.
- `GET /public/github/repos/{owner}/{repo}`: Repository info.

#### Discord

- `GET /public/discord/status`: Current Discord status.
- `GET /public/discord/updates`: Latest Discord updates.
- `GET /public/discord/incidents`: Active incidents.
- `GET /publicdiscord/recent`: Recent status, updates, and incidents.

#### Google Gemini

- `POST /service/google/model-ai/text`: Process text with Gemini.
- `POST /service/google/model-ai/file`: Process file with Gemini.
- `POST /service/google/model-ai/combined`: Process text and file together.

### User Authentication

- `POST /auth/register`: Register user and generate JWT.
- `POST /auth/login`: Login and obtain JWT.
- `GET /auth/{id}`: Get authenticated user data.

---

## Example API Usage

### Create a Task

```bash
curl -X POST https://host.hiroshi-dev.me/api/v1/service/tasks \
  -H "Authorization: Bearer your.jwt.token.here" \
  -H "Content-Type: application/json" \
  -d '{"title":"Monthly meeting","createdBy":"user123"}'
```

### Validate a License

```bash
curl -X POST https://host.hiroshi-dev.me/api/v1/license/validate/LICENSE-KEY \
  -d "hwid=HWID12345"
```

### Get System Status

```bash
curl https://host.hiroshi-dev.me/api/v1/public/status
```

---

## Response Schemas

Responses follow the schemas defined in the Swagger documentation. For example, a task (`TaskResponse`) includes:

```json
{
  "id": "507f1f77bcf86cd799439011",
  "title": "Monthly meeting",
  "description": "Discuss budget",
  "createdBy": "user123",
  "createdAt": "2024-01-20T10:00:00Z",
  "status": "pending",
  "priority": "high",
  "tags": ["work", "finance"],
  "reminder": { "enabled": true, "timeBefore": "30 minutes", "notified": false },
  "recurrence": { "type": "monthly", "interval": 1 },
  "autoDelete": "2024-12-31T23:59:59Z"
}
```

---

## Interactive Documentation

- Access Swagger UI documentation at:  
  [http://localhost:PORT/docs](http://localhost:PORT/docs) (after starting the server)

- See the [official documentation](https://docs.hiroshi-dev.me) for detailed guides and examples.

---

## License

_This project is licensed under the ISC License. See the [LICENSE](./LICENSE) file for details._

---

## Folder Structure

The following structure shows the main organization of the project. Each folder has a clear responsibility for maintainability and scalability.

```
Nebura Cliente API v0.0.16/
├── src/
│   ├── adapters/           # Database adapters, external services, validators
│   │   ├── database/       # Prisma ORM and session files
│   │   ├── external/       # External integrations (GitHub, Passport, Swagger)
│   ├── domain/             # Business logic, entities, DTOs, use-cases, repositories
│   ├── interfaces/         # HTTP interfaces: controllers, middlewares, routes, views
│   │   ├── http/
│   │   │   ├── controllers/    # Controllers by domain
│   │   │   ├── middlewares/    # Auth, token, web middlewares
│   │   │   ├── routes/         # API/web route definitions
│   │   │   └── views/          # EJS views, CSS, images, public scripts
│   │   └── messaging/      # Messaging modules for Discord, WhatsApp, Telegram, etc.
│   ├── locales/            # i18n localization files per language
│   ├── shared/             # Shared code: utility classes, functions, constants
│   ├── typings/            # Custom TypeScript definitions
│   ├── index.ts            # Main entry point
│   ├── main.ts             # Engine bootstrap
├── config/                 # YAML and JSON configuration files
├── assets/                 # Images, badges, and example screenshots
├── docs/                   # Generated documentation (HTML, assets)
├── .env                    # Environment variables
├── package.json            # Scripts and dependencies
├── README.md               # This documentation
```

**Main folder descriptions:**

- **adapters/**: Database adapters (Prisma), external integrations (GitHub, Passport, Swagger), and data validators.
- **domain/**: Business logic, entities, DTOs, use-cases, and repositories.
- **interfaces/**: HTTP interfaces (controllers, middlewares, routes, views) and messaging modules (Discord, WhatsApp, Telegram).
- **locales/**: Internationalization and localization files for multi-language support.
- **shared/**: Shared code and utilities across modules.
- **typings/**: Custom TypeScript type definitions.
- **index.ts / main.ts**: Entry and bootstrap files for the main engine.

**Notes:**

- Bot modules (Discord, WhatsApp, Telegram) are under `src/interfaces/messaging/modules/`.
- Views and static resources are in `src/interfaces/http/views/public/`.
- Business services and utilities are in `src/domain/use-cases/` and `src/shared/`.
- Los servicios de negocio y utilidades están en `src/application/services/` y `src/shared/`.
