"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="a12d7f26-48a9-5964-87c7-297d7630136f")}catch(e){}}();

const discord_js_1 = require("discord.js");
const kickCommand = {
    name: "kick",
    description: "Kick a user from the server",
    examples: [
        "kick @user Spamming",
        "kick @user"
    ],
    nsfw: false,
    owner: false,
    cooldown: 5,
    aliases: ["expulsar"],
    botpermissions: ["KickMembers"],
    permissions: ["KickMembers"],
    async execute(_client, message, args) {
        if (!message.guild || !message.channel || message.channel.type !== discord_js_1.ChannelType.GuildText)
            return;
        // Permission check
        if (!message.member?.permissions.has(discord_js_1.PermissionFlagsBits.KickMembers)) {
            return message.reply({
                embeds: [
                    new discord_js_1.EmbedBuilder()
                        .setColor("#FF0000")
                        .setTitle("❌ Permission Denied")
                        .setDescription("You need the `Kick Members` permission to use this command.")
                ]
            });
        }
        const targetUser = message.mentions.members?.first() || message.guild.members.cache.get(args[0]);
        const reason = args.slice(1).join(" ") || "No reason provided";
        if (!targetUser) {
            return message.reply({
                embeds: [
                    new discord_js_1.EmbedBuilder()
                        .setColor("#FF0000")
                        .setTitle("❌ Invalid Usage")
                        .setDescription("Please mention a user or provide their ID to kick.")
                        .addFields({ name: "Example", value: "`kick @user Spamming`" })
                ]
            });
        }
        if (targetUser.id === message.author.id) {
            return message.reply({
                embeds: [
                    new discord_js_1.EmbedBuilder()
                        .setColor("#FF0000")
                        .setTitle("❌ Invalid Target")
                        .setDescription("You cannot kick yourself.")
                ]
            });
        }
        if (!targetUser.kickable) {
            return message.reply({
                embeds: [
                    new discord_js_1.EmbedBuilder()
                        .setColor("#FF0000")
                        .setTitle("❌ Permission Denied")
                        .setDescription("I cannot kick this user. They may have higher roles than me.")
                ]
            });
        }
        // Confirmation embed
        const confirmEmbed = new discord_js_1.EmbedBuilder()
            .setColor("#FFA500")
            .setTitle("⚠️ Confirm Kick")
            .setDescription(`Are you sure you want to kick ${targetUser}?`)
            .addFields({ name: "Reason", value: reason, inline: true }, { name: "Moderator", value: message.author.toString(), inline: true })
            .setThumbnail(targetUser.displayAvatarURL());
        const confirmButtons = new discord_js_1.ActionRowBuilder()
            .addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId("confirm_kick")
            .setLabel("Confirm Kick")
            .setStyle(discord_js_1.ButtonStyle.Danger), new discord_js_1.ButtonBuilder()
            .setCustomId("cancel_kick")
            .setLabel("Cancel")
            .setStyle(discord_js_1.ButtonStyle.Secondary));
        const confirmationMessage = await message.reply({
            embeds: [confirmEmbed],
            components: [confirmButtons]
        });
        // Button collector
        const collector = confirmationMessage.createMessageComponentCollector({
            time: 30000
        });
        collector.on("collect", async (interaction) => {
            if (interaction.user.id !== message.author.id) {
                return interaction.reply({
                    embeds: [
                        new discord_js_1.EmbedBuilder()
                            .setColor("#FF0000")
                            .setTitle("❌ Not Allowed")
                            .setDescription("Only the command author can confirm this action.")
                    ],
                    ephemeral: true
                });
            }
            if (interaction.customId === "confirm_kick") {
                try {
                    await targetUser.kick(`Kicked by ${message.author.tag}: ${reason}`);
                    const successEmbed = new discord_js_1.EmbedBuilder()
                        .setColor("#00FF00")
                        .setTitle("✅ User Kicked")
                        .setDescription(`${targetUser} has been successfully kicked.`)
                        .addFields({ name: "Reason", value: reason, inline: true }, { name: "Moderator", value: message.author.toString(), inline: true })
                        .setThumbnail(targetUser.displayAvatarURL())
                        .setTimestamp();
                    await interaction.update({
                        embeds: [successEmbed],
                        components: []
                    });
                    // DM the kicked user if possible
                    try {
                        const dmEmbed = new discord_js_1.EmbedBuilder()
                            .setColor("#FFA500")
                            .setTitle(`You were kicked from ${message.guild?.name}`)
                            .addFields({ name: "Reason", value: reason }, { name: "Moderator", value: message.author.tag })
                            .setFooter({ text: "You can rejoin if the server allows it" });
                        await targetUser.send({ embeds: [dmEmbed] });
                    }
                    catch (dmError) {
                        console.log("Could not DM user about kick:", dmError);
                    }
                }
                catch (error) {
                    console.error("Error kicking user:", error);
                    await interaction.update({
                        embeds: [
                            new discord_js_1.EmbedBuilder()
                                .setColor("#FF0000")
                                .setTitle("❌ Error")
                                .setDescription("Failed to kick the user. Please try again.")
                        ],
                        components: []
                    });
                }
            }
            else if (interaction.customId === "cancel_kick") {
                await interaction.update({
                    embeds: [
                        new discord_js_1.EmbedBuilder()
                            .setColor("#7289DA")
                            .setTitle("🚫 Kick Cancelled")
                            .setDescription("The kick action has been cancelled.")
                    ],
                    components: []
                });
            }
            collector.stop();
            return;
        });
        collector.on("end", () => {
            confirmationMessage.edit({ components: [] }).catch(console.error);
        });
        return;
    }
};
module.exports = kickCommand;
//# sourceMappingURL=kick.js.map
//# debugId=a12d7f26-48a9-5964-87c7-297d7630136f
