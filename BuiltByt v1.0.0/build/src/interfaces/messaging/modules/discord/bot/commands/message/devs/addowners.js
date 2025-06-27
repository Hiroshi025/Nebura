"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="9b54628c-b731-53a1-b556-7653dcdc483a")}catch(e){}}();

const discord_js_1 = require("discord.js");
const main_1 = require("../../../../../../../../main");
const embeds_extend_1 = require("../../../../../../../../shared/adapters/extends/embeds.extend");
const OwnerAddCommand = {
    name: "addowners",
    description: "Add owners to the bot",
    examples: ["addowners"],
    nsfw: false,
    owner: true,
    aliases: ["ao", "addowner", "add-owners"],
    botpermissions: ["SendMessages"],
    permissions: ["SendMessages"],
    async execute(client, message) {
        if (!message.guild || !message.channel || message.channel.type !== discord_js_1.ChannelType.GuildText || !client.user)
            return;
        const data = await main_1.main.DB.findDiscord(client.user.id);
        if (!data)
            return message.reply({
                embeds: [
                    new embeds_extend_1.EmbedCorrect()
                        .setTitle("Error Add Owners")
                        .setDescription([
                        `${client.getEmoji(message.guild.id, "error")} The bot is not set up in this server.`,
                        `Please restart proyect to set up the bot.`,
                    ].join("\n")),
                ],
            });
        const owners = data.owners;
        const msg = await message.reply({
            embeds: [
                new embeds_extend_1.EmbedCorrect()
                    .setTitle("Add Owners")
                    .setDescription([
                    `${client.getEmoji(message.guild.id, "success")} Click the select user menu to add owners.`,
                    `You can add up to 10 owners.`,
                ].join("\n")),
            ],
            components: [
                new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.UserSelectMenuBuilder()
                    .setCustomId("addowners")
                    .setPlaceholder("Select a user to add as owner")
                    .setMinValues(1)
                    .setMaxValues(10)),
                new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId("cancel").setLabel("Cancel").setStyle(discord_js_1.ButtonStyle.Danger)),
            ],
        });
        const filter = (i) => i.user.id === message.author.id;
        const collector = msg.createMessageComponentCollector({
            filter,
            time: 60000,
        });
        collector.on("collect", async (i) => {
            if (!message.guild || !message.channel || !client.user)
                return;
            if (i.isButton()) {
                if (i.customId === "cancel") {
                    await msg.edit({
                        embeds: [
                            new embeds_extend_1.EmbedCorrect()
                                .setTitle("Add Owners")
                                .setDescription([
                                `${client.getEmoji(message.guild.id, "success")} Cancelled adding owners.`,
                                `You can use the command again to add owners.`,
                            ].join("\n")),
                        ],
                        components: [],
                    });
                    return collector.stop();
                }
            }
            else if (i.isUserSelectMenu()) {
                if (i.customId === "addowners") {
                    const selectedUsers = i.values;
                    const newOwners = selectedUsers.filter((userId) => !owners.includes(userId));
                    if (newOwners.length > 0) {
                        await main_1.main.prisma.discord.update({
                            where: { clientId: client.user.id },
                            data: {
                                owners: [...owners, ...newOwners],
                            },
                        });
                        await i.reply({
                            embeds: [
                                new embeds_extend_1.EmbedCorrect()
                                    .setTitle("Add Owners")
                                    .setDescription([
                                    `${client.getEmoji(message.guild.id, "success")} Owners added successfully.`,
                                    `New owners: ${newOwners.join(", ")}`,
                                ].join("\n")),
                            ],
                        });
                    }
                    else {
                        await i.reply({
                            embeds: [
                                new embeds_extend_1.EmbedCorrect()
                                    .setTitle("Add Owners")
                                    .setDescription([
                                    `${client.getEmoji(message.guild.id, "error")} No new owners to add.`,
                                    `All selected users are already owners.`,
                                ].join("\n")),
                            ],
                        });
                    }
                }
            }
        });
        return;
    },
};
module.exports = OwnerAddCommand;
//# sourceMappingURL=addowners.js.map
//# debugId=9b54628c-b731-53a1-b556-7653dcdc483a
