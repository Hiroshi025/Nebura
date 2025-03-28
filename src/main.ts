import { PrismaClient } from "@prisma/client";

import { API } from "./backend";

process.loadEnvFile();
export class MainGlobal {
  public prisma: PrismaClient;
  public api: API;
  constructor() {
    this.api = new API();
    this.prisma = new PrismaClient({
      log: ["query", "info", "warn", "error"],
    });
  }

  public async Start() {
    await this.api.Start();
  }
}

export const main = new MainGlobal();
main.Start().catch((err) => {
  console.error("Error starting the application:", err);
  process.exit(1);
});
