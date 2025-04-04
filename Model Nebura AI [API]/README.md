# NEBURA AI - API Documentation

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Version](https://img.shields.io/badge/Version-0.2.0--beta-orange)

## Overview

NEBURA AI es un sistema API integral que proporciona capacidades avanzadas de procesamiento de IA, gestión de IP, gestión de licencias, autenticación y monitoreo del sistema, ahora con protocolos de seguridad mejorados.

## Features

### ✨ Core Functionalities

- **AI Processing** con modelos Google Gemini y soporte para modelos personalizados.
- **IP Address Management** (bloquear/desbloquear/listar).
- **License Management System** (crear/validar/actualizar).
- **JWT Authentication** (registro/inicio de sesión/datos de usuario).
- **System Monitoring** endpoints.
- **Protocolos de Seguridad Mejorados**:
- Encriptación de datos sensibles.
- Validación de IP en tiempo real.
- Protección contra ataques de fuerza bruta.P

### 🔧 Technical Specifications

- Diseño RESTful API.
- Autenticación JWT.
- Respuestas paginadas.
- Manejo detallado de errores.
- Documentación Swagger completa.
- **Cifrado AES-256** para datos sensibles.
- **Rate Limiting** para prevenir abuso de endpoints.

## API Documentation

[![Swagger](https://img.shields.io/badge/Swagger-Documentation-green)](https://docs.hiroshi-dev.me)

Documentación interactiva completa disponible en:  
https://docs.hiroshi-dev.me

### Key Endpoints

| Categoría      | Endpoints                                                                                                   |
| -------------- | ----------------------------------------------------------------------------------------------------------- |
| AI Processing  | `/google/model-ai/text`, `/google/model-ai/file`, `/google/model-ai/combined`, `/custom/model-ai/{modelId}` |
| IP Management  | `/block-ip`, `/unblock-ip/{ipAddress}`, `/blocked-ips`, `/validate-ip/{ipAddress}`                          |
| Licenses       | `/licenses`, `/licenses/{id}`, `/licenses/validate/{key}`                                                   |
| Authentication | `/auth/register`, `/auth/login`, `/auth/{id}`, `/auth/reset-password`                                       |
| System Status  | `/public/status`, `/public/uptime`                                                                          |

## Installation

### Prerequisites

- Node.js v20.18.0+
- TypeScript
- MongoDB (o cualquier base de datos compatible)

### Setup

1. Clona el repositorio

   ```bash
   git clone https://github.com/your-repo/nebura-ai.git
   cd nebura-ai
   ```

2. Instala las dependencias

   ```bash
   npm install
   ```

3. Configura las variables de entorno:
   - `JWT_SECRET`: Clave secreta para autenticación JWT.
   - `DB_URI`: URI de la base de datos.
   - `RATE_LIMIT`: Límite de solicitudes por minuto.

## Running with Docker

Puedes ejecutar el proyecto utilizando Docker para simplificar la configuración del entorno. Sigue estos pasos:

1. **Asegúrate de tener Docker instalado**  
   Descarga e instala Docker desde [https://www.docker.com/](https://www.docker.com/).

2. **Construye la imagen de Docker**  
   Ejecuta el siguiente comando en la raíz del proyecto:

   ```bash
   docker build -t nebura-ai .
   ```

3. **Configura las variables de entorno**  
   Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

   ```env
   JWT_SECRET=tu_clave_secreta
   DB_URI=mongodb://tu_base_de_datos
   RATE_LIMIT=100
   ```

4. **Ejecuta el contenedor**  
   Usa el siguiente comando para iniciar el contenedor:

   ```bash
   docker run -d -p 3000:3000 --env-file .env --name nebura-ai nebura-ai
   ```

5. **Accede a la aplicación**  
   La API estará disponible en [http://localhost:3000](http://localhost:3000).

6. **Detener el contenedor**  
   Para detener el contenedor, ejecuta:

   ```bash
   docker stop nebura-ai
   ```

7. **Eliminar el contenedor**  
   Si deseas eliminar el contenedor, usa:
   ```bash
   docker rm nebura-ai
   ```

## GitHub Actions

Para automatizar pruebas, construcción y despliegue, puedes usar GitHub Actions. A continuación, se describe cómo configurarlo:

1. **Crea un archivo de flujo de trabajo**  
   En el directorio `.github/workflows/`, crea un archivo llamado `ci.yml` con el siguiente contenido:

   ```yaml
   name: CI/CD Pipeline

   on:
     push:
       branches:
         - main
     pull_request:
       branches:
         - main

   jobs:
     build:
       runs-on: ubuntu-latest

       steps:
         - name: Checkout code
           uses: actions/checkout@v3

         - name: Set up Node.js
           uses: actions/setup-node@v3
           with:
             node-version: 20

         - name: Install dependencies
           run: npm install

         - name: Run lint
           run: npm run lint

         - name: Run tests
           run: npm test

         - name: Build project
           run: npm run build

     docker:
       runs-on: ubuntu-latest
       needs: build

       steps:
         - name: Checkout code
           uses: actions/checkout@v3

         - name: Log in to DockerHub
           uses: docker/login-action@v2
           with:
             username: ${{ secrets.DOCKER_USERNAME }}
             password: ${{ secrets.DOCKER_PASSWORD }}

         - name: Build and push Docker image
           uses: docker/build-push-action@v4
           with:
             context: .
             push: true
             tags: ${{ secrets.DOCKER_USERNAME }}/nebura-ai:latest
   ```

2. **Configura los secretos en GitHub**  
   Ve a la configuración del repositorio en GitHub y agrega los siguientes secretos:

   - `DOCKER_USERNAME`: Tu nombre de usuario de DockerHub.
   - `DOCKER_PASSWORD`: Tu contraseña de DockerHub.

3. **Automatización**  
   Cada vez que hagas un push a la rama `main` o abras un pull request, se ejecutará la pipeline para verificar el código, construirlo y publicar la imagen de Docker.

## Contributing

¡Damos la bienvenida a contribuciones para NEBURA AI! Para contribuir, sigue estos pasos:

1. Haz un fork del repositorio.
2. Crea una nueva rama para tu funcionalidad o corrección de errores:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Realiza commits con mensajes claros y concisos:
   ```bash
   git commit -m "Add detailed description of your changes"
   ```
4. Sube tu rama a tu repositorio fork:
   ```bash
   git push origin feature/your-feature-name
   ```
5. Abre un pull request al repositorio principal.

Por favor, asegúrate de que tu código cumpla con los estándares del proyecto e incluya pruebas adecuadas.

## License

Este proyecto está licenciado bajo la Licencia MIT. Consulta el archivo [LICENSE](LICENSE) para más detalles.

## Version Control

Este proyecto sigue [Semantic Versioning](https://semver.org/). La versión actual es **0.2.0-beta**.  
Para un registro detallado de cambios, consulta el archivo [CHANGELOG.md](CHANGELOG.md).

## Language and Frameworks

NEBURA AI está construido utilizando las siguientes tecnologías:

- **Lenguaje de Programación**: TypeScript
- **Framework**: Node.js con Express.js
- **Base de Datos**: MongoDB (o cualquier base de datos compatible)
- **Documentación**: Swagger (Especificación OpenAPI)
