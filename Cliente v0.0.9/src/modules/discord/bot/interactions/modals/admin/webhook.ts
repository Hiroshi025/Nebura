import { main } from "@/main";
import { EmbedCorrect, ErrorEmbed } from "@extenders/discord/embeds.extend";
import { Modals } from "@typings/modules/discord";

const modalWebhook: Modals = {
  id: "modal-webhook-config",
  tickets: true,
  owner: false,
  permissions: ["SendMessages"],
  cooldown: 10,
  botpermissions: ["SendMessages"],
  async execute(interaction, client) {
    const input = interaction.fields.getTextInputValue("input-webhook-url");
    if (!interaction.guild || !interaction.channel || !client.user) return;

    const data = await main.prisma.myDiscord.findUnique({
      where: {
        clientId: client.user.id,
      },
    });

    if (!data)
      return interaction.reply({
        embeds: [
          new ErrorEmbed()
            .setTitle("Error Configuration")
            .setDescription(
              [
                `${client.getEmoji(interaction.guild.id, "error")} **Error**`,
                `No configuration found for this server.`,
              ].join("\n"),
            ),
        ],
        flags: "Ephemeral",
      });

    await main.prisma.myDiscord.update({
      where: {
        clientId: client.user.id,
      },
      data: {
        webhookURL: input,
      },
    });

    return await interaction.reply({
      embeds: [
        new EmbedCorrect()
          .setTitle("Webhook Configuration")
          .setDescription(
            [
              `${client.getEmoji(interaction.guild.id, "correct")} **Success**`,
              `The webhook URL has been set to: \`${input}\``,
            ].join("\n"),
          ),
      ],
      flags: "Ephemeral",
    });
  },
};

export = modalWebhook;
