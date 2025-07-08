import { main } from "@/main";
import { Modals } from "@typings/modules/discord";
import { EmbedCorrect, ErrorEmbed } from "@utils/extends/embeds.extension";

const modalWebhook: Modals = {
  id: "modal-webhook-config",
  tickets: false,
  owner: false,
  permissions: ["SendMessages"],
  botpermissions: ["SendMessages"],
  async execute(interaction, client) {
    const input = interaction.fields.getTextInputValue("input-webhook-url");
    if (!interaction.guild || !interaction.channel || !client.user) return;

    // Detecta idioma preferido del usuario o servidor
    const lang = interaction.locale || interaction.guild?.preferredLocale || "en-US";

    const data = await main.DB.findDiscord(client.user.id);

    if (!data)
      return interaction.reply({
        embeds: [
          new ErrorEmbed()
            .setTitle(client.t("webhook.errorTitle", {}, lang))
            .setDescription(
              [
                `${client.getEmoji(interaction.guild.id, "error")} **${client.t("webhook.error", {}, lang)}**`,
                client.t("webhook.noConfig", {}, lang),
              ].join("\n"),
            ),
        ],
        flags: "Ephemeral",
      });

    await main.prisma.discord.update({
      where: {
        clientId: client.user?.id as string,
      },
      data: {
        webhookURL: input,
      },
    });

    return await interaction.reply({
      embeds: [
        new EmbedCorrect()
          .setTitle(client.t("webhook.successTitle", {}, lang))
          .setDescription(
            [
              `${client.getEmoji(interaction.guild.id, "correct")} **${client.t("webhook.success", {}, lang)}**`,
              client.t("webhook.set", { input }, lang),
            ].join("\n"),
          ),
      ],
      flags: "Ephemeral",
    });
  },
};

export = modalWebhook;
