import { TextChannel } from "discord.js";

import {
	countMessage, createGuild, createUser, Economy
} from "@/interfaces/messaging/modules/discord/structure/utils/functions";
import { Ranking } from "@/interfaces/messaging/modules/discord/structure/utils/ranking/helpers";
import { client, main } from "@/main";
import { ErrorEmbed } from "@/shared/structure/extenders/discord/embeds.extend";
import { config } from "@/shared/utils/config";
import { Precommand } from "@typings/modules/discord";

import { Event } from "../../../structure/utils/builders";

export default new Event("messageCreate", async (message) => {
  if (!message.guild || !message.channel || message.author.bot || !client.user) return;
  await createGuild(message.guild.id, client);
  await createUser(message.author.id);

  await Ranking(message, client);
  await Economy(message);

  const guildData = await main.prisma.myGuild.findFirst({ where: { guildId: message.guild.id } });
  const prefix = guildData?.prefix ? guildData.prefix : config.modules.discord.prefix;
  const language: string = message.guild.preferredLocale;
  if (!message.content.startsWith(prefix)) return;

  const data = await main.prisma.userDiscord.findFirst({
    where: {
      userId: message.author.id,
    },
  });

  const clientData = await main.prisma.myDiscord.findFirst({
    where: {
      clientId: client.user.id,
    },
  });

  if (!clientData)
    return message.channel.send({
      embeds: [
        new ErrorEmbed()
          .setTitle("Error Client Data")
          .setDescription(
            [
              `${client.getEmoji(message.guild.id, "error")} The bot is not set up in this server.`,
              `Use the command \`${prefix}setup\` to set up the bot.`,
            ].join("\n"),
          ),
      ],
    });

  await countMessage(message.author.id, message.guild.id);
  const args: string[] = message.content.slice(prefix.length).trim().split(/\s+/);

  const cmd: string = args.shift()?.toLowerCase() ?? "";
  if (!cmd || !data) return;

  const command: Precommand | undefined =
    (client.precommands.get(cmd) as Precommand) ||
    (client.precommands.find((c) => (c as Precommand)?.aliases?.includes(cmd)) as Precommand);

  if (!command) return;

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

    if (
      command.botpermissions &&
      !message.guild.members.me?.permissions.has(command.botpermissions)
    ) {
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

    if (command.cooldown) {
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
    }

    await command.execute(client, message, args, prefix, language, config);
  } catch (error: any) {
    const errorEmbed = new ErrorEmbed()
      .setError(true)
      .setTitle("Command Execution Error")
      .setErrorFormat(`An error occurred while executing the command: ${command.name}`, error);

    await message.channel.send({ embeds: [errorEmbed] });
  }

  return;
});
