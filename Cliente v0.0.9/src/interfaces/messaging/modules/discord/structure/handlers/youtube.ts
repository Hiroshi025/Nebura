import { CronJob } from "cron";
import { Guild, TextChannel } from "discord.js";
import moment from "moment";
import ms from "ms";
import ytch from "yt-channel-info";

import { main } from "@/main";
import { EmbedCorrect } from "@extenders/embeds.extend";
import { MyClient } from "@modules/discord/client";

/**
 * Initializes the YouTube notification system for Discord servers.
 * This function sets up a cron job to periodically check YouTube channels for new videos
 * and sends notifications to configured Discord channels.
 *
 * @param client - The Discord client instance
 * @see https://www.npmjs.com/package/yt-channel-info
 * @see https://www.npmjs.com/package/cron
 */
export const YouTube = (client: MyClient) => {
  console.info(
    `[YOUTUBE][INIT] | ${moment().format("YYYY-MM-DD HH:mm:ss")} :: Initializing YouTube notification system for Discord.`,
  );
  /**
   * Cron job to check YouTube channels for new videos at specific intervals.
   * Uses Europe/Berlin timezone.
   */
  client.Youtubelog = new CronJob(
    "0 1,9,17,23,29,35,41,47,53,59 * * * *",
    async function () {
      console.debug(
        `[YOUTUBE][CRON][START] | ${moment().format("YYYY-MM-DD HH:mm:ss")} :: Checking YouTube accounts.`,
      );
      let guilds = await main.prisma.youtube.findMany({
        include: {
          youtubers: true,
        },
      });
      console.debug(
        `[YOUTUBE][CRON][DB] | ${moment().format("YYYY-MM-DD HH:mm:ss")} :: Found ${guilds.length} guilds with YouTube configuration.`,
      );
      if (!guilds) {
        console.warn(
          `[YOUTUBE][CRON][DB] | ${moment().format("YYYY-MM-DD HH:mm:ss")} :: No guilds found in database.`,
        );
        return;
      }
      for await (const g of guilds) {
        let guild = client.guilds.cache.get(g.serverId as string);
        if (!guild) {
          console.warn(
            `[YOUTUBE][CRON][GUILD] | ${moment().format("YYYY-MM-DD HH:mm:ss")} :: Guild not found in cache: ${g.serverId}`,
          );
          continue;
        }
        console.debug(
          `[YOUTUBE][CRON][GUILD] | ${moment().format("YYYY-MM-DD HH:mm:ss")} :: Processing guild: ${guild.name} (${guild.id})`,
        );
        // Wait 2 seconds before checking videos for each guild
        await setTimeout(() => getVideos(guild), ms("2s"));
      }
      console.debug(
        `[YOUTUBE][CRON][END] | ${moment().format("YYYY-MM-DD HH:mm:ss")} :: Finished checking all guilds.`,
      );
      // Do not return any value to satisfy CronJob's expected signature
    },
    null,
    true,
    "Europe/Berlin",
  );

  /**
   * Event handler for the Discord client's 'ready' event.
   * Starts the YouTube cron job.
   */
  client.on("ready", async () => {
    console.info(
      `[YOUTUBE][READY] | ${moment().format("YYYY-MM-DD HH:mm:ss")} :: YouTube system started. Starting cron job.`,
    );
    client.Youtubelog.start();
  });

  /**
   * Checks for new videos from YouTube channels configured for the given guild.
   * Sends a notification to the configured Discord channel if a new video is found.
   *
   * @param guild - The Discord guild to check for YouTube updates
   */
  async function getVideos(guild: Guild) {
    console.debug(
      `[YOUTUBE][GUILD][START] | ${moment().format("YYYY-MM-DD HH:mm:ss")} :: Checking YouTube channels for guild: ${guild.name} (${guild.id})`,
    );
    let tempData = await main.prisma.youtuber.findMany({ where: { guildId: guild.id } });
    console.debug(
      `[YOUTUBE][GUILD][DB] | ${moment().format("YYYY-MM-DD HH:mm:ss")} :: Found ${tempData.length} YouTube channels for guild: ${guild.name} (${guild.id})`,
    );
    if (!tempData || !tempData.length) {
      console.warn(
        `[YOUTUBE][GUILD][DB] | ${moment().format("YYYY-MM-DD HH:mm:ss")} :: No YouTube channels configured for guild: ${guild.name} (${guild.id})`,
      );
      return;
    }
    tempData.map(async function (chan, i) {
      console.debug(
        `[YOUTUBE][CHANNEL][START] | ${moment().format("YYYY-MM-DD HH:mm:ss")} :: Processing channel config: ${JSON.stringify(chan)}`,
      );
      if (!chan.userId || !chan.channelId) {
        console.warn(
          `[YOUTUBE][CHANNEL][SKIP] | ${moment().format("YYYY-MM-DD HH:mm:ss")} :: Missing userId or channelId for config: ${JSON.stringify(chan)}`,
        );
        return;
      }
      if (chan.channelId === undefined || chan.channelId.length < 18) {
        console.warn(
          `[YOUTUBE][CHANNEL][SKIP] | ${moment().format("YYYY-MM-DD HH:mm:ss")} :: Invalid channelId: ${chan.channelId}`,
        );
        return;
      }
      const payload1 = {
        channelId: `${chan.userId}`,
        channelIdType: 0,
      };
      const payload2 = {
        channelId: `${chan.userId}`,
        sortBy: "newest" as "newest",
        channelIdType: 0,
      };
      await ytch
        .getChannelInfo(payload1)
        .then(async (response) => {
          let thumbnail = response.authorThumbnails?.[2]?.url ?? null;
          try {
            const response = await ytch.getChannelVideos(payload2);
            let YoutubeData = response.items[0];
            if (!YoutubeData) {
              console.warn(
                `[YOUTUBE][CHANNEL][NO_VIDEO] | ${moment().format("YYYY-MM-DD HH:mm:ss")} :: No videos found for channel: ${chan.userId}`,
              );
              return;
            }
            const authorName = YoutubeData.author;
            const userUrl = `https://www.youtube.com/channel/${YoutubeData.authorId}`;
            const lastVideoId = YoutubeData.videoId;
            const lastVideoUrl = `https://www.youtube.com/watch?v=${lastVideoId}`;
            const title = YoutubeData.title;
            const duration = YoutubeData.durationText;
            const image =
              YoutubeData.videoThumbnails && YoutubeData.videoThumbnails[3]
                ? YoutubeData.videoThumbnails[3].url
                : null;
            console.debug(
              `[YOUTUBE][CHANNEL][VIDEO] | ${moment().format("YYYY-MM-DD HH:mm:ss")} :: Latest video for ${authorName}: ${title} (${lastVideoId}) | Duration: ${duration}`,
            );
            // Embed structure for the notification
            let embed = new EmbedCorrect()
              .setAuthor({ name: `${authorName}`, iconURL: `${thumbnail}`, url: `${lastVideoUrl}` })
              .setTitle(`<a:online:983334659075211315> ${authorName} published a new video!`)
              .setURL(`${lastVideoUrl}`)
              .setThumbnail(`${thumbnail}` ? thumbnail : null)
              .setDescription(`${title}` ? title : `\u200b`)
              .addFields([
                {
                  name: `YouTube`,
                  value: `[Link](${userUrl})`,
                  inline: true,
                },
                {
                  name: `Duration`,
                  value: `\`${duration} minutes\``,
                  inline: true,
                },
                {
                  name: `Watch Video`,
                  value: `[Link](${lastVideoUrl})`,
                  inline: true,
                },
              ])
              .setFooter({ text: `YouTube`, iconURL: `https://i.imgur.com/ThXFUPL.png` })
              .setImage(`${image}`)
              .setTimestamp();
            // Fetch the Discord channel for notifications
            await client.channels
              .fetch(chan.channelId as string)
              .then(async (ch) => {
                if (chan.lastVideo !== lastVideoId) {
                  const channelObj = tempData[i];
                  const message = channelObj.message.replace("{user}", authorName);
                  await (ch as TextChannel)
                    .send({ content: `${message}`, embeds: [embed] })
                    .then(async () => {
                      channelObj.lastVideo = lastVideoId;
                      await main.prisma.youtuber.update({
                        where: {
                          id: channelObj.id,
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
                      console.error(
                        `[YOUTUBE][NOTIFY][ERROR] | ${moment().format("YYYY-MM-DD HH:mm:ss")} | Guild: ${guild.name} (${guild.id}) | Channel: ${chan.channelId} | Error sending notification:`,
                        e,
                      );
                    });
                } else {
                  console.debug(
                    `[YOUTUBE][NOTIFY][SKIP] | ${moment().format("YYYY-MM-DD HH:mm:ss")} | Guild: ${guild.name} (${guild.id}) | Channel: ${chan.channelId} | No new video to notify.`,
                  );
                  return;
                }
              })
              .catch((e) => {
                console.error(
                  `[YOUTUBE][CHANNEL][FETCH_ERROR] | ${moment().format("YYYY-MM-DD HH:mm:ss")} | Guild: ${guild.name} (${guild.id}) | Channel: ${chan.channelId} | Error fetching Discord channel:`,
                  e,
                );
                return null;
              });
          } catch (error) {
            if (error) {
              console.error(
                `[YOUTUBE][CHANNEL][VIDEO_ERROR] | ${moment().format("YYYY-MM-DD HH:mm:ss")} | Channel: ${chan.userId} | Error fetching latest video:`,
                error,
              );
              return;
            }
          }
        })
        .catch((error) => {
          if (error) {
            console.error(
              `[YOUTUBE][CHANNEL][INFO_ERROR] | ${moment().format("YYYY-MM-DD HH:mm:ss")} | Channel: ${chan.userId} | Error fetching channel info:`,
              error,
            );
            return;
          }
        });
      console.debug(
        `[YOUTUBE][CHANNEL][END] | ${moment().format("YYYY-MM-DD HH:mm:ss")} :: Finished processing channel config: ${JSON.stringify(chan)}`,
      );
    });
    console.debug(
      `[YOUTUBE][GUILD][END] | ${moment().format("YYYY-MM-DD HH:mm:ss")} :: Finished checking YouTube channels for guild: ${guild.name} (${guild.id})`,
    );
  }
};
