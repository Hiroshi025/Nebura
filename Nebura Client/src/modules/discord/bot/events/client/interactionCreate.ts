import {
	ButtonInteraction, ChannelSelectMenuInteraction, InteractionType, MessageFlags,
	ModalSubmitInteraction, PermissionsBitField, RoleSelectMenuInteraction,
	StringSelectMenuInteraction
} from "discord.js";

import { client } from "@/main";
import { Event } from "@/modules/discord/structure/utils/builders";
import { ErrorEmbed } from "@extenders/discord/embeds.extender";
import { Buttons, Menus, Modals } from "@typings/modules/discord";
import { config } from "@utils/config";

// Mapa para rastrear los cooldowns de los usuarios
const cooldowns = new Map<string, Map<string, number>>();

export default new Event("interactionCreate", async (interaction) => {
  if (!interaction.guild || !interaction.channel || interaction.user.bot || !interaction.user)
    return;

  const lenguage = interaction.guild.preferredLocale;
  const { guild } = interaction;
  if (!guild) return;

  switch (true) {
    case interaction.isChatInputCommand():
      {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        const now = Date.now();
        const userCooldowns = cooldowns.get(interaction.user.id) || new Map();
        const cooldownAmount = (command.cooldown || 10) * 1000; // Convertir a milisegundos

        if (userCooldowns.has(interaction.commandName)) {
          const expirationTime = userCooldowns.get(interaction.commandName)!;
          if (now < expirationTime) {
            const timeLeft = ((expirationTime - now) / 1000).toFixed(1);
            return interaction.reply({
              embeds: [
                new ErrorEmbed().setDescription(
                  [
                    `${client.getEmoji(interaction.guild.id, "error")} Please wait ${timeLeft} seconds before using this command again.`,
                    `If you believe this is a mistake, please contact the bot owner.`,
                  ].join("\n"),
                ),
              ],
              flags: MessageFlags.Ephemeral,
            });
          }
        }

        userCooldowns.set(interaction.commandName, now + cooldownAmount);
        cooldowns.set(interaction.user.id, userCooldowns);

        if (command.options?.owner && !config.modules.discord.owners.includes(interaction.user.id))
          return interaction.reply({
            embeds: [
              new ErrorEmbed().setDescription(
                [
                  `${client.getEmoji(guild.id, "error")} You do not have permission to use this command, as it is reserved for the bot owner.`,
                  `If you think this is a bug, please contact the bot owner.`,
                ].join("\n"),
              ),
            ],
            flags: MessageFlags.Ephemeral,
          });

        await command.run(client, interaction, config);
      }
      break;

    case interaction.isButton():
      {
        const button = client.buttons.get(interaction.customId);
        if (!button || button === undefined) return;

        await InteractionOptions(button, interaction);
        button.execute(interaction, client, lenguage, config);
      }
      break;

    case interaction.isStringSelectMenu():
      {
        const menus = client.menus.get(interaction.customId);
        if (!menus || menus === undefined) return;

        await InteractionOptions(menus, interaction);
        menus.execute(interaction, client, lenguage, config);
      }
      break;

    case interaction.type === InteractionType.ModalSubmit:
      {
        const modals = client.modals.get(interaction.customId);
        if (!modals || modals === undefined) return;

        await InteractionOptions(modals, interaction);
        modals.execute(interaction, client, lenguage, config);
      }
      break;

    case interaction.isChannelSelectMenu():
      {
        const menus = client.menus.get(interaction.customId);
        if (!menus || menus === undefined) return;

        await InteractionOptions(menus, interaction);
        menus.execute(interaction, client, lenguage, config);
      }
      break;

    case interaction.isRoleSelectMenu(): {
      const menus = client.menus.get(interaction.customId);
      if (!menus || menus === undefined) return;

      await InteractionOptions(menus, interaction);
      menus.execute(interaction, client, lenguage, config);
    }
  }

  return;
});

/**
 *
 * The interaction options for the buttons, menus, and modals.
 * is used to check if the user has the required permissions to use the command.
 *
 * @param type
 * @param interaction
 * @returns
 */
async function InteractionOptions(
  type: Buttons | Menus | Modals,
  interaction:
    | ModalSubmitInteraction
    | ButtonInteraction
    | StringSelectMenuInteraction
    | ChannelSelectMenuInteraction
    | RoleSelectMenuInteraction,
) {
  const { guild, member } = interaction;
  if (!guild || !member) return;

  if (type.owner && !config.modules.discord.owners.includes(interaction.user.id))
    return interaction.reply({
      embeds: [
        new ErrorEmbed().setDescription(
          [
            `${client.getEmoji(guild.id, "error")} You do not have permission to use this command as it is reserved for the bot owner.`,
            `If you believe this is a mistake, please contact the bot owner.`,
          ].join("\n"),
        ),
      ],
      flags: MessageFlags.Ephemeral,
    });

  if (type.permissions && !(member.permissions as PermissionsBitField).has(type.permissions))
    return interaction.reply({
      embeds: [
        new ErrorEmbed().setDescription(
          [
            `${client.getEmoji(guild.id, "error")}You do not have permission to use this command.`,
            `If you believe this is a mistake, please contact the bot owner.`,
          ].join("\n"),
        ),
      ],
      flags: MessageFlags.Ephemeral,
    });

  if (type.botpermissions && !guild.members.me?.permissions.has(type.botpermissions))
    return interaction.reply({
      embeds: [
        new ErrorEmbed().setDescription(
          [
            `$${client.getEmoji(guild.id, "error")} I do not have permission to use this command.`,
            `If you believe this is a mistake, please contact the bot owner.`,
          ].join("\n"),
        ),
      ],
      flags: MessageFlags.Ephemeral,
    });

  if (type.maintenance) {
    await interaction.reply({
      embeds: [
        new ErrorEmbed().setDescription(
          [
            `${client.getEmoji(guild.id, "error")} This command is currently disabled due to maintenance.`,
            `Please try again later or contact the bot owner for more information.`,
          ].join("\n"),
        ),
      ],
      flags: MessageFlags.Ephemeral,
    });
  }

  if (type.cooldown) {
    const now = Date.now();
    const userCooldowns = cooldowns.get(interaction.user.id) || new Map();
    const cooldownAmount = type.cooldown * 1000; // Convertir a milisegundos

    if (userCooldowns.has(type.id)) {
      const expirationTime = userCooldowns.get(type.id)!;
      if (now < expirationTime) {
        const timeLeft = ((expirationTime - now) / 1000).toFixed(1);
        return interaction.reply({
          embeds: [
            new ErrorEmbed().setDescription(
              [
                `${client.getEmoji(guild.id, "error")} Please wait ${timeLeft} seconds before using this command again.`,
                `If you believe this is a mistake, please contact the bot owner.`,
              ].join("\n"),
            ),
          ],
          flags: MessageFlags.Ephemeral,
        });
      }
    }

    userCooldowns.set(type.id, now + cooldownAmount);
    cooldowns.set(interaction.user.id, userCooldowns);
    await interaction.reply({
      embeds: [
        new ErrorEmbed().setDescription(
          [
            `${client.getEmoji(guild.id, "error")} You are on cooldown for this command.`,
            `Please wait ${type.cooldown} seconds before using it again.`,
          ].join("\n"),
        ),
      ],
      flags: MessageFlags.Ephemeral,
    });
  }

  return;
}
