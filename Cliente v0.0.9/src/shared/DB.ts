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

export class DBPrisma {
  constructor() {}
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
  public async findDiscord(clientId: string) {
    const discord = await main.prisma.discord.findFirst({
      where: { clientId },
    });

    return discord;
  }
  public async findWhatsApp(session: string) {
    const whatsapp = await main.prisma.whatsApp.findFirst({
      where: { session },
    });

    return whatsapp;
  }
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
