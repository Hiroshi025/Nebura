import { Client, Collection, GatewayIntentBits, Options, Partials } from "discord.js";
import { readdirSync, statSync } from "fs";
import { basename, extname, join } from "path";

import { DiscordError } from "@/shared/infrastructure/extends/error.extend";
import { config } from "@/shared/utils/config";
import { logWithLabel } from "@/shared/utils/functions/console";
import emojis from "@config/json/emojis.json";
import { Buttons, Menus, Modals } from "@typings/modules/discord";

import { DiscordHandler } from "./structure/handlers/collection";
import { Command } from "./structure/utils/builders";

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

  /**
   * Initializes a new instance of the `MyClient` class.
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

  /**
   * Reloads a specific command by searching recursively in the commands directory
   * @param commandName - The name of the command to reload (without extension)
   * @returns {Promise<void>} Resolves when the command is reloaded or rejects on error
   */
  public async reloadCommand(commandName: string): Promise<void> {
    const commandPath = config.modules.discord.configs.precommands;
    logWithLabel("debug", `Starting reload for command: ${commandName}`);

    try {
      // Find the command file recursively
      const commandFile = this.findCommandFile(commandPath, commandName);

      if (!commandFile) {
        logWithLabel("custom", `Command ${commandName} not found in ${commandPath}`, {
          customLabel: "Warning",
          context: {
            commandName,
            commandPath,
          },
        });
        throw new Error(`Command ${commandName} not found`);
      }

      logWithLabel("debug", `Found command file at: ${commandFile}`);

      // Clear the cache and re-import
      const modulePath = require.resolve(commandFile);
      delete require.cache[modulePath];

      // Use dynamic import for better error handling
      const commandModule = await import(commandFile);
      const command = commandModule.default || commandModule;

      if (!command || !command.name) {
        logWithLabel("error", `Invalid command structure in ${commandFile}`);
        throw new Error(`Invalid command structure`);
      }

      // Update the command in collections
      this.precommands.set(command.name, command);

      // Update aliases if they exist
      if (command.aliases && Array.isArray(command.aliases)) {
        command.aliases.forEach((alias: string) => {
          this.aliases.set(alias, command.name);
        });
      }

      logWithLabel("success", `Command ${command.name} successfully reloaded from ${commandFile}`);
    } catch (error: any) {
      logWithLabel("error", `Failed to reload command ${commandName}: ${error.message}`);
      console.error(error.stack);
      throw error;
    }
  }

  /**
   * Recursively finds a command file in the directory and subdirectories
   * @param directory - Directory to search in
   * @param commandName - Command name to search for
   * @returns {string | null} Full path to the command file or null if not found
   */
  private findCommandFile(directory: string, commandName: string): string | null {
    try {
      const files = readdirSync(directory);

      for (const file of files) {
        const fullPath = join(directory, file);
        const stat = statSync(fullPath);

        if (stat.isDirectory()) {
          const found = this.findCommandFile(fullPath, commandName);
          if (found) return found;
        } else if (
          stat.isFile() &&
          [".ts", ".js"].includes(extname(file).toLowerCase()) &&
          basename(file, extname(file)).toLowerCase() === commandName.toLowerCase()
        ) {
          return fullPath;
        }
      }

      return null;
    } catch (error: any) {
      logWithLabel(
        "error",
        `Error searching for command ${commandName} in ${directory}: ${error.message}`,
      );
      return null;
    }
  }

  /**
   * Reloads all commands from the commands directory and subdirectories
   * @returns {Promise<void>} Resolves when all commands are reloaded
   */
  public async loadCommands(): Promise<void> {
    const commandPath = config.modules.discord.configs.precommands;
    logWithLabel("debug", `Starting reload of all commands from ${commandPath}`);

    try {
      // Clear existing commands
      this.precommands.clear();
      this.aliases.clear();

      // Find and load all command files
      const commandFiles = this.findAllCommandFiles(commandPath);

      if (commandFiles.length === 0) {
        logWithLabel("custom", `No command files found in ${commandPath}`, {
          customLabel: "Warning",
          context: {
            commandPath,
          },
        });
        return;
      }

      logWithLabel("debug", `Found ${commandFiles.length} command files to load`);

      // Load all commands in parallel
      const loadPromises = commandFiles.map(async (file) => {
        try {
          const modulePath = require.resolve(file);
          delete require.cache[modulePath];

          const commandModule = await import(file);
          const command = commandModule.default || commandModule;

          if (!command || !command.name) {
            logWithLabel("custom", `Skipping invalid command file: ${file}`, {
              customLabel: "Warning",
              context: {
                file,
              },
            });
            return;
          }

          this.precommands.set(command.name, command);

          if (command.aliases && Array.isArray(command.aliases)) {
            command.aliases.forEach((alias: string) => {
              this.aliases.set(alias, command.name);
            });
          }

          logWithLabel("debug", `Loaded command: ${command.name} from ${file}`);
        } catch (error: any) {
          logWithLabel("error", `Failed to load command from ${file}: ${error.message}`);
        }
      });

      await Promise.all(loadPromises);

      logWithLabel("success", `Successfully reloaded ${this.precommands.size} commands`);
    } catch (error: any) {
      logWithLabel("error", `Failed to reload commands: ${error.message}`);
      console.error(error.stack);
      throw error;
    }
  }

  /**
   * Recursively finds all command files in a directory
   * @param directory - Directory to search in
   * @returns {string[]} Array of full paths to command files
   */
  private findAllCommandFiles(directory: string): string[] {
    const commandFiles: string[] = [];

    try {
      const files = readdirSync(directory);

      for (const file of files) {
        const fullPath = join(directory, file);
        const stat = statSync(fullPath);

        if (stat.isDirectory()) {
          commandFiles.push(...this.findAllCommandFiles(fullPath));
        } else if (
          stat.isFile() &&
          [".ts", ".js"].includes(extname(file).toLowerCase()) &&
          !file.endsWith(".d.ts") // Exclude TypeScript declaration files
        ) {
          commandFiles.push(fullPath);
        }
      }
    } catch (error: any) {
      logWithLabel("error", `Error searching for command files in ${directory}: ${error.message}`);
    }

    return commandFiles;
  }
}
