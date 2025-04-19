import { SlashCommandBuilder } from "discord.js";

import { Command } from "@/modules/discord/structure/utils/builders";
import { PayEconomy } from "@/modules/discord/structure/utils/economy/pay";

export default new Command(
  new SlashCommandBuilder()
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
        .setRequired(true)
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
        .setMinValue(1)
    ),
  async (client, interaction) => {
    if (!interaction.guild || !interaction.channel || !interaction.member) return;
    await PayEconomy(interaction, client);
  }
);
