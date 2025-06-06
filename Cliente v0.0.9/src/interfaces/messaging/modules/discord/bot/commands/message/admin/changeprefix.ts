import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } from "discord.js";

import { main } from "@/main";
import { EmbedCorrect, ErrorEmbed } from "@/shared/structure/extenders/discord/embeds.extend";
import { Precommand } from "@typings/modules/discord";

const ChangePrefixCommand: Precommand = {
  name: "changeprefix",
  description: "Change the bot prefix",
  examples: ["changeprefix !", "changeprefix ?", "changeprefix $"],
  nsfw: false,
  owner: false,
  aliases: ["cp"],
  botpermissions: ["SendMessages"],
  permissions: ["Administrator"],
  async execute(client, message, args, prefix) {
    if (!message.guild || !message.channel || message.channel.type !== ChannelType.GuildText)
      return;
    const data = await main.prisma.myGuild.findFirst({ where: { guildId: message.guild.id } });
    if (!data)
      return message.reply({
        embeds: [
          new ErrorEmbed()
            .setTitle("Error Change Prefix (Admin)")
            .setDescription(
              [
                `${client.getEmoji(message.guild.id, "error")} You need to set up the bot in this server first.`,
                `Use the command \`${prefix}setup\` to set up the bot.`,
              ].join("\n"),
            ),
        ],
      });

    const newPrefix = args[0];
    if (!newPrefix)
      return message.reply({
        embeds: [
          new ErrorEmbed()
            .setTitle("Error Change Prefix (Admin)")
            .setDescription(
              [
                `${client.getEmoji(message.guild.id, "error")} You need to provide a new prefix.`,
                `Usage: \`${prefix}changeprefix <new prefix>\``,
              ].join("\n"),
            ),
        ],
      });

    if (newPrefix.length > 5)
      return message.reply({
        embeds: [
          new ErrorEmbed()
            .setTitle("Error Change Prefix (Admin)")
            .setDescription(
              [
                `${client.getEmoji(message.guild.id, "error")} The prefix cannot be longer than 5 characters.`,
                `Usage: \`${prefix}changeprefix <new prefix>\``,
              ].join("\n"),
            ),
        ],
      });

    if (newPrefix === data.prefix)
      return message.reply({
        embeds: [
          new ErrorEmbed()
            .setTitle("Error Change Prefix (Admin)")
            .setDescription(
              [
                `${client.getEmoji(message.guild.id, "error")} The prefix cannot be the same as the current prefix.`,
                `Usage: \`${prefix}changeprefix <new prefix>\``,
              ].join("\n"),
            ),
        ],
      });

    const msg = await message.reply({
      embeds: [
        new EmbedCorrect()
          .setTitle("Change Prefix (Admin)")
          .setDescription(
            [
              `${client.getEmoji(message.guild.id, "loading")} Changing the prefix...`,
              `New prefix: \`${newPrefix}\``,
              `Old prefix: \`${data.prefix}\``,
            ].join("\n"),
          ),
      ],
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId("confirm")
            .setLabel("Confirm")
            .setEmoji(client.getEmoji(message.guild.id, "error"))
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId("cancel")
            .setLabel("Cancel")
            .setEmoji(client.getEmoji(message.guild.id, "correct"))
            .setStyle(ButtonStyle.Danger),
        ),
      ],
    });

    const filter = (i: any) => i.user.id === message.author.id && i.message.id === msg.id;
    const collector = msg.createMessageComponentCollector({ filter, time: 60000 });

    collector.on("collect", async (i) => {
      if (!message.guild || !message.channel) return;
      if (i.customId === "confirm") {
        await main.prisma.myGuild.update({
          where: { guildId: message.guild.id },
          data: { prefix: newPrefix },
        });
        await msg.edit({
          embeds: [
            new EmbedCorrect()
              .setTitle("Change Prefix (Admin)")
              .setDescription(
                [
                  `${client.getEmoji(message.guild.id, "success")} Prefix changed successfully.`,
                  `New prefix: \`${newPrefix}\`, Time: \`${new Date().toLocaleString()}\``,
                ].join("\n"),
              ),
          ],
          components: [],
        });
      } else if (i.customId === "cancel") {
        await msg.edit({
          embeds: [
            new ErrorEmbed()
              .setTitle("Change Prefix (Admin)")
              .setDescription(
                [
                  `${client.getEmoji(message.guild.id, "error")} Prefix change cancelled.`,
                  `thanks for using the command!`,
                ].join("\n"),
              ),
          ],
          components: [],
        });
      }
    });

    collector.on("end", async (collected) => {
      if (!message.guild || !message.channel) return;
      if (collected.size === 0) {
        await msg.edit({
          embeds: [
            new ErrorEmbed()
              .setTitle("Change Prefix (Admin)")
              .setDescription(
                [
                  `${client.getEmoji(message.guild.id, "error")} Prefix change timed out.`,
                  `thanks for using the command!`,
                ].join("\n"),
              ),
          ],
          components: [],
        });
      }
    });

    return;
  },
};

export = ChangePrefixCommand;
