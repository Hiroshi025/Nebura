/**
 * YouTube Notification Handler for Discord Bot
 *
 * This module integrates YouTube channel monitoring with a Discord bot.
 * It periodically checks configured YouTube channels for new videos and sends notifications
 * to specified Discord channels using rich embeds.
 *
 * Main Features:
 * - Uses a cron job to poll YouTube channels at regular intervals.
 * - Fetches channel and video data using youtubei.js (Innertube).
 * - Sends notifications to Discord channels only when a new video is detected.
 * - Stores and updates the last notified video in a database (via Prisma).
 *
 * Key Technologies:
 * - Discord.js: For interacting with Discord servers and channels.
 * - youtubei.js: For fetching YouTube channel and video data.
 * - Prisma: For database access and persistence.
 * - Cron: For scheduling periodic checks.
 * - Moment.js: For timestamp formatting.
 * - ms: For human-friendly time parsing.
 *
 * Usage:
 * Call the exported async function `YouTube(client)` with your Discord client instance.
 * The function will set up the cron job and event listeners automatically.
 */

import { CronJob } from "cron";
import { Guild, TextChannel } from "discord.js";
import moment from "moment";
import ms from "ms";
import { Innertube } from "youtubei.js";

import { main } from "@/main";
import { EmbedCorrect } from "@utils/extends/embeds.extension";

import { MyDiscord } from "../../client";

/**
 * Initializes the YouTube notification system for Discord servers.
 * This function sets up a cron job to periodically check YouTube channels for new videos
 * and sends notifications to configured Discord channels.
 *
 * @param client - The Discord client instance
 * @see https://ytjs.dev/guide/
 * @see https://www.npmjs.com/package/cron
 */
export const YouTube = async (client: MyDiscord) => {
  console.info(
    `[YOUTUBE][INIT] | ${moment().format("YYYY-MM-DD HH:mm:ss")} :: Initializing YouTube notification system for Discord.`,
  );

  // Initialize youtube.js client (Innertube)
  // This client is used to fetch YouTube channel and video data.
  const youtube = await Innertube.create();

  /**
   * Cron job to check YouTube channels for new videos at specific intervals.
   * The cron expression runs the job every 6 minutes (at minute 1, 9, 17, etc.).
   * Uses Europe/Berlin timezone.
   */
  client.Youtubelog = new CronJob(
    "0 1,9,17,23,29,35,41,47,53,59 * * * *",
    async function () {
      // Log the start of the cron job
      console.debug(`[YOUTUBE][CRON][START] | ${moment().format("YYYY-MM-DD HH:mm:ss")} :: Checking YouTube accounts.`);
      // Fetch all guilds (Discord servers) with YouTube configuration from the database
      let guilds = await main.prisma.youtube.findMany({
        include: {
          youtubers: true,
        },
      });
      console.debug(
        `[YOUTUBE][CRON][DB] | ${moment().format("YYYY-MM-DD HH:mm:ss")} :: Found ${guilds.length} guilds with YouTube configuration.`,
      );
      if (!guilds) {
        // No guilds found in the database
        console.warn(`[YOUTUBE][CRON][DB] | ${moment().format("YYYY-MM-DD HH:mm:ss")} :: No guilds found in database.`);
        return;
      }
      // Iterate over each guild and process their YouTube configuration
      for await (const g of guilds) {
        // Get the Discord guild object from the client's cache
        if (!g.serverId) return;
        let guild = client.guilds.cache.get(g.serverId);
        if (!guild) {
          // Guild not found in cache (may have been removed)
          console.warn(
            `[YOUTUBE][CRON][GUILD] | ${moment().format("YYYY-MM-DD HH:mm:ss")} :: Guild not found in cache: ${g.serverId}`,
          );
          continue;
        }
        console.debug(
          `[YOUTUBE][CRON][GUILD] | ${moment().format("YYYY-MM-DD HH:mm:ss")} :: Processing guild: ${guild.name} (${guild.id})`,
        );
        // Wait 2 seconds before checking videos for each guild to avoid rate limits
        await setTimeout(() => getVideos(guild), ms("2s"));
      }
      // Log the end of the cron job
      console.debug(
        `[YOUTUBE][CRON][END] | ${moment().format("YYYY-MM-DD HH:mm:ss")} :: Finished checking all guilds.`,
      );
    },
    null,
    true,
    "Europe/Berlin",
  );

  // Start the cron job when the Discord client is ready
  client.on("ready", async () => {
    console.info(
      `[YOUTUBE][READY] | ${moment().format("YYYY-MM-DD HH:mm:ss")} :: YouTube system started. Starting cron job.`,
    );
    client.Youtubelog.start();
  });

  /**
   * Checks all configured YouTube channels for a given Discord guild.
   * If a new video is found, sends a notification to the configured Discord channel.
   *
   * @param guild - The Discord guild to process
   */
  async function getVideos(guild: Guild) {
    console.debug(
      `[YOUTUBE][GUILD][START] | ${moment().format("YYYY-MM-DD HH:mm:ss")} :: Checking YouTube channels for guild: ${guild.name} (${guild.id})`,
    );
    // Fetch all YouTube channel configurations for this guild from the database
    let tempData = await main.prisma.youtuber.findMany({ where: { guildId: guild.id } });
    console.debug(
      `[YOUTUBE][GUILD][DB] | ${moment().format("YYYY-MM-DD HH:mm:ss")} :: Found ${tempData.length} YouTube channels for guild: ${guild.name} (${guild.id})`,
    );
    if (!tempData || !tempData.length) {
      // No YouTube channels configured for this guild
      console.warn(
        `[YOUTUBE][GUILD][DB] | ${moment().format("YYYY-MM-DD HH:mm:ss")} :: No YouTube channels configured for guild: ${guild.name} (${guild.id})`,
      );
      return;
    }

    // Iterate over each YouTube channel configuration for this guild
    for (const chan of tempData) {
      console.debug(
        `[YOUTUBE][CHANNEL][START] | ${moment().format("YYYY-MM-DD HH:mm:ss")} :: Processing channel config: ${JSON.stringify(chan)}`,
      );

      // Validate channel configuration
      if (!chan.userId || !chan.channelId) {
        // Missing required fields
        console.warn(
          `[YOUTUBE][CHANNEL][SKIP] | ${moment().format("YYYY-MM-DD HH:mm:ss")} :: Missing userId or channelId for config: ${JSON.stringify(chan)}`,
        );
        continue;
      }

      if (chan.channelId === undefined || chan.channelId.length < 18) {
        // Invalid Discord channel ID
        console.warn(
          `[YOUTUBE][CHANNEL][SKIP] | ${moment().format("YYYY-MM-DD HH:mm:ss")} :: Invalid channelId: ${chan.channelId}`,
        );
        continue;
      }

      try {
        // Fetch YouTube channel information using youtube.js (Innertube)
        const channel = await youtube.getChannel(chan.userId);

        if (!channel) {
          // Channel not found or error fetching data
          console.error(
            `[YOUTUBE][CHANNEL][INFO_ERROR] | ${moment().format("YYYY-MM-DD HH:mm:ss")} | Channel: ${chan.userId} | Error: Channel not found`,
          );
          continue;
        }

        // Fetch the list of videos for this channel
        const videosResult = await channel.getVideos();

        // Normalize the result to always be an array of videos
        const videos = Array.isArray(videosResult) ? videosResult : videosResult?.videos || [];

        if (!videos || videos.length === 0) {
          // No videos found for this channel
          console.warn(
            `[YOUTUBE][CHANNEL][NO_VIDEO] | ${moment().format("YYYY-MM-DD HH:mm:ss")} :: No videos found for channel: ${chan.userId}`,
          );
          continue;
        }

        // Get the latest video from the list
        const latestVideo = videos[0];
        // Extract relevant information for the notification
        // Extraer título como string
        let title =
          latestVideo.title?.text ||
          (Array.isArray(latestVideo.title?.runs) ? latestVideo.title.runs.map((r: any) => r.text).join("") : "\u200b");

        // Extraer descripción como string
        let description =
          latestVideo.description_snippet?.text ||
          (Array.isArray(latestVideo.description_snippet?.runs)
            ? latestVideo.description_snippet.runs.map((r: any) => r.text).join("")
            : "\u200b");

        // Extraer duración
        const duration = latestVideo.length_text?.text || latestVideo.duration?.text || "Unknown";

        // Extraer miniatura del canal (avatar)
        let channelAvatar = null;
        if (Array.isArray(channel.metadata?.thumbnail)) {
          channelAvatar = channel.metadata.thumbnail[0]?.url;
        } else if (channel.metadata?.avatar && Array.isArray(channel.metadata.avatar)) {
          channelAvatar = channel.metadata.avatar[0]?.url;
        }

        // Extraer la mejor miniatura del video
        let videoThumbnail = null;
        if (Array.isArray(latestVideo.rich_thumbnail) && latestVideo.rich_thumbnail.length > 0) {
          videoThumbnail = latestVideo.rich_thumbnail[0].url;
        } else if (Array.isArray(latestVideo.thumbnails) && latestVideo.thumbnails.length > 0) {
          videoThumbnail = latestVideo.thumbnails[0].url;
        } else {
          videoThumbnail =
            latestVideo.thumbnails?.maxres?.url ||
            latestVideo.thumbnails?.standard?.url ||
            latestVideo.thumbnails?.high?.url ||
            null;
        }

        // Extraer fecha de publicación y vistas
        const published = latestVideo.published?.text || "Unknown";
        const views = latestVideo.view_count?.text || latestVideo.short_view_count?.text || "Unknown";

        // Extraer nombre del autor
        const authorName = channel.title || latestVideo.author?.name || "Unknown";
        const userUrl = `https://www.youtube.com/channel/${chan.userId}`;
        const lastVideoId = latestVideo.video_id || latestVideo.id;
        const lastVideoUrl = `https://www.youtube.com/watch?v=${lastVideoId}`;

        // Construir el embed mejorado
        let embed = new EmbedCorrect()
          .setAuthor({
            name: `${authorName}`,
            iconURL: channelAvatar || `https://i.imgur.com/ThXFUPL.png`,
            url: userUrl,
          })
          .setTitle(`<a:online:983334659075211315> ${authorName} publicó un nuevo video`)
          .setURL(lastVideoUrl)
          .setThumbnail(channelAvatar || `https://i.imgur.com/ThXFUPL.png`)
          .setDescription(`${title}\n\n${description}`)
          .addFields([
            {
              name: `Duración`,
              value: `\`${duration}\``,
              inline: true,
            },
            {
              name: `Publicado`,
              value: published,
              inline: true,
            },
            {
              name: `Vistas`,
              value: views,
              inline: true,
            },
            {
              name: `Ver en YouTube`,
              value: `[${title}](${lastVideoUrl})`,
              inline: false,
            },
          ])
          .setFooter({ text: `YouTube`, iconURL: `https://i.imgur.com/ThXFUPL.png` })
          .setImage(videoThumbnail)
          .setTimestamp();

        // Fetch the Discord channel for notifications
        try {
          const ch = await client.channels.fetch(chan.channelId as string);

          // Only send a notification if the latest video is new (not previously notified)
          if (chan.lastVideo !== lastVideoId) {
            // Replace {user} placeholder in the message with the channel's author name
            const message = chan.message.replace("{user}", authorName);
            await (ch as TextChannel)
              .send({ content: `${message}`, embeds: [embed] })
              .then(async () => {
                // Update the last notified video in the database
                await main.prisma.youtuber.update({
                  where: {
                    id: chan.id,
                  },
                  data: {
                    lastVideo: lastVideoId,
                  },
                });
                console.info(
                  `[YOUTUBE][NOTIFY][SUCCESS] | ${moment().format("YYYY-MM-DD HH:mm:ss")} | Guild: ${guild.name} (${guild.id}) | Channel: ${chan.channelId} | Video: ${lastVideoUrl} | Notification sent successfully.`,
                );
              })
              .catch((e) => {
                // Handle errors sending the notification
                console.error(
                  `[YOUTUBE][NOTIFY][ERROR] | ${moment().format("YYYY-MM-DD HH:mm:ss")} | Guild: ${guild.name} (${guild.id}) | Channel: ${chan.channelId} | Error sending notification:`,
                  e,
                );
              });
          } else {
            // No new video to notify
            console.debug(
              `[YOUTUBE][NOTIFY][SKIP] | ${moment().format("YYYY-MM-DD HH:mm:ss")} | Guild: ${guild.name} (${guild.id}) | Channel: ${chan.channelId} | No new video to notify.`,
            );
          }
        } catch (e) {
          // Handle errors fetching the Discord channel
          console.error(
            `[YOUTUBE][CHANNEL][FETCH_ERROR] | ${moment().format("YYYY-MM-DD HH:mm:ss")} | Guild: ${guild.name} (${guild.id}) | Channel: ${chan.channelId} | Error fetching Discord channel:`,
            e,
          );
        }
      } catch (error) {
        // Handle errors fetching YouTube channel or video data
        console.error(
          `[YOUTUBE][CHANNEL][ERROR] | ${moment().format("YYYY-MM-DD HH:mm:ss")} | Channel: ${chan.userId} | Error:`,
          error,
        );
      }

      console.debug(
        `[YOUTUBE][CHANNEL][END] | ${moment().format("YYYY-MM-DD HH:mm:ss")} :: Finished processing channel config: ${JSON.stringify(chan)}`,
      );
    }

    console.debug(
      `[YOUTUBE][GUILD][END] | ${moment().format("YYYY-MM-DD HH:mm:ss")} :: Finished checking YouTube channels for guild: ${guild.name} (${guild.id})`,
    );
  }
};
