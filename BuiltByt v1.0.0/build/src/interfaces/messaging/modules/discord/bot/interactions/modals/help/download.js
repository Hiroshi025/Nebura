"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="3747d263-d671-57ac-b375-66853b422ec9")}catch(e){}}();

const discord_js_1 = require("discord.js");
const fs_1 = require("fs");
const path_1 = require("path");
const embeds_extend_1 = require("../../../../../../../../shared/adapters/extends/embeds.extend");
const config_1 = require("../../../../../../../../shared/utils/config");
const console_1 = require("../../../../../../../../shared/utils/functions/console");
function getCommandsFromFolder(path) {
    let commands = [];
    try {
        const files = (0, fs_1.readdirSync)(path);
        for (const file of files) {
            const fullPath = (0, path_1.join)(path, file);
            if ((0, fs_1.statSync)(fullPath).isDirectory()) {
                commands = commands.concat(getCommandsFromFolder(fullPath));
            }
            else if (file.endsWith(".ts") || file.endsWith(".js")) {
                const name = file.replace(/\.(ts|js)/, "");
                commands.push(name);
            }
        }
    }
    catch (error) {
        (0, console_1.logWithLabel)("error", [`Error reading commands from folder: ${path}`, `Error: ${error}`].join("\n"));
    }
    return commands;
}
const ModalDownloadCommand = {
    id: "download_command_modal",
    tickets: false,
    owner: true,
    permissions: ["SendMessages"],
    botpermissions: ["SendMessages"],
    async execute(interaction, client) {
        if (!interaction.guild || !interaction.channel)
            return;
        const commandName = interaction.fields.getTextInputValue("command_to_download");
        const categories = (0, fs_1.readdirSync)(config_1.config.modules.discord.configs.default + config_1.config.modules.discord.configs.paths.precommands);
        try {
            let found = false;
            let fileContent = "";
            for (const category of categories) {
                const categoryPath = `${config_1.config.modules.discord.configs.default + config_1.config.modules.discord.configs.paths.precommands}${category}`;
                const commands = getCommandsFromFolder(categoryPath);
                if (commands.includes(commandName)) {
                    const filePath = (0, path_1.join)(categoryPath, `${commandName}.ts`);
                    fileContent = (0, fs_1.readFileSync)(filePath, "utf-8");
                    found = true;
                    break;
                }
            }
            if (found) {
                const attachment = new discord_js_1.AttachmentBuilder(Buffer.from(fileContent), {
                    name: `${commandName}.ts`,
                    description: `Source code for ${commandName} command`,
                });
                await interaction.reply({
                    embeds: [
                        new embeds_extend_1.EmbedCorrect().setDescription([
                            `${client.getEmoji(interaction.guild.id, "correct")} Command \`${commandName}\` downloaded successfully.`,
                            `**Command:** \`${commandName}\` `,
                        ].join("\n")),
                    ],
                    files: [attachment],
                    flags: "Ephemeral",
                });
            }
            else {
                await interaction.reply({
                    embeds: [
                        new embeds_extend_1.ErrorEmbed().setDescription([
                            `${client.getEmoji(interaction.guild.id, "error")} Command \`${commandName}\` not found.`,
                            `**Command:** \`${commandName}\` not found in the system.`,
                        ].join("\n")),
                    ],
                    flags: "Ephemeral",
                });
            }
        }
        catch (error) {
            await interaction.reply({
                embeds: [
                    new embeds_extend_1.ErrorEmbed().setDescription([
                        `${client.getEmoji(interaction.guild.id, "error")} An error occurred while trying to download the command.`,
                        `**Command:** \`${commandName}\``,
                        `Error: ${error}`,
                    ].join("\n")),
                ],
                flags: "Ephemeral",
            });
        }
    },
};
module.exports = ModalDownloadCommand;
//# sourceMappingURL=download.js.map
//# debugId=3747d263-d671-57ac-b375-66853b422ec9
