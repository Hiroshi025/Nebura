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
  /**
   * Cron job to check YouTube channels for new videos at specific intervals.
   * Uses Europe/Berlin timezone.
   */
  client.Youtubelog = new CronJob(
    "0 1,9,17,23,29,35,41,47,53,59 * * * *",
    async function () {
      console.debug(
        `[YOUTUBE][DEBUG] | ${moment().format("dddd DD-MM-YYYY HH:mm:ss")} :: Checking YouTube accounts - ${moment().format(`LLLL`)}`,
      );
      let guilds = await main.prisma.youtube.findMany({
        include: {
          youtubers: true,
        },
      });

      if (!guilds) return;

      for await (const g of guilds) {
        let guild = client.guilds.cache.get(g.serverId as string);
        if (!guild) continue;

        // Wait 2 seconds before checking videos for each guild
        await setTimeout(() => getVideos(guild), ms("2s"));
      }
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
    console.debug(
      `[YOUTUBE][DEBUG] | ${moment().format("dddd DD-MM-YYYY HH:mm:ss")} :: YouTube system started`,
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
    let tempData = await main.prisma.youtuber.findMany({ where: { guildId: guild.id } });
    if (!tempData || !tempData.length) return;

    tempData.map(async function (chan, i) {
      if (!chan.userId || !chan.channelId) return;
      if (chan.channelId === undefined || chan.channelId.length < 18) return;

      const payload1 = {
        channelId: `${chan.userId}`, // Required
        channelIdType: 0,
      };

      const payload2 = {
        channelId: `${chan.userId}`, // Required
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
              // No YouTube data found for this channel
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
                      console.debug(
                        `[YOUTUBE][DEBUG] | ${moment().format("dddd DD-MM-YYYY HH:mm:ss")} | ${guild.name} :: Notification sent: ${lastVideoUrl}`,
                      );
                    })
                    .catch((e) => {
                      console.debug(
                        `[YOUTUBE][DEBUG] | ${moment().format("dddd DD-MM-YYYY HH:mm:ss")} | ${guild.name} :: Error sending notification`,
                        e,
                      );
                    });
                } else {
                  // No new videos found
                  return;
                }
              })
              .catch(() => null);
          } catch (error) {
            if (error) {
              // Error fetching latest video
              return;
            }
          }
        })
        .catch((error) => {
          if (error) {
            // Error fetching channel info
            return;
          }
        });
    });
  }
};
