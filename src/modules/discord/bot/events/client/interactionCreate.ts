import {
	ButtonInteraction, ChannelSelectMenuInteraction, InteractionType, MessageFlags,
	ModalSubmitInteraction, PermissionsBitField, RoleSelectMenuInteraction,
	StringSelectMenuInteraction
} from "discord.js";

import { EmbedExtender } from "@/infrastructure/extenders/discord/embeds.extender";
import { Buttons, Menus, Modals } from "@/typings/discord";
import emojis from "@config/json/emojis.json";

import { main } from "../../../../../main";
import { config } from "../../../../../shared/utils/config";
import { Event } from "../../../infrastructure/utils/builders";

export default new Event("interactionCreate", async (interaction) => {
  if (!interaction.guild || !interaction.channel || interaction.user.bot || !interaction.user)
    return;

  const lenguage = interaction.guild.preferredLocale;
  const client = main.discord;


  const { guild } = interaction;

  if (!guild) return;

  switch (true) {
    case interaction.isChatInputCommand():
      {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        command.run(client, interaction, config);
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

    /*   if (type.owner && !client.config.bot.owners.includes(interaction.user.id))
    return interaction.reply({
      embeds: [
        new ErrorEmbed(guild.id as string).setDescription(
          [
            `${client.getEmoji(guild.id).error} You do not have permission to use this command as it is reserved for the bot owner.`,
            `If you believe this is a mistake, please contact the bot owner.`,
          ].join("\n")
        ),
      ],
      flags: MessageFlags.Ephemeral,
    }); */

    if (type.permissions && !(member.permissions as PermissionsBitField).has(type.permissions))
      return interaction.reply({
        embeds: [
          new EmbedExtender()
            .setError(true)
            .setDescription(
              [
                `${emojis.circle_x} You do not have permission to use this command.`,
                `If you believe this is a mistake, please contact the bot owner.`,
              ].join("\n"),
            ),
        ],
        flags: MessageFlags.Ephemeral,
      });

    if (type.botpermissions && !guild.members.me?.permissions.has(type.botpermissions))
      return interaction.reply({
        embeds: [
          new EmbedExtender()
            .setError(true)
            .setDescription(
              [
                `${emojis.circle_x} I do not have permission to use this command.`,
                `If you believe this is a mistake, please contact the bot owner.`,
              ].join("\n"),
            ),
        ],
        flags: MessageFlags.Ephemeral,
      });

    /*   const data = await main.prisma.tickets.findUnique({ where: { guildId: guild.id } });
  if (type.tickets) {
    if (!data) {
      return interaction.reply({
        embeds: [
          new ErrorEmbed(guild.id as string).setDescription(
            [
              `${client.getEmoji(guild.id).error} This command is only available in ticket channels.`,
              `If you believe this is a mistake, please contact the bot owner.`,
            ].join("\n")
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
    }

    if (!(member.roles as GuildMemberRoleManager).cache.has(data?.roleId as string))
      return interaction.reply({
        embeds: [
          new ErrorEmbed(guild.id as string).setDescription(
            [
              `${client.getEmoji(guild.id).error} You do not have permission to use this command.`,
              `If you believe this is a mistake, please contact the bot owner.`,
            ].join("\n")
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
  } */

    if (type.maintenance) {
      return interaction.reply({
        embeds: [
          new EmbedExtender()
            .setError(true)
            .setDescription(
              [
                `${emojis.circle_x} The bot is currently in maintenance mode.`,
                `If you believe this is a mistake, please contact the bot owner.`,
              ].join("\n"),
            ),
        ],
        flags: MessageFlags.Ephemeral,
      });
    }

    return;
  }
});
