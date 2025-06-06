import { ChatInputCommandInteraction, PermissionFlagsBits, PermissionsBitField } from "discord.js";

import { main } from "@/main";
import { EmbedCorrect, ErrorEmbed } from "@modules/discord/structure/extends/embeds.extend";

import { MyClient } from "../../../client";
import { fetchBalance, generateToken, toFixedNumber } from "../functions";

export async function ShopEconomy(interaction: ChatInputCommandInteraction, client: MyClient) {
  if (!interaction.guild || !interaction.channel || !interaction.user || !interaction.member)
    return;
  const tokenItem = await generateToken(5);
  const { options } = interaction;

  switch (options.getSubcommand()) {
    case "add":
      {
        const itemName = options.getString("name");
        const itemDescription = options.getString("description");
        const itemPrice = options.getNumber("price");
        const roleOption = interaction.options.getRole("role");
        const itemIdentifier = options.getString("identifier") || tokenItem;

        if (!itemName || !itemDescription || !itemPrice)
          return interaction.reply({
            embeds: [
              new ErrorEmbed().setDescription(
                [
                  `${client.getEmoji(interaction.guild.id, "error")} Please provide all the required fields!`,
                  `**Usage:** /shop add --name <name> --description <description> --price <price> --identifier <identifier> --role <role> --money <money>`,
                ].join("\n"),
              ),
            ],
          });

        if (!itemIdentifier) {
          return interaction.reply({
            embeds: [
              new ErrorEmbed().setDescription(
                [
                  `${client.getEmoji(interaction.guild.id, "error")} Please provide a valid identifier!`,
                  `**Usage:** /shop add --name <name> --description <description> --price <price> --identifier <identifier> --role <role> --money <money>`,
                ].join("\n"),
              ),
            ],
          });
        }

        const money = options.getNumber("money") || null;
        let role = null;
        if (interaction.options.getRole("role")) role = roleOption?.id;

        if (
          !(interaction.member.permissions as PermissionsBitField).has(
            PermissionFlagsBits.ManageGuild,
          )
        )
          return await interaction.reply({
            content: "You do not have enough permissions to use this command!",
          });

        await main.prisma.shopEconomy.create({
          data: {
            guildId: interaction.guild.id,
            itemName: itemName,
            itemDescription: itemDescription,
            itemPrice: itemPrice.toString(),
            itemIdentifier: itemIdentifier,
            role: role ?? "",
            money: money ?? 0,
          },
        });

        await interaction.reply({
          embeds: [
            new EmbedCorrect()
              .setTitle("New Item Added!")
              .setDescription(
                [
                  `${client.getEmoji(interaction.guild.id, "correct")} Successfully added a new item to the shop!`,
                  `**Item Name:** ${itemName}`,
                ].join("\n"),
              )
              .addFields(
                {
                  name: "Item Name",
                  value: itemName,
                },
                {
                  name: "Item Description",
                  value: itemDescription,
                },
                {
                  name: "Item Price",
                  value: `$${itemPrice}`,
                },
                {
                  name: "Item Identifier",
                  value: `\`${itemIdentifier}\``,
                },
                {
                  name: "Money given when claimed",
                  value: `\`${money}\``,
                },
                {
                  name: "Role given when claimed",
                  value: `\`${role}\``,
                },
              ),
          ],
        });
      }
      break;
    case "view":
      {
        const page = options.getNumber("page");

        const shopData = await main.prisma.shopEconomy.findMany({
          where: {
            guildId: interaction.guild.id,
          },
        });

        if (!shopData)
          return await interaction.reply({
            embeds: [
              new ErrorEmbed()
                .setDescription(
                  [
                    `${client.getEmoji(interaction.guild.id, "error")} There are no items in the shop!`,
                    `**Usage:** /shop add --name <name> --description <description> --price <price> --identifier <identifier> --role <role> --money <money>`,
                  ].join("\n"),
                )
                .setColor("Red"),
            ],
          });

        const embed = new EmbedCorrect()
          .setTitle(`Server Shop`)
          .setDescription("to buy an item please use `/shop buy`!")
          .setColor("Random");

        if (page) {
          const pageNum = 5 * page - 5;

          if (shopData.length >= 6) {
            embed.setFooter({
              text: `page ${page} of ${Math.ceil(shopData.length / 5)}`,
            });
          }

          for (const item of shopData.splice(pageNum, 5)) {
            embed.addFields({
              name: `${item.itemName}  <->  $${item.itemPrice}`,
              value: `> Identifier: \`${item.itemIdentifier}\`\n> Description: ${item.itemDescription}\n> Given Role: ${item.role}\n> Given Money: ${item.money}\n`,
            });
          }

          return await interaction.reply({ embeds: [embed] });
        }

        if (shopData.length >= 6) {
          embed.setFooter({
            text: `page 1 of ${Math.ceil(shopData.length / 5)}`,
          });
        }

        for (const item of shopData.slice(0, 5)) {
          embed.addFields({
            name: `${item.itemName}  <->  $${item.itemPrice}`,
            value: `> Identifier: \`${item.itemIdentifier}\`\n> Description: ${item.itemDescription}\n> Given Role: ${item.role}\n> Given Money: ${item.money}\n`,
          });
        }

        await interaction.reply({ embeds: [embed] });
      }
      break;

    case "buy":
      {
        const identifier = interaction.options.getString("identifier");

        const itemShopData = await main.prisma.shopEconomy.findFirst({
          where: {
            guildId: interaction.guild.id,
          },
        });

        if (!itemShopData)
          return await interaction.reply({
            embeds: [
              new ErrorEmbed()
                .setDescription(
                  [
                    `${client.getEmoji(interaction.guild.id, "error")} There are no items in the shop!`,
                    `**Usage:** /shop add --name <name> --description <description> --price <price> --identifier <identifier> --role <role> --money <money>`,
                  ].join("\n"),
                )
                .setColor("Red"),
            ],
          });

        const userBalance = await fetchBalance(interaction.user.id, interaction.guild.id);

        const InvData = await main.prisma.userInventory.findFirst({
          where: {
            guildId: interaction.guild.id,
            userId: interaction.user.id,
            itemIdentifier: identifier as string,
          },
        });

        if (InvData)
          return await interaction.reply({
            embeds: [
              new ErrorEmbed()
                .setDescription(
                  [
                    `${client.getEmoji(interaction.guild.id, "error")} You already have this item in your inventory!`,
                    `**Usage:** /shop buy --identifier <identifier>`,
                  ].join("\n"),
                )
                .setColor("Red"),
            ],
          });

        if (!itemShopData || itemShopData.itemIdentifier !== identifier)
          return await interaction.reply({
            embeds: [
              new ErrorEmbed()
                .setDescription(
                  [
                    `${client.getEmoji(interaction.guild.id, "error")} That item does not exist in the shop!`,
                    `**Usage:** /shop buy --identifier <identifier>`,
                  ].join("\n"),
                )
                .setColor("Red"),
            ],
          });

        const item = await main.prisma.shopEconomy.findFirst({
          where: {
            guildId: interaction.guild.id,
            itemIdentifier: identifier,
          },
        });

        if (!item)
          return interaction.reply({
            embeds: [
              new ErrorEmbed()
                .setDescription(
                  [
                    `${client.getEmoji(interaction.guild.id, "error")} That item does not exist in the shop!`,
                    `**Usage:** /shop buy --identifier <identifier>`,
                  ].join("\n"),
                )
                .setColor("Red"),
            ],
          });

        if (Number(item.itemPrice) > userBalance.balance)
          return await interaction.reply({
            embeds: [
              new ErrorEmbed().setDescription(
                [
                  `${client.getEmoji(interaction.guild.id, "error")} You do not have enough money to buy this item!`,
                  `**Usage:** /shop buy --identifier <identifier>`,
                ].join("\n"),
              ),
            ],
          });

        const balanceFixed = await toFixedNumber(userBalance.balance - Number(item.itemPrice));

        await main.prisma.userEconomy.update({
          where: { id: userBalance.id },
          data: {
            balance: balanceFixed,
          },
        });

        await main.prisma.userInventory.create({
          data: {
            guildId: interaction.guild.id,
            userId: interaction.user.id,
            itemIdentifier: identifier,
            itemName: item.itemName,
            itemPrice: item.itemPrice,
            itemDescription: item.itemDescription,
            role: item.role as string,
            money: item.money as number,
          },
        });

        await interaction.reply({
          embeds: [
            new EmbedCorrect().setDescription(
              `You have bought ${item.itemName} for $${item.itemPrice}! This item has been moved into your inventory.`,
            ),
          ],
        });
      }

      break;
    case "remove": {
      if (
        !(interaction.member.permissions as PermissionsBitField).has(
          PermissionFlagsBits.ManageGuild,
        )
      ) {
        return await interaction.reply({
          embeds: [
            new ErrorEmbed()
              .setDescription(
                `${client.getEmoji(interaction.guild.id, "error")} You do not have enough permissions to use this command!`,
              )
              .setColor("Red"),
          ],
        });
      }

      const ID = interaction.options.getString("identifier");
      if (!ID) {
        return await interaction.reply({
          embeds: [
            new ErrorEmbed()
              .setDescription(
                [
                  `${client.getEmoji(interaction.guild.id, "error")} Please provide a valid identifier!`,
                  `**Usage:** /shop remove --identifier <identifier>`,
                ].join("\n"),
              )
              .setColor("Red"),
          ],
          flags: "Ephemeral",
        });
      }

      const findShop = await main.prisma.shopEconomy.findFirst({
        where: {
          guildId: interaction.guild.id,
          itemIdentifier: ID,
        },
      });

      if (!findShop) {
        return await interaction.reply({
          embeds: [
            new ErrorEmbed()
              .setDescription(
                [
                  `${client.getEmoji(interaction.guild.id, "error")} That item does not exist in the shop!`,
                  `**Usage:** /shop remove --identifier <identifier>`,
                ].join("\n"),
              )
              .setColor("Red"),
          ],
          flags: "Ephemeral",
        });
      }

      await main.prisma.shopEconomy.deleteMany({
        where: {
          guildId: interaction.guild.id,
          itemIdentifier: ID,
        },
      });

      return await interaction.reply({
        embeds: [
          new EmbedCorrect()
            .setDescription(
              [
                `${client.getEmoji(interaction.guild.id, "correct")} Successfully removed the item from the shop!`,
                `**Item Name:** ${findShop.itemName}`,
              ].join("\n"),
            )
            .setColor("Red"),
        ],
        flags: "Ephemeral",
      });
    }
    default:
      break;
  }

  return;
}
