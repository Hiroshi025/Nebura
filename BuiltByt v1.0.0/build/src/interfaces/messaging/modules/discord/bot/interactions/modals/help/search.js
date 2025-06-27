"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="da6d986d-d282-51f3-9e9b-48e8ed322757")}catch(e){}}();

const embeds_extend_1 = require("../../../../../../../../shared/adapters/extends/embeds.extend");
const ModalSearch = {
    id: `search_modal`,
    tickets: false,
    owner: true,
    permissions: ["SendMessages"],
    botpermissions: ["SendMessages"],
    async execute(interaction, client) {
        if (!interaction.guild || !interaction.channel)
            return;
        const query = interaction.fields.getTextInputValue("search_query").toLowerCase();
        const allCommands = Array.from(client.precommands.values());
        const matchedCommands = allCommands.filter((cmd) => cmd.name.toLowerCase().includes(query) ||
            cmd.aliases?.some((a) => a.toLowerCase().includes(query)) ||
            cmd.description.toLowerCase().includes(query));
        if (matchedCommands.length === 0) {
            return interaction.reply({
                embeds: [
                    new embeds_extend_1.ErrorEmbed()
                        .setTitle("No Results Found")
                        .setDescription([
                        `${client.getEmoji(interaction.guild.id, "error")} No commands found matching your search.`,
                        `Try using different keywords or check the command list.`,
                    ].join("\n")),
                ],
                flags: "Ephemeral",
            });
        }
        const searchEmbed = new embeds_extend_1.EmbedCorrect()
            .setTitle(`Search Results for "${query}"`)
            .setColor("#7289DA")
            .setDescription(`Found ${matchedCommands.length} matching commands`)
            .addFields({
            name: "Commands",
            value: matchedCommands
                .slice(0, 15)
                .map((cmd) => `• \`${cmd.name}\` - ${cmd.description.substring(0, 50)}${cmd.description.length > 50 ? "..." : ""}`)
                .join("\n"),
        });
        if (matchedCommands.length > 15) {
            searchEmbed.setFooter({
                text: `Showing 15 of ${matchedCommands.length} results. Refine your search for more precise results.`,
            });
        }
        await interaction.reply({
            embeds: [searchEmbed],
            flags: "Ephemeral",
        });
        return;
    },
};
module.exports = ModalSearch;
//# sourceMappingURL=search.js.map
//# debugId=da6d986d-d282-51f3-9e9b-48e8ed322757
