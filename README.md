# Nebura Platform

Nebura Platform es una solución integral diseñada para gestionar y automatizar múltiples servicios en un entorno modular y escalable. Este proyecto combina funcionalidades avanzadas para la administración de servidores Discord, integración con WhatsApp, gestión de APIs y mucho más, todo bajo una arquitectura robusta y personalizable.

## 🚀 Características Principales

### 1. **Módulo de Discord**
- **Gestión de comandos y eventos**: Incluye un sistema avanzado para cargar, recargar y gestionar comandos de manera dinámica.
- **Colecciones personalizadas**: Manejo de botones, menús, modales y más, con soporte para categorías y alias.
- **Integración de emojis**: Obtención de emojis personalizados desde servidores o archivos de configuración.
- **Automatización de tareas**: Soporte para recordatorios, economía de servidores, roles de reacción y más.
- **Logs y métricas**: Registro detallado de eventos y métricas de rendimiento.

### 2. **Módulo de WhatsApp**
- **Cliente WhatsApp-Web**: Integración con WhatsApp utilizando `whatsapp-web.js` para enviar y recibir mensajes.
- **Registro de mensajes en Excel**: Almacena mensajes en archivos Excel organizados por fecha, incluyendo detalles como remitente, contenido y archivos adjuntos.
- **Escaneo de QR**: Proceso de autenticación simplificado mediante códigos QR.
- **Automatización**: Ideal para gestionar interacciones automatizadas con clientes o usuarios.

### 3. **API REST**
- **Servidor Express**: Configuración avanzada con soporte para middleware como `helmet`, `apicache` e integración con `i18next` para internacionalización.
- **Gestión de sesiones**: Uso de SQLite para almacenar sesiones de usuario de manera segura.
- **WebSockets**: Comunicación en tiempo real mediante `socket.io`.
- **Swagger**: Documentación interactiva de la API para facilitar su uso y comprensión.
- **Bloqueo de IPs**: Protección contra accesos no autorizados mediante un sistema de bloqueo dinámico.

### 4. **Base de Datos con Prisma**
- **Modelos avanzados**: Estructura de datos optimizada para usuarios, licencias, tareas, economía, métricas y más.
- **Soporte para MongoDB**: Uso de MongoDB como base de datos principal, con índices y relaciones bien definidas.
- **Métricas y análisis**: Registro de métricas como latencia, solicitudes y errores para cada endpoint.

### 5. **Módulo de Recordatorios**
- **Gestión de recordatorios**: Sistema para programar y enviar recordatorios personalizados en Discord.
- **Automatización**: Ideal para comunidades que necesitan mantener a sus miembros informados.

## 💡 Ventajas

- **Modularidad**: Cada funcionalidad está separada en módulos, lo que permite una fácil personalización y escalabilidad.
- **Automatización**: Reduce la carga manual mediante procesos automatizados en Discord y WhatsApp.
- **Escalabilidad**: Diseñado para crecer con tu proyecto, soportando múltiples usuarios y servicios.
- **Seguridad**: Implementa medidas como bloqueo de IPs, gestión de sesiones y protección de datos sensibles.
- **Documentación**: Incluye documentación interactiva mediante Swagger para facilitar la integración con otros sistemas.

## 🛠️ Usos Recomendados

- **Gestión de comunidades**: Ideal para administradores de servidores Discord que buscan automatizar tareas y mejorar la experiencia de los usuarios.
- **Atención al cliente**: Perfecto para empresas que desean integrar WhatsApp como canal de comunicación con clientes.
- **Desarrollo de APIs**: Proporciona una base sólida para construir y gestionar APIs seguras y escalables.
- **Automatización de tareas**: Útil para programar recordatorios, gestionar economías virtuales y más.

## 📚 Documentación

- **Swagger**: Accede a la documentación interactiva de la API en `/swagger`.
- **Guías de uso**: Consulta las guías detalladas para cada módulo en la carpeta `docs`.

## 🏗️ Tecnologías Utilizadas

- **Node.js**: Plataforma principal para el desarrollo del proyecto.
- **TypeScript**: Lenguaje utilizado para garantizar un código robusto y mantenible.
- **Prisma**: ORM para la gestión de la base de datos MongoDB.
- **Discord.js**: Biblioteca para la integración con Discord.
- **whatsapp-web.js**: Biblioteca para la integración con WhatsApp.
- **Express**: Framework para la creación de la API REST.
- **Socket.IO**: Comunicación en tiempo real mediante WebSockets.

## 📦 Instalación

1. Clona el repositorio:
   ```bash
   git clone https://github.com/tu-usuario/nebura-platform.git
   cd nebura-platform
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Configura las variables de entorno:
   - Crea un archivo `.env` basado en el archivo `.env.example`.
   - Configura las claves necesarias como `DATABASE_URL`, `DISCORD_TOKEN`, etc.

4. Inicia el proyecto:
   ```bash
   npm start
   ```

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas! Si deseas colaborar, por favor abre un issue o envía un pull request.

## 📄 Licencia

Este proyecto está licenciado bajo la [MIT License](LICENSE).

---

¡Gracias por visitar Nebura Platform! Si tienes alguna pregunta o sugerencia, no dudes en contactarnos.
