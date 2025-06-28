import chalk from "chalk";
import { ClientEvents, REST, Routes } from "discord.js";
import { Discord } from "eternal-support";
import { readdirSync } from "fs";
import fs from "fs/promises";
import path from "path";

import { main } from "@/main";
import { clientID } from "@/shared/class/DB";
import { config } from "@/shared/utils/config";
import { logWithLabel } from "@/shared/utils/functions/console";
import { FileType } from "@typings/modules/discord";
import { DiscordError } from "@utils/extends/error.extension";

import { MyDiscord } from "../../client";
import { Addons } from "../addons";
import { Command, Event } from "../utils/builders";
import { getFiles } from "../utils/files";

/**
 * A list of file paths that have been loaded.
 * Each entry in the array represents the path of a loaded file or `undefined` if no file was loaded.
 */
const filesLoaded: (string | undefined)[] = [];

/**
 * Core handler for Discord module functionality.
 * Manages command, event, and addon loading, deployment, and component management.
 */
export class DiscordHandler {
  private readonly settings: typeof config.modules.discord;
  private readonly client: MyDiscord;
  private readonly rest: REST;

  /**
   * Initializes the Discord handler with the client instance.
   * @param client - The Discord client instance
   */
  constructor(client: MyDiscord) {
    this.settings = config.modules.discord;
    this.client = client;
    this.rest = new REST({ version: "10" }).setToken(process.env.TOKEN_DISCORD as string);
  }

  /**
   * Loads all Discord components (commands, events, addons, precommands) asynchronously.
   * @throws {Error} If any component fails to load
   */
  public async loadAll(): Promise<void> {
    try {
      await Promise.all([this.loadCommands(), this.loadEvents(), this.loadAddons(), this.loadPrecommands()]);
    } catch (error) {
      throw new Error(`Failed to load Discord components: ${error}`);
    }
  }

  /**
   * Loads commands from the configured commands directory.
   * Organizes commands by category and registers them in the client.
   * @private
   */
  private async loadCommands(): Promise<void> {
    const commandsPath = path.join(this.settings.configs.default, this.settings.configs.paths.commands);

    for (const category of readdirSync(commandsPath)) {
      this.client.categories.set(category, []);

      const commandFiles = getFiles(path.join(commandsPath, category), this.settings.configs["bot-extensions"]);

      for (const file of commandFiles) {
        try {
          const command: Command = (await import(file)).default;
          this.registerCommand(command, category);
        } catch (error) {
          logWithLabel("error", `Failed to load command ${file}: ${error}`);
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
  private registerCommand(command: Command, category: string): void {
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
  private async loadEvents(): Promise<void> {
    const eventsPath = path.join(this.settings.configs.default, this.settings.configs.paths.events);

    for (const category of readdirSync(eventsPath)) {
      const eventFiles = getFiles(path.join(eventsPath, category), this.settings.configs["bot-extensions"]);

      for (const file of eventFiles) {
        try {
          const event: Event<keyof ClientEvents> = (await import(file)).default;
          filesLoaded.push(path.basename(file));
          this.registerEvent(event);
        } catch (error) {
          logWithLabel("error", `Failed to load event ${file}: ${error}`);
        }
      }
    }
  }

  /**
   * Registers a single event in the client.
   * @param event - The event to register
   * @private
   */
  private registerEvent(event: Event<keyof ClientEvents>): void {
    if (event.once) {
      this.client.once(event.event, (...args) => event.run(...args));
    } else {
      this.client.on(event.event, (...args) => event.run(...args));
    }
  }

  /**
   * Loads addons from the configured addons directory.
   * Initializes each addon and registers it in the client.
   * @private
   */
  private async loadAddons(): Promise<void> {
    // Verificar si el cliente está en mantenimiento antes de cargar addons
    const data = await main.DB.findClient(clientID);
    if (data?.maintenance) {
      console.log("[DEBUG] The bot is in maintenance mode. Skipping addon loading.");
      return;
    }

    const addonBasePath = path.join(this.settings.configs.default, this.settings.configs.paths.addons);

    console.log("\n[DEBUG] Starting Addon loading...");
    console.time("Addon Loading Time");

    try {
      const addonDirs = (await fs.readdir(addonBasePath, { withFileTypes: true }))
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name);

      const loadResults = await Promise.all(addonDirs.map(async (dir) => this.loadAddonFromDir(addonBasePath, dir)));

      const stats = {
        files: loadResults.filter(Boolean).length,
        loaded: loadResults.filter((r) => r?.loaded).length,
        code: loadResults.reduce((sum, r) => sum + (r?.codeLength || 0), 0),
      };

      console.timeEnd("Addon Loading Time");
      console.log(
        `[DEBUG] Addons: Files read: ${stats.files}, ` +
          `Addons loaded: ${stats.loaded}, ` +
          `Code read: ${stats.code} characters`,
      );
    } catch (error) {
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
  private async loadAddonFromDir(
    basePath: string,
    dir: string,
  ): Promise<{ loaded: boolean; codeLength: number } | null> {
    const addonFolderPath = path.join(basePath, dir);
    const filesInFolder = await fs.readdir(addonFolderPath);
    const addonFile = filesInFolder.find((file) => file.endsWith(".addon.ts") || file.endsWith(".addon.js"));

    if (!addonFile) return null;

    try {
      const addonPath = path.join(addonFolderPath, addonFile);
      const code = await fs.readFile(addonPath, "utf8");
      const addonModule = (await import(path.resolve(addonPath))).default;

      if (addonModule instanceof Addons) {
        this.client.addons.set(addonModule.structure.name, addonModule);
        await addonModule.initialize(this.client, config);
        return { loaded: true, codeLength: code.length };
      }
    } catch (error) {
      logWithLabel("error", `Failed to load addon ${dir}: ${error}`);
    }

    return { loaded: false, codeLength: 0 };
  }

  /**
   * Loads precommands (prefix commands) from the configured directory.
   * @private
   */
  private async loadPrecommands(): Promise<void> {
    console.log("\n[DEBUG] Starting Precommand loading...");
    console.time("Precommand Loading Time");

    const stats = { files: 0, loaded: 0, code: 0 };
    const componentsDir = path.resolve(
      path.join(config.modules.discord.configs.default, config.modules.discord.configs.paths.precommands),
    );

    try {
      await this.readComponentsRecursively(componentsDir, stats);
      console.timeEnd("Precommand Loading Time");
      console.log(
        `[DEBUG] Precommands: Files read: ${stats.files}, ` +
          `Precommands loaded: ${stats.loaded}, ` +
          `Code read: ${stats.code} characters`,
      );
    } catch (error) {
      console.error("[DEBUG] Error loading precommands:", error);
    }
  }

  /**
   * Recursively reads components from a directory.
   * @param directory - Directory to scan
   * @param stats - Statistics object to update
   * @private
   */
  private async readComponentsRecursively(
    directory: string,
    stats: { files: number; loaded: number; code: number },
  ): Promise<void> {
    const items = await fs.readdir(directory, { withFileTypes: true });

    await Promise.all(
      items.map(async (item) => {
        const fullPath = path.join(directory, item.name);
        if (item.isDirectory()) {
          await this.readComponentsRecursively(fullPath, stats);
        } else if (item.name.endsWith(".ts") || item.name.endsWith(".js")) {
          stats.files++;
          await this.loadPrecommandFile(fullPath, stats);
        }
      }),
    );
  }

  /**
   * Attempts to load a precommand from a file.
   * @param filePath - Path to the precommand file
   * @param stats - Statistics object to update
   * @private
   */
  private async loadPrecommandFile(
    filePath: string,
    stats: { files: number; loaded: number; code: number },
  ): Promise<void> {
    try {
      const code = await fs.readFile(filePath, "utf8");
      stats.code += code.length;
      const commandModule = (await import(filePath)).default;

      if (commandModule.name && commandModule.execute) {
        commandModule.path = filePath;
        this.client.precommands.set(commandModule.name, commandModule);

        if (Array.isArray(commandModule.aliases)) {
          commandModule.aliases.forEach((alias: string) => {
            this.client.aliases.set(alias, commandModule.name);
          });
        }
        stats.loaded++;
      }
    } catch (error) {
      logWithLabel("error", `Failed to load precommand ${filePath}: ${error}`);
    }
  }

  /**
   * Deploys slash commands to Discord's API.
   * @throws {Error} If deployment fails
   */
  public async deployCommands(): Promise<void> {
    const startTime = performance.now();
    const commands = [...this.client.commands.values()].map((cmd) => cmd.structure);

    try {
      await this.rest.put(Routes.applicationCommands(this.settings.id), { body: commands });
      const duration = Math.round(performance.now() - startTime);

      logWithLabel(
        "info",
        [
          `Loaded Bot Events:\n`,
          filesLoaded.map((file) => chalk.grey(`  ✅  Template-Typescript-Loaded: ${file}`)).join("\n"),
        ].join("\n"),
      );

      logWithLabel(
        "info",
        [
          `Deployed Slash Commands:\n`,
          chalk.grey(`  ✅  Successfully deployed ${commands.length} commands`),
          chalk.grey(`  🕛  Took: ${duration}ms`),
        ].join("\n"),
      );
    } catch (error) {
      throw new Error(`Failed to deploy commands: ${error}`);
    }
  }

  /**
   * Loads and registers interactive components (buttons, modals, menus).
   * @param fileType - Type of component to load
   * @throws {DiscordError} If loading fails
   */
  public async loadComponents(fileType: FileType): Promise<void> {
    const folderPath = path.join(
      this.settings.configs.default,
      `${config.modules.discord.configs.paths.components}/${fileType}`,
    );

    try {
      const files = await Discord.loadFiles(folderPath);
      await Promise.all(
        files.map(async (file) => {
          try {
            const component = (await import(file)).default;
            if (!component.id) return;

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
          } catch (error) {
            logWithLabel("error", `Failed to load component ${file}: ${error}`);
          }
        }),
      );
    } catch (error) {
      throw new DiscordError(`Error loading ${fileType}: ${error}`);
    }
  }
}
