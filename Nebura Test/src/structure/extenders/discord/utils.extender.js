"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Utils = void 0;
const main_1 = require("../../../main");
class Utils {
    constructor() { }
    async get(guildId) {
        if (!guildId)
            return null;
        if (guildId === "0")
            return null;
        const guild = main_1.client.guilds.cache.get(guildId);
        if (!guild)
            return null;
        return guild;
    }
    async cache() {
        const guilds = main_1.client.guilds.cache.map((guild) => {
            return {
                id: guild.id,
                name: guild.name,
                iconURL: guild.iconURL(),
                memberCount: guild.memberCount,
            };
        });
        return guilds;
    }
    async getById(guildId) {
        if (!guildId)
            return null;
        if (guildId === "0")
            return null;
        const guild = main_1.client.guilds.cache.get(guildId);
        if (!guild)
            return null;
        return guild;
    }
    async isReplyingToBot(message) {
        if (!message.reference)
            return false;
        try {
            const referencedMessage = message.reference.messageId
                ? await message.channel.messages.fetch(message.reference.messageId)
                : null;
            return referencedMessage?.author?.id === main_1.client.user?.id;
        }
        catch {
            return false;
        }
    }
}
exports.Utils = Utils;
