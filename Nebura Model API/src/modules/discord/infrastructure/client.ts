import { Client, Collection, GatewayIntentBits, Options, Partials } from "discord.js";

import { Utils } from "@/infrastructure/extenders/discord/properties.extender";
import { config } from "@/shared/utils/config";
import { logWithLabel } from "@/shared/utils/functions/console";
import { Buttons, Menus, Modals } from "@/typings/discord";
import emojis from "@config/json/emojis.json";

import { Command } from "./utils/builders";
import { DiscordHandler } from "./utils/handlers";

/**
 * Represents the main Discord client for the application.
 * Extends the `Client` class from `discord.js` to provide additional functionality.
 */
export class MyClient extends Client {
  /**
   * Configuration for the Discord module.
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
   * A collection of buttons, where the key is a string identifier for the button
   * (e.g., button name) and the value is the button object.
   *
   * @type {Collection<string, Buttons>}
   */
  public buttons: Collection<string, Buttons> = new Collection();

  /**
   * A collection of modals, where the key is a string identifier for the modal
   * and the value is the modal object.
   *
   * @type {Collection<string, Modals>}
   */
  public modals: Collection<string, Modals> = new Collection();

  /**
   * A collection of menus, where the key is a string identifier for the menu
   * and the value is the menu object.
   *
   * @type {Collection<string, Menus>}
   */
  public menus: Collection<string, Menus> = new Collection();

  /**
   * A collection of addons, where the key is a string identifier for the addon
   * and the value is the addon object.
   *
   * @type {Collection<unknown, unknown>}
   */
  public addons: Collection<unknown, unknown>;

  /**
   * Collection of preloaded commands.
   *
   * @type {Collection<string, unknown>}
   * @public
   */
  public precommands: Collection<string, unknown>;

  /**
   * Collection of command aliases.
   *
   * @type {Collection<string, string>}
   * @public
   */
  public aliases: Collection<string, string>;

  /**
   * Instance of the `Utils` class, providing utility functions for the Discord client.
   *
   * @type {Utils}
   */
  public utils: Utils;

  /**
   * Initializes a new instance of the `MyClient` class.
   * Configures the client with specific intents and partials, and initializes handlers and settings.
   */
  constructor() {
    super({
      makeCache: Options.cacheWithLimits({
        ...Options.DefaultMakeCacheSettings,
        ReactionManager: 0,
        GuildScheduledEventManager: 0,
        GuildBanManager: 0,
        GuildEmojiManager: 0,
      }),
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent,
      ],
      partials: [
        Partials.GuildScheduledEvent,
        Partials.GuildMember,
        Partials.User,
        Partials.Message,
        Partials.Channel,
      ],
      sweepers: {
        ...Options.DefaultSweeperSettings,
        messages: {
          interval: 3_600, // Every hour.
          lifetime: 1_800, // Remove messages older than 30 minutes.
        },
        users: {
          interval: 3_600, // Every hour.
          filter: () => (user) => user.bot && user.id !== user.client.user.id, // Remove all bots.
        },
        threads: {
          interval: 3_600, // Every hour.
          lifetime: 86_400, // Remove threads older than 24 hours.
        },
      },
      allowedMentions: {
        parse: ["users", "roles"],
        repliedUser: false,
      },
    });

    this.handlers = new DiscordHandler(this);
    this.settings = config.modules.discord;
    this.utils = new Utils();

    this.categories = new Collection();
    this.commands = new Collection();
    this.buttons = new Collection();
    
    this.precommands = new Collection();
    this.aliases = new Collection();

    this.modals = new Collection();
    this.addons = new Collection();
    this.menus = new Collection();
  }

  /**
   * Starts the Discord client and the application.
   *
   * - Logs the startup process.
   * - Validates the presence of a token in the configuration.
   * - Logs into Discord using the provided token.
   * - Loads and deploys the handlers.
   *
   * @returns {Promise<void>} Resolves when the client has successfully started or exits early if an error occurs.
   */
  public async start(): Promise<void> {
    logWithLabel("debug", "APP Discord API Starting Project...");

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

    /**
     * Log in to Discord using the provided token.
     * The token is expected to be a string that authenticates the client with the Discord API.
     * This method is asynchronous and returns a promise that resolves when the login is successful.
     */
    await this.login(this.settings.token);
    logWithLabel(
      "debug",
      [
        "APP Discord API Started:",
        `  ${emojis.circle_check}  Logged in as ${this.user?.tag} (${this.user?.id})`,
        `  ${emojis.circle_check}  Latency: ${this.ws.ping}ms`,
      ].join("\n"),
    );

    // Load and deploy the handlers
    await this.handlers._load();
    try {
      await Promise.all([
        this.handlers.loadAndSet(this, "buttons"),
        this.handlers.loadAndSet(this, "modals"),
        this.handlers.loadAndSet(this, "menus"),
        this.handlers.components(this),
        this.handlers.deploy(),
      ]);
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

  /**
   * Obtiene un emoji por su nombre, priorizando los emojis del servidor.
   *
   * @param guildId - El ID del servidor donde buscar el emoji.
   * @param emojiName - El nombre del emoji a buscar.
   * @returns {string} El emoji encontrado o el emoji del archivo JSON si no está en el servidor.
   */
  public getEmoji(guildId: string, emojiName: keyof typeof emojis): string {
    const guild = this.guilds.cache.get(guildId);
    if (guild) {
      const emoji = guild.emojis.cache.find((e) => e.name === emojiName);
      if (emoji) return `<:${emoji.name}:${emoji.id}>`;
    }
    // Si no se encuentra en el servidor, usar el emoji del archivo JSON
    return typeof emojis[emojiName] === "string" ? emojis[emojiName] : `:${emojiName}:`;
  }
}
