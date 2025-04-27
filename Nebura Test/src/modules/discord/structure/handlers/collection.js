"use strict";
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
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const main_1 = require("../../../../main");
const config_1 = require("../../../../shared/utils/config");
const console_1 = require("../../../../shared/utils/functions/console");
const files_1 = require("../../../../shared/utils/functions/files");
const tools_const_1 = require("../../../../structure/constants/tools.const");
const errors_extender_1 = require("../../../../structure/extenders/errors.extender");
const addons_1 = require("../addons");
/**
 * Handles the core functionality for managing Discord commands, events, and addons.
 *
 * This class is responsible for:
 * - Loading and initializing commands, events, and addons.
 * - Deploying slash commands to the Discord API.
 * - Managing interactive components like buttons, modals, and menus.
 */
class DiscordHandler {
    /**
     * Configuration settings for the Discord module.
     * @private
     */
    settings;
    /**
     * The main Discord client instance.
     * @private
     */
    client;
    /**
     * Initializes the `DiscordHandler` with the provided client instance.
     *
     * @param client - The `MyClient` client instance used to interact with Discord.
     */
    constructor(client) {
        this.settings = config_1.config.modules.discord;
        this.client = client;
    }
    /**
     * Loads commands, events, and addons from their respective directories and initializes them.
     *
     * ### Commands:
     * - Reads command directories specified in the configuration.
     * - Loads command modules and registers them in the client's command collection.
     * - Categorizes commands based on their directory structure.
     *
     * ### Events:
     * - Reads event directories specified in the configuration.
     * - Loads event modules and binds them to the client.
     * - Supports both `once` and `on` event listeners.
     *
     * ### Addons:
     * - Reads addon files from the configured addons path.
     * - Initializes and registers addons in the client's addon collection.
     *
     * Logs the loading status of each module and handles errors gracefully.
     *
     * @async
     * @throws {Error} If there is an issue loading commands, events, or addons.
     */
    async _load() {
        for (const dir of fs_1.default.readdirSync(this.settings.configs.commandpath)) {
            this.client.categories.set(dir, []);
            const files = (0, files_1.getFiles)(this.settings.configs.commandpath + dir, this.settings.configs["bot-extensions"]);
            for (const [_index, file] of files.entries()) {
                const module = require(file).default;
                this.client.commands.set(module.structure.name, module);
                const data = this.client.categories.get(dir);
                data?.push(module.structure.name);
                this.client.categories.set(dir, data);
            }
        }
        for (const dir of fs_1.default.readdirSync(this.settings.configs.eventpath)) {
            const files = (0, files_1.getFiles)(this.settings.configs.eventpath + dir, this.settings.configs["bot-extensions"]);
            for (const file of files) {
                const module = require(file).default;
                tools_const_1.filesLoaded.push(file.split("\\").pop());
                if (module.once) {
                    this.client.once(module.event, (...args) => module.run(...args));
                }
                else {
                    this.client.on(module.event, (...args) => module.run(...args));
                }
            }
        }
        const addonFiles = (0, files_1.getFiles)(this.settings.configs.addonspath, [".addons.ts", ".addons.js"]);
        for (const file of addonFiles) {
            const addonModule = require(file).default;
            if (addonModule instanceof addons_1.Addons) {
                this.client.addons.set(addonModule.structure.name, addonModule);
                await addonModule.initialize(this.client, config_1.config);
            }
        }
        (0, console_1.logWithLabel)("custom", [
            "loaded the Addons-Client\n",
            chalk_1.default.grey(`  ✅  Finished Loading the Addons Module`),
            chalk_1.default.grey(`  🟢  Addon-Loaded Successfully: ${addonFiles.length}`),
        ].join("\n"), "Addons");
    }
    /**
     * Deploys the bot's slash commands to the Discord API.
     *
     * ### Features:
     * - Uses the Discord REST API to register slash commands globally.
     * - Handles API rate limits and logs detailed information about rate-limiting events.
     * - Logs invalid request warnings and debug messages for troubleshooting.
     *
     * ### Process:
     * - Collects all commands from the client's command collection.
     * - Sends a PUT request to the Discord API to register the commands.
     * - Logs the time taken and the number of commands deployed.
     *
     * @async
     * @throws {Error} If there is an issue deploying the commands to the Discord API.
     */
    async deploy() {
        const startTime = performance.now();
        const data = await main_1.main.prisma.myDiscord.findUnique({
            where: { clientId: config_1.config.modules.discord.clientId },
        });
        const rest = new discord_js_1.REST({ version: "10" }).setToken(config_1.config.modules.discord.token);
        if (data && data.logconsole) {
            // INFO - API control events
            rest.on("rateLimited", (info) => {
                (0, console_1.logWithLabel)("custom", [
                    `Method: ${info.method}`,
                    `Time: ${info.timeToReset}`,
                    `Limit: ${info.limit}`,
                    `Url: ${info.url}`,
                ].join("\n"), "RateLimit");
            });
            rest.on("invalidRequestWarning", (info) => {
                (0, console_1.logWithLabel)("custom", [`Invalid Request Warning:`, `Count: ${info.count}`].join("\n"), "InvalidRequest");
            });
            rest.on("debug", (message) => {
                (0, console_1.logWithLabel)("debug", message, "REST Debug");
                console.debug(chalk_1.default.blueBright(`🔍 REST Debug: ${message}`));
            });
        }
        const commands = [...this.client.commands.values()];
        await rest.put(discord_js_1.Routes.applicationCommands(config_1.config.modules.discord.clientId), {
            body: commands.map((s) => s.structure),
        });
        const endTime = performance.now();
        (0, console_1.logWithLabel)("info", [
            `loading Bot-Events:\n`,
            tools_const_1.filesLoaded
                .map((file) => chalk_1.default.grey(`  ✅  Templete-Typescript-Loaded: ${file}`))
                .join("\n"),
        ].join("\n"));
        (0, console_1.logWithLabel)("info", [
            `loaded the Slash-Commands:\n`,
            chalk_1.default.grey(`  ✅  Finished Loading the Slash-Commands`),
            chalk_1.default.grey(`  🟢  Slash-Loaded Successfully: ${commands.length}`),
            chalk_1.default.grey(`  🕛  Took: ${Math.round((endTime - startTime) / 100)}s`),
        ].join("\n"));
    }
    /**
     * Loads and sets interactive components (e.g., buttons, modals, menus) into the client.
     *
     * ### Features:
     * - Dynamically loads files from the specified folder based on the component type.
     * - Registers each component in the corresponding client map (e.g., buttons, modals, menus).
     *
     * ### Supported Component Types:
     * - `buttons`: Interactive buttons for Discord messages.
     * - `modals`: Modal dialogs for user input.
     * - `menus`: Dropdown menus for user selection.
     *
     * @param client - The `MyClient` client instance.
     * @param fileType - The type of file to load (`buttons`, `modals`, `menus`).
     * @async
     * @throws {DiscordError} If there is an issue loading the components.
     */
    async loadAndSet(client, fileType) {
        const folderPath = `${config_1.config.modules.discord.configs.componentspath}/${fileType}`;
        const files = await eternal_support_1.Discord.loadFiles(folderPath);
        try {
            files.forEach(async (file) => {
                const item = (await Promise.resolve(`${file}`).then(s => __importStar(require(s)))).default;
                if (!item.id)
                    return;
                switch (fileType) {
                    case "buttons":
                        client.buttons.set(item.id, item);
                        break;
                    case "modals":
                        client.modals.set(item.id, item);
                        break;
                    case "menus":
                        client.menus.set(item.id, item);
                        break;
                    default:
                        break;
                }
            });
        }
        catch (e) {
            throw new errors_extender_1.DiscordError(`Error loading ${fileType}: ${e}`);
        }
    }
    /**
     * Recursively loads and sets command components (prefix-based) into the client.
     *
     * - Reads the components from the specified directory and its subdirectories.
     * - Ensures each component has a valid `name` and `execute` function before loading.
     *
     * Logs the process of loading and the number of components successfully loaded.
     *
     * @param client - The BotCore instance.
     * @throws {InternalError} If there is an issue loading the components.
     */
    async components(client) {
        const startTime = performance.now();
        function readComponentsRecursively(directory) {
            const filesAndFolders = fs_1.default.readdirSync(directory);
            for (const item of filesAndFolders) {
                const fullPath = path_1.default.join(directory, item);
                if (fs_1.default.statSync(fullPath).isDirectory()) {
                    readComponentsRecursively(fullPath);
                }
                else if (item.endsWith(".ts") || item.endsWith(".js")) {
                    try {
                        const commandModule = require(fullPath);
                        if (commandModule.name && commandModule.execute) {
                            commandModule.path = fullPath;
                            client.precommands.set(commandModule.name, commandModule);
                            if (commandModule.aliases && Array.isArray(commandModule.aliases)) {
                                commandModule.aliases.forEach((alias) => {
                                    client.aliases.set(alias, commandModule.name);
                                });
                            }
                        }
                        else {
                            (0, console_1.logWithLabel)("error", `Error loading component ${item}: missing name or execute function`);
                        }
                    }
                    catch (error) {
                        (0, console_1.logWithLabel)("error", `Error loading component ${item}: ${error}`);
                    }
                }
            }
        }
        try {
            const componentsDir = path_1.default.resolve(`${config_1.config.modules.discord.configs.precommands}`);
            await readComponentsRecursively(componentsDir);
        }
        catch (error) {
            throw new Error(`Error loading components: ${error}`);
        }
        const endTime = performance.now();
        (0, console_1.logWithLabel)("info", [
            `Loaded the Prefix-Commands:\n`,
            `${chalk_1.default.grey(`✅ Finished Loading the Prefix-Commands`)}`,
            `${chalk_1.default.grey(`🟢 Prefix-Loaded Successfully: ${client.precommands.size}`)}`,
            `${chalk_1.default.grey(`🕛 Took: ${Math.round((endTime - startTime) / 1000)}s`)}`,
        ].join("\n"));
    }
}
exports.DiscordHandler = DiscordHandler;
