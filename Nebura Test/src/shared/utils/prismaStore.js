"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaStore = void 0;
const main_1 = require("../../main");
const console_1 = require("./functions/console");
/**
 * A class that implements the `Store` interface from `whatsapp-web.js` to manage session data using Prisma.
 */
class PrismaStore {
    /**
     * Creates an instance of PrismaStore.
     */
    constructor() { }
    /**
     * Checks if a session exists in the database.
     *
     * @param options - An object containing the session identifier.
     * @param options.session - The unique identifier of the session.
     * @returns A promise that resolves to `true` if the session exists, otherwise `false`.
     */
    async sessionExists(options) {
        const session = await main_1.main.prisma.whatsApp.findUnique({
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
    async save(options) {
        await main_1.main.prisma.whatsApp.upsert({
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
    async extract(options) {
        const sessionData = await main_1.main.prisma.whatsApp.findUnique({
            where: { session: options.session },
        });
        if (!sessionData)
            return null;
        try {
            return JSON.parse(sessionData.session);
        }
        catch (error) {
            (0, console_1.logWithLabel)("error", `${error}`);
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
    async delete(options) {
        await main_1.main.prisma.whatsApp.delete({
            where: { session: options.session },
        });
    }
}
exports.PrismaStore = PrismaStore;
