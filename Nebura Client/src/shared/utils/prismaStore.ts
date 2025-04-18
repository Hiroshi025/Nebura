import { Store } from "whatsapp-web.js";

import { main } from "@/main";

import { logWithLabel } from "./functions/console";

/**
 * A class that implements the `Store` interface from `whatsapp-web.js` to manage session data using Prisma.
 */
export class PrismaStore implements Store {
  /**
   * Creates an instance of PrismaStore.
   */
  constructor() {}

  /**
   * Checks if a session exists in the database.
   * 
   * @param options - An object containing the session identifier.
   * @param options.session - The unique identifier of the session.
   * @returns A promise that resolves to `true` if the session exists, otherwise `false`.
   */
  async sessionExists(options: { session: string }): Promise<boolean> {
    const session = await main.prisma.whatsApp.findUnique({
      where: { session: options.session },
    });
    return !!session;
  }

  /**
   * Saves a session to the database. If the session already exists, it updates it; otherwise, it creates a new one.
   * 
   * @param options - An object containing the session identifier.
   * @param options.session - The unique identifier of the session.
   * @returns A promise that resolves when the operation is complete.
   */
  async save(options: { session: string }): Promise<void> {
    await main.prisma.whatsApp.upsert({
      where: { session: options.session },
      update: {},
      create: { session: options.session },
    });
  }

  /**
   * Extracts session data from the database.
   * 
   * @param options - An object containing the session identifier.
   * @param options.session - The unique identifier of the session.
   * @returns A promise that resolves to the parsed session data if it exists and is valid JSON, otherwise `null`.
   */
  async extract(options: { session: string }): Promise<any> {
    const sessionData = await main.prisma.whatsApp.findUnique({
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

  /**
   * Deletes a session from the database.
   * 
   * @param options - An object containing the session identifier.
   * @param options.session - The unique identifier of the session.
   * @returns A promise that resolves when the session is deleted.
   */
  async delete(options: { session: string }): Promise<void> {
    await main.prisma.whatsApp.delete({
      where: { session: options.session },
    });
  }
}
