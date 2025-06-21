import chalk from "chalk";
import { ClientEvents, REST, Routes } from "discord.js";
import { Discord } from "eternal-support";
import { readdirSync, statSync } from "fs";
import fs from "fs/promises";
import path from "path";

import { filesLoaded } from "@/shared/infrastructure/constants/tools";
import { DiscordError } from "@/shared/infrastructure/extends/error.extend";
import { config } from "@/shared/utils/config";
import { logWithLabel } from "@/shared/utils/functions/console";
import { getFiles } from "@modules/discord/structure/utils/files";
import { FileType } from "@typings/modules/discord";

import { MyClient } from "../../client";
import { Addons } from "../addons";
import { Command, Event } from "../utils/builders";

/**
 * Handles the core functionality for managing Discord commands, events, and addons.
 *
 * This class is responsible for:
 * - Loading and initializing commands, events, and addons.
 * - Deploying slash commands to the Discord API.
 * - Managing interactive components like buttons, modals, and menus.
 */
export class DiscordHandler {
  /**
   * Configuration settings for the Discord module.
   * @private
   */
  private settings: typeof config.modules.discord;

  /**
   * The main Discord client instance.
   * @private
   */
  private client: MyClient;

  /**
   * Initializes the `DiscordHandler` with the provided client instance.
   *
   * @param client - The `MyClient` client instance used to interact with Discord.
   */
  constructor(client: MyClient) {
    this.settings = config.modules.discord;
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
  public async _load() {
    // --- DEBUG AND OPTIMIZED COMMAND LOADING ---
    for (const dir of readdirSync(
      this.settings.configs.default + this.settings.configs.commandpath,
    )) {
      this.client.categories.set(dir, []);

      const files = getFiles(
        this.settings.configs.default + this.settings.configs.commandpath + dir,
        this.settings.configs["bot-extensions"],
      );
      for (const [_index, file] of files.entries()) {
        const module: Command = require(file).default;

        this.client.commands.set(module.structure.name, module);
        const data = this.client.categories.get(dir);
        data?.push(module.structure.name);
        this.client.categories.set(dir, data!);
      }
    }

    for (const dir of readdirSync(
      this.settings.configs.default + this.settings.configs.eventpath,
    )) {
      const files = getFiles(
        this.settings.configs.default + this.settings.configs.eventpath + dir,
        this.settings.configs["bot-extensions"],
      );
      for (const file of files) {
        const module: Event<keyof ClientEvents> = require(file).default;
        filesLoaded.push(file.split("\\").pop());
        if (module.once) {
          this.client.once(module.event, (...args): void => module.run(...args));
        } else {
          this.client.on(module.event, (...args): void => module.run(...args));
        }
      }
    }

    // --- DEBUG AND OPTIMIZED ADDON LOADING ---
    const addonBasePath = this.settings.configs.default + this.settings.configs.addonspath;
    const addonDirs = (await fs.readdir(addonBasePath, { withFileTypes: true }))
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);

    let totalAddonFiles = 0;
    let totalAddonCode = 0;
    let loadedAddons: string[] = [];

    console.log("\n[DEBUG] Starting general Addon loading...");
    console.time("Total Addon Loading Time");

    await Promise.all(
      addonDirs.map(async (dir) => {
        const addonFolderPath = path.join(addonBasePath, dir);
        const filesInFolder = await fs.readdir(addonFolderPath);
        const addonFile = filesInFolder.find(
          (file) => file.endsWith(".addon.ts") || file.endsWith(".addon.js"),
        );
        if (addonFile) {
          totalAddonFiles++;
          const addonPath = path.join(addonFolderPath, addonFile);
          const code = await fs.readFile(addonPath, "utf8");
          totalAddonCode += code.length;
          const resolvedPath = path.resolve(addonPath);
          const addonModule = (await import(resolvedPath)).default;
          if (addonModule instanceof Addons) {
            this.client.addons.set(addonModule.structure.name, addonModule);
            await addonModule.initialize(this.client, config);
            loadedAddons.push(addonModule.structure.name);
          }
        }
      }),
    );

    console.timeEnd("Total Addon Loading Time");
    console.log(
      `[DEBUG] Addons: Files read: ${totalAddonFiles}, Addons loaded: ${loadedAddons.length}, Code read: ${totalAddonCode} characters`,
    );

    // --- DEBUG AND OPTIMIZED PRECOMMAND LOADING ---
    let precommandStats = { files: 0, cargados: 0, code: 0 };

    async function readComponentsRecursively(
      directory: string,
      client: MyClient,
      stats: { files: number; cargados: number; code: number },
    ) {
      const filesAndFolders = await fs.readdir(directory, { withFileTypes: true });
      await Promise.all(
        filesAndFolders.map(async (item) => {
          const fullPath = path.join(directory, item.name);
          if (item.isDirectory()) {
            await readComponentsRecursively(fullPath, client, stats);
          } else if (item.name.endsWith(".ts") || item.name.endsWith(".js")) {
            stats.files++;
            try {
              const code = await fs.readFile(fullPath, "utf8");
              stats.code += code.length;
              const commandModule = (await import(fullPath)).default;
              if (commandModule.name && commandModule.execute) {
                commandModule.path = fullPath;
                client.precommands.set(commandModule.name, commandModule);
                if (commandModule.aliases && Array.isArray(commandModule.aliases)) {
                  commandModule.aliases.forEach((alias: string): void => {
                    client.aliases.set(alias, commandModule.name);
                  });
                }
                stats.cargados++;
              }
            } catch (error) {
              // Loading error, does not count as loaded
            }
          }
        }),
      );
    }

    console.log("\n[DEBUG] Starting general Precommand loading...");
    console.time("Total Precommand Loading Time");
    try {
      const componentsDir = path.resolve(
        `${config.modules.discord.configs.default + config.modules.discord.configs.precommands}`,
      );
      await readComponentsRecursively(componentsDir, this.client, precommandStats);
    } catch (error) {
      console.error(`[DEBUG] Global error in precommand loading:`, error);
    }
    console.timeEnd("Total Precommand Loading Time");
    console.log(
      `[DEBUG] Precommands: Files read: ${precommandStats.files}, Precommands loaded: ${precommandStats.cargados}, Code read: ${precommandStats.code} characters`,
    );

    // ...logWithLabel summary if desired...
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
  public async deploy() {
    const startTime = performance.now();
    const rest = new REST({ version: "10" }).setToken(process.env.TOKEN_DISCORD as string);
    const commands = [...this.client.commands.values()];
    await rest.put(Routes.applicationCommands(config.modules.discord.id), {
      body: commands.map((s) => s.structure),
    });

    const endTime = performance.now();

    logWithLabel(
      "info",
      [
        `loading Bot-Events:\n`,
        filesLoaded
          .map((file): string => chalk.grey(`  ✅  Templete-Typescript-Loaded: ${file}`))
          .join("\n"),
      ].join("\n"),
    );

    logWithLabel(
      "info",
      [
        `loaded the Slash-Commands:\n`,
        chalk.grey(`  ✅  Finished Loading the Slash-Commands`),
        chalk.grey(`  🟢  Slash-Loaded Successfully: ${commands.length}`),
        chalk.grey(`  🕛  Took: ${Math.round((endTime - startTime) / 100)}s`),
      ].join("\n"),
    );
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
  async loadAndSet(client: MyClient, fileType: FileType) {
    const folderPath =
      this.settings.configs.default +
      `${config.modules.discord.configs.componentspath}/${fileType}`;
    const files = await Discord.loadFiles(folderPath);
    try {
      files.forEach(async (file: string) => {
        const item = (await import(file)).default;
        if (!item.id) return;
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
    } catch (e) {
      throw new DiscordError(`Error loading ${fileType}: ${e}`);
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
  async components(client: MyClient) {
    const startTime = performance.now();

    function readComponentsRecursively(directory: string) {
      const filesAndFolders = readdirSync(directory);
      for (const item of filesAndFolders) {
        const fullPath = path.join(directory, item);
        if (statSync(fullPath).isDirectory()) {
          readComponentsRecursively(fullPath);
        } else if (item.endsWith(".ts") || item.endsWith(".js")) {
          try {
            const commandModule = require(fullPath);
            if (commandModule.name && commandModule.execute) {
              commandModule.path = fullPath;
              client.precommands.set(commandModule.name, commandModule);
              if (commandModule.aliases && Array.isArray(commandModule.aliases)) {
                commandModule.aliases.forEach((alias: string): void => {
                  client.aliases.set(alias, commandModule.name);
                });
              }
            } else {
              logWithLabel(
                "error",
                `Error loading component ${item}: missing name or execute function`,
              );
            }
          } catch (error) {
            logWithLabel("error", `Error loading component ${item}: ${error}`);
          }
        }
      }
    }

    try {
      const componentsDir = path.resolve(
        `${config.modules.discord.configs.default + config.modules.discord.configs.precommands}`,
      );
      await readComponentsRecursively(componentsDir);
    } catch (error) {
      throw new Error(`Error loading components: ${error}`);
    }

    const endTime = performance.now();
    logWithLabel(
      "info",
      [
        `Loaded the Prefix-Commands:\n`,
        `${chalk.grey(`✅ Finished Loading the Prefix-Commands`)}`,
        `${chalk.grey(`🟢 Prefix-Loaded Successfully: ${client.precommands.size}`)}`,
        `${chalk.grey(`🕛 Took: ${Math.round((endTime - startTime) / 1000)}s`)}`,
      ].join("\n"),
    );
  }
}
