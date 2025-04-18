import { TextChannel } from "discord.js";

import { client } from "@/main";
import { config } from "@/shared/utils/config";
import { Precommand } from "@/typings/discord";
import { ErrorEmbed } from "@extenders/discord/embeds.extender";

import { Event } from "../../../structure/utils/builders";

export default new Event("messageCreate", async (message) => {
  if (!message.guild || !message.channel || message.author.bot || !client.user) return;
  if (!message.content.startsWith(config.modules.discord.prefix)) return;
  const language: string = message.guild.preferredLocale;

  const args: string[] = message.content
    .slice(config.modules.discord.prefix.length)
    .trim()
    .split(/\s+/);

  const cmd: string = args.shift()?.toLowerCase() ?? "";
  if (!cmd) return;

  const command: Precommand | undefined =
    (client.precommands.get(cmd) as Precommand) ||
    (client.precommands.find((c) => (c as Precommand)?.aliases?.includes(cmd)) as Precommand);

  if (!command) return;

  try {
    if (command.owner && !config.modules.discord.owners.includes(message.author.id)) {
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

    if (command.nsfw && !(message.channel as TextChannel).nsfw) {
      return message.channel.send({
        embeds: [
          new ErrorEmbed()
            .setTitle("Pixel Web - Bot Core")
            .setDescription(
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
          new ErrorEmbed()
            .setTitle("Pixel Web - Bot Core")
            .setDescription(
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
          new ErrorEmbed()
            .setTitle("Pixel Web - Bot Core")
            .setDescription(
              [
                `${client.getEmoji(message.guild.id, "error")} I do not have permission to execute this command.`,
                `If you believe this is a mistake, please contact the server staff.`,
              ].join("\n"),
            ),
        ],
      });
    }

    await command.execute(client, message, args, config.modules.discord.prefix, language, config);
  } catch (error: any) {
    const errorEmbed = new ErrorEmbed()
      .setError(true)
      .setTitle("Command Execution Error")
      .setErrorFormat(
        `An error occurred while executing the command: ${command.name}`,
        error
      );

    await message.channel.send({ embeds: [errorEmbed] });
  }

  return;
});
