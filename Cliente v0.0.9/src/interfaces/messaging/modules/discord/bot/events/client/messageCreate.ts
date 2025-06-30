import { ColorResolvable, TextChannel } from "discord.js";

import {
	countMessage, createGuild, createUser, Economy
} from "@/interfaces/messaging/modules/discord/structure/utils/functions";
import { client, main } from "@/main";
import { config } from "@/shared/utils/config";
import { Ranking } from "@messaging/modules/discord/structure/utils/ranking/helpers";
import { AIGemini } from "@shared/functions";
import { DiscordError } from "@shared/utils/extends/error.extension";
import { ButtonFormat, Fields, Precommand } from "@typings/modules/discord";
import { EmbedCorrect, ErrorEmbed } from "@utils/extends/embeds.extension";

import { Event } from "../../../structure/utils/builders";

export default new Event("messageCreate", async (message) => {
  if (!message.guild || !message.channel || message.author.bot || !client.user) return;
  await countMessage(message.author.id, message.guild.id, message);
  await createGuild(message.guild.id, client);
  await createUser(message.author.id);
  await Ranking(message, client);
  await AIGemini(message);
  await Economy(message);

  const guildData = await main.prisma.myGuild.findFirst({ where: { guildId: message.guild.id } });
  const dataPrefix = guildData?.prefix ? guildData.prefix : config.modules.discord.prefix;
  const prefix = dataPrefix;

  const language: string = message.guild.preferredLocale || "en-US";
  if (!message.content.startsWith(prefix)) return;

  const data = await main.prisma.userDiscord.findFirst({
    where: {
      userId: message.author.id,
    },
  });

  const clientData = await main.DB.findDiscord(client.user.id);

  if (!clientData)
    return message.channel.send({
      embeds: [
        new ErrorEmbed()
          .setTitle(client.translations.t("discord:errors.clientDataTitle", { lng: language }))
          .setDescription(
            [
              `${client.getEmoji(message.guild.id, "error")} ${client.translations.t("discord:errors.clientDataDesc", { lng: language })}`,
              client.translations.t("discord:errors.setupInstruction", { lng: language, prefix }),
            ].join("\n"),
          ),
      ],
    });

  const args: string[] = message.content.slice(prefix.length).trim().split(/ +/);
  const cmd: string = args.shift()?.toLowerCase() ?? "";
  if (!cmd || !data) return;

  const command: Precommand | undefined =
    (client.precommands.get(cmd) as Precommand) ||
    (client.precommands.find((c) => (c as Precommand)?.aliases?.includes(cmd)) as Precommand);

  if (!command) {
    const data = await main.prisma.command.findFirst({
      where: {
        name: cmd,
        guildId: message.guild.id,
      },
    });

    if (!data || !data.isEnabled) return;

    if (data.embed) {
      const embed = new EmbedCorrect()
        .setTitle(data.embedTitle || data.name)
        .setDescription(
          data.response || client.translations.t("discord:help.notFoundDesc", { lng: language, arg: cmd, prefix }),
        )
        .setColor((data.embedColor as ColorResolvable) || "Red");

      if (data.embedFooter) {
        embed.setFooter({
          text: data.embedFooter,
          iconURL: client.user?.displayAvatarURL(),
        });
      } else {
        embed.setFooter({
          text: `${data.isEnabled ? client.translations.t("discord:common.enabled", { lng: language }) : client.translations.t("discord:common.disabled", { lng: language })} | ${data.name}`,
          iconURL: client.user?.displayAvatarURL(),
        });
      }

      if (data.embedImage) embed.setImage(data.embedImage);
      if (data.embedThumbnail) embed.setThumbnail(data.embedThumbnail);
      if (data.embedAuthor) {
        embed.setAuthor({
          name: data.embedAuthor,
          iconURL: client.user?.displayAvatarURL(),
        });
      }

      // Botones (si existen)
      let components = [];
      if (data.buttons && Array.isArray(data.buttons) && data.buttons.length > 0) {
        const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
        const row = new ActionRowBuilder();
        // Ensure each button is an object with the expected properties
        const buttons = data.buttons as unknown as ButtonFormat[];
        buttons.forEach((button) => {
          if (
            button &&
            typeof button === "object" &&
            button.label &&
            button.style &&
            ((button.style === "LINK" && button.url) || (button.style !== "LINK" && button.customId))
          ) {
            const btn = new ButtonBuilder()
              .setLabel(button.label)
              .setStyle(ButtonStyle[button.style as keyof typeof ButtonStyle]);
            if (button.style === "LINK") {
              btn.setURL(button.url);
            } else {
              btn.setCustomId(button.customId);
            }
            row.addComponents(btn);
          }
        });
        components.push(row);
      }

      if (data.fields && Array.isArray(data.fields) && data.fields.length > 0) {
        (data.fields as unknown as Fields[]).forEach((field: Fields) => {
          if (!field) return;
          if (field.name && field.value) {
            embed.addFields({
              name: field.name,
              value: field.value,
              inline: field.inline || false,
            });
          }
        });
      }

      return message.channel.send({
        embeds: [embed],
        components,
        allowedMentions: { repliedUser: false },
        files: data.file ? [data.file] : [],
      });
    }

    // Si no es embed, pero puede tener archivo adjunto
    return message.channel.send({
      content: data.response as string,
      allowedMentions: { repliedUser: false },
      files: data.file ? [data.file] : [],
    });
  }
  try {
    if (command.owner && !clientData.owners.includes(message.author.id)) {
      return message.channel.send({
        embeds: [
          new ErrorEmbed().setDescription(
            [
              `${client.getEmoji(message.guild.id, "error")} ${client.translations.t("discord:errors.ownerOnly", { lng: language })}`,
              client.translations.t("discord:errors.contactOwner", { lng: language }),
            ].join("\n"),
          ),
        ],
      });
    }

    if (command.maintenance) {
      if (!clientData.owners.includes(message.author.id)) {
        return message.channel.send({
          embeds: [
            new ErrorEmbed().setDescription(
              [
                `${client.getEmoji(message.guild.id, "error")} ${client.translations.t("discord:errors.maintenance", { lng: language })}`,
                `${client.translations.t("discord:common.commandName", { lng: language })}: \`${command.name}\``,
                `${client.translations.t("discord:common.description", { lng: language })}: ${command.description || client.translations.t("discord:common.noDescription", { lng: language })}`,
              ].join("\n"),
            ),
          ],
        });
      }
    }

    if (command.nsfw && !(message.channel as TextChannel).nsfw) {
      return message.channel.send({
        embeds: [
          new ErrorEmbed().setDescription(
            [
              `${client.getEmoji(message.guild.id, "error")} ${client.translations.t("discord:errors.nsfw", { lng: language })}`,
              client.translations.t("discord:errors.contactStaff", { lng: language }),
            ].join("\n"),
          ),
        ],
      });
    }

    if (command.permissions && !message.member?.permissions.has(command.permissions)) {
      return message.channel.send({
        embeds: [
          new ErrorEmbed().setDescription(
            [
              `${client.getEmoji(message.guild.id, "error")} ${client.translations.t("discord:errors.noPermission", { lng: language })}`,
              client.translations.t("discord:errors.contactStaff", { lng: language }),
            ].join("\n"),
          ),
        ],
      });
    }

    if (command.botpermissions && !message.guild.members.me?.permissions.has(command.botpermissions)) {
      return message.channel.send({
        embeds: [
          new ErrorEmbed().setDescription(
            [
              `${client.getEmoji(message.guild.id, "error")} ${client.translations.t("discord:errors.botNoPermission", { lng: language })}`,
              client.translations.t("discord:errors.contactStaff", { lng: language }),
            ].join("\n"),
          ),
        ],
      });
    }

    if (command.cooldown) {
      const cooldown = (client.cooldown.get(command.name) as Map<string, number>) || new Map<string, number>();
      const now = Date.now();
      const cooldownAmount = command.cooldown * 1000;

      if (cooldown.has(message.author.id)) {
        const expirationTime = cooldown.get(message.author.id)! + cooldownAmount;
        if (now < expirationTime) {
          const timeLeft = Math.round((expirationTime - now) / 1000);
          return message.channel.send({
            embeds: [
              new ErrorEmbed().setDescription(
                [
                  `${client.getEmoji(message.guild.id, "error")} ${client.translations.t("discord:errors.cooldownActive", { lng: language })}`,
                  client.translations.t("discord:errors.cooldown", { lng: language, timeLeft }),
                ].join("\n"),
              ),
            ],
          });
        }
      }

      cooldown.set(message.author.id, now);
      client.cooldown.set(command.name, cooldown);
    }

    if (command.category) {
      const categories = await main.prisma.commandCategory.findMany();
      const category = categories.find(
        (c) => c.name && command.category && c.name.toLowerCase() === command.category.toLowerCase(),
      );
      if (!category) {
        return message.channel.send({
          embeds: [
            new ErrorEmbed().setDescription(
              [
                `${client.getEmoji(message.guild.id, "error")} ${client.translations.t("discord:errors.categoryNotExist", { lng: language, category: command.category })}`,
                client.translations.t("discord:errors.checkCategory", { lng: language }),
              ].join("\n"),
            ),
          ],
        });
      }

      if (category.enabled === false) {
        return message.channel.send({
          embeds: [
            new ErrorEmbed().setDescription(
              [
                `${client.getEmoji(message.guild.id, "error")} ${client.translations.t("discord:errors.categoryDisabled", { lng: language, category: command.category })}`,
                client.translations.t("discord:errors.checkCategory", { lng: language }),
              ].join("\n"),
            ),
          ],
        });
      }
    }

    await command.execute(client, message, args, prefix, language, config);
    try {
      const guildId = message.guild.id;
      const commandName = command.name;
      const guildData = await main.prisma.myGuild.findFirst({ where: { guildId } });
      if (guildData) {
        const usage = (guildData.commandUsage as Record<string, number>) || {};
        usage[commandName] = (usage[commandName] || 0) + 1;
        await main.prisma.myGuild.update({
          where: { id: guildData.id },
          data: { commandUsage: usage },
        });
      }
    } catch (err) {
      console.debug("[DEBUG] Error updating command usage:", err);
    }
  } catch (error: any) {
    throw new DiscordError(`Error executing command \`${command.name}\`: ${error.message || error}`);
  }
  return;
});
