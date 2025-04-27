"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const main_1 = require("../../../../../main");
const builders_1 = require("../../../../../modules/discord/structure/utils/builders");
const errors_extender_1 = require("../../../../../structure/extenders/errors.extender");
exports.default = new builders_1.Event("voiceStateUpdate", async (oldState, newState) => {
    const { member, guild } = newState;
    const oldChannel = oldState.channel;
    const newChannel = newState.channel;
    const data = await main_1.main.prisma.myGuild.findUnique({ where: { id: guild.id } });
    if (!data)
        return;
    const joinToCreate = data.rooms;
    const user = member?.user;
    if (!joinToCreate || joinToCreate === "")
        return;
    if (!user)
        return;
    if (oldChannel !== newChannel && newChannel && newChannel.id === joinToCreate) {
        const voiceChannel = await guild.channels
            .create({
            name: `${user.username}-${user.discriminator}`,
            type: discord_js_1.ChannelType.GuildVoice,
            parent: newChannel.parent,
        })
            .catch(() => {
            throw new errors_extender_1.DiscordError("Failed to create the voice channel");
        });
        const textChannel = await guild.channels
            .create({
            name: `${user.username}-${user.discriminator}-text`,
            type: discord_js_1.ChannelType.GuildText,
            parent: newChannel.parent,
            permissionOverwrites: [
                {
                    id: guild.roles.everyone.id,
                    deny: ["ViewChannel"],
                },
                {
                    id: member.id,
                    allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"],
                },
            ],
        })
            .catch(() => {
            throw new errors_extender_1.DiscordError("Failed to create the text channel");
        });
        main_1.client.voiceGenerator.set(member?.id, {
            voiceChannelId: voiceChannel.id,
            textChannelId: textChannel.id,
        });
        return setTimeout(() => member?.voice.setChannel(voiceChannel).catch(() => {
            throw new errors_extender_1.DiscordError("Failed to move the member to the voice channel");
        }), 500);
    }
    const ownedChannel = main_1.client.voiceGenerator.get(member?.id);
    if (ownedChannel &&
        oldChannel?.id === ownedChannel.voiceChannelId &&
        (!newChannel || newChannel.id !== ownedChannel.voiceChannelId)) {
        main_1.client.voiceGenerator.delete(member?.id);
        oldChannel?.delete().catch(() => {
            throw new errors_extender_1.DiscordError("Failed to delete the voice channel");
        });
        const textChannel = guild.channels.cache.get(ownedChannel.textChannelId);
        textChannel?.delete().catch(() => {
            throw new errors_extender_1.DiscordError("Failed to delete the text channel");
        });
    }
    return;
});
