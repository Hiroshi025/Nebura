# Modifying Discord.js

### **Introduction**

Discord.js provides a robust API for interacting with Discord, but sometimes you need additional functionality. This guide explains how to **extend and modify Discord.js classes** to add custom methods, override existing behavior, and integrate utilities seamlessly using **TypeScript**.

***

### **Prerequisites**

* Basic knowledge of **Discord.js (v14+)**.
* Familiarity with **TypeScript** (classes, interfaces, generics).
* A working Discord bot project with TypeScript.

***

### **1. Extending Discord.js Classes**

You can extend core Discord.js classes (like `Guild`, `User`, `Message`) to add custom methods.

#### **Example: Adding a Custom Method to `Guild`**

```ts
import { Guild } from "discord.js";

export class CustomGuild extends Guild {
  // Add a custom method to fetch inactive members
  public async fetchInactiveMembers(days: number = 30) {
    const members = await this.members.fetch();
    return members.filter(member => {
      const lastActive = member.lastMessage?.createdAt;
      if (!lastActive) return false;
      return (Date.now() - lastActive.getTime()) > (days * 24 * 60 * 60 * 1000);
    });
  }
}
```

**Usage**

```ts
const guild = client.guilds.cache.get("guild_id") as CustomGuild;
const inactiveMembers = await guild.fetchInactiveMembers(14);
```

***

### **2. Modifying Existing Behavior (Overriding Methods)**

You can override existing methods to change their behavior.

#### **Example: Overriding `send()` in `TextChannel`**

```ts
import { TextChannel } from "discord.js";

export class CustomTextChannel extends TextChannel {
  // Override send() to add logging
  public async send(options: any) {
    console.log(`Message sent in ${this.name}:`, options);
    return super.send(options);
  }
}
```

**Usage**

```ts
const channel = client.channels.cache.get("channel_id") as CustomTextChannel;
await channel.send("Hello, world!"); // Logs before sending
```

***

### **3. Adding Custom Utilities**

You can create standalone utility classes that interact with Discord.js.

#### **Example: A `ModerationTool` Utility**

```ts
import { Guild, GuildMember } from "discord.js";

export class ModerationTool {
  constructor(private guild: Guild) {}

  // Mute a member with a reason
  public async mute(member: GuildMember, reason: string) {
    await member.timeout(24 * 60 * 60 * 1000, reason); // 24h timeout
    return `Muted ${member.user.tag} for: ${reason}`;
  }
}
```

**Usage**

```ts
const guild = client.guilds.cache.get("guild_id")!;
const modTool = new ModerationTool(guild);
const member = await guild.members.fetch("user_id");
await modTool.mute(member, "Spamming");
```

***

### **4. Using Mixins for Reusable Extensions**

Mixins allow composing multiple behaviors into a class.

#### **Example: A `Loggable` Mixin**

```ts
type Constructor<T = {}> = new (...args: any[]) => T;

export function Loggable<TBase extends Constructor>(Base: TBase) {
  return class extends Base {
    public logAction(action: string) {
      console.log(`[LOG] ${action} at ${new Date().toISOString()}`);
    }
  };
}
```

**Applying to a Discord.js Class**

```ts
import { TextChannel } from "discord.js";

const LoggableChannel = Loggable(TextChannel);
const channel = new LoggableChannel(client, { id: "123", type: ChannelType.GuildText });
channel.logAction("Test log"); // [LOG] Test log at 2023-01-01T00:00:00Z
```

***

### **5. Extending Managers (e.g., `GuildManager`)**

You can extend managers to add bulk operations.

#### **Example: Adding `bulkDeleteRoles` to `GuildManager`**

```ts
import { GuildManager, Guild } from "discord.js";

export class CustomGuildManager extends GuildManager {
  public async bulkDeleteRoles(guildId: string, roleIds: string[]) {
    const guild = this.cache.get(guildId);
    if (!guild) throw new Error("Guild not found");

    for (const roleId of roleIds) {
      await guild.roles.delete(roleId).catch(console.error);
    }
  }
}
```

**Usage**

```ts
(client.guilds as CustomGuildManager).bulkDeleteRoles("guild_id", ["role1", "role2"]);
```

***

### **6. Type-Safe Overrides with Declaration Merging**

If you don’t want to subclass, you can use **TypeScript declaration merging** to add types.

#### **Example: Adding `fetchRandomMember` to `Guild`**

```ts
declare module "discord.js" {
  interface Guild {
    fetchRandomMember(): Promise<GuildMember>;
  }
}

Guild.prototype.fetchRandomMember = async function () {
  const members = await this.members.fetch();
  return members.random()!;
};
```

**Usage**

```ts
const guild = client.guilds.cache.get("guild_id")!;
const randomMember = await guild.fetchRandomMember();
```

***

### **Best Practices**

1. **Avoid Overriding Core Methods Unnecessarily**: Only modify behavior when needed.
2. **Use TypeScript Generics for Reusable Utilities**.
3. **Document Custom Methods** (e.g., with JSDoc).
4. **Test Extensions Thoroughly** (Jest/Mocha).

***

### **Conclusion**

Extending Discord.js with TypeScript allows for powerful customizations while maintaining type safety. Whether you're:

* Adding utility methods (`fetchInactiveMembers`),
* Modifying behavior (`send()` logging),
* Or creating mixins (`Loggable`),

TypeScript ensures your changes are **maintainable** and **error-free**.

#### **Further Reading**

* [Discord.js Documentation](https://discord.js.org/)
* [TypeScript Handbook (Classes)](https://www.typescriptlang.org/docs/handbook/classes.html)
* [Advanced TypeScript Patterns](https://www.typescriptlang.org/docs/handbook/mixins.html)
