"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="15594d70-5ca3-561d-a1ad-6e1761889aa8")}catch(e){}}();

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const discord_js_1 = require("discord.js");
const moment_1 = __importDefault(require("moment"));
const builders_1 = require("../../../../../../../../interfaces/messaging/modules/discord/structure/utils/builders");
const embeds_extend_1 = require("../../../../../../../../shared/adapters/extends/embeds.extend");
const google_translate_1 = __importDefault(require("@iamtraction/google-translate"));
exports.default = new builders_1.Command(new discord_js_1.SlashCommandBuilder()
    .setName("anime")
    .setDescription("Search for information about an anime")
    .addStringOption((option) => option.setName("search").setDescription("Provide the name of the anime").setRequired(true)), async (client, interaction) => {
    const { user, options, guild } = interaction;
    const searchQuery = options.getString("search", true);
    if (!guild)
        return;
    try {
        await interaction.reply({
            embeds: [
                new embeds_extend_1.EmbedCorrect().setDescription([`${client.getEmoji(guild.id, "loading")} Searching for anime...`, `**Search Query:** ${searchQuery}`].join("\n")),
            ],
        });
        const animeResponse = await axios_1.default.get("https://kitsu.io/api/edge/anime", {
            params: { "filter[text]": searchQuery },
        });
        const anime = animeResponse.data.data[0];
        if (!anime) {
            return interaction.editReply({
                embeds: [
                    new embeds_extend_1.ErrorEmbed().setDescription([
                        "⚠️ | Sorry, I couldn't find any anime with that name!",
                        "Please check if the name is spelled correctly or try again later.",
                    ].join("\n")),
                ],
            });
        }
        const relatedGenresUrl = anime.relationships.genres.links.related;
        if (!relatedGenresUrl) {
            return interaction.editReply({
                embeds: [
                    new embeds_extend_1.ErrorEmbed().setDescription(["⚠️ | No genres found for this anime!", "Please check if the anime is listed on Kitsu.io."].join("\n")),
                ],
            });
        }
        const genreResponse = await axios_1.default.get(relatedGenresUrl);
        const genres = genreResponse.data.data.map((genre) => genre.attributes.name).join(", ");
        const [translatedSynopsis] = await Promise.all([(0, google_translate_1.default)(anime.attributes.synopsis, { to: "en" })]);
        const statusMap = {
            finished: "Finished",
            current: "Currently Airing",
            upcoming: "Upcoming",
            unreleased: "Unreleased",
        };
        const animeStatus = statusMap[anime.attributes.status.toLowerCase()] || anime.attributes.status;
        const animeEmbed = new embeds_extend_1.EmbedCorrect()
            .setAuthor({
            name: `Requested by ${user.tag}`,
            iconURL: user.displayAvatarURL(),
        })
            .setTitle(anime.attributes.titles.en_jp || "Untitled Anime")
            .setURL(`https://kitsu.io/anime/${anime.id}`)
            .setThumbnail(anime.attributes.posterImage.small)
            .setImage(anime.attributes.coverImage.tiny)
            .setDescription(translatedSynopsis.text.length > 900
            ? translatedSynopsis.text.slice(0, 900) + "..."
            : translatedSynopsis.text)
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
                value: `From **${(0, moment_1.default)(anime.attributes.startDate).format("LL")}** to **${anime.attributes.endDate ? (0, moment_1.default)(anime.attributes.endDate).format("LL") : "Present"}**`,
                inline: false,
            },
        ])
            .setTimestamp()
            .setFooter({
            text: `${client.user?.username} | Team`,
            iconURL: client.user?.displayAvatarURL(),
        });
        await interaction.editReply({ embeds: [animeEmbed] });
    }
    catch (error) {
        console.error("Anime command error:", error);
        await interaction.editReply({
            embeds: [
                new embeds_extend_1.ErrorEmbed().setDescription([
                    "⚠️ | An error occurred while fetching anime data.",
                    "Please try again later or check if the anime name is correct.",
                ].join("\n")),
            ],
        });
    }
    return;
});
//# sourceMappingURL=anime.js.map
//# debugId=15594d70-5ca3-561d-a1ad-6e1761889aa8
