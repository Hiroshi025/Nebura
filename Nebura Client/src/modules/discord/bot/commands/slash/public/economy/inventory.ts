import { SlashCommandBuilder } from "discord.js";

import { Command } from "@/modules/discord/structure/utils/builders";
import { InventoryCommand } from "@/modules/discord/structure/utils/economy/inventory";

export default new Command(
  new SlashCommandBuilder()
    .setName("inventory")
    .setNameLocalizations({
      "es-ES": "inventario",
    })
    .setDescription("🛒 Check what items you have that you bought from the shop")
    .setDescriptionLocalizations({
      "es-ES": "🛒 Comprueba qué elementos tienes que compraste en la tienda",
    })
    .addSubcommand((subCommand) => {
      return subCommand
        .setName("view")
        .setNameLocalizations({
          "es-ES": "ver",
        })
        .setDescription("🛒 view your inventory")
        .setDescriptionLocalizations({
          "es-ES": "🛒 ver tu inventario",
        })
        .addNumberOption((option) =>
          option
            .setName("page")
            .setNameLocalizations({
              "es-ES": "página",
            })
            .setDescription("🛒 The page you want to go to")
            .setDescriptionLocalizations({
              "es-ES": "🛒 La página a la que quieres ir",
            })
        );
    })
    .addSubcommand((subCommand) => {
      return subCommand
        .setName("use_item")
        .setNameLocalizations({
          "es-ES": "usar_elemento",
        })
        .setDescription("🛒 use an item from your inventory")
        .setDescriptionLocalizations({
          "es-ES": "🛒 usa un elemento de tu inventario",
        })
        .addStringOption((str) => {
          return str
            .setName("identifier")
            .setNameLocalizations({
              "es-ES": "identificador",
            })
            .setDescription("🛒 Item identifier")
            .setDescriptionLocalizations({
              "es-ES": "🛒 Identificador de elemento",
            })
            .setRequired(true);
        });
    }),
  async (client, interaction) => {
    if (!interaction.guild || !interaction.channel || !interaction.member) return;
    await InventoryCommand.Interaction(interaction, client);
  }
);
