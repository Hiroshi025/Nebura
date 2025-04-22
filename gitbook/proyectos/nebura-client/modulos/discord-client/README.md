# Discord Client

El **Discord Client** de **Nebura Client** es el núcleo principal que conecta la aplicación con la API de Discord. Este cliente extiende la funcionalidad de la clase `Client` de `discord.js` y proporciona herramientas avanzadas para manejar comandos, eventos, botones, menús, modales, y más.

***

### Características Principales

#### 1. **Configuración Personalizada**

* Utiliza configuraciones avanzadas para manejar cachés, intents, y parciales.
* Incluye barridos automáticos (`sweepers`) para optimizar el rendimiento eliminando datos innecesarios, como usuarios o hilos inactivos.

#### 2. **Colecciones**

El cliente utiliza colecciones para organizar y gestionar diferentes componentes del bot:

* **Categorías**: Agrupa elementos por categorías.
* **Comandos**: Almacena todos los comandos disponibles.
* **Botones**: Maneja botones interactivos.
* **Modales**: Gestiona formularios modales.
* **Menús**: Controla menús desplegables.
* **Addons**: Extensiones adicionales del cliente.
* **Precommands**: Comandos predefinidos.
* **Aliases**: Alias para comandos.
* **Cooldowns**: Controla los tiempos de espera entre comandos.
* **Voice Generator**: Herramienta para manejar generadores de voz.
* **Job Member Count**: Información sobre el conteo de miembros en trabajos.

#### 3. **Gestión de Handlers**

El cliente utiliza un sistema de handlers para cargar y desplegar módulos como:

* Botones
* Modales
* Menús
* Componentes interactivos
* Comandos

#### 4. **Intents y Parciales**

El cliente está configurado con los siguientes intents y parciales:

* **Intents**:
  * Guilds
  * GuildMembers
  * GuildMessages
  * MessageContent
  * DirectMessages
  * GuildVoiceStates
  * AutoModerationConfiguration
  * GuildScheduledEvents
* **Parciales**:
  * GuildMember
  * Message
  * User
  * Channel
  * ThreadMember
  * Reaction

#### 5. **Emojis Personalizados**

El cliente permite obtener emojis personalizados desde el servidor o desde un archivo JSON de configuración.

***

### Métodos Principales

#### `constructor()`

* Inicializa el cliente con configuraciones personalizadas.
* Carga las colecciones y los handlers.

#### `start()`

* Inicia el cliente y se conecta a la API de Discord.
* Valida la configuración del token.
* Carga y despliega los handlers.
* Registra el estado del cliente en la consola.

#### `getEmoji(guildId: string, emojiName: string): string`

* Obtiene un emoji por su nombre desde un servidor específico.
* Si no se encuentra en el servidor, utiliza un emoji predefinido en un archivo JSON.

***

### Ejemplo de Uso

#### Iniciar el Cliente

```typescript
import { MyClient } from "./structure/client";

const client = new MyClient();
client.start();
```
