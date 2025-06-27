"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="6568f5ac-8a9a-558f-897d-4dd149024518")}catch(e){}}();

const main_1 = require("../../../../../../../../main");
const embeds_extend_1 = require("../../../../../../../../shared/adapters/extends/embeds.extend");
const ModalCommandReload = {
    id: "reload_command_modal",
    tickets: false,
    owner: true,
    permissions: ["SendMessages"],
    botpermissions: ["SendMessages"],
    async execute(interaction, client) {
        if (!interaction.guild || !interaction.channel)
            return;
        const commandName = interaction.fields.getTextInputValue("command_name");
        try {
            await main_1.main.utils.reloadCommand(commandName);
            await interaction.reply({
                embeds: [
                    new embeds_extend_1.EmbedCorrect().setDescription([
                        `${client.getEmoji(interaction.guild.id, "correct")} Command \`${commandName}\` reloaded successfully.`,
                        `**Command:** \`${commandName}\``,
                        `**Total Commands:** ${client.precommands.size} (\`${client.commands.size}\`)`,
                    ].join("\n")),
                ],
                flags: "Ephemeral",
            });
        }
        catch (error) {
            await interaction.reply({
                embeds: [
                    new embeds_extend_1.ErrorEmbed()
                        .setTitle("Error Reloading Command")
                        .setDescription([
                        `${client.getEmoji(interaction.guild.id, "error")} An error occurred while trying to reload the command.`,
                        `Please try again later or contact the support team.`,
                    ].join("\n")),
                ],
                flags: "Ephemeral",
            });
        }
    },
};
module.exports = ModalCommandReload;
//# sourceMappingURL=reload.js.map
//# debugId=6568f5ac-8a9a-558f-897d-4dd149024518
