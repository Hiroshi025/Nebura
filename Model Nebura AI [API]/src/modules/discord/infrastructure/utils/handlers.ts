import chalk from "chalk";
import { ClientEvents, REST, Routes } from "discord.js";
import { Discord } from "eternal-support";
import fs from "fs";

import { filesLoaded } from "@/infrastructure/constants/tools.constants";
import { DiscordError } from "@/infrastructure/extenders/errors.extender";
import { config } from "@/shared/utils/config";
import { logWithLabel } from "@/shared/utils/functions/console";
import { getFiles } from "@/shared/utils/functions/files";
import { FileType } from "@/typings/discord";

import { Addons } from "../addons";
import { MainDiscord } from "../client";
import { Command, Event } from "./builders";

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
  private client: MainDiscord;

  /**
   * Initializes the `DiscordHandler` with the provided client instance.
   *
   * @param client - The `MainDiscord` client instance used to interact with Discord.
   */
  constructor(client: MainDiscord) {
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
    for (const dir of fs.readdirSync(this.settings.configs.commandpath)) {
      this.client.categories.set(dir, []);

      const files = getFiles(
        this.settings.configs.commandpath + dir,
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

    for (const dir of fs.readdirSync(this.settings.configs.eventpath)) {
      const files = getFiles(
        this.settings.configs.eventpath + dir,
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

    const addonFiles = getFiles(this.settings.configs.addonspath, [".addons.ts", ".addons.js"]);

    for (const file of addonFiles) {
      const addonModule = require(file).default;
      if (addonModule instanceof Addons) {
        this.client.addons.set(addonModule.structure.name, addonModule);
        await addonModule.initialize(this.client, config);
      }
    }

    logWithLabel(
      "custom",
      [
        "loaded the Addons-Client\n",
        chalk.grey(`  ✅  Finished Loading the Addons Module`),
        chalk.grey(`  🟢  Addon-Loaded Successfully: ${addonFiles.length}`),
      ].join("\n"),
      "Addons",
    );
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
    const rest = new REST({ version: "10" }).setToken(config.modules.discord.token);

    // INFO - API control events
    rest.on("rateLimited", (info) => {
      logWithLabel(
        "custom",
        [
          `Method: ${info.method}`,
          `Limit: ${info.limit}`,
          `Time: ${info.timeToReset}`,
          `Url: ${info.url}`,
        ].join("\n"),
        "RateLimit",
      );
    });

    rest.on("invalidRequestWarning", (info) => {
      logWithLabel(
        "custom",
        [`Invalid Request Warning:`, `Count: ${info.count}`].join("\n"),
        "InvalidRequest",
      );
    });

    rest.on("debug", (message) => {
      logWithLabel("debug", message, "REST Debug");
      console.debug(chalk.blueBright(`🔍 REST Debug: ${message}`));
    });

    const commands = [...this.client.commands.values()];
    await rest.put(Routes.applicationCommands(config.modules.discord.clientId), {
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
   * @param client - The `MainDiscord` client instance.
   * @param fileType - The type of file to load (`buttons`, `modals`, `menus`).
   * @async
   * @throws {DiscordError} If there is an issue loading the components.
   */
  async loadAndSet(client: MainDiscord, fileType: FileType) {
    const folderPath = `${config.modules.discord.configs.componentspath}/${fileType}`;
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
}
