"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="3f85a67e-478a-5e15-b685-aad81390d6a6")}catch(e){}}();

Object.defineProperty(exports, "__esModule", { value: true });
exports.DBPrisma = exports.clientID = void 0;
const bson_1 = require("bson"); // BSON library for working with ObjectId: https://www.npmjs.com/package/bson
const main_1 = require("../../main");
const config_1 = require("../utils/config");
/**
 * The client ID from environment variables.
 * @type {string | undefined}
 */
const { CLIENT_ID, API_VERSION, TOKEN_DISCORD } = process.env;
/**
 * The concatenated client ID and API version, used as a unique identifier for the client.
 * @type {string}
 */
exports.clientID = `${CLIENT_ID}${API_VERSION}`;
const validId = new bson_1.ObjectId().toHexString();
const data = config_1.config.modules.discord;
/**
 * Service for managing and accessing client, Discord, WhatsApp, and modules data using Prisma.
 *
 * Provides methods to create and retrieve records for Discord, WhatsApp, modules, and client entities.
 *
 * @see [Prisma Documentation](https://www.prisma.io/docs/)
 * @see [BSON ObjectId](https://www.mongodb.com/docs/manual/reference/method/ObjectId/)
 */
class DBPrisma {
    constructor() { }
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
    async createClient(discordClient, session) {
        const discord = await main_1.main.prisma.discord.upsert({
            where: { clientId: discordClient.user?.id },
            update: {
                token: TOKEN_DISCORD,
                clientId: data.id,
                clientSecret: data.secret,
            },
            create: {
                token: TOKEN_DISCORD,
                clientId: data.id,
                clientSecret: data.secret,
                owners: data.owners,
            },
        });
        const whatsapp = await main_1.main.prisma.whatsApp.upsert({
            where: { session },
            update: {
                session,
            },
            create: {
                session,
                updatedAt: new Date(),
            },
        });
        const modules = await main_1.main.prisma.modules.upsert({
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
        const client = await main_1.main.prisma.client.upsert({
            where: { clientId: exports.clientID },
            update: {
                name: config_1.config.project.name,
                version: API_VERSION,
            },
            create: {
                id: validId,
                clientId: exports.clientID,
                name: config_1.config.project.name,
                version: API_VERSION,
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
    async findDiscord(clientId) {
        const discord = await main_1.main.prisma.discord.findFirst({
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
    async findWhatsApp(session) {
        const whatsapp = await main_1.main.prisma.whatsApp.findFirst({
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
    async findModules(whatsappId, discordId) {
        const modules = await main_1.main.prisma.modules.findFirst({
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
    async findClient(clientId) {
        const client = await main_1.main.prisma.client.findFirst({
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
exports.DBPrisma = DBPrisma;
//# sourceMappingURL=DB.js.map
//# debugId=3f85a67e-478a-5e15-b685-aad81390d6a6
