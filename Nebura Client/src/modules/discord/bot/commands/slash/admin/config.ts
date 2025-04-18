import {
	ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ChannelSelectMenuBuilder,
	ModalBuilder, SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuInteraction,
	StringSelectMenuOptionBuilder, TextChannel, TextInputBuilder
} from "discord.js";

import { main } from "@/main";
import { Command } from "@/modules/discord/structure/utils/builders";
import { EmbedCorrect, ErrorEmbed } from "@extenders/discord/embeds.extender";
import { logWithLabel } from "@utils/functions/console";

//TODO: Seguir Mejorandolo

export default new Command(
  new SlashCommandBuilder()
    .setName("config")
    .setDescription("configuration the functions of the discord bot"),
  async (client, interaction) => {
    try {
      if (!interaction.guild || !interaction.channel || !client.user) return;
      const data = await main.prisma.myDiscord.findUnique({ where: { clientId: client.user.id } });
      if (!data || typeof data.errorlog !== "boolean" || typeof data.logconsole !== "boolean") {
        return interaction.reply({
          embeds: [
            new ErrorEmbed()
              .setTitle("Error Configuration")
              .setDescription(
                [
                  `${client.getEmoji(interaction.guild.id, "error")} **Error**`,
                  `No valid configuration found for this server.`,
                ].join("\n"),
              ),
          ],
        });
      }

      const embed = new EmbedCorrect()
        .setTitle("Configuration")
        .setDescription(
          [
            `${client.getEmoji(interaction.guild.id, "correct")} **Configuration**`,
            `To configure, select one of the following options:`,
          ].join("\n"),
        );

      const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setLabel("Cancel")
          .setCustomId("button-set-config-cancel") // Fixed typo
          .setStyle(ButtonStyle.Danger),
      );

      const menus = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId("menu:config-panel")
          .setPlaceholder("Select a configuration option")
          .addOptions(
            new StringSelectMenuOptionBuilder()
              .setLabel("Enabled Log Errors")
              .setValue("log-errors")
              .setEmoji(
                data.errorlog
                  ? client.getEmoji(interaction.guild.id, "circle_check")
                  : client.getEmoji(interaction.guild.id, "circle_x"),
              )
              .setDescription("Enable or disable error logging"),
            new StringSelectMenuOptionBuilder()
              .setLabel("Enabled Log Debug")
              .setValue("log-debug")
              .setEmoji(
                data.logconsole
                  ? client.getEmoji(interaction.guild.id, "circle_check")
                  : client.getEmoji(interaction.guild.id, "circle_x"),
              )
              .setDescription("Enable or disable debug logging"),
            new StringSelectMenuOptionBuilder()
              .setLabel("Set Webhook")
              .setValue("webhook-config")
              .setEmoji(client.getEmoji(interaction.guild.id, "settings"))
              .setDescription("Set the webhook URL"),
          ),
      );

      const message = await interaction.reply({
        embeds: [embed],
        components: [menus, buttons],
        flags: "Ephemeral",
      });

      const collector = message.createMessageComponentCollector({
        filter: (i) => i.user.id === interaction.user.id,
        time: 60000,
      });

      collector.on("collect", async (i: ButtonInteraction | StringSelectMenuInteraction) => {
        try {
          if (i.isButton()) {
            switch (i.customId) {
              case "button-set-config-cancel":
                await i.update({
                  embeds: [
                    new EmbedCorrect()
                      .setTitle("Configuration")
                      .setDescription(
                        `${client.getEmoji(interaction.guildId as string, "correct")} **Configuration**\n` +
                          `The configuration has been cancelled.`,
                      ),
                  ],
                  components: [],
                });
                collector.stop();
                break;
            }
          } else if (i.isStringSelectMenu()) {
            switch (i.customId) {
              case "menu:config-panel":
                if (i.values.includes("log-errors")) {
                  const newValue = !data.errorlog;
                  await main.prisma.myDiscord.update({
                    where: { clientId: client.user?.id },
                    data: { errorlog: newValue },
                  });
                  setTimeout(async () => {
                    await i.update({
                      embeds: [
                        new EmbedCorrect()
                          .setTitle("Configuration")
                          .setDescription(
                            `${client.getEmoji(interaction.guildId as string, "correct")} **Configuration**\n` +
                              `The error log has been ${newValue ? "enabled" : "disabled"}.`,
                          ),
                      ],
                      components: [],
                    });
                  }, 1000);
                } else if (i.values.includes("log-debug")) {
                  const newValue = !data.logconsole;
                  await main.prisma.myDiscord.update({
                    where: { clientId: client.user?.id },
                    data: { logconsole: newValue },
                  });
                  setTimeout(async () => {
                    await i.update({
                      embeds: [
                        new EmbedCorrect()
                          .setTitle("Configuration")
                          .setDescription(
                            `${client.getEmoji(interaction.guildId as string, "correct")} **Configuration**\n` +
                              `The debug log has been ${newValue ? "enabled" : "disabled"}.`,
                          ),
                      ],
                      components: [],
                    });
                  }, 1000);
                } else if (i.values.includes("webhook-config")) {
                  const msg = await i.reply({
                    embeds: [
                      new EmbedCorrect()
                        .setTitle("Configuration")
                        .setDescription(
                          `${client.getEmoji(interaction.guildId as string, "correct")} **Configuration**\n` +
                            `You have selected the webhook configuration option.`,
                        ),
                    ],
                    components: [
                      new ActionRowBuilder<ButtonBuilder>().addComponents(
                        new ButtonBuilder()
                          .setLabel("Set URL")
                          .setCustomId("button-set-webhook-config")
                          .setStyle(ButtonStyle.Primary),
                        new ButtonBuilder()
                          .setLabel("Create")
                          .setCustomId("button-create-webhook-config")
                          .setStyle(ButtonStyle.Success),
                        new ButtonBuilder()
                          .setLabel("Delete")
                          .setCustomId("button-delete-webhook-config")
                          .setStyle(ButtonStyle.Danger),
                      ),
                    ],
                    flags: "Ephemeral",
                  });

                  const webhookCollector = msg.createMessageComponentCollector({
                    filter: (i) => i.user.id === interaction.user.id,
                    time: 60000,
                  });

                  webhookCollector.on("collect", async (i) => {
                    try {
                      if (i.isButton()) {
                        switch (i.customId) {
                          case "button-set-webhook-config":
                            const input = new TextInputBuilder()
                              .setCustomId("input-webhook-url")
                              .setLabel("Webhook URL")
                              .setStyle(1)
                              .setPlaceholder("Enter the webhook URL")
                              .setRequired(true)
                              .setMinLength(10)
                              .setMaxLength(2000);

                            const row = new ActionRowBuilder<TextInputBuilder>().addComponents(
                              input,
                            );
                            const modal = new ModalBuilder()
                              .setCustomId("modal-webhook-config")
                              .setTitle("Webhook Configuration")
                              .addComponents(row);

                            await i.showModal(modal);
                            break;
                          case "button-create-webhook-config":
                            await i
                              .reply({
                                embeds: [
                                  new EmbedCorrect()
                                    .setTitle("Configuration")
                                    .setDescription(
                                      `${client.getEmoji(interaction.guildId as string, "correct")} **Configuration**\n` +
                                        `You have selected the create webhook option.`,
                                    ),
                                ],
                                components: [
                                  new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
                                    new ChannelSelectMenuBuilder()
                                      .setCustomId("select-webhook-channel")
                                      .setPlaceholder("Select a channel to create the webhook")
                                      .setChannelTypes([0]), // 0 = GUILD_TEXT
                                  ),
                                ],
                              })
                              .then(async (dta) => {
                                const collector = dta.createMessageComponentCollector({
                                  filter: (i) => i.user.id === interaction.user.id,
                                  time: 60000,
                                });

                                collector.on("collect", async (i) => {
                                  if (i.isChannelSelectMenu()) {
                                    const channel = i.values[0];
                                    const guild = await client.guilds.fetch(
                                      interaction.guildId as string,
                                    );
                                    const channelData: TextChannel = (await guild.channels.fetch(
                                      channel,
                                    )) as TextChannel;
                                    if (!channelData) return;
                                    const webhook = await channelData.createWebhook({
                                      name: "Error Logs",
                                      avatar: client.user?.displayAvatarURL(),
                                    });
                                    await main.prisma.myDiscord.update({
                                      where: { clientId: client.user?.id },
                                      data: { webhookURL: webhook.url },
                                    });
                                    await i.update({
                                      embeds: [
                                        new EmbedCorrect()
                                          .setTitle("Configuration")
                                          .setDescription(
                                            `${client.getEmoji(interaction.guildId as string, "correct")} **Configuration**\n` +
                                              `The webhook has been created in <#${channel}>`,
                                          ),
                                      ],
                                      components: [],
                                    });
                                  }
                                });
                              });
                            break;
                          case "button-delete-webhook-config":
                            await i
                              .update({
                                embeds: [
                                  new EmbedCorrect()
                                    .setTitle("Configuration")
                                    .setDescription(
                                      [
                                        `${client.getEmoji(interaction.guildId as string, "correct")} **Configuration**`,
                                        `The webhook URL has been successfully removed, please check \`/config\` again.`,
                                      ].join("\n"),
                                    ),
                                ],
                                components: [],
                              })
                              .then(async () => {
                                await main.prisma.myDiscord.update({
                                  where: { clientId: client.user?.id },
                                  data: { webhookURL: null },
                                });
                              });
                            break;
                        }
                      }
                    } catch (error) {
                      logWithLabel(
                        "error",
                        ["Error in webhook collector interaction:", error].join("\n"),
                      );
                    }
                  });
                }
                break;
            }
          }
        } catch (error) {
          logWithLabel("error", ["Error in collector interaction:", error].join("\n"));
        }
      });

      collector.on("end", async () => {
        try {
          await interaction.editReply({
            components: [],
          });
        } catch (error) {
          logWithLabel("error", ["Error in collector end interaction:", error].join("\n"));
        }
      });

      return message;
    } catch (error) {
      logWithLabel("error", ["Error in config command:", error].join("\n"));
      await interaction.reply({
        embeds: [
          new ErrorEmbed()
            .setTitle("Unexpected Error")
            .setDescription("An unexpected error occurred. Please try again later."),
        ],
        ephemeral: true,
      });
    }

    return;
  },
);
