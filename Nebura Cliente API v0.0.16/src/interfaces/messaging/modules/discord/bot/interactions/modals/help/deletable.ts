import { readdirSync, statSync, unlinkSync } from "fs";
import { join } from "path";

import { EmbedCorrect, ErrorEmbed } from "@shared/utils/extends/discord/embeds.extends";
import { Modals } from "@typings/modules/discord";
import { config } from "@utils/config";
import { logWithLabel } from "@utils/functions/console";

function getCommandsFromFolder(path: string): string[] {
  let commands: string[] = [];
  try {
    const files = readdirSync(path);

    for (const file of files) {
      const fullPath = join(path, file);
      if (statSync(fullPath).isDirectory()) {
        commands = commands.concat(getCommandsFromFolder(fullPath));
      } else if (file.endsWith(".ts") || file.endsWith(".js")) {
        const name = file.replace(/\.(ts|js)/, "");
        commands.push(name);
      }
    }
  } catch (error) {
    logWithLabel("error", [`Error reading commands from folder: ${path}`, `Error: ${error}`].join("\n"));
  }
  return commands;
}

const ModalDeleteCommand: Modals = {
  id: "delete_command_modal",
  tickets: false,
  owner: true,
  permissions: ["SendMessages"],
  botpermissions: ["SendMessages"],
  async execute(interaction, client) {
    if (!interaction.guild || !interaction.channel) return;
    // Detecta el idioma preferido del usuario o servidor
    const lang = interaction.locale || interaction.guild.preferredLocale || "es-ES";
    const commandName = interaction.fields.getTextInputValue("command_to_delete");
    const categories = readdirSync(
      config.modules.discord.configs.default + config.modules.discord.configs.paths.precommands,
    );

    try {
      let found = false;
      for (const category of categories) {
        const categoryPath = `${config.modules.discord.configs.default + config.modules.discord.configs.paths.precommands}${category}`;
        const commands = getCommandsFromFolder(categoryPath);

        if (commands.includes(commandName)) {
          const filePath = join(categoryPath, `${commandName}.ts`);
          unlinkSync(filePath);
          found = true;

          if (client.precommands.has(commandName)) {
            client.precommands.delete(commandName);
          }

          break;
        }
      }

      if (found) {
        await interaction.reply({
          embeds: [
            new EmbedCorrect().setDescription(
              [
                `${client.getEmoji(interaction.guild.id, "correct")} ${client.t("help.deleteSuccess", { commandName, lng: lang })}`,
                `**${client.t("help.deleteCommandField", { lng: lang })}:** \`${commandName}\` ${client.t("help.deleteFromSystem", { lng: lang })}`,
              ].join("\n"),
            ),
          ],
          flags: "Ephemeral",
        });
      } else {
        await interaction.reply({
          embeds: [
            new ErrorEmbed().setDescription(
              [
                `${client.getEmoji(interaction.guild.id, "error")} ${client.t("help.deleteNotFound", { commandName, lng: lang })}`,
                `**${client.t("help.deleteCommandField", { lng: lang })}:** \`${commandName}\` ${client.t("help.deleteNotFoundSystem", { lng: lang })}`,
              ].join("\n"),
            ),
          ],
          flags: "Ephemeral",
        });
      }
    } catch (error) {
      await interaction.reply({
        embeds: [
          new ErrorEmbed()
            .setTitle(client.t("help.deleteErrorTitle", { lng: lang }))
            .setDescription(
              [
                `${client.getEmoji(interaction.guild.id, "error")} ${client.t("help.deleteErrorDesc", { lng: lang })}`,
                client.t("help.deleteErrorHint", { lng: lang }),
              ].join("\n"),
            ),
        ],
        flags: "Ephemeral",
      });
    }
  },
};

export default ModalDeleteCommand;
