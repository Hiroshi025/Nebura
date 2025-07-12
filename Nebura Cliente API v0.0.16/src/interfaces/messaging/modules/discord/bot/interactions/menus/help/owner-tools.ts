import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js";

import { main } from "@/main";
import { EmbedCorrect, ErrorEmbed } from "@shared/utils/extends/discord/embeds.extends";
import { Menus } from "@typings/modules/discord";

const OwnerSelectMenu: Menus = {
  id: "owner_tools_select",
  maintenance: false,
  tickets: false,
  owner: true,
  permissions: ["SendMessages"],
  botpermissions: ["SendMessages"],
  async execute(interaction, client) {
    if (!interaction.guild || !interaction.channel || !interaction.member) return;
    // Detecta el idioma preferido del usuario o servidor
    const lang = interaction.locale || interaction.guildLocale || "es-ES";
    if (interaction.values.includes("reload_command")) {
      const reloadModal = new ModalBuilder()
        .setCustomId("reload_command_modal")
        .setTitle(client.t("help.reloadCommandModalTitle", {}, lang)); // multilenguaje

      const commandInput = new TextInputBuilder()
        .setCustomId("command_name")
        .setLabel(client.t("help.reloadCommandModalLabel", {}, lang))
        .setPlaceholder(client.t("help.reloadCommandModalPlaceholder", {}, lang))
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const modalRow = new ActionRowBuilder<TextInputBuilder>().addComponents(commandInput);
      reloadModal.addComponents(modalRow);

      await interaction.showModal(reloadModal);
    } else if (interaction.values.includes("reload_all")) {
      try {
        await main.utils.loadCommands();
        await interaction.reply({
          embeds: [
            new EmbedCorrect().setDescription(
              [
                `${client.getEmoji(interaction.guild.id, "correct")} ${client.t("help.reloadAllSuccess", {}, lang)}`,
                `**${client.t("help.reloadTotalField", {}, lang)}:** ${client.precommands.size} (\`${client.commands.size}\`)`,
              ].join("\n"),
            ),
          ],
          flags: "Ephemeral",
        });
      } catch (error) {
        console.error(error);
        await interaction.reply({
          embeds: [
            new ErrorEmbed()
              .setTitle(client.t("help.reloadErrorTitle", {}, lang))
              .setDescription(
                [
                  `${client.getEmoji(interaction.guild.id, "error")} ${client.t("help.reloadErrorDesc", {}, lang)}`,
                  client.t("help.reloadErrorHint", {}, lang),
                ].join("\n"),
              ),
          ],
          flags: "Ephemeral",
        });
      }
    } else if (interaction.values.includes("delete_command")) {
      const deleteModal = new ModalBuilder()
        .setCustomId("delete_command_modal")
        .setTitle(client.t("help.deleteCommandModalTitle", {}, lang));

      const deleteInput = new TextInputBuilder()
        .setCustomId("command_to_delete")
        .setLabel(client.t("help.deleteCommandModalLabel", {}, lang))
        .setPlaceholder(client.t("help.deleteCommandModalPlaceholder", {}, lang))
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const deleteRow = new ActionRowBuilder<TextInputBuilder>().addComponents(deleteInput);
      deleteModal.addComponents(deleteRow);

      await interaction.showModal(deleteModal);
    } else if (interaction.values.includes("download_command")) {
      const downloadModal = new ModalBuilder()
        .setCustomId("download_command_modal")
        .setTitle(client.t("help.downloadCommandModalTitle", {}, lang));

      const downloadInput = new TextInputBuilder()
        .setCustomId("command_to_download")
        .setLabel(client.t("help.downloadCommandModalLabel", {}, lang))
        .setPlaceholder(client.t("help.downloadCommandModalPlaceholder", {}, lang))
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const downloadRow = new ActionRowBuilder<TextInputBuilder>().addComponents(downloadInput);
      downloadModal.addComponents(downloadRow);

      await interaction.showModal(downloadModal);
    } else if (interaction.values.includes("cancel")) {
      await interaction.update({
        embeds: [
          new EmbedCorrect()
            .setDescription(
              [
                `${client.getEmoji(interaction.guild.id, "correct")} ${client.t("help.menuClosed", {}, lang)}`,
                client.t("help.menuClosedThanks", {}, lang),
              ].join("\n"),
            )
            .setColor("Green"),
        ],
      });
    }
  },
};

export default OwnerSelectMenu;
