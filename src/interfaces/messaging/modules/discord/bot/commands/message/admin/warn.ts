import { ChannelType, TextChannel } from "discord.js";

import { main } from "@/main";
import { EmbedCorrect, ErrorEmbed } from "@shared/utils/extends/discord/embeds.extends";
import { Precommand } from "@typings/modules/discord";

const warnAdminCommand: Precommand = {
  name: "warn",
  nameLocalizations: {
    "es-ES": "advertencia",
    "en-US": "warn",
  },
  description: "Warn a member via text commands!",
  descriptionLocalizations: {
    "es-ES": "¡Advierte a un miembro mediante comandos de texto!",
    "en-US": "Warn a member via text commands!",
  },
  examples: ["warn add @user reason", "warn remove warn_id"],
  nsfw: false,
  category: "Admin",
  cooldown: 5,
  owner: false,
  subcommands: ["warn add <user_id> [reason]", "warn remove [warnId]"],
  botpermissions: ["ModerateMembers"],
  permissions: ["ModerateMembers"],
  async execute(client, message, args) {
    if (!message.guild || !message.channel || message.channel.type !== ChannelType.GuildText) return;

    const lang = message.guild?.preferredLocale || "es-ES";
    const subCommand = args[0];
    if (!subCommand || !["add", "remove"].includes(subCommand)) {
      return message.reply({
        embeds: [new ErrorEmbed().setDescription(client.t("discord:warn-message.invalidSubcommand", {}, lang))],
      });
    }

    switch (subCommand) {
      case "add": {
        const user = message.mentions.users.first();
        const reason = args.slice(2).join(" ") || client.t("discord:warn-message.noReason", {}, lang);
        const warnTime = new Date().toISOString();

        if (!user) {
          return message.reply({
            embeds: [new ErrorEmbed().setDescription(client.t("discord:warn-message.noUserMention", {}, lang))],
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
              .setTitle(client.t("discord:warn-message.warnedTitle", {}, lang))
              .setDescription(client.t("discord:warn-message.warnedDesc", { user: `<@${user.id}>`, reason }, lang)),
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
                new EmbedCorrect().setTitle(client.t("discord:warn-message.modlogTitle", {}, lang)).addFields(
                  {
                    name: client.t("discord:warn-message.userWarned", {}, lang),
                    value: `<@${user.id}>`,
                    inline: true,
                  },
                  {
                    name: client.t("discord:warn-message.warnedBy", {}, lang),
                    value: `<@${message.author.id}>`,
                    inline: true,
                  },
                  { name: client.t("discord:warn-message.warnedAt", {}, lang), value: `${warnTime}`, inline: true },
                  {
                    name: client.t("discord:warn-message.warnId", {}, lang),
                    value: `\`${data?.id || client.t("discord:warn-message.noId", {}, lang)}\``,
                    inline: true,
                  },
                  { name: client.t("discord:warn-message.warnReason", {}, lang), value: `\`\`\`${reason}\`\`\`` },
                ),
              ],
            });
          }
        }

        user
          .send({
            embeds: [
              new EmbedCorrect()
                .setTitle(client.t("discord:warn-message.dmTitle", { guild: message.guild.name }, lang))
                .addFields(
                  { name: client.t("discord:warn-message.warnedFor", {}, lang), value: `\`${reason}\``, inline: true },
                  { name: client.t("discord:warn-message.warnedAt", {}, lang), value: `${warnTime}`, inline: true },
                )
                .setColor("#2f3136"),
            ],
          })
          .catch(() => {
            (message.channel as TextChannel).send({
              embeds: [
                new ErrorEmbed()
                  .setTitle(client.t("discord:warn-message.dmFailedTitle", {}, lang))
                  .setDescription(client.t("discord:warn-message.dmFailedDesc", {}, lang)),
              ],
            });
          });
        break;
      }

      case "remove": {
        const warnId = args[1];
        if (!warnId) {
          return message.reply({
            embeds: [new ErrorEmbed().setDescription(client.t("discord:warn-message.noWarnId", {}, lang))],
          });
        }

        const data = await main.prisma.userWarn.findUnique({ where: { id: warnId } });

        if (!data) {
          return message.reply({
            embeds: [new ErrorEmbed().setDescription(client.t("discord:warn-message.notFound", { warnId }, lang))],
          });
        }

        await main.prisma.userWarn.delete({ where: { id: warnId } });

        message.reply({
          embeds: [
            new EmbedCorrect()
              .setTitle(client.t("discord:warn-message.removedTitle", {}, lang))
              .setDescription(client.t("discord:warn-message.removeDesc", { warnId }, lang)),
          ],
        });
        break;
      }
    }

    return;
  },
};

export default warnAdminCommand;
