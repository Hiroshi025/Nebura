import { Message } from "discord.js";
import { readdirSync, statSync } from "fs";
import { basename, extname, join } from "path";

import { client } from "@/main";
import { config } from "@utils/config";
import { logWithLabel } from "@utils/functions/console";

/**
 * Utility class for managing Discord guilds and commands
 * @class Utils
 * @description Provides methods to retrieve guilds, cache guild information, check message replies, and reload commands.
 * @example
 * const utils = new Utils();
 * const guild = await utils.get("123456789012345678");
 * console.log(guild?.name); // Outputs the name of the guild if found
 * 
 */
export class Utils {
  constructor() {}

  /**
   * Retrieves a guild by its ID
   * @param guildId - The ID of the guild to retrieve
   * @returns {Promise<Guild | null>} The guild object if found, otherwise null
   */
  public async get(guildId: string) {
    if (!guildId) return null;
    if (guildId === "0") return null;

    const guild = client.guilds.cache.get(guildId);
    if (!guild) return null;
    return guild;
  }

  /**
   * Caches the guilds in the Discord client
   * @returns {Promise<Array<{ id: string, name: string, iconURL: string | null, memberCount: number }>>} Array of guild objects
   */
  public async cache() {
    const guilds = client.guilds.cache.map((guild) => {
      return {
        id: guild.id,
        name: guild.name,
        iconURL: guild.iconURL(),
        memberCount: guild.memberCount,
      };
    });

    return guilds;
  }

  /**
   * Retrieves a guild by its ID
   * @param guildId - The ID of the guild to retrieve
   * @returns {Promise<Guild | null>} The guild object if found, otherwise null
   */
  public async getByGuild(guildId: string) {
    if (!guildId) return null;
    if (guildId === "0") return null;

    const guild = client.guilds.cache.get(guildId);
    if (!guild) return null;
    return guild;
  }

  /**
   * Checks if a message is a reply to a bot's message
   * @param message - The message to check
   */
  public async isReplyingToBot(message: Message): Promise<boolean> {
    if (!message.reference) return false;
    try {
      const referencedMessage = message.reference.messageId
        ? await message.channel.messages.fetch(message.reference.messageId)
        : null;
      return referencedMessage?.author?.id === client.user?.id;
    } catch {
      return false;
    }
  }

  /**
   * Reloads a specific command by searching recursively in the commands directory
   * @param commandName - The name of the command to reload (without extension)
   * @returns {Promise<void>} Resolves when the command is reloaded or rejects on error
   */
  public async reloadCommand(commandName: string): Promise<void> {
    const commandPath =
      config.modules.discord.configs.default + config.modules.discord.configs.paths.precommands;
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
      client.precommands.set(command.name, command);

      // Update aliases if they exist
      if (command.aliases && Array.isArray(command.aliases)) {
        command.aliases.forEach((alias: string) => {
          client.aliases.set(alias, command.name);
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
    const commandPath =
      config.modules.discord.configs.default + config.modules.discord.configs.paths.precommands;
    logWithLabel("debug", `Starting reload of all commands from ${commandPath}`);

    try {
      // Clear existing commands
      client.precommands.clear();
      client.aliases.clear();

      // Find and load all command files
      const commandFiles = this.findAllCommandFiles(commandPath);

      if (commandFiles.length === 0) {
        logWithLabel("custom", `No command files found in ${commandPath}`, {
          customLabel: "Warning",
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

          client.precommands.set(command.name, command);

          if (command.aliases && Array.isArray(command.aliases)) {
            command.aliases.forEach((alias: string) => {
              client.aliases.set(alias, command.name);
            });
          }

          logWithLabel("debug", `Loaded command: ${command.name} from ${file}`);
        } catch (error: any) {
          logWithLabel("error", `Failed to load command from ${file}: ${error.message}`);
        }
      });

      await Promise.all(loadPromises);

      logWithLabel("success", `Successfully reloaded ${client.precommands.size} commands`);
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
