import axios from "axios";
import { SlashCommandBuilder } from "discord.js";
import moment from "moment";

import { Command } from "@/interfaces/messaging/modules/discord/structure/utils/builders";
import translate from "@iamtraction/google-translate";
import { Entretenment } from "@typings/modules/discord";
import { EmbedCorrect, ErrorEmbed } from "@utils/extends/embeds.extension";

export default new Command(
  new SlashCommandBuilder()
    .setName("anime")
    .setDescription("Search for information about an anime")
    .addStringOption((option) =>
      option.setName("search").setDescription("Provide the name of the anime").setRequired(true),
    ),
  async (client, interaction) => {
    const { user, options, guild } = interaction;

    const searchQuery = options.getString("search", true);
    if (!guild) return;

    try {
      await interaction.reply({
        embeds: [
          new EmbedCorrect().setDescription(
            [`${client.getEmoji(guild.id, "loading")} Searching for anime...`, `**Search Query:** ${searchQuery}`].join(
              "\n",
            ),
          ),
        ],
      });

      const animeResponse = await axios.get<Entretenment.Anime>("https://kitsu.io/api/edge/anime", {
        params: { "filter[text]": searchQuery },
      });

      const anime = animeResponse.data.data[0];

      if (!anime) {
        return interaction.editReply({
          embeds: [
            new ErrorEmbed().setDescription(
              [
                "⚠️ | Sorry, I couldn't find any anime with that name!",
                "Please check if the name is spelled correctly or try again later.",
              ].join("\n"),
            ),
          ],
        });
      }

      const relatedGenresUrl = anime.relationships.genres.links.related;

      if (!relatedGenresUrl) {
        return interaction.editReply({
          embeds: [
            new ErrorEmbed().setDescription(
              ["⚠️ | No genres found for this anime!", "Please check if the anime is listed on Kitsu.io."].join("\n"),
            ),
          ],
        });
      }

      const genreResponse = await axios.get<Entretenment.Genre>(relatedGenresUrl);
      const genres = genreResponse.data.data.map((genre) => genre.attributes.name).join(", ");

      const [translatedSynopsis] = await Promise.all([translate(anime.attributes.synopsis, { to: "en" })]);

      const statusMap: Record<string, string> = {
        finished: "Finished",
        current: "Currently Airing",
        upcoming: "Upcoming",
        unreleased: "Unreleased",
      };

      const animeStatus = statusMap[anime.attributes.status.toLowerCase()] || anime.attributes.status;

      const animeEmbed = new EmbedCorrect()
        .setAuthor({
          name: `Requested by ${user.tag}`,
          iconURL: user.displayAvatarURL(),
        })
        .setTitle(anime.attributes.titles.en_jp || "Untitled Anime")
        .setURL(`https://kitsu.io/anime/${anime.id}`)
        .setThumbnail(anime.attributes.posterImage.small)
        .setImage(anime.attributes.coverImage.tiny)
        .setDescription(
          translatedSynopsis.text.length > 900
            ? translatedSynopsis.text.slice(0, 900) + "..."
            : translatedSynopsis.text,
        )
        .addFields([
          { name: "⌛ Status", value: animeStatus, inline: true },
          { name: "🗃 Type", value: anime.attributes.subtype || "Unknown", inline: true },
          {
            name: "🏆 Rank",
            value: anime.attributes.ratingRank?.toString() || "Unranked",
            inline: true,
          },
          {
            name: "📀 Episodes",
            value: anime.attributes.episodeCount?.toString() || "Unknown",
            inline: true,
          },
          {
            name: "🥇 Popularity",
            value: anime.attributes.popularityRank?.toString() || "Unknown",
            inline: true,
          },
          { name: "❓ Category", value: anime.type, inline: true },
          {
            name: "⭐ Rating",
            value: `${anime.attributes.averageRating || "N/A"}/100`,
            inline: true,
          },
          {
            name: "⌚ Duration",
            value: anime.attributes.episodeLength ? `${anime.attributes.episodeLength} minutes` : "Unknown",
            inline: true,
          },
          {
            name: "📖 Kitsu Page",
            value: `[View on Kitsu](https://kitsu.io/anime/${anime.id})`,
            inline: true,
          },
          { name: "💠 Genres", value: genres || "Not specified", inline: false },
          {
            name: "📅 Air Dates",
            value: `From **${moment(anime.attributes.startDate).format("LL")}** to **${
              anime.attributes.endDate ? moment(anime.attributes.endDate).format("LL") : "Present"
            }**`,
            inline: false,
          },
        ])
        .setTimestamp()
        .setFooter({
          text: `${client.user?.username} | Team`,
          iconURL: client.user?.displayAvatarURL(),
        });

      await interaction.editReply({ embeds: [animeEmbed] });
    } catch (error) {
      console.error("Anime command error:", error);
      await interaction.editReply({
        embeds: [
          new ErrorEmbed().setDescription(
            [
              "⚠️ | An error occurred while fetching anime data.",
              "Please try again later or check if the anime name is correct.",
            ].join("\n"),
          ),
        ],
      });
    }

    return;
  },
);
