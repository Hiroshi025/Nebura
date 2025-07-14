import { EmbedCorrect, ErrorEmbed } from "@shared/utils/extends/discord/embeds.extends";
import { Modals, Precommand } from "@typings/modules/discord";

const ModalSearch: Modals = {
  id: `search_modal`,
  tickets: false,
  owner: true,
  permissions: ["SendMessages"],
  botpermissions: ["SendMessages"],
  async execute(interaction, client) {
    if (!interaction.guild || !interaction.channel) return;
    // Detecta el idioma preferido del usuario o servidor
    const lang = interaction.locale || interaction.guild.preferredLocale || "es-ES";
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
            .setTitle(client.t("help.noResultsTitle", { lng: lang }))
            .setDescription(
              [
                `${client.getEmoji(interaction.guild.id, "error")} ${client.t("help.noResultsDesc", { query, lng: lang })}`,
                client.t("help.searchNoResultsHint", { lng: lang }),
              ].join("\n"),
            ),
        ],
        flags: "Ephemeral",
      });
    }

    const searchEmbed = new EmbedCorrect()
      .setTitle(client.t("help.searchResultsTitle", { query, lng: lang }))
      .setColor("#7289DA")
      .setDescription(client.t("help.searchResultsDesc", { count: matchedCommands.length, lng: lang }))
      .addFields({
        name: client.t("help.commands", { lng: lang }),
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
        text: client.t("help.showingResults", {
          shown: 15,
          total: matchedCommands.length,
          lng: lang,
        }),
      });
    }

    await interaction.reply({
      embeds: [searchEmbed],
      flags: "Ephemeral",
    });

    return;
  },
};

export default ModalSearch;
