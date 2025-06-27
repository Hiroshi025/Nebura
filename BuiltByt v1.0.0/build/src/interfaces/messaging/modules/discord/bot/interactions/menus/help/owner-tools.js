"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="9bf13432-08cf-5e8b-a66b-e8d13a7bf03d")}catch(e){}}();

const discord_js_1 = require("discord.js");
const main_1 = require("../../../../../../../../main");
const embeds_extend_1 = require("../../../../../../../../shared/adapters/extends/embeds.extend");
const OwnerSelectMenu = {
    id: "owner_tools_select",
    maintenance: false,
    tickets: false,
    owner: true,
    permissions: ["SendMessages"],
    botpermissions: ["SendMessages"],
    async execute(interaction, client) {
        if (!interaction.guild || !interaction.channel || !interaction.member)
            return;
        if (interaction.values.includes("reload_command")) {
            const reloadModal = new discord_js_1.ModalBuilder().setCustomId("reload_command_modal").setTitle("Reload Command");
            const commandInput = new discord_js_1.TextInputBuilder()
                .setCustomId("command_name")
                .setLabel("Command Name")
                .setPlaceholder("Enter the command name to reload")
                .setStyle(discord_js_1.TextInputStyle.Short)
                .setRequired(true);
            const modalRow = new discord_js_1.ActionRowBuilder().addComponents(commandInput);
            reloadModal.addComponents(modalRow);
            await interaction.showModal(reloadModal);
        }
        else if (interaction.values.includes("reload_all")) {
            try {
                await main_1.main.utils.loadCommands();
                await interaction.reply({
                    embeds: [
                        new embeds_extend_1.EmbedCorrect().setDescription([
                            `${client.getEmoji(interaction.guild.id, "correct")} All commands have been reloaded successfully.`,
                            `**Total Commands:** ${client.precommands.size} (\`${client.commands.size}\`)`,
                        ].join("\n")),
                    ],
                    flags: "Ephemeral",
                });
            }
            catch (error) {
                console.error(error);
                await interaction.reply({
                    embeds: [
                        new embeds_extend_1.ErrorEmbed()
                            .setTitle("Error Reloading Commands")
                            .setDescription([
                            `${client.getEmoji(interaction.guild.id, "error")} An error occurred while trying to reload the commands.`,
                            `Please try again later or contact the support team.`,
                        ].join("\n")),
                    ],
                    flags: "Ephemeral",
                });
            }
        }
        else if (interaction.values.includes("delete_command")) {
            const deleteModal = new discord_js_1.ModalBuilder().setCustomId("delete_command_modal").setTitle("Delete Command");
            const deleteInput = new discord_js_1.TextInputBuilder()
                .setCustomId("command_to_delete")
                .setLabel("Command Name")
                .setPlaceholder("Enter the command name to delete")
                .setStyle(discord_js_1.TextInputStyle.Short)
                .setRequired(true);
            const deleteRow = new discord_js_1.ActionRowBuilder().addComponents(deleteInput);
            deleteModal.addComponents(deleteRow);
            await interaction.showModal(deleteModal);
        }
        else if (interaction.values.includes("download_command")) {
            const downloadModal = new discord_js_1.ModalBuilder().setCustomId("download_command_modal").setTitle("Download Command");
            const downloadInput = new discord_js_1.TextInputBuilder()
                .setCustomId("command_to_download")
                .setLabel("Command Name")
                .setPlaceholder("Enter the command name to download")
                .setStyle(discord_js_1.TextInputStyle.Short)
                .setRequired(true);
            const downloadRow = new discord_js_1.ActionRowBuilder().addComponents(downloadInput);
            downloadModal.addComponents(downloadRow);
            await interaction.showModal(downloadModal);
        }
        else if (interaction.values.includes("cancel")) {
            await interaction.update({
                embeds: [
                    new embeds_extend_1.EmbedCorrect()
                        .setDescription([
                        `${client.getEmoji(interaction.guild.id, "correct")} The menu has been closed.`,
                        `thanks for using the owner tools!`,
                    ].join("\n"))
                        .setColor("Green"),
                ],
            });
        }
    },
};
module.exports = OwnerSelectMenu;
//# sourceMappingURL=owner-tools.js.map
//# debugId=9bf13432-08cf-5e8b-a66b-e8d13a7bf03d
