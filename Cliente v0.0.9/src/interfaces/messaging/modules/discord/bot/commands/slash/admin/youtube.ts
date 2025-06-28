import { ChannelType, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import Parser from "rss-parser";

import { main } from "@/main";
import { channelId } from "@gonetone/get-youtube-id-by-url";
import { Command } from "@messaging/modules/discord/structure/utils/builders";
import { EmbedCorrect, ErrorEmbed } from "@utils/extends/embeds.extension";

const fetch = new Parser();
export default new Command(
  new SlashCommandBuilder()
    .setName("youtube")
    .setDescription("Configure YouTube notifications system")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) =>
      sub
        .setName("add")
        .setDescription("Add a YouTube channel for notifications")
        .addStringOption((opt) =>
          opt.setName("link").setDescription("Provide the YouTube channel link").setRequired(true),
        )
        .addChannelOption((opt) =>
          opt
            .setName("channel")
            .setDescription("Select the channel to send notifications")
            .addChannelTypes(
              ChannelType.GuildText,
              ChannelType.GuildForum,
              ChannelType.GuildVoice,
              ChannelType.GuildAnnouncement,
            )
            .setRequired(true),
        )
        .addStringOption((opt) =>
          opt.setName("message").setDescription("Custom notification message, {user} = youtuber").setRequired(false),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("edit")
        .setDescription("Edit the notification message or channel")
        .addStringOption((opt) => opt.setName("link").setDescription("YouTube channel link to edit").setRequired(true))
        .addStringOption((opt) =>
          opt.setName("message").setDescription("New custom message, {user} = youtuber").setRequired(true),
        )
        .addChannelOption((opt) =>
          opt
            .setName("channel")
            .setDescription("New channel for notifications")
            .addChannelTypes(
              ChannelType.GuildText,
              ChannelType.GuildForum,
              ChannelType.GuildVoice,
              ChannelType.GuildAnnouncement,
            )
            .setRequired(false),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("remove")
        .setDescription("Remove a YouTube channel from notifications")
        .addStringOption((opt) =>
          opt.setName("link").setDescription("YouTube channel link to remove").setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub.setName("list").setDescription("List all YouTube channels configured for notifications"),
    ),
  async (client, interaction) => {
    const { options, guild } = interaction;
    if (!guild || !interaction.channel) return;
    const subcommands = options.getSubcommand();

    let data = await main.prisma.youtube.findFirst({
      where: {
        serverId: guild.id,
      },
    });

    const youtubers = await main.prisma.youtuber.findMany({
      where: {
        guildId: guild.id,
      },
    });

    if (!data) {
      data = await main.prisma.youtube.create({
        data: {
          serverId: guild.id,
          serverName: guild.name || "Unknown Server",
        },
      });
    }

    switch (subcommands) {
      case "add":
        {
          const link = options.getString("link", true);
          const channel = options.getChannel("channel", true);
          const message = options.getString("message") || "{user} has uploaded a new video!";

          if ((link && !link.toLowerCase().includes("http")) || !link.toLowerCase().includes("youtube")) {
            await interaction.reply({
              embeds: [
                new ErrorEmbed()
                  .setTitle("Invalid YouTube Link")
                  .setDescription(
                    [
                      `${client.getEmoji(guild?.id as string, "error")} The provided link is not a valid YouTube channel link.`,
                      `Please ensure the link is a valid YouTube channel URL.`,
                    ].join("\n"),
                  ),
              ],
            });
          }

          if (youtubers.some((u) => u.url?.toLowerCase() === link.toLowerCase())) {
            await interaction.reply({
              embeds: [
                new ErrorEmbed()
                  .setTitle("Channel Already Exists")
                  .setDescription(
                    [
                      `${client.getEmoji(guild?.id as string, "error")} This YouTube channel is already configured for notifications.`,
                      `Please use the edit command to modify the existing channel.`,
                    ].join("\n"),
                  ),
              ],
            });
            return;
          }

          if (
            channel.type !== ChannelType.GuildText &&
            channel.type !== ChannelType.GuildForum &&
            channel.type !== ChannelType.GuildVoice &&
            channel.type !== ChannelType.GuildAnnouncement
          ) {
            await interaction.reply({
              embeds: [
                new ErrorEmbed()
                  .setTitle("Invalid Channel Type")
                  .setDescription(
                    [
                      `${client.getEmoji(guild?.id as string, "error")} The selected channel type is not supported.`,
                      `Please choose a text, forum, voice, or announcement channel.`,
                    ].join("\n"),
                  ),
              ],
            });
            return;
          }

          await channelId(link).then(async (id) => {
            await fetch.parseURL(`https://www.youtube.com/feeds/videos.xml?channel_id=${id}`).then(async (response) => {
              const name = response.title;
              const url = response.link;
              if (!message) {
                if (youtubers.some((u) => u.userId?.toLowerCase() === id.toLowerCase())) {
                  await interaction.reply({
                    embeds: [
                      new ErrorEmbed()
                        .setTitle("Channel Already Exists")
                        .setDescription(
                          [
                            `${client.getEmoji(guild.id as string, "error")} This YouTube channel is already configured for notifications.`,
                            `Please use the edit command to modify the existing channel.`,
                          ].join("\n"),
                        ),
                    ],
                  });
                }

                await main.prisma.youtuber.create({
                  data: {
                    name: name,
                    userId: id,
                    channelId: channel.id,
                    guildId: guild.id,
                    channelName: channel.name,
                    url: url,
                  },
                });

                await interaction.reply({
                  embeds: [
                    new EmbedCorrect()
                      .setTitle("YouTube Channel Added")
                      .setDescription(
                        [
                          `${client.getEmoji(guild.id as string, "success")} Successfully added YouTube channel notifications.`,
                          `Channel: ${channel.name}`,
                          `User: ${name}`,
                          `URL: ${url}`,
                        ].join("\n"),
                      ),
                  ],
                });
              } else if (message) {
                if (message.length > 1024) {
                  await interaction.reply({
                    embeds: [
                      new ErrorEmbed()
                        .setTitle("Message Too Long")
                        .setDescription(
                          [
                            `${client.getEmoji(guild?.id as string, "error")} The custom message exceeds the maximum length of 1024 characters.`,
                            `Please shorten the message and try again.`,
                          ].join("\n"),
                        ),
                    ],
                  });
                  return;
                }

                if (youtubers.some((u) => u.userId?.toLowerCase() === id.toLowerCase())) {
                  await interaction.reply({
                    embeds: [
                      new ErrorEmbed()
                        .setTitle("Channel Already Exists")
                        .setDescription(
                          [
                            `${client.getEmoji(guild?.id as string, "error")} This YouTube channel is already configured for notifications.`,
                            `Please use the edit command to modify the existing channel.`,
                          ].join("\n"),
                        ),
                    ],
                  });
                }

                await main.prisma.youtuber.create({
                  data: {
                    name: name,
                    userId: id,
                    channelId: channel.id,
                    channelName: channel.name,
                    guildId: guild.id,
                    url: url,
                    message: message,
                  },
                });

                await interaction.reply({
                  embeds: [
                    new EmbedCorrect()
                      .setTitle("YouTube Channel Added")
                      .setDescription(
                        [
                          `${client.getEmoji(guild?.id as string, "success")} Successfully added YouTube channel notifications.`,
                          `Channel: ${channel.name}`,
                          `User: ${name}`,
                          `URL: ${url}`,
                          `Message: ${message}`,
                        ].join("\n"),
                      ),
                  ],
                });
              }
            });
          });
        }
        break;
      case "edit":
        {
          const link = options.getString("link", true);
          const message = options.getString("message", true);
          const channel = options.getChannel("channel");

          if (!link.toLowerCase().includes("http") || !link.toLowerCase().includes("youtube")) {
            await interaction.reply({
              embeds: [
                new ErrorEmbed()
                  .setTitle("Invalid YouTube Link")
                  .setDescription(
                    [
                      `${client.getEmoji(guild?.id as string, "error")} The provided link is not a valid YouTube channel link.`,
                      `Valid link formats are:\n\`https://www.youtube.com/google\`\n\`https://www.youtube.com/c/google\`\n\`https://www.youtube.com/channel/UCgEOyR8izj0bWnf0zwjzGVA\``,
                    ].join("\n"),
                  ),
              ],
              flags: "Ephemeral",
            });
            return;
          }

          const youtuber = youtubers.find((u) => u.url?.toLowerCase() === link.toLowerCase());

          if (!youtuber) {
            await interaction.reply({
              embeds: [
                new ErrorEmbed()
                  .setTitle("Channel Not Found")
                  .setDescription(
                    [
                      `${client.getEmoji(guild?.id as string, "error")} The YouTube channel \`${link}\` is not configured for notifications.`,
                      `Use \`/youtube list\` to see all configured channels.`,
                    ].join("\n"),
                  ),
              ],
              flags: "Ephemeral",
            });
            return;
          }

          if (message.length > 1024) {
            await interaction.reply({
              embeds: [
                new ErrorEmbed()
                  .setTitle("Message Too Long")
                  .setDescription(
                    [
                      `${client.getEmoji(guild?.id as string, "error")} The custom message exceeds the maximum length of 1024 characters.`,
                      `Please shorten the message and try again.`,
                    ].join("\n"),
                  ),
              ],
              flags: "Ephemeral",
            });
            return;
          }

          if (channel) {
            if (
              channel.type !== ChannelType.GuildText &&
              channel.type !== ChannelType.GuildForum &&
              channel.type !== ChannelType.GuildVoice &&
              channel.type !== ChannelType.GuildAnnouncement
            ) {
              await interaction.reply({
                embeds: [
                  new ErrorEmbed()
                    .setTitle("Invalid Channel Type")
                    .setDescription(
                      [
                        `${client.getEmoji(guild?.id as string, "error")} The selected channel type is not supported.`,
                        `Allowed channel types: Text, Forum, Voice, or Announcement channels.`,
                      ].join("\n"),
                    ),
                ],
                flags: "Ephemeral",
              });
              return;
            }

            await main.prisma.youtuber.update({
              where: {
                id: youtuber.id,
              },
              data: {
                channelId: channel.id,
                channelName: channel.name,
                message: message,
              },
            });

            await interaction.reply({
              embeds: [
                new EmbedCorrect()
                  .setTitle("YouTube Channel Updated")
                  .setDescription(
                    [
                      `${client.getEmoji(guild?.id as string, "success")} Successfully updated YouTube channel notifications.`,
                      `New Channel: ${channel.name}`,
                      `New Message: ${message}`,
                    ].join("\n"),
                  ),
              ],
              flags: "Ephemeral",
            });
          } else {
            await main.prisma.youtuber.update({
              where: {
                id: youtuber.id,
              },
              data: {
                message: message,
              },
            });

            await interaction.reply({
              embeds: [
                new EmbedCorrect()
                  .setTitle("YouTube Channel Updated")
                  .setDescription(
                    [
                      `${client.getEmoji(guild?.id as string, "success")} Successfully updated YouTube channel message.`,
                      `New Message: ${message}`,
                    ].join("\n"),
                  ),
              ],
              flags: "Ephemeral",
            });
          }
        }
        break;

      case "remove":
        {
          const link = options.getString("link", true);

          const youtuber = youtubers.find((u) => u.url?.toLowerCase() === link.toLowerCase());

          if (!youtuber) {
            await interaction.reply({
              embeds: [
                new ErrorEmbed()
                  .setTitle("Channel Not Found")
                  .setDescription(
                    [
                      `${client.getEmoji(guild?.id as string, "error")} The YouTube channel \`${link}\` is not configured for notifications.`,
                    ].join("\n"),
                  ),
              ],
              flags: "Ephemeral",
            });
            return;
          }

          await main.prisma.youtuber.delete({
            where: {
              id: youtuber.id,
            },
          });

          await interaction.reply({
            embeds: [
              new EmbedCorrect()
                .setTitle("YouTube Channel Removed")
                .setDescription(
                  [
                    `${client.getEmoji(guild?.id as string, "success")} Successfully removed YouTube channel notifications.`,
                    `Channel: ${youtuber.name} (${youtuber.url})`,
                  ].join("\n"),
                ),
            ],
            flags: "Ephemeral",
          });
        }
        break;

      case "list":
        {
          if (youtubers.length === 0) {
            await interaction.reply({
              embeds: [
                new ErrorEmbed()
                  .setTitle("No YouTube Channels Configured")
                  .setDescription(
                    [
                      `${client.getEmoji(guild?.id as string, "error")} No YouTube channels are configured for notifications.`,
                      `Use \`/youtube add\` to add YouTube channels.`,
                    ].join("\n"),
                  ),
              ],
              flags: "Ephemeral",
            });
            return;
          }

          const fields = youtubers.map((youtuber, index) => {
            return {
              name: `${index + 1}. ${youtuber.name}`,
              value: [
                `**User ID:** \`${youtuber.userId}\``,
                `**Channel:** <#${youtuber.channelId}> (\`${youtuber.channelName}\`)`,
                `**URL:** [Link](${youtuber.url})`,
                `**Message:** \`${youtuber.message}\``,
              ].join("\n"),
            };
          });

          await interaction.reply({
            embeds: [
              new EmbedCorrect()
                .setTitle(`YouTube Notifications for ${guild?.name}`)
                .addFields(fields)
                .setFooter({
                  text: `${client.user?.username} | Team`,
                  iconURL: client.user?.displayAvatarURL(),
                })
                .setTimestamp(),
            ],
            flags: "Ephemeral",
          });
        }
        break;
    }
  },
);
