import { ColorResolvable, TextChannel } from "discord.js";

import {
	countMessage, createGuild, createUser, Economy
} from "@/interfaces/messaging/modules/discord/structure/utils/functions";
import { client, main } from "@/main";
import { EmbedCorrect, ErrorEmbed } from "@/shared/adapters/extends/embeds.extend";
import { config } from "@/shared/utils/config";
import { Ranking } from "@modules/discord/structure/utils/ranking/helpers";
import { ButtonFormat, Fields, Precommand } from "@typings/modules/discord";

import { Event } from "../../../structure/utils/builders";

function escapeRegex(str: string) {
  try {
    return str.replace(/[.*+?^${}()|[\]\\]/g, `\\$&`);
  } catch (e: any) {
    console.log(String(e.stack));
    return str;
  }
}

export default new Event("messageCreate", async (message) => {
  if (!message.guild || !message.channel || message.author.bot || !client.user) return;
  await countMessage(message.author.id, message.guild.id, message);
  await createGuild(message.guild.id, client);
  await createUser(message.author.id);
  //await Asistent(message, client);
  await Ranking(message, client);
  await Economy(message);

  const guildData = await main.prisma.myGuild.findFirst({ where: { guildId: message.guild.id } });
  const dataPrefix = guildData?.prefix ? guildData.prefix : config.modules.discord.prefix;
  const prefixRegex = new RegExp(`^(<@!?${client.user.id}>|${escapeRegex(dataPrefix)})\\s*`);
  //if its not that then return
  if (!prefixRegex.test(message.content)) return;
  //now define the right prefix either ping or not ping
  const match = message.content.match(prefixRegex);
  if (!match) return;
  const [, matchedPrefix] = match;

  const language: string = message.guild.preferredLocale;
  if (!message.content.startsWith(matchedPrefix)) return;

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
          .setTitle("Error Client Data")
          .setDescription(
            [
              `${client.getEmoji(message.guild.id, "error")} The bot is not set up in this server.`,
              `Use the command \`${matchedPrefix}setup\` to set up the bot.`,
            ].join("\n"),
          ),
      ],
    });

  const args: string[] = message.content.slice(matchedPrefix.length).trim().split(/ +/);
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
        .setDescription(data.response || "Sin respuesta configurada.")
        .setColor((data.embedColor as ColorResolvable) || "Red");

      if (data.embedFooter) {
        embed.setFooter({
          text: data.embedFooter,
          iconURL: client.user?.displayAvatarURL(),
        });
      } else {
        embed.setFooter({
          text: `${data.isEnabled ? "Enabled" : "Disabled"} | ${data.name}`,
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
              `${client.getEmoji(message.guild.id, "error")} You do not have permission to use this command as it is reserved for the bot owner.`,
              `If you believe this is a mistake, please contact the bot owner.`,
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
                `${client.getEmoji(message.guild.id, "error")} This command is currently under maintenance.`,
                `Command Name: \`${command.name}\``,
                `Description: ${command.description || "No description available."}`,
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
              `${client.getEmoji(message.guild.id, "error")} You can only use this command in a NSFW channel.`,
              `If you believe this is a mistake, please contact the server staff.`,
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
              `${client.getEmoji(message.guild.id, "error")} You do not have permission to use this command.`,
              `If you believe this is a mistake, please contact the server staff.`,
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
              `${client.getEmoji(message.guild.id, "error")} I do not have permission to execute this command.`,
              `If you believe this is a mistake, please contact the server staff.`,
            ].join("\n"),
          ),
        ],
      });
    }

    /*    if (command.cooldown) {
      const cooldown =
        (client.cooldown.get(command.name) as Map<string, number>) || new Map<string, number>();
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
                  `${client.getEmoji(message.guild.id, "error")} You are on cooldown for this command.`,
                  `Please wait ${timeLeft} seconds before using it again.`,
                ].join("\n"),
              ),
            ],
          });
        }
      }

      cooldown.set(message.author.id, now);
      client.cooldown.set(command.name, cooldown);
    } */

    await command.execute(client, message, args, matchedPrefix, language, config);
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
    const errorEmbed = new ErrorEmbed().setError(true).setTitle("Command Execution Error").setErrorFormat(error);

    await message.channel.send({ embeds: [errorEmbed] });
  }

  return;
});
