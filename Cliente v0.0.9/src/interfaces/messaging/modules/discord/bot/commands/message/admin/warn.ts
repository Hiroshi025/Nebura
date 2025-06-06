import { ChannelType, TextChannel } from "discord.js";

import { main } from "@/main";
import { EmbedCorrect, ErrorEmbed } from "@/shared/structure/extenders/discord/embeds.extend";
import { Precommand } from "@typings/modules/discord";

const warnAdminCommand: Precommand = {
  name: "warn",
  description: "Warn a member via text commands!",
  examples: ["warn add @user reason", "warn remove warn_id"],
  nsfw: false,
  owner: false,
  subcommands: ["warn add @user reason", "warn remove warnId"],
  botpermissions: ["ModerateMembers"],
  permissions: ["ModerateMembers"],
  async execute(client, message, args) {
    if (!message.guild || !message.channel || message.channel.type !== ChannelType.GuildText)
      return;

    const subCommand = args[0];
    if (!subCommand || !["add", "remove"].includes(subCommand)) {
      return message.reply({
        embeds: [
          new ErrorEmbed().setDescription(
            "Invalid subcommand. Use `warn add @user reason` or `warn remove warn_id`.",
          ),
        ],
      });
    }

    switch (subCommand) {
      case "add": {
        const user = message.mentions.users.first();
        const reason = args.slice(2).join(" ") || "No reason provided";
        const warnTime = new Date().toISOString();

        if (!user) {
          return message.reply({
            embeds: [new ErrorEmbed().setDescription("You must mention a user to warn.")],
          });
        }

        await main.prisma.userWarn.create({
          data: {
            guildId: message.guild.id,
            userId: user.id,
            warnReason: reason,
            moderator: message.author.id,
            warnDate: warnTime,
          },
        });

        message.reply({
          embeds: [
            new EmbedCorrect()
              .setTitle("User Warned!")
              .setDescription(`<@${user.id}> has been warned for \`${reason}\`.`),
          ],
        });

        const modData = await main.prisma.serverModlog.findFirst({
          where: { guildId: message.guild.id },
        });
        const data = await main.prisma.userWarn.findFirst({
          where: {
            guildId: message.guild.id,
            userId: user.id,
          },
        });

        if (modData) {
          const channel = client.channels.cache.get(modData.channelId);
          if (channel && channel.type === ChannelType.GuildText) {
            channel.send({
              embeds: [
                new EmbedCorrect()
                  .setTitle("New User Warned")
                  .addFields(
                    { name: "User Warned", value: `<@${user.id}>`, inline: true },
                    { name: "Warned By", value: `<@${message.author.id}>`, inline: true },
                    { name: "Warned At", value: `${warnTime}`, inline: true },
                    { name: "Warn ID", value: `\`${data?.id || "No ID"}\``, inline: true },
                    { name: "Warn Reason", value: `\`\`\`${reason}\`\`\`` },
                  ),
              ],
            });
          }
        }

        user
          .send({
            embeds: [
              new EmbedCorrect()
                .setTitle(`You have been warned in: ${message.guild.name}`)
                .addFields(
                  { name: "Warned For", value: `\`${reason}\``, inline: true },
                  { name: "Warned At", value: `${warnTime}`, inline: true },
                )
                .setColor("#2f3136"),
            ],
          })
          .catch(() => {
            (message.channel as TextChannel).send({
              embeds: [
                new ErrorEmbed()
                  .setTitle("DM Notification Failed")
                  .setDescription("The user has DMs disabled, so no notification was sent."),
              ],
            });
          });
        break;
      }

      case "remove": {
        const warnId = args[1];
        if (!warnId) {
          return message.reply({
            embeds: [new ErrorEmbed().setDescription("You must provide a warn ID to remove.")],
          });
        }

        const data = await main.prisma.userWarn.findUnique({ where: { id: warnId } });

        if (!data) {
          return message.reply({
            embeds: [new ErrorEmbed().setDescription(`No warn found with ID \`${warnId}\`.`)],
          });
        }

        await main.prisma.userWarn.delete({ where: { id: warnId } });

        message.reply({
          embeds: [
            new EmbedCorrect()
              .setTitle("Warn Removed")
              .setDescription(`Successfully removed the warn with ID \`${warnId}\`.`),
          ],
        });
        break;
      }
    }

    return;
  },
};

export = warnAdminCommand;
