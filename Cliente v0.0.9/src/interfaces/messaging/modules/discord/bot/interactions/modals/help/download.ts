import { AttachmentBuilder } from "discord.js";
import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";

import { EmbedCorrect, ErrorEmbed } from "@extenders/embeds.extend";
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
    logWithLabel(
      "error",
      [`Error reading commands from folder: ${path}`, `Error: ${error}`].join("\n"),
    );
  }
  return commands;
}

const ModalDownloadCommand: Modals = {
  id: "download_command_modal",
  tickets: false,
  owner: true,
  permissions: ["SendMessages"],
  botpermissions: ["SendMessages"],
  async execute(interaction, client) {
    if (!interaction.guild || !interaction.channel) return;
    const commandName = interaction.fields.getTextInputValue("command_to_download");
    const categories = readdirSync(
      config.modules.discord.configs.default + config.modules.discord.configs.precommands,
    );

    try {
      let found = false;
      let fileContent = "";

      for (const category of categories) {
        const categoryPath = `${config.modules.discord.configs.default + config.modules.discord.configs.precommands}${category}`;
        const commands = getCommandsFromFolder(categoryPath);

        if (commands.includes(commandName)) {
          const filePath = join(categoryPath, `${commandName}.ts`);
          fileContent = readFileSync(filePath, "utf-8");
          found = true;
          break;
        }
      }

      if (found) {
        const attachment = new AttachmentBuilder(Buffer.from(fileContent), {
          name: `${commandName}.ts`,
          description: `Source code for ${commandName} command`,
        });

        await interaction.reply({
          embeds: [
            new EmbedCorrect().setDescription(
              [
                `${client.getEmoji(interaction.guild.id, "correct")} Command \`${commandName}\` downloaded successfully.`,
                `**Command:** \`${commandName}\` `,
              ].join("\n"),
            ),
          ],
          files: [attachment],
          flags: "Ephemeral",
        });
      } else {
        await interaction.reply({
          embeds: [
            new ErrorEmbed().setDescription(
              [
                `${client.getEmoji(interaction.guild.id, "error")} Command \`${commandName}\` not found.`,
                `**Command:** \`${commandName}\` not found in the system.`,
              ].join("\n"),
            ),
          ],
          flags: "Ephemeral",
        });
      }
    } catch (error) {
      await interaction.reply({
        embeds: [
          new ErrorEmbed().setDescription(
            [
              `${client.getEmoji(interaction.guild.id, "error")} An error occurred while trying to download the command.`,
              `**Command:** \`${commandName}\``,
              `Error: ${error}`,
            ].join("\n"),
          ),
        ],
        flags: "Ephemeral",
      });
    }
  },
};

export = ModalDownloadCommand;
