import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } from "discord.js";

import { main } from "@/main";
import { EmbedCorrect, ErrorEmbed } from "@shared/utils/extends/discord/embeds.extends";
import { Precommand } from "@typings/modules/discord";

const ChangePrefixCommand: Precommand = {
  name: "changeprefix",
  nameLocalizations: {
    "es-ES": "cambiarprefijo",
    "en-US": "changeprefix",
  },
  description: "Change the bot prefix",
  descriptionLocalizations: {
    "es-ES": "Cambiar el prefijo del bot",
    "en-US": "Change the bot prefix",
  },
  examples: ["changeprefix !", "changeprefix ?", "changeprefix $"],
  nsfw: false,
  owner: false,
  category: "Admin",
  cooldown: 5,
  aliases: ["cp"],
  botpermissions: ["SendMessages", "EmbedLinks"],
  permissions: ["Administrator"],
  async execute(client, message, args, prefix) {
    const lang = message.guild?.preferredLocale || "es-ES";

    if (!message.guild || !message.channel || message.channel.type !== ChannelType.GuildText) return;
    const data = await main.prisma.myGuild.findFirst({ where: { guildId: message.guild.id } });
    if (!data)
      return message.reply({
        embeds: [
          new ErrorEmbed()
            .setTitle(client.t("discord:changeprefix.errorTitle", {}, lang))
            .setDescription(
              [
                client.t("discord:changeprefix.notSetup", { emoji: client.getEmoji(message.guild.id, "error") }, lang),
                client.t("discord:changeprefix.setupHint", { prefix }, lang),
              ].join("\n"),
            ),
        ],
      });

    const newPrefix = args[0];
    if (!newPrefix)
      return message.reply({
        embeds: [
          new ErrorEmbed()
            .setTitle(client.t("discord:changeprefix.errorTitle", {}, lang))
            .setDescription(
              [
                client.t("discord:changeprefix.noPrefix", { emoji: client.getEmoji(message.guild.id, "error") }, lang),
                client.t("discord:changeprefix.usage", { prefix }, lang),
              ].join("\n"),
            ),
        ],
      });

    if (newPrefix.length > 5)
      return message.reply({
        embeds: [
          new ErrorEmbed()
            .setTitle(client.t("discord:changeprefix.errorTitle", {}, lang))
            .setDescription(
              [
                client.t("discord:changeprefix.tooLong", { emoji: client.getEmoji(message.guild.id, "error") }, lang),
                client.t("discord:changeprefix.usage", { prefix }, lang),
              ].join("\n"),
            ),
        ],
      });

    if (newPrefix === data.prefix)
      return message.reply({
        embeds: [
          new ErrorEmbed()
            .setTitle(client.t("discord:changeprefix.errorTitle", {}, lang))
            .setDescription(
              [
                client.t(
                  "discord:changeprefix.samePrefix",
                  { emoji: client.getEmoji(message.guild.id, "error") },
                  lang,
                ),
                client.t("discord:changeprefix.usage", { prefix }, lang),
              ].join("\n"),
            ),
        ],
      });

    const msg = await message.reply({
      embeds: [
        new EmbedCorrect()
          .setTitle(client.t("discord:changeprefix.changingTitle", {}, lang))
          .setDescription(
            [
              client.t("discord:changeprefix.changing", { emoji: client.getEmoji(message.guild.id, "loading") }, lang),
              client.t("discord:changeprefix.newPrefix", { newPrefix }, lang),
              client.t("discord:changeprefix.oldPrefix", { oldPrefix: data.prefix }, lang),
            ].join("\n"),
          ),
      ],
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId("confirm")
            .setLabel(client.t("discord:changeprefix.confirmButton", {}, lang))
            .setEmoji(client.getEmoji(message.guild.id, "error"))
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId("cancel")
            .setLabel(client.t("discord:changeprefix.cancelButton", {}, lang))
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
            new EmbedCorrect().setTitle(client.t("discord:changeprefix.successTitle", {}, lang)).setDescription(
              client.t(
                "discord:changeprefix.successDesc",
                {
                  emoji: client.getEmoji(message.guild.id, "success"),
                  newPrefix,
                  time: new Date().toLocaleString(),
                },
                lang,
              ),
            ),
          ],
          components: [],
        });
      } else if (i.customId === "cancel") {
        await msg.edit({
          embeds: [
            new ErrorEmbed().setTitle(client.t("discord:changeprefix.cancelledTitle", {}, lang)).setDescription(
              client.t(
                "discord:changeprefix.cancelledDesc",
                {
                  emoji: client.getEmoji(message.guild.id, "error"),
                },
                lang,
              ),
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
            new ErrorEmbed().setTitle(client.t("discord:changeprefix.timeoutTitle", {}, lang)).setDescription(
              client.t(
                "discord:changeprefix.timeoutDesc",
                {
                  emoji: client.getEmoji(message.guild.id, "error"),
                },
                lang,
              ),
            ),
          ],
          components: [],
        });
      }
    });

    return;
  },
};

export default ChangePrefixCommand;
