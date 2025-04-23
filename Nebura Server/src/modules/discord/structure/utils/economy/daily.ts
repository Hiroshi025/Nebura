import {
	ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, Message
} from "discord.js";

import { main } from "@/main";
import { EmbedCorrect, ErrorEmbed } from "@extenders/discord/embeds.extender";

import { MyClient } from "../../client";
import { fetchBalance, toFixedNumber } from "../functions";

export const DailyCommand = {
  Interaction: async (interaction: ChatInputCommandInteraction, _client: MyClient) => {
    if (!interaction.guild || !interaction.channel) return;

    const user = interaction.user;
    const userBalance = await fetchBalance(user.id, interaction.guild.id);

    const chosenCard = interaction.options.getString("card");
    if (!chosenCard || !["1", "2", "3", "4"].includes(chosenCard)) {
      return interaction.reply({
        embeds: [
          new ErrorEmbed().setDescription(
            "You must choose a card between `1`, `2`, `3`, or `4` to play!",
          ),
        ],
        flags: "Ephemeral",
      });
    }

    const randomCard = Math.floor(Math.random() * 4) + 1;

    if (parseInt(chosenCard) === randomCard) {
      const newBalance = await toFixedNumber(userBalance.balance + 50);
      await main.prisma.userEconomy.update({
        where: { id: userBalance.id },
        data: { balance: newBalance },
      });

      return interaction.reply({
        embeds: [
          new EmbedCorrect()
            .setDescription(
              `🎉 Congratulations! You chose card **${chosenCard}**, and the correct card was **${randomCard}**. You won **$50**!`,
            )
            .setColor("Green"),
        ],
        flags: "Ephemeral",
      });
    } else {
      const newBalance = await toFixedNumber(userBalance.balance - 10);
      await main.prisma.userEconomy.update({
        where: { id: userBalance.id },
        data: { balance: newBalance },
      });

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId("daily_x10")
          .setLabel("Bet x10")
          .setStyle(ButtonStyle.Danger),
      );

      await interaction.reply({
        embeds: [
          new ErrorEmbed()
            .setDescription(
              `😢 You chose card **${chosenCard}**, but the correct card was **${randomCard}**. You lost **$10**. Want to bet x10?`,
            )
            .setColor("Red"),
        ],
        components: [row],
        flags: "Ephemeral",
      });

      const collector = interaction.channel?.createMessageComponentCollector({
        filter: (i) => i.user.id === interaction.user.id && i.customId === "daily_x10",
        time: 10000,
      });

      collector?.on("collect", async (i) => {
        collector.stop();
        const x10RandomCard = Math.floor(Math.random() * 4) + 1;

        if (parseInt(chosenCard) === x10RandomCard) {
          const x10NewBalance = await toFixedNumber(userBalance.balance + 500);
          await main.prisma.userEconomy.update({
            where: { id: userBalance.id },
            data: { balance: x10NewBalance },
          });

          await i.update({
            embeds: [
              new EmbedCorrect()
                .setDescription(
                  `🎉 Amazing! You chose card **${chosenCard}**, and the correct card was **${x10RandomCard}**. You won **$500**!`,
                )
                .setColor("Green"),
            ],
            components: [],
          });
        } else {
          const x10NewBalance = await toFixedNumber(userBalance.balance - 100);
          await main.prisma.userEconomy.update({
            where: { id: userBalance.id },
            data: { balance: x10NewBalance },
          });

          await i.update({
            embeds: [
              new ErrorEmbed()
                .setDescription(
                  `😢 You chose card **${chosenCard}**, but the correct card was **${x10RandomCard}**. You lost **$100**. Better luck next time!`,
                )
                .setColor("Red"),
            ],
            components: [],
          });
        }
      });

      collector?.on("end", async (_, reason) => {
        if (reason === "time") {
          await interaction.editReply({
            components: [],
          });
        }
      });
    }

    return;
  },
  Message: async (message: Message, _client: MyClient, args: string[]) => {
    if (!message.guild || !message.channel || !message.member) return;

    const user = message.author;
    const userBalance = await fetchBalance(user.id, message.guild.id);

    const chosenCard = args[0];
    if (!chosenCard || !["1", "2", "3", "4"].includes(chosenCard)) {
      return message.reply({
        embeds: [
          new ErrorEmbed().setDescription(
            "You must choose a card between `1`, `2`, `3`, or `4` to play!",
          ),
        ],
      });
    }

    const randomCard = Math.floor(Math.random() * 4) + 1;

    if (parseInt(chosenCard) === randomCard) {
      const newBalance = await toFixedNumber(userBalance.balance + 50);
      await main.prisma.userEconomy.update({
        where: { id: userBalance.id },
        data: { balance: newBalance },
      });

      return message.reply({
        embeds: [
          new EmbedCorrect()
            .setDescription(
              `🎉 Congratulations! You chose card **${chosenCard}**, and the correct card was **${randomCard}**. You won **$50**!`,
            )
            .setColor("Green"),
        ],
      });
    } else {
      const newBalance = await toFixedNumber(userBalance.balance - 10);
      await main.prisma.userEconomy.update({
        where: { id: userBalance.id },
        data: { balance: newBalance },
      });

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId("daily_x10")
          .setLabel("Bet x10")
          .setStyle(ButtonStyle.Danger),
      );

      const reply = await message.reply({
        embeds: [
          new ErrorEmbed()
            .setDescription(
              `😢 You chose card **${chosenCard}**, but the correct card was **${randomCard}**. You lost **$10**. Want to bet x10?`,
            )
            .setColor("Red"),
        ],
        components: [row],
      });

      const collector = reply.createMessageComponentCollector({
        filter: (i) => i.user.id === message.author.id && i.customId === "daily_x10",
        time: 10000,
      });

      collector?.on("collect", async (i) => {
        collector.stop();
        const x10RandomCard = Math.floor(Math.random() * 4) + 1;

        if (parseInt(chosenCard) === x10RandomCard) {
          const x10NewBalance = await toFixedNumber(userBalance.balance + 500);
          await main.prisma.userEconomy.update({
            where: { id: userBalance.id },
            data: { balance: x10NewBalance },
          });

          await i.update({
            embeds: [
              new EmbedCorrect()
                .setDescription(
                  `🎉 Amazing! You chose card **${chosenCard}**, and the correct card was **${x10RandomCard}**. You won **$500**!`,
                )
                .setColor("Green"),
            ],
            components: [],
          });
        } else {
          const x10NewBalance = await toFixedNumber(userBalance.balance - 100);
          await main.prisma.userEconomy.update({
            where: { id: userBalance.id },
            data: { balance: x10NewBalance },
          });

          await i.update({
            embeds: [
              new ErrorEmbed()
                .setDescription(
                  `😢 You chose card **${chosenCard}**, but the correct card was **${x10RandomCard}**. You lost **$100**. Better luck next time!`,
                )
                .setColor("Red"),
            ],
            components: [],
          });
        }
      });

      collector?.on("end", async (_, reason) => {
        if (reason === "time") {
          await reply.edit({
            components: [],
          });
        }
      });
    }

    return;
  },
};
