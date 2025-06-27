"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="42c47f17-324e-5e63-af33-6e7b6dd94197")}catch(e){}}();

Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const builders_1 = require("../../../../../../../../interfaces/messaging/modules/discord/structure/utils/builders");
const functions_1 = require("../../../../../../../../interfaces/messaging/modules/discord/structure/utils/functions");
/**
 * Slash command for creating custom embeds interactively.
 * Allows administrators to build and send embeds to a selected channel using Discord components.
 *
 * @module creator-embed
 */
exports.default = new builders_1.Command(
/**
 * Command builder for the embed creator.
 */
new discord_js_1.SlashCommandBuilder()
    .setName("embed-creator")
    .setNameLocalizations({
    "es-ES": "creador-embed",
})
    .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator)
    .setDescription("Create custom embeds")
    .setDescriptionLocalizations({
    "es-ES": "Crea embeds personalizados",
})
    .addChannelOption((opt) => opt
    .setName("channel")
    .setNameLocalizations({
    "es-ES": "canal",
})
    .setDescription("Send the embed to a different channel")
    .setDescriptionLocalizations({
    "es-ES": "Enviar el embed a un canal diferente",
})), 
/**
 * Command execution handler.
 * @param _client - The Discord client instance.
 * @param interaction - The command interaction.
 */
async (_client, interaction) => {
    const { options, member } = interaction;
    const channel = options.getChannel("channel") || interaction.channel;
    /**
     * Preview embed shown to the user for live editing.
     */
    const previewEmbed = new discord_js_1.EmbedBuilder().setDescription("Preview Embeds. Start editing to see changes~");
    /**
     * Embed containing the settings and instructions.
     */
    const setupEmbed = new discord_js_1.EmbedBuilder()
        .setColor("#7700ff")
        .setTitle("Settings")
        .setDescription("Use Select Menu below to edit preview");
    /**
     * Collection of interactive buttons used in the embed creator.
     */
    const buttons = {
        /** Button to send the embed. */
        send: (0, functions_1.createButton)("@Send", "Send", discord_js_1.ButtonStyle.Success),
        /** Button to cancel the embed creation. */
        cancel: (0, functions_1.createButton)("@Cancel", "Cancel", discord_js_1.ButtonStyle.Danger),
        /** Button to return from field editing. */
        return: (0, functions_1.createButton)("@fieldReturn", "Return", discord_js_1.ButtonStyle.Secondary),
        /** Button to add a field to the embed. */
        addField: (0, functions_1.createButton)("@remField", "Add", discord_js_1.ButtonStyle.Success),
        /** Button to remove a field from the embed. */
        removeField: (0, functions_1.createButton)("@addField", "Remove", discord_js_1.ButtonStyle.Danger),
    };
    /**
     * Select menu for editing embed properties.
     */
    const menu = new discord_js_1.StringSelectMenuBuilder()
        .setCustomId("@Menu")
        .setPlaceholder("Edit Preview")
        .setMaxValues(1)
        .setMinValues(1)
        .setOptions((0, functions_1.getMenuOptions)());
    /**
     * Action row containing the select menu.
     */
    const setupComponent = new discord_js_1.ActionRowBuilder().addComponents(menu);
    /**
     * Action row containing the main action buttons.
     */
    const buttonComponent = new discord_js_1.ActionRowBuilder().addComponents(buttons.cancel, buttons.send);
    /**
     * Action row for field editing buttons.
     */
    const fieldSetupComponent = new discord_js_1.ActionRowBuilder().addComponents(buttons.removeField, buttons.addField);
    /**
     * Action row for returning from field editing.
     */
    const fieldMenuComponent = new discord_js_1.ActionRowBuilder().addComponents(buttons.return);
    /**
     * Sends the initial reply with the preview and setup embeds and components.
     */
    const replies = await interaction.reply({
        embeds: [previewEmbed, setupEmbed],
        components: [setupComponent, buttonComponent],
    });
    /**
     * Filter for component collectors to only allow the command invoker.
     * @param i - The interaction to filter.
     * @returns True if the user is the command invoker.
     */
    const filter = (i) => !!member && i.user.id === member.user.id;
    /**
     * Collector for handling component interactions.
     */
    const collector = replies.createMessageComponentCollector({
        filter,
        idle: 1000 * 60 * 10,
    });
    /**
     * Flag to force stop the collector.
     */
    let forceStop = false;
    collector.on("collect", async (i) => {
        if (forceStop)
            return;
        /** The current preview embed. */
        const embeds = i.message.embeds[0];
        /** The current setup embed. */
        const setup = i.message.embeds[1];
        switch (i.customId) {
            case "@Cancel":
                // Cancel the embed creation process.
                forceStop = true;
                return collector.stop();
            case "@Send":
                // Send the created embed to the selected channel.
                if (embeds.data.description === "Preview Embeds. Start editing to see changes~") {
                    return i.reply({
                        content: "Cannot send empty embed or without description!",
                        flags: "Ephemeral",
                    });
                }
                if (!channel) {
                    return i.reply({
                        content: "Channel not found. Cannot send the embed.",
                        flags: "Ephemeral",
                    });
                }
                if (channel.type !== discord_js_1.ChannelType.GuildText) {
                    return i.reply({
                        content: "Please select a text channel to send the embed.",
                        flags: "Ephemeral",
                    });
                }
                await channel.send({ embeds: [embeds] });
                await i.reply({ content: "Embed Sent!", flags: "Ephemeral" });
                forceStop = true;
                return collector.stop();
            case "@fieldReturn":
                // Return from field editing to main menu.
                (0, functions_1.enableComponents)(setupComponent, buttonComponent);
                await i.update({
                    embeds: [embeds, setupEmbed],
                    components: [setupComponent, buttonComponent],
                });
                break;
            case "@remField":
                // Remove the last field from the embed.
                if (!embeds.data.fields || embeds.data.fields.length === 0) {
                    return i.reply({
                        content: "No Fields Detected",
                        flags: "Ephemeral",
                    });
                }
                embeds.data.fields.pop();
                await i.update({
                    embeds: [embeds, setup],
                    components: [fieldSetupComponent, fieldMenuComponent],
                });
                break;
            case "@addField":
                // Add a new field to the embed by collecting user input.
                setup.data.description = "Input Fields.\nSend field Name > Value > Inline: true | false";
                (0, functions_1.disableComponents)(fieldSetupComponent, fieldMenuComponent);
                await i.update({
                    embeds: [embeds, setup],
                    components: [fieldSetupComponent, fieldMenuComponent],
                });
                let msgArr;
                try {
                    msgArr = (await i.channel.awaitMessages({
                        filter: (m) => m.author.id === i.user.id,
                        max: 3,
                        time: 60000, // <-- Timeout for user input
                        errors: ["time"],
                    })).first(3);
                }
                catch {
                    await i.followUp({ content: "No se recibieron los campos a tiempo." });
                    (0, functions_1.enableComponents)(fieldSetupComponent, fieldMenuComponent);
                    return;
                }
                if (!msgArr || msgArr.length < 3) {
                    await i.followUp({ content: "Debes enviar los 3 campos." });
                    (0, functions_1.enableComponents)(fieldSetupComponent, fieldMenuComponent);
                    return;
                }
                const fields = {
                    name: msgArr[0].content,
                    value: msgArr[1].content,
                    inline: msgArr[2].content === "true",
                };
                if (!embeds.data.fields) {
                    embeds.data.fields = [fields];
                }
                else {
                    embeds.data.fields.push(fields);
                }
                (0, functions_1.enableComponents)(fieldSetupComponent, fieldMenuComponent);
                setup.data.description = "Use the button below to add or remove fields";
                await replies.edit({
                    embeds: [embeds, setup],
                    components: [fieldSetupComponent, fieldMenuComponent],
                });
                msgArr.forEach((m) => m.deletable && m.delete());
                break;
            case "@Menu":
                // Handle select menu options for editing embed properties.
                setupComponent.components[0].setDisabled(true);
                buttonComponent.components[1].setDisabled(true);
                const selectedOption = i.values[0];
                if (selectedOption === "timestamp") {
                    embeds.data.timestamp = embeds.data.timestamp
                        ? undefined
                        : new Date(Date.now()).toISOString();
                    i.update({
                        embeds: [embeds, setupEmbed],
                    });
                }
                else if (selectedOption === "fields") {
                    setup.data.description = "Use the button below to add or remove fields";
                    await i.update({
                        embeds: [embeds, setup],
                        components: [fieldSetupComponent, fieldMenuComponent],
                    });
                }
                else {
                    setup.data.description =
                        "Modify by sending message to the channel\n-# For image you can upload image directly or use direct url";
                    await i.update({
                        embeds: [embeds, setup],
                        components: [setupComponent, buttonComponent],
                    });
                    const msg = (await i.channel.awaitMessages({
                        filter: (m) => m.author.id === i.user.id,
                        max: 1,
                    })).first();
                    if (!msg)
                        return;
                    const attachment = msg.attachments.first();
                    (0, functions_1.updateEmbedField)(embeds, selectedOption, msg.content, attachment);
                    setupComponent.components[0].setDisabled(false);
                    buttonComponent.components[1].setDisabled(false);
                    await replies.edit({
                        embeds: [embeds, setupEmbed],
                        components: [setupComponent, buttonComponent],
                    });
                    setTimeout(() => msg.delete(), 2500);
                }
                break;
        }
    });
    collector.on("end", (_c) => {
        // Handle collector end (timeout or manual stop).
        if (!forceStop && replies) {
            interaction.followUp({
                content: "Embed Editor closed due to inactivity.",
                flags: "Ephemeral",
            });
        }
        replies.delete();
    });
});
//# sourceMappingURL=creator-embed.js.map
//# debugId=42c47f17-324e-5e63-af33-6e7b6dd94197
