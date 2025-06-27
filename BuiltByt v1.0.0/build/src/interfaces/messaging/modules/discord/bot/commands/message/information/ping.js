"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="ce4df40f-d2b8-5f52-b23a-49bdd2d396ee")}catch(e){}}();

const discord_js_1 = require("discord.js");
const commandPing = {
    name: "ping",
    description: "Shows the bot and Discord API latency",
    examples: ["ping", "pong"],
    nsfw: false,
    owner: false,
    aliases: ["pong", "latency"],
    botpermissions: ["SendMessages", "EmbedLinks"],
    permissions: ["SendMessages"],
    async execute(client, message) {
        if (!message.guild || !message.channel || message.channel.type !== discord_js_1.ChannelType.GuildText)
            return;
        const sent = await message.reply({
            embeds: [
                new discord_js_1.EmbedBuilder()
                    .setTitle("🏓 Pong!")
                    .setDescription("Calculating latency...")
                    .setColor(0x5865f2),
            ],
        });
        const latency = sent.createdTimestamp - message.createdTimestamp;
        const apiLatency = Math.round(client.ws.ping);
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle("🏓 Pong!")
            .setColor(0x5865f2)
            .addFields({ name: "Bot Latency", value: `\`${latency}ms\``, inline: true }, { name: "API Latency", value: `\`${apiLatency}ms\``, inline: true })
            .setFooter({ text: "Click 'Refresh' to update the latency." });
        const buttons = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId("refresh_ping")
            .setLabel("Refresh")
            .setStyle(discord_js_1.ButtonStyle.Primary)
            .setEmoji("🔄"));
        await sent.edit({ embeds: [embed], components: [buttons] });
        const collector = sent.createMessageComponentCollector({
            componentType: discord_js_1.ComponentType.Button,
            time: 60000,
        });
        collector.on("collect", async (interaction) => {
            if (interaction.customId === "refresh_ping") {
                await interaction.deferUpdate();
                const newLatency = Date.now() - message.createdTimestamp;
                const newApiLatency = Math.round(client.ws.ping);
                const refreshedEmbed = new discord_js_1.EmbedBuilder()
                    .setTitle("🏓 Pong!")
                    .setColor(0x5865f2)
                    .addFields({ name: "Bot Latency", value: `\`${newLatency}ms\``, inline: true }, { name: "API Latency", value: `\`${newApiLatency}ms\``, inline: true })
                    .setFooter({ text: "Click 'Refresh' to update the latency." });
                await interaction.editReply({ embeds: [refreshedEmbed], components: [buttons] });
            }
        });
        collector.on("end", () => {
            sent.edit({ components: [] }).catch(() => { });
        });
    },
};
module.exports = commandPing;
//# sourceMappingURL=ping.js.map
//# debugId=ce4df40f-d2b8-5f52-b23a-49bdd2d396ee
