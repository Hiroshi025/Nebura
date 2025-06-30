import {
	ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ChannelType,
	UserSelectMenuBuilder, UserSelectMenuInteraction
} from "discord.js";

import { main } from "@/main";
import { Precommand } from "@typings/modules/discord";
import { EmbedCorrect } from "@utils/extends/embeds.extension";

const OwnerAddCommand: Precommand = {
  name: "addowners",
  description: "Add owners to the bot",
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
    const data = await main.DB.findDiscord(client.user.id);
    if (!data)
      return message.reply({
        embeds: [
          new EmbedCorrect()
            .setTitle("Error Add Owners")
            .setDescription(
              [
                `${client.getEmoji(message.guild.id, "error")} The bot is not set up in this server.`,
                `Please restart proyect to set up the bot.`,
              ].join("\n"),
            ),
        ],
      });

    const owners = data.owners;
    const msg = await message.reply({
      embeds: [
        new EmbedCorrect()
          .setTitle("Add Owners")
          .setDescription(
            [
              `${client.getEmoji(message.guild.id, "success")} Click the select user menu to add owners.`,
              `You can add up to 10 owners.`,
            ].join("\n"),
          ),
      ],
      components: [
        new ActionRowBuilder<UserSelectMenuBuilder>().addComponents(
          new UserSelectMenuBuilder()
            .setCustomId("addowners")
            .setPlaceholder("Select a user to add as owner")
            .setMinValues(1)
            .setMaxValues(10),
        ),
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder().setCustomId("cancel").setLabel("Cancel").setStyle(ButtonStyle.Danger),
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
                .setTitle("Add Owners")
                .setDescription(
                  [
                    `${client.getEmoji(message.guild.id, "success")} Cancelled adding owners.`,
                    `You can use the command again to add owners.`,
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
                  .setTitle("Add Owners")
                  .setDescription(
                    [
                      `${client.getEmoji(message.guild.id, "success")} Owners added successfully.`,
                      `New owners: ${newOwners.join(", ")}`,
                    ].join("\n"),
                  ),
              ],
            });
          } else {
            await i.reply({
              embeds: [
                new EmbedCorrect()
                  .setTitle("Add Owners")
                  .setDescription(
                    [
                      `${client.getEmoji(message.guild.id, "error")} No new owners to add.`,
                      `All selected users are already owners.`,
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

export = OwnerAddCommand;
