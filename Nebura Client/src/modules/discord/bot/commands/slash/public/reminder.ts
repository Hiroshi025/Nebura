import { GuildMember, SlashCommandBuilder } from "discord.js";
import schedule from "node-schedule";

import { main } from "@/main";
import { Command } from "@/modules/discord/structure/utils/builders";
import { EmbedCorrect, ErrorEmbed } from "@extenders/discord/embeds.extender";

export default new Command(
  new SlashCommandBuilder()
    .setName("remind")
    .setDescription("Set a message reminder")
    .addStringOption((option) => {
      return option
        .setName("message")
        .setDescription("The messaged to be reminded")
        .setRequired(true)
        .setMaxLength(2000)
        .setMinLength(10);
    })
    .addIntegerOption((option) => {
      return option
        .setName("time")
        .setDescription("The time to send the message at. (IN MINUTES)")
        .setRequired(true)
        .setMinValue(1);
    }),
  async (client, interaction) => {
    const message = interaction.options.getString("message");
    const time = interaction.options.getInteger("time");
    const { guild, member } = interaction;

    if (!guild || !time || !member)
      return interaction.reply({
        embeds: [
          new ErrorEmbed().setDescription(
            [
              `${client.getEmoji(interaction.guildId as string, "error")} You need to provide a valid guild!`,
              `Please use the command in a server.`,
            ].join("\n"),
          ),
        ],
      });

    if (!message)
      return interaction.reply({
        embeds: [
          new ErrorEmbed().setDescription(
            [
              `${client.getEmoji(guild.id, "error")} You need to provide a message!`,
              `Please use the command with a message.`,
            ].join("\n"),
          ),
        ],
      });

    if (time >= 525960 * 1000) {
      return interaction.reply({
        embeds: [
          new ErrorEmbed().setDescription(
            [
              `${client.getEmoji(guild.id, "error")} You cannot set a reminder for more than \`1 Year\`!`,
              `Please use a smaller time value.`,
            ].join("\n"),
          ),
        ],
      });
    }

    const timeMs = time * 60000;

    const date = new Date(new Date().getTime() + timeMs);

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
        new EmbedCorrect().setTitle(`Set reminder for \`${date.toTimeString()}\`!`).addFields(
          {
            name: `${client.getEmoji(guild.id, "clock")} Will be sent in`,
            value: `${client.getEmoji(guild.id, "reply")} ${time} Minute(s)`,
            inline: true,
          },
          {
            name: `${client.getEmoji(guild.id, "message")} Message`,
            value: `${client.getEmoji(guild.id, "reply")} \`${message}\``,
            inline: true,
          },
        ),
      ],
      flags: "Ephemeral",
    });

    schedule.scheduleJob(date, async () => {
      // Actualizar el estado del recordatorio en la base de datos
      await main.prisma.reminder.updateMany({
        where: { userId: (member as GuildMember).id, guildId: guild.id, remindAt: date },
        data: { isSent: true },
      });

      await (member as GuildMember)
        .send({
          embeds: [
            new EmbedCorrect()
              .setTitle(`Reminder for: ${date.toTimeString()}!`)
              .setDescription(
                [
                  `${client.getEmoji(guild.id, "clock")} Reminder set for \`${time} Minute(s)\`!`,
                  `${client.getEmoji(guild.id, "message")} Message: \`${message}\``,
                ].join("\n"),
              ),
          ],
        })
        .catch(() => {});
    });

    return;
  },
);
