# Customizing Cache for a Discord

### **Introduction**

Caching is an essential part of optimizing a Discord bot's performance. By default, Discord.js caches data like users, channels, and guilds to reduce API calls. However, excessive caching can lead to high memory usage. This tutorial will guide you through customizing the cache in a Discord.js bot using TypeScript.

***

### **Prerequisites**

* Basic knowledge of **JavaScript/TypeScript**.
* A Discord bot set up with **Discord.js v14+**.
* Node.js installed (v16.9.0 or higher).
* TypeScript configured (`tsconfig.json`).

***

### **Step 1: Understanding Discord.js Cache**

Discord.js caches data to avoid repeated API requests. The cache is stored in:

* `GuildManager` (for guilds)
* `ChannelManager` (for channels)
* `UserManager` (for users)
* `RoleManager` (for roles)
* And more...

You can control what gets cached using the `ClientOptions` when initializing your bot.

***

### **Step 2: Setting Up a Basic Bot with Custom Cache**

#### **1. Install Required Packages**

```bash
npm install discord.js dotenv
npm install -D typescript @types/node
```

#### **2. Initialize TypeScript (`tsconfig.json`)**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist"
  },
  "include": ["src/**/*"]
}
```

#### **3. Create a `.env` File**

```env
DISCORD_TOKEN=your_bot_token_here
```

#### **4. Basic Bot Structure (`src/index.ts`)**

```ts
import { Client, GatewayIntentBits, Partials } from "discord.js";
import dotenv from "dotenv";

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
  ],
  partials: [Partials.Message, Partials.Channel],
});

client.on("ready", () => {
  console.log(`Logged in as ${client.user?.tag}!`);
});

client.login(process.env.DISCORD_TOKEN);
```

***

### **Step 3: Customizing Cache Options**

To optimize memory, you can limit what Discord.js caches.

#### **1. Disabling Cache for Specific Managers**

Modify the `Client` options to disable unnecessary caching:

```ts
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
  ],
  partials: [Partials.Message, Partials.Channel],
  makeCache: (manager) => {
    // Disable caching for Direct Messages (DMs)
    if (manager.name === "MessageManager") {
      return new manager.holds.CachingManager({
        maxSize: 0, // No caching
      });
    }
    // Cache only 50 roles per guild
    if (manager.name === "RoleManager") {
      return new manager.holds.CachingManager({
        maxSize: 50,
      });
    }
    // Default caching for everything else
    return new manager.holds.CachingManager(manager.defaultCacheSettings);
  },
});
```

#### **2. Clearing Cache Manually**

You can clear cache for specific managers:

```ts
// Clear all cached messages
client.channels.cache.clear();

// Clear cached roles in a guild
const guild = client.guilds.cache.get("guild_id_here");
guild?.roles.cache.clear();
```

***

### **Step 4: Using Sweepers to Automatically Clear Cache**

Discord.js provides **sweepers** to auto-clean stale cache.

#### **1. Enable Sweepers in Client Options**

```ts
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
  ],
  sweepers: {
    // Auto-remove inactive messages every 30 mins
    messages: {
      interval: 1800, // 30 minutes in seconds
      lifetime: 1800, // Remove messages older than 30 mins
    },
    // Auto-remove offline users every hour
    users: {
      interval: 3600,
      filter: () => (user) => user.presence?.status === "offline",
    },
  },
});
```

#### **2. Available Sweeper Options**

| Sweeper Type | Description             |
| ------------ | ----------------------- |
| `messages`   | Cleans cached messages  |
| `users`      | Cleans cached users     |
| `threads`    | Cleans inactive threads |
| `invites`    | Cleans unused invites   |

***

### **Step 5: Best Practices for Cache Optimization**

1. **Limit Guild Cache**: Only cache necessary guilds.
2. **Disable DM Caching**: Unless your bot needs DM history.
3. **Use Sweepers**: Auto-clean stale data.
4. **Monitor Memory Usage**: Use `process.memoryUsage()` to check RAM.

***

### **Conclusion**

Customizing cache in Discord.js helps balance performance and memory usage. By disabling unnecessary caching and using sweepers, you can optimize your bot efficiently.

#### **Further Reading**

* [Discord.js Caching Guide](https://discordjs.guide/miscellaneous/caching.html)
* [Discord.js Sweepers Documentation](https://discord.js.org/docs/packages/sweepers/stable)

***

**🚀 Happy Coding!** Optimize your bot and reduce memory overhead with smart caching!
