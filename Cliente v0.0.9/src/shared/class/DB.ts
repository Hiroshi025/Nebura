import { ObjectId } from "bson"; // BSON library for working with ObjectId: https://www.npmjs.com/package/bson

import { main } from "@/main";
import { MyClient } from "@modules/discord/client";
import { config } from "@utils/config";

/**
 * The client ID from environment variables.
 * @type {string | undefined}
 */
const { CLIENT_ID, API_VERSION, TOKEN_DISCORD } = process.env;

/**
 * The concatenated client ID and API version, used as a unique identifier for the client.
 * @type {string}
 */
export const clientID: string = `${CLIENT_ID}${API_VERSION}`;
const validId = new ObjectId().toHexString();
const data = config.modules.discord;

/**
 * Service for managing and accessing client, Discord, WhatsApp, and modules data using Prisma.
 *
 * Provides methods to create and retrieve records for Discord, WhatsApp, modules, and client entities.
 *
 * @see [Prisma Documentation](https://www.prisma.io/docs/)
 * @see [BSON ObjectId](https://www.mongodb.com/docs/manual/reference/method/ObjectId/)
 */
export class DBPrisma {
  constructor() {}

  /**
   * Creates or updates the Discord, WhatsApp, modules, and client records in the database.
   *
   * Uses Prisma's upsert operation to ensure records exist and are updated as needed.
   *
   * @param discordClient - The Discord client instance.
   * @param session - The WhatsApp session identifier.
   * @returns A promise that resolves to the upserted client record.
   *
   * @see [Prisma Upsert](https://www.prisma.io/docs/orm/prisma-client/queries/upsert)
   *
   * @example
   * ```typescript
   * const client = await dbPrisma.createClient(discordClient, "session123");
   * ```
   */
  public async createClient(discordClient: MyClient, session: string) {
    const discord = await main.prisma.discord.upsert({
      where: { clientId: discordClient.user?.id as string },
      update: {
        token: TOKEN_DISCORD as string,
        clientId: data.clientId,
        clientSecret: data.clientSecret,
      },
      create: {
        token: TOKEN_DISCORD as string,
        clientId: data.clientId,
        clientSecret: data.clientSecret,
        owners: data.owners,
      },
    });

    const whatsapp = await main.prisma.whatsApp.upsert({
      where: { session },
      update: {
        session,
      },
      create: {
        session,
        updatedAt: new Date(),
      },
    });

    const modules = await main.prisma.modules.upsert({
      where: {
        whatsappId: whatsapp.id,
        discordId: discord.id,
      },
      update: {
        whatsappId: whatsapp.id,
        discordId: discord.id,
      },
      create: {
        whatsappId: whatsapp.id,
        discordId: discord.id,
      },
    });

    const client = await main.prisma.client.upsert({
      where: { clientId: clientID },
      update: {
        name: config.project.name,
        version: API_VERSION,
      },
      create: {
        id: validId,
        clientId: clientID,
        name: config.project.name,
        version: API_VERSION as string,
        modulesId: modules.id,
      },
    });

    return client;
  }

  /**
   * Finds a Discord record by its client ID.
   *
   * @param clientId - The Discord client ID.
   * @returns A promise that resolves to the Discord record or null if not found.
   *
   * @example
   * ```typescript
   * const discord = await dbPrisma.findDiscord("discordClientId");
   * ```
   */
  public async findDiscord(clientId: string) {
    const discord = await main.prisma.discord.findFirst({
      where: { clientId },
    });

    return discord;
  }

  /**
   * Finds a WhatsApp record by its session identifier.
   *
   * @param session - The WhatsApp session string.
   * @returns A promise that resolves to the WhatsApp record or null if not found.
   *
   * @example
   * ```typescript
   * const whatsapp = await dbPrisma.findWhatsApp("session123");
   * ```
   */
  public async findWhatsApp(session: string) {
    const whatsapp = await main.prisma.whatsApp.findFirst({
      where: { session },
    });

    return whatsapp;
  }

  /**
   * Finds a modules record by WhatsApp and Discord IDs.
   *
   * Includes related WhatsApp and Discord data.
   *
   * @param whatsappId - The WhatsApp record ID.
   * @param discordId - The Discord record ID.
   * @returns A promise that resolves to the modules record or null if not found.
   *
   * @example
   * ```typescript
   * const modules = await dbPrisma.findModules("whatsappId", "discordId");
   * ```
   */
  public async findModules(whatsappId: string, discordId: string) {
    const modules = await main.prisma.modules.findFirst({
      where: {
        whatsappId,
        discordId,
      },
      include: {
        whatsapp: true,
        discord: true,
      },
    });

    return modules;
  }

  /**
   * Finds a client record by its client ID.
   *
   * Includes related modules, WhatsApp, and Discord data.
   *
   * @param clientId - The client ID.
   * @returns A promise that resolves to the client record or null if not found.
   *
   * @example
   * ```typescript
   * const client = await dbPrisma.findClient("clientId");
   * ```
   */
  public async findClient(clientId: string) {
    const client = await main.prisma.client.findFirst({
      where: { clientId },
      include: {
        modules: {
          include: {
            whatsapp: true,
            discord: true,
          },
        },
      },
    });

    return client;
  }
}
