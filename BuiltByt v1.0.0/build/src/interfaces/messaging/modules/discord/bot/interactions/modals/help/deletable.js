"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="9b2b339f-4695-5df0-ad34-0954622b44ed")}catch(e){}}();

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
const ModalDeleteCommand = {
    id: "delete_command_modal",
    tickets: false,
    owner: true,
    permissions: ["SendMessages"],
    botpermissions: ["SendMessages"],
    async execute(interaction, client) {
        if (!interaction.guild || !interaction.channel)
            return;
        const commandName = interaction.fields.getTextInputValue("command_to_delete");
        const categories = (0, fs_1.readdirSync)(config_1.config.modules.discord.configs.default + config_1.config.modules.discord.configs.paths.precommands);
        try {
            let found = false;
            for (const category of categories) {
                const categoryPath = `${config_1.config.modules.discord.configs.default + config_1.config.modules.discord.configs.paths.precommands}${category}`;
                const commands = getCommandsFromFolder(categoryPath);
                if (commands.includes(commandName)) {
                    const filePath = (0, path_1.join)(categoryPath, `${commandName}.ts`);
                    (0, fs_1.unlinkSync)(filePath);
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
                        new embeds_extend_1.EmbedCorrect().setDescription([
                            `${client.getEmoji(interaction.guild.id, "correct")} Command \`${commandName}\` deleted successfully.`,
                            `**Command:** \`${commandName}\` deleted from the system.`,
                        ].join("\n")),
                    ],
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
                    new embeds_extend_1.ErrorEmbed()
                        .setTitle("Error Deleting Command")
                        .setDescription([
                        `${client.getEmoji(interaction.guild.id, "error")} An error occurred while trying to delete the command.`,
                        `Please try again later or contact the support team.`,
                    ].join("\n")),
                ],
                flags: "Ephemeral",
            });
        }
    },
};
module.exports = ModalDeleteCommand;
//# sourceMappingURL=deletable.js.map
//# debugId=9b2b339f-4695-5df0-ad34-0954622b44ed
