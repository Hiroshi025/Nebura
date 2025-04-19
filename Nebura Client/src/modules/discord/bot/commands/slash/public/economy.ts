import { SlashCommandBuilder } from "discord.js";

import { Command } from "@/modules/discord/structure/utils/builders";
import { BalanceCommand } from "@/modules/discord/structure/utils/economy/balance";
import { CoinflipCommand } from "@/modules/discord/structure/utils/economy/coinflip";
import { DailyCommand } from "@/modules/discord/structure/utils/economy/daily";
import { DueloCommand } from "@/modules/discord/structure/utils/economy/duelo";
import { InventoryCommand } from "@/modules/discord/structure/utils/economy/inventory";
import { PayEconomy } from "@/modules/discord/structure/utils/economy/pay";
import { ShopEconomy } from "@/modules/discord/structure/utils/economy/shop";
import { SlotsCommand } from "@/modules/discord/structure/utils/economy/slots";

export default new Command(
  new SlashCommandBuilder()
    .setName("economy")
    .setNameLocalizations({
      "es-ES": "economía",
    })
    .setDescription("Economy command to manage economy-related features.")
    .setDescriptionLocalizations({
      "es-ES": "Comando de economía para gestionar funciones relacionadas con la economía.",
    })
    .setDefaultMemberPermissions(0)
    .addSubcommandGroup((group) =>
      group
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
                }),
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
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("daily")
        .setNameLocalizations({
          "es-ES": "diario",
        })
        .setDescription(
          "💰 Get your daily reward! (You can only use this command once every 24 hours)",
        )
        .setDescriptionLocalizations({
          "es-ES":
            "💰 Obtén tu recompensa diaria. (Solo puedes usar este comando una vez cada 24 horas)",
        })
        .addStringOption((option) =>
          option
            .setName("card")
            .setNameLocalizations({
              "es-ES": "carta",
            })
            .setDescription("💰 Choose a card between `1`, `2`, `3`, or `4` to play!")
            .setDescriptionLocalizations({
              "es-ES": "💰 ¡Elige una carta entre `1`, `2`, `3` o `4` para jugar!",
            })
            .setRequired(false),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("pay")
        .setNameLocalizations({
          "es-ES": "pagar",
        })
        .setDescription("🛒 pays a user a selected amount")
        .setDescriptionLocalizations({
          "es-ES": "🛒 Paga a un usuario una cantidad seleccionada",
        })
        .addUserOption((option) =>
          option
            .setName("user")
            .setNameLocalizations({
              "es-ES": "usuario",
            })
            .setDescription("🛒 Select a user to pay")
            .setDescriptionLocalizations({
              "es-ES": "🛒 Selecciona un usuario para pagar",
            })
            .setRequired(true),
        )
        .addNumberOption((option) =>
          option
            .setName("amount")
            .setNameLocalizations({
              "es-ES": "cantidad",
            })
            .setDescription("🛒 The amount to pay the user")
            .setDescriptionLocalizations({
              "es-ES": "🛒 La cantidad a pagar al usuario",
            })
            .setRequired(true)
            .setMaxValue(1000)
            .setMinValue(1),
        ),
    )
    .addSubcommandGroup((group) =>
      group
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
                }),
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
                }),
            )
            .addStringOption((str) => {
              return str
                .setName("identifier")
                .setNameLocalizations({
                  "es-ES": "identificador",
                })
                .setDescription(
                  "🛒 the identifier of the product. (if not supplied a token will be generated)",
                )
                .setDescriptionLocalizations({
                  "es-ES":
                    "🛒 el identificador del producto. (si no se suministra, se generará un token)",
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
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("slots")
        .setNameLocalizations({
          "es-ES": "tragaperras",
        })
        .setDescription("Play a slot machine game! Spin the reels and see if you can win big!")
        .setDescriptionLocalizations({
          "es-ES":
            "¡Juega a la máquina tragaperras! Gira los carretes y mira si puedes ganar a lo grande.",
        })
        .addStringOption((option) =>
          option
            .setName("bet")
            .setNameLocalizations({
              "es-ES": "apuesta",
            })
            .setDescription(
              "The amount of money you want to bet on this spin. Must be a positive number.",
            )
            .setDescriptionLocalizations({
              "es-ES":
                "La cantidad de dinero que deseas apostar en este giro. Debe ser un número positivo.",
            })
            .setRequired(false),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("duel")
        .setNameLocalizations({
          "es-ES": "duelo",
        })
        .setDescription("⚔️ Challenge another user to a duel! Bet an amount and see who wins!")
        .setDescriptionLocalizations({
          "es-ES": "⚔️ ¡Reta a otro usuario a un duelo! Apuesta una cantidad y ve quién gana.",
        })
        .addUserOption((option) =>
          option
            .setName("user")
            .setNameLocalizations({
              "es-ES": "usuario",
            })
            .setDescription("⚔️ The user you want to challenge to a duel")
            .setDescriptionLocalizations({
              "es-ES": "⚔️ El usuario al que deseas desafiar a un duelo",
            })
            .setRequired(true),
        )
        .addNumberOption((option) =>
          option
            .setName("bet")
            .setNameLocalizations({
              "es-ES": "apuesta",
            })
            .setDescription("⚔️ The amount of money you want to bet on this duel")
            .setDescriptionLocalizations({
              "es-ES": "⚔️ La cantidad de dinero que deseas apostar en este duelo",
            })
            .setRequired(true)
            .setMinValue(500),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("coinflip")
        .setNameLocalizations({
          "es-ES": "cara_o_cruz",
        })
        .setDescription("🪙 Flip a coin and bet on the outcome!")
        .setDescriptionLocalizations({
          "es-ES": "🪙 ¡Lanza una moneda y apuesta por el resultado!",
        })
        .addNumberOption((option) =>
          option
            .setName("bet")
            .setNameLocalizations({
              "es-ES": "apuesta",
            })
            .setDescription("🪙 The amount of money you want to bet on this coin flip")
            .setDescriptionLocalizations({
              "es-ES": "🪙 La cantidad de dinero que deseas apostar en esta moneda",
            })
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(1000000),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("balance")
        .setNameLocalizations({
          "es-ES": "balance",
        })
        .setDescription("🛒 Returns the balance of a user")
        .setDescriptionLocalizations({
          "es-ES": "🛒 Devuelve el saldo de un usuario",
        })
        .addUserOption((option) =>
          option
            .setName("user")
            .setNameLocalizations({
              "es-ES": "usuario",
            })
            .setDescription("🛒 Select a user to get the balance of")
            .setDescriptionLocalizations({
              "es-ES": "🛒 Selecciona un usuario para obtener su saldo",
            }),
        ),
    ),
  async (client, interaction) => {
    if (!interaction.guild || !interaction.channel || !interaction.member) return;

    const group = interaction.options.getSubcommandGroup(false); // Obtener el grupo, si existe
    const subcommand = interaction.options.getSubcommand();

    if (group) {
      // Manejo de subcomandos dentro de grupos
      switch (group) {
        case "inventory":
          {
            await InventoryCommand.Interaction(interaction, client);
          }
          break;
        case "shop":
          {
            await ShopEconomy(interaction, client);
          }
          break;
        // Agregar más grupos si es necesario
      }
    } else {
      // Manejo de subcomandos independientes
      switch (subcommand) {
        case "balance":
          {
            await BalanceCommand.Interaction(interaction, client);
          }
          break;
        case "daily":
          {
            await DailyCommand.Interaction(interaction, client);
          }
          break;
        case "pay":
          {
            await PayEconomy(interaction, client);
          }
          break;
        case "slots":
          {
            await SlotsCommand(interaction, client);
          }
          break;
        case "duel":
          {
            await DueloCommand(interaction, client);
          }
          break;
        case "coinflip":
          {
            await CoinflipCommand(interaction, client);
          }
          break;
      }
    }
  },
);
