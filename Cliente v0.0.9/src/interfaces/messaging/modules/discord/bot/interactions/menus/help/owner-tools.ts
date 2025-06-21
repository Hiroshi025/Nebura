import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js";

import { main } from "@/main";
import { EmbedCorrect, ErrorEmbed } from "@extenders/embeds.extend";
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
    if (interaction.values.includes("reload_command")) {
      const reloadModal = new ModalBuilder()
        .setCustomId("reload_command_modal")
        .setTitle("Reload Command");

      const commandInput = new TextInputBuilder()
        .setCustomId("command_name")
        .setLabel("Command Name")
        .setPlaceholder("Enter the command name to reload")
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
                `${client.getEmoji(interaction.guild.id, "correct")} All commands have been reloaded successfully.`,
                `**Total Commands:** ${client.precommands.size} (\`${client.commands.size}\`)`,
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
              .setTitle("Error Reloading Commands")
              .setDescription(
                [
                  `${client.getEmoji(interaction.guild.id, "error")} An error occurred while trying to reload the commands.`,
                  `Please try again later or contact the support team.`,
                ].join("\n"),
              ),
          ],
          flags: "Ephemeral",
        });
      }
    } else if (interaction.values.includes("delete_command")) {
      const deleteModal = new ModalBuilder()
        .setCustomId("delete_command_modal")
        .setTitle("Delete Command");

      const deleteInput = new TextInputBuilder()
        .setCustomId("command_to_delete")
        .setLabel("Command Name")
        .setPlaceholder("Enter the command name to delete")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const deleteRow = new ActionRowBuilder<TextInputBuilder>().addComponents(deleteInput);
      deleteModal.addComponents(deleteRow);

      await interaction.showModal(deleteModal);
    } else if (interaction.values.includes("download_command")) {
      const downloadModal = new ModalBuilder()
        .setCustomId("download_command_modal")
        .setTitle("Download Command");

      const downloadInput = new TextInputBuilder()
        .setCustomId("command_to_download")
        .setLabel("Command Name")
        .setPlaceholder("Enter the command name to download")
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
                `${client.getEmoji(interaction.guild.id, "correct")} The menu has been closed.`,
                `thanks for using the owner tools!`,
              ].join("\n"),
            )
            .setColor("Green"),
        ],
      });
    }
  },
};

export = OwnerSelectMenu;
