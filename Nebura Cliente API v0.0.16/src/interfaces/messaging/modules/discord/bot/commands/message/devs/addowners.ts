import {
	ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ChannelType,
	UserSelectMenuBuilder, UserSelectMenuInteraction
} from "discord.js";

import { main } from "@/main";
import { EmbedCorrect } from "@shared/utils/extends/discord/embeds.extends";
import { Precommand } from "@typings/modules/discord";

const OwnerAddCommand: Precommand = {
  name: "addowners",
  nameLocalizations: {
    "es-ES": "propietarios-agregar",
    "en-US": "addowners",
  },
  description: "Add owners to the bot",
  descriptionLocalizations: {
    "es-ES": "Agregar propietarios al bot",
    "en-US": "Add owners to the bot",
  },
  examples: ["addowners"],
  nsfw: false,
  owner: true,
  cooldown: 5,
  category: "Developers",
  aliases: ["ao", "addowner", "add-owners"],
  botpermissions: ["SendMessages"],
  permissions: ["SendMessages"],
  async execute(client, message) {
    if (!message.guild || !message.channel || message.channel.type !== ChannelType.GuildText || !client.user) return;
    const lang = message.guild?.preferredLocale || "es-ES";
    const data = await main.DB.findDiscord(client.user.id);
    if (!data)
      return message.reply({
        embeds: [
          new EmbedCorrect()
            .setTitle(client.t("discord:addowners.errorTitle", { lng: lang }))
            .setDescription(
              [
                `${client.getEmoji(message.guild.id, "error")} ${client.t("discord:addowners.notSetup", { lng: lang })}`,
                client.t("discord:addowners.restart", { lng: lang }),
              ].join("\n"),
            ),
        ],
      });

    const owners = data.owners;
    const msg = await message.reply({
      embeds: [
        new EmbedCorrect()
          .setTitle(client.t("discord:addowners.title", { lng: lang }))
          .setDescription(
            [
              `${client.getEmoji(message.guild.id, "success")} ${client.t("discord:addowners.selectMenu", { lng: lang })}`,
              client.t("discord:addowners.limit", { lng: lang }),
            ].join("\n"),
          ),
      ],
      components: [
        new ActionRowBuilder<UserSelectMenuBuilder>().addComponents(
          new UserSelectMenuBuilder()
            .setCustomId("addowners")
            .setPlaceholder(client.t("discord:addowners.selectPlaceholder", { lng: lang }))
            .setMinValues(1)
            .setMaxValues(10),
        ),
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId("cancel")
            .setLabel(client.t("discord:addowners.cancel", { lng: lang }))
            .setStyle(ButtonStyle.Danger),
        ),
      ],
    });

    const filter = (i: { user: { id: string } }) => i.user.id === message.author.id;
    const collector = msg.createMessageComponentCollector({
      filter,
      time: 60000,
    });

    collector.on("collect", async (i: ButtonInteraction | UserSelectMenuInteraction) => {
      if (!message.guild || !message.channel || !client.user) return;
      if (i.isButton()) {
        if (i.customId === "cancel") {
          await msg.edit({
            embeds: [
              new EmbedCorrect()
                .setTitle(client.t("discord:addowners.title", { lng: lang }))
                .setDescription(
                  [
                    `${client.getEmoji(message.guild.id, "success")} ${client.t("discord:addowners.cancelled", { lng: lang })}`,
                    client.t("discord:addowners.useAgain", { lng: lang }),
                  ].join("\n"),
                ),
            ],
            components: [],
          });
          return collector.stop();
        }
      } else if (i.isUserSelectMenu()) {
        if (i.customId === "addowners") {
          const selectedUsers = i.values;
          const newOwners = selectedUsers.filter((userId: string) => !owners.includes(userId));
          if (newOwners.length > 0) {
            await main.prisma.discord.update({
              where: { clientId: client.user.id },
              data: {
                owners: [...owners, ...newOwners],
              },
            });
            await i.reply({
              embeds: [
                new EmbedCorrect()
                  .setTitle(client.t("discord:addowners.title", { lng: lang }))
                  .setDescription(
                    [
                      `${client.getEmoji(message.guild.id, "success")} ${client.t("discord:addowners.added", { lng: lang })}`,
                      `${client.t("discord:addowners.newOwners", { lng: lang })} ${newOwners.join(", ")}`,
                    ].join("\n"),
                  ),
              ],
            });
          } else {
            await i.reply({
              embeds: [
                new EmbedCorrect()
                  .setTitle(client.t("discord:addowners.title", { lng: lang }))
                  .setDescription(
                    [
                      `${client.getEmoji(message.guild.id, "error")} ${client.t("discord:addowners.noNew", { lng: lang })}`,
                      client.t("discord:addowners.allAlready", { lng: lang }),
                    ].join("\n"),
                  ),
              ],
            });
          }
        }
      }
    });

    return;
  },
};

export default OwnerAddCommand;
