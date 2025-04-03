import chalk from "chalk";
import { ClientEvents, REST, Routes } from "discord.js";
import fs from "fs";

import { filesLoaded } from "@/infrastructure/constants/tools.constants";
import { config } from "@/shared/utils/config";
import { logWithLabel } from "@/shared/utils/functions/console";
import { getFiles } from "@/shared/utils/functions/files";

import { MainDiscord } from "../client";
import { Command, Event } from "./builders";

export class DiscordHandler {
  private settings: typeof config.modules.discord;
  private client: MainDiscord;

  /**
   * Initializes the DiscordHandler with the provided client.
   * @param client The MainDiscord client instance.
   */
  constructor(client: MainDiscord) {
    this.settings = config.modules.discord;
    this.client = client;
  }

  /**
   * Loads commands, events, and addons from their respective directories and initializes them.
   *
   * - Loads command modules from the `commandpath` directory.
   * - Loads event modules from the `eventpath` directory.
   * - Logs the loading status of each module.
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
  }

  /**
   * Deploys the bot's slash commands to the Discord API and logs the process.
   *
   * - Handles API rate limits with detailed logging.
   * - Deploys commands using the Discord REST API.
   * - Logs the time taken and the number of commands deployed.
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
}
