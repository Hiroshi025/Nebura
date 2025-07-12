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
import { DiscordError } from "@shared/utils/extends/error.extension";
import { FileType } from "@typings/modules/discord";

import { MyDiscord } from "../../client";
import { Addons } from "../addons";
import { Command, Event } from "../utils/builders";
import { getFiles } from "../utils/files";

/**
 * A list of file paths that have been loaded.
 * Each entry in the array represents the path of a loaded file or `undefined` if no file was loaded.
 */
const filesLoaded: (string | undefined)[] = [];
const { TOKEN_DISCORD } = process.env;

/**
 * Core handler for Discord module functionality.
 * Handles loading, deployment, and management of commands, events, addons, and components for the Discord module.
 */
export class DiscordHandler {
  private readonly settings: typeof config.modules.discord;
  private readonly client: MyDiscord;
  private readonly rest: REST;

  /**
   * Create a new DiscordHandler instance.
   * @param client - The Discord client instance.
   */
  constructor(client: MyDiscord) {
    this.settings = config.modules.discord;
    this.client = client;
    const token = TOKEN_DISCORD ? TOKEN_DISCORD : this.settings.token;
    if (!token) {
      throw new DiscordError("Discord token is not set. Please check your environment variables or config file.");
    }
    this.rest = new REST({
      version: "10",
    }).setToken(token);
  }

  /**
   * Loads all Discord components (commands, events, addons, precommands) asynchronously.
   * @throws {Error} If any component fails to load.
   */
  public async loadAll(): Promise<void> {
    try {
      await Promise.all([this.loadCommands(), this.loadEvents(), this.loadAddons(), this.loadPrecommands()]);
    } catch (error) {
      throw new DiscordError(`Failed to load Discord components: ${error}`);
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
   * @param command - The command to register.
   * @param category - The command category.
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
   * @param event - The event to register.
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
   * Skips loading if the client is in maintenance mode.
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
   * @param basePath - The base path of the addons directory.
   * @param dir - The name of the specific addon directory.
   * @returns Loading statistics or null if loading failed.
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
    const globalStart = performance.now();
    console.log("\n[DEBUG] Starting Precommand loading...");
    console.time("Precommand Loading Time");

    const stats = { files: 0, loaded: 0, code: 0 };
    const loadedFiles: string[] = [];
    const failedFiles: { file: string; error: any }[] = [];
    const componentsDir = path.resolve(
      path.join(config.modules.discord.configs.default, config.modules.discord.configs.paths.precommands),
    );

    try {
      await this.readComponentsRecursively(componentsDir, stats, loadedFiles, failedFiles);
      console.timeEnd("Precommand Loading Time");
      const globalEnd = performance.now();
      console.log(
        `[DEBUG] Precommands: Files read: ${stats.files}, ` +
          `Precommands loaded: ${stats.loaded}, ` +
          `Code read: ${stats.code} characters`,
      );
      if (failedFiles.length > 0) {
        console.log(`[DEBUG] Precommand files failed:`);
        failedFiles.forEach((f) => console.log(`  ❌ ${f.file} (${f.error})`));
      }
      console.log(`[DEBUG] Total Precommand loading time: ${(globalEnd - globalStart).toFixed(2)}ms`);
    } catch (error) {
      console.error("[DEBUG] Error loading precommands:", error);
    }
  }

  /**
   * Recursively reads components from a directory and loads precommands.
   * @param directory - The directory to scan.
   * @param stats - The statistics object to update.
   * @param loadedFiles - Array to collect loaded file paths.
   * @param failedFiles - Array to collect failed file info.
   * @private
   */
  private async readComponentsRecursively(
    directory: string,
    stats: { files: number; loaded: number; code: number },
    loadedFiles: string[] = [],
    failedFiles: { file: string; error: any }[] = [],
  ): Promise<void> {
    const items = await fs.readdir(directory, { withFileTypes: true });

    await Promise.all(
      items.map(async (item) => {
        const fullPath = path.join(directory, item.name);
        if (item.isDirectory()) {
          await this.readComponentsRecursively(fullPath, stats, loadedFiles, failedFiles);
        } else if (item.name.endsWith(".ts") || item.name.endsWith(".js")) {
          stats.files++;
          //await this.loadPrecommandFile(fullPath, stats, loadedFiles, failedFiles);
        }
      }),
    );
  }

  /**
   * Attempts to load a precommand from a file and register it.
   * Also registers the precommand y su categoría en la base de datos.
   * @param filePath - The path to the precommand file.
   * @param stats - The statistics object to update.
   * @param loadedFiles - Array to collect loaded file paths.
   * @param failedFiles - Array to collect failed file info.
   * @private
   */
  /*   private async loadPrecommandFile(
    filePath: string,
    stats: { files: number; loaded: number; code: number },
    loadedFiles: string[] = [],
    failedFiles: { file: string; error: any }[] = [],
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
        loadedFiles.push(filePath);

        // --- REGISTRO EN LA BASE DE DATOS ---
        const categoryName = commandModule.category || "General";
        let category = await main.prisma.commandCategory.findUnique({ where: { name: categoryName } });
        if (!category) {
          category = await main.prisma.commandCategory.create({
            data: {
              name: categoryName,
              description: `category_${randomUUID()}-${categoryName}`,
              enabled: true,
            },
          });
        }
        const guildId = "global";
        let component = await main.prisma.component.findFirst({
          where: { name: commandModule.name, guildId },
        });
        if (!component) {
          await main.prisma.component.create({
            data: {
              name: commandModule.name,
              guildId,
              categoryId: category.id,
            },
          });
        } else {
          await main.prisma.component.update({
            where: { id: component.id },
            data: { categoryId: category.id },
          });
        }
      }
    } catch (error: any) {
      failedFiles.push({ file: filePath, error: error.message || error });
      logWithLabel("error", `Failed to load precommand ${filePath}: ${error}`);
    }
  } */

  /**
   * Deploys slash commands to Discord's API only if there are changes.
   * Also caches the commands in ./commands.json.
   * @throws {Error} If deployment fails.
   */
  public async deployCommands(): Promise<void> {
    const startTime = performance.now();
    const commands = [...this.client.commands.values()].map((cmd) => cmd.structure.toJSON?.() ?? cmd.structure);
    const cachePath = path.resolve("./commands.json");

    // Leer el cache si existe
    let cachedCommands: any[] = [];
    try {
      const cacheContent = await fs.readFile(cachePath, "utf8");
      cachedCommands = JSON.parse(cacheContent);
    } catch {
      // No existe el archivo, se considera vacío
      cachedCommands = [];
    }

    // Comparar comandos actuales con el cache
    const isEqual = (a: any[], b: any[]) => JSON.stringify(a) === JSON.stringify(b);

    if (isEqual(commands, cachedCommands)) {
      logWithLabel("info", "The commands are identical to the cached version. Skipping deployment.");
      return;
    }

    try {
      await this.rest.put(Routes.applicationCommands(this.settings.id), { body: commands });
      const duration = Math.round(performance.now() - startTime);

      // Guardar el nuevo cache
      await fs.writeFile(cachePath, JSON.stringify(commands, null, 2), "utf8");

      logWithLabel(
        "info",
        [
          `Loaded Bot Events:\n`,
          filesLoaded.map((file) => `${chalk.grey(`  ✅  Template-Typescript-Loaded: ${file}`)}`).join("\n"),
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
      throw new DiscordError(`Failed to deploy commands: ${error}`);
    }
  }

  /**
   * Loads and registers interactive components (buttons, modals, menus).
   * @param fileType - The type of component to load ("buttons", "modals", or "menus").
   * @throws {DiscordError} If loading fails.
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
