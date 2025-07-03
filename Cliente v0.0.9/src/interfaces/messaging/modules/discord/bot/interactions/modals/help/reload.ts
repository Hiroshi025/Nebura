import { main } from "@/main";
import { Modals } from "@typings/modules/discord";
import { EmbedCorrect, ErrorEmbed } from "@utils/extends/embeds.extension";

const ModalCommandReload: Modals = {
  id: "reload_command_modal",
  tickets: false,
  owner: true,
  permissions: ["SendMessages"],
  botpermissions: ["SendMessages"],
  async execute(interaction, client) {
    if (!interaction.guild || !interaction.channel) return;
    // Detecta el idioma preferido del usuario o servidor
    const lang = interaction.locale || interaction.guild.preferredLocale || "es-ES";
    const commandName = interaction.fields.getTextInputValue("command_name");
    try {
      await main.utils.reloadCommand(commandName);
      await interaction.reply({
        embeds: [
          new EmbedCorrect().setDescription(
            [
              `${client.getEmoji(interaction.guild.id, "correct")} ${client.t("help.reloadSuccess", { commandName, total: client.precommands.size, loaded: client.commands.size, lng: lang })}`,
              `**${client.t("help.reloadCommandField", { lng: lang })}:** \`${commandName}\``,
              `**${client.t("help.reloadTotalField", { lng: lang })}:** ${client.precommands.size} (\`${client.commands.size}\`)`,
            ].join("\n"),
          ),
        ],
        flags: "Ephemeral",
      });
    } catch (error) {
      await interaction.reply({
        embeds: [
          new ErrorEmbed()
            .setTitle(client.t("help.reloadErrorTitle", { lng: lang }))
            .setDescription(
              [
                `${client.getEmoji(interaction.guild.id, "error")} ${client.t("help.reloadErrorDesc", { lng: lang })}`,
                client.t("help.reloadErrorHint", { lng: lang }),
              ].join("\n"),
            ),
        ],
        flags: "Ephemeral",
      });
    }
  },
};

export = ModalCommandReload;
