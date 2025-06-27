"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="c29cc69d-9757-57cb-8f43-3f95d53a2f2a")}catch(e){}}();

const discord_js_1 = require("discord.js");
const main_1 = require("../../../../../../../../main");
const embeds_extend_1 = require("../../../../../../../../shared/adapters/extends/embeds.extend");
const console_1 = require("../../../../../../../../shared/utils/functions/console");
// Asume que existe un modelo separado para la configuración de ban logs, por ejemplo: banConfig
// Si no existe, deberías crearlo en tu base de datos y ajustar los nombres aquí.
const adminBanCommand = {
    name: "ban",
    description: "Comprehensive ban management system",
    examples: ["ban member @user reason", "ban setup #channel", "ban list"],
    nsfw: false,
    owner: false,
    aliases: ["adminban"],
    botpermissions: ["BanMembers"],
    permissions: ["BanMembers"],
    subcommands: ["ban member <user> [reason]", "ban list [page]", "ban remove <case_id>", "ban info <case_id>"],
    async execute(client, message, args, prefix) {
        if (!message.guild || message.channel.type !== discord_js_1.ChannelType.GuildText)
            return;
        const embed = new discord_js_1.EmbedBuilder();
        const subcommand = args[0]?.toLowerCase() || "help";
        // Permission check for all subcommands except 'help'
        if (subcommand !== "help" && !message.member?.permissions.has(discord_js_1.PermissionFlagsBits.BanMembers)) {
            return message.channel.send({
                embeds: [embed.setColor("Red").setDescription("❌ You don't have permission to use ban commands.")],
            });
        }
        switch (subcommand) {
            case "member":
                await handleBanMember(client, message, args.slice(1));
                break;
            case "list":
                await handleBanList(client, message, args.slice(1));
                break;
            case "remove":
                await handleBanRemove(message, args.slice(1));
                break;
            case "info":
                await handleBanInfo(client, message, args.slice(1));
                break;
            default:
                await showBanHelp(message, prefix);
                break;
        }
        return;
    },
};
/**
 * Handles banning a member with interactive confirmation
 */
async function handleBanMember(client, message, args) {
    const target = message.mentions.members?.first();
    const reason = args.slice(1).join(" ") || "No reason provided";
    if (!target) {
        return message.channel.send({
            embeds: [new embeds_extend_1.ErrorEmbed().setTitle("Ban Command Error").setDescription("Please mention a valid user to ban.")],
        });
    }
    // Validation checks
    if (target.user.id === client.user?.id) {
        return message.channel.send({
            embeds: [new embeds_extend_1.ErrorEmbed().setDescription("You cannot ban me!")],
        });
    }
    if (target.user.id === message.author.id) {
        return message.channel.send({
            embeds: [new embeds_extend_1.ErrorEmbed().setDescription("You cannot ban yourself.")],
        });
    }
    if (target.roles.highest.position >= message.member.roles.highest.position) {
        return message.channel.send({
            embeds: [new embeds_extend_1.ErrorEmbed().setDescription("The member has a higher role than you, so you cannot ban them.")],
        });
    }
    if (!message.guild.members.me?.permissions.has("BanMembers")) {
        return message.channel.send({
            embeds: [new embeds_extend_1.ErrorEmbed().setDescription("I don't have permission to ban members.")],
        });
    }
    // Check if ban system is configured
    // Buscar la configuración en una tabla/configuración separada
    const guildConfig = await main_1.main.prisma.myGuild.findFirst({
        where: { guildId: message.guild.id },
    });
    if (!guildConfig) {
        return message.channel.send({
            embeds: [
                new embeds_extend_1.ErrorEmbed()
                    .setTitle("Configuration Required")
                    .setDescription("The ban system needs to be configured first. Use `/ban setup` to set up the logs channel."),
            ],
            components: [
                new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setLabel("Setup Ban System").setStyle(discord_js_1.ButtonStyle.Primary).setCustomId("ban-setup-init")),
            ],
        });
    }
    // Create confirmation embed
    const confirmationEmbed = new discord_js_1.EmbedBuilder()
        .setTitle("⚠️ Ban Confirmation")
        .setDescription(`You are about to ban ${target.user.tag}`)
        .setColor("Yellow")
        .addFields({ name: "User", value: target.toString(), inline: true }, { name: "ID", value: target.id, inline: true }, { name: "Reason", value: reason })
        .setThumbnail(target.user.displayAvatarURL())
        .setFooter({ text: "This action cannot be undone" });
    // Send confirmation message with buttons
    const confirmationMessage = await message.channel.send({
        embeds: [confirmationEmbed],
        components: [
            new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId("ban-confirm").setLabel("Confirm Ban").setStyle(discord_js_1.ButtonStyle.Danger), new discord_js_1.ButtonBuilder().setCustomId("ban-cancel").setLabel("Cancel").setStyle(discord_js_1.ButtonStyle.Secondary)),
        ],
    });
    // Create collector for button interactions
    const collector = confirmationMessage.createMessageComponentCollector({
        filter: (i) => i.user.id === message.author.id,
        time: 60000,
    });
    collector.on("collect", async (interaction) => {
        if (interaction.customId === "ban-confirm") {
            await executeBan(message, target, reason);
            await interaction.update({
                embeds: [confirmationEmbed.setTitle("✅ User Banned").setColor("Green")],
                components: [],
            });
        }
        else if (interaction.customId === "ban-cancel") {
            await interaction.update({
                embeds: [confirmationEmbed.setTitle("❌ Ban Cancelled").setColor("Red")],
                components: [],
            });
        }
    });
    collector.on("end", () => {
        confirmationMessage
            .edit({
            components: [],
        })
            .catch(() => { });
    });
}
/**
 * Executes the ban and handles all related operations
 */
async function executeBan(message, target, reason) {
    if (!message.guild || !target) {
        (0, console_1.logWithLabel)("error", "Invalid guild or target member for ban operation.");
        return message.channel.send({
            embeds: [
                new embeds_extend_1.ErrorEmbed().setTitle("Ban Error").setDescription("An error occurred while trying to ban the user."),
            ],
        });
    }
    try {
        const guild = await main_1.main.prisma.myGuild.findFirst({
            where: { guildId: message.guild.id },
        });
        // Crear registro de ban en la base de datos (sin moderatorId si no existe en el modelo)
        const banRecord = await main_1.main.prisma.banUser.create({
            data: {
                guildId: guild?.id,
                userId: target.id,
                banReason: reason,
                banTime: new Date(),
                // moderatorId: message.author.id // Elimina si no existe en el modelo
            },
        });
        // Send DM to banned user
        try {
            const dmEmbed = new discord_js_1.EmbedBuilder()
                .setTitle(`🚫 You've been banned from ${message.guild.name}`)
                .setColor("Red")
                .addFields({ name: "Reason", value: reason }, { name: "Moderator", value: message.author.tag }, { name: "Case ID", value: banRecord.id.toString() })
                .setFooter({ text: "Contact server staff if you believe this was a mistake" });
            await target.send({ embeds: [dmEmbed] });
        }
        catch (err) {
            (0, console_1.logWithLabel)("error", `Failed to send ban DM to ${target.id}: ${err}`);
        }
        // Log the ban en el canal configurado
        const guildConfig = await main_1.main.prisma.myGuild.findFirst({
            where: { guildId: message.guild.id },
        });
        if (guildConfig?.eventlogs?.channelId) {
            const logChannel = message.guild.channels.cache.get(guildConfig.eventlogs.channelId);
            if (logChannel?.isTextBased()) {
                const logEmbed = new discord_js_1.EmbedBuilder()
                    .setTitle("Member Banned")
                    .setColor("Red")
                    .addFields({ name: "User", value: target.toString(), inline: true }, { name: "ID", value: target.id, inline: true }, { name: "Moderator", value: message.author.toString(), inline: true }, { name: "Reason", value: reason }, { name: "Case ID", value: banRecord.id.toString() }, { name: "Date", value: `<t:${Math.floor(Date.now() / 1000)}:F>` })
                    .setThumbnail(target.user.displayAvatarURL());
                await logChannel.send({ embeds: [logEmbed] });
            }
        }
        // Actually ban the member
        await target.ban({ reason: `${message.author.tag}: ${reason}` });
        // Send success message
        const successEmbed = new discord_js_1.EmbedBuilder()
            .setTitle("✅ Ban Successful")
            .setColor("Green")
            .setDescription(`${target.user.tag} has been banned from the server.`)
            .addFields({ name: "Reason", value: reason }, { name: "Case ID", value: banRecord.id.toString() });
        await message.channel.send({ embeds: [successEmbed] });
    }
    catch (error) {
        (0, console_1.logWithLabel)("error", `Ban error: ${error}`);
        message.channel.send({
            embeds: [
                new embeds_extend_1.ErrorEmbed().setTitle("Ban Failed").setDescription("An error occurred while trying to ban the user."),
            ],
        });
    }
    return; // Ensure we exit the function after handling the ban
}
/**
 * Handles setting up the ban system
 */
/* async function handleBanSetup(message: Message, args: string[]) {
  if (!message.guild || !message.channel || message.author.bot) {
    logWithLabel("error", "Invalid guild or channel for ban setup.");
    return (message.channel as TextChannel).send({
      embeds: [
        new ErrorEmbed()
          .setTitle("Setup Error")
          .setDescription("An error occurred while setting up the ban system."),
      ],
    });
  }

  const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]);

  if (!channel || channel.type !== ChannelType.GuildText) {
    return (message.channel as TextChannel).send({
      embeds: [
        new ErrorEmbed()
          .setTitle("Invalid Channel")
          .setDescription("Please mention a valid text channel for ban logs."),
      ],
    });
  }

  try {
    // Check if the bot has permission to send messages in the channel
    const botMember = message.guild.members.me;
    if (!botMember || !channel.permissionsFor(botMember).has("SendMessages")) {
      return (message.channel as TextChannel).send({
        embeds: [
          new ErrorEmbed()
            .setTitle("Missing Permissions")
            .setDescription(`I don't have permission to send messages in ${channel.toString()}`),
        ],
      });
    }

    // Actualizar o crear la configuración en la tabla/configuración separada
    await main.prisma.banConfig.upsert({
      where: { guildId: message.guild.id },
      update: { channelId: channel.id },
      create: {
        guildId: message.guild.id,
        channelId: channel.id,
      },
    });

    const successEmbed = new EmbedCorrect()
      .setTitle("Ban System Configured")
      .setDescription(`Ban logs will now be sent to ${channel.toString()}`)
      .addFields({ name: "Next Steps", value: "Use `/ban member @user` to ban someone" });

    await message.channel.send({ embeds: [successEmbed] });
  } catch (error) {
    logWithLabel("error", `Ban setup error: ${error}`);
    message.channel.send({
      embeds: [
        new ErrorEmbed()
          .setTitle("Setup Failed")
          .setDescription("An error occurred while setting up the ban system."),
      ],
    });
  }
} */
/**
 * Shows a list of bans with pagination
 */
async function handleBanList(client, message, args) {
    const page = parseInt(args[0]) || 1;
    const perPage = 5;
    const guild = await main_1.main.prisma.myGuild.findFirst({
        where: { guildId: message.guild.id },
    });
    try {
        const totalBans = await main_1.main.prisma.banUser.count({
            where: { guildId: guild?.id },
        });
        const totalPages = Math.ceil(totalBans / perPage);
        if (page < 1 || page > totalPages) {
            return message.channel.send({
                embeds: [
                    new embeds_extend_1.ErrorEmbed().setTitle("Invalid Page").setDescription(`Please select a page between 1 and ${totalPages}`),
                ],
            });
        }
        const bans = await main_1.main.prisma.banUser.findMany({
            where: { guildId: guild?.id },
            skip: (page - 1) * perPage,
            take: perPage,
            orderBy: { banTime: "desc" },
        });
        if (bans.length === 0) {
            return message.channel.send({
                embeds: [new embeds_extend_1.ErrorEmbed().setTitle("No Bans Found").setDescription("There are no ban records in this server.")],
            });
        }
        const banListEmbed = new discord_js_1.EmbedBuilder()
            .setTitle(`Ban Records (Page ${page}/${totalPages})`)
            .setColor("Blue")
            .setFooter({ text: `Total bans: ${totalBans}` });
        for (const ban of bans) {
            try {
                const user = await client.users.fetch(ban.userId);
                banListEmbed.addFields({
                    name: `Case #${ban.id} | ${user.tag}`,
                    value: `**Reason:** ${ban.banReason}\n**Date:** <t:${Math.floor((ban.banTime ? ban.banTime.getTime() : Date.now()) / 1000)}:R>`,
                    inline: true,
                });
            }
            catch {
                banListEmbed.addFields({
                    name: `Case #${ban.id} | Unknown User`,
                    value: `**Reason:** ${ban.banReason}\n**Date:** <t:${Math.floor((ban.banTime ? ban.banTime.getTime() : Date.now()) / 1000)}:R>`,
                    inline: true,
                });
            }
        }
        const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId(`ban-list-prev-${page}`)
            .setLabel("Previous")
            .setStyle(discord_js_1.ButtonStyle.Primary)
            .setDisabled(page <= 1), new discord_js_1.ButtonBuilder()
            .setCustomId(`ban-list-next-${page}`)
            .setLabel("Next")
            .setStyle(discord_js_1.ButtonStyle.Primary)
            .setDisabled(page >= totalPages), new discord_js_1.ButtonBuilder().setCustomId("ban-list-close").setLabel("Close").setStyle(discord_js_1.ButtonStyle.Danger));
        const listMessage = await message.channel.send({
            embeds: [banListEmbed],
            components: [row],
        });
        const collector = listMessage.createMessageComponentCollector({
            filter: (i) => i.user.id === message.author.id,
            time: 60000,
        });
        collector.on("collect", async (interaction) => {
            if (interaction.customId === "ban-list-close") {
                await interaction.update({
                    components: [],
                });
                return;
            }
            const newPage = interaction.customId.includes("next") ? page + 1 : page - 1;
            await interaction.deferUpdate();
            await handleBanList(client, message, [newPage.toString()]);
            await listMessage.delete().catch(() => { });
        });
        collector.on("end", () => {
            listMessage
                .edit({
                components: [],
            })
                .catch(() => { });
        });
    }
    catch (error) {
        (0, console_1.logWithLabel)("error", `Ban list error: ${error}`);
        message.channel.send({
            embeds: [
                new embeds_extend_1.ErrorEmbed()
                    .setTitle("Failed to Load Bans")
                    .setDescription("An error occurred while fetching ban records."),
            ],
        });
    }
}
/**
 * Handles removing a ban (unban)
 */
async function handleBanRemove(message, args) {
    const guild = await main_1.main.prisma.myGuild.findFirst({
        where: { guildId: message.guild?.id },
    });
    if (!message.guild || message.channel.type !== discord_js_1.ChannelType.GuildText) {
        (0, console_1.logWithLabel)("error", "Invalid guild or channel for ban removal.");
        return message.channel.send({
            embeds: [
                new embeds_extend_1.ErrorEmbed().setTitle("Unban Error").setDescription("An error occurred while trying to unban the user."),
            ],
        });
    }
    const userId = args[0];
    if (!userId) {
        return message.channel.send({
            embeds: [new embeds_extend_1.ErrorEmbed().setTitle("Invalid Case ID").setDescription("Please provide a valid ban case ID.")],
        });
    }
    try {
        const banRecord = await main_1.main.prisma.banUser.findFirst({
            where: { userId, guildId: guild?.id },
        });
        if (!banRecord) {
            return message.channel.send({
                embeds: [new embeds_extend_1.ErrorEmbed().setTitle("Case Not Found").setDescription("No ban record found with that ID.")],
            });
        }
        // Check if user is still banned
        try {
            await message.guild.bans.fetch(banRecord.userId);
        }
        catch {
            return message.channel.send({
                embeds: [new embeds_extend_1.ErrorEmbed().setTitle("User Not Banned").setDescription("This user is not currently banned.")],
            });
        }
        // Create confirmation embed
        const confirmEmbed = new discord_js_1.EmbedBuilder()
            .setTitle("⚠️ Confirm Unban")
            .setColor("Yellow")
            .setDescription(`Are you sure you want to unban this user?`)
            .addFields({ name: "Case ID", value: banRecord.id.toString(), inline: true }, { name: "User ID", value: banRecord.userId, inline: true }, { name: "Original Reason", value: banRecord.banReason || "No reason provided" });
        const confirmMessage = await message.channel.send({
            embeds: [confirmEmbed],
            components: [
                new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId("unban-confirm").setLabel("Confirm Unban").setStyle(discord_js_1.ButtonStyle.Success), new discord_js_1.ButtonBuilder().setCustomId("unban-cancel").setLabel("Cancel").setStyle(discord_js_1.ButtonStyle.Danger)),
            ],
        });
        const collector = confirmMessage.createMessageComponentCollector({
            filter: (i) => i.user.id === message.author.id,
            time: 60000,
        });
        collector.on("collect", async (interaction) => {
            if (!message.guild || !banRecord) {
                (0, console_1.logWithLabel)("error", "Invalid guild or ban record for unban operation.");
                return interaction.update({
                    embeds: [
                        new embeds_extend_1.ErrorEmbed()
                            .setTitle("Unban Error")
                            .setDescription("An error occurred while trying to unban the user."),
                    ],
                    components: [],
                });
            }
            if (interaction.customId === "unban-confirm") {
                try {
                    // Unban the user
                    await message.guild.bans.remove(banRecord.userId);
                    // Actualizar el registro de ban si tienes campos para ello, si no, omite esta parte
                    // await main.prisma.banUser.update({
                    //     where: { id: banRecord.id },
                    //     data: { /* campos de unban si existen */ }
                    // });
                    // Send success message
                    await interaction.update({
                        embeds: [
                            confirmEmbed
                                .setTitle("✅ User Unbanned")
                                .setColor("Green")
                                .setDescription(`Successfully unbanned <@${banRecord.userId}>`),
                        ],
                        components: [],
                    });
                    // Log the unban
                    const guildConfig = await main_1.main.prisma.myGuild.findFirst({
                        where: { guildId: message.guild.id },
                    });
                    if (guildConfig?.eventlogs?.channelId) {
                        const logChannel = message.guild.channels.cache.get(guildConfig.eventlogs.channelId);
                        if (logChannel?.isTextBased()) {
                            const logEmbed = new discord_js_1.EmbedBuilder()
                                .setTitle("Member Unbanned")
                                .setColor("Green")
                                .addFields({ name: "User", value: `<@${banRecord.userId}>`, inline: true }, { name: "Case ID", value: banRecord.id.toString(), inline: true }, { name: "Moderator", value: message.author.toString(), inline: true }, { name: "Original Reason", value: banRecord.banReason || "No reason provided" }, { name: "Date", value: `<t:${Math.floor(Date.now() / 1000)}:F>` });
                            await logChannel.send({ embeds: [logEmbed] });
                        }
                    }
                }
                catch (error) {
                    (0, console_1.logWithLabel)("error", `Unban error: ${error}`);
                    await interaction.update({
                        embeds: [
                            confirmEmbed
                                .setTitle("❌ Unban Failed")
                                .setColor("Red")
                                .setDescription("An error occurred while trying to unban the user."),
                        ],
                        components: [],
                    });
                }
            }
            else if (interaction.customId === "unban-cancel") {
                await interaction.update({
                    embeds: [confirmEmbed.setTitle("❌ Unban Cancelled").setColor("Red")],
                    components: [],
                });
            }
            return;
        });
        collector.on("end", () => {
            confirmMessage
                .edit({
                components: [],
            })
                .catch(() => { });
        });
    }
    catch (error) {
        (0, console_1.logWithLabel)("error", `Unban error: ${error}`);
        message.channel.send({
            embeds: [
                new embeds_extend_1.ErrorEmbed()
                    .setTitle("Unban Failed")
                    .setDescription("An error occurred while processing the unban request."),
            ],
        });
    }
    return;
}
/**
 * Shows detailed information about a specific ban case
 */
async function handleBanInfo(client, message, args) {
    const userId = args[0];
    const guild = await main_1.main.prisma.myGuild.findFirst({
        where: { guildId: message.guild.id },
    });
    if (!userId) {
        return message.channel.send({
            embeds: [new embeds_extend_1.ErrorEmbed().setTitle("Invalid Case ID").setDescription("Please provide a valid ban case ID.")],
        });
    }
    try {
        const banRecord = await main_1.main.prisma.banUser.findFirst({
            where: { userId, guildId: guild?.id },
        });
        if (!banRecord) {
            return message.channel.send({
                embeds: [new embeds_extend_1.ErrorEmbed().setTitle("Case Not Found").setDescription("No ban record found with that ID.")],
            });
        }
        const infoEmbed = new discord_js_1.EmbedBuilder().setTitle(`Ban Case #${banRecord.id}`).setColor("Blue");
        try {
            const user = await client.users.fetch(banRecord.userId);
            infoEmbed.setThumbnail(user.displayAvatarURL());
            infoEmbed.addFields({ name: "User", value: `${user.tag} (${user.id})`, inline: true });
        }
        catch {
            infoEmbed.addFields({ name: "User", value: `Unknown (${banRecord.userId})`, inline: true });
        }
        infoEmbed.addFields({ name: "Reason", value: banRecord.banReason || "No reason provided" }, {
            name: "Banned On",
            value: `<t:${Math.floor((banRecord.banTime ? banRecord.banTime.getTime() : Date.now()) / 1000)}:F>`,
        });
        await message.channel.send({ embeds: [infoEmbed] });
    }
    catch (error) {
        (0, console_1.logWithLabel)("error", `Ban info error: ${error}`);
        message.channel.send({
            embeds: [
                new embeds_extend_1.ErrorEmbed()
                    .setTitle("Failed to Load Case")
                    .setDescription("An error occurred while fetching ban information."),
            ],
        });
    }
}
/**
 * Shows help information for the ban command
 */
async function showBanHelp(message, prefix) {
    if (!message.guild || !message.channel || message.author.bot) {
        (0, console_1.logWithLabel)("error", "Invalid guild or channel for ban help.");
        return message.channel.send({
            embeds: [
                new embeds_extend_1.ErrorEmbed().setTitle("Help Error").setDescription("An error occurred while trying to show the ban help."),
            ],
        });
    }
    const helpEmbed = new discord_js_1.EmbedBuilder()
        .setTitle("🔨 Ban Command Help")
        .setColor("Blue")
        .setDescription("Comprehensive ban management system with logging and tracking")
        .addFields({
        name: "Ban a Member",
        value: `\`${prefix}ban member @user [reason]\`\nBans a member with optional reason and logs the action.`,
    }, {
        name: "Setup Ban Logs",
        value: `\`${prefix}ban setup #channel\`\nConfigures the channel where ban logs will be sent.`,
    }, {
        name: "List Bans",
        value: `\`${prefix}ban list [page]\`\nShows a paginated list of all bans in the server.`,
    }, {
        name: "Remove Ban",
        value: `\`${prefix}ban remove <case_id>\`\nUnbans a user by their case ID.`,
    }, {
        name: "Ban Info",
        value: `\`${prefix}ban info <case_id>\`\nShows detailed information about a specific ban case.`,
    })
        .setFooter({ text: `Required permissions: Ban Members` });
    return await message.channel.send({ embeds: [helpEmbed] });
}
module.exports = adminBanCommand;
//# sourceMappingURL=ban.js.map
//# debugId=c29cc69d-9757-57cb-8f43-3f95d53a2f2a
