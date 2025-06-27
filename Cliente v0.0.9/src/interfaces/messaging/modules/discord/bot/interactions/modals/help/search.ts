import { Modals, Precommand } from "@typings/modules/discord";
import { EmbedCorrect, ErrorEmbed } from "@utils/extends/embeds.extension";

const ModalSearch: Modals = {
  id: `search_modal`,
  tickets: false,
  owner: true,
  permissions: ["SendMessages"],
  botpermissions: ["SendMessages"],
  async execute(interaction, client) {
    if (!interaction.guild || !interaction.channel) return;
    const query = interaction.fields.getTextInputValue("search_query").toLowerCase();
    const allCommands = Array.from(client.precommands.values());

    const matchedCommands = allCommands.filter(
      (cmd) =>
        (cmd as Precommand).name.toLowerCase().includes(query) ||
        (cmd as Precommand).aliases?.some((a) => a.toLowerCase().includes(query)) ||
        (cmd as Precommand).description.toLowerCase().includes(query),
    );

    if (matchedCommands.length === 0) {
      return interaction.reply({
        embeds: [
          new ErrorEmbed()
            .setTitle("No Results Found")
            .setDescription(
              [
                `${client.getEmoji(interaction.guild.id, "error")} No commands found matching your search.`,
                `Try using different keywords or check the command list.`,
              ].join("\n"),
            ),
        ],
        flags: "Ephemeral",
      });
    }

    const searchEmbed = new EmbedCorrect()
      .setTitle(`Search Results for "${query}"`)
      .setColor("#7289DA")
      .setDescription(`Found ${matchedCommands.length} matching commands`)
      .addFields({
        name: "Commands",
        value: matchedCommands
          .slice(0, 15)
          .map(
            (cmd) =>
              `• \`${(cmd as Precommand).name}\` - ${(cmd as Precommand).description.substring(0, 50)}${(cmd as Precommand).description.length > 50 ? "..." : ""}`,
          )
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

export = ModalSearch;
