import {
	ButtonInteraction, ChannelSelectMenuInteraction, InteractionType, MessageFlags,
	ModalSubmitInteraction, PermissionsBitField, RoleSelectMenuInteraction,
	StringSelectMenuInteraction
} from "discord.js";

import { createEvent } from "@/interfaces/messaging/modules/discord/structure/utils/builders";
import { client, main } from "@/main";
import { ErrorEmbed } from "@shared/utils/extends/discord/embeds.extends";
import { Buttons, Menus, Modals } from "@typings/modules/discord";
import { config } from "@utils/config";

// Mapa para rastrear los cooldowns de los usuarios
const cooldowns = new Map<string, Map<string, number>>();
export default createEvent({
  data: { name: "interactionCreate" },
  async run(interaction) {
    if (!interaction.guild || !interaction.channel || interaction.user.bot || !interaction.user || !client.user) return;

    const language = interaction.guild.preferredLocale || "es-ES";
    // Usar función de traducción consistente
    const t = (key: string, options?: any) => client.translations.t(`discord:${key}`, { lng: language, ...options });

    const { guild } = interaction;
    if (!guild) return;

    const clientData = await main.DB.findDiscord(client.user.id);

    switch (true) {
      case interaction.isChatInputCommand():
        {
          const command = client.commands.get(interaction.commandName);
          if (!command) return;

          /*         const now = Date.now();
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
        } */

          if (!clientData)
            return interaction.reply({
              embeds: [
                new ErrorEmbed()
                  .setTitle(t("errors.clientDataTitle"))
                  .setDescription(
                    [
                      `${client.getEmoji(interaction.guild.id, "error")} ${t("errors.clientDataDesc")}`,
                      t("errors.setupInstruction"),
                    ].join("\n"),
                  ),
              ],
              flags: MessageFlags.Ephemeral,
            });

          if (command.options?.owner && !clientData.owners.includes(interaction.user.id))
            return interaction.reply({
              embeds: [
                new ErrorEmbed().setDescription(
                  [`${client.getEmoji(guild.id, "error")} ${t("errors.ownerOnly")}`, t("errors.contactOwner")].join(
                    "\n",
                  ),
                ),
              ],
              flags: MessageFlags.Ephemeral,
            });

          if (command.maintenance) {
            return interaction.reply({
              embeds: [
                new ErrorEmbed().setDescription(
                  [`${client.getEmoji(guild.id, "error")} ${t("errors.maintenance")}`, t("errors.tryLater")].join("\n"),
                ),
              ],
              flags: MessageFlags.Ephemeral,
            });
          }

          await command.run(client, interaction, config);
          try {
            const guildId = interaction.guild.id;
            const commandName = interaction.commandName;
            const guildData = await main.prisma.myGuild.findFirst({ where: { guildId } });
            if (guildData) {
              // Ensure usage is a Record<string, number>
              let usage: Record<string, number> = {};
              if (
                typeof guildData.commandUsage === "object" &&
                guildData.commandUsage !== null &&
                !Array.isArray(guildData.commandUsage)
              ) {
                usage = guildData.commandUsage as Record<string, number>;
              }
              usage[commandName] = (usage[commandName] || 0) + 1;
              await main.prisma.myGuild.update({
                where: { id: guildData.id },
                data: { commandUsage: usage },
              });
            }
          } catch (err) {
            // Puedes loggear el error si lo deseas
          }
        }
        break;

      case interaction.isButton():
        {
          const button = client.buttons.get(interaction.customId);
          if (!button || button === undefined) return;

          await InteractionOptions(button, interaction, language);
          button.execute(interaction, client, language, config);
        }
        break;

      case interaction.isStringSelectMenu():
        {
          const menus = client.menus.get(interaction.customId);
          if (!menus || menus === undefined) return;

          await InteractionOptions(menus, interaction, language);
          menus.execute(interaction, client, language, config);
        }
        break;

      case interaction.type === InteractionType.ModalSubmit:
        {
          // Manejo especial para el modal del scraper
          if (interaction.customId.startsWith("scrape_url_modal_")) {
            await interaction.deferReply({ flags: "Ephemeral" });
            const platform = interaction.customId.replace("scrape_url_modal_", "");
            const url = interaction.fields.getTextInputValue("scrape_url_input");
            // Importa el comando si es necesario
            const scraperCommand = require("@/interfaces/messaging/modules/discord/bot/commands/message/utilities/scraper");
            // Ejecuta el comando como si fuera desde mensaje (puedes adaptar el objeto message si lo necesitas)
            await scraperCommand.execute(client, interaction, [platform, url]);
            return;
          }

          const modals = client.modals.get(interaction.customId);
          if (!modals || modals === undefined) return;

          await InteractionOptions(modals, interaction, language);
          modals.execute(interaction, client, language, config);
        }
        break;

      case interaction.isChannelSelectMenu():
        {
          const menus = client.menus.get(interaction.customId);
          if (!menus || menus === undefined) return;

          await InteractionOptions(menus, interaction, language);
          menus.execute(interaction, client, language, config);
        }
        break;

      case interaction.isRoleSelectMenu(): {
        const menus = client.menus.get(interaction.customId);
        if (!menus || menus === undefined) return;

        await InteractionOptions(menus, interaction, language);
        menus.execute(interaction, client, language, config);
      }
    }
    return;
  },
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
  language?: string,
) {
  const { guild, member } = interaction;
  if (!guild || !member || !client.user) return;

  const lng = language || guild.preferredLocale || "es-ES";
  const t = (key: string, options?: any) => client.translations.t(`discord:${key}`, { lng, ...options });

  const clientData = await main.DB.findDiscord(client.user.id);

  if (!clientData)
    return interaction.reply({
      embeds: [
        new ErrorEmbed()
          .setTitle(t("errors.clientDataTitle"))
          .setDescription(
            [`${client.getEmoji(guild.id, "error")} ${t("errors.clientDataDesc")}`, t("errors.setupInstruction")].join(
              "\n",
            ),
          ),
      ],
      flags: MessageFlags.Ephemeral,
    });

  if (type.owner && !clientData.owners.includes(interaction.user.id))
    return interaction.reply({
      embeds: [
        new ErrorEmbed().setDescription(
          [`${client.getEmoji(guild.id, "error")} ${t("errors.ownerOnly")}`, t("errors.contactOwner")].join("\n"),
        ),
      ],
      flags: MessageFlags.Ephemeral,
    });

  if (type.permissions && !(member.permissions as PermissionsBitField).has(type.permissions))
    return interaction.reply({
      embeds: [
        new ErrorEmbed().setDescription(
          [`${client.getEmoji(guild.id, "error")} ${t("errors.noPermission")}`, t("errors.contactStaff")].join("\n"),
        ),
      ],
      flags: MessageFlags.Ephemeral,
    });

  if (type.botpermissions && !guild.members.me?.permissions.has(type.botpermissions))
    return interaction.reply({
      embeds: [
        new ErrorEmbed().setDescription(
          [`${client.getEmoji(guild.id, "error")} ${t("errors.botNoPermission")}`, t("errors.contactStaff")].join("\n"),
        ),
      ],
      flags: MessageFlags.Ephemeral,
    });

  if (type.maintenance) {
    await interaction.reply({
      embeds: [
        new ErrorEmbed().setDescription(
          [`${client.getEmoji(guild.id, "error")} ${t("errors.maintenanceDisabled")}`, t("errors.tryLater")].join("\n"),
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
                `${client.getEmoji(guild.id, "error")} ${t("errors.cooldown", { timeLeft })}`,
                t("errors.tryAgain"),
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
            `${client.getEmoji(guild.id, "error")} ${t("errors.cooldownActive", { seconds: type.cooldown })}`,
            t("errors.tryAgain"),
          ].join("\n"),
        ),
      ],
      flags: MessageFlags.Ephemeral,
    });
  }

  return;
}
