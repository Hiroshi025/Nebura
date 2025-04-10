---
description: >-
  Nebura API, un poderoso sistema de control de licencias, usuarios, log en
  tiempo real, utilidades y mucho mas
---

# Nebura API

![License](https://img.shields.io/badge/License-MIT-blue.svg) ![Version](https://img.shields.io/badge/Version-0.2.0--beta-orange)

### Overview

NEBURA AI es un sistema API integral que proporciona capacidades avanzadas de procesamiento de IA, gestión de IP, gestión de licencias, autenticación y monitoreo del sistema, ahora con protocolos de seguridad mejorados.

### Features

#### ✨ Core Functionalities

* **AI Processing** con modelos Google Gemini y soporte para modelos personalizados.
* **IP Address Management** (bloquear/desbloquear/listar).
* **License Management System** (crear/validar/actualizar).
* **JWT Authentication** (registro/inicio de sesión/datos de usuario).
* **System Monitoring** endpoints.
* **Protocolos de Seguridad Mejorados**:
* Encriptación de datos sensibles.
* Validación de IP en tiempo real.
* Protección contra ataques de fuerza bruta.P

#### 🔧 Technical Specifications

* Diseño RESTful API.
* Autenticación JWT.
* Respuestas paginadas.
* Manejo detallado de errores.
* Documentación Swagger completa.
* **Cifrado AES-256** para datos sensibles.
* **Rate Limiting** para prevenir abuso de endpoints.

### API

[![Swagger](https://img.shields.io/badge/Swagger-Documentation-green)](https://docs.hiroshi-dev.me)

Documentación interactiva completa disponible en:\
https://docs.hiroshi-dev.me

#### Key Endpoints

| Categoría      | Endpoints                                                                                                   |
| -------------- | ----------------------------------------------------------------------------------------------------------- |
| AI Processing  | `/google/model-ai/text`, `/google/model-ai/file`, `/google/model-ai/combined`, `/custom/model-ai/{modelId}` |
| IP Management  | `/block-ip`, `/unblock-ip/{ipAddress}`, `/blocked-ips`, `/validate-ip/{ipAddress}`                          |
| Licenses       | `/licenses`, `/licenses/{id}`, `/licenses/validate/{key}`                                                   |
| Authentication | `/auth/register`, `/auth/login`, `/auth/{id}`, `/auth/reset-password`                                       |
| System Status  | `/public/status`, `/public/uptime`                                                                          |

### Installation

#### Prerequisites

* Node.js v20.18.0+
* TypeScript
* MongoDB (o cualquier base de datos compatible)

#### Setup

1.  Clona el repositorio

    ```bash
    git clone https://github.com/your-repo/nebura-ai.git
    cd nebura-ai
    ```
2.  Instala las dependencias

    ```bash
    npm install
    ```
3. Configura las variables de entorno:
   * `JWT_SECRET`: Clave secreta para autenticación JWT.
   * `DB_URI`: URI de la base de datos.
   * `RATE_LIMIT`: Límite de solicitudes por minuto.
