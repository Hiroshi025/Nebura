"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="ee00911d-8f02-5737-92c9-321929018b4b")}catch(e){}}();

Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const builders_1 = require("../../../../../../../../interfaces/messaging/modules/discord/structure/utils/builders");
const coinflip_1 = require("../../../../../../../../interfaces/messaging/modules/discord/structure/utils/economy/coinflip");
const daily_1 = require("../../../../../../../../interfaces/messaging/modules/discord/structure/utils/economy/daily");
const duelo_1 = require("../../../../../../../../interfaces/messaging/modules/discord/structure/utils/economy/duelo");
const inventory_1 = require("../../../../../../../../interfaces/messaging/modules/discord/structure/utils/economy/inventory");
const pay_1 = require("../../../../../../../../interfaces/messaging/modules/discord/structure/utils/economy/pay");
const roulette_1 = require("../../../../../../../../interfaces/messaging/modules/discord/structure/utils/economy/roulette");
const rps_1 = require("../../../../../../../../interfaces/messaging/modules/discord/structure/utils/economy/rps");
const shop_1 = require("../../../../../../../../interfaces/messaging/modules/discord/structure/utils/economy/shop");
const slots_1 = require("../../../../../../../../interfaces/messaging/modules/discord/structure/utils/economy/slots");
const status_1 = require("../../../../../../../../interfaces/messaging/modules/discord/structure/utils/economy/status");
const work_1 = require("../../../../../../../../interfaces/messaging/modules/discord/structure/utils/economy/work");
exports.default = new builders_1.Command(new discord_js_1.SlashCommandBuilder()
    .setName("economy")
    .setNameLocalizations({
    "es-ES": "economía",
})
    .setDescription("Economy command to manage economy-related features.")
    .setDescriptionLocalizations({
    "es-ES": "Comando de economía para gestionar funciones relacionadas con la economía.",
})
    .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.SendMessages)
    .addSubcommandGroup((group) => group
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
        .addNumberOption((option) => option
        .setName("page")
        .setNameLocalizations({
        "es-ES": "página",
    })
        .setDescription("🛒 The page you want to go to")
        .setDescriptionLocalizations({
        "es-ES": "🛒 La página a la que quieres ir",
    }));
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
}))
    .addSubcommand((subcommand) => subcommand
    .setName("daily")
    .setNameLocalizations({
    "es-ES": "diario",
})
    .setDescription("💰 Get your daily reward! (You can only use this command once every 24 hours)")
    .setDescriptionLocalizations({
    "es-ES": "💰 Obtén tu recompensa diaria. (Solo puedes usar este comando una vez cada 24 horas)",
})
    .addStringOption((option) => option
    .setName("card")
    .setNameLocalizations({
    "es-ES": "carta",
})
    .setDescription("💰 Choose a card between `1`, `2`, `3`, or `4` to play!")
    .setDescriptionLocalizations({
    "es-ES": "💰 ¡Elige una carta entre `1`, `2`, `3` o `4` para jugar!",
})
    .setRequired(false)))
    .addSubcommand((subcommand) => subcommand
    .setName("work")
    .setNameLocalizations({
    "es-ES": "trabajo",
})
    .setDescription("💼 Get a job and earn money!")
    .setDescriptionLocalizations({
    "es-ES": "💼 Consigue un trabajo y gana dinero!",
}))
    .addSubcommand((subcommand) => subcommand
    .setName("jobs")
    .setNameLocalizations({
    "es-ES": "trabajos",
})
    .setDescription("💼 View all available jobs")
    .setDescriptionLocalizations({
    "es-ES": "💼 Ver todos los trabajos disponibles",
}))
    .addSubcommand((subcommand) => subcommand
    .setName("pay")
    .setNameLocalizations({
    "es-ES": "pagar",
})
    .setDescription("🛒 pays a user a selected amount")
    .setDescriptionLocalizations({
    "es-ES": "🛒 Paga a un usuario una cantidad seleccionada",
})
    .addUserOption((option) => option
    .setName("user")
    .setNameLocalizations({
    "es-ES": "usuario",
})
    .setDescription("🛒 Select a user to pay")
    .setDescriptionLocalizations({
    "es-ES": "🛒 Selecciona un usuario para pagar",
})
    .setRequired(true))
    .addNumberOption((option) => option
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
    .setMinValue(1)))
    .addSubcommandGroup((group) => group
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
        .addRoleOption((option) => option
        .setName("role")
        .setNameLocalizations({
        "es-ES": "rol",
    })
        .setDescription("🛒 Give the user this role when he uses this item!")
        .setDescriptionLocalizations({
        "es-ES": "🛒 ¡Dale al usuario este rol cuando use este artículo!",
    }))
        .addNumberOption((option) => option
        .setName("money")
        .setNameLocalizations({
        "es-ES": "dinero",
    })
        .setDescription("🛒 Give the user money when he uses this item!")
        .setDescriptionLocalizations({
        "es-ES": "🛒 ¡Dale al usuario dinero cuando use este artículo!",
    }))
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
}))
    .addSubcommand((subcommand) => subcommand
    .setName("slots")
    .setNameLocalizations({
    "es-ES": "tragaperras",
})
    .setDescription("Play a slot machine game! Spin the reels and see if you can win big!")
    .setDescriptionLocalizations({
    "es-ES": "¡Juega a la máquina tragaperras! Gira los carretes y mira si puedes ganar a lo grande.",
})
    .addNumberOption((option) => option
    .setName("bet")
    .setNameLocalizations({
    "es-ES": "apuesta",
})
    .setDescription("The amount of money you want to bet on this spin. Must be a positive number.")
    .setDescriptionLocalizations({
    "es-ES": "La cantidad de dinero que deseas apostar en este giro. Debe ser un número positivo.",
})
    .setRequired(false)))
    .addSubcommand((subcommand) => subcommand
    .setName("duel")
    .setNameLocalizations({
    "es-ES": "duelo",
})
    .setDescription("⚔️ Challenge another user to a duel! Bet an amount and see who wins!")
    .setDescriptionLocalizations({
    "es-ES": "⚔️ ¡Reta a otro usuario a un duelo! Apuesta una cantidad y ve quién gana.",
})
    .addUserOption((option) => option
    .setName("user")
    .setNameLocalizations({
    "es-ES": "usuario",
})
    .setDescription("⚔️ The user you want to challenge to a duel")
    .setDescriptionLocalizations({
    "es-ES": "⚔️ El usuario al que deseas desafiar a un duelo",
})
    .setRequired(true))
    .addNumberOption((option) => option
    .setName("bet")
    .setNameLocalizations({
    "es-ES": "apuesta",
})
    .setDescription("⚔️ The amount of money you want to bet on this duel")
    .setDescriptionLocalizations({
    "es-ES": "⚔️ La cantidad de dinero que deseas apostar en este duelo",
})
    .setRequired(true)
    .setMinValue(500)))
    .addSubcommand((subcommand) => subcommand
    .setName("coinflip")
    .setNameLocalizations({
    "es-ES": "cara_o_cruz",
})
    .setDescription("🪙 Flip a coin and bet on the outcome!")
    .setDescriptionLocalizations({
    "es-ES": "🪙 ¡Lanza una moneda y apuesta por el resultado!",
})
    .addNumberOption((option) => option
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
    .setMaxValue(1000000)))
    .addSubcommand((subcommand) => subcommand
    .setName("rps")
    .setNameLocalizations({
    "es-ES": "piedra_papel_tijera",
})
    .setDescription("🪨✂️ Challenge another user to a game of Rock, Paper, Scissors!")
    .setDescriptionLocalizations({
    "es-ES": "🪨✂️ ¡Reta a otro usuario a un juego de Piedra, Papel o Tijera!",
})
    .addUserOption((option) => option
    .setName("user")
    .setNameLocalizations({
    "es-ES": "usuario",
})
    .setDescription("🪨✂️ The user you want to challenge to a game of Rock, Paper, Scissors")
    .setDescriptionLocalizations({
    "es-ES": "🪨✂️ El usuario al que deseas desafiar a un juego de Piedra, Papel o Tijera",
})
    .setRequired(true))
    .addNumberOption((option) => option
    .setName("bet")
    .setNameLocalizations({
    "es-ES": "apuesta",
})
    .setDescription("🪨✂️ The amount of money you want to bet on this game")
    .setDescriptionLocalizations({
    "es-ES": "🪨✂️ La cantidad de dinero que deseas apostar en este juego",
})
    .setRequired(true)
    .setMinValue(1)
    .setMaxValue(1000000)))
    .addSubcommand((subcommand) => subcommand
    .setName("state")
    .setNameLocalizations({
    "es-ES": "estado",
})
    .setDescription("💰 Check your economy state")
    .setDescriptionLocalizations({
    "es-ES": "💰 Verifica tu estado económico",
})
    .addUserOption((option) => option
    .setName("user")
    .setNameLocalizations({
    "es-ES": "usuario",
})
    .setDescription("💰 The user you want to check the economy state of")
    .setDescriptionLocalizations({
    "es-ES": "💰 El usuario del que deseas verificar el estado económico",
})))
    .addSubcommand((subcommand) => subcommand
    .setName("roulette")
    .setNameLocalizations({
    "es-ES": "ruleta",
})
    .setDescription("🎰 Play a game of roulette! Bet on a number and see if you win!")
    .setDescriptionLocalizations({
    "es-ES": "🎰 ¡Juega a un juego de ruleta! Apuesta a un número y ve si ganas!",
})
    .addNumberOption((option) => option
    .setName("bet")
    .setNameLocalizations({
    "es-ES": "apuesta",
})
    .setDescription("🎰 The amount of money you want to bet on this roulette game")
    .setDescriptionLocalizations({
    "es-ES": "🎰 La cantidad de dinero que deseas apostar en este juego de ruleta",
})
    .setRequired(true)
    .setMinValue(1)
    .setMaxValue(1000000))
    .addNumberOption((option) => option
    .setName("number")
    .setNameLocalizations({
    "es-ES": "número",
})
    .setDescription("🎰 The number you want to bet on (0-36)")
    .setDescriptionLocalizations({
    "es-ES": "🎰 El número en el que deseas apostar (0-36)",
})
    .setRequired(true)
    .setMinValue(0)
    .setMaxValue(36))
    .addStringOption((option) => option
    .setName("color")
    .setNameLocalizations({
    "es-ES": "color",
})
    .setDescription("🎰 The color you want to bet on (red, black, or green)")
    .setDescriptionLocalizations({
    "es-ES": "🎰 El color en el que deseas apostar (rojo, negro o verde)",
})
    .setRequired(true)))
    .addSubcommand((subcommand) => subcommand
    .setName("train")
    .setNameLocalizations({
    "es-ES": "entrenar",
})
    .setDescription("📚 Train to improve your job skills and increase your salary.")
    .setDescriptionLocalizations({
    "es-ES": "📚 Entrena para mejorar tus habilidades laborales y aumentar tu salario.",
}))
    .addSubcommand((subcommand) => subcommand
    .setName("prestige")
    .setNameLocalizations({
    "es-ES": "prestigio",
})
    .setDescription("🌟 Prestige your career for permanent bonuses.")
    .setDescriptionLocalizations({
    "es-ES": "🌟 Presta tu carrera para obtener bonificaciones permanentes.",
}))
    .addSubcommand((subcommand) => subcommand
    .setName("loan")
    .setNameLocalizations({
    "es-ES": "préstamo",
})
    .setDescription("💸 Request a loan.")
    .setDescriptionLocalizations({
    "es-ES": "💸 Solicitar un préstamo.",
})
    .addNumberOption((option) => option
    .setName("amount")
    .setNameLocalizations({
    "es-ES": "cantidad",
})
    .setDescription("Amount to request (minimum $100)")
    .setDescriptionLocalizations({
    "es-ES": "Cantidad a solicitar (mínimo $100)",
})
    .setRequired(true)))
    .addSubcommand((subcommand) => subcommand
    .setName("payloan")
    .setNameLocalizations({
    "es-ES": "pagar_prestamo",
})
    .setDescription("💰 Pay your pending loan.")
    .setDescriptionLocalizations({
    "es-ES": "💰 Paga tu préstamo pendiente.",
})), async (client, interaction) => {
    if (!interaction.guild || !interaction.channel || !interaction.member)
        return;
    const group = interaction.options.getSubcommandGroup(false); // Obtener el grupo, si existe
    const subcommand = interaction.options.getSubcommand();
    if (group) {
        // Manejo de subcomandos dentro de grupos
        switch (group) {
            case "inventory":
                {
                    await inventory_1.InventoryCommand.Interaction(interaction, client);
                }
                break;
            case "shop":
                {
                    await (0, shop_1.ShopEconomy)(interaction, client);
                }
                break;
            // Agregar más grupos si es necesario
        }
    }
    else {
        // Manejo de subcomandos independientes
        switch (subcommand) {
            case "daily":
                {
                    await daily_1.DailyCommand.Interaction(interaction, client);
                }
                break;
            case "pay":
                {
                    await (0, pay_1.PayEconomy)(interaction, client);
                }
                break;
            case "slots":
                {
                    await (0, slots_1.SlotsCommand)(interaction, client);
                }
                break;
            case "duel":
                {
                    await (0, duelo_1.DueloCommand)(interaction, client);
                }
                break;
            case "coinflip":
                {
                    await (0, coinflip_1.CoinflipCommand)(interaction, client);
                }
                break;
            case "rps":
                {
                    await (0, rps_1.RPSCommand)(interaction, client);
                }
                break;
            case "roulette":
                {
                    await (0, roulette_1.RouletteCommand)(interaction, client);
                }
                break;
            case "state":
                {
                    await (0, status_1.StateCommand)(interaction, client);
                }
                break;
            case "work":
                {
                    await (0, work_1.WorkCommand)(interaction, client);
                }
                break;
            case "jobs":
                {
                    await (0, work_1.showAllJobs)(interaction);
                }
                break;
            case "train":
                {
                    await (0, work_1.trainSkill)(interaction);
                }
                break;
            case "prestige":
                {
                    await (0, work_1.prestigeCareer)(interaction);
                }
                break;
            case "loan":
                {
                    await (0, work_1.requestLoan)(interaction);
                }
                break;
            case "payloan":
                {
                    await (0, work_1.payLoan)(interaction);
                }
                break;
        }
    }
});
//# sourceMappingURL=economy.js.map
//# debugId=ee00911d-8f02-5737-92c9-321929018b4b
