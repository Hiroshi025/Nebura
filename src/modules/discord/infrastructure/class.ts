import { Client, GatewayIntentBits, Partials } from "discord.js";

import { config } from "@/shared/utils/config";
import { logWithLabel } from "@/shared/utils/functions/console";
import emojis from "@config/json/emojis.json";

import { DiscordHandler } from "./utils/handlers";

export class MainDiscord extends Client {
  private settings: typeof config.modules.discord;
  public handlers: DiscordHandler;
  constructor() {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
      ],
      partials: [
        Partials.GuildScheduledEvent,
        Partials.GuildMember,
        Partials.User,
        Partials.Message,
      ],
    });

    this.handlers = new DiscordHandler(this);
    this.settings = config.modules.discord;
  }

  public async start() {
    logWithLabel("debug", "APP Discord API Starting Proyect...");
    if (!this.settings.token) {
      logWithLabel(
        "info",
        [
          "APP Discord API Error:",
          `  ${emojis.circle_x}  No token provided`,
          `  ${emojis.circle_x}  Please provide a token in the config file`,
        ].join("\n"),
      );
      return;
    }

    await this.login(this.settings.token);
    logWithLabel(
      "debug",
      [
        "APP Discord API Started:",
        `  ${emojis.circle_check}  Logged in as ${this.user?.tag} (${this.user?.id})`,
        `  ${emojis.circle_check}  Latency: ${this.ws.ping}ms`,
      ].join("\n"),
    );

    await this.handlers._load();
    try {
      await Promise.all([this.handlers.deploy()]);
    } catch (err) {
      logWithLabel(
        "error",
        [
          "APP Discord API Error:",
          `  ${emojis.circle_x}  Error loading modules`,
          `  ${emojis.circle_x}  ${err}`,
        ].join("\n"),
      );
    }
  }
}
