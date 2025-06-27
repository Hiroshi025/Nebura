import { main } from "@/main";
import { clientID } from "@/shared/class/DB";
import { Buttons } from "@typings/modules/discord";
import { EmbedCorrect } from "@utils/extenders/embeds.extend";

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
        await main.prisma.discord.update({
          where: { clientId: clientID },
          data: { webhookURL: null },
        });
      });
  },
};

export = deleteWebhookConfig;
