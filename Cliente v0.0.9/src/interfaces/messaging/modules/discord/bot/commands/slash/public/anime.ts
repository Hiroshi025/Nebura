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
    .setNameLocalizations({
      "es-ES": "anime",
    })
    .setDescription("Search for information about an anime")
    .setDescriptionLocalizations({
      "es-ES": "Buscar información sobre un anime",
    })
    .addStringOption((option) =>
      option
        .setName("search")
        .setNameLocalizations({
          "es-ES": "buscar",
        })
        .setDescription("Provide the name of the anime")
        .setDescriptionLocalizations({
          "es-ES": "Proporciona el nombre del anime",
        })
        .setRequired(true),
    ),
  async (client, interaction) => {
    const { user, options, guild } = interaction;

    // Obtener idioma preferido del usuario o guild
    const lang =
      (guild &&
        (await (await import("@/main")).main.prisma.myGuild.findUnique({ where: { guildId: guild.id } }))?.lenguage) ||
      interaction.locale ||
      "es-ES";
    const t = (key: string, options?: any) => client.translations.t("discord:" + key, { lng: lang, ...options });

    const searchQuery = options.getString("search", true);
    if (!guild) return;

    try {
      await interaction.reply({
        embeds: [
          new EmbedCorrect().setDescription(
            [
              `${client.getEmoji(guild.id, "loading")} ${t("anime.searching")}`,
              `**${t("anime.query")}:** ${searchQuery}`,
            ].join("\n"),
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
            new ErrorEmbed().setDescription([t("anime.errors.notFound"), t("anime.errors.checkName")].join("\n")),
          ],
        });
      }

      const relatedGenresUrl = anime.relationships.genres.links.related;

      if (!relatedGenresUrl) {
        return interaction.editReply({
          embeds: [
            new ErrorEmbed().setDescription([t("anime.errors.noGenres"), t("anime.errors.checkKitsu")].join("\n")),
          ],
        });
      }

      const genreResponse = await axios.get<Entretenment.Genre>(relatedGenresUrl);
      const genres = genreResponse.data.data.map((genre) => genre.attributes.name).join(", ");

      const [translatedSynopsis] = await Promise.all([
        translate(anime.attributes.synopsis, { to: lang.startsWith("es") ? "es" : "en" }),
      ]);

      const statusMap: Record<string, string> = {
        finished: t("anime.status.finished"),
        current: t("anime.status.current"),
        upcoming: t("anime.status.upcoming"),
        unreleased: t("anime.status.unreleased"),
      };

      const animeStatus = statusMap[anime.attributes.status.toLowerCase()] || anime.attributes.status;

      const animeEmbed = new EmbedCorrect()
        .setAuthor({
          name: t("anime.requestedBy", { user: user.tag }),
          iconURL: user.displayAvatarURL(),
        })
        .setTitle(anime.attributes.titles.en_jp || t("anime.untitled"))
        .setURL(`https://kitsu.io/anime/${anime.id}`)
        .setThumbnail(anime.attributes.posterImage.small)
        .setImage(anime.attributes.coverImage.tiny)
        .setDescription(
          translatedSynopsis.text.length > 900
            ? translatedSynopsis.text.slice(0, 900) + "..."
            : translatedSynopsis.text,
        )
        .addFields([
          { name: "⌛ " + t("anime.statusField"), value: animeStatus, inline: true },
          { name: "🗃 " + t("anime.type"), value: anime.attributes.subtype || t("anime.unknown"), inline: true },
          {
            name: "🏆 " + t("anime.rank"),
            value: anime.attributes.ratingRank?.toString() || t("anime.unranked"),
            inline: true,
          },
          {
            name: "📀 " + t("anime.episodes"),
            value: anime.attributes.episodeCount?.toString() || t("anime.unknown"),
            inline: true,
          },
          {
            name: "🥇 " + t("anime.popularity"),
            value: anime.attributes.popularityRank?.toString() || t("anime.unknown"),
            inline: true,
          },
          { name: "❓ " + t("anime.category"), value: anime.type, inline: true },
          {
            name: "⭐ " + t("anime.rating"),
            value: `${anime.attributes.averageRating || "N/A"}/100`,
            inline: true,
          },
          {
            name: "⌚ " + t("anime.duration"),
            value: anime.attributes.episodeLength
              ? `${anime.attributes.episodeLength} ${t("anime.minutes")}`
              : t("anime.unknown"),
            inline: true,
          },
          {
            name: "📖 " + t("anime.kitsuPage"),
            value: `[${t("anime.viewOnKitsu")}](${`https://kitsu.io/anime/${anime.id}`})`,
            inline: true,
          },
          { name: "💠 " + t("anime.genres"), value: genres || t("anime.notSpecified"), inline: false },
          {
            name: "📅 " + t("anime.airDates"),
            value: t("anime.airDatesValue", {
              from: moment(anime.attributes.startDate).format("LL"),
              to: anime.attributes.endDate ? moment(anime.attributes.endDate).format("LL") : t("anime.present"),
            }),
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
        embeds: [new ErrorEmbed().setDescription([t("anime.errors.fetch"), t("anime.errors.tryAgain")].join("\n"))],
      });
    }

    return;
  },
);
