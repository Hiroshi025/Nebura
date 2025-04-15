import {
	ChatInputCommandInteraction, Interaction, InteractionType, MessageFlags, PermissionsBitField
} from "discord.js";

import { MyClient } from "@/modules/discord/structure/client";
import { CustomInteraction } from "@/structure/constants/discord.constants";
import { ErrorEmbed } from "@/structure/extenders/discord/embeds.extender";
import { Buttons, Menus, Modals } from "@/typings/discord";

import { main } from "../../../../../main";
import { config } from "../../../../../shared/utils/config";
import { Event } from "../../../structure/utils/builders";

// Clase para manejar errores de interacción
class InteractionErrorHandler {
  static async handle(interaction: Interaction, error: Error, client: MyClient) {
    if (!interaction.isRepliable()) return;

    console.error(`Error handling interaction ${interaction.type}:`, error);

    try {
      await interaction.reply({
        embeds: [
          new ErrorEmbed()
            .setError(true)
            .setDescription(
              [
                `${client.getEmoji(config.project.guildId, "circle_x")} An unexpected error occurred.`,
                `Please try again later or contact support.`,
              ].join("\n"),
            ),
        ],
        flags: MessageFlags.Ephemeral,
      });
    } catch (replyError) {
      console.error("Failed to send error reply:", replyError);
    }
  }
}

// Clase para manejar permisos y validaciones
class InteractionValidator {
  static async validate(
    interaction: CustomInteraction,
    component: Buttons | Menus | Modals,
    client: MyClient,
  ): Promise<boolean> {
    const { guild, member } = interaction;
    if (!guild || !member) return false;

    // Verificar permisos del usuario
    if (
      component.permissions &&
      !(member.permissions as PermissionsBitField).has(component.permissions)
    ) {
      await this.sendPermissionError(interaction, client, "user");
      return false;
    }

    // Verificar permisos del bot
    if (component.botpermissions && !guild.members.me?.permissions.has(component.botpermissions)) {
      await this.sendPermissionError(interaction, client, "bot");
      return false;
    }

    // Verificar modo mantenimiento
    if (component.maintenance) {
      await interaction.reply({
        embeds: [
          new ErrorEmbed()
            .setError(true)
            .setDescription(
              [
                `${client.getEmoji(config.project.guildId, "circle_x")} This feature is currently under maintenance.`,
                `Please try again later.`,
              ].join("\n"),
            ),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return false;
    }

    return true;
  }

  private static async sendPermissionError(
    interaction: CustomInteraction,
    client: MyClient,
    type: "user" | "bot",
  ) {
    const message =
      type === "user"
        ? "You don't have permission to use this."
        : "I don't have the required permissions to execute this.";

    await interaction.reply({
      embeds: [
        new ErrorEmbed()
          .setError(true)
          .setDescription(`${client.getEmoji(config.project.guildId, "circle_x")} ${message}`),
      ],
      flags: MessageFlags.Ephemeral,
    });
  }
}

// Manejador de componentes (botones, menús, modales)
class ComponentHandler {
  static async handle(interaction: CustomInteraction, client: MyClient) {
    const component = this.getComponent(interaction, client);
    if (!component) return;

    const isValid = await InteractionValidator.validate(interaction, component, client);
    if (!isValid) return;

    try {
      const language = interaction.guild?.preferredLocale || "en-US";
      await component.execute(interaction as any, client, language, config);
    } catch (error) {
      await InteractionErrorHandler.handle(interaction, error as Error, client);
    }
  }

  private static getComponent(
    interaction: CustomInteraction,
    client: MyClient,
  ): Buttons | Menus | Modals | undefined {
    if (!interaction.customId) return undefined;

    if (interaction.isButton()) {
      return client.buttons.get(interaction.customId);
    } else if (
      interaction.isStringSelectMenu() ||
      interaction.isChannelSelectMenu() ||
      interaction.isRoleSelectMenu()
    ) {
      return client.menus.get(interaction.customId);
    } else if (interaction.type === InteractionType.ModalSubmit) {
      return client.modals.get(interaction.customId);
    }

    return undefined;
  }
}

// Manejador de comandos de chat
class CommandHandler {
  static async handle(interaction: ChatInputCommandInteraction, client: MyClient) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      //const language = interaction.guild?.preferredLocale || "en-US";
      await command.run(client, interaction, config);
    } catch (error) {
      await InteractionErrorHandler.handle(interaction, error as Error, client);
    }
  }
}

// Evento principal
export default new Event("interactionCreate", async (interaction: Interaction) => {
  try {
    if (!interaction.inGuild() || !interaction.channel || !interaction.user) return;

    const client = main.discord;

    if (interaction.isChatInputCommand()) {
      await CommandHandler.handle(interaction, client);
    } else if (
      interaction.isButton() ||
      interaction.isStringSelectMenu() ||
      interaction.isChannelSelectMenu() ||
      interaction.isRoleSelectMenu() ||
      interaction.type === InteractionType.ModalSubmit
    ) {
      await ComponentHandler.handle(interaction as CustomInteraction, client);
    }
  } catch (error) {
    await InteractionErrorHandler.handle(interaction, error as Error, main.discord);
  }
});
