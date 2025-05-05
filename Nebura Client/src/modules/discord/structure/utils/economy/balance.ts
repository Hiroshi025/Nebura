import { ChannelType, ChatInputCommandInteraction, Message } from "discord.js";

import { EmbedCorrect } from "@extenders/discord/embeds.extender";

import { MyClient } from "../../../client";
import { getBalance } from "../functions";

export const BalanceCommand = {
  Interaction: async (interaction: ChatInputCommandInteraction, client: MyClient) => {
    if (!interaction.guild || !interaction.channel) return;
    const user = interaction.options.getUser("user") || interaction.user;
    const dbBalance = await getBalance(user.id, interaction.guild.id);

    if (!dbBalance) {
      return await interaction.reply({
        embeds: [
          new EmbedCorrect().setDescription(
            [
              `${client.getEmoji(interaction.guild.id, "error")} **${user.username}** does not have an account yet!`,
              `Use \`/register\` to create an account!`,
            ].join("\n"),
          ),
        ],
        flags: "Ephemeral",
      });
    }

    return await interaction.reply({
      embeds: [
        new EmbedCorrect()
          .setTitle(`${user.username}'s Balance`)
          .setDescription(`**User has $${dbBalance.balance}**`),
      ],
    });
  },
  Message: async (message: Message, client: MyClient) => {
    if (!message.guild || !message.channel || message.channel.type !== ChannelType.GuildText)
      return;
    const user = message.mentions.users.first() || message.author;
    const dbBalance = await getBalance(user.id, message.guild.id);

    if (!dbBalance) {
      return await message.channel.send({
        embeds: [
          new EmbedCorrect().setDescription(
            [
              `${client.getEmoji(message.guild.id, "error")} **${user.username}** does not have an account yet!`,
              `Use \`/register\` to create an account!`,
            ].join("\n"),
          ),
        ],
      });
    }

    return await message.channel.send({
      embeds: [
        new EmbedCorrect()
          .setTitle(`${user.username}'s Balance`)
          .setDescription(`**User has $${dbBalance.balance}**`),
      ],
    });
  },
};
