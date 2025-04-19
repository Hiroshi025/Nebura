import { SlashCommandBuilder } from "discord.js";

import { Command } from "@/modules/discord/structure/utils/builders";
import { ShopEconomy } from "@/modules/discord/structure/utils/economy/shop";

export default new Command(
  new SlashCommandBuilder()
    .setName("shop")
    .setNameLocalizations({
      "es-ES": "tienda",
    })
    .setDescription("🛒 View the guild shop or change its settings!")
    .setDescriptionLocalizations({
      "es-ES": "🛒 ¡Ve la tienda del servidor o cambia su configuración!",
    })
    .addSubcommand((subCommand) => {
      return subCommand
        .setName("add")
        .setNameLocalizations({
          "es-ES": "añadir",
        })
        .setDescription("🛒 add an item to the shop")
        .setDescriptionLocalizations({
          "es-ES": "🛒 añade un artículo a la tienda",
        })
        .addStringOption((str) => {
          return str
            .setName("name")
            .setNameLocalizations({
              "es-ES": "nombre",
            })
            .setDescription("🛒 the name of the product. (not the identifier)")
            .setDescriptionLocalizations({
              "es-ES": "🛒 el nombre del producto. (no el identificador)",
            })
            .setRequired(true);
        })
        .addStringOption((str) => {
          return str
            .setName("description")
            .setNameLocalizations({
              "es-ES": "descripción",
            })
            .setDescription("🛒 the description of the item")
            .setDescriptionLocalizations({
              "es-ES": "🛒 la descripción del artículo",
            })
            .setRequired(true);
        })
        .addNumberOption((num) => {
          return num
            .setName("price")
            .setNameLocalizations({
              "es-ES": "precio",
            })
            .setDescription("🛒 the price of the item")
            .setDescriptionLocalizations({
              "es-ES": "🛒 el precio del artículo",
            })
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(1000000);
        })
        .addRoleOption((option) =>
          option
            .setName("role")
            .setNameLocalizations({
              "es-ES": "rol",
            })
            .setDescription("🛒 Give the user this role when he uses this item!")
            .setDescriptionLocalizations({
              "es-ES": "🛒 ¡Dale al usuario este rol cuando use este artículo!",
            })
        )
        .addNumberOption((option) =>
          option
            .setName("money")
            .setNameLocalizations({
              "es-ES": "dinero",
            })
            .setDescription("🛒 Give the user money when he uses this item!")
            .setDescriptionLocalizations({
              "es-ES": "🛒 ¡Dale al usuario dinero cuando use este artículo!",
            })
        )
        .addStringOption((str) => {
          return str
            .setName("identifier")
            .setNameLocalizations({
              "es-ES": "identificador",
            })
            .setDescription("🛒 the identifier of the product. (if not supplied a token will be generated)")
            .setDescriptionLocalizations({
              "es-ES": "🛒 el identificador del producto. (si no se suministra, se generará un token)",
            })
            .setRequired(false);
        });
    })
    .addSubcommand((subCommand) => {
      return subCommand
        .setName("view")
        .setNameLocalizations({
          "es-ES": "ver",
        })
        .setDescription("🛒 lets you view the shop!")
        .setDescriptionLocalizations({
          "es-ES": "🛒 ¡te permite ver la tienda!",
        })
        .addNumberOption((num) => {
          return num
            .setName("page")
            .setNameLocalizations({
              "es-ES": "página",
            })
            .setDescription("🛒 The page of the shop you want to view")
            .setDescriptionLocalizations({
              "es-ES": "🛒 La página de la tienda que deseas ver",
            });
        });
    })
    .addSubcommand((subCommand) => {
      return subCommand
        .setName("buy")
        .setNameLocalizations({
          "es-ES": "comprar",
        })
        .setDescription("🛒 Buy an item from the shop")
        .setDescriptionLocalizations({
          "es-ES": "🛒 Compra un artículo de la tienda",
        })
        .addStringOption((option) => {
          return option
            .setName("identifier")
            .setNameLocalizations({
              "es-ES": "identificador",
            })
            .setDescription("🛒 The identifier of the item you want to buy")
            .setDescriptionLocalizations({
              "es-ES": "🛒 El identificador del artículo que deseas comprar",
            });
        });
    })
    .addSubcommand((subCommand) => {
      return subCommand
        .setName("remove")
        .setNameLocalizations({
          "es-ES": "eliminar",
        })
        .setDescription("🛒 remove an item from the shop!")
        .setDescriptionLocalizations({
          "es-ES": "🛒 ¡elimina un artículo de la tienda!",
        })
        .addStringOption((option) => {
          return option
            .setName("identifier")
            .setNameLocalizations({
              "es-ES": "identificador",
            })
            .setDescription("🛒 The identifier of the item you want to remove")
            .setDescriptionLocalizations({
              "es-ES": "🛒 El identificador del artículo que deseas eliminar",
            });
        });
    }),
  async (client, interaction) => {
    if (!interaction.guild || !interaction.channel || !interaction.member) return;
    await ShopEconomy(interaction, client);
  }
);
