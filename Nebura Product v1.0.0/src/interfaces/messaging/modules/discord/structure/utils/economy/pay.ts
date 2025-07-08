import { ChatInputCommandInteraction } from "discord.js";

import { main } from "@/main";
import { EmbedCorrect, ErrorEmbed } from "@/shared/adapters/extends/embeds.extend";

import { MyClient } from "../../../client";
import { fetchBalance, toFixedNumber } from "../functions";

export async function PayEconomy(interaction: ChatInputCommandInteraction, client: MyClient) {
  if (!interaction.guild || !interaction.channel || !interaction.member) return;
  const user = interaction.options.getUser("user") || interaction.user;

  const userBalance = await fetchBalance(interaction.user.id, interaction.guild.id);

  let amount = interaction.options.getNumber("amount");
  if (!amount)
    return {
      embeds: [
        new EmbedCorrect().setDescription(
          [
            `${client.getEmoji(interaction.guild.id, "error")} You need to specify an amount to pay!`,
            `Example: \`/pay @user 100\``,
          ].join("\n"),
        ),
      ],
      flags: "Ephemeral",
    };

  if (user.bot || user.id === interaction.user.id)
    return await interaction.reply({
      embeds: [
        new EmbedCorrect()
          .setDescription(
            [
              `${client.getEmoji(interaction.guild.id, "error")} You cannot pay a bot or yourself!`,
              `Please mention a valid user to pay.`,
            ].join("\n"),
          )
          .setColor("Red"),
      ],
      flags: "Ephemeral",
    });

  if (amount > userBalance.balance)
    return await interaction.reply({
      embeds: [
        new EmbedCorrect()
          .setDescription(
            [
              `${client.getEmoji(interaction.guild.id, "error")} You do not have enough balance to pay this amount!`,
              `Your current balance is $${userBalance.balance}.`,
            ].join("\n"),
          )
          .setColor("Red"),
      ],
    });

  const selectedUserBalance = await fetchBalance(user.id, interaction.guild.id);

  amount = await toFixedNumber(amount);

  const balanceFixed = await toFixedNumber(userBalance.balance - amount);
  await main.prisma.userEconomy.update({
    where: { id: userBalance.id },
    data: { balance: balanceFixed },
  });

  const userBalanceFixed = await toFixedNumber(selectedUserBalance.balance + amount);
  await main.prisma.userEconomy.update({
    where: { id: selectedUserBalance.id },
    data: { balance: userBalanceFixed },
  });

  await interaction.reply({
    embeds: [
      new EmbedCorrect()
        .setDescription(
          [
            `${client.getEmoji(interaction.guild.id, "correct")} You have successfully paid ${amount} to ${user}!`,
            `Your current balance is $${balanceFixed}.`,
          ].join("\n"),
        )
        .setColor("Green"),
    ],
    flags: "Ephemeral",
  });

  const userGet = client.users.cache.get(user.id);
  if (!userGet)
    return {
      embeds: [
        new ErrorEmbed().setDescription(
          [
            `${client.getEmoji(interaction.guild.id, "error")} The user you are trying to pay is not in the server!`,
            `Please make sure the user is in the server and try again.`,
          ].join("\n"),
        ),
      ],
    };

  await userGet.send({
    embeds: [
      new EmbedCorrect()
        .setDescription(
          `You have received a total of ${amount} from ${
            interaction.user
          }! This amount has been deposited to your balance and you total now is $${
            selectedUserBalance.balance + amount
          }`,
        )
        .setColor("Green")
        .setImage("https://cdn.discordapp.com/attachments/1098838797229236315/1098864088639078481/money-banner.png"),
    ],
  });

  return;
}
