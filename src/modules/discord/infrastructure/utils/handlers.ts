import chalk from "chalk";
import { ClientEvents } from "discord.js";
import fs from "fs";

import { filesLoaded } from "@/infrastructure/constants/tools.constants";
import { config } from "@/shared/utils/config";
import { logWithLabel } from "@/shared/utils/functions/console";
import { getFiles } from "@/shared/utils/functions/files";

import { MainDiscord } from "../class";
import { Event } from "./builders";

export class DiscordHandler {
  private settings: typeof config.modules.discord;
  private client: MainDiscord;
  constructor(client: MainDiscord) {
    this.settings = config.modules.discord;
    this.client = client;
  }

  /**
   * Loads commands, events, and addons from their respective directories and initializes them.
   *
   * - Loads command modules from the `pathCommands` directory.
   * - Loads event modules from the `pathEvents` directory.
   * - Loads addons from the `addonsPath` directory.
   *
   * Logs the loading status of each module.
   */
  public async _load() {
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

  public async deploy() {
    logWithLabel(
      "info",
      [
        `loading Bot-Events:\n`,
        filesLoaded
          .map((file): string => chalk.grey(`✅ Templete-Typescript-Loaded: ${file}`))
          .join("\n"),
      ].join("\n"),
    );
  }
}
