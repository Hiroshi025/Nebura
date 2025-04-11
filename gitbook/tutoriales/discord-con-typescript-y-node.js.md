# Discord con TypeScript y Node.js

### Introducción

En este tutorial aprenderás a personalizar y extender un bot de Discord usando TypeScript y Node.js, enfocándonos en:

* Editar y monitorear la caché
* Loggear eventos REST
* Extender propiedades mediante class extends
* Personalizar eventos

### Prerrequisitos

* Node.js v16+
* TypeScript instalado globalmente (`npm install -g typescript`)
* Conocimientos básicos de Discord.js y TypeScript

### Configuración Inicial

#### 1. Inicializar el proyecto

```bash
mkdir discord-bot-custom
cd discord-bot-custom
npm init -y
tsc --init
npm install discord.js dotenv
npm install --save-dev @types/node
```

#### 2. Estructura básica

```
/src
  /classes
    CustomClient.ts
    CustomGuild.ts
  /events
    cacheUpdate.ts
    restDebug.ts
  index.ts
.env
tsconfig.json
```

### Paso 1: Extender Clases Base

#### CustomClient.ts

```typescript
import { Client, ClientOptions, Collection } from 'discord.js';
import { CustomGuild } from './CustomGuild';

export class CustomClient extends Client {
    public customGuilds: Collection<string, CustomGuild>;
    public cacheLogs: string[];

    constructor(options: ClientOptions) {
        super(options);
        this.customGuilds = new Collection();
        this.cacheLogs = [];
        
        // Inicializar guilds personalizadas
        this.on('ready', () => {
            this.guilds.cache.forEach(guild => {
                this.customGuilds.set(guild.id, new CustomGuild(guild));
            });
        });
    }

    // Método para loggear cambios en caché
    public logCacheChange(description: string): void {
        const logEntry = `[${new Date().toISOString()}] ${description}`;
        this.cacheLogs.push(logEntry);
        console.log(logEntry);
    }
}
```

#### CustomGuild.ts

```typescript
import { Guild } from 'discord.js';

export class CustomGuild extends Guild {
    public customProperty: string;
    public memberJoinCount: number = 0;

    constructor(guild: Guild) {
        super(guild.client, guild.toJSON());
        this.customProperty = `Guild personalizada: ${this.name}`;
    }

    // Método extendido
    public logMemberJoin(): void {
        this.memberJoinCount++;
        (this.client as CustomClient).logCacheChange(
            `Nuevo miembro en ${this.name}. Total: ${this.memberJoinCount}`
        );
    }
}
```

### Paso 2: Personalizar Cache y REST

#### events/cacheUpdate.ts

```typescript
import { Events } from 'discord.js';
import { CustomClient } from '../classes/CustomClient';

export default {
    name: Events.GuildMemberAdd,
    execute(member) {
        const client = member.client as CustomClient;
        const customGuild = client.customGuilds.get(member.guild.id);
        
        if (customGuild) {
            customGuild.logMemberJoin();
        }

        // Ejemplo de manipulación de caché
        client.logCacheChange(`Miembro añadido: ${member.user.tag}`);
    }
};
```

#### events/restDebug.ts

```typescript
import { RESTEvents } from 'discord.js';
import { CustomClient } from '../classes/CustomClient';

export default {
    name: RESTEvents.Debug,
    execute(info: string) {
        const client = this as CustomClient;
        client.logCacheChange(`[REST Debug] ${info}`);
    }
};
```

### Paso 3: Configurar el Client Personalizado

#### index.ts

```typescript
import 'dotenv/config';
import { GatewayIntentBits } from 'discord.js';
import { CustomClient } from './classes/CustomClient';
import cacheUpdate from './events/cacheUpdate';
import restDebug from './events/restDebug';

const client = new CustomClient({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages
    ]
});

// Registrar eventos
client.on('guildMemberAdd', cacheUpdate.execute);
client.rest.on('debug', restDebug.execute.bind(client));

client.on('ready', () => {
    console.log(`Bot listo como ${client.user?.tag}`);
    console.log(`Guilds personalizadas cargadas: ${client.customGuilds.size}`);
});

client.login(process.env.DISCORD_TOKEN);
```

### Paso 4: Acceso a Datos Personalizados

Ejemplo de cómo acceder a las propiedades extendidas:

```typescript
// Obtener una guild personalizada
const guildId = '1234567890';
const customGuild = client.customGuilds.get(guildId);

if (customGuild) {
    console.log(customGuild.customProperty);
    console.log(`Miembros unidos: ${customGuild.memberJoinCount}`);
}

// Ver logs de caché
console.log('Últimos 5 logs:');
client.cacheLogs.slice(-5).forEach(log => console.log(log));
```

### Técnicas Avanzadas

#### 1. Sobrescribir métodos de caché

```typescript
// En CustomClient.ts
public async fetchGuild(id: string, cache = true) {
    const guild = await super.fetchGuild(id, cache);
    this.logCacheChange(`Guild fetched: ${guild.name}`);
    
    if (!this.customGuilds.has(id)) {
        this.customGuilds.set(id, new CustomGuild(guild));
    }
    
    return this.customGuilds.get(id);
}
```

#### 2. Proxy para monitorear caché

```typescript
// En CustomClient.ts
const originalCache = this.guilds.cache;
this.guilds.cache = new Proxy(originalCache, {
    set(target, prop, value) {
        if (prop === 'set' || prop === 'delete') {
            client.logCacheChange(`Cache modified: ${prop} ${value.id}`);
        }
        return Reflect.set(target, prop, value);
    }
});
```

### Conclusión

Has aprendido a:

* Extender las clases base de Discord.js
* Personalizar el comportamiento de caché
* Monitorear eventos REST
* Añadir propiedades y métodos personalizados
* Implementar logging avanzado

Recuerda que estas técnicas pueden adaptarse para cualquier parte de la API de Discord.js, permitiéndote crear bots altamente personalizados y mantenibles.

### Recursos Adicionales

* [Documentación de Discord.js](https://discord.js.org/)
* [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)
* [Patrones de Diseño para Bots](https://github.com/discordjs/guide)
