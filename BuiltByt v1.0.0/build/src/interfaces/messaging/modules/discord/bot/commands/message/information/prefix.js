"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="36eae654-6f1a-5f62-afe9-86535e58787d")}catch(e){}}();

const discord_js_1 = require("discord.js");
const commandPrefix = {
    name: "prefix",
    description: "Shows the current prefix configured for this server",
    examples: ["prefix", "/prefix"],
    nsfw: false,
    owner: false,
    aliases: ["getprefix", "currentprefix"],
    botpermissions: ["SendMessages", "EmbedLinks"],
    permissions: ["SendMessages"],
    async execute(_client, message, _args, prefix) {
        if (!message.guild || !message.channel || message.channel.type !== discord_js_1.ChannelType.GuildText)
            return;
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle("Server Prefix")
            .setColor(0x5865f2)
            .setDescription([
            `The current prefix for this server is: **\`${prefix}\`**`,
            "",
            `Use \`${prefix}help\` to see all available commands.`,
            `You can mention the bot as a prefix as well.`,
        ].join("\n"))
            .setFooter({
            text: `Requested by ${message.author.tag}`,
            iconURL: message.author.displayAvatarURL(),
        })
            .setTimestamp();
        const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId("copy_prefix")
            .setLabel("Copy Prefix")
            .setStyle(discord_js_1.ButtonStyle.Primary)
            .setEmoji("📋"));
        const sent = await message.reply({ embeds: [embed], components: [row] });
        const collector = sent.createMessageComponentCollector({
            filter: (i) => i.user.id === message.author.id && i.customId === "copy_prefix",
            componentType: 2, // Button
            time: 30000,
        });
        collector.on("collect", async (interaction) => {
            await interaction.reply({
                content: `Prefix: \`${prefix}\``,
                flags: "Ephemeral"
            });
        });
        collector.on("end", () => {
            sent.edit({ components: [] }).catch(() => { });
        });
    },
};
module.exports = commandPrefix;
//# sourceMappingURL=prefix.js.map
//# debugId=36eae654-6f1a-5f62-afe9-86535e58787d
