import { Message } from "discord.js";

import { main } from "@/main";
import { EmbedCorrect, ErrorEmbed } from "@utils/extenders/embeds.extend";

import { MyClient } from "../../../client";
import { fetchBalance } from "../functions";

export const RobCommand = {
  Message: async (message: Message, client: MyClient, args: string[]) => {
    if (!message.guild || !message.channel || !message.member) return;
    const user = message.mentions.users.first() || message.guild.members.cache.get(args[0])?.user;
    if (!user) {
      return message.reply({
        embeds: [new ErrorEmbed().setDescription("Please mention a user to rob!")],
      });
    }

    const userBalance = await fetchBalance(user?.id as string, message.guild.id);

    const robChance = Math.floor(Math.random() * 100) + 1;
    const robAmount = Math.floor(Math.random() * userBalance.balance) + 1;

    if (robChance > 50) {
      await main.prisma.userEconomy.update({
        where: { id: userBalance.id },
        data: { balance: userBalance.balance - robAmount },
      });
      await main.prisma.userEconomy.update({
        where: { id: userBalance.id },
        data: { balance: userBalance.balance + robAmount },
      });

      return message.reply({
        embeds: [
          new EmbedCorrect().setDescription(
            [
              `${client.getEmoji(message.guild.id, "success")} You successfully robbed ${user}!`,
              `You stole $${robAmount} from them.`,
            ].join("\n"),
          ),
        ],
      });
    } else {
      return message.reply({
        embeds: [
          new ErrorEmbed().setDescription(
            [
              `${client.getEmoji(message.guild.id, "error")} You failed to rob ${user}!`,
              `You lost $${robAmount} in the process.`,
            ].join("\n"),
          ),
        ],
      });
    }
  },
};
