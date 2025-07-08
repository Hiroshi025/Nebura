import {
	ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, ComponentType, EmbedBuilder
} from "discord.js";

import { EmbedCorrect, ErrorEmbed } from "@/shared/adapters/extends/embeds.extend";
import { Precommand } from "@typings/modules/discord";

const leaveCommand: Precommand = {
  name: "leave",
  description: "Make the bot leave a specified server",
  examples: ["leave <serverId>", "leave 123456789012345678 --confirm"],
  nsfw: false,
  owner: true,
  cooldown: 5,
  aliases: ["leave-guild", "exit-guild", "part"],
  permissions: ["SendMessages", "EmbedLinks"],
  botpermissions: ["SendMessages", "EmbedLinks"],
  async execute(client, message, args, prefix) {
    if (!message.guild || !message.channel || message.channel.type !== ChannelType.GuildText) {
      return;
    }

    // Parse arguments and flags
    const { serverId, flags } = await parseArguments(args);

    if (!serverId) {
      return await sendUsage(message, prefix);
    }

    const guild = client.guilds.cache.get(serverId);

    if (!guild) {
      return await sendError(message, "Guild not found", `The bot is not in any guild with ID: \`${serverId}\``);
    }

    // If no confirmation flag, send confirmation prompt
    if (!flags.confirm) {
      return await sendConfirmation(message, guild, prefix);
    }

    // Actually leave the guild
    try {
      await guild.leave();
      return await sendSuccess(message, guild);
    } catch (error) {
      console.error(`Error leaving guild ${guild.id}:`, error);
      return await sendError(
        message,
        "Leave failed",
        `An error occurred while trying to leave guild \`${guild.name}\``,
      );
    }
  },
};

async function parseArguments(args: string[]) {
  const flags = {
    confirm: false,
  };

  // Filter out flags
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

async function sendUsage(message: any, prefix: string) {
  return message.channel.send({
    embeds: [
      new ErrorEmbed()
        .setTitle("❌ Missing Arguments")
        .setDescription(
          [
            `${message.client.getEmoji(message.guild.id, "error")} You must specify a server ID to leave.`,
            `> **Usage:** \`${prefix}leave <serverId>\``,
            `> **Example:** \`${prefix}leave 123456789012345678\``,
            `> **Flags:** \`--confirm\` - Skip confirmation`,
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

async function sendConfirmation(message: any, guild: any, prefix: string) {
  const embed = new EmbedBuilder()
    .setTitle(`⚠️ Confirm Guild Leave`)
    .setColor(0xffa500)
    .setDescription(`You are about to make the bot leave **${guild.name}**. This action cannot be undone!`)
    .addFields(
      {
        name: "🆔 Guild ID",
        value: guild.id,
        inline: true,
      },
      {
        name: "👑 Owner",
        value: guild.ownerId ? `<@${guild.ownerId}>` : "Unknown",
        inline: true,
      },
      {
        name: "👥 Members",
        value: guild.memberCount?.toString() || "Unknown",
        inline: true,
      },
      {
        name: "📅 Created",
        value: guild.createdAt?.toLocaleDateString() || "Unknown",
        inline: true,
      },
    )
    .setFooter({
      text: `Use ${prefix}leave ${guild.id} --confirm to skip this confirmation`,
    });

  const confirmButton = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`leave-confirm-${message.author.id}`)
      .setLabel("Confirm Leave")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(`leave-cancel-${message.author.id}`)
      .setLabel("Cancel")
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

  collector.on(
    "collect",
    async (interaction: {
      customId: string;
      user: { id: any };
      reply: any;
      deferUpdate: () => any;
      editReply: (arg0: { embeds: EmbedCorrect[] | ErrorEmbed[]; components: never[] }) => any;
    }) => {
      if (!interaction.customId.includes(interaction.user.id)) {
        return interaction.reply({
          content: "❌ You didn't execute this command.",
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
                .setTitle("✅ Left Guild Successfully")
                .setDescription(`The bot has left **${guild.name}** (\`${guild.id}\`)`),
            ],
            components: [],
          });
        } catch (error) {
          console.error(`Error leaving guild ${guild.id}:`, error);
          await interaction.editReply({
            embeds: [
              new ErrorEmbed()
                .setTitle("❌ Failed to Leave Guild")
                .setDescription(`An error occurred while trying to leave **${guild.name}**`),
            ],
            components: [],
          });
        }
      } else {
        await interaction.editReply({
          embeds: [
            new EmbedCorrect()
              .setTitle("✅ Leave Cancelled")
              .setDescription(`The bot will remain in **${guild.name}**`),
          ],
          components: [],
        });
      }

      collector.stop();
    },
  );

  collector.on("end", () => {
    msg.edit({ components: [] }).catch(() => {});
  });
}

async function sendSuccess(message: any, guild: any) {
  return message.channel.send({
    embeds: [
      new EmbedCorrect()
        .setTitle("✅ Left Guild Successfully")
        .setDescription(
          [
            `${message.client.getEmoji(message.guild.id, "correct")} The bot has left the guild:`,
            `> **Name:** ${guild.name}`,
            `> **ID:** \`${guild.id}\``,
          ].join("\n"),
        )
        .addFields(
          {
            name: "📊 Guild Stats",
            value: [
              `• Owner: ${guild.ownerId ? `<@${guild.ownerId}>` : "Unknown"}`,
              `• Members: ${guild.memberCount}`,
              `• Channels: ${guild.channels.cache.size}`,
              `• Roles: ${guild.roles.cache.size - 1}`,
              `• Created: ${guild.createdAt?.toLocaleDateString() || "Unknown"}`,
            ].join("\n"),
            inline: true,
          },
          {
            name: "📅 Join/Leave Info",
            value: [
              `• Bot joined: ${guild.joinedAt?.toLocaleDateString() || "Unknown"}`,
              `• Left at: ${new Date().toLocaleDateString()}`,
              `• Boost level: ${guild.premiumTier}`,
              `• Boosts: ${guild.premiumSubscriptionCount || 0}`,
            ].join("\n"),
            inline: true,
          },
        )
        .setThumbnail(guild.iconURL({ size: 256 })),
    ],
  });
}

export = leaveCommand;
