"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="773c8884-8829-5ed3-ba60-735515e501ce")}catch(e){}}();

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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscordHandler = void 0;
const chalk_1 = __importDefault(require("chalk"));
const discord_js_1 = require("discord.js");
const eternal_support_1 = require("eternal-support");
const fs_1 = require("fs");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const main_1 = require("../../../../../../main");
const error_extend_1 = require("../../../../../../shared/adapters/extends/error.extend");
const DB_1 = require("../../../../../../shared/class/DB");
const config_1 = require("../../../../../../shared/utils/config");
const console_1 = require("../../../../../../shared/utils/functions/console");
const files_1 = require("../../../discord/structure/utils/files");
const addons_1 = require("../addons");
/**
 * A list of file paths that have been loaded.
 * Each entry in the array represents the path of a loaded file or `undefined` if no file was loaded.
 */
const filesLoaded = [];
/**
 * Core handler for Discord module functionality.
 * Manages command, event, and addon loading, deployment, and component management.
 */
class DiscordHandler {
    settings;
    client;
    rest;
    /**
     * Initializes the Discord handler with the client instance.
     * @param client - The Discord client instance
     */
    constructor(client) {
        this.settings = config_1.config.modules.discord;
        this.client = client;
        this.rest = new discord_js_1.REST({ version: "10" }).setToken(process.env.TOKEN_DISCORD);
    }
    /**
     * Loads all Discord components (commands, events, addons, precommands) asynchronously.
     * @throws {Error} If any component fails to load
     */
    async loadAll() {
        try {
            await Promise.all([this.loadCommands(), this.loadEvents(), this.loadAddons(), this.loadPrecommands()]);
        }
        catch (error) {
            throw new Error(`Failed to load Discord components: ${error}`);
        }
    }
    /**
     * Loads commands from the configured commands directory.
     * Organizes commands by category and registers them in the client.
     * @private
     */
    async loadCommands() {
        const commandsPath = path_1.default.join(this.settings.configs.default, this.settings.configs.paths.commands);
        for (const category of (0, fs_1.readdirSync)(commandsPath)) {
            this.client.categories.set(category, []);
            const commandFiles = (0, files_1.getFiles)(path_1.default.join(commandsPath, category), this.settings.configs["bot-extensions"]);
            for (const file of commandFiles) {
                try {
                    const command = (await Promise.resolve(`${file}`).then(s => __importStar(require(s)))).default;
                    this.registerCommand(command, category);
                }
                catch (error) {
                    (0, console_1.logWithLabel)("error", `Failed to load command ${file}: ${error}`);
                }
            }
        }
    }
    /**
     * Registers a single command in the client's collections.
     * @param command - The command to register
     * @param category - The command category
     * @private
     */
    registerCommand(command, category) {
        this.client.commands.set(command.structure.name, command);
        const categoryCommands = this.client.categories.get(category) || [];
        categoryCommands.push(command.structure.name);
        this.client.categories.set(category, categoryCommands);
    }
    /**
     * Loads events from the configured events directory.
     * Binds events to the client with appropriate once/on handlers.
     * @private
     */
    async loadEvents() {
        const eventsPath = path_1.default.join(this.settings.configs.default, this.settings.configs.paths.events);
        for (const category of (0, fs_1.readdirSync)(eventsPath)) {
            const eventFiles = (0, files_1.getFiles)(path_1.default.join(eventsPath, category), this.settings.configs["bot-extensions"]);
            for (const file of eventFiles) {
                try {
                    const event = (await Promise.resolve(`${file}`).then(s => __importStar(require(s)))).default;
                    filesLoaded.push(path_1.default.basename(file));
                    this.registerEvent(event);
                }
                catch (error) {
                    (0, console_1.logWithLabel)("error", `Failed to load event ${file}: ${error}`);
                }
            }
        }
    }
    /**
     * Registers a single event in the client.
     * @param event - The event to register
     * @private
     */
    registerEvent(event) {
        if (event.once) {
            this.client.once(event.event, (...args) => event.run(...args));
        }
        else {
            this.client.on(event.event, (...args) => event.run(...args));
        }
    }
    /**
     * Loads addons from the configured addons directory.
     * Initializes each addon and registers it in the client.
     * @private
     */
    async loadAddons() {
        // Verificar si el cliente está en mantenimiento antes de cargar addons
        const data = await main_1.main.DB.findClient(DB_1.clientID);
        if (data?.maintenance) {
            console.log("[DEBUG] The bot is in maintenance mode. Skipping addon loading.");
            return;
        }
        const addonBasePath = path_1.default.join(this.settings.configs.default, this.settings.configs.paths.addons);
        console.log("\n[DEBUG] Starting Addon loading...");
        console.time("Addon Loading Time");
        try {
            const addonDirs = (await promises_1.default.readdir(addonBasePath, { withFileTypes: true }))
                .filter((dirent) => dirent.isDirectory())
                .map((dirent) => dirent.name);
            const loadResults = await Promise.all(addonDirs.map(async (dir) => this.loadAddonFromDir(addonBasePath, dir)));
            const stats = {
                files: loadResults.filter(Boolean).length,
                loaded: loadResults.filter((r) => r?.loaded).length,
                code: loadResults.reduce((sum, r) => sum + (r?.codeLength || 0), 0),
            };
            console.timeEnd("Addon Loading Time");
            console.log(`[DEBUG] Addons: Files read: ${stats.files}, ` +
                `Addons loaded: ${stats.loaded}, ` +
                `Code read: ${stats.code} characters`);
        }
        catch (error) {
            console.error("[DEBUG] Error loading addons:", error);
        }
    }
    /**
     * Loads an addon from a specific directory.
     * @param basePath - Base addons directory path
     * @param dir - Specific addon directory name
     * @returns Loading statistics or null if failed
     * @private
     */
    async loadAddonFromDir(basePath, dir) {
        const addonFolderPath = path_1.default.join(basePath, dir);
        const filesInFolder = await promises_1.default.readdir(addonFolderPath);
        const addonFile = filesInFolder.find((file) => file.endsWith(".addon.ts") || file.endsWith(".addon.js"));
        if (!addonFile)
            return null;
        try {
            const addonPath = path_1.default.join(addonFolderPath, addonFile);
            const code = await promises_1.default.readFile(addonPath, "utf8");
            const addonModule = (await Promise.resolve(`${path_1.default.resolve(addonPath)}`).then(s => __importStar(require(s)))).default;
            if (addonModule instanceof addons_1.Addons) {
                this.client.addons.set(addonModule.structure.name, addonModule);
                await addonModule.initialize(this.client, config_1.config);
                return { loaded: true, codeLength: code.length };
            }
        }
        catch (error) {
            (0, console_1.logWithLabel)("error", `Failed to load addon ${dir}: ${error}`);
        }
        return { loaded: false, codeLength: 0 };
    }
    /**
     * Loads precommands (prefix commands) from the configured directory.
     * @private
     */
    async loadPrecommands() {
        console.log("\n[DEBUG] Starting Precommand loading...");
        console.time("Precommand Loading Time");
        const stats = { files: 0, loaded: 0, code: 0 };
        const componentsDir = path_1.default.resolve(path_1.default.join(config_1.config.modules.discord.configs.default, config_1.config.modules.discord.configs.paths.precommands));
        try {
            await this.readComponentsRecursively(componentsDir, stats);
            console.timeEnd("Precommand Loading Time");
            console.log(`[DEBUG] Precommands: Files read: ${stats.files}, ` +
                `Precommands loaded: ${stats.loaded}, ` +
                `Code read: ${stats.code} characters`);
        }
        catch (error) {
            console.error("[DEBUG] Error loading precommands:", error);
        }
    }
    /**
     * Recursively reads components from a directory.
     * @param directory - Directory to scan
     * @param stats - Statistics object to update
     * @private
     */
    async readComponentsRecursively(directory, stats) {
        const items = await promises_1.default.readdir(directory, { withFileTypes: true });
        await Promise.all(items.map(async (item) => {
            const fullPath = path_1.default.join(directory, item.name);
            if (item.isDirectory()) {
                await this.readComponentsRecursively(fullPath, stats);
            }
            else if (item.name.endsWith(".ts") || item.name.endsWith(".js")) {
                stats.files++;
                await this.loadPrecommandFile(fullPath, stats);
            }
        }));
    }
    /**
     * Attempts to load a precommand from a file.
     * @param filePath - Path to the precommand file
     * @param stats - Statistics object to update
     * @private
     */
    async loadPrecommandFile(filePath, stats) {
        try {
            const code = await promises_1.default.readFile(filePath, "utf8");
            stats.code += code.length;
            const commandModule = (await Promise.resolve(`${filePath}`).then(s => __importStar(require(s)))).default;
            if (commandModule.name && commandModule.execute) {
                commandModule.path = filePath;
                this.client.precommands.set(commandModule.name, commandModule);
                if (Array.isArray(commandModule.aliases)) {
                    commandModule.aliases.forEach((alias) => {
                        this.client.aliases.set(alias, commandModule.name);
                    });
                }
                stats.loaded++;
            }
        }
        catch (error) {
            (0, console_1.logWithLabel)("error", `Failed to load precommand ${filePath}: ${error}`);
        }
    }
    /**
     * Deploys slash commands to Discord's API.
     * @throws {Error} If deployment fails
     */
    async deployCommands() {
        const startTime = performance.now();
        const commands = [...this.client.commands.values()].map((cmd) => cmd.structure);
        try {
            await this.rest.put(discord_js_1.Routes.applicationCommands(this.settings.id), { body: commands });
            const duration = Math.round(performance.now() - startTime);
            (0, console_1.logWithLabel)("info", [
                `Loaded Bot Events:\n`,
                filesLoaded.map((file) => chalk_1.default.grey(`  ✅  Template-Typescript-Loaded: ${file}`)).join("\n"),
            ].join("\n"));
            (0, console_1.logWithLabel)("info", [
                `Deployed Slash Commands:\n`,
                chalk_1.default.grey(`  ✅  Successfully deployed ${commands.length} commands`),
                chalk_1.default.grey(`  🕛  Took: ${duration}ms`),
            ].join("\n"));
        }
        catch (error) {
            throw new Error(`Failed to deploy commands: ${error}`);
        }
    }
    /**
     * Loads and registers interactive components (buttons, modals, menus).
     * @param fileType - Type of component to load
     * @throws {DiscordError} If loading fails
     */
    async loadComponents(fileType) {
        const folderPath = path_1.default.join(this.settings.configs.default, `${config_1.config.modules.discord.configs.paths.components}/${fileType}`);
        try {
            const files = await eternal_support_1.Discord.loadFiles(folderPath);
            await Promise.all(files.map(async (file) => {
                try {
                    const component = (await Promise.resolve(`${file}`).then(s => __importStar(require(s)))).default;
                    if (!component.id)
                        return;
                    switch (fileType) {
                        case "buttons":
                            this.client.buttons.set(component.id, component);
                            break;
                        case "modals":
                            this.client.modals.set(component.id, component);
                            break;
                        case "menus":
                            this.client.menus.set(component.id, component);
                            break;
                    }
                }
                catch (error) {
                    (0, console_1.logWithLabel)("error", `Failed to load component ${file}: ${error}`);
                }
            }));
        }
        catch (error) {
            throw new error_extend_1.DiscordError(`Error loading ${fileType}: ${error}`);
        }
    }
}
exports.DiscordHandler = DiscordHandler;
//# sourceMappingURL=collection.js.map
//# debugId=773c8884-8829-5ed3-ba60-735515e501ce
