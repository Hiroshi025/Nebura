import { GuildMember, SlashCommandBuilder } from "discord.js";
import schedule from "node-schedule";

import { Command } from "@/interfaces/messaging/modules/discord/structure/utils/builders";
import { isValidObjectId } from "@/interfaces/messaging/modules/discord/structure/utils/functions";
import { main } from "@/main";
import { EmbedCorrect, ErrorEmbed } from "@utils/extends/embeds.extension";

export default new Command(
  new SlashCommandBuilder()
    .setName("remind")
    .setNameLocalizations({
      "es-ES": "recordar",
    })
    .setDescription("Set a message reminder")
    .setDescriptionLocalizations({
      "es-ES": "Establecer un recordatorio de mensaje",
    })
    .addStringOption((option) => {
      return option
        .setName("message")
        .setNameLocalizations({
          "es-ES": "mensaje",
        })
        .setDescription("The messaged to be reminded")
        .setDescriptionLocalizations({
          "es-ES": "El mensaje a recordar",
        })
        .setRequired(true)
        .setMaxLength(2000)
        .setMinLength(10);
    })
    .addIntegerOption((option) => {
      return option
        .setName("time")
        .setNameLocalizations({
          "es-ES": "tiempo",
        })
        .setDescription("The time to send the message at. (IN MINUTES)")
        .setDescriptionLocalizations({
          "es-ES": "El tiempo para enviar el mensaje. (EN MINUTOS)",
        })
        .setRequired(true)
        .setMinValue(1);
    }),
  async (client, interaction) => {
    // Obtener idioma preferido del usuario o guild
    const lang =
      (interaction.guild &&
        (await main.prisma.myGuild.findUnique({ where: { guildId: interaction.guild.id } }))?.lenguage) ||
      interaction.locale ||
      "es-ES";
    const t = (key: string, options?: any) => client.translations.t("discord:" + key, { lng: lang, ...options });

    const message = interaction.options.getString("message");
    const time = interaction.options.getInteger("time");
    const { guild, member } = interaction;

    if (!guild || !time || !member)
      return interaction.reply({
        embeds: [
          new ErrorEmbed().setDescription(
            [
              `${client.getEmoji(interaction.guildId as string, "error")} ${t("reminder.errors.noGuild")}`,
              t("reminder.errors.useInServer"),
            ].join("\n"),
          ),
        ],
      });

    if (!message)
      return interaction.reply({
        embeds: [
          new ErrorEmbed().setDescription(
            [
              `${client.getEmoji(guild.id, "error")} ${t("reminder.errors.noMessage")}`,
              t("reminder.errors.useWithMessage"),
            ].join("\n"),
          ),
        ],
      });

    if (time >= 525960 * 1000) {
      return interaction.reply({
        embeds: [
          new ErrorEmbed().setDescription(
            [
              `${client.getEmoji(guild.id, "error")} ${t("reminder.errors.tooLong")}`,
              t("reminder.errors.smallerTime"),
            ].join("\n"),
          ),
        ],
      });
    }

    const timeMs = time * 60000;

    const guuldIdValidate = await isValidObjectId(guild.id);
    const date = new Date(new Date().getTime() + timeMs);

    if (!guuldIdValidate) {
      return interaction.reply({
        embeds: [
          new ErrorEmbed().setDescription(
            [
              `${client.getEmoji(guild.id, "error")} ${t("reminder.errors.noGuild")}`,
              t("reminder.errors.useInServer"),
            ].join("\n"),
          ),
        ],
      });
    }

    await main.prisma.reminder.create({
      data: {
        userId: (member as GuildMember).id,
        guildId: guild.id,
        message: message,
        remindAt: date,
      },
    });

    await interaction.reply({
      embeds: [
        new EmbedCorrect().setTitle(t("reminder.setTitle", { time: date.toTimeString() })).addFields(
          {
            name: `${client.getEmoji(guild.id, "clock")} ${t("reminder.willBeSentIn")}`,
            value: `${client.getEmoji(guild.id, "reply")} ${t("reminder.minutes", { count: time })}`,
            inline: true,
          },
          {
            name: `${client.getEmoji(guild.id, "message")} ${t("reminder.message")}`,
            value: `${client.getEmoji(guild.id, "reply")} \`${message}\``,
            inline: true,
          },
        ),
      ],
      flags: "Ephemeral",
    });

    schedule.scheduleJob(date, async () => {
      await main.prisma.reminder.updateMany({
        where: { userId: (member as GuildMember).id, guildId: guild.id, remindAt: date },
        data: { isSent: true },
      });

      await (member as GuildMember)
        .send({
          embeds: [
            new EmbedCorrect()
              .setTitle(t("reminder.dmTitle", { time: date.toTimeString() }))
              .setDescription(
                [
                  `${client.getEmoji(guild.id, "clock")} ${t("reminder.reminderSetFor", { count: time })}`,
                  `${client.getEmoji(guild.id, "message")} ${t("reminder.message")}: \`${message}\``,
                ].join("\n"),
              ),
          ],
        })
        .catch(() => {});
    });

    return;
  },
  undefined,
  10,
  true,
);
