import { Client, Collection, GatewayIntentBits, Partials } from "discord.js";

import { config } from "@/shared/utils/config";
import { logWithLabel } from "@/shared/utils/functions/console";
import emojis from "@config/json/emojis.json";

import { Command } from "./utils/builders";
import { DiscordHandler } from "./utils/handlers";

/**
 * Represents the main Discord client for the application.
 * Extends the `Client` class from `discord.js` to provide additional functionality.
 */
export class MainDiscord extends Client {
  /**
   * Configuration settings for the Discord module.
   * Loaded from the application's configuration file.
   */
  private settings: typeof config.modules.discord;

  /**
   * Instance of the `DiscordHandler` class, responsible for managing Discord-related operations.
   */
  public handlers: DiscordHandler;

  /**
   * A collection that holds categories, where the key is a string identifier
   * (e.g., category name) and the value is an array of strings representing
   * the items in that category.
   *
   * @type {Collection<string, string[]>}
   */
  public categories: Collection<string, string[]> = new Collection();

  /**
   * A collection of commands, where the key is the command name and the value
   * is the command object (typically an instance of a Command class).
   *
   * @type {Collection<string, Command>}
   */
  public commands: Collection<string, Command> = new Collection();

  /**
   * Initializes a new instance of the `MainDiscord` class.
   * Sets up the client with specific intents and partials, and initializes the handlers and settings.
   */
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
    this.categories = new Collection();
    this.commands = new Collection();
  }

  /**
   * Starts the Discord client and initializes the application.
   *
   * - Logs the startup process.
   * - Validates the presence of a token in the configuration.
   * - Logs into Discord using the provided token.
   * - Loads and deploys the handlers.
   *
   * @returns {Promise<void>} Resolves when the client has successfully started or exits early if an error occurs.
   */
  public async start(): Promise<void> {
    logWithLabel("debug", "APP Discord API Starting Proyect...");

    // Check if the token is provided in the configuration
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

    // Log in to Discord
    await this.login(this.settings.token);
    logWithLabel(
      "debug",
      [
        "APP Discord API Started:",
        `  ${emojis.circle_check}  Logged in as ${this.user?.tag} (${this.user?.id})`,
        `  ${emojis.circle_check}  Latency: ${this.ws.ping}ms`,
      ].join("\n"),
    );

    // Load and deploy handlers
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
