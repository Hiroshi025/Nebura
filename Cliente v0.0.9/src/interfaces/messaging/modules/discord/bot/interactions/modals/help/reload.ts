import { main } from "@/main";
import { Modals } from "@typings/modules/discord";
import { EmbedCorrect, ErrorEmbed } from "@utils/extenders/embeds.extend";

const ModalCommandReload: Modals = {
  id: "reload_command_modal",
  tickets: false,
  owner: true,
  permissions: ["SendMessages"],
  botpermissions: ["SendMessages"],
  async execute(interaction, client) {
    if (!interaction.guild || !interaction.channel) return;
    const commandName = interaction.fields.getTextInputValue("command_name");
    try {
      await main.utils.reloadCommand(commandName);
      await interaction.reply({
        embeds: [
          new EmbedCorrect().setDescription(
            [
              `${client.getEmoji(interaction.guild.id, "correct")} Command \`${commandName}\` reloaded successfully.`,
              `**Command:** \`${commandName}\``,
              `**Total Commands:** ${client.precommands.size} (\`${client.commands.size}\`)`,
            ].join("\n"),
          ),
        ],
        flags: "Ephemeral",
      });
    } catch (error) {
      await interaction.reply({
        embeds: [
          new ErrorEmbed()
            .setTitle("Error Reloading Command")
            .setDescription(
              [
                `${client.getEmoji(interaction.guild.id, "error")} An error occurred while trying to reload the command.`,
                `Please try again later or contact the support team.`,
              ].join("\n"),
            ),
        ],
        flags: "Ephemeral",
      });
    }
  },
};

export = ModalCommandReload;
