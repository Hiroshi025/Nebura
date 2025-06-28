import { Client, Collection, GatewayIntentBits, Options, Partials } from "discord.js";
import DisTube from "distube";

import { main } from "@/main";
import { config } from "@/shared/utils/config";
import { logWithLabel } from "@/shared/utils/functions/console";
import emojis from "@config/json/emojis.json";
import { Buttons, Menus, Modals } from "@typings/modules/discord";
import { DiscordError } from "@utils/extends/error.extension";

import { GiveawayService } from "./structure/giveaway";
import { DiscordHandler } from "./structure/handlers/collection";
import { YouTube } from "./structure/handlers/youtube";
import { Command } from "./structure/utils/builders";

/**
 * Represents the main Discord client for the application.
 * Extends the `Client` class from `discord.js` to provide additional functionality.
 */
export class MyDiscord extends Client {
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
   * Collection of modals.
   *
   * @type {Collection<string, unknown>}
   * @public
   */
  public voiceGenerator: Collection<unknown, unknown>;

  /**
   * Collection of cooldowns for commands or interactions.
   *
   * @type {Collection<unknown, unknown>}
   * @public
   */
  public cooldown: Collection<unknown, unknown>;

  /**
   * Collection of job members count.
   *
   * @type {Collection<unknown, unknown>}
   * @public
   */
  public Jobmembercount: any;
  public distube: DisTube;
  Youtubelog: any;

  /**
   * Initializes a new instance of the `MyDiscord` class.
   * Configures the client with specific intents and partials, and initializes handlers and settings.
   */
  constructor() {
    super({
      makeCache: Options.cacheWithLimits({
        ...Options.DefaultMakeCacheSettings,
        AutoModerationRuleManager: 0,
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
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.DirectMessageReactions,
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
          interval: 1_800, // Every hour.
          filter: () => (user) => user.bot && user.id !== user.client.user.id, // Remove all bots.
        },
        threads: {
          interval: 1_800, // Every 30 minutes.
          lifetime: 86_400, // Remove threads older than 24 hours.
        },
        stickers: {
          interval: 1_800, // Every 30 minutes.
          filter: () => (sticker) => sticker.guildId !== this.settings.guildId,
        },
        threadMembers: {
          interval: 1_800, // Every 30 minutes.
          filter: () => (threadMember) => {
            // Remove thread members that are not in the guild.
            const guild = this.guilds.cache.get(this.settings.guildId);
            if (!threadMember.user) return false; // If the user is not defined, do not remove.
            return !guild?.members.cache.has(threadMember.user.id);
          },
        },
        autoModerationRules: {
          interval: 1_800, // Every 30 minutes.
          filter: () => (rule) => {
            // Remove auto moderation rules that are not in the guild.
            const guild = this.guilds.cache.get(this.settings.guildId);
            return !guild?.autoModerationRules.cache.has(rule.id);
          },
        },
      },
    });

    this.distube = new DisTube(this, {
      emitNewSongOnly: true,
      //leaveOnFinish: true,
      emitAddSongWhenCreatingQueue: false,
      emitAddListWhenCreatingQueue: false,
      plugins: [],
    });

    this.handlers = new DiscordHandler(this);
    this.settings = config.modules.discord;
    this.cooldown = new Collection();

    this.categories = new Collection();
    this.commands = new Collection();
    this.buttons = new Collection();

    this.voiceGenerator = new Collection();
    this.precommands = new Collection();
    this.aliases = new Collection();

    this.modals = new Collection();
    this.addons = new Collection();
    this.menus = new Collection();

    this.on("ready", async () => {
      const data = await main.DB.findDiscord(this.user?.id as string);
      if (!data || !this.user || !data.activity) return;
      this.user.setUsername(data.username);
      this.user.setAvatar(data.avatar);
      let activityName: string | undefined;
      if (typeof data.activity === "object" && data.activity !== null && "name" in data.activity) {
        activityName = (data.activity as { name: string }).name;
      } else if (typeof data.activity === "string") {
        activityName = data.activity;
      }
      if (activityName) {
        this.user.setActivity({
          name: activityName,
          url: (data.activity as { url: string }).url,
          state: (data.activity as { status: string }).status,
        });
      }
    });
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
    logWithLabel("debug", "Starting Discord API...");
    const { TOKEN_DISCORD } = process.env;

    // Check if the token is provided in the configuration
    if (!TOKEN_DISCORD) {
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
    await this.login(TOKEN_DISCORD);
    logWithLabel(
      "debug",
      [
        "APP Discord API Started:",
        `  ${emojis.circle_check}  Logged in as ${this.user?.tag} (${this.user?.id})`,
        `  ${emojis.circle_check}  Latency: ${this.ws.ping}ms`,
      ].join("\n"),
    );

    // Load and deploy the handlers
    await this.handlers.loadAll();
    await new GiveawayService();
    await YouTube(this);
    try {
      await Promise.all([this.handlers.deployCommands()]);
    } catch (err) {
      console.error(err);
      throw new DiscordError("Error loading handlers");
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
