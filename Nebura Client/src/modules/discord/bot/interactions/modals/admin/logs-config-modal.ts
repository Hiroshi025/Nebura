import { main } from "@/main";
import { EmbedCorrect, ErrorEmbed } from "@extenders/discord/embeds.extender";
import { Modals } from "@typings/discord";

const modalLogsEvents: Modals = {
  id: "button-enabled-logevents-modal",
  tickets: true,
  owner: false,
  permissions: ["SendMessages"],
  botpermissions: ["SendMessages"],
  async execute(interaction, client) {
    const channelId = interaction.fields.getTextInputValue("button-enabled-logevents-channelId");
    const eventsToLog = interaction.fields.getTextInputValue("button-enabled-logevents-events");
    if (!interaction.guild || !interaction.channel) return;

    const events = eventsToLog.split(",").map((event) => event.trim());
    const data = await main.prisma.myGuild.findUnique({ where: { guildId: interaction.guild.id } });
    if (!data)
      return interaction.reply({
        embeds: [
          new ErrorEmbed().setTitle("Error - Logs Configuration").setDescription(
            [
              `${client.getEmoji(interaction.guild.id, "error")} 
            **No data found for this server.**`,
              `Please make sure the bot is set up correctly and try again.`,
            ].join("\n"),
          ),
        ],
      });

    let newEvents: string[] = []
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
          .setTitle("Logs Configuration")
          .setDescription(
            [
              `${client.getEmoji(interaction.guild.id, "success")} **Logs configuration updated successfully!**`,
              `**__Data Information_**`,
              `**Channel ID:** ${channelId}`,
              `**Events to Log:*`,
              `\`\`\`json`,
              `${JSON.stringify(events, null, 2)}`,
              `\`\`\``,
              `**Enabled:** true`,
            ].join("\n"),
          ),
      ],
    });

    return;
  },
};

export = modalLogsEvents;
