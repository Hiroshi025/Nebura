import { PrismaClient } from "@prisma/client";

import { ProyectError } from "./infrastructure/extenders/errors.extender";
import { MainDiscord } from "./modules/discord/infrastructure/class";
import { API } from "./server";

process.loadEnvFile();
export class MainGlobal {
  public prisma: PrismaClient;
  public discord: MainDiscord;
  public api: API;
  constructor() {
    this.discord = new MainDiscord();
    this.api = new API();
    this.prisma = new PrismaClient({
      log: ["query", "info", "warn", "error"],
    });
  }

  public async start() {
    await this.discord.start();
    await this.api.start();
  }
}

export const main = new MainGlobal();
main.start().catch((err) => {
  throw new ProyectError(`Error starting the application: ${err}`);
});
