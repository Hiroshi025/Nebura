import {
	ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, EmbedBuilder, GuildMember,
	GuildMemberRoleManager, Message, MessageComponentInteraction, PermissionFlagsBits, TextChannel
} from "discord.js";

import { main } from "@/main";
import { ErrorEmbed } from "@/shared/structure/extenders/discord/embeds.extend";
import { Precommand } from "@typings/modules/discord";
import { logWithLabel } from "@utils/functions/console";

// Asume que existe un modelo separado para la configuración de ban logs, por ejemplo: banConfig
// Si no existe, deberías crearlo en tu base de datos y ajustar los nombres aquí.

const adminBanCommand: Precommand = {
  name: "ban",
  description: "Comprehensive ban management system",
  examples: ["ban member @user reason", "ban setup #channel", "ban list"],
  nsfw: false,
  owner: false,
  aliases: ["adminban"],
  botpermissions: ["BanMembers"],
  permissions: ["BanMembers"],
  subcommands: [
    "ban member <user> [reason]",
    "ban list [page]",
    "ban remove <case_id>",
    "ban info <case_id>",
  ],
  async execute(client, message, args, prefix) {
    if (!message.guild || message.channel.type !== ChannelType.GuildText) return;

    const embed = new EmbedBuilder();
    const subcommand = args[0]?.toLowerCase() || "help";

    // Permission check for all subcommands except 'help'
    if (subcommand !== "help" && !message.member?.permissions.has(PermissionFlagsBits.BanMembers)) {
      return message.channel.send({
        embeds: [
          embed.setColor("Red").setDescription("❌ You don't have permission to use ban commands."),
        ],
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
async function handleBanMember(client: any, message: any, args: string[]) {
  const target = message.mentions.members?.first();
  const reason = args.slice(1).join(" ") || "No reason provided";

  if (!target) {
    return message.channel.send({
      embeds: [
        new ErrorEmbed()
          .setTitle("Ban Command Error")
          .setDescription("Please mention a valid user to ban."),
      ],
    });
  }

  // Validation checks
  if (target.user.id === client.user?.id) {
    return message.channel.send({
      embeds: [new ErrorEmbed().setDescription("You cannot ban me!")],
    });
  }

  if (target.user.id === message.author.id) {
    return message.channel.send({
      embeds: [new ErrorEmbed().setDescription("You cannot ban yourself.")],
    });
  }

  if (
    target.roles.highest.position >=
    (message.member.roles as GuildMemberRoleManager).highest.position
  ) {
    return message.channel.send({
      embeds: [
        new ErrorEmbed().setDescription(
          "The member has a higher role than you, so you cannot ban them.",
        ),
      ],
    });
  }

  if (!message.guild.members.me?.permissions.has("BanMembers")) {
    return message.channel.send({
      embeds: [new ErrorEmbed().setDescription("I don't have permission to ban members.")],
    });
  }

  // Check if ban system is configured
  // Buscar la configuración en una tabla/configuración separada
  const guildConfig = await main.prisma.myGuild.findFirst({
    where: { guildId: message.guild.id },
  });

  if (!guildConfig) {
    return message.channel.send({
      embeds: [
        new ErrorEmbed()
          .setTitle("Configuration Required")
          .setDescription(
            "The ban system needs to be configured first. Use `/ban setup` to set up the logs channel.",
          ),
      ],
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setLabel("Setup Ban System")
            .setStyle(ButtonStyle.Primary)
            .setCustomId("ban-setup-init"),
        ),
      ],
    });
  }

  // Create confirmation embed
  const confirmationEmbed = new EmbedBuilder()
    .setTitle("⚠️ Ban Confirmation")
    .setDescription(`You are about to ban ${target.user.tag}`)
    .setColor("Yellow")
    .addFields(
      { name: "User", value: target.toString(), inline: true },
      { name: "ID", value: target.id, inline: true },
      { name: "Reason", value: reason },
    )
    .setThumbnail(target.user.displayAvatarURL())
    .setFooter({ text: "This action cannot be undone" });

  // Send confirmation message with buttons
  const confirmationMessage = await message.channel.send({
    embeds: [confirmationEmbed],
    components: [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId("ban-confirm")
          .setLabel("Confirm Ban")
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId("ban-cancel")
          .setLabel("Cancel")
          .setStyle(ButtonStyle.Secondary),
      ),
    ],
  });

  // Create collector for button interactions
  const collector = confirmationMessage.createMessageComponentCollector({
    filter: (i: MessageComponentInteraction) => i.user.id === message.author.id,
    time: 60000,
  });

  collector.on("collect", async (interaction: MessageComponentInteraction) => {
    if (interaction.customId === "ban-confirm") {
      await executeBan(message, target, reason);
      await interaction.update({
        embeds: [confirmationEmbed.setTitle("✅ User Banned").setColor("Green")],
        components: [],
      });
    } else if (interaction.customId === "ban-cancel") {
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
      .catch(() => {});
  });
}

/**
 * Executes the ban and handles all related operations
 */
async function executeBan(message: Message, target: GuildMember, reason: string) {
  if (!message.guild || !target) {
    logWithLabel("error", "Invalid guild or target member for ban operation.");
    return (message.channel as TextChannel).send({
      embeds: [
        new ErrorEmbed()
          .setTitle("Ban Error")
          .setDescription("An error occurred while trying to ban the user."),
      ],
    });
  }

  try {
    // Crear registro de ban en la base de datos (sin moderatorId si no existe en el modelo)
    const banRecord = await main.prisma.banUser.create({
      data: {
        guildId: message.guild.id,
        userId: target.id,
        banReason: reason,
        banTime: new Date(),
        // moderatorId: message.author.id // Elimina si no existe en el modelo
      },
    });

    // Send DM to banned user
    try {
      const dmEmbed = new EmbedBuilder()
        .setTitle(`🚫 You've been banned from ${message.guild.name}`)
        .setColor("Red")
        .addFields(
          { name: "Reason", value: reason },
          { name: "Moderator", value: message.author.tag },
          { name: "Case ID", value: banRecord.id.toString() },
        )
        .setFooter({ text: "Contact server staff if you believe this was a mistake" });

      await target.send({ embeds: [dmEmbed] });
    } catch (err) {
      logWithLabel("error", `Failed to send ban DM to ${target.id}: ${err}`);
    }

    // Log the ban en el canal configurado
    const guildConfig = await main.prisma.myGuild.findFirst({
      where: { guildId: message.guild.id },
    });

    if (guildConfig?.eventlogs?.channelId) {
      const logChannel = message.guild.channels.cache.get(guildConfig.eventlogs.channelId);
      if (logChannel?.isTextBased()) {
        const logEmbed = new EmbedBuilder()
          .setTitle("Member Banned")
          .setColor("Red")
          .addFields(
            { name: "User", value: target.toString(), inline: true },
            { name: "ID", value: target.id, inline: true },
            { name: "Moderator", value: message.author.toString(), inline: true },
            { name: "Reason", value: reason },
            { name: "Case ID", value: banRecord.id.toString() },
            { name: "Date", value: `<t:${Math.floor(Date.now() / 1000)}:F>` },
          )
          .setThumbnail(target.user.displayAvatarURL());

        await (logChannel as TextChannel).send({ embeds: [logEmbed] });
      }
    }

    // Actually ban the member
    await target.ban({ reason: `${message.author.tag}: ${reason}` });

    // Send success message
    const successEmbed = new EmbedBuilder()
      .setTitle("✅ Ban Successful")
      .setColor("Green")
      .setDescription(`${target.user.tag} has been banned from the server.`)
      .addFields(
        { name: "Reason", value: reason },
        { name: "Case ID", value: banRecord.id.toString() },
      );

    await (message.channel as TextChannel).send({ embeds: [successEmbed] });
  } catch (error) {
    logWithLabel("error", `Ban error: ${error}`);
    (message.channel as TextChannel).send({
      embeds: [
        new ErrorEmbed()
          .setTitle("Ban Failed")
          .setDescription("An error occurred while trying to ban the user."),
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
async function handleBanList(client: any, message: any, args: string[]) {
  const page = parseInt(args[0]) || 1;
  const perPage = 5;

  try {
    const totalBans = await main.prisma.banUser.count({
      where: { guildId: message.guild.id },
    });

    const totalPages = Math.ceil(totalBans / perPage);

    if (page < 1 || page > totalPages) {
      return message.channel.send({
        embeds: [
          new ErrorEmbed()
            .setTitle("Invalid Page")
            .setDescription(`Please select a page between 1 and ${totalPages}`),
        ],
      });
    }

    const bans = await main.prisma.banUser.findMany({
      where: { guildId: message.guild.id },
      skip: (page - 1) * perPage,
      take: perPage,
      orderBy: { banTime: "desc" },
    });

    if (bans.length === 0) {
      return message.channel.send({
        embeds: [
          new ErrorEmbed()
            .setTitle("No Bans Found")
            .setDescription("There are no ban records in this server."),
        ],
      });
    }

    const banListEmbed = new EmbedBuilder()
      .setTitle(`Ban Records (Page ${page}/${totalPages})`)
      .setColor("Blue")
      .setFooter({ text: `Total bans: ${totalBans}` });

    for (const ban of bans) {
      try {
        const user = await client.users.fetch(ban.userId!);
        banListEmbed.addFields({
          name: `Case #${ban.id} | ${user.tag}`,
          value: `**Reason:** ${ban.banReason}\n**Date:** <t:${Math.floor((ban.banTime ? ban.banTime.getTime() : Date.now()) / 1000)}:R>`,
          inline: true,
        });
      } catch {
        banListEmbed.addFields({
          name: `Case #${ban.id} | Unknown User`,
          value: `**Reason:** ${ban.banReason}\n**Date:** <t:${Math.floor((ban.banTime ? ban.banTime.getTime() : Date.now()) / 1000)}:R>`,
          inline: true,
        });
      }
    }

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`ban-list-prev-${page}`)
        .setLabel("Previous")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(page <= 1),
      new ButtonBuilder()
        .setCustomId(`ban-list-next-${page}`)
        .setLabel("Next")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(page >= totalPages),
      new ButtonBuilder()
        .setCustomId("ban-list-close")
        .setLabel("Close")
        .setStyle(ButtonStyle.Danger),
    );

    const listMessage = await message.channel.send({
      embeds: [banListEmbed],
      components: [row],
    });

    const collector = listMessage.createMessageComponentCollector({
      filter: (i: MessageComponentInteraction) => i.user.id === message.author.id,
      time: 60000,
    });

    collector.on("collect", async (interaction: MessageComponentInteraction) => {
      if (interaction.customId === "ban-list-close") {
        await interaction.update({
          components: [],
        });
        return;
      }

      const newPage = interaction.customId.includes("next") ? page + 1 : page - 1;
      await interaction.deferUpdate();
      await handleBanList(client, message, [newPage.toString()]);
      await listMessage.delete().catch(() => {});
    });

    collector.on("end", () => {
      listMessage
        .edit({
          components: [],
        })
        .catch(() => {});
    });
  } catch (error) {
    logWithLabel("error", `Ban list error: ${error}`);
    message.channel.send({
      embeds: [
        new ErrorEmbed()
          .setTitle("Failed to Load Bans")
          .setDescription("An error occurred while fetching ban records."),
      ],
    });
  }
}

/**
 * Handles removing a ban (unban)
 */
async function handleBanRemove(message: Message, args: string[]) {
  if (!message.guild || message.channel.type !== ChannelType.GuildText) {
    logWithLabel("error", "Invalid guild or channel for ban removal.");
    return (message.channel as TextChannel).send({
      embeds: [
        new ErrorEmbed()
          .setTitle("Unban Error")
          .setDescription("An error occurred while trying to unban the user."),
      ],
    });
  }

  const userId = args[0];

  if (!userId) {
    return message.channel.send({
      embeds: [
        new ErrorEmbed()
          .setTitle("Invalid Case ID")
          .setDescription("Please provide a valid ban case ID."),
      ],
    });
  }

  try {
    const banRecord = await main.prisma.banUser.findFirst({
      where: { userId, guildId: message.guild.id },
    });

    if (!banRecord) {
      return message.channel.send({
        embeds: [
          new ErrorEmbed()
            .setTitle("Case Not Found")
            .setDescription("No ban record found with that ID."),
        ],
      });
    }

    // Check if user is still banned
    try {
      await message.guild.bans.fetch(banRecord.userId!);
    } catch {
      return message.channel.send({
        embeds: [
          new ErrorEmbed()
            .setTitle("User Not Banned")
            .setDescription("This user is not currently banned."),
        ],
      });
    }

    // Create confirmation embed
    const confirmEmbed = new EmbedBuilder()
      .setTitle("⚠️ Confirm Unban")
      .setColor("Yellow")
      .setDescription(`Are you sure you want to unban this user?`)
      .addFields(
        { name: "Case ID", value: banRecord.id.toString(), inline: true },
        { name: "User ID", value: banRecord.userId!, inline: true },
        { name: "Original Reason", value: banRecord.banReason || "No reason provided" },
      );

    const confirmMessage = await message.channel.send({
      embeds: [confirmEmbed],
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId("unban-confirm")
            .setLabel("Confirm Unban")
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId("unban-cancel")
            .setLabel("Cancel")
            .setStyle(ButtonStyle.Danger),
        ),
      ],
    });

    const collector = confirmMessage.createMessageComponentCollector({
      filter: (i: MessageComponentInteraction) => i.user.id === message.author.id,
      time: 60000,
    });

    collector.on("collect", async (interaction: MessageComponentInteraction) => {
      if (!message.guild || !banRecord) {
        logWithLabel("error", "Invalid guild or ban record for unban operation.");
        return interaction.update({
          embeds: [
            new ErrorEmbed()
              .setTitle("Unban Error")
              .setDescription("An error occurred while trying to unban the user."),
          ],
          components: [],
        });
      }

      if (interaction.customId === "unban-confirm") {
        try {
          // Unban the user
          await message.guild.bans.remove(banRecord.userId!);

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
          const guildConfig = await main.prisma.myGuild.findFirst({
            where: { guildId: message.guild.id },
          });

          if (guildConfig?.eventlogs?.channelId) {
            const logChannel = message.guild.channels.cache.get(guildConfig.eventlogs.channelId);
            if (logChannel?.isTextBased()) {
              const logEmbed = new EmbedBuilder()
                .setTitle("Member Unbanned")
                .setColor("Green")
                .addFields(
                  { name: "User", value: `<@${banRecord.userId}>`, inline: true },
                  { name: "Case ID", value: banRecord.id.toString(), inline: true },
                  { name: "Moderator", value: message.author.toString(), inline: true },
                  { name: "Original Reason", value: banRecord.banReason || "No reason provided" },
                  { name: "Date", value: `<t:${Math.floor(Date.now() / 1000)}:F>` },
                );

              await (logChannel as TextChannel).send({ embeds: [logEmbed] });
            }
          }
        } catch (error) {
          logWithLabel("error", `Unban error: ${error}`);
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
      } else if (interaction.customId === "unban-cancel") {
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
        .catch(() => {});
    });
  } catch (error) {
    logWithLabel("error", `Unban error: ${error}`);
    message.channel.send({
      embeds: [
        new ErrorEmbed()
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
async function handleBanInfo(client: any, message: any, args: string[]) {
  const userId = args[0];

  if (!userId) {
    return message.channel.send({
      embeds: [
        new ErrorEmbed()
          .setTitle("Invalid Case ID")
          .setDescription("Please provide a valid ban case ID."),
      ],
    });
  }

  try {
    const banRecord = await main.prisma.banUser.findFirst({
      where: { userId, guildId: message.guild.id },
    });

    if (!banRecord) {
      return message.channel.send({
        embeds: [
          new ErrorEmbed()
            .setTitle("Case Not Found")
            .setDescription("No ban record found with that ID."),
        ],
      });
    }

    const infoEmbed = new EmbedBuilder().setTitle(`Ban Case #${banRecord.id}`).setColor("Blue");

    try {
      const user = await client.users.fetch(banRecord.userId!);
      infoEmbed.setThumbnail(user.displayAvatarURL());
      infoEmbed.addFields(
        { name: "User", value: `${user.tag} (${user.id})`, inline: true },
        // No status/unbanned si no existe el campo
      );
    } catch {
      infoEmbed.addFields({ name: "User", value: `Unknown (${banRecord.userId})`, inline: true });
    }

    infoEmbed.addFields(
      { name: "Reason", value: banRecord.banReason || "No reason provided" },
      {
        name: "Banned On",
        value: `<t:${Math.floor((banRecord.banTime ? banRecord.banTime.getTime() : Date.now()) / 1000)}:F>`,
      },
      // No moderatorId/unban info si no existen los campos
    );

    await message.channel.send({ embeds: [infoEmbed] });
  } catch (error) {
    logWithLabel("error", `Ban info error: ${error}`);
    message.channel.send({
      embeds: [
        new ErrorEmbed()
          .setTitle("Failed to Load Case")
          .setDescription("An error occurred while fetching ban information."),
      ],
    });
  }
}

/**
 * Shows help information for the ban command
 */
async function showBanHelp(message: Message, prefix: string) {
  if (!message.guild || !message.channel || message.author.bot) {
    logWithLabel("error", "Invalid guild or channel for ban help.");
    return (message.channel as TextChannel).send({
      embeds: [
        new ErrorEmbed()
          .setTitle("Help Error")
          .setDescription("An error occurred while trying to show the ban help."),
      ],
    });
  }

  const helpEmbed = new EmbedBuilder()
    .setTitle("🔨 Ban Command Help")
    .setColor("Blue")
    .setDescription("Comprehensive ban management system with logging and tracking")
    .addFields(
      {
        name: "Ban a Member",
        value: `\`${prefix}ban member @user [reason]\`\nBans a member with optional reason and logs the action.`,
      },
      {
        name: "Setup Ban Logs",
        value: `\`${prefix}ban setup #channel\`\nConfigures the channel where ban logs will be sent.`,
      },
      {
        name: "List Bans",
        value: `\`${prefix}ban list [page]\`\nShows a paginated list of all bans in the server.`,
      },
      {
        name: "Remove Ban",
        value: `\`${prefix}ban remove <case_id>\`\nUnbans a user by their case ID.`,
      },
      {
        name: "Ban Info",
        value: `\`${prefix}ban info <case_id>\`\nShows detailed information about a specific ban case.`,
      },
    )
    .setFooter({ text: `Required permissions: Ban Members` });

  return await (message.channel as TextChannel).send({ embeds: [helpEmbed] });
}

export = adminBanCommand;
