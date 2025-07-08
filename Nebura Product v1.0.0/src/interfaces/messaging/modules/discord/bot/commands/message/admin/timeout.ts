import {
	ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, EmbedBuilder, PermissionFlagsBits,
	StringSelectMenuBuilder, StringSelectMenuOptionBuilder
} from "discord.js";

import { Precommand } from "@typings/modules/discord";

const timeoutCommand: Precommand = {
    name: "timeout",
    description: "Manage user timeouts in the server",
    examples: [
        "timeout add @user 30m Spamming",
        "timeout remove @user",
        "timeout list"
    ],
    nsfw: false,
    owner: false,
    cooldown: 5,
    subcommands: [
      "timeout add <@user> <duration> [reason]",
      "timeout remove <@user>",
      "timeout list"
    ],
    aliases: ["mute", "temporalmute"],
    botpermissions: ["ModerateMembers"],
    permissions: ["ModerateMembers"],
    async execute(_client, message, args) {
        if (!message.guild || !message.channel || message.channel.type !== ChannelType.GuildText) return;
        if (!message.member?.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#FF0000")
                        .setTitle("❌ Permission Denied")
                        .setDescription("You need the `Moderate Members` permission to use this command.")
                ]
            });
        }

        const subcommand = args[0]?.toLowerCase();
        const targetUser = message.mentions.members?.first() || message.guild.members.cache.get(args[1]);
        const reason = args.slice(2).join(" ") || "No reason provided";

        switch (subcommand) {
            case "add":
                if (!targetUser) {
                    return message.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor("#FF0000")
                                .setTitle("❌ Invalid Usage")
                                .setDescription("Please mention a user or provide their ID to timeout.")
                                .addFields(
                                    { name: "Example", value: "`timeout add @user 30m Spamming`" },
                                    { name: "Time Formats", value: "`30m` (30 minutes), `2h` (2 hours), `1d` (1 day)" }
                                )
                        ]
                    });
                }

                if (targetUser.id === message.author.id) {
                    return message.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor("#FF0000")
                                .setTitle("❌ Invalid Target")
                                .setDescription("You cannot timeout yourself.")
                        ]
                    });
                }

                if (!targetUser.moderatable) {
                    return message.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor("#FF0000")
                                .setTitle("❌ Permission Denied")
                                .setDescription("I cannot timeout this user. They may have higher roles than me.")
                        ]
                    });
                }

                const timeString = args[2];
                if (!timeString) {
                    return message.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor("#FF0000")
                                .setTitle("❌ Missing Duration")
                                .setDescription("Please specify a timeout duration.")
                                .addFields(
                                    { name: "Example", value: "`timeout add @user 30m Spamming`" },
                                    { name: "Time Formats", value: "`30m` (30 minutes), `2h` (2 hours), `1d` (1 day)" }
                                )
                        ]
                    });
                }

                const duration = parseDuration(timeString);
                if (!duration || duration < 60000 || duration > 2419200000) { // Between 1 min and 28 days
                    return message.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor("#FF0000")
                                .setTitle("❌ Invalid Duration")
                                .setDescription("Timeout duration must be between 1 minute and 28 days.")
                                .addFields(
                                    { name: "Valid Formats", value: "`m` (minutes), `h` (hours), `d` (days)" },
                                    { name: "Examples", value: "`30m`, `2h`, `1d`" }
                                )
                        ]
                    });
                }

                const timeoutUntil = new Date(Date.now() + duration);

                try {
                    await targetUser.timeout(duration, `${reason} (Moderator: ${message.author.tag})`);

                    // Confirmation message
                    const embed = new EmbedBuilder()
                        .setColor("#FFA500")
                        .setTitle("⏳ User Timed Out")
                        .setDescription(`${targetUser} has been timed out until <t:${Math.floor(timeoutUntil.getTime() / 1000)}:f>`)
                        .addFields(
                            { name: "Reason", value: reason, inline: true },
                            { name: "Duration", value: formatDuration(duration), inline: true },
                            { name: "Moderator", value: message.author.toString(), inline: true }
                        )
                        .setThumbnail(targetUser.displayAvatarURL())
                        .setTimestamp();

                    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
                        new ButtonBuilder()
                            .setCustomId(`untimeout_${targetUser.id}`)
                            .setLabel("Remove Timeout")
                            .setStyle(ButtonStyle.Danger)
                    );

                    const reply = await message.reply({ embeds: [embed], components: [row] });

                    // Collector for the remove timeout button
                    const collector = reply.createMessageComponentCollector({ time: 60000 });

                    collector.on("collect", async i => {
                        if (i.customId === `untimeout_${targetUser.id}`) {
                            if (!i.memberPermissions?.has(PermissionFlagsBits.ModerateMembers)) {
                                return i.reply({
                                    embeds: [
                                        new EmbedBuilder()
                                            .setColor("#FF0000")
                                            .setTitle("❌ Permission Denied")
                                            .setDescription("You need the `Moderate Members` permission to remove timeouts.")
                                    ],
                                    ephemeral: true
                                });
                            }

                            await targetUser.timeout(null);
                            await i.update({
                                embeds: [
                                    embed
                                        .setColor("#00FF00")
                                        .setTitle("✅ Timeout Removed")
                                        .setDescription(`Timeout removed from ${targetUser}`)
                                ],
                                components: []
                            });
                            collector.stop();
                        }

                        return;
                    });

                    collector.on("end", () => {
                        reply.edit({ components: [] }).catch(console.error);
                    });

                } catch (error) {
                    console.error("Error timing out user:", error);
                    return message.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor("#FF0000")
                                .setTitle("❌ Error")
                                .setDescription("Failed to timeout the user. Please try again.")
                        ]
                    });
                }
                break;

            case "remove":
            case "delete":
            case "end":
                if (!targetUser) {
                    return message.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor("#FF0000")
                                .setTitle("❌ Invalid Usage")
                                .setDescription("Please mention a user or provide their ID to remove their timeout.")
                                .addFields(
                                    { name: "Example", value: "`timeout remove @user`" }
                                )
                        ]
                    });
                }

                if (!targetUser.isCommunicationDisabled()) {
                    return message.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor("#FFA500")
                                .setTitle("⚠️ No Active Timeout")
                                .setDescription(`${targetUser} is not currently timed out.`)
                        ]
                    });
                }

                try {
                    await targetUser.timeout(null);
                    return message.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor("#00FF00")
                                .setTitle("✅ Timeout Removed")
                                .setDescription(`${targetUser}'s timeout has been successfully removed.`)
                                .addFields(
                                    { name: "Moderator", value: message.author.toString() }
                                )
                        ]
                    });
                } catch (error) {
                    console.error("Error removing timeout:", error);
                    return message.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor("#FF0000")
                                .setTitle("❌ Error")
                                .setDescription("Failed to remove the timeout. Please try again.")
                        ]
                    });
                }

            case "list":
                const timedOutMembers = await message.guild.members.fetch()
                    .then(members => members.filter(m => m.isCommunicationDisabled()));

                if (timedOutMembers.size === 0) {
                    return message.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor("#7289DA")
                                .setTitle("⏳ Active Timeouts")
                                .setDescription("There are currently no users timed out in this server.")
                        ]
                    });
                }

                const embed = new EmbedBuilder()
                    .setColor("#FFA500")
                    .setTitle(`⏳ Active Timeouts (${timedOutMembers.size})`)
                    .setDescription("List of currently timed out members:");

                const selectMenu = new StringSelectMenuBuilder()
                    .setCustomId("timeout_details")
                    .setPlaceholder("Select a user to view details")
                    .setMinValues(1)
                    .setMaxValues(1);

                timedOutMembers.forEach(member => {
                    const timeoutEnds = member.communicationDisabledUntil;
                    const timeLeft = timeoutEnds ? Math.max(0, timeoutEnds.getTime() - Date.now()) : 0;

                    embed.addFields({
                        name: member.user.tag,
                        value: `Ends: <t:${Math.floor(timeoutEnds!.getTime() / 1000)}:R>\nID: ${member.id}`,
                        inline: true
                    });

                    selectMenu.addOptions(
                        new StringSelectMenuOptionBuilder()
                            .setLabel(member.user.tag)
                            .setValue(member.id)
                            .setDescription(`Timeout ends ${formatDuration(timeLeft)}`)
                    );
                });

                const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);
                const reply = await message.reply({ embeds: [embed], components: [row] });

                // Collector for the select menu
                const collector = reply.createMessageComponentCollector({ time: 60000 });

                collector.on("collect", async i => {
                    if (i.isStringSelectMenu() && i.customId === "timeout_details") {
                        const memberId = i.values[0];
                        const member = await message.guild?.members.fetch(memberId);

                        if (!member || !member.isCommunicationDisabled()) {
                            return i.reply({
                                embeds: [
                                    new EmbedBuilder()
                                        .setColor("#FF0000")
                                        .setTitle("❌ Error")
                                        .setDescription("This user is no longer timed out.")
                                ],
                                ephemeral: true
                            });
                        }

                        const timeoutEnds = member.communicationDisabledUntil!;
                        const timeLeft = timeoutEnds.getTime() - Date.now();

                        const detailsEmbed = new EmbedBuilder()
                            .setColor("#FFA500")
                            .setTitle(`⏳ Timeout Details: ${member.user.tag}`)
                            .setThumbnail(member.displayAvatarURL())
                            .addFields(
                                { name: "User", value: member.toString(), inline: true },
                                { name: "ID", value: member.id, inline: true },
                                { name: "Timeout Ends", value: `<t:${Math.floor(timeoutEnds.getTime() / 1000)}:f>`, inline: true },
                                { name: "Time Remaining", value: formatDuration(timeLeft), inline: true }
                            );

                        const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
                            new ButtonBuilder()
                                .setCustomId(`untimeout_${member.id}`)
                                .setLabel("Remove Timeout")
                                .setStyle(ButtonStyle.Danger)
                        );

                        await i.reply({
                            embeds: [detailsEmbed],
                            components: [actionRow],
                            ephemeral: true
                        });
                    }

                    return;
                });

                collector.on("end", () => {
                    reply.edit({ components: [] }).catch(console.error);
                });
                break;

            default:
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor("#7289DA")
                            .setTitle("🛠️ Timeout Command Help")
                            .setDescription("Manage user timeouts in the server")
                            .addFields(
                                { name: "Add Timeout", value: "`timeout add @user 30m [reason]`", inline: true },
                                { name: "Remove Timeout", value: "`timeout remove @user`", inline: true },
                                { name: "List Timeouts", value: "`timeout list`", inline: true },
                                { name: "Time Formats", value: "`m` (minutes), `h` (hours), `d` (days)", inline: false },
                                { name: "Examples", value: "`30m` (30 minutes)\n`2h` (2 hours)\n`1d` (1 day)", inline: false }
                            )
                    ]
                });
        }

        return;
    }
};

function parseDuration(timeString: string): number | null {
    const regex = /^(\d+)([mhd])$/i;
    const match = timeString.match(regex);

    if (!match) return null;

    const amount = parseInt(match[1]);
    const unit = match[2].toLowerCase();

    switch (unit) {
        case 'm': return amount * 60 * 1000; // minutes
        case 'h': return amount * 60 * 60 * 1000; // hours
        case 'd': return amount * 24 * 60 * 60 * 1000; // days
        default: return null;
    }
}

function formatDuration(ms: number): string {
    if (ms <= 0) return "0 seconds";

    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));

    const parts = [];
    if (days > 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`);
    if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
    if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
    if (seconds > 0) parts.push(`${seconds} second${seconds !== 1 ? 's' : ''}`);

    return parts.join(' ');
}

export = timeoutCommand;