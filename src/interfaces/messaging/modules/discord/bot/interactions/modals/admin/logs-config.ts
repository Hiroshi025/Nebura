import { main } from "@/main";
import { EmbedCorrect, ErrorEmbed } from "@shared/utils/extends/discord/embeds.extends";
import { Modals } from "@typings/modules/discord";

const modalLogsEvents: Modals = {
  id: "button-enabled-logevents-modal",
  tickets: false,
  owner: false,
  permissions: ["SendMessages"],
  botpermissions: ["SendMessages"],
  async execute(interaction, client) {
    const channelId = interaction.fields.getTextInputValue("button-enabled-logevents-channelId");
    const eventsToLog = interaction.fields.getTextInputValue("button-enabled-logevents-events");
    if (!interaction.guild || !interaction.channel) return;

    // Detectar idioma preferido del usuario o servidor
    const lang = interaction.locale || interaction.guildLocale || (interaction.guild?.preferredLocale ?? "es-ES");

    const events = eventsToLog.split(",").map((event) => event.trim());
    const data = await main.prisma.myGuild.findUnique({ where: { guildId: interaction.guild.id } });
    if (!data)
      return interaction.reply({
        embeds: [
          new ErrorEmbed().setTitle(client.t("logsConfig.errorTitle", {}, lang)).setDescription(
            [
              `${client.getEmoji(interaction.guild.id, "error")} 
          ${client.t("logsConfig.noData", {}, lang)}`,
              client.t("logsConfig.noDataHint", {}, lang),
            ].join("\n"),
          ),
        ],
      });

    let newEvents: string[] = [];
    // a los eventos ya existes añade los nuevos pero que no se repitan los eventos
    if (data.eventlogs && data.eventlogs.events) {
      newEvents = data.eventlogs.events.filter((event) => !events.includes(event));
    }

    await main.prisma.myGuild.update({
      where: { guildId: interaction.guild.id },
      data: {
        eventlogs: {
          channelId: channelId,
          events: newEvents.concat(events),
          enabled: true,
        },
      },
    });

    await interaction.reply({
      embeds: [
        new EmbedCorrect()
          .setTitle(client.t("logsConfig.successTitle", {}, lang))
          .setDescription(
            [
              `${client.getEmoji(interaction.guild.id, "success")} ${client.t("logsConfig.successDesc", {}, lang)}`,
              `**__${client.t("logsConfig.dataInfo", {}, lang)}__**`,
              `**${client.t("logsConfig.channelId", {}, lang)}** ${channelId}`,
              `**${client.t("logsConfig.eventsToLog", {}, lang)}**`,
              "```json",
              `${JSON.stringify(events, null, 2)}`,
              "```",
              `**${client.t("logsConfig.enabled", {}, lang)}** true`,
            ].join("\n"),
          ),
      ],
    });

    return;
  },
};

export default modalLogsEvents;
