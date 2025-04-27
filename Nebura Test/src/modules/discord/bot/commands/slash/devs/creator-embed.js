"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const builders_1 = require("../../../../../../modules/discord/structure/utils/builders");
const functions_1 = require("../../../../../../modules/discord/structure/utils/functions");
exports.default = new builders_1.Command(new discord_js_1.SlashCommandBuilder()
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
})), async (_client, interaction) => {
    const { options, member } = interaction;
    const channel = options.getChannel("channel") || interaction.channel;
    const previewEmbed = new discord_js_1.EmbedBuilder().setDescription("Preview Embeds. Start editing to see changes~");
    const setupEmbed = new discord_js_1.EmbedBuilder()
        .setColor("#7700ff")
        .setTitle("Settings")
        .setDescription("Use Select Menu below to edit preview");
    const buttons = {
        send: (0, functions_1.createButton)("@Send", "Send", discord_js_1.ButtonStyle.Success),
        cancel: (0, functions_1.createButton)("@Cancel", "Cancel", discord_js_1.ButtonStyle.Danger),
        return: (0, functions_1.createButton)("@fieldReturn", "Return", discord_js_1.ButtonStyle.Secondary),
        addField: (0, functions_1.createButton)("@addField", "Add", discord_js_1.ButtonStyle.Success),
        removeField: (0, functions_1.createButton)("@remField", "Remove", discord_js_1.ButtonStyle.Danger),
    };
    const menu = new discord_js_1.StringSelectMenuBuilder()
        .setCustomId("@Menu")
        .setPlaceholder("Edit Preview")
        .setMaxValues(1)
        .setMinValues(1)
        .setOptions((0, functions_1.getMenuOptions)());
    const setupComponent = new discord_js_1.ActionRowBuilder().addComponents(menu);
    const buttonComponent = new discord_js_1.ActionRowBuilder().addComponents(buttons.cancel, buttons.send);
    const fieldSetupComponent = new discord_js_1.ActionRowBuilder().addComponents(buttons.removeField, buttons.addField);
    const fieldMenuComponent = new discord_js_1.ActionRowBuilder().addComponents(buttons.return);
    const replies = await interaction.reply({
        embeds: [previewEmbed, setupEmbed],
        components: [setupComponent, buttonComponent],
    });
    const filter = (i) => !!member && i.user.id === member.user.id;
    const collector = replies.createMessageComponentCollector({
        filter,
        idle: 1000 * 60 * 10,
    });
    let forceStop = false;
    collector.on("collect", async (i) => {
        if (forceStop)
            return;
        const embeds = i.message.embeds[0];
        const setup = i.message.embeds[1];
        switch (i.customId) {
            case "@Cancel":
                forceStop = true;
                return collector.stop();
            case "@Send":
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
                (0, functions_1.enableComponents)(setupComponent, buttonComponent);
                await i.update({
                    embeds: [embeds, setupEmbed],
                    components: [setupComponent, buttonComponent],
                });
                break;
            case "@remField":
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
                setup.data.description = "Input Fields.\nSend field Name > Value > Inline: true | false";
                (0, functions_1.disableComponents)(fieldSetupComponent, fieldMenuComponent);
                await i.update({
                    embeds: [embeds, setup],
                    components: [fieldSetupComponent, fieldMenuComponent],
                });
                const msgArr = (await i.channel.awaitMessages({
                    filter: (m) => m.author.id === i.user.id,
                    max: 3,
                })).first(3);
                if (msgArr.length < 3)
                    return;
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
                msgArr.forEach((m) => m.delete());
                break;
            case "@Menu":
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
        if (!forceStop && replies) {
            interaction.followUp({
                content: "Embed Editor closed due to inactivity.",
                flags: "Ephemeral",
            });
        }
        replies.delete();
    });
});
