import { Store } from "whatsapp-web.js";

import { main } from "@/main";

import { logWithLabel } from "./functions/console";

export class PrismaStore implements Store {
  constructor() {}

  async sessionExists(options: { session: string }): Promise<boolean> {
    const session = await main.prisma.whatsAppSession.findUnique({
      where: { session: options.session },
    });
    return !!session;
  }

  async save(options: { session: string }): Promise<void> {
    await main.prisma.whatsAppSession.upsert({
      where: { session: options.session },
      update: {},
      create: { session: options.session },
    });
  }

  async extract(options: { session: string }): Promise<any> {
    const sessionData = await main.prisma.whatsAppSession.findUnique({
      where: { session: options.session },
    });
    if (!sessionData) return null;

    try {
      return JSON.parse(sessionData.session);
    } catch (error) {
      logWithLabel("error", `${error}`);
      return null;
    }
  }

  async delete(options: { session: string }): Promise<void> {
    await main.prisma.whatsAppSession.delete({
      where: { session: options.session },
    });
  }
}
