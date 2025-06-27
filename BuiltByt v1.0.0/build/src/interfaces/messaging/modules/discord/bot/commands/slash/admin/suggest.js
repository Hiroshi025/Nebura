"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="3eabea1e-6131-5d63-a3f2-2147c9c294e5")}catch(e){}}();

Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const builders_1 = require("../../../../../../../../interfaces/messaging/modules/discord/structure/utils/builders");
const main_1 = require("../../../../../../../../main");
exports.default = new builders_1.Command(new discord_js_1.SlashCommandBuilder()
    .setName("suggest-config")
    .setNameLocalizations({
    "es-ES": "config-sugerencias",
})
    .setDescription("Configure the suggestion channel.")
    .setDescriptionLocalizations({
    "es-ES": "Configura el canal de sugerencias.",
})
    .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator), async (_client, interaction) => {
    if (!interaction.guild)
        return;
    const guildId = interaction.guild.id;
    // Embed inicial para configurar el canal de sugerencias
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle("💡 Suggestion Channel Configuration")
        .setDescription("Select a channel to use for suggestions or disable the suggestion feature.")
        .setColor("Blue");
    const channelMenu = new discord_js_1.ChannelSelectMenuBuilder()
        .setCustomId("select-suggestion-channel")
        .setPlaceholder("Select a channel")
        .setChannelTypes(discord_js_1.ChannelType.GuildText);
    const disableButton = new discord_js_1.ButtonBuilder()
        .setCustomId("disable-suggestions")
        .setLabel("Disable Suggestions")
        .setStyle(discord_js_1.ButtonStyle.Danger);
    const row1 = new discord_js_1.ActionRowBuilder().addComponents(channelMenu);
    const row2 = new discord_js_1.ActionRowBuilder().addComponents(disableButton);
    await interaction.reply({
        embeds: [embed],
        components: [row1, row2],
        flags: "Ephemeral",
    });
    const collector = interaction.channel?.createMessageComponentCollector({
        time: 60000,
    });
    collector?.on("collect", async (componentInteraction) => {
        if (componentInteraction.user.id !== interaction.user.id) {
            return componentInteraction.reply({
                content: "You cannot interact with this configuration.",
                flags: "Ephemeral",
            });
        }
        if (componentInteraction.isChannelSelectMenu() &&
            componentInteraction.customId === "select-suggestion-channel") {
            const selectedChannelId = componentInteraction.values[0];
            await main_1.main.prisma.myGuild.upsert({
                where: { guildId },
                update: { suggestChannel: selectedChannelId },
                create: {
                    guildId,
                    discordId: _client.user?.id || "",
                    suggestChannel: selectedChannelId,
                },
            });
            await componentInteraction.update({
                content: `✅ Suggestion channel has been set to <#${selectedChannelId}>.`,
                embeds: [],
                components: [],
            });
        }
        if (componentInteraction.isButton() &&
            componentInteraction.customId === "disable-suggestions") {
            await main_1.main.prisma.myGuild.update({
                where: { guildId },
                data: { suggestChannel: null },
            });
            await componentInteraction.update({
                content: "❌ Suggestion feature has been disabled.",
                embeds: [],
                components: [],
            });
        }
        return;
    });
    collector?.on("end", async () => {
        await interaction.editReply({
            components: [],
        });
    });
});
//# sourceMappingURL=suggest.js.map
//# debugId=3eabea1e-6131-5d63-a3f2-2147c9c294e5
