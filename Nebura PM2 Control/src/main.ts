import { Client, ClientEvents, GatewayIntentBits, Options, Partials } from "discord.js";
import fs from "fs";

import { Event } from "./lib/builders";
import { config } from "./lib/config";
import { getFiles } from "./lib/utils/functions";

export const filesLoaded: (string | undefined)[] = [];
class MyClient extends Client {
  constructor() {
    super({
      makeCache: Options.cacheWithLimits({
        ...Options.DefaultMakeCacheSettings,
        ReactionManager: 0,
      }),
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildIntegrations,
        GatewayIntentBits.GuildWebhooks,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.AutoModerationConfiguration,
        GatewayIntentBits.DirectMessagePolls,
        GatewayIntentBits.GuildIntegrations,
        GatewayIntentBits.GuildScheduledEvents,
        GatewayIntentBits.DirectMessageTyping,
        GatewayIntentBits.GuildExpressions,
      ],
      partials: [
        Partials.GuildMember,
        Partials.Message,
        Partials.User,
        Partials.Channel,
        Partials.ThreadMember,
        Partials.GuildScheduledEvent,
        Partials.Reaction,
      ],
      sweepers: {
        ...Options.DefaultSweeperSettings,
        users: {
          interval: 3_600, // Every hour.
          filter: () => (user) => user.bot && user.id !== user.client.user.id, // Remove all bots.
        },
        threads: {
          interval: 3_600, // Every hour.
          lifetime: 86_400, // Remove threads older than 24 hours.
        },
      },
    });

    this.start(config.token);
    this.handler();
  }

  async start(token: string) {
    await this.login(token);
    console.log("Logged in as " + this.user?.tag);
  }

  async handler() {
    for (const dir of fs.readdirSync("./src/events")) {
      const files = getFiles("./src/events", ["js", "ts"]);
      for (const file of files) {
        const module: Event<keyof ClientEvents> = require(file).default;
        filesLoaded.push(file.split("\\").pop());
        if (module.once) {
          this.once(module.event, (...args): void => module.run(...args));
        } else {
          this.on(module.event, (...args): void => module.run(...args));
        }
      }
    }
  }
}
