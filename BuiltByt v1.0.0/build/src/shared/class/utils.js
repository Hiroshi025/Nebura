"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="c344f29d-e476-5047-9963-c94418097b1b")}catch(e){}}();

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Utils = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const main_1 = require("../../main");
const config_1 = require("../utils/config");
const console_1 = require("../utils/functions/console");
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
class Utils {
    constructor() { }
    /**
     * Retrieves a guild by its ID
     * @param guildId - The ID of the guild to retrieve
     * @returns {Promise<Guild | null>} The guild object if found, otherwise null
     */
    async get(guildId) {
        if (!guildId)
            return null;
        if (guildId === "0")
            return null;
        const guild = main_1.client.guilds.cache.get(guildId);
        if (!guild)
            return null;
        return guild;
    }
    /**
     * Caches the guilds in the Discord client
     * @returns {Promise<Array<{ id: string, name: string, iconURL: string | null, memberCount: number }>>} Array of guild objects
     */
    async cache() {
        const guilds = main_1.client.guilds.cache.map((guild) => {
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
    async getByGuild(guildId) {
        if (!guildId)
            return null;
        if (guildId === "0")
            return null;
        const guild = main_1.client.guilds.cache.get(guildId);
        if (!guild)
            return null;
        return guild;
    }
    /**
     * Checks if a message is a reply to a bot's message
     * @param message - The message to check
     */
    async isReplyingToBot(message) {
        if (!message.reference)
            return false;
        try {
            const referencedMessage = message.reference.messageId
                ? await message.channel.messages.fetch(message.reference.messageId)
                : null;
            return referencedMessage?.author?.id === main_1.client.user?.id;
        }
        catch {
            return false;
        }
    }
    /**
     * Reloads a specific command by searching recursively in the commands directory
     * @param commandName - The name of the command to reload (without extension)
     * @returns {Promise<void>} Resolves when the command is reloaded or rejects on error
     */
    async reloadCommand(commandName) {
        const commandPath = config_1.config.modules.discord.configs.default + config_1.config.modules.discord.configs.paths.precommands;
        (0, console_1.logWithLabel)("debug", `Starting reload for command: ${commandName}`);
        try {
            // Find the command file recursively
            const commandFile = this.findCommandFile(commandPath, commandName);
            if (!commandFile) {
                (0, console_1.logWithLabel)("custom", `Command ${commandName} not found in ${commandPath}`, {
                    customLabel: "Warning",
                    context: {
                        commandName,
                        commandPath,
                    },
                });
                throw new Error(`Command ${commandName} not found`);
            }
            (0, console_1.logWithLabel)("debug", `Found command file at: ${commandFile}`);
            // Clear the cache and re-import
            const modulePath = require.resolve(commandFile);
            delete require.cache[modulePath];
            // Use dynamic import for better error handling
            const commandModule = await Promise.resolve(`${commandFile}`).then(s => __importStar(require(s)));
            const command = commandModule.default || commandModule;
            if (!command || !command.name) {
                (0, console_1.logWithLabel)("error", `Invalid command structure in ${commandFile}`);
                throw new Error(`Invalid command structure`);
            }
            // Update the command in collections
            main_1.client.precommands.set(command.name, command);
            // Update aliases if they exist
            if (command.aliases && Array.isArray(command.aliases)) {
                command.aliases.forEach((alias) => {
                    main_1.client.aliases.set(alias, command.name);
                });
            }
            (0, console_1.logWithLabel)("success", `Command ${command.name} successfully reloaded from ${commandFile}`);
        }
        catch (error) {
            (0, console_1.logWithLabel)("error", `Failed to reload command ${commandName}: ${error.message}`);
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
    findCommandFile(directory, commandName) {
        try {
            const files = (0, fs_1.readdirSync)(directory);
            for (const file of files) {
                const fullPath = (0, path_1.join)(directory, file);
                const stat = (0, fs_1.statSync)(fullPath);
                if (stat.isDirectory()) {
                    const found = this.findCommandFile(fullPath, commandName);
                    if (found)
                        return found;
                }
                else if (stat.isFile() &&
                    [".ts", ".js"].includes((0, path_1.extname)(file).toLowerCase()) &&
                    (0, path_1.basename)(file, (0, path_1.extname)(file)).toLowerCase() === commandName.toLowerCase()) {
                    return fullPath;
                }
            }
            return null;
        }
        catch (error) {
            (0, console_1.logWithLabel)("error", `Error searching for command ${commandName} in ${directory}: ${error.message}`);
            return null;
        }
    }
    /**
     * Reloads all commands from the commands directory and subdirectories
     * @returns {Promise<void>} Resolves when all commands are reloaded
     */
    async loadCommands() {
        const commandPath = config_1.config.modules.discord.configs.default + config_1.config.modules.discord.configs.paths.precommands;
        (0, console_1.logWithLabel)("debug", `Starting reload of all commands from ${commandPath}`);
        try {
            // Clear existing commands
            main_1.client.precommands.clear();
            main_1.client.aliases.clear();
            // Find and load all command files
            const commandFiles = this.findAllCommandFiles(commandPath);
            if (commandFiles.length === 0) {
                (0, console_1.logWithLabel)("custom", `No command files found in ${commandPath}`, {
                    customLabel: "Warning",
                });
                return;
            }
            (0, console_1.logWithLabel)("debug", `Found ${commandFiles.length} command files to load`);
            // Load all commands in parallel
            const loadPromises = commandFiles.map(async (file) => {
                try {
                    const modulePath = require.resolve(file);
                    delete require.cache[modulePath];
                    const commandModule = await Promise.resolve(`${file}`).then(s => __importStar(require(s)));
                    const command = commandModule.default || commandModule;
                    if (!command || !command.name) {
                        (0, console_1.logWithLabel)("custom", `Skipping invalid command file: ${file}`, {
                            customLabel: "Warning",
                            context: {
                                file,
                            },
                        });
                        return;
                    }
                    main_1.client.precommands.set(command.name, command);
                    if (command.aliases && Array.isArray(command.aliases)) {
                        command.aliases.forEach((alias) => {
                            main_1.client.aliases.set(alias, command.name);
                        });
                    }
                    (0, console_1.logWithLabel)("debug", `Loaded command: ${command.name} from ${file}`);
                }
                catch (error) {
                    (0, console_1.logWithLabel)("error", `Failed to load command from ${file}: ${error.message}`);
                }
            });
            await Promise.all(loadPromises);
            (0, console_1.logWithLabel)("success", `Successfully reloaded ${main_1.client.precommands.size} commands`);
        }
        catch (error) {
            (0, console_1.logWithLabel)("error", `Failed to reload commands: ${error.message}`);
            console.error(error.stack);
            throw error;
        }
    }
    /**
     * Recursively finds all command files in a directory
     * @param directory - Directory to search in
     * @returns {string[]} Array of full paths to command files
     */
    findAllCommandFiles(directory) {
        const commandFiles = [];
        try {
            const files = (0, fs_1.readdirSync)(directory);
            for (const file of files) {
                const fullPath = (0, path_1.join)(directory, file);
                const stat = (0, fs_1.statSync)(fullPath);
                if (stat.isDirectory()) {
                    commandFiles.push(...this.findAllCommandFiles(fullPath));
                }
                else if (stat.isFile() &&
                    [".ts", ".js"].includes((0, path_1.extname)(file).toLowerCase()) &&
                    !file.endsWith(".d.ts") // Exclude TypeScript declaration files
                ) {
                    commandFiles.push(fullPath);
                }
            }
        }
        catch (error) {
            (0, console_1.logWithLabel)("error", `Error searching for command files in ${directory}: ${error.message}`);
        }
        return commandFiles;
    }
}
exports.Utils = Utils;
//# sourceMappingURL=utils.js.map
//# debugId=c344f29d-e476-5047-9963-c94418097b1b
