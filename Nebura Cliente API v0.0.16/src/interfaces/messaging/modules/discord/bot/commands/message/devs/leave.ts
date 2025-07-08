import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, ComponentType, EmbedBuilder } from "discord.js";

import { Precommand } from "@typings/modules/discord";
import { EmbedCorrect, ErrorEmbed } from "@utils/extends/embeds.extension";

const leaveCommand: Precommand = {
  name: "leave",
  nameLocalizations: {
    "es-ES": "salir",
    "en-US": "leave",
  },
  description: "Make the bot leave a specified server",
  descriptionLocalizations: {
    "es-ES": "Hacer que el bot salga de un servidor especificado",
    "en-US": "Make the bot leave a specified server",
  },
  examples: ["leave <serverId>", "leave 123456789012345678 --confirm"],
  nsfw: false,
  owner: true,
  cooldown: 5,
  category: "Developers",
  aliases: ["leave-guild", "exit-guild", "part"],
  permissions: ["SendMessages", "EmbedLinks"],
  botpermissions: ["SendMessages", "EmbedLinks"],
  async execute(client, message, args, prefix) {
    if (!message.guild || !message.channel || message.channel.type !== ChannelType.GuildText) {
      return;
    }

    const lang = message.guild?.preferredLocale || "es-ES";
    const { serverId, flags } = await parseArguments(args);

    if (!serverId) {
      return await sendUsage(message, prefix, client, lang);
    }

    const guild = client.guilds.cache.get(serverId);

    if (!guild) {
      return await sendError(
        message,
        client.t("discord:leave.guildNotFoundTitle", { lng: lang }),
        client.t("discord:leave.guildNotFoundDesc", { lng: lang, serverId }),
      );
    }

    if (!flags.confirm) {
      return await sendConfirmation(message, guild, prefix, client, lang);
    }

    try {
      await guild.leave();
      return await sendSuccess(message, guild, client, lang);
    } catch (error) {
      console.error(`Error leaving guild ${guild.id}:`, error);
      return await sendError(
        message,
        client.t("discord:leave.leaveFailedTitle", { lng: lang }),
        client.t("discord:leave.leaveFailedDesc", { lng: lang, guildName: guild.name }),
      );
    }
  },
};

async function parseArguments(args: string[]) {
  const flags = {
    confirm: false,
  };

  const filteredArgs = args.filter((arg) => {
    if (arg.startsWith("--")) {
      const flag = arg.slice(2).toLowerCase();
      if (flag in flags) {
        flags[flag as keyof typeof flags] = true;
        return false;
      }
    }
    return true;
  });

  return {
    serverId: filteredArgs[0],
    flags,
  };
}

async function sendUsage(message: any, prefix: string, client: any, lang: string) {
  return message.channel.send({
    embeds: [
      new ErrorEmbed()
        .setTitle(client.t("discord:leave.missingArgsTitle", { lng: lang }))
        .setDescription(
          [
            `${client.getEmoji(message.guild.id, "error")} ${client.t("discord:leave.missingArgsDesc", { lng: lang })}`,
            client.t("discord:leave.usage", { lng: lang, prefix }),
            client.t("discord:leave.example", { lng: lang, prefix }),
            client.t("discord:leave.flags", { lng: lang }),
          ].join("\n"),
        ),
    ],
  });
}

async function sendError(message: any, title: string, description: string) {
  return message.channel.send({
    embeds: [new ErrorEmbed().setTitle(`❌ ${title}`).setDescription(description)],
  });
}

async function sendConfirmation(message: any, guild: any, prefix: string, client: any, lang: string) {
  const embed = new EmbedBuilder()
    .setTitle(client.t("discord:leave.confirmTitle", { lng: lang }))
    .setColor(0xffa500)
    .setDescription(client.t("discord:leave.confirmDesc", { lng: lang, guildName: guild.name }))
    .addFields(
      {
        name: client.t("discord:leave.fieldId", { lng: lang }),
        value: guild.id,
        inline: true,
      },
      {
        name: client.t("discord:leave.fieldOwner", { lng: lang }),
        value: guild.ownerId ? `<@${guild.ownerId}>` : client.t("discord:leave.unknown", { lng: lang }),
        inline: true,
      },
      {
        name: client.t("discord:leave.fieldMembers", { lng: lang }),
        value: guild.memberCount?.toString() || client.t("discord:leave.unknown", { lng: lang }),
        inline: true,
      },
      {
        name: client.t("discord:leave.fieldCreated", { lng: lang }),
        value: guild.createdAt?.toLocaleDateString() || client.t("discord:leave.unknown", { lng: lang }),
        inline: true,
      },
    )
    .setFooter({
      text: client.t("discord:leave.confirmFooter", { lng: lang, prefix, guildId: guild.id }),
    });

  const confirmButton = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`leave-confirm-${message.author.id}`)
      .setLabel(client.t("discord:leave.confirmButton", { lng: lang }))
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(`leave-cancel-${message.author.id}`)
      .setLabel(client.t("discord:leave.cancelButton", { lng: lang }))
      .setStyle(ButtonStyle.Secondary),
  );

  const msg = await message.channel.send({
    embeds: [embed],
    components: [confirmButton],
  });

  const collector = msg.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 60000,
  });

  collector.on("collect", async (interaction: any) => {
    if (!interaction.customId.includes(interaction.user.id)) {
      return interaction.reply({
        content: client.t("discord:leave.notYourCommand", { lng: lang }),
        flags: "Ephemeral",
      });
    }

    await interaction.deferUpdate();

    if (interaction.customId.startsWith("leave-confirm")) {
      try {
        await guild.leave();
        await interaction.editReply({
          embeds: [
            new EmbedCorrect()
              .setTitle(client.t("discord:leave.successTitle", { lng: lang }))
              .setDescription(
                client.t("discord:leave.successDesc", { lng: lang, guildName: guild.name, guildId: guild.id }),
              ),
          ],
          components: [],
        });
      } catch (error) {
        console.error(`Error leaving guild ${guild.id}:`, error);
        await interaction.editReply({
          embeds: [
            new ErrorEmbed()
              .setTitle(client.t("discord:leave.leaveFailedTitle", { lng: lang }))
              .setDescription(client.t("discord:leave.leaveFailedDesc", { lng: lang, guildName: guild.name })),
          ],
          components: [],
        });
      }
    } else {
      await interaction.editReply({
        embeds: [
          new EmbedCorrect()
            .setTitle(client.t("discord:leave.cancelledTitle", { lng: lang }))
            .setDescription(client.t("discord:leave.cancelledDesc", { lng: lang, guildName: guild.name })),
        ],
        components: [],
      });
    }

    collector.stop();
  });

  collector.on("end", () => {
    msg.edit({ components: [] }).catch(() => {});
  });
}

async function sendSuccess(message: any, guild: any, client: any, lang: string) {
  return message.channel.send({
    embeds: [
      new EmbedCorrect()
        .setTitle(client.t("discord:leave.successTitle", { lng: lang }))
        .setDescription(
          [
            `${client.getEmoji(message.guild.id, "correct")} ${client.t("discord:leave.successDesc", { lng: lang, guildName: guild.name, guildId: guild.id })}`,
          ].join("\n"),
        )
        .addFields(
          {
            name: client.t("discord:leave.statsTitle", { lng: lang }),
            value: [
              `• ${client.t("discord:leave.owner", { lng: lang })}: ${guild.ownerId ? `<@${guild.ownerId}>` : client.t("discord:leave.unknown", { lng: lang })}`,
              `• ${client.t("discord:leave.members", { lng: lang })}: ${guild.memberCount}`,
              `• ${client.t("discord:leave.channels", { lng: lang })}: ${guild.channels.cache.size}`,
              `• ${client.t("discord:leave.roles", { lng: lang })}: ${guild.roles.cache.size - 1}`,
              `• ${client.t("discord:leave.created", { lng: lang })}: ${guild.createdAt?.toLocaleDateString() || client.t("discord:leave.unknown", { lng: lang })}`,
            ].join("\n"),
            inline: true,
          },
          {
            name: client.t("discord:leave.joinLeaveTitle", { lng: lang }),
            value: [
              `• ${client.t("discord:leave.joined", { lng: lang })}: ${guild.joinedAt?.toLocaleDateString() || client.t("discord:leave.unknown", { lng: lang })}`,
              `• ${client.t("discord:leave.left", { lng: lang })}: ${new Date().toLocaleDateString()}`,
              `• ${client.t("discord:leave.boostLevel", { lng: lang })}: ${guild.premiumTier}`,
              `• ${client.t("discord:leave.boosts", { lng: lang })}: ${guild.premiumSubscriptionCount || 0}`,
            ].join("\n"),
            inline: true,
          },
        )
        .setThumbnail(guild.iconURL({ size: 256 })),
    ],
  });
}

export = leaveCommand;
