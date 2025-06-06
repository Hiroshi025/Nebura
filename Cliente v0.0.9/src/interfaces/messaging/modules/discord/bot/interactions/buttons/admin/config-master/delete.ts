import { main } from "@/main";
import { EmbedCorrect } from "@modules/discord/structure/extends/embeds.extend";
import { Buttons } from "@typings/modules/discord";

const deleteWebhookConfig: Buttons = {
  id: "button-delete-webhook-config",
  tickets: false,
  owner: true,
  permissions: ["SendMessages"],
  botpermissions: ["SendMessages"],
  async execute(interaction, client) {
    if (!interaction.guild || !interaction.channel) return;
    const i = interaction;
    await i
      .update({
        embeds: [
          new EmbedCorrect()
            .setTitle("Configuration")
            .setDescription(
              [
                `${client.getEmoji(interaction.guildId as string, "correct")} **Configuration**`,
                `The webhook URL has been successfully removed, please check \`/config\` again.`,
              ].join("\n"),
            ),
        ],
        components: [],
      })
      .then(async () => {
        await main.prisma.myDiscord.update({
          where: { clientId: client.user?.id },
          data: { webhookURL: null },
        });
      });
  },
};

export = deleteWebhookConfig;
